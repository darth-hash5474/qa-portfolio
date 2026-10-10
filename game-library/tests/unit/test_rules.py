from app.models import GameIn
from app.rules import validate_game


# Starter test: a game that follows every rule has no errors
def test_valid_game_has_no_errors():
    game = GameIn(title="Portal 2", platform="PC", status="completed", rating=10, hours_played=12)

    assert validate_game(game) == []
