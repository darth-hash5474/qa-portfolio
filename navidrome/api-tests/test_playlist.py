import uuid
import pytest
import requests

# Boundary value for the playlist name
OVERSIZED_NAME_LENGTH = 50000

MISSING_ID = "this-playlist-does-not-exist"


def get_playlist(api_url, headers, playlist_id):
    return requests.get(f"{api_url}/playlist/{playlist_id}", headers=headers, timeout=10)


# Create, read, rename and delete one playlist
def test_playlist_lifecycle(api_url, auth_headers, create_playlist):
    playlist_id = create_playlist("Lifecycle test", comment="first comment").json().get("id")
    assert playlist_id, "Could not find playlist id in response payload"

    saved = get_playlist(api_url, auth_headers, playlist_id).json()
    assert saved["name"] == "Lifecycle test"
    assert saved["comment"] == "first comment"
    assert saved["songCount"] == 0

    update = {"name": "Lifecycle test renamed", "comment": "second comment"}
    update_response = requests.put(f"{api_url}/playlist/{playlist_id}", json=update, headers=auth_headers, timeout=10)
    assert update_response.status_code == 200, f"Update failed with status {update_response.status_code}"

    saved = get_playlist(api_url, auth_headers, playlist_id).json()
    assert saved["name"] == "Lifecycle test renamed"
    assert saved["comment"] == "second comment"

    delete_response = requests.delete(f"{api_url}/playlist/{playlist_id}", headers=auth_headers, timeout=10)
    assert delete_response.status_code == 200, f"Delete failed with status {delete_response.status_code}"
    assert get_playlist(api_url, auth_headers, playlist_id).status_code == 404


@pytest.mark.parametrize(
    "method, path, payload",
    [
        ("GET", f"/playlist/{MISSING_ID}", None),
        ("DELETE", f"/playlist/{MISSING_ID}", None),
        ("POST", f"/playlist/{MISSING_ID}/tracks", {"ids": ["any-track-id"]}),
    ],
    ids=["get", "delete", "add tracks"],
)
def test_missing_playlist_returns_404(api_url, auth_headers, method, path, payload):
    response = requests.request(method, f"{api_url}{path}", json=payload, headers=auth_headers, timeout=10)

    assert response.status_code == 404, f"Expected 404, got {response.status_code}"


# Accents, emoji, non-latin text and HTML must come back exactly as sent
def test_special_characters_in_name_are_stored_intact(api_url, auth_headers, create_playlist):
    name = "Tëst 🎵 プレイリスト <b>bold</b> ' OR 1=1 --"

    playlist_id = create_playlist(name).json().get("id")

    assert get_playlist(api_url, auth_headers, playlist_id).json()["name"] == name


def test_malformed_json_is_rejected(api_url, auth_headers):
    response = requests.post(f"{api_url}/playlist", data="{not valid json", headers=auth_headers, timeout=10)

    assert response.status_code == 422, f"Expected 422, got {response.status_code}"


def test_name_of_wrong_type_is_rejected(create_playlist):
    response = create_playlist(12345)

    assert response.status_code == 422, f"Expected 422, got {response.status_code}"


# The web form requires a name, so the API should not accept a playlist without one
@pytest.mark.xfail(
    strict=True,
    reason="Known bug in Navidrome 0.64.2: the API creates playlists with an empty or missing name",
)
@pytest.mark.parametrize("name", ["", None, "   "], ids=["empty", "missing", "whitespace only"])
def test_playlist_without_a_name_is_rejected(create_playlist, name):
    response = create_playlist(name)

    assert response.status_code in [400, 422], (
        f"Server returned {response.status_code} and created a playlist with name {name!r}. Expected 400 or 422."
    )


# An oversized name must either be refused with a 400 or stored exactly as sent
def test_oversized_playlist_name_is_rejected_or_stored_intact(api_url, auth_headers, create_playlist):
    big_name = "C" * OVERSIZED_NAME_LENGTH

    response = create_playlist(big_name)

    # Refusing the oversized name is acceptable
    if response.status_code == 400:
        return

    assert response.status_code in [200, 201], f"Unexpected status for oversized name: {response.status_code}"

    playlist_id = response.json().get("id")
    assert playlist_id, "Could not find playlist id in response payload"

    # Fetch the playlist back from the server
    get_response = get_playlist(api_url, auth_headers, playlist_id)
    assert get_response.status_code == 200, f"Failed to fetch playlist. Status: {get_response.status_code}"

    # If what we sent is not what was saved, the server silently truncated the name
    saved_name = get_response.json().get("name")
    assert saved_name == big_name, f"Name silently truncated: sent {len(big_name)} chars, saved {len(saved_name)}"


def test_list_is_paginated(api_url, auth_headers, create_playlist):
    for i in range(3):
        create_playlist(f"Pagination test {i}")

    params = {"_start": 0, "_end": 2}
    response = requests.get(f"{api_url}/playlist", params=params, headers=auth_headers, timeout=10)

    assert response.status_code == 200
    assert len(response.json()) == 2, "Page size was not respected"
    assert int(response.headers["X-Total-Count"]) >= 3, "Total count does not include every playlist"


def test_list_can_be_filtered_by_name(api_url, auth_headers, create_playlist):
    # A unique name so only this playlist can match
    name = f"Filter test {uuid.uuid4().hex[:8]}"
    create_playlist(name)
    create_playlist("Some other playlist")

    response = requests.get(f"{api_url}/playlist", params={"q": name}, headers=auth_headers, timeout=10)

    assert response.status_code == 200
    assert [playlist["name"] for playlist in response.json()] == [name]
