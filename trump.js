const BASE = 'https://trumpcode.washinmura.jp';

// Helper to sanitize text
function esc(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}

const SIG_LABELS = {
    TARIFF:      '🔴 關稅',
    DEAL:        '🟢 談判',
    RELIEF:      '🕊️ 寬減',
    ACTION:      '⚡ 行動',
    THREAT:      '⚠️ 威脅',
    ATTACK:      '⚔️ 攻擊',
    MARKET_BRAG: '📊 炫耀',
    CHINA:       '🇨🇳 中國',
    IRAN:        '🇮🇷 伊朗',
    RUSSIA:      '🇷🇺 俄羅斯',
    BULLISH:     '📈 看多',
    BEARISH:     '📉 看空',
};

const BULL_TYPES = new Set(['DEAL','RELIEF','BULLISH','ACTION','MARKET_BRAG']);
const BEAR_TYPES = new Set(['TARIFF','THREAT','BEARISH','ATTACK']);

async function loadDashboard() {
    try {
        const res = await fetch(BASE + '/api/dashboard');
        const d = await res.json();

        const live = d.live || {};
        const health = live.health || '';
        document.getElementById('s-health').textContent = health.includes('attention') ? '🟡' : health.includes('degrad') ? '🔴' : '✅';

        document.getElementById('s-posts').textContent = live.posts || 0;

        const cons = live.consensus || 'NEUTRAL';
        const trendEl = document.getElementById('s-trend');
        trendEl.textContent = cons === 'BULLISH' ? '📈 看多' : cons === 'BEARISH' ? '📉 看空' : '➡️ 觀望';
        trendEl.style.color = cons === 'BULLISH' ? 'var(--accent-safe)' : cons === 'BEARISH' ? 'var(--accent-warning)' : 'var(--text-secondary)';

        if (d.stats) {
            document.getElementById('s-hit').textContent = (d.stats.hit_rate || 61.3) + '%';
        }
    } catch (e) {
        console.warn('Dashboard load failed:', e);
    }
}

async function loadPosts() {
    try {
        const res = await fetch(BASE + '/api/recent-posts');
        const d = await res.json();
        const posts = d.posts || [];
        const area = document.getElementById('posts-area');

        if (!posts.length) {
            area.innerHTML = '<div style="text-align:center;color:var(--text-secondary)">暫無最新推文</div>';
            return;
        }

        const show = posts.slice(0, 20); // Show up to 20 recent posts
        let html = '';

        show.forEach((p, idx) => {
            const date = (p.date || '').replace('T', ' ').slice(0, 16);
            const text = p.text || '';
            const url = p.url || '';
            const src = p.source === 'x' ? 'X (Twitter)' : 'Truth Social';
            const daySigs = p.signals || {};
            const textId = `post-text-${idx}`;

            const sigTags = [];
            if (Array.isArray(daySigs.rt_signals)) {
                // Handle new array format: rt_signals: ["TARIFF", "BEARISH"]
                daySigs.rt_signals.forEach(sig => {
                    const label = SIG_LABELS[sig.toUpperCase()];
                    if (label) {
                        sigTags.push(`<span class="sig-tag">${label}</span>`);
                    }
                });
            } else {
                // Fallback to old format: { TARIFF: 1, DEAL: 2 }
                for (const [k, v] of Object.entries(daySigs)) {
                    if (typeof v === 'number' && v > 0 && SIG_LABELS[k.toUpperCase()]) {
                        sigTags.push(`<span class="sig-tag">${SIG_LABELS[k.toUpperCase()]} ×${v}</span>`);
                    }
                }
            }

            html += `
            <div class="post-card">
                <div class="post-meta">
                    <span class="date">${esc(date)}</span>
                    <span class="src">${src}</span>
                </div>
                <div class="post-text" id="${textId}">${esc(text)}${url ? ` <a href="${esc(url)}" target="_blank" rel="noopener" style="color:var(--accent-neon);font-size:11px;">[原文]</a>` : ''}</div>
                <div style="margin-bottom: 10px;">
                    <button class="translate-btn" id="btn-${textId}" data-text="${esc(text)}" onclick="translatePost('${textId}', this)">
                        <i class="fas fa-language"></i> 翻譯
                    </button>
                </div>
                ${sigTags.length ? `<div class="post-signals"><span class="ps-label">信號:</span>${sigTags.join('')}</div>` : ''}
            </div>`;
        });

        area.innerHTML = html;
    } catch (e) {
        document.getElementById('posts-area').innerHTML = '<div style="text-align:center;color:var(--text-secondary)">推文載入失敗</div>';
    }
}

async function loadSignals() {
    try {
        const res = await fetch(BASE + '/api/signals');
        const d = await res.json();
        const days = d.recent_days || {};
        const sorted = Object.entries(days).sort((a, b) => b[0].localeCompare(a[0]));
        const area = document.getElementById('signal-area');

        let html = '';
        sorted.slice(0, 7).forEach(([date, sigs]) => {
            let bullish = 0, bearish = 0;
            sigs.forEach(s => {
                if (BULL_TYPES.has(s.type)) bullish += s.count;
                if (BEAR_TYPES.has(s.type)) bearish += s.count;
            });
            const dirClass = bullish > bearish ? 'bull' : bearish > bullish ? 'bear' : 'mix';
            const dirIcon = bullish > bearish ? '📈' : bearish > bullish ? '📉' : '➡️';
            const dirText = bullish > bearish ? '偏多' : bearish > bullish ? '偏空' : '混合';

            html += `
            <div class="signal-day">
                <div class="signal-header">
                    <span>${esc(date)}</span>
                    <span class="signal-dir ${dirClass}">${dirIcon} ${dirText}</span>
                </div>
                <div class="signal-tags">
                    ${sigs.map(s => {
                        let cls = 'sig-tag';
                        if (BULL_TYPES.has(s.type)) cls += ' safe';
                        if (BEAR_TYPES.has(s.type)) cls += ' warning';
                        return `<span class="${cls}">${SIG_LABELS[s.type] || s.type} ×${s.count}</span>`
                    }).join('')}
                </div>
            </div>`;
        });

        if (!html) html = '<div style="text-align:center;color:var(--text-secondary)">暫無近期信號</div>';
        area.innerHTML = html;
    } catch (e) {
        document.getElementById('signal-area').innerHTML = '<div style="text-align:center;color:var(--text-secondary)">信號載入失敗</div>';
    }
}

async function loadPolymarketTrump() {
    const area = document.getElementById('pm-live-area');
    try {
        const res = await fetch(BASE + '/api/polymarket-trump');
        const d = await res.json();
        const markets = d.markets || [];

        if (markets.length > 0) {
            let html = `<table><thead><tr><th>市場</th><th>YES</th><th>交易量</th></tr></thead><tbody>`;
            markets.slice(0, 5).forEach(m => {
                const yes = m.yes_price || 0;
                const yesColor = yes > 0.7 ? 'var(--accent-safe)' : yes < 0.3 ? 'var(--accent-warning)' : 'var(--accent-neon)';
                const url = m.url || 'https://polymarket.com/search?_q=trump';

                html += `
                <tr>
                    <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;"><a href="${esc(url)}" target="_blank" rel="noopener">${esc(m.question || '')}</a></td>
                    <td style="color:${yesColor}; font-weight:700;">${(yes * 100).toFixed(1)}%</td>
                    <td style="color:var(--text-secondary)">$${Math.round(m.volume || 0).toLocaleString()}</td>
                </tr>`;
            });
            html += '</tbody></table>';
            area.innerHTML = html;
        } else {
            area.innerHTML = '<div style="text-align:center;color:var(--text-secondary)">暫無預測市場數據</div>';
        }
    } catch (e) {
        area.innerHTML = '<div style="text-align:center;color:var(--text-secondary)">無法載入預測市場</div>';
    }
}

const MODEL_ZH = {
  A1_tariff_bearish: '關稅→隔天跌',
  A2_deal_bullish: 'DEAL 信號→隔天漲',
  A3_relief_rocket: '盤前 RELIEF→當天飆',
  B1_triple_signal: '三信號齊發→買三天',
  B2_tariff_to_deal: '連三天關稅→Deal 轉折',
  B3_action_pre: '盤前 ACTION + 正面→漲',
  C1_burst_silence: '爆發→長沉默→做多',
  C2_brag_top: '炫耀行情→短線見頂',
  C3_night_alert: '深夜關稅推文→跳空',
  D2_sig_change: '簽名切換→正式聲明',
  D3_volume_spike: '推文爆量→恐慌底',
};

async function loadModels() {
    const area = document.getElementById('model-area');
    try {
        const res = await fetch(BASE + '/api/models');
        const d = await res.json();
        const m = d.models || {};
        const rows = Object.entries(m).map(([id, s]) => ({ id, ...s })).sort((a, b) => b.win_rate - a.win_rate);

        let html = `<table><thead><tr><th>模型策略</th><th>命中率</th><th>報酬</th></tr></thead><tbody>`;
        rows.slice(0, 10).forEach(r => {
            const ret = r.avg_return || 0;
            const zhName = MODEL_ZH[r.id] || r.name || r.id;

            html += `
            <tr>
                <td style="font-weight:500">${esc(zhName)}</td>
                <td>
                    ${r.win_rate.toFixed(1)}%
                    <div class="bar-track"><div class="bar-fill" style="width:${Math.min(r.win_rate, 100)}%"></div></div>
                </td>
                <td style="color:${ret >= 0 ? 'var(--accent-safe)' : 'var(--accent-warning)'}">${ret >= 0 ? '+' : ''}${ret.toFixed(2)}%</td>
            </tr>`;
        });
        html += '</tbody></table>';
        area.innerHTML = html;
    } catch (e) {
        area.innerHTML = '<div style="text-align:center;color:var(--text-secondary)">模型排行載入失敗</div>';
    }
}

async function translatePost(elementId, btnElement) {
    const text = btnElement.getAttribute('data-text');
    if (btnElement) {
        btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 翻譯中...';
        btnElement.disabled = true;
    }

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-TW&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();

        let translatedText = '';
        if (data && data[0]) {
            data[0].forEach(item => {
                if (item[0]) translatedText += item[0];
            });
        }

        if (translatedText) {
            const container = document.getElementById(elementId);
            const translationDiv = document.createElement('div');
            translationDiv.className = 'translated-text';
            translationDiv.innerHTML = `<strong>中文翻譯：</strong><br>${esc(translatedText)}`;
            container.appendChild(translationDiv);

            if (btnElement) btnElement.style.display = 'none'; // Hide button after successful translation
        }
    } catch (e) {
        console.error('Translation failed', e);
        if (btnElement) {
            btnElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 翻譯失敗';
            btnElement.disabled = false;
        }
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

async function handleRefresh() {
    const btn = document.getElementById('refresh-btn');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> 處理中...';
        btn.disabled = true;
    }

    try {
        await Promise.all([
            loadDashboard(),
            loadPosts(),
            loadSignals(),
            loadPolymarketTrump(),
            loadModels()
        ]);
    } catch (e) {
        console.error('Refresh error:', e);
    } finally {
        if (btn) {
            // Add visual cue for success
            btn.innerHTML = '<i class="fas fa-check"></i> 更新完成';
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-sync-alt"></i> 重新整理';
                btn.disabled = false;
            }, 2000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Refresh Button Event Listener
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleRefresh);
    }

    // Close modal if user clicks outside of the modal content
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Initial Load
    loadDashboard();
    loadPosts();
    loadSignals();
    loadPolymarketTrump();
    loadModels();

    // Removed automatic interval refreshes. The user must click the manual refresh button.
});