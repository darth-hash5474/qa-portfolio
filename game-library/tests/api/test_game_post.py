import pytest

HOUR_LIMIT = 100000
RELEASE_YEAR_MIN = 1970
RELEASE_YEAR_MAX = 2100


# The names of the fields a 422 response complains about
def rejected_fields(response):
    return sorted(error["loc"][-1] for error in response.json()["detail"])


# Game creation test
def test_create_game(client):
    # Only title and platform are required; the other fields have defaults
    new_game = {
        "title": "Minecraft",
        "platform": "PC",
    }

    # Include the payload in the request
    response = client.post("/api/games", json=new_game)

    # Check the response from the server contains the correct title
    assert response.status_code == 201, response.json()
    assert response.json()["title"] == "Minecraft"

    # Fetch a fresh request using the game id of the game just created
    game_id = response.json()["id"]
    fetch_new_game = client.get(f"/api/games/{game_id}")

    # Should return 200
    assert fetch_new_game.status_code == 200, fetch_new_game.json()
    assert fetch_new_game.json()["id"] == game_id
    assert fetch_new_game.json()["title"] == "Minecraft"


# Title boundary: 100 characters is the longest title the spec allows
@pytest.mark.xfail(strict=True, reason="Known bug: a title of exactly 100 characters is rejected")
def test_title_100(client):
    title_a = "A" * 100

    game_a = {
        "title": title_a,
        "platform": "PC",
    }

    response_a = client.post("/api/games", json=game_a)

    assert response_a.status_code == 201, response_a.json()
    assert response_a.json()["title"] == title_a


# Title boundary: one character under the limit
def test_title_99(client):
    title_b = "B" * 99

    game_b = {
        "title": title_b,
        "platform": "PC",
    }

    response_b = client.post("/api/games", json=game_b)

    assert response_b.status_code == 201, response_b.json()
    assert response_b.json()["title"] == title_b


# Title boundary: one character over the limit
def test_title_101(client):
    title_c = "C" * 101

    game_c = {
        "title": title_c,
        "platform": "PC",
    }

    response_c = client.post("/api/games", json=game_c)

    # Use the whole body as the message: a 201 response has no "detail" to show
    assert response_c.status_code == 422, response_c.json()

    # The request should be rejected because of the title and nothing else
    assert rejected_fields(response_c) == ["title"]

