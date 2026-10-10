import pytest
from fastapi.testclient import TestClient
from app.api import create_app


# A client for a fresh copy of the app with its own database, seeded with twelve games
@pytest.fixture
def client(tmp_path):
    return TestClient(create_app(db_path=tmp_path / "games.db"))
