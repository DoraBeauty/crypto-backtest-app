import sys
import http.server
import socketserver
import threading
from playwright.sync_api import sync_playwright
import time

PORT = 8006
Handler = http.server.SimpleHTTPRequestHandler

def serve_app():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

server_thread = threading.Thread(target=serve_app, daemon=True)
server_thread.start()
time.sleep(2)

def test_reason_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        page.goto(f"http://localhost:{PORT}/index.html")
        page.wait_for_timeout(3000)

        # Open the category select and pick the first option
        page.select_option("#event-category-select", index=1)
        page.wait_for_timeout(1000)

        # Click the first event button rendered in #event-buttons
        btns = page.locator("#event-buttons .control-btn").filter(has_not_text="全貌視角")
        if btns.count() > 0:
            btns.nth(0).click()
            page.wait_for_timeout(2000) # Wait for jump

            # Use JS to trigger the click just in case
            page.evaluate("document.getElementById('overlay-reason-toggle').click()")
            page.wait_for_timeout(1000)
            page.screenshot(path="/home/jules/verification/reason_ui_after_toggle2.png")
            print("Successfully captured reason toggle UI using JS click")

        else:
            print("No event buttons found")
            sys.exit(1)

        browser.close()

if __name__ == "__main__":
    test_reason_ui()
