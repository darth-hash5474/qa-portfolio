import requests

# Subsonic error code for a wrong username or password
WRONG_CREDENTIALS = 40


# Navidrome also serves the Subsonic API, which is what most music clients use
def ping(base_url, username, password):
    params = {"u": username, "p": password, "v": "1.16.1", "c": "qa-portfolio", "f": "json"}
    response = requests.get(f"{base_url}/rest/ping.view", params=params, timeout=10)
    assert response.status_code == 200, f"Ping failed with status {response.status_code}"
    return response.json()["subsonic-response"]


def test_ping_with_valid_credentials(base_url, credentials):
    result = ping(base_url, *credentials)

    assert result["status"] == "ok"
    assert result["type"] == "navidrome"


# Subsonic reports errors in the body, with a 200 status
def test_ping_with_wrong_password_fails(base_url, credentials):
    username, _ = credentials

    result = ping(base_url, username, "definitely-the-wrong-password")

    assert result["status"] == "failed"
    assert result["error"]["code"] == WRONG_CREDENTIALS
