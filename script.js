// State object to hold the current sentiment of each indicator
const sentimentState = {
    spx: 'neutral',
    vix: 'neutral',
    dxy: 'neutral',
    oil: 'neutral',
    gold: 'neutral',
    yield: 'neutral',
    btc: 'neutral',
    eth: 'neutral'
};

// Mapping of indicators to Yahoo Finance symbols
const symbolsMap = {
    spx: '^GSPC',  // S&P 500
    vix: '^VIX',
    dxy: 'DX-Y.NYB',
    oil: 'CL=F',   // Crude Oil Futures
    gold: 'GC=F',  // Gold Futures
    yield: '^TNX', // 10-Year Treasury Note Yield
    btc: 'BTC-USD',
    eth: 'ETH-USD'
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
 * Automatically judges the trend based on the daily change percentage.
 * @param {string} indicatorId - The ID of the indicator.
 * @param {number} changePercent - The percentage change from previous close.
 */
function autoJudgeTrend(indicatorId, changePercent) {
    let trend = 'neutral';
    let threshold = 0.3; // Default

    // Define thresholds based on the indicator type
    if (indicatorId === 'spx' || indicatorId === 'btc' || indicatorId === 'eth') {
        threshold = 0.5;
        if (changePercent > 0.5) trend = 'up';
        else if (changePercent < -0.5) trend = 'down';
    } else if (indicatorId === 'vix') {
        threshold = 3.0;
        if (changePercent > 3.0) trend = 'up';
        else if (changePercent < -3.0) trend = 'down';
    } else {
        // gold, oil, dxy, yield
        threshold = 0.3;
        if (changePercent > 0.3) trend = 'up';
        else if (changePercent < -0.3) trend = 'down';
    }

    // Update UI reason text
    const reasonDiv = document.getElementById(`reason-${indicatorId}`);
    if (reasonDiv) {
        const sign = changePercent > 0 ? '+' : '';
        const trendText = trend === 'up' ? '漲幅' : (trend === 'down' ? '跌幅' : '波動');

        let msg = `🤖 系統自動判定：日${trendText} ${sign}${changePercent.toFixed(2)}% `;
        if (trend !== 'neutral') {
            msg += `(觸發 ±${threshold}% 標準)`;
        } else {
            msg += `(未達 ±${threshold}% 標準)`;
        }
        reasonDiv.innerText = msg;
    }

    // Call setTrend programmatically.
    setTrend(indicatorId, trend);
}

/**
 * Sets the trend for an indicator and recalculates overall sentiment.
 * @param {string} indicatorId - The ID of the indicator.
 * @param {string} trend - 'up', 'neutral', or 'down'.
 */
function setTrend(indicatorId, trend) {
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

    // Evaluate Crypto (Liquidity / Risk-On sentiment)
    // BTC and ETH going up strongly suggests high market liquidity and risk appetite
    if (s.btc === 'up') riskOnScore += 1;
    if (s.btc === 'down') riskOffScore += 1;

    if (s.eth === 'up') riskOnScore += 0.5;
    if (s.eth === 'down') riskOffScore += 0.5;

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
 * Loads cached quote data from local storage.
 * @returns {object|null} Cached data object or null if none exists.
 */
function loadCache() {
    try {
        const cached = localStorage.getItem('marketDashCache');
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (e) {
        console.warn('Failed to load cache', e);
    }
    return null;
}

/**
 * Saves quote data to local storage.
 * @param {string} indicatorId - The ID of the indicator.
 * @param {object} data - The quote data to cache.
 */
function saveCache(indicatorId, data) {
    try {
        let cache = loadCache() || {};
        cache[indicatorId] = data;
        localStorage.setItem('marketDashCache', JSON.stringify(cache));
    } catch (e) {
        console.warn('Failed to save cache', e);
    }
}

/**
 * Updates the UI with fetched data and determines the trend.
 * @param {string} indicatorId - The ID of the indicator
 * @param {object} result - The parsed quote result from Yahoo Finance
 * @param {boolean} isInitialLoad - True if this is from local storage cache during page load.
 */
function processQuoteData(indicatorId, result, isInitialLoad = false) {
    if (!result || result.regularMarketPrice == null || result.regularMarketPreviousClose == null) {
        // Log to console but also ensure UI updates from skeleton loader
        console.warn(`[${indicatorId}] 暫無有效報價資料:`, result);
        const timeSpan = document.getElementById(`time-${indicatorId}`);
        if (timeSpan) {
            timeSpan.classList.remove('skeleton');
            timeSpan.innerHTML = `<span class="text-neutral">暫無報價</span>`;
        }
        return;
    }

    const currentPrice = result.regularMarketPrice;
    const prevClose = result.regularMarketPreviousClose;
    const timestamp = result.regularMarketTime;

    // 檢查快取是否有相同時間的資料，用於判斷是否需要觸發 UI 閃爍動畫
    const cache = loadCache();
    const isNewData = !isInitialLoad && (!cache || !cache[indicatorId] || cache[indicatorId].regularMarketTime !== timestamp);

    // Calculate percentage change
    const percentChange = ((currentPrice - prevClose) / prevClose) * 100;

    // Automatically judge and set the trend (will be ignored if user manually overrode)
    autoJudgeTrend(indicatorId, percentChange);

    // Update timestamp and price in UI
    const timeSpan = document.getElementById(`time-${indicatorId}`);
    if (timeSpan) {
        timeSpan.classList.remove('skeleton');
        const timeStr = formatTime(timestamp);
        const changeStr = percentChange > 0 ? `+${percentChange.toFixed(2)}%` : `${percentChange.toFixed(2)}%`;
        const colorClass = percentChange > 0 ? 'text-up' : (percentChange < 0 ? 'text-down' : 'text-neutral');

        timeSpan.innerHTML = `更新時間: ${timeStr} <span class="${colorClass}">(${changeStr})</span>`;

        // 如果是新抓到的資料（且不是第一次從快取讀取的），讓卡片邊框閃爍提示使用者
        if (isNewData) {
            const card = document.getElementById(`card-${indicatorId}`);
            if (card) {
                // 移除現有的 class 避免動畫無法重新觸發
                card.classList.remove('update-flash');
                // 使用 setTimeout 確保 DOM 更新後加上 class
                setTimeout(() => {
                    card.classList.add('update-flash');
                    // 3 秒後移除閃爍效果
                    setTimeout(() => card.classList.remove('update-flash'), 3000);
                }, 10);
            }

            // 儲存最新的資料到 LocalStorage
            saveCache(indicatorId, {
                regularMarketPrice: currentPrice,
                regularMarketPreviousClose: prevClose,
                regularMarketTime: timestamp
            });
        }
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

            // Extract the most reliable price data available
            // Note: Crypto and Yield symbols might not have regularMarketPrice or chartPreviousClose at certain times
            const price = resultData.regularMarketPrice !== undefined && resultData.regularMarketPrice !== null ? resultData.regularMarketPrice : (resultData.chartPreviousClose || resultData.previousClose);
            const prevClose = resultData.regularMarketPreviousClose !== undefined && resultData.regularMarketPreviousClose !== null ? resultData.regularMarketPreviousClose : (resultData.chartPreviousClose || resultData.previousClose);
            const time = resultData.regularMarketTime;

            // Format and process the data
            processQuoteData(indicatorId, {
                symbol: resultData.symbol,
                regularMarketPrice: price,
                regularMarketPreviousClose: prevClose,
                regularMarketTime: time
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
            const reasonDiv = document.getElementById(`reason-${indicatorId}`);
            if (reasonDiv) {
                reasonDiv.innerHTML = `<span class="text-neutral">❌ 系統無法取得即時報價，請檢查網路連線或稍後重試。</span>`;
            }
            return false; // Failed
        }
    }
}

/**
 * Fetches latest quotes for all indicators sequentially to avoid proxy rate limits.
 * @param {boolean} hideSkeleton - If true, do not show the skeleton loading (e.g., when cache is already shown).
 */
async function fetchLatestQuotes(hideSkeleton = false) {
    if (!hideSkeleton) {
        // Show skeleton loading indicators before fetching
        Object.keys(symbolsMap).forEach(indicatorId => {
            const timeSpan = document.getElementById(`time-${indicatorId}`);
            if (timeSpan) {
                timeSpan.classList.add('skeleton');
                timeSpan.innerHTML = `載入數據中...`; // Text won't be seen due to skeleton, but holds some width
            }
        });
    }

    const entries = Object.entries(symbolsMap);

    for (const [indicatorId, symbol] of entries) {
        // Fetch sequentially and await to avoid slamming the free proxy
        await fetchQuoteWithRetry(indicatorId, symbol);

        // Wait 500ms between each successful request to be nice to the proxy
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

/**
 * Opens a modal by its ID.
 * @param {string} modalId - The ID of the modal to open.
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

/**
 * Closes a modal by its ID.
 * @param {string} modalId - The ID of the modal to close.
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// Ensure global functions are exposed if needed
window.toggleDetails = toggleDetails;
window.setTrend = setTrend;
window.openModal = openModal;
window.closeModal = closeModal;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    console.log("Market Dashboard Initialized.");

    // --- 載入快取與初始化流程 ---
    const cache = loadCache();
    let hasCache = false;

    if (cache) {
        // 如果有快取，立刻將快取資料渲染到畫面上
        Object.keys(symbolsMap).forEach(indicatorId => {
            if (cache[indicatorId]) {
                processQuoteData(indicatorId, cache[indicatorId], true);
                hasCache = true;
            }
        });
    }

    // 若沒有快取（第一次進入網站），才自動抓取資料
    // 如果有快取，就等使用者手動按下更新按鈕
    if (!hasCache) {
        fetchLatestQuotes(false);
    }

    // 移除定時更新機制，改由手動觸發
    // setInterval(() => fetchLatestQuotes(true), 300000);

    // Close modal if user clicks outside of the modal content
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Handle Manual Refresh Button
    const refreshBtn = document.getElementById('refresh-btn');
    let lastRefreshTime = 0;
    const REFRESH_COOLDOWN_MS = 60000; // 60 seconds

    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            const now = Date.now();
            if (refreshBtn.disabled) return;

            // Check cooldown
            if (now - lastRefreshTime < REFRESH_COOLDOWN_MS) {
                const remainingSeconds = Math.ceil((REFRESH_COOLDOWN_MS - (now - lastRefreshTime)) / 1000);
                const originalHtml = refreshBtn.innerHTML;

                refreshBtn.innerHTML = `<i class="fas fa-hourglass-half"></i> 請等 ${remainingSeconds} 秒`;
                refreshBtn.style.opacity = '0.7';
                refreshBtn.disabled = true;

                setTimeout(() => {
                    refreshBtn.innerHTML = originalHtml;
                    refreshBtn.style.opacity = '1';
                    refreshBtn.disabled = false;
                }, 2000);
                return;
            }

            // Set loading state
            refreshBtn.disabled = true;
            refreshBtn.style.opacity = '0.7';
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> 更新中...';
            lastRefreshTime = now;

            try {
                // Fetch quotes asynchronously without waiting for them to finish before updating widgets
                // We use `.catch` to prevent unhandled promise rejections from stopping the rest of the flow
                fetchLatestQuotes(false).catch(e => console.error("Error fetching quotes during refresh:", e));

                // Re-render TradingView widgets to force them to fetch new data
                document.querySelectorAll('.tradingview-widget-container script').forEach(script => {
                    const parent = script.parentElement;
                    if (!parent) return;

                    // Keep the widget container but empty it
                    const widgetDiv = parent.querySelector('.tradingview-widget-container__widget');
                    if (widgetDiv) {
                        widgetDiv.innerHTML = '';
                    }

                    // Re-create script tag to trigger re-load
                    const newScript = document.createElement('script');
                    newScript.type = 'text/javascript';
                    newScript.src = script.src;
                    newScript.async = true;
                    newScript.innerHTML = script.innerHTML;

                    parent.removeChild(script);
                    parent.appendChild(newScript);
                });

                // Keep the loading state for at least 1.5 seconds so it doesn't flash too quickly
                await new Promise(resolve => setTimeout(resolve, 1500));

            } catch (err) {
                console.error("Error during manual refresh:", err);
            } finally {
                // Restore button state with success tick
                refreshBtn.innerHTML = '<i class="fas fa-check" style="color: var(--accent-safe);"></i> 已更新';

                setTimeout(() => {
                    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 重新整理';
                    refreshBtn.disabled = false;
                    refreshBtn.style.opacity = '1';
                }, 2000);
            }
        });
    }
});