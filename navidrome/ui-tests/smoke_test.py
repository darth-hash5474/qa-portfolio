# Load imports
import os
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv


# Load env vars
load_dotenv()
base_url = os.getenv("URL")


# Setup playwright for the smoke test
with sync_playwright() as p:
    # Launch the browser in a way we can see it
    browser = p.chromium.launch(headless=False)

    # Open a new page
    page=browser.new_page()

    # Navigate to the site's url
    page.goto(url=base_url)

    # Print the page title
    print(page.title())

    # Close the browser
    browser.close()