# QA Portfolio

Test automation projects: UI and API suites written in Python against real applications, plus the bugs they found.

| Project | System under test | Status |
|---|---|---|
| [navidrome/](navidrome/) | [Navidrome](https://github.com/navidrome/navidrome), an open-source music server | In progress |
| [game-library/](game-library/) | A small app built as a controlled system under test | Planned |

## Navidrome

[![Navidrome tests](https://github.com/darth-hash5474/qa-portfolio/actions/workflows/navidrome.yml/badge.svg)](https://github.com/darth-hash5474/qa-portfolio/actions/workflows/navidrome.yml)

Stack: Python, [requests](https://requests.readthedocs.io/), [Playwright](https://playwright.dev/python/), pytest, pytest-playwright.

### API tests

| Test file | What it checks |
|---|---|
| [test_smoke.py](navidrome/api-tests/test_smoke.py) | The server is reachable. |
| [test_auth.py](navidrome/api-tests/test_auth.py) | Requests with no token, an empty token or a made-up token get a 401. |
| [test_login.py](navidrome/api-tests/test_login.py) | `POST /auth/login` returns 200 and a JWT; a wrong password gets a 401 and no token. |
| [test_playlist.py](navidrome/api-tests/test_playlist.py) | Playlist lifecycle (create, read, rename, delete), 404s for a playlist that doesn't exist, rejection of malformed JSON and wrong-typed names, special characters stored intact, pagination and filtering by name. Boundary tests: a 50,000-character name must be refused or stored intact, and a playlist without a name must be refused. |
| [test_subsonic.py](navidrome/api-tests/test_subsonic.py) | Subsonic API ping succeeds with valid credentials and reports error 40 for a wrong password. |
| [test_tracks.py](navidrome/api-tests/test_tracks.py) | Adds tracks to a playlist through `POST /api/playlist/{id}/tracks`. A control adds real song IDs and expects them saved. Two more tests send IDs that don't exist, alone and mixed with real ones, and expect a rejection or an `added` count that matches what was saved. |

Shared setup lives in [conftest.py](navidrome/api-tests/conftest.py): one login per run, and a fixture that deletes any playlist a test creates.

### UI tests

| Test file | What it checks |
|---|---|
| [test_ui_smoke.py](navidrome/ui-tests/test_ui_smoke.py) | The app loads in Chromium with the right title. |
| [test_ui_login.py](navidrome/ui-tests/test_ui_login.py) | A valid login opens the library, a wrong password shows an "Unauthorized" error and stays on the login page, and logout returns to the login page. |
| [test_ui_playlist.py](navidrome/ui-tests/test_ui_playlist.py) | Save is disabled until a playlist has a name, and a playlist created through the form appears in the sidebar. |

Screens are wrapped in page objects in [pages.py](navidrome/ui-tests/pages.py). [conftest.py](navidrome/ui-tests/conftest.py) signs in once through the login form and reuses that browser state, and deletes any playlist a test creates.

### Findings

**Adding tracks to a playlist reports success for invalid track IDs.** Found with [test_tracks.py](navidrome/api-tests/test_tracks.py). Reported upstream as [navidrome/navidrome#6310](https://github.com/navidrome/navidrome/issues/6310).

- **Version:** Navidrome 0.64.2
- **Steps:** `POST /api/playlist/{id}/tracks` with an `ids` array containing non-existent or malformed track IDs, alone or mixed with real ones.
- **Expected:** the request is rejected with 400 Bad Request or 422 Unprocessable Entity, or `added` reports the number of tracks actually saved.
- **Actual:** the server returns 200 OK and `added` counts every ID sent. 3 real IDs plus 2 invalid ones gives `{"added":5}` with 3 tracks saved; 7 invalid IDs gives `{"added":7}` with 0 saved.
- **Impact:** the response tells the client the tracks were added, so its state is out of sync with the saved playlist.

**The API creates playlists with no name.** Found with [test_playlist.py](navidrome/api-tests/test_playlist.py).

- **Version:** Navidrome 0.64.2
- **Steps:** `POST /api/playlist` with `{"name": ""}`, `{"name": "   "}` or no `name` field at all.
- **Expected:** the request is rejected with 400 or 422. The web form marks the name as required and keeps Save disabled without one.
- **Actual:** the server returns 200 OK and creates the playlist with the name stored as sent.
- **Impact:** the rule the UI enforces can be bypassed through the API, leaving playlists with nothing to identify them by.

### Continuous integration

[navidrome.yml](.github/workflows/navidrome.yml) runs on every push and pull request that touches `navidrome/`. It starts the test server with Docker Compose, seeds the tracks, runs both suites, and uploads HTML reports (plus Playwright traces for any failed UI test) as a build artifact.

### Running the tests

You need Python 3 and Docker.

```bash
# Install dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install -r navidrome/requirements.txt
playwright install chromium

# Configure the credentials
cp navidrome/.env.example navidrome/.env   # then set USERNAME=admin and choose a PASSWORD
```

Start the test server. [docker-compose.yml](navidrome/docker-compose.yml) runs Navidrome 0.64.2 on `http://localhost:8080` and creates the `admin` user with the password from `.env`:

```bash
cd navidrome
docker compose up -d
```

Add some music. The track tests need real songs, so [seed.py](navidrome/seed.py) generates five short tagged tones with the ffmpeg inside the container and waits for Navidrome to scan them:

```bash
python seed.py
```

Run the tests:

```bash
pytest api-tests -v
pytest ui-tests -v      # headless by default; add --headed to watch the browser
```

Two results are expected besides passes: the tests for the bugs above are marked `xfail` while those bugs are present, and the tests that need real tracks are skipped when the library has no songs.

To run against your own Navidrome server instead, point `URL`, `USERNAME` and `PASSWORD` in `.env` at it. Navidrome allows 5 logins per 20 seconds by default and a full run of both suites uses all 5, so a second run started straight after the first fails with `429 Too Many Requests`. The compose file turns that limit off.
