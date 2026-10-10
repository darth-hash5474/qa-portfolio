# QA Portfolio

Test automation projects: UI and API suites written in Python against real applications, plus the bugs they found.

| Project | System under test | Status |
|---|---|---|
| [navidrome/](navidrome/) | [Navidrome](https://github.com/navidrome/navidrome), an open-source music server | In progress |
| [game-library/](game-library/) | A small app built as a controlled system under test | Planned |

## Navidrome

Stack: Python, [requests](https://requests.readthedocs.io/), [Playwright](https://playwright.dev/python/), pytest, pytest-playwright.

### API tests

| Test file | What it checks |
|---|---|
| [test_smoke.py](navidrome/api-tests/test_smoke.py) | The server is reachable. |
| [test_login.py](navidrome/api-tests/test_login.py) | `POST /auth/login` returns 200 and a JWT. |
| [test_playlist.py](navidrome/api-tests/test_playlist.py) | Boundary test: creates a playlist with a 50,000-character name. Passes if the server refuses it with a 400 or stores it intact; fails if the name is silently truncated. |
| [test_tracks.py](navidrome/api-tests/test_tracks.py) | Adds tracks to a playlist through `POST /api/playlist/{id}/tracks`. A control adds real song IDs and expects them saved; the main test sends IDs that don't exist and expects a 400 or 422 with nothing saved. |

Shared setup lives in [conftest.py](navidrome/api-tests/conftest.py): one login per run, and a fixture that deletes any playlist a test creates.

### UI tests

| Test file | What it checks |
|---|---|
| [test_ui_smoke.py](navidrome/ui-tests/test_ui_smoke.py) | The app loads in Chromium with the right title. |
| [test_ui_login.py](navidrome/ui-tests/test_ui_login.py) | A valid login opens the library, a wrong password shows an "Unauthorized" error and stays on the login page, and logout returns to the login page. |
| [test_ui_playlist.py](navidrome/ui-tests/test_ui_playlist.py) | Save is disabled until a playlist has a name, and a playlist created through the form appears in the sidebar. |

Screens are wrapped in page objects in [pages.py](navidrome/ui-tests/pages.py). [conftest.py](navidrome/ui-tests/conftest.py) signs in once through the login form and reuses that browser state, and deletes any playlist a test creates.

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

UI tests (headless by default; add `--headed` to watch the browser):

```bash
pytest navidrome/ui-tests -v
```

Navidrome allows 5 logins per 20 seconds and a full run uses 4, so a second run started straight after the first fails with `429 Too Many Requests`. Wait 20 seconds between runs, or start the test server with `ND_AUTHREQUESTLIMIT=0` to turn the limit off.
