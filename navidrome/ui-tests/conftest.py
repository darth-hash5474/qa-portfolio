import os
import re
import pytest
import requests
from dotenv import load_dotenv
from playwright.sync_api import expect
from pages import LoginPage

# Load env vars
load_dotenv()

BASE_URL = os.getenv("URL")
USER = os.getenv("USERNAME")
PASS = os.getenv("PASSWORD")

# Where the app lands after a successful login
HOME_URL = re.compile(r"#/album")


@pytest.fixture(scope="session")
def app_url():
    return BASE_URL


@pytest.fixture(scope="session")
def credentials():
    return USER, PASS


# Sign in through the login form once and save the browser state.
# Navidrome rate limits logins, so tests reuse this instead of signing in each time.
@pytest.fixture(scope="session")
def auth_state(browser, app_url, credentials, tmp_path_factory):
    state_file = tmp_path_factory.mktemp("auth") / "state.json"

    context = browser.new_context()
    page = context.new_page()
    login_page = LoginPage(page, app_url)
    login_page.open()
    login_page.login(*credentials)
    expect(page).to_have_url(HOME_URL)

    context.storage_state(path=state_file)
    context.close()
    return state_file


# A page that is already signed in
@pytest.fixture
def logged_in_page(browser, app_url, auth_state):
    context = browser.new_context(storage_state=auth_state)
    page = context.new_page()
    page.goto(app_url)
    expect(page).to_have_url(HOME_URL)

    yield page

    context.close()


# Deletes playlists by name through the API once the test finishes, so UI tests leave nothing behind
@pytest.fixture
def playlist_cleanup(logged_in_page, app_url):
    names = []

    yield names

    # Reuse the token the browser session already holds
    token = logged_in_page.evaluate("localStorage.getItem('token')")
    headers = {"x-nd-authorization": f"Bearer {token}"}

    playlists = requests.get(f"{app_url}/api/playlist", headers=headers, timeout=10).json()
    for playlist in playlists:
        if playlist["name"] in names:
            requests.delete(f"{app_url}/api/playlist/{playlist['id']}", headers=headers, timeout=10)
