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
