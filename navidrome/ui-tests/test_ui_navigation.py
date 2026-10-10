import re
import pytest
from playwright.sync_api import expect
from pages import MainPage


def test_signed_out_visitor_is_sent_to_login(page, app_url):
    page.goto(f"{app_url}/app/#/playlist")

    expect(page).to_have_url(re.compile(r"#/login"))
    expect(page.get_by_role("button", name="Sign in")).to_be_visible()


@pytest.mark.parametrize(
    "section, path",
    [
        ("Artists", "#/artist"),
        ("Songs", "#/song"),
        ("Radios", "#/radio"),
        ("Shares", "#/share"),
    ],
)
def test_sidebar_opens_each_section(logged_in_page, section, path):
    main_page = MainPage(logged_in_page)

    main_page.open_section(section)

    expect(logged_in_page).to_have_url(re.compile(re.escape(path)))
    expect(main_page.heading).to_have_text(f"Navidrome - {section}")
