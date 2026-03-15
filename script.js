// State object to hold the current sentiment of each indicator
const sentimentState = {
    vix: 'neutral',
    dxy: 'neutral',
    oil: 'neutral',
    gold: 'neutral',
    yield: 'neutral'
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
 */
function setTrend(indicatorId, trend) {
    // 1. Update visual state of buttons within the specific card
    const card = document.getElementById(`card-${indicatorId}`);
    const buttons = card.querySelectorAll('.trend-btn');

    buttons.forEach(btn => btn.classList.remove('active'));

    // Find the clicked button and add 'active' class
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

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Initialization logic if needed
    console.log("Market Dashboard Initialized.");
});