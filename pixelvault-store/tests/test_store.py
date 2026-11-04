import re
from playwright.sync_api import Page, expect

def test_page_loads(page: Page):
    # Load localhost on react's default port
    page.goto("http://127.0.0.1:5173")

    # Verify the page displays as desired
    expect (
        page.get_by_role("link", name="PIXELVAULT")
        .or_(page.get_by_role("button", name="Pause"))
        .first
    ).to_be_visible()
    
"""
    Commands to run this test:
        pytest codegen | to verify the correct elements are being used for the test
        pytest | to run a headless test with no browser (default)
        pytest --headed | to run a test in headed mode with browser visible
        --slowmo 1000 | to run the test in the browser at a slower speed. I start at 1000 and go up or down. 
"""