import requests


def test_login_returns_token(login_response):
    assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"
    assert login_response.json().get("token"), "No valid JWT token received in login response"


def test_login_with_wrong_password_is_rejected(base_url, credentials):
    username, _ = credentials
    payload = {"username": username, "password": "definitely-the-wrong-password"}

    response = requests.post(f"{base_url}/auth/login", json=payload, timeout=10)

    assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    assert "token" not in response.json(), "A token was issued for a wrong password"
