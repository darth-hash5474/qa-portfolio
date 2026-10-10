# Starter test: the library starts with the twelve seeded games
def test_list_returns_the_seeded_games(client):
    response = client.get("/api/games")

    assert response.status_code == 200
    assert response.json()["total"] == 12
