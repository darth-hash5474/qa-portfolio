from playwright.sync_api import expect
from pages import SongsPage


def test_songs_list_shows_every_track(logged_in_page, app_url, song_titles):
    songs_page = SongsPage(logged_in_page, app_url)
    songs_page.open()

    expect(songs_page.rows).to_have_count(len(song_titles))
    for title in song_titles:
        expect(songs_page.row(title)).to_be_visible()


def test_search_narrows_the_list_to_matching_songs(logged_in_page, app_url, song_titles):
    target = song_titles[0]
    songs_page = SongsPage(logged_in_page, app_url)
    songs_page.open()

    songs_page.search(target)

    expect(songs_page.rows).to_have_count(1)
    expect(songs_page.row(target)).to_be_visible()


def test_search_with_no_match_shows_an_empty_message(logged_in_page, app_url, song_titles):
    songs_page = SongsPage(logged_in_page, app_url)
    songs_page.open()

    songs_page.search("no-song-has-this-title")

    expect(songs_page.empty_message).to_be_visible()
    expect(songs_page.rows).to_have_count(0)
