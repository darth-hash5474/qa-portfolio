import hashlib
import hmac
import secrets
import threading
from dataclasses import dataclass

# Starting data: the accounts that can log in. These are demo credentials, not real ones.
SEED_MEMBERS = [
    {"username": "gavin", "name": "Gavin Griffith", "password": "portal-demo-1"},
    {"username": "sam", "name": "Sam Carter", "password": "portal-demo-2"},
]


@dataclass
class Member:
    username: str
    name: str


def hash_password(password: str, salt: bytes) -> bytes:
    return hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)


# Holds the members in memory, with their passwords stored as salted hashes
class Accounts:
    def __init__(self, seed=SEED_MEMBERS):
        self._members = {}
        self._lock = threading.Lock()
        for entry in seed:
            self._add(Member(username=entry["username"], name=entry["name"]), entry["password"])

        # Checked when the username is unknown, so a wrong username takes as long as a wrong password
        self._decoy_salt = secrets.token_bytes(16)
        self._decoy_hash = hash_password(secrets.token_hex(16), self._decoy_salt)

    # Usernames ignore case and surrounding spaces, passwords are compared exactly
    def check_login(self, username: str, password: str) -> Member | None:
        member, salt, expected = self._members.get(username.strip().lower(), (None, self._decoy_salt, self._decoy_hash))
        matches = hmac.compare_digest(hash_password(password, salt), expected)
        return member if matches else None

    def _add(self, member: Member, password: str):
        salt = secrets.token_bytes(16)
        self._members[member.username] = (member, salt, hash_password(password, salt))

    # Adds a new member, or returns None when the username is already taken
    def register(self, username: str, password: str) -> Member | None:
        username = username.strip().lower()
        with self._lock:
            if username in self._members:
                return None
            member = Member(username=username, name=username)
            self._add(member, password)
        return member
