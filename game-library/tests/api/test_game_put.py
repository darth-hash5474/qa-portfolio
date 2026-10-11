# Game update test
def test_update_game(client):
    # Elden Ring in the seeded games, which starts with the status playing
    game_id = 3

    update_data = {
        "title": "Elden Ring",
        "platform": "PC",
        "status": "backlog",  # Change status from playing to backlog
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
