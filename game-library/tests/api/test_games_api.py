# Starter test: the library starts with the twelve seeded games
def test_list_returns_the_seeded_games(client):
    response = client.get("/api/games")

    assert response.status_code == 200
    assert response.json()["total"] == 12

# Game creation test
def test_create_game(client):
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

# Get test
def test_get_game(client):
    # Get a game by id 
    game_id = 2
    response = client.get(f"/api/games/{game_id}")

    # Should return 200
    assert response.status_code == 200

# Game update test
def test_update_game(client):
    game_id = 3

    update_data = {
        "title": "Elden Ring",
        "platform": "PC",
        "status": "backlog" # Change status from playing to backlog
    }

    # Send the data in a payload
    response = client.put(f"/api/games/{game_id}", json=update_data)

    # Should get 200
    assert response.status_code == 200
    assert response.json()["status"] == "backlog"

    # Get the game we just updated to verify it contains the updated status
    get_updated_game = client.get(f"/api/games/{game_id}")
    assert get_updated_game.status_code == 200
    assert get_updated_game.json()["status"] == "backlog"

# Deletion Test
def test_delete_game(client):
    game_id = 7 

    # Send a delete request
    response = client.delete(f"/api/games/{game_id}")
    assert response.status_code == 204

    # Verify the game was deleted, should return 404 not found
    verify_deletion = client.get(f"/api/games/{game_id}")
    assert verify_deletion.status_code == 404