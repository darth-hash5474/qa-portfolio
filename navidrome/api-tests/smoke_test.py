import os
import requests
from dotenv import load_dotenv

# Load .env variables
load_dotenv()
URL = os.getenv("URL")

# Load the page using the requests library
def load_the_page():
    response = requests.get(url=URL)
    # Catch errors and success codes along the way
    try:
        if response.ok:
            print("Page loaded successfully.")
        else:     
            print(f"Error while fetching page. Error: {response.status_code}")  
    except:
        print(f"An error occurred. Error: {response.status_code}")  

# Run the smoke test with python3 smoke_test.py
initial_fetch = load_the_page()
