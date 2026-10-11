"""Pure functions over a list of games: no database and no HTTP, so they can be unit tested directly."""
import math
from app.models import Game, GamePage, SortField, SortOrder, Stats, Status


def filter_games(games: list[Game], search="", status=None, platform=None) -> list[Game]:
    search = search.strip().lower()
    matching = []

    for game in games:
        if status and game.status != status:
            continue
        if platform and game.platform != platform:
            continue
        if search and search not in game.title.lower():
            continue
        matching.append(game)

    return matching


# Returns a sorted copy. Games with no value for the sort field always come last.
def sort_games(games: list[Game], field=SortField.title, order=SortOrder.asc) -> list[Game]:
    name = SortField(field).value
    with_value = [game for game in games if getattr(game, name) is not None]
    without_value = [game for game in games if getattr(game, name) is None]

    def key(game):
        value = getattr(game, name)
        return value.lower() if isinstance(value, str) else value

    # Sort by id first so games that tie keep a stable order
    with_value.sort(key=lambda game: game.id)
    with_value.sort(key=key, reverse=SortOrder(order) == SortOrder.desc)
    return with_value + without_value


def paginate(games: list[Game], page=1, page_size=10) -> GamePage:
    start = (page - 1) * page_size

    return GamePage(
        items=games[start : start + page_size],
        total=len(games),
        page=page,
        page_size=page_size,
        total_pages=max(1, math.ceil(len(games) / page_size)),
    )


def compute_stats(games: list[Game]) -> Stats:
    by_status = {status: 0 for status in Status}
    for game in games:
        by_status[game.status] += 1

    ratings = [game.rating for game in games if game.rating is not None]

    return Stats(
        total=len(games),
        by_status=by_status,
        # One decimal place, or None when nothing has been rated
        average_rating=round(sum(ratings) / len(ratings), 1) if ratings else None,
        total_hours=round(sum(game.hours_played for game in games), 1),
        # Whole percentage of games that are completed
        completion_rate=round(by_status[Status.completed] / len(games) * 100) if games else 0,
    )


# The same title on the same platform counts as a duplicate
def is_duplicate(games: list[Game], title, platform, ignore_id=None) -> bool:
    return any(
        game.id != ignore_id and game.platform == platform and game.title.strip() == title.strip()
        for game in games
    )
