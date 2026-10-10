import os
import requests
from smoke_test import URL
from dotenv import load_dotenv

load_dotenv()

unique_id = os.getenv("UNIQUE_ID")

BASE_URL=f"{URL}/api"

# Extract the token we got from login.py
def get_stored_token():
    if not os.path.exists("jwt-token/.env"):
        raise FileNotFoundError(
            "Missing JWT Token. Ensure login.py script has been run."
        )
    with open("jwt-token/.env", "r") as f:
        line = f.read().strip()
        return line.split("=")[1]


def test_create_playlist():
    token = get_stored_token()

    # Attach the token in the headers
    headers = {
        "x-nd-authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    # Create a payload containing playlist data
    url = f"{BASE_URL}/playlist"

    # Create an altered payload containing 10,000 A's for boundary testing
    big_name = "C" * 50000

    payload = {
        "name": big_name,
        "comment": "Created via automated open-source API test pipeline",
        "tracks": [], 
    }

    # Send the payload as a post request to create the playlist
    response = requests.post(url, json=payload, headers=headers)

    if response.status_code in [200, 201]:
        print("Server accepted oversized payload.")

        # Get the playlist id from the response data
        response_data = response.json()
        playlist_id = response_data.get("id")

        if playlist_id:
            print(f"Playlist created with ID {playlist_id}. Fectching to check title...")

            # Fetch the playlist id from the server
            url_get = f"{URL}/api/playlist/{playlist_id}"

            get_response = requests.get(url_get, headers=headers)

            if get_response.status_code == 200:
                saved_playlist_data = get_response.json()
                saved_name = saved_playlist_data.get("name")

                # Check for a possible miscommunication between what we sent and what is saved in the database
                try:
                    assert saved_name == big_name
                    print("Navidrome supports massive playlist titles.") # If none exists, than this bug is obsolete
                except:
                    # If there is miscommunication, we found a bug
                    print(f"Error, Confirmed Bug Found: Sent length == {len(big_name)} || Saved Length == {len(saved_name)}")

                    # Check for a mismatch in the truncation limit.
                    assert len(saved_name) <= 255, f"Unusual truncation size: {len(saved_name)}"
                    print(f" Success: System safely isolated and handled the silent truncation limit.")
            else:
                print(f"Failed to fetch playlist data for validation. Status:  {get_response.status_code}")

        else:
            print(f"Could not verifiy name field in response payload")

    else:
        print(f"Server responded with status code: {response.status_code}")
        assert response.status_code == 400


if __name__ == "__main__":
    test_create_playlist()