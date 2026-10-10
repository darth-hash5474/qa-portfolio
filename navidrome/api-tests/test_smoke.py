import requests


def test_server_is_reachable(base_url):
    response = requests.get(base_url, timeout=10)
    assert response.ok, f"Error while fetching page. Status: {response.status_code}"
