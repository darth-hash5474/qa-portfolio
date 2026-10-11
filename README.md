# QA Portfolio

Test automation projects: UI and API suites written in Python against real applications, plus the bugs they found.

| Project | System under test | Status |
|---|---|---|
| [navidrome/](navidrome/) | [Navidrome](https://github.com/navidrome/navidrome), an open-source music server | In progress |
| [game-library/](game-library/) | A small game library manager (FastAPI, SQLite, HTML and JavaScript) built as a controlled system under test, with bugs planted for the tests to find | In progress |
| [portfolio-site/](portfolio-site/) | The portfolio site itself: a static page listing the projects, skills and findings, tested with Playwright and axe | In progress |

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
| [test_tracks.py](navidrome/api-tests/test_tracks.py) | Adds tracks to a playlist through `POST /api/playlist/{id}/tracks`. A control adds real song IDs and expects them saved. Two more tests send IDs that don't exist, alone and mixed with real ones, and expect either a rejection or an `added` count that matches what was saved. |

Shared setup lives in [conftest.py](navidrome/api-tests/conftest.py): one login per run, and a fixture that deletes any playlist a test creates.

### UI tests

| Test file | What it checks |
|---|---|
| [test_ui_smoke.py](navidrome/ui-tests/test_ui_smoke.py) | The app loads in Chromium with the right title. |
| [test_ui_login.py](navidrome/ui-tests/test_ui_login.py) | A valid login opens the library, a wrong password shows an "Unauthorized" error and stays on the login page, and logout returns to the login page. |
| [test_ui_navigation.py](navidrome/ui-tests/test_ui_navigation.py) | A signed-out visitor is sent to the login page, and each sidebar link opens its section. |
| [test_ui_playlist.py](navidrome/ui-tests/test_ui_playlist.py) | Save is disabled until a playlist has a name, a playlist created through the form appears in the sidebar, the details page shows its name and comment, and a playlist can be renamed and deleted from the edit form. |
| [test_ui_songs.py](navidrome/ui-tests/test_ui_songs.py) | The songs list shows every seeded track, search narrows it to the matching song, and a search with no match shows an empty message. |

Screens are wrapped in page objects in [pages.py](navidrome/ui-tests/pages.py). [conftest.py](navidrome/ui-tests/conftest.py) signs in once through the login form and reuses that browser state, creates test playlists through the API, and deletes any playlist a test creates.

### Findings

**Adding tracks to a playlist reports success for invalid track IDs.** Found with [test_tracks.py](navidrome/api-tests/test_tracks.py). Reported upstream as [navidrome/navidrome#6310](https://github.com/navidrome/navidrome/issues/6310) and confirmed by the maintainer.

- **Version:** Navidrome 0.64.2
- **Steps:** `POST /api/playlist/{id}/tracks` with an `ids` array containing non-existent or malformed track IDs, alone or mixed with real ones.
- **Expected:** the request is rejected with 400 Bad Request or 422 Unprocessable Entity, or `added` reports the number of tracks actually saved.
- **Actual:** the server returns 200 OK and `added` counts every ID sent. 3 real IDs plus 2 invalid ones gives `{"added":5}` with 3 tracks in the playlist; 7 invalid IDs gives `{"added":7}` with none.
- **Impact:** the response tells the client the tracks were added, so its state is out of sync with the saved playlist.
- **Cause, from the maintainer:** users with access to all libraries bypassed the track ID check, so the unknown IDs were stored as orphan entries and counted.
- **Status:** fixed in [PR #6313](https://github.com/navidrome/navidrome/pull/6313), not yet released. Verified against that PR's build: the same requests now return `{"added":3}` and `{"added":0}`. The two tests stay marked as expected failures until the test server moves to a release with the fix.

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

## Game Library

[![Game Library tests](https://github.com/darth-hash5474/qa-portfolio/actions/workflows/game-library.yml/badge.svg)](https://github.com/darth-hash5474/qa-portfolio/actions/workflows/game-library.yml)

A game library manager built to be tested: add, edit, delete, search, filter, sort and page through games, with a stats panel. Because the app is ours, it can be tested at every level. It has four bugs planted in it on purpose, two in the API and two in the UI, with nothing in the code marking where they are.

Stack: Python, [FastAPI](https://fastapi.tiangolo.com/), SQLite, plain HTML and JavaScript. Unit and API tests use pytest; UI tests use [Playwright](https://playwright.dev/) in TypeScript.

### Expected behaviour

This is the specification the app is tested against.

- **Title:** required, stored without surrounding spaces, 1 to 100 characters.
- **Platform:** one of PC, PlayStation, Xbox, Switch, Mobile.
- **Status:** one of backlog, playing, completed, dropped. Defaults to backlog.
- **Genre:** optional, up to 30 characters.
- **Rating:** optional whole number from 1 to 10. A game in the backlog cannot have one.
- **Hours played:** a number from 0 to 100,000. Defaults to 0.
- **Release year:** optional whole number from 1970 to 2100.
- **Duplicates:** the same title on the same platform is rejected with a 409, ignoring letter case and surrounding spaces.
- **Creating** answers 201 with the new game; **editing** saves every field and answers 200; **deleting** answers 204 and the game is gone. A game that doesn't exist answers 404, and a request that breaks a rule answers 422 naming the field.
- **Search** matches any part of the title, ignoring letter case, and combines with the status and platform filters.
- **Sorting** follows the label of the chosen option. Games with no value for the sort field come last.
- **Paging:** ten games per page. The number of pages is the number of matching games divided by the page size, rounded up, and never less than one.
- **Stats:** average rating is taken over rated games only, to one decimal place. Completion rate is the share of completed games as a rounded whole percentage.
- **In the UI:** the count under the list is the total number of matching games; Cancel abandons an edit and returns the form to adding; the stats panel updates after every change; anything a user typed is shown as text, never treated as HTML.

### Findings

Planted bugs found: 4 of 4.

**A title of exactly 100 characters is rejected.** Found with [test_game_post.py](game-library/tests/api/test_game_post.py).

- **Steps:** `POST /api/games` with a 100-character title and otherwise valid fields.
- **Expected:** 201 and the game is created. The spec allows titles of 1 to 100 characters.
- **Actual:** 422 with "Title must be 100 characters or fewer."
- **Notes:** a 99-character title is accepted and a 101-character title is rejected, so the upper boundary is off by one.

**A duplicate title in a different letter case is accepted.** Found with [test_game_duplicates.py](game-library/tests/api/test_game_duplicates.py).

- **Steps:** with "Hades" on PC already in the library, `POST /api/games` with title "hades" and platform PC.
- **Expected:** 409. The spec says duplicates are detected ignoring letter case.
- **Actual:** 201 and a second copy of the game is created.
- **Notes:** the same request with the title spelled "Hades" is correctly rejected with a 409, so only the case-insensitive part of the check is missing.

**Adding a game after cancelling an edit overwrites the edited game.** Found with [editing.spec.ts](game-library/tests/ui/editing.spec.ts).

- **Steps:** click Edit on a game, click Cancel, then fill in the form with a new title and click "Add game".
- **Expected:** "Game added", the library grows by one and the game that was opened for editing is untouched. The spec says Cancel abandons the edit and returns the form to adding.
- **Actual:** "Game updated". The game that was opened for editing is replaced by the new one and the total does not change.
- **Notes:** the form looks reset after Cancel (heading, button and fields), so nothing on screen warns that the next save is still an edit.

**The count under the list shows the games on the page, not the total.** Found with [paging.spec.ts](game-library/tests/ui/paging.spec.ts).

- **Steps:** open the library with its twelve seeded games and read the count under the list.
- **Expected:** "12 games" on every page. The spec says the count is the total number of matching games.
- **Actual:** "10 games" on page 1 and "2 games" on page 2.
- **Notes:** the stats panel correctly shows a total of 12, so the two numbers on the same screen disagree.

### Continuous integration

[game-library.yml](.github/workflows/game-library.yml) runs the unit, API and UI tests on every push and pull request that touches `game-library/`, and uploads the Playwright report as a build artifact. Tests for the planted bugs are marked as expected failures, so the build is green while the bugs are present.

### Running it

```bash
cd game-library
pip install -r requirements.txt
uvicorn app.main:app --port 8000        # the app, at http://localhost:8000 (API docs at /docs)
```

```bash
pytest tests/unit        # rules and library logic, no server needed
pytest tests/api         # the API, run in-process against a temporary database
npm install && npx playwright install chromium
npm run test:ui          # the UI; starts the app itself
```

`POST /api/test/reset` puts the library back to its twelve starting games.

## Portfolio site

[![Portfolio site](https://github.com/darth-hash5474/qa-portfolio/actions/workflows/portfolio-site.yml/badge.svg)](https://github.com/darth-hash5474/qa-portfolio/actions/workflows/portfolio-site.yml)

A single static page, plain HTML and CSS with no build step, in [portfolio-site/site/](portfolio-site/site/). Every claim on it links to the code that backs it, and the tests enforce that.

| Test file | What it checks |
|---|---|
| [content.spec.ts](portfolio-site/tests/content.spec.ts) | The introduction, the header links, both projects with their findings, and that every opening claim and every skill carries a link to evidence. |
| [links.spec.ts](portfolio-site/tests/links.spec.ts) | Every link has a destination and readable text, in-page links point at real sections, and every link into this repository points at a file or folder that exists. |
| [accessibility.spec.ts](portfolio-site/tests/accessibility.spec.ts) | An axe scan against WCAG 2.1 AA on desktop and phone, heading order, the skip link, and reaching every link by keyboard. |
| [layout.spec.ts](portfolio-site/tests/layout.spec.ts) | No sideways scrolling from 320px to 1920px wide, the column layout at each size, and reduced-motion behaviour. |

[portfolio-site.yml](.github/workflows/portfolio-site.yml) runs these on every push that touches the site and, when they pass on `main`, publishes the site to GitHub Pages.

```bash
cd portfolio-site
npm install && npx playwright install chromium
npm start        # serves the site at http://localhost:4173
npm test         # runs the tests; starts the server itself
```
