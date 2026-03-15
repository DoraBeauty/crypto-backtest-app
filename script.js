// State object to hold the current sentiment of each indicator
const sentimentState = {
    vix: 'neutral',
    dxy: 'neutral',
    oil: 'neutral',
    gold: 'neutral',
    yield: 'neutral'
};

// Track whether the user has manually overridden the trend for a specific indicator
const manualOverrideState = {
    vix: false,
    dxy: false,
    oil: false,
    gold: false,
    yield: false
};

// Mapping of indicators to Yahoo Finance symbols
const symbolsMap = {
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
 * Analyzes the combined states of the 5 indicators to provide a market sentiment reading.
 * Based on the user's logic:
 * VIX up + Gold up + Yield up = Stress/Risk Off
 * DXY down + Yield down + VIX down = Risk On / Liquidity Expansion
 */
function calculateOverallSentiment() {
    let riskOffScore = 0;
    let riskOnScore = 0;
    let neutralCount = 0;

    const states = Object.values(sentimentState);

    // Evaluate Risk-Off (Stress) signals
    // Usually, VIX Up, DXY Up, Gold Up, Yield Up (too fast), Oil Up (supply shock) are risk-off or inflation fears.
    // We treat "Up" generally as a stress factor in this simplified model based on user text.
    if (sentimentState.vix === 'up') riskOffScore += 2; // VIX is a primary fear gauge
    if (sentimentState.vix === 'down') riskOnScore += 2;

    if (sentimentState.dxy === 'up') riskOffScore += 1;
    if (sentimentState.dxy === 'down') riskOnScore += 1;

    if (sentimentState.gold === 'up') riskOffScore += 1.5; // Gold up usually means uncertainty
    if (sentimentState.gold === 'down') riskOnScore += 1; // Risk preference

    if (sentimentState.yield === 'up') riskOffScore += 1; // Yield up: higher cost
    if (sentimentState.yield === 'down') riskOnScore += 1.5; // Yield down: lower cost

    if (sentimentState.oil === 'up') riskOffScore += 1; // Oil up: inflation/cost pressure
    if (sentimentState.oil === 'down') riskOnScore += 1; // Oil down: demand worry OR lower inflation

    states.forEach(state => {
        if (state === 'neutral') neutralCount++;
    });

    // Update UI based on scores
    updateDashboardUI(riskOffScore, riskOnScore, neutralCount);
}

/**
 * Updates the top dashboard UI with the calculated sentiment.
 */
function updateDashboardUI(riskOff, riskOn, neutralCount) {
    const sentimentPanel = document.querySelector('.sentiment-panel');
    const valueEl = document.getElementById('sentiment-value');
    const descEl = document.getElementById('sentiment-desc');
    const iconEl = document.querySelector('.status-icon i');

    // Reset classes
    sentimentPanel.classList.remove('warning', 'safe', 'mixed');

    if (neutralCount >= 4) {
        // Mostly neutral
        sentimentPanel.classList.add('mixed');
        valueEl.textContent = '方向不明確 (盤整待變)';
        descEl.innerHTML = '多數指標處於震盪。如你所述：「在沒有出現關鍵長黑前，與其急著做方向，不如耐心等市場自己說話。」';
        iconEl.className = 'fas fa-balance-scale';
    } else if (riskOff > riskOn + 1) {
        // Strong Risk-Off / Stress
        sentimentPanel.classList.add('warning');
        valueEl.textContent = '避險情緒升溫 (資金收縮)';
        descEl.innerHTML = '⚠️ <strong>警示訊號：</strong> 市場壓力正在增加。若 VIX 與黃金同步上漲，資金正流向避險資產，留意股市下行風險。';
        iconEl.className = 'fas fa-exclamation-triangle';
    } else if (riskOn > riskOff + 1) {
        // Strong Risk-On / Expansion
        sentimentPanel.classList.add('safe');
        valueEl.textContent = '風險偏好上升 (多頭環境)';
        descEl.innerHTML = '🟢 <strong>擴張訊號：</strong> 資金成本與壓力下降。VIX 低檔且美元偏弱，資金更願意承擔風險，有利於股市與商品發展。';
        iconEl.className = 'fas fa-chart-line';
    } else {
        // Mixed signals
        sentimentPanel.classList.add('mixed');
        valueEl.textContent = '訊號分歧 (多空交戰)';
        descEl.innerHTML = '目前各項指標方向並未完全同步。請注意：<strong>「只要這些指標開始朝同一個方向移動，行情往往就會走得很乾脆。」</strong> 持續觀察。';
        iconEl.className = 'fas fa-random';
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