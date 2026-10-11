import pytest
from app.models import GameIn
from app.rules import clean_game, validate_game


# A game that follows every rule. Pass fields to change just the ones a test cares about.
def make_game(**fields):
    values = {"title": "Portal 2", "platform": "PC", "status": "playing"}
    values.update(fields)
    return GameIn(**values)


# The names of the fields that validate_game complains about
def error_fields(game):
    return [error.field for error in validate_game(game)]


# Starter test: a game that follows every rule has no errors
def test_valid_game_has_no_errors():
    game = GameIn(title="Portal 2", platform="PC", status="completed", rating=10, hours_played=12)

    assert validate_game(game) == []


def test_only_title_and_platform_are_needed():
    game = GameIn(title="Portal 2", platform="PC")

    assert validate_game(game) == []


# --- Cleaning ---------------------------------------------------------------

def test_clean_game_trims_title_and_genre():
    game = clean_game(make_game(title="  Portal 2  ", genre="  Puzzle "))

    assert game.title == "Portal 2"
    assert game.genre == "Puzzle"


def test_clean_game_leaves_other_fields_alone():
    game = clean_game(make_game(rating=8, hours_played=12.5, release_year=2011))

    assert game.rating == 8
    assert game.hours_played == 12.5
    assert game.release_year == 2011


# --- Title ------------------------------------------------------------------

def test_empty_title_is_an_error():
    assert error_fields(make_game(title="")) == ["title"]


# A title of only spaces is empty once it has been cleaned
def test_spaces_only_title_is_an_error_after_cleaning():
    game = clean_game(make_game(title="     "))

    assert error_fields(game) == ["title"]


@pytest.mark.parametrize("length", [1, 99])
def test_title_within_the_limit_is_valid(length):
    assert error_fields(make_game(title="T" * length)) == []


# Title boundary: 100 characters is the longest title the spec allows
@pytest.mark.xfail(strict=True, reason="Known bug: a title of exactly 100 characters is rejected")
def test_title_of_100_characters_is_valid():
    assert error_fields(make_game(title="T" * 100)) == []


def test_title_of_101_characters_is_an_error():
    assert error_fields(make_game(title="T" * 101)) == ["title"]


# --- Genre ------------------------------------------------------------------

@pytest.mark.parametrize("length", [0, 30])
def test_genre_within_the_limit_is_valid(length):
    assert error_fields(make_game(genre="G" * length)) == []


def test_genre_of_31_characters_is_an_error():
    assert error_fields(make_game(genre="G" * 31)) == ["genre"]


# --- Rating -----------------------------------------------------------------

@pytest.mark.parametrize("rating", [None, 1, 5, 10])
def test_rating_within_range_is_valid(rating):
    assert error_fields(make_game(rating=rating)) == []


@pytest.mark.parametrize("rating", [-1, 0, 11, 100])
def test_rating_out_of_range_is_an_error(rating):
    assert error_fields(make_game(rating=rating)) == ["rating"]


def test_backlog_game_cannot_have_a_rating():
    errors = validate_game(make_game(status="backlog", rating=5))

    assert [error.field for error in errors] == ["rating"]
    assert errors[0].message == "A game in the backlog cannot have a rating."


def test_backlog_game_without_a_rating_is_valid():
    assert error_fields(make_game(status="backlog")) == []


@pytest.mark.parametrize("status", ["playing", "completed", "dropped"])
def test_started_games_can_have_a_rating(status):
    assert error_fields(make_game(status=status, rating=5)) == []


# --- Hours played -----------------------------------------------------------

@pytest.mark.parametrize("hours", [0, 0.5, 100000])
def test_hours_within_range_are_valid(hours):
    assert error_fields(make_game(hours_played=hours)) == []


@pytest.mark.parametrize("hours", [-0.5, 100000.5, float("inf"), float("nan")])
def test_hours_out_of_range_are_an_error(hours):
    assert error_fields(make_game(hours_played=hours)) == ["hours_played"]


# --- Release year -----------------------------------------------------------

@pytest.mark.parametrize("year", [None, 1970, 2100])
def test_release_year_within_range_is_valid(year):
    assert error_fields(make_game(release_year=year)) == []


@pytest.mark.parametrize("year", [1969, 2101])
def test_release_year_out_of_range_is_an_error(year):
    assert error_fields(make_game(release_year=year)) == ["release_year"]


# --- Several problems at once -----------------------------------------------

def test_every_problem_is_reported():
    game = make_game(title="", genre="G" * 31, rating=11, hours_played=-1, release_year=1900)

    assert error_fields(game) == ["title", "genre", "rating", "hours_played", "release_year"]
