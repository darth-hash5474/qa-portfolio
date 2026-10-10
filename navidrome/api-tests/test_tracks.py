import pytest
import requests

# IDs that do not match any song on the server
INVALID_TRACK_IDS = [f"mock-track-id-{i}" for i in range(5)] + ["!!not-an-id!!", "12345"]


# Tracks are added through the /tracks sub-resource, not by updating the playlist itself
def add_tracks(api_url, headers, playlist_id, track_ids):
    url = f"{api_url}/playlist/{playlist_id}/tracks"
    return requests.post(url, json={"ids": track_ids}, headers=headers, timeout=10)


def get_saved_track_count(api_url, headers, playlist_id):
    response = requests.get(f"{api_url}/playlist/{playlist_id}/tracks", headers=headers, timeout=10)
    assert response.status_code == 200, f"Could not fetch playlist tracks: {response.status_code}"
    return len(response.json())


# Control: real track ids must be accepted and saved, otherwise the invalid id test proves nothing
def test_valid_tracks_are_saved(api_url, auth_headers, create_playlist):
    song_response = requests.get(f"{api_url}/song", params={"_start": 0, "_end": 5}, headers=auth_headers, timeout=10)
    assert song_response.status_code == 200, f"Could not fetch songs: {song_response.status_code}"
    valid_track_ids = [track["id"] for track in song_response.json()]

    if not valid_track_ids:
        pytest.skip("No songs on the server. Add music to the library to run this test.")

    playlist_id = create_playlist("test_tracks - valid ids").json().get("id")

    response = add_tracks(api_url, auth_headers, playlist_id, valid_track_ids)
    saved_count = get_saved_track_count(api_url, auth_headers, playlist_id)

    assert response.status_code == 200, f"Valid tracks rejected with status {response.status_code}"
    assert saved_count == len(valid_track_ids), f"Sent {len(valid_track_ids)} tracks, saved {saved_count}"


# Invalid ids should be rejected, not accepted with a 200 and silently dropped
@pytest.mark.xfail(
    strict=True,
    reason='Known bug in Navidrome 0.64.2: returns 200 {"added":N} for invalid track ids but saves none',
)
def test_invalid_track_ids_are_rejected(api_url, auth_headers, create_playlist):
    playlist_id = create_playlist("test_tracks - invalid ids").json().get("id")

    response = add_tracks(api_url, auth_headers, playlist_id, INVALID_TRACK_IDS)
    saved_count = get_saved_track_count(api_url, auth_headers, playlist_id)

    assert saved_count == 0, f"Server saved {saved_count} tracks that do not exist."
    assert response.status_code in [400, 422], (
        f"Server returned {response.status_code} ({response.text.strip()}) for invalid track ids "
        f"and saved {saved_count} of {len(INVALID_TRACK_IDS)}. Expected 400 or 422."
    )
