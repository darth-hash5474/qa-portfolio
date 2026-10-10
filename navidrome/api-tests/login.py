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


def test_login():

    # Setup the payload and the url
    url = f"{BASE_URL}/auth/login"
    payload = {"username":USER,"password":PASS}

    response = requests.post(url=url, json=payload)

    assert (
        response.status_code == 200
    ), f"Login failed with status {response.status_code}"

    data = response.json()
    token = data.get("token")
    assert token is not None, "No valid JWT token recieved in login response"

    with open("jwt-token/.env", "w") as f:
        f.write(f"JWT_TOKEN={token}")
    print("Token Acquired")

if __name__ == "__main__":
    test_login()