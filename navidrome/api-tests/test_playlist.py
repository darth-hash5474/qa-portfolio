import requests

# Boundary value for the playlist name
OVERSIZED_NAME_LENGTH = 50000


# An oversized name must either be refused with a 400 or stored exactly as sent
def test_oversized_playlist_name_is_rejected_or_stored_intact(api_url, auth_headers, create_playlist):
    big_name = "C" * OVERSIZED_NAME_LENGTH

    response = create_playlist(big_name)

    # Refusing the oversized name is acceptable
    if response.status_code == 400:
        return

    assert response.status_code in [200, 201], f"Unexpected status for oversized name: {response.status_code}"

    playlist_id = response.json().get("id")
    assert playlist_id, "Could not find playlist id in response payload"

    # Fetch the playlist back from the server
    get_response = requests.get(f"{api_url}/playlist/{playlist_id}", headers=auth_headers, timeout=10)
    assert get_response.status_code == 200, f"Failed to fetch playlist. Status: {get_response.status_code}"

    # If what we sent is not what was saved, the server silently truncated the name
    saved_name = get_response.json().get("name")
    assert saved_name == big_name, f"Name silently truncated: sent {len(big_name)} chars, saved {len(saved_name)}"
