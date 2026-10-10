from app.models import GameIn

# Starting data: twelve games, enough to fill more than one page
SEED_GAMES = [
    GameIn(title="Hades", platform="PC", genre="Roguelike", status="completed", rating=10, hours_played=62, release_year=2020),
    GameIn(title="Hollow Knight", platform="Switch", genre="Metroidvania", status="completed", rating=9, hours_played=48.5, release_year=2017),
    GameIn(title="Elden Ring", platform="PlayStation", genre="Action RPG", status="playing", rating=9, hours_played=85, release_year=2022),
    GameIn(title="Stardew Valley", platform="PC", genre="Farming", status="playing", rating=8, hours_played=120, release_year=2016),
    GameIn(title="Halo Infinite", platform="Xbox", genre="Shooter", status="dropped", rating=5, hours_played=9, release_year=2021),
    GameIn(title="Celeste", platform="Switch", genre="Platformer", status="completed", rating=9, hours_played=14, release_year=2018),
    GameIn(title="Disco Elysium", platform="PC", genre="RPG", status="backlog", hours_played=0, release_year=2019),
    GameIn(title="God of War", platform="PlayStation", genre="Action", status="completed", rating=8, hours_played=31, release_year=2018),
    GameIn(title="Monument Valley", platform="Mobile", genre="Puzzle", status="completed", rating=7, hours_played=2.5, release_year=2014),
    GameIn(title="Forza Horizon 5", platform="Xbox", genre="Racing", status="backlog", hours_played=0, release_year=2021),
    GameIn(title="Outer Wilds", platform="PC", genre="Adventure", status="backlog", hours_played=0, release_year=2019),
    GameIn(title="Tetris Effect", platform="PlayStation", genre="Puzzle", status="playing", hours_played=6),
]
