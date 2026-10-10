import requests
from playlist import URL, get_stored_token

TOKEN = get_stored_token()

HEADERS = {
    "x-nd-authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
}

PLAYLIST_URL = f"{URL}/api/playlist"

# IDs that do not match any song on the server
INVALID_TRACK_IDS = [f"mock-track-id-{i}" for i in range(5)] + ["!!not-an-id!!", "12345"]


# Create a throwaway playlist so the tests never touch existing ones
def create_playlist(name):
    response = requests.post(PLAYLIST_URL, json={"name": name}, headers=HEADERS, timeout=10)
    assert response.status_code in [200, 201], f"Could not create playlist: {response.status_code}"
    return response.json().get("id")


def delete_playlist(playlist_id):
    requests.delete(f"{PLAYLIST_URL}/{playlist_id}", headers=HEADERS, timeout=10)


# Tracks are added through the /tracks sub-resource, not by updating the playlist itself
def add_tracks(playlist_id, track_ids):
    url = f"{PLAYLIST_URL}/{playlist_id}/tracks"
    return requests.post(url, json={"ids": track_ids}, headers=HEADERS, timeout=10)


def get_saved_track_count(playlist_id):
    response = requests.get(f"{PLAYLIST_URL}/{playlist_id}/tracks", headers=HEADERS, timeout=10)
    assert response.status_code == 200, f"Could not fetch playlist tracks: {response.status_code}"
    return len(response.json())


# Control: real track ids must be accepted and saved, otherwise the invalid id test proves nothing
def test_add_valid_tracks():
    song_response = requests.get(f"{URL}/api/song", params={"_start": 0, "_end": 5}, headers=HEADERS, timeout=10)
    assert song_response.status_code == 200, f"Could not fetch songs: {song_response.status_code}"
    valid_track_ids = [track["id"] for track in song_response.json()]

    if not valid_track_ids:
        print("Control skipped: no songs on the server. Add music to the library to run it.")
        return

    playlist_id = create_playlist("tracks.py - valid ids")
    try:
        response = add_tracks(playlist_id, valid_track_ids)
        saved_count = get_saved_track_count(playlist_id)
        print(f"Valid ids -> Status: {response.status_code} | Sent: {len(valid_track_ids)} | Saved: {saved_count}")

        assert response.status_code == 200, f"Valid tracks rejected with status {response.status_code}"
        assert saved_count == len(valid_track_ids), "Mismatch between sent and saved tracks."
        print("Control pass: valid tracks were saved.")
    finally:
        delete_playlist(playlist_id)


# Invalid ids should be rejected, not accepted with a 200 and silently dropped
def test_add_invalid_tracks():
    playlist_id = create_playlist("tracks.py - invalid ids")
    try:
        response = add_tracks(playlist_id, INVALID_TRACK_IDS)
        saved_count = get_saved_track_count(playlist_id)
        print(f"Invalid ids -> Status: {response.status_code} | Sent: {len(INVALID_TRACK_IDS)} | Saved: {saved_count}")
        print(f"Response: {response.text}")

        assert saved_count == 0, f"Server saved {saved_count} tracks that do not exist."
        assert response.status_code in [400, 422], (
            f"Bug: server returned {response.status_code} for invalid track ids "
            f"and saved {saved_count} of {len(INVALID_TRACK_IDS)}. Expected 400 or 422."
        )
        print("Pass: invalid track ids were rejected.")
    finally:
        delete_playlist(playlist_id)


if __name__ == "__main__":
    test_add_valid_tracks()
    test_add_invalid_tracks()
