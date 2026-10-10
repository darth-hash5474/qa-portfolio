import re
from playwright.sync_api import expect
from conftest import HOME_URL
from pages import LoginPage, MainPage

LOGIN_URL = re.compile(r"#/login")


def test_valid_login_opens_the_library(page, app_url, credentials):
    login_page = LoginPage(page, app_url)
    login_page.open()
    login_page.login(*credentials)

    expect(page).to_have_url(HOME_URL)
    expect(MainPage(page).settings_button).to_be_visible()


def test_wrong_password_shows_an_error(page, app_url, credentials):
    username, _ = credentials
    login_page = LoginPage(page, app_url)
    login_page.open()
    login_page.login(username, "definitely-the-wrong-password")

    expect(login_page.error_alert).to_contain_text("Unauthorized")
    expect(page).to_have_url(LOGIN_URL)


def test_logout_returns_to_the_login_page(logged_in_page):
    MainPage(logged_in_page).logout()

    expect(logged_in_page).to_have_url(LOGIN_URL)
    expect(logged_in_page.get_by_role("button", name="Sign in")).to_be_visible()
