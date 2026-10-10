import uuid
import requests
from playwright.sync_api import expect
from pages import CreatePlaylistPage, EditPlaylistPage, MainPage, PlaylistDetailsPage, PlaylistListPage


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


def test_playlist_details_show_name_and_comment(logged_in_page, app_url, make_playlist):
    name = f"UI test {uuid.uuid4().hex[:8]}"
    make_playlist(name, comment="Shown on the details page")

    list_page = PlaylistListPage(logged_in_page, app_url)
    list_page.open()
    list_page.row(name).get_by_role("cell", name=name, exact=True).last.click()

    details_page = PlaylistDetailsPage(logged_in_page)
    expect(details_page.title(name)).to_be_visible()
    expect(details_page.comment("Shown on the details page")).to_be_visible()


def test_playlist_can_be_renamed(logged_in_page, app_url, make_playlist, playlist_cleanup):
    old_name = f"UI test {uuid.uuid4().hex[:8]}"
    new_name = f"{old_name} renamed"
    playlist_id = make_playlist(old_name)
    playlist_cleanup.append(new_name)

    edit_page = EditPlaylistPage(logged_in_page, app_url, playlist_id)
    edit_page.open()
    edit_page.rename(new_name)
    expect(edit_page.notification).to_contain_text("Element updated")

    # The change is only sent to the server once the undo notification closes
    expect(edit_page.notification).to_be_hidden(timeout=15000)
    logged_in_page.reload()

    list_page = PlaylistListPage(logged_in_page, app_url)
    list_page.open()
    expect(list_page.row(new_name)).to_be_visible()


def test_playlist_can_be_deleted(logged_in_page, app_url, api_headers, make_playlist):
    name = f"UI test {uuid.uuid4().hex[:8]}"
    playlist_id = make_playlist(name)

    edit_page = EditPlaylistPage(logged_in_page, app_url, playlist_id)
    edit_page.open()
    edit_page.delete_button.click()
    expect(edit_page.notification).to_contain_text("Element deleted")

    # The delete is only sent to the server once the undo notification closes
    expect(edit_page.notification).to_be_hidden(timeout=15000)
    response = requests.get(f"{app_url}/api/playlist/{playlist_id}", headers=api_headers, timeout=10)
    assert response.status_code == 404, f"Playlist still exists on the server: {response.status_code}"

    # A fresh page load no longer lists it
    logged_in_page.reload()
    main_page = MainPage(logged_in_page)
    expect(main_page.settings_button).to_be_visible()
    expect(main_page.sidebar_playlist(name)).to_have_count(0)
