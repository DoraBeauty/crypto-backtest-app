// State object to hold the current sentiment of each indicator
const sentimentState = {
    spx: 'neutral',
    vix: 'neutral',
    dxy: 'neutral',
    oil: 'neutral',
    gold: 'neutral',
    yield: 'neutral'
};

// Track whether the user has manually overridden the trend for a specific indicator
const manualOverrideState = {
    spx: false,
    vix: false,
    dxy: false,
    oil: false,
    gold: false,
    yield: false
};

// Mapping of indicators to Yahoo Finance symbols
const symbolsMap = {
    spx: '^GSPC',  // S&P 500
    vix: '^VIX',
    dxy: 'DX-Y.NYB',
    oil: 'CL=F',   // Crude Oil Futures
    gold: 'GC=F',  // Gold Futures
    yield: '^TNX'  // 10-Year Treasury Note Yield
};

/**
 * Toggles the visibility of the details section for a given indicator card.
 * @param {string} indicatorId - The ID of the indicator (e.g., 'vix', 'dxy').
 */
function toggleDetails(indicatorId) {
    const detailsDiv = document.getElementById(`details-${indicatorId}`);
    const toggleBtn = document.querySelector(`#card-${indicatorId} .toggle-btn`);
    const isExpanded = detailsDiv.classList.contains('active');

    if (isExpanded) {
        detailsDiv.classList.remove('active');
        toggleBtn.classList.remove('rotate-180');
    } else {
        detailsDiv.classList.add('active');
        toggleBtn.classList.add('rotate-180');
    }
}

/**
 * Sets the trend for an indicator and recalculates overall sentiment.
 * @param {string} indicatorId - The ID of the indicator.
 * @param {string} trend - 'up', 'neutral', or 'down'.
 * @param {boolean} isManual - Whether the change was triggered manually by the user.
 */
function setTrend(indicatorId, trend, isManual = true) {
    // If it's an auto-update but the user has already manually overridden it, ignore the auto-update
    if (!isManual && manualOverrideState[indicatorId]) {
        return;
    }

    if (isManual) {
        manualOverrideState[indicatorId] = true;
    }

    // 1. Update visual state of buttons within the specific card
    const card = document.getElementById(`card-${indicatorId}`);
    const buttons = card.querySelectorAll('.trend-btn');

    buttons.forEach(btn => btn.classList.remove('active'));

    // Find the clicked/target button and add 'active' class
    const selectedBtn = card.querySelector(`.trend-btn.${trend}`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }

    // 2. Update global state object
    sentimentState[indicatorId] = trend;

    // 3. Recalculate overall sentiment based on the new state
    calculateOverallSentiment();
}

/**
 * Analyzes the combined states of the indicators to provide a market sentiment reading.
 * Based on user's exact logic:
 * Risk Off: SPX down + Gold up / VIX up / DXY up / Yield up
 * Risk On: VIX down + DXY down + Yield down
 * Inflation fears: SPX up + Gold up
 */
function calculateOverallSentiment() {
    let riskOffScore = 0;
    let riskOnScore = 0;
    let neutralCount = 0;
    let isInflationFear = false;
    let isDirectSafeHaven = false;

    const s = sentimentState;

    // Check specific specific combinations requested by user
    if (s.spx === 'down' && s.gold === 'up') {
        isDirectSafeHaven = true;
    }
    if (s.spx === 'up' && s.gold === 'up') {
        isInflationFear = true;
    }

    // SPX is the primary directional indicator
    if (s.spx === 'down') riskOffScore += 1;
    if (s.spx === 'up') riskOnScore += 1;

    // Evaluate Risk-Off (Stress) signals
    if (s.vix === 'up') riskOffScore += 2; // VIX is a primary fear gauge
    if (s.vix === 'down') riskOnScore += 2;

    if (s.dxy === 'up') riskOffScore += 1.5;
    if (s.dxy === 'down') riskOnScore += 1.5;

    if (s.gold === 'up') riskOffScore += 1; // General uncertainty
    if (s.gold === 'down') riskOnScore += 1;

    if (s.yield === 'up') riskOffScore += 1.5; // Yield up: higher cost
    if (s.yield === 'down') riskOnScore += 1.5; // Yield down: lower cost

    // Oil weight reduced as it's an ambiguous signal (can be demand or supply shock)
    if (s.oil === 'up') riskOffScore += 0.5;
    if (s.oil === 'down') riskOnScore += 0.5;

    Object.values(s).forEach(state => {
        if (state === 'neutral') neutralCount++;
    });

    // Update UI based on scores
    updateDashboardUI(riskOffScore, riskOnScore, neutralCount, isInflationFear, isDirectSafeHaven);
}

/**
 * Updates the top dashboard UI with the calculated sentiment.
 */
function updateDashboardUI(riskOff, riskOn, neutralCount, isInflationFear, isDirectSafeHaven) {
    const sentimentPanel = document.querySelector('.sentiment-panel');
    const valueEl = document.getElementById('sentiment-value');
    const descEl = document.getElementById('sentiment-desc');
    const iconEl = document.querySelector('.status-icon i');

    // Reset classes
    sentimentPanel.classList.remove('warning', 'safe', 'mixed');

    // 1. Direct clear combinations first
    if (isDirectSafeHaven) {
        sentimentPanel.classList.add('warning');
        valueEl.textContent = '避險情緒強烈 (資金逃離)';
        descEl.innerHTML = '⚠️ <strong>警示訊號：</strong> 股市下跌 + 黃金上漲，幾乎可以確定資金正在往避險資產移動 (金融風險、地緣衝突、貨幣疑慮)。留意股市下行風險。';
        iconEl.className = 'fas fa-shield-alt';
    } else if (isInflationFear) {
        sentimentPanel.classList.add('warning'); // It's a type of warning even if stocks are up
        valueEl.textContent = '通膨/貨幣疑慮 (資金佈局)';
        descEl.innerHTML = '🔥 <strong>特殊訊號：</strong> 股市上漲 + 黃金上漲，代表市場可能正在提前佈局通膨，或者對貨幣價值產生疑慮。';
        iconEl.className = 'fas fa-fire-alt';
    }
    // 2. Score-based overall direction
    else if (riskOff >= riskOn + 2.5) {
        // Strong Risk-Off / Stress
        sentimentPanel.classList.add('warning');
        valueEl.textContent = '流動性收縮 (避險升溫)';
        descEl.innerHTML = '⚠️ <strong>收縮訊號：</strong> 市場壓力正在增加。美元走強或殖利率飆升可能正在提高資金成本，請留意股市壓力。';
        iconEl.className = 'fas fa-exclamation-triangle';
    } else if (riskOn >= riskOff + 2.5) {
        // Strong Risk-On / Expansion
        sentimentPanel.classList.add('safe');
        valueEl.textContent = '風險偏好上升 (多頭環境)';
        descEl.innerHTML = '🟢 <strong>擴張訊號：</strong> 資金成本與壓力下降。VIX 低檔且美元/殖利率偏弱，資金更願意承擔風險，有利於股市發展。';
        iconEl.className = 'fas fa-chart-line';
    }
    // 3. Mixed / Neutral
    else {
        sentimentPanel.classList.add('mixed');
        valueEl.textContent = '訊號尚未同步 (盤整待變)';
        descEl.innerHTML = '目前各項指標方向分歧。<strong>「在沒有出現關鍵長黑之前，與其急著做方向，不如耐心等市場自己說話。」</strong>';
        iconEl.className = 'fas fa-balance-scale';
    }
}

/**
 * Formats a Unix timestamp into a readable local time string.
 * @param {number} unixTime - Timestamp in seconds
 * @returns {string} Formatted time string
 */
function formatTime(unixTime) {
    if (!unixTime) return '';
    const date = new Date(unixTime * 1000);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

/**
 * Updates the UI with fetched data and determines the trend.
 * @param {string} indicatorId - The ID of the indicator
 * @param {object} result - The parsed quote result from Yahoo Finance
 */
function processQuoteData(indicatorId, result) {
    if (!result || !result.regularMarketPrice || !result.regularMarketPreviousClose) return;

    const currentPrice = result.regularMarketPrice;
    const prevClose = result.regularMarketPreviousClose;
    const timestamp = result.regularMarketTime;

    // Calculate percentage change
    const percentChange = ((currentPrice - prevClose) / prevClose) * 100;

    // Determine trend (threshold ±0.5%)
    let autoTrend = 'neutral';
    if (percentChange > 0.5) {
        autoTrend = 'up';
    } else if (percentChange < -0.5) {
        autoTrend = 'down';
    }

    // Update trend (will be ignored if user manually overrode)
    setTrend(indicatorId, autoTrend, false);

    // Update timestamp and price in UI
    const timeSpan = document.getElementById(`time-${indicatorId}`);
    if (timeSpan) {
        timeSpan.classList.remove('skeleton');
        const timeStr = formatTime(timestamp);
        const changeStr = percentChange > 0 ? `+${percentChange.toFixed(2)}%` : `${percentChange.toFixed(2)}%`;
        const colorClass = percentChange > 0 ? 'text-up' : (percentChange < 0 ? 'text-down' : 'text-neutral');

        timeSpan.innerHTML = `更新時間: ${timeStr} <span class="${colorClass}">(${changeStr})</span>`;
    }
}

/**
 * Fetches a single quote with retry logic and delays to prevent rate limiting from the free CORS proxy.
 * @param {string} indicatorId - The ID of the indicator
 * @param {string} symbol - The Yahoo Finance symbol
 * @param {number} retries - Number of retry attempts left
 */
async function fetchQuoteWithRetry(indicatorId, symbol, retries = 3) {
    const yfUrl = encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
    const apiUrl = `https://api.allorigins.win/get?url=${yfUrl}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Network response was not ok for ${symbol}`);

        const responseData = await response.json();

        if (!responseData.contents) {
            throw new Error(`No contents found for ${symbol}`);
        }

        let parsedData;
        try {
            parsedData = JSON.parse(responseData.contents);
        } catch (e) {
            throw new Error(`Failed to parse JSON for ${symbol}. Proxy returned: ${responseData.contents.substring(0, 50)}`);
        }

        if (parsedData && parsedData.chart && parsedData.chart.result && parsedData.chart.result.length > 0) {
            const resultData = parsedData.chart.result[0].meta;

            // Format and process the data
            processQuoteData(indicatorId, {
                symbol: resultData.symbol,
                regularMarketPrice: resultData.regularMarketPrice,
                regularMarketPreviousClose: resultData.chartPreviousClose,
                regularMarketTime: resultData.regularMarketTime
            });
            return true; // Success
        }
        throw new Error(`Invalid data format for ${symbol}`);
    } catch (err) {
        console.error(`Error fetching data for ${symbol} (Retries left: ${retries}):`, err.message);

        if (retries > 0) {
            // Wait 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchQuoteWithRetry(indicatorId, symbol, retries - 1);
        } else {
            // Out of retries, show error on UI
            const timeSpan = document.getElementById(`time-${indicatorId}`);
            if (timeSpan) {
                timeSpan.classList.remove('skeleton');
                timeSpan.innerHTML = `<span class="text-neutral">無法載入數據，請稍後再試</span>`;
            }
            return false; // Failed
        }
    }
}

/**
 * Fetches latest quotes for all indicators sequentially to avoid proxy rate limits.
 */
async function fetchLatestQuotes() {
    // Show skeleton loading indicators before fetching
    Object.keys(symbolsMap).forEach(indicatorId => {
        const timeSpan = document.getElementById(`time-${indicatorId}`);
        if (timeSpan) {
            timeSpan.classList.add('skeleton');
            timeSpan.innerHTML = `載入數據中...`; // Text won't be seen due to skeleton, but holds some width
        }
    });

    const entries = Object.entries(symbolsMap);

    for (const [indicatorId, symbol] of entries) {
        // Fetch sequentially and await to avoid slamming the free proxy
        await fetchQuoteWithRetry(indicatorId, symbol);

        // Wait 500ms between each successful request to be nice to the proxy
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Ensure global functions are exposed if needed
window.toggleDetails = toggleDetails;
window.setTrend = setTrend;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    console.log("Market Dashboard Initialized.");

    // Bind click events explicitly for trend buttons to pass isManual=true
    document.querySelectorAll('.trend-btn').forEach(btn => {
        // Remove standard onclick attributes in HTML to avoid double firing
        btn.removeAttribute('onclick');

        btn.addEventListener('click', function() {
            // Find parent card to get indicator ID
            const card = this.closest('.indicator-card');
            const indicatorId = card.id.replace('card-', '');

            // Determine trend from class
            let trend = 'neutral';
            if (this.classList.contains('up')) trend = 'up';
            else if (this.classList.contains('down')) trend = 'down';

            setTrend(indicatorId, trend, true);
        });
    });

    // Initial fetch
    fetchLatestQuotes();

    // Set up interval for every 5 minutes (300,000 ms)
    setInterval(fetchLatestQuotes, 300000);
});