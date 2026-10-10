from enum import Enum
from pydantic import BaseModel


class Platform(str, Enum):
    pc = "PC"
    playstation = "PlayStation"
    xbox = "Xbox"
    switch = "Switch"
    mobile = "Mobile"


class Status(str, Enum):
    backlog = "backlog"
    playing = "playing"
    completed = "completed"
    dropped = "dropped"


class SortField(str, Enum):
    title = "title"
    rating = "rating"
    release_year = "release_year"
    hours_played = "hours_played"
    created_at = "created_at"


class SortOrder(str, Enum):
    asc = "asc"
    desc = "desc"


# The fields a client can set. Types are checked here; the rules live in rules.py.
class GameIn(BaseModel):
    title: str
    platform: Platform
    genre: str = ""
    status: Status = Status.backlog
    rating: int | None = None
    hours_played: float = 0
    release_year: int | None = None


class Game(GameIn):
    id: int
    created_at: str
    updated_at: str


class GamePage(BaseModel):
    items: list[Game]
    total: int
    page: int
    page_size: int
    total_pages: int


class Stats(BaseModel):
    total: int
    by_status: dict[Status, int]
    average_rating: float | None
    total_hours: float
    completion_rate: int


class ResetRequest(BaseModel):
    empty: bool = False
