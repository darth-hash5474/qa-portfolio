import pytest

# Create Duplicate versions of Hades
def test_exact_match(client):
    hades_a = "Hades"
    platform = "PC"

    payload = {
        "title": hades_a,
        "platform": platform
    }

    response = client.post("/api/games", json=payload)
    assert response.status_code == 409, response.json()

@pytest.mark.xfail(strict=True, reason="Known bug: duplicate check is case sensitive")
def test_diff_case(client):
    hades_b = "hades"
    platform = "PC"

    payload = {
        "title": hades_b,
        "platform": platform
    }

    response = client.post("/api/games", json=payload)

    assert response.status_code == 409

def test_space_match(client):
    hades_c = " Hades"
    platform = "PC"

    payload = {
        "title": hades_c,
        "platform": platform
    }
    
    response = client.post("/api/games", json=payload)
    assert response.status_code == 409, response.json()

def test_diff_platform(client):
    hades_d = "Hades"
    platform = "Switch"

    payload = {
        "title": hades_d,
        "platform": platform
    }

    response = client.post("/api/games", json=payload)
    assert response.status_code == 201, response.json()

def test_duplicate_reject(client):
    game_id = 3
    payload = {
        "title": "Hades",
        "platform": "PC"
    }

    response = client.put(f"/api/games/{game_id}", json=payload)
    assert response.status_code == 409, response.json()

def test_update_self(client):
    game_id = 1
    payload = {
        "title": "Hades",
        "platform": "PC"
    }

    response = client.put(f"/api/games/{game_id}", json=payload)
    assert response.status_code == 200, response.json()