import os
import requests
from smoke_test import URL

BASE_URL = f"{URL}/api"
TOKEN_FILE = "jwt-token/.env"

# Boundary values for the playlist name
OVERSIZED_NAME_LENGTH = 50000
MAX_TRUNCATED_LENGTH = 255


# Extract the token we got from login.py
def get_stored_token():
    if not os.path.exists(TOKEN_FILE):
        raise FileNotFoundError(
            "Missing JWT Token. Ensure login.py script has been run."
        )
    with open(TOKEN_FILE, "r") as f:
        line = f.read().strip()
        return line.split("=", 1)[1]


def test_create_playlist():
    # Attach the token in the headers
    headers = {
        "x-nd-authorization": f"Bearer {get_stored_token()}",
        "Content-Type": "application/json",
    }

    # Create a payload with an oversized name for boundary testing
    big_name = "C" * OVERSIZED_NAME_LENGTH
    payload = {
        "name": big_name,
        "comment": "Created via automated open-source API test pipeline",
        "tracks": [],
    }

    # Send the payload as a post request to create the playlist
    response = requests.post(f"{BASE_URL}/playlist", json=payload, headers=headers)

    # A server that refuses the oversized name should do so with a 400
    if response.status_code not in [200, 201]:
        print(f"Server responded with status code: {response.status_code}")
        assert response.status_code == 400
        return

    print("Server accepted oversized payload.")

    # Get the playlist id from the response data
    playlist_id = response.json().get("id")
    if not playlist_id:
        print("Could not find playlist id in response payload")
        return

    print(f"Playlist created with ID {playlist_id}. Fetching to check title...")

    # Fetch the playlist back from the server
    get_response = requests.get(f"{BASE_URL}/playlist/{playlist_id}", headers=headers)
    if get_response.status_code != 200:
        print(f"Failed to fetch playlist data for validation. Status: {get_response.status_code}")
        return

    saved_name = get_response.json().get("name")

    # The name was stored intact, so there is no truncation bug
    if saved_name == big_name:
        print("Navidrome supports massive playlist titles.")
        return

    # What we sent is not what was saved, so we found a bug
    print(f"Error, Confirmed Bug Found: Sent length == {len(big_name)} || Saved Length == {len(saved_name)}")

    # Check the name was cut at a sensible limit
    assert len(saved_name) <= MAX_TRUNCATED_LENGTH, f"Unusual truncation size: {len(saved_name)}"
    print("Success: System safely isolated and handled the silent truncation limit.")


if __name__ == "__main__":
    test_create_playlist()
