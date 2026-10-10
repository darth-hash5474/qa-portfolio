import os
import requests
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Url configuration
BASE_URL = os.getenv("URL")

# User vars
USER = os.getenv("USERNAME")
PASS = os.getenv("PASSWORD")

# Kept separate from the main .env so saving the token never overwrites it
TOKEN_FILE = "jwt-token/.env"


def test_login():
    # Setup the payload and the url
    url = f"{BASE_URL}/auth/login"
    payload = {"username": USER, "password": PASS}

    response = requests.post(url, json=payload)
    assert response.status_code == 200, f"Login failed with status {response.status_code}"

    # Get the token from the response
    token = response.json().get("token")
    assert token is not None, "No valid JWT token received in login response"

    # Save the token for the other scripts to use
    with open(TOKEN_FILE, "w") as f:
        f.write(f"JWT_TOKEN={token}")
    print("Token Acquired")


if __name__ == "__main__":
    test_login()
