# QA Portfolio

Test automation projects: UI and API suites written in Python against real applications, plus the bugs they found.

| Project | System under test | Status |
|---|---|---|
| [navidrome/](navidrome/) | [Navidrome](https://github.com/navidrome/navidrome), an open-source music server | In progress |
| [game-library/](game-library/) | A small app built as a controlled system under test | Planned |

## Navidrome

Stack: Python, [requests](https://requests.readthedocs.io/), [Playwright](https://playwright.dev/python/), pytest.

### API tests

| Script | What it checks |
|---|---|
| [smoke_test.py](navidrome/api-tests/smoke_test.py) | The server is reachable. |
| [login.py](navidrome/api-tests/login.py) | `POST /auth/login` returns 200 and a JWT. Saves the token for the other scripts. |
| [playlist.py](navidrome/api-tests/playlist.py) | Boundary test: creates a playlist with a 50,000-character name. Expects either a 400, or the name stored intact; if the server silently truncates it, the mismatch is reported and the saved length is checked against 255. |
| [tracks.py](navidrome/api-tests/tracks.py) | Adds tracks to a throwaway playlist through `POST /api/playlist/{id}/tracks`. A control adds real song IDs and expects them saved; the main test sends IDs that don't exist and expects a 400 or 422 with nothing saved. |

### UI tests

| Script | What it checks |
|---|---|
| [smoke_test.py](navidrome/ui-tests/smoke_test.py) | Opens the app in Chromium (headed) and prints the page title. |

### Findings

**Adding tracks to a playlist reports success for invalid track IDs.** Found with [tracks.py](navidrome/api-tests/tracks.py).

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

The API scripts read and write the token with a relative path, so run them from `navidrome/api-tests/`. Run `login.py` first:

```bash
cd navidrome/api-tests
mkdir -p jwt-token
python3 smoke_test.py
python3 login.py
python3 playlist.py
python3 tracks.py
```

`tracks.py` creates and deletes its own playlists. Its control test is skipped when the library has no songs, and the script exits with an `AssertionError` while the bug above is present.

UI smoke test:

```bash
python3 navidrome/ui-tests/smoke_test.py
```
