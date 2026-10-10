import pytest
import requests


# Every request to the API needs a valid token
@pytest.mark.parametrize(
    "headers",
    [
        {},
        {"x-nd-authorization": "Bearer not-a-real-token"},
        {"x-nd-authorization": ""},
    ],
    ids=["no token", "garbage token", "empty token"],
)
def test_request_without_valid_token_is_rejected(api_url, headers):
    response = requests.get(f"{api_url}/playlist", headers=headers, timeout=10)

    assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    assert response.json().get("error") == "Not authenticated"
