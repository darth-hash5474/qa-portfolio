import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from app.models import Game, GameIn
from app.seed import SEED_GAMES

SCHEMA = """
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    platform TEXT NOT NULL,
    genre TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL,
    rating INTEGER,
    hours_played REAL NOT NULL DEFAULT 0,
    release_year INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
)
"""

# Stores games in a SQLite file. A new database is filled with the seed games.
class GameRepository:
    def __init__(self, db_path):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

        is_new = not self.db_path.exists()
        with self._connect() as db:
            db.execute(SCHEMA)
        if is_new:
            self.reset()

    # One short-lived connection per operation keeps this safe across request threads
    @contextmanager
    def _connect(self):
        db = sqlite3.connect(self.db_path)
        db.row_factory = sqlite3.Row
        try:
            yield db
            db.commit()
        finally:
            db.close()

    # Throws everything away and starts again from the given games, with ids back at 1
    def reset(self, seed=SEED_GAMES):
        with self._connect() as db:
            db.execute("DELETE FROM games")
            db.execute("DELETE FROM sqlite_sequence WHERE name = 'games'")
        for game in seed:
            self.create(game)

    def list(self) -> list[Game]:
        with self._connect() as db:
            rows = db.execute("SELECT * FROM games ORDER BY id").fetchall()
        return [Game(**dict(row)) for row in rows]

    def get(self, game_id) -> Game | None:
        with self._connect() as db:
            row = db.execute("SELECT * FROM games WHERE id = ?", (game_id,)).fetchone()
        return Game(**dict(row)) if row else None

    def create(self, game: GameIn) -> Game:
        now = _now()
        values = game.model_dump(mode="json")
        with self._connect() as db:
            cursor = db.execute(
                """
                INSERT INTO games (title, platform, genre, status, rating, hours_played, release_year, created_at, updated_at)
                VALUES (:title, :platform, :genre, :status, :rating, :hours_played, :release_year, :now, :now)
                """,
                {**values, "now": now},
            )
        return self.get(cursor.lastrowid)

    def update(self, game_id, game: GameIn) -> Game | None:
        values = game.model_dump(mode="json")
        with self._connect() as db:
            db.execute(
                """
                UPDATE games
                SET title = :title, platform = :platform, genre = :genre, status = :status, rating = :rating,
                    hours_played = :hours_played, release_year = :release_year, updated_at = :now
                WHERE id = :id
                """,
                {**values, "now": _now(), "id": game_id},
            )
        return self.get(game_id)

    def delete(self, game_id) -> bool:
        with self._connect() as db:
            cursor = db.execute("DELETE FROM games WHERE id = ?", (game_id,))
        return cursor.rowcount > 0


def _now():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")
