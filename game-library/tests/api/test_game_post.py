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
    assert response.status_code == 201
    assert response.json()["title"] == "Minecraft"

    # Fetch a fresh request using the game id of the game just created
    game_id = 13
    fetch_new_game = client.get(f"/api/games/{game_id}")

    # Should return 200
    assert fetch_new_game.status_code == 200
    assert fetch_new_game.json()["id"] == 13

def test_post_bounds(client):
    long_title = "X" * 10000
    invalid_platform = "NES"
    invalid_status = "not fun"
    long_genre = "C" * 100 

    new_game = {
        "title": long_title,
        "platform": invalid_platform,
        "status": invalid_status,
        "genre": long_genre,
        "rating": -15,
        "hours_played": 0.03,
        "release_year": 1786
    }

    response = client.post("/api/games", json=new_game)
    assert response.status_code == 422

def test_arr_err(client):
    payload = {
        "games_1": [
            {
                "title": "Apex Legends",
                "platform": "PC",
            }
        ],
        "games_2": [
            {
                "title": "Sid Meiers Civ VI",
                "platform": "PC",
            }
        ], 
    }

    response = client.post("/api/games", json=payload)
    assert response.status_code == 422

def test_value_err(client):
    invalid_title = True
    platform_error = 100

    new_game = {
        "title": invalid_title,
        "platform": platform_error,
    }

    response = client.post("/api/games", json=new_game)
    assert response.status_code == 422

