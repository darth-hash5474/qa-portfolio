import json
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


# API headers using the token the browser session already holds, for test setup and cleanup
@pytest.fixture(scope="session")
def api_headers(auth_state):
    state = json.loads(auth_state.read_text())
    local_storage = state["origins"][0]["localStorage"]
    token = next(item["value"] for item in local_storage if item["name"] == "token")
    return {"x-nd-authorization": f"Bearer {token}"}


def delete_playlists(app_url, api_headers, names):
    playlists = requests.get(f"{app_url}/api/playlist", headers=api_headers, timeout=10).json()
    for playlist in playlists:
        if playlist["name"] in names:
            requests.delete(f"{app_url}/api/playlist/{playlist['id']}", headers=api_headers, timeout=10)


# Deletes playlists by name through the API once the test finishes, so UI tests leave nothing behind
@pytest.fixture
def playlist_cleanup(app_url, api_headers):
    names = []

    yield names

    delete_playlists(app_url, api_headers, names)


# Creates a playlist through the API so a test can start from existing data
@pytest.fixture
def make_playlist(app_url, api_headers, playlist_cleanup):
    def _make_playlist(name, comment=""):
        payload = {"name": name, "comment": comment}
        response = requests.post(f"{app_url}/api/playlist", json=payload, headers=api_headers, timeout=10)
        assert response.status_code == 200, f"Could not create playlist: {response.status_code}"
        playlist_cleanup.append(name)
        return response.json()["id"]

    return _make_playlist


# Titles of the songs in the library, for tests that need real tracks
@pytest.fixture
def song_titles(app_url, api_headers):
    songs = requests.get(f"{app_url}/api/song", headers=api_headers, timeout=10).json()
    if not songs:
        pytest.skip("No songs on the server. Run seed.py to add test tracks.")
    return [song["title"] for song in songs]
