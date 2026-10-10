# Starter test: the library starts with the twelve seeded games
def test_list_returns_the_seeded_games(client):
    response = client.get("/api/games")

    assert response.status_code == 200
    assert response.json()["total"] == 12

def test_create_game(client):
    new_game = {
        "title": "Minecraft",
        "platform": "PC",
    }   

    response = client.post("/api/games", json=new_game)

    assert response.status_code == 201
    assert response.json()["title"] == "Minecraft"

    game_id = 13
    fetch_new_game = client.get(f"/api/games/{game_id}")

    assert fetch_new_game.status_code == 200
    assert fetch_new_game.json()["id"] == 13

def test_get_game(client):
    game_id = 2
    response = client.get(f"/api/games/{game_id}")

    assert response.status_code == 200

def test_update_game(client):
    game_id = 3

    update_data = {
        "title": "Elden Ring",
        "platform": "PC",
        "status": "backlog"
    }

    response = client.put(f"/api/games/{game_id}", json=update_data)

    assert response.status_code == 200
    assert response.json()["status"] == "backlog"

    get_updated_game = client.get(f"/api/games/{game_id}")
    assert get_updated_game.status_code == 200
    assert get_updated_game.json()["status"] == "backlog"

def test_delete_game(client):
    game_id = 7

    response = client.delete(f"/api/games/{game_id}")
    assert response.status_code == 204

    verify_deletion = client.get(f"/api/games/{game_id}")
    assert verify_deletion.status_code == 404