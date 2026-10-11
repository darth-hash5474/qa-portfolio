# Deletion Test
def test_delete_game(client):
    # Disco Elysium in the seeded games
    game_id = 7

    # Send a delete request
    response = client.delete(f"/api/games/{game_id}")
    assert response.status_code == 204

    # Verify the game was deleted, should return 404 not found
    verify_deletion = client.get(f"/api/games/{game_id}")
    assert verify_deletion.status_code == 404
