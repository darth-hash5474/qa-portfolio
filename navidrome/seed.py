"""Fill the test server's library with five short test tracks.

Run after `docker compose up -d`: python seed.py
"""
import os
import subprocess
import time
import requests
from dotenv import load_dotenv

load_dotenv()

URL = os.getenv("URL")
USER = os.getenv("USERNAME")
PASS = os.getenv("PASSWORD")

CONTAINER = "navidrome-test"
TRACK_COUNT = 5
WAIT_SECONDS = 60


def subsonic(endpoint):
    params = {"u": USER, "p": PASS, "v": "1.16.1", "c": "seed", "f": "json"}
    response = requests.get(f"{URL}/rest/{endpoint}.view", params=params, timeout=10)
    response.raise_for_status()
    return response.json()["subsonic-response"]


# The container needs a moment after starting before it accepts logins
def wait_for_server():
    deadline = time.time() + WAIT_SECONDS
    while time.time() < deadline:
        try:
            if subsonic("ping")["status"] == "ok":
                return
        except requests.exceptions.RequestException:
            pass
        time.sleep(1)
    raise SystemExit(f"Navidrome did not accept a login at {URL} within {WAIT_SECONDS} seconds.")


# Generate tagged sine tones with the ffmpeg inside the container, so no real music is needed
def create_tracks():
    for i in range(1, TRACK_COUNT + 1):
        subprocess.run(
            [
                "docker", "exec", CONTAINER, "ffmpeg", "-hide_banner", "-loglevel", "error",
                "-f", "lavfi", "-i", f"sine=frequency={200 + i * 100}:duration=5",
                "-metadata", f"title=Test Track {i}",
                "-metadata", "artist=QA Artist",
                "-metadata", "album=QA Album",
                "-metadata", f"track={i}",
                "-y", f"/music/test-track-{i}.mp3",
            ],
            check=True,
        )


def scan_library():
    subsonic("startScan")
    deadline = time.time() + WAIT_SECONDS
    while time.time() < deadline:
        status = subsonic("getScanStatus")["scanStatus"]
        if not status["scanning"]:
            return status["count"]
        time.sleep(1)
    raise SystemExit(f"Library scan did not finish within {WAIT_SECONDS} seconds.")


if __name__ == "__main__":
    wait_for_server()
    create_tracks()
    song_count = scan_library()

    if song_count < TRACK_COUNT:
        raise SystemExit(f"Expected at least {TRACK_COUNT} songs after the scan, found {song_count}.")
    print(f"Library seeded: {song_count} songs.")
