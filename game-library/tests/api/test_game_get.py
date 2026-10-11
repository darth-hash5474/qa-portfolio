# Starter test: the library starts with the twelve seeded games
def test_list_returns_the_seeded_games(client):
    response = client.get("/api/games")

    assert response.status_code == 200
    assert response.json()["total"] == 12


# Search test: looking a game up by its title returns that game
def test_get_game(client):
    # Search for a game by name
    name = "Hades"
    response = client.get(f"/api/games?search={name}")

    # Should return 200
    assert response.status_code == 200

    # The matching games are in "items"; the first one should be Hades, which is the first seeded game
    assert response.json()["items"][0]["id"] == 1
    assert response.json()["items"][0]["title"] == name
