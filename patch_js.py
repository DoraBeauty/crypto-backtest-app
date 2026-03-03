import re

html_content = open("index.html").read()

js_addition = """
        function toggleEventReason() {
            const content = document.getElementById('overlay-reason-content');
            content.classList.toggle('active');
        }
"""

if "function toggleEventReason" not in html_content:
    html_content = html_content.replace('// --- Init ---', js_addition + '\n        // --- Init ---')

if "document.getElementById('overlay-reason-content')" not in html_content:
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


# Prevent drag on reason toggle and reason content
if "e.target.closest('.event-reason-toggle')" not in html_content:
    html_content = html_content.replace(
        "if (e.target.closest('.event-overlay-close-btn') || e.target.closest('.event-overlay-nav')) return;",
        "if (e.target.closest('.event-overlay-close-btn') || e.target.closest('.event-overlay-nav') || e.target.closest('.event-reason-toggle') || e.target.closest('.event-reason-content')) return;"
    )

with open("index.html", "w") as f:
    f.write(html_content)

print("JS patched")
