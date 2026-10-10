def test_login_returns_token(login_response):
    assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"
    assert login_response.json().get("token"), "No valid JWT token received in login response"
