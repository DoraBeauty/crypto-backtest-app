import re

html_content = open("index.html").read()

# 1. CSS changes
css_to_add = """
        .event-reason-toggle {
            margin-top: 10px;
            padding: 5px 10px;
            background-color: #2962FF;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            width: 100%;
            transition: background-color 0.2s;
        }
        .event-reason-toggle:hover {
            background-color: #1E4DCC;
        }
        .event-reason-content {
            display: none;
            margin-top: 10px;
            padding: 10px;
            background-color: rgba(41, 98, 255, 0.1);
            border: 1px solid rgba(41, 98, 255, 0.3);
            border-radius: 6px;
            font-size: 13px;
            color: #d1d4dc;
            text-align: left;
            line-height: 1.5;
            max-width: 250px;
            word-wrap: break-word;
        }
        .event-reason-content.active {
            display: block;
        }
"""
html_content = html_content.replace('/* Event Overlay Styles */', css_to_add + '\n        /* Event Overlay Styles */')

# 2. HTML changes in body
html_card = """
            <div class="event-overlay-card">
                <button class="event-overlay-close-btn" onclick="closeEventCard(event)">×</button>
                <div class="event-overlay-title" id="overlay-title">事件名稱</div>
                <div class="event-overlay-date" id="overlay-date">2023-01-01</div>
                <div class="event-overlay-change" id="overlay-change">7天後: +5.00%</div>
                <div class="event-overlay-stats" id="overlay-candle-stats"></div>
                <button class="event-reason-toggle" id="overlay-reason-toggle" onclick="toggleEventReason()">📖 行情解析</button>
                <div class="event-reason-content" id="overlay-reason-content"></div>
                <div class="event-overlay-nav" id="overlay-nav"></div>
            </div>"""

html_content = re.sub(r'<div class="event-overlay-card">.*?<div class="event-overlay-nav" id="overlay-nav"></div>\n            </div>', html_card, html_content, flags=re.DOTALL)

# 3. JS changes
js_logic = """
            if (event.reason) {
                document.getElementById('overlay-reason-content').innerText = event.reason;
                document.getElementById('overlay-reason-toggle').style.display = 'block';
                // Reset to hidden on new event
                document.getElementById('overlay-reason-content').classList.remove('active');
            } else {
                document.getElementById('overlay-reason-toggle').style.display = 'none';
                document.getElementById('overlay-reason-content').classList.remove('active');
            }

            // Timeline Navigation Logic"""

html_content = html_content.replace('// Timeline Navigation Logic', js_logic)

toggle_function = """
        function toggleEventReason() {
            const content = document.getElementById('overlay-reason-content');
            content.classList.toggle('active');
        }

        // --- Init ---"""

html_content = html_content.replace('// --- Init ---', toggle_function)

# Prevent drag on reason toggle and reason content
html_content = html_content.replace("if (e.target.closest('.event-overlay-close-btn') || e.target.closest('.event-overlay-nav')) return;", "if (e.target.closest('.event-overlay-close-btn') || e.target.closest('.event-overlay-nav') || e.target.closest('.event-reason-toggle') || e.target.closest('.event-reason-content')) return;")

with open("index.html", "w") as f:
    f.write(html_content)

print("UI patched successfully")
