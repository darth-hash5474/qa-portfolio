import uuid
from playwright.sync_api import expect
from pages import CreatePlaylistPage, MainPage


def test_save_is_disabled_until_a_name_is_entered(logged_in_page, app_url):
    create_page = CreatePlaylistPage(logged_in_page, app_url)
    create_page.open()

    expect(create_page.save_button).to_be_disabled()

    create_page.name_input.fill("Any name")
    expect(create_page.save_button).to_be_enabled()


def test_created_playlist_appears_in_the_sidebar(logged_in_page, app_url, playlist_cleanup):
    # A unique name so the test can find its own playlist among existing ones
    name = f"UI test {uuid.uuid4().hex[:8]}"
    playlist_cleanup.append(name)

    create_page = CreatePlaylistPage(logged_in_page, app_url)
    create_page.open()
    create_page.create(name, comment="Created by the Playwright UI suite")

    expect(create_page.notification).to_contain_text("Element created")
    expect(MainPage(logged_in_page).sidebar_playlist(name)).to_be_visible()
