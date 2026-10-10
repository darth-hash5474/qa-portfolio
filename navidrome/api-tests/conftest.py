import os
import pytest
import requests
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Url configuration
BASE_URL = os.getenv("URL")

# User vars
USER = os.getenv("USERNAME")
PASS = os.getenv("PASSWORD")

TIMEOUT = 10


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def api_url():
    return f"{BASE_URL}/api"


# Log in once per test run and share the response with every test that needs it
@pytest.fixture(scope="session")
def login_response():
    payload = {"username": USER, "password": PASS}
    return requests.post(f"{BASE_URL}/auth/login", json=payload, timeout=TIMEOUT)


# Headers carrying the JWT token from the login
@pytest.fixture(scope="session")
def auth_headers(login_response):
    assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"
    token = login_response.json().get("token")
    assert token is not None, "No valid JWT token received in login response"

    return {
        "x-nd-authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


# Create playlists through this fixture so they are deleted once the test finishes
@pytest.fixture
def create_playlist(api_url, auth_headers):
    created_ids = []

    def _create_playlist(name):
        response = requests.post(f"{api_url}/playlist", json={"name": name}, headers=auth_headers, timeout=TIMEOUT)
        if response.status_code in [200, 201]:
            created_ids.append(response.json().get("id"))
        return response

    yield _create_playlist

    for playlist_id in created_ids:
        requests.delete(f"{api_url}/playlist/{playlist_id}", headers=auth_headers, timeout=TIMEOUT)
