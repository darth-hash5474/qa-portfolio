import os
import requests
from smoke_test import URL
from dotenv import load_dotenv

load_dotenv()

unique_id = os.getenv("UNIQUE_ID")

BASE_URL=f"{URL}/api"

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

    headers = {
        "x-nd-authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    url = f"{BASE_URL}/playlist"
    payload = {
        "name": "QA Regression Playlist",
        "comment": "Created via automated open-source API test pipeline",
        "tracks": [],
    }

    print("Creating playlist using stored auth token")
    response = requests.post(url, json=payload, headers=headers)

    assert(
        response.status_code == 200
    ), f"Playlist creation failed with status {response.status_code}"
    print("Playlist created successfully.")

if __name__ == "__main__":
    test_create_playlist()