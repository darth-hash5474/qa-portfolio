"""Entry point for the server: uvicorn app.main:app

Set DB_PATH to choose where the SQLite file lives (default: data/games.db).
"""
import os
from app.api import DEFAULT_DB_PATH, create_app

app = create_app(db_path=os.getenv("DB_PATH", DEFAULT_DB_PATH))
