# Page objects: each class wraps one screen so the tests read as user actions


class LoginPage:
    def __init__(self, page, app_url):
        self.page = page
        self.url = f"{app_url}/app/#/login"
        self.username_input = page.locator("input[name=username]")
        self.password_input = page.locator("input[name=password]")
        self.sign_in_button = page.get_by_role("button", name="Sign in")
        self.error_alert = page.get_by_role("alert")

    def open(self):
        self.page.goto(self.url)

    def login(self, username, password):
        self.username_input.fill(username)
        self.password_input.fill(password)
        self.sign_in_button.click()


class MainPage:
    def __init__(self, page):
        self.page = page
        self.settings_button = page.get_by_role("button", name="Settings")
        self.logout_item = page.get_by_role("menuitem", name="Logout")
        self.heading = page.get_by_role("banner").get_by_role("heading")

    def open_section(self, name):
        self.page.get_by_role("menuitem", name=name, exact=True).click()

    def sidebar_playlist(self, name):
        return self.page.get_by_role("menuitem", name=name, exact=True)

    def logout(self):
        self.settings_button.click()
        self.logout_item.click()


class CreatePlaylistPage:
    def __init__(self, page, app_url):
        self.page = page
        self.url = f"{app_url}/app/#/playlist/create"
        self.name_input = page.get_by_role("textbox", name="Name")
        self.comment_input = page.get_by_role("textbox", name="Comment")
        self.save_button = page.get_by_role("button", name="Save")
        self.notification = page.get_by_role("alert")

    def open(self):
        self.page.goto(self.url)

    def create(self, name, comment=""):
        self.name_input.fill(name)
        if comment:
            self.comment_input.fill(comment)
        self.save_button.click()


class PlaylistListPage:
    def __init__(self, page, app_url):
        self.page = page
        self.url = f"{app_url}/app/#/playlist"

    def open(self):
        self.page.goto(self.url)

    def row(self, name):
        return self.page.get_by_role("row").filter(has_text=name)


class PlaylistDetailsPage:
    def __init__(self, page):
        self.page = page

    def title(self, name):
        return self.page.get_by_role("heading", name=name, exact=True)

    def comment(self, text):
        return self.page.get_by_role("heading", name=text, exact=True)


class EditPlaylistPage:
    def __init__(self, page, app_url, playlist_id):
        self.page = page
        self.url = f"{app_url}/app/#/playlist/{playlist_id}"
        self.name_input = page.get_by_role("textbox", name="Name")
        self.save_button = page.get_by_role("button", name="Save")
        self.delete_button = page.get_by_role("button", name="Delete")
        self.notification = page.get_by_role("alert")

    def open(self):
        self.page.goto(self.url)

    def rename(self, new_name):
        self.name_input.fill(new_name)
        self.save_button.click()


class SongsPage:
    def __init__(self, page, app_url):
        self.page = page
        self.url = f"{app_url}/app/#/song"
        self.search_input = page.get_by_placeholder("Search")
        self.empty_message = page.get_by_text("No results found")
        # Every table row except the header
        self.rows = page.locator("tbody").get_by_role("row")

    def open(self):
        self.page.goto(self.url)

    def row(self, title):
        return self.rows.filter(has_text=title)

    def search(self, text):
        self.search_input.fill(text)
