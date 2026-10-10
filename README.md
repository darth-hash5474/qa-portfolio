# QA Portfolio

Test automation projects: UI and API suites written in Python against real applications, plus the bugs they found.

| Project | System under test | Status |
|---|---|---|
| [navidrome/](navidrome/) | [Navidrome](https://github.com/navidrome/navidrome), an open-source music server | In progress |
| [game-library/](game-library/) | A small app built as a controlled system under test | Planned |

## Navidrome

Stack: Python, [requests](https://requests.readthedocs.io/), [Playwright](https://playwright.dev/python/), pytest.

### API tests

| Test file | What it checks |
|---|---|
| [test_smoke.py](navidrome/api-tests/test_smoke.py) | The server is reachable. |
| [test_login.py](navidrome/api-tests/test_login.py) | `POST /auth/login` returns 200 and a JWT. |
| [test_playlist.py](navidrome/api-tests/test_playlist.py) | Boundary test: creates a playlist with a 50,000-character name. Passes if the server refuses it with a 400 or stores it intact; fails if the name is silently truncated. |
| [test_tracks.py](navidrome/api-tests/test_tracks.py) | Adds tracks to a playlist through `POST /api/playlist/{id}/tracks`. A control adds real song IDs and expects them saved; the main test sends IDs that don't exist and expects a 400 or 422 with nothing saved. |

Shared setup lives in [conftest.py](navidrome/api-tests/conftest.py): one login per run, and a fixture that deletes any playlist a test creates.

### UI tests

| Script | What it checks |
|---|---|
| [smoke_test.py](navidrome/ui-tests/smoke_test.py) | Opens the app in Chromium (headed) and prints the page title. |

### Findings

**Adding tracks to a playlist reports success for invalid track IDs.** Found with [test_tracks.py](navidrome/api-tests/test_tracks.py).

- **Version:** Navidrome 0.64.2
- **Steps:** `POST /api/playlist/{id}/tracks` with an `ids` array containing only non-existent or malformed track IDs.
- **Expected:** the request is rejected with 400 Bad Request or 422 Unprocessable Entity.
- **Actual:** the server returns 200 OK with `{"added":7}` for 7 invalid IDs, but the playlist has 0 tracks afterwards.
- **Impact:** the response tells the client the tracks were added, so its state is out of sync with the saved playlist.

### Running the tests

You need Python 3 and a running Navidrome instance with a user account.

```bash
# Install dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install -r navidrome/requirements.txt
playwright install chromium

# Configure the server URL and credentials
cp navidrome/.env.example navidrome/.env   # then fill in USERNAME and PASSWORD
```

API tests:

```bash
pytest navidrome/api-tests -v
```

Two results are expected besides passes: the invalid track ID test is marked `xfail` while the bug above is present, and the valid track control is skipped when the library has no songs.

UI smoke test:

```bash
python3 navidrome/ui-tests/smoke_test.py
```
