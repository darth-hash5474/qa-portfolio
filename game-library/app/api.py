from pathlib import Path
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.staticfiles import StaticFiles
from app import library
from app.models import Game, GameIn, GamePage, Platform, ResetRequest, SortField, SortOrder, Stats, Status
from app.repository import GameRepository
from app.rules import clean_game, validate_game

STATIC_DIR = Path(__file__).parent / "static"
DEFAULT_DB_PATH = Path(__file__).parent.parent / "data" / "games.db"

DEFAULT_PAGE_SIZE = 10
MAX_PAGE_SIZE = 50


# Builds the app without starting a server, so tests can run it in-process with their own database
def create_app(db_path=DEFAULT_DB_PATH, allow_reset=True) -> FastAPI:
    repository = GameRepository(db_path)
    app = FastAPI(title="Game Library", version="1.0.0")

    # Applies the rules to a request body, in the same error shape FastAPI uses for type errors
    def checked(game: GameIn) -> GameIn:
        game = clean_game(game)
        errors = validate_game(game)
        if errors:
            detail = [{"type": "value_error", "loc": ["body", e.field], "msg": e.message} for e in errors]
            raise HTTPException(status_code=422, detail=detail)
        return game

    def reject_duplicate(game: GameIn, ignore_id=None):
        if library.is_duplicate(repository.list(), game.title, game.platform, ignore_id):
            raise HTTPException(status_code=409, detail="This game is already in the library on that platform.")

    def existing(game_id: int) -> Game:
        game = repository.get(game_id)
        if game is None:
            raise HTTPException(status_code=404, detail="Game not found")
        return game

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    # The choices the front end offers in its dropdowns
    @app.get("/api/config")
    def config():
        return {
            "platforms": [platform.value for platform in Platform],
            "statuses": [status.value for status in Status],
        }

    @app.get("/api/games", response_model=GamePage)
    def list_games(
        search: str = "",
        status: Status | None = None,
        platform: Platform | None = None,
        sort: SortField = SortField.title,
        order: SortOrder = SortOrder.asc,
        page: int = Query(1, ge=1),
        page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    ):
        games = library.filter_games(repository.list(), search, status, platform)
        games = library.sort_games(games, sort, order)
        return library.paginate(games, page, page_size)

    @app.get("/api/games/{game_id}", response_model=Game)
    def get_game(game_id: int):
        return existing(game_id)

    @app.post("/api/games", response_model=Game, status_code=201)
    def create_game(game: GameIn, response: Response):
        game = checked(game)
        reject_duplicate(game)

        created = repository.create(game)
        response.headers["Location"] = f"/api/games/{created.id}"
        return created

    @app.put("/api/games/{game_id}", response_model=Game)
    def update_game(game_id: int, game: GameIn):
        existing(game_id)
        game = checked(game)
        reject_duplicate(game, ignore_id=game_id)
        return repository.update(game_id, game)

    @app.delete("/api/games/{game_id}", status_code=204)
    def delete_game(game_id: int):
        existing(game_id)
        repository.delete(game_id)

    @app.get("/api/stats", response_model=Stats)
    def stats():
        return library.compute_stats(repository.list())

    # Puts the library back to its starting data, or empties it with {"empty": true}. For tests.
    @app.post("/api/test/reset")
    def reset(body: ResetRequest | None = None):
        if not allow_reset:
            raise HTTPException(status_code=404, detail="Not Found")
        if body and body.empty:
            repository.reset(seed=[])
        else:
            repository.reset()
        return {"total": len(repository.list())}

    # Anything else under /api is a 404 rather than a fall through to the front end
    @app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"], include_in_schema=False)
    def unknown_api_route(path: str):
        raise HTTPException(status_code=404, detail="Not Found")

    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
    return app
