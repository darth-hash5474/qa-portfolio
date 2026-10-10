"""Business rules for a game. Pure functions, so they can be unit tested directly."""
import math
from dataclasses import dataclass
from app.models import GameIn, Status

TITLE_MAX_LENGTH = 100
GENRE_MAX_LENGTH = 30
RATING_MIN = 1
RATING_MAX = 10
HOURS_MAX = 100000
YEAR_MIN = 1970
YEAR_MAX = 2100


@dataclass
class FieldError:
    field: str
    message: str


# Titles and genres are stored without surrounding spaces
def clean_game(game: GameIn) -> GameIn:
    return game.model_copy(update={"title": game.title.strip(), "genre": game.genre.strip()})


# Checks a cleaned game against the rules and returns every problem found
def validate_game(game: GameIn) -> list[FieldError]:
    errors = []

    if len(game.title) == 0:
        errors.append(FieldError("title", "Title is required."))
    elif len(game.title) >= TITLE_MAX_LENGTH:
        errors.append(FieldError("title", f"Title must be {TITLE_MAX_LENGTH} characters or fewer."))

    if len(game.genre) > GENRE_MAX_LENGTH:
        errors.append(FieldError("genre", f"Genre must be {GENRE_MAX_LENGTH} characters or fewer."))

    # A rating is optional, and only allowed once a game has been started
    if game.rating is not None:
        if not RATING_MIN <= game.rating <= RATING_MAX:
            errors.append(FieldError("rating", f"Rating must be a whole number from {RATING_MIN} to {RATING_MAX}."))
        elif game.status == Status.backlog:
            errors.append(FieldError("rating", "A game in the backlog cannot have a rating."))

    if not math.isfinite(game.hours_played) or not 0 <= game.hours_played <= HOURS_MAX:
        errors.append(FieldError("hours_played", f"Hours played must be a number from 0 to {HOURS_MAX}."))

    if game.release_year is not None and not YEAR_MIN <= game.release_year <= YEAR_MAX:
        errors.append(FieldError("release_year", f"Release year must be a whole number from {YEAR_MIN} to {YEAR_MAX}."))

    return errors
