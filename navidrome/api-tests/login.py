import os
import requests
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Url configuration
URL = os.getenv("URL")
AUTH_URL = f"{URL}/auth/login"

# User vars
USER = os.getenv("USERNAME")
PASS = os.getenv("PASSWORD")


def send_login_request():
    # Setup the headers
    headers = {
        "Content-Type": "application/json"
    }
    # Setup the payload
    payload = {
        "username":USER,
        "password":PASS,
    }

    # Send the payload jsonified via requests
    try:
        response = requests.post(url=AUTH_URL, headers=headers, json=payload)
        if response.ok:
            print("200")
        else:
            print(f"Error Logging In. Check your credentials and try again. {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Error retrieving auth token. {e}")

# Test that it prints 200 using python3 login.py
request_auth_access = send_login_request()