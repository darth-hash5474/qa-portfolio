from playwright.sync_api import expect


def test_app_loads(page, app_url):
    page.goto(app_url)
    expect(page).to_have_title("Navidrome")
