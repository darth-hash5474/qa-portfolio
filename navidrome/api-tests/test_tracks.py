import pytest
import requests

# IDs that do not match any song on the server
INVALID_TRACK_IDS = [f"mock-track-id-{i}" for i in range(5)] + ["!!not-an-id!!", "12345"]

KNOWN_BUG = 'Known bug in Navidrome 0.64.2: "added" counts the ids sent, not the tracks saved'


# Real track ids from the library
@pytest.fixture
def valid_track_ids(api_url, auth_headers):
    response = requests.get(f"{api_url}/song", params={"_start": 0, "_end": 5}, headers=auth_headers, timeout=10)
    assert response.status_code == 200, f"Could not fetch songs: {response.status_code}"
    track_ids = [track["id"] for track in response.json()]

    if not track_ids:
        pytest.skip("No songs on the server. Add music to the library to run this test.")
    return track_ids


# Tracks are added through the /tracks sub-resource, not by updating the playlist itself
def add_tracks(api_url, headers, playlist_id, track_ids):
    url = f"{api_url}/playlist/{playlist_id}/tracks"
    return requests.post(url, json={"ids": track_ids}, headers=headers, timeout=10)


def get_saved_track_count(api_url, headers, playlist_id):
    response = requests.get(f"{api_url}/playlist/{playlist_id}/tracks", headers=headers, timeout=10)
    assert response.status_code == 200, f"Could not fetch playlist tracks: {response.status_code}"
    return len(response.json())


# Control: real track ids must be accepted and saved, otherwise the invalid id tests prove nothing
def test_valid_tracks_are_saved(api_url, auth_headers, create_playlist, valid_track_ids):
    playlist_id = create_playlist("test_tracks - valid ids").json().get("id")

    response = add_tracks(api_url, auth_headers, playlist_id, valid_track_ids)
    saved_count = get_saved_track_count(api_url, auth_headers, playlist_id)

    assert response.status_code == 200, f"Valid tracks rejected with status {response.status_code}"
    assert response.json().get("added") == len(valid_track_ids)
    assert saved_count == len(valid_track_ids), f"Sent {len(valid_track_ids)} tracks, saved {saved_count}"


# Invalid ids should be rejected, not accepted with a 200 and silently dropped
@pytest.mark.xfail(strict=True, reason=KNOWN_BUG)
def test_invalid_track_ids_are_rejected(api_url, auth_headers, create_playlist):
    playlist_id = create_playlist("test_tracks - invalid ids").json().get("id")

    response = add_tracks(api_url, auth_headers, playlist_id, INVALID_TRACK_IDS)
    saved_count = get_saved_track_count(api_url, auth_headers, playlist_id)

    assert saved_count == 0, f"Server saved {saved_count} tracks that do not exist."
    assert response.status_code in [400, 422], (
        f"Server returned {response.status_code} ({response.text.strip()}) for invalid track ids "
        f"and saved {saved_count} of {len(INVALID_TRACK_IDS)}. Expected 400 or 422."
    )


# With a mix of real and invalid ids, the server must not report more tracks added than it saved
@pytest.mark.xfail(strict=True, reason=KNOWN_BUG)
def test_added_count_matches_saved_tracks_for_mixed_ids(api_url, auth_headers, create_playlist, valid_track_ids):
    playlist_id = create_playlist("test_tracks - mixed ids").json().get("id")
    mixed_ids = valid_track_ids + INVALID_TRACK_IDS

    response = add_tracks(api_url, auth_headers, playlist_id, mixed_ids)
    saved_count = get_saved_track_count(api_url, auth_headers, playlist_id)

    # Rejecting the whole request is acceptable, as long as nothing was saved
    if response.status_code in [400, 422]:
        assert saved_count == 0, f"Request was rejected but {saved_count} tracks were saved."
        return

    assert response.status_code == 200, f"Unexpected status for mixed ids: {response.status_code}"
    assert saved_count == len(valid_track_ids), f"Sent {len(valid_track_ids)} valid tracks, saved {saved_count}"

    added = response.json().get("added")
    assert added == saved_count, f"Server reported {added} tracks added but saved {saved_count}."
