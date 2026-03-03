import re

html_content = open("index.html").read()

html_content = html_content.replace('<div class="event-overlay-nav" id="overlay-nav">', '''
                <button class="event-reason-toggle" id="overlay-reason-toggle" onclick="toggleEventReason()" style="display:none; margin-bottom:10px;">📖 行情解析</button>
                <div class="event-reason-content" id="overlay-reason-content"></div>
                <div class="event-overlay-nav" id="overlay-nav">''')

with open("index.html", "w") as f:
    f.write(html_content)
print("done")
