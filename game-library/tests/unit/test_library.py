import pytest
from app.library import compute_stats, filter_games, is_duplicate, paginate, sort_games
from app.models import Game, Status


# Builds a game for a test. Only the id and title are needed; the rest have plain defaults.
def make_game(game_id, title, platform="PC", status="playing", rating=None, hours_played=0, release_year=None):
    return Game(
        id=game_id,
        title=title,
        platform=platform,
        status=status,
        rating=rating,
        hours_played=hours_played,
        release_year=release_year,
        created_at="2026-01-01T00:00:00.000+00:00",
        updated_at="2026-01-01T00:00:00.000+00:00",
    )


def titles(games):
    return [game.title for game in games]


# A small library used by the filter and sort tests
@pytest.fixture
def games():
    return [
        make_game(1, "Hades", platform="PC", status="completed", rating=10, hours_played=62, release_year=2020),
        make_game(2, "Halo Infinite", platform="Xbox", status="dropped", rating=5, hours_played=9, release_year=2021),
        make_game(3, "celeste", platform="Switch", status="completed", rating=9, hours_played=14, release_year=2018),
        make_game(4, "Disco Elysium", platform="PC", status="backlog"),
        make_game(5, "Elden Ring", platform="PlayStation", status="playing", rating=9, hours_played=85, release_year=2022),
    ]


# --- filter_games -----------------------------------------------------------

def test_no_filter_returns_every_game(games):
    assert filter_games(games) == games


@pytest.mark.parametrize("search", ["hades", "HADES", "ade", "  Hades  "])
def test_search_matches_any_part_of_the_title_ignoring_case(games, search):
    assert titles(filter_games(games, search=search)) == ["Hades"]


def test_search_can_match_several_games(games):
    assert titles(filter_games(games, search="ha")) == ["Hades", "Halo Infinite"]


def test_search_with_no_match_returns_nothing(games):
    assert filter_games(games, search="zzz") == []


def test_filter_by_status(games):
    assert titles(filter_games(games, status="completed")) == ["Hades", "celeste"]


def test_filter_by_platform(games):
    assert titles(filter_games(games, platform="PC")) == ["Hades", "Disco Elysium"]


def test_search_and_filters_combine(games):
    assert titles(filter_games(games, search="ha", status="completed", platform="PC")) == ["Hades"]


# --- sort_games -------------------------------------------------------------

# Lower case "celeste" must sort with the other titles, not after them
def test_sort_by_title_ignores_case(games):
    assert titles(sort_games(games, "title", "asc")) == [
        "celeste", "Disco Elysium", "Elden Ring", "Hades", "Halo Infinite",
    ]


def test_sort_by_title_descending(games):
    assert titles(sort_games(games, "title", "desc")) == [
        "Halo Infinite", "Hades", "Elden Ring", "Disco Elysium", "celeste",
    ]


# Disco Elysium has no rating, so it comes last in both directions
def test_sort_by_rating_ascending_puts_unrated_last(games):
    assert titles(sort_games(games, "rating", "asc")) == [
        "Halo Infinite", "celeste", "Elden Ring", "Hades", "Disco Elysium",
    ]


def test_sort_by_rating_descending_puts_unrated_last(games):
    assert titles(sort_games(games, "rating", "desc")) == [
        "Hades", "celeste", "Elden Ring", "Halo Infinite", "Disco Elysium",
    ]


def test_sort_by_hours_played_descending(games):
    assert titles(sort_games(games, "hours_played", "desc"))[:3] == ["Elden Ring", "Hades", "celeste"]


def test_sort_by_release_year_ascending_puts_undated_last(games):
    assert titles(sort_games(games, "release_year", "asc")) == [
        "celeste", "Hades", "Halo Infinite", "Elden Ring", "Disco Elysium",
    ]


def test_sort_does_not_change_the_original_list(games):
    before = titles(games)

    sort_games(games, "title", "desc")

    assert titles(games) == before


# --- paginate ---------------------------------------------------------------

def numbered_games(count):
    return [make_game(number, f"Game {number}") for number in range(1, count + 1)]


def test_first_page_holds_the_first_games():
    page = paginate(numbered_games(12), page=1, page_size=10)

    assert [game.id for game in page.items] == list(range(1, 11))
    assert page.total == 12
    assert page.page == 1
    assert page.page_size == 10


def test_last_page_holds_what_is_left():
    page = paginate(numbered_games(12), page=2, page_size=10)

    assert [game.id for game in page.items] == [11, 12]


def test_pages_do_not_overlap_and_cover_every_game():
    games = numbered_games(25)

    seen = []
    for number in range(1, 4):
        seen += [game.id for game in paginate(games, page=number, page_size=10).items]

    assert seen == list(range(1, 26))


def test_page_past_the_end_is_empty():
    page = paginate(numbered_games(12), page=5, page_size=10)

    assert page.items == []
    assert page.total == 12


# The number of pages is the game count divided by the page size, rounded up, and never less than one
@pytest.mark.parametrize(
    "game_count, expected_pages",
    [(0, 1), (1, 1), (9, 1), (10, 1), (11, 2), (20, 2), (21, 3)],
)
def test_total_pages(game_count, expected_pages):
    assert paginate(numbered_games(game_count), page=1, page_size=10).total_pages == expected_pages


# --- compute_stats ----------------------------------------------------------

def test_stats_for_an_empty_library():
    stats = compute_stats([])

    assert stats.total == 0
    assert stats.average_rating is None
    assert stats.total_hours == 0
    assert stats.completion_rate == 0
    assert all(count == 0 for count in stats.by_status.values())


def test_stats_count_games_by_status(games):
    stats = compute_stats(games)

    assert stats.total == 5
    assert stats.by_status[Status.completed] == 2
    assert stats.by_status[Status.playing] == 1
    assert stats.by_status[Status.backlog] == 1
    assert stats.by_status[Status.dropped] == 1


# Ratings are 10, 5, 9 and 9. The unrated game is left out, so the average is 33 / 4.
def test_average_rating_ignores_unrated_games(games):
    assert compute_stats(games).average_rating == 8.2


def test_average_rating_is_rounded_to_one_decimal():
    games = [make_game(1, "A", rating=8), make_game(2, "B", rating=8), make_game(3, "C", rating=9)]

    assert compute_stats(games).average_rating == 8.3


def test_average_rating_is_none_when_nothing_is_rated():
    games = [make_game(1, "A"), make_game(2, "B")]

    assert compute_stats(games).average_rating is None


def test_total_hours_adds_every_game(games):
    assert compute_stats(games).total_hours == 170


# The completion rate is a whole percentage, rounded to the nearest number
@pytest.mark.parametrize(
    "completed, total, expected_rate",
    [(0, 3, 0), (1, 3, 33), (2, 3, 67), (5, 12, 42), (3, 3, 100)],
)
def test_completion_rate(completed, total, expected_rate):
    games = [
        make_game(number, f"Game {number}", status="completed" if number <= completed else "playing")
        for number in range(1, total + 1)
    ]

    assert compute_stats(games).completion_rate == expected_rate


# --- is_duplicate -----------------------------------------------------------

def test_same_title_and_platform_is_a_duplicate(games):
    assert is_duplicate(games, "Hades", "PC")


def test_same_title_on_another_platform_is_not_a_duplicate(games):
    assert not is_duplicate(games, "Hades", "Switch")


def test_a_new_title_is_not_a_duplicate(games):
    assert not is_duplicate(games, "Portal 2", "PC")


def test_duplicate_check_ignores_surrounding_spaces(games):
    assert is_duplicate(games, "  Hades  ", "PC")


@pytest.mark.xfail(strict=True, reason="Known bug: duplicate check is case sensitive")
def test_duplicate_check_ignores_case(games):
    assert is_duplicate(games, "hades", "PC")


# When a game is being edited, it must not count as a duplicate of itself
def test_a_game_is_not_a_duplicate_of_itself(games):
    assert not is_duplicate(games, "Hades", "PC", ignore_id=1)
    assert is_duplicate(games, "Hades", "PC", ignore_id=2)
