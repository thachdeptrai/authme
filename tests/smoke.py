"""Optional end-to-end browser smoke suite.

Requirements: pip install playwright && playwright install chromium
Start server: python -m http.server 8765
Run: python tests/smoke.py
"""
import os
from playwright.sync_api import sync_playwright

URL = os.environ.get("SITE_URL", "http://localhost:8765/")

def check(browser, name, viewport, mobile=False):
    context = browser.new_context(viewport=viewport, is_mobile=mobile, has_touch=mobile)
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    response = page.goto(URL, wait_until="domcontentloaded")
    assert response is not None and response.status == 200
    page.wait_for_timeout(500)
    assert page.locator("h1").count() == 1
    assert page.locator(".project-card").count() == 4
    assert page.locator(".world-canvas").count() == 1
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2")
    assert not errors, errors
    page.locator("#light-switch").click()
    assert page.locator("body").get_attribute("data-sky") == "lavender"
    if mobile:
        page.locator("#menu-trigger").click()
        assert page.locator("#menu-trigger").get_attribute("aria-expanded") == "true"
        page.locator('.mobile-menu a[href="#about"]').click()
        assert page.locator("#menu-trigger").get_attribute("aria-expanded") == "false"
    card = page.locator(".project-card").first
    card.scroll_into_view_if_needed()
    card.click()
    assert page.locator("dialog").is_visible()
    page.locator(".dialog-close").click()
    assert not page.locator("dialog").is_visible()
    assert page.locator(".contact-pill").get_attribute("href").startswith("mailto:")
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 2")
    print("PASS:", name)
    context.close()

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        check(browser, "desktop", {"width": 1440, "height": 900})
        check(browser, "tablet", {"width": 768, "height": 1024})
        check(browser, "mobile", {"width": 390, "height": 844}, True)
        browser.close()
