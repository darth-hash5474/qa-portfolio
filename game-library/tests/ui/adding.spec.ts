import { expect, test } from "@playwright/test";
import { addGame, fieldError, openFreshLibrary, row, rows, search, stat, toast } from "./helpers";

const DUPLICATE_MESSAGE = "This game is already in the library on that platform.";
const RATING_MESSAGE = "Rating must be a whole number from 1 to 10.";

test.beforeEach(async ({ page, request }) => {
  await openFreshLibrary(page, request);
});

// The empty and spaces-only title cases are covered in library.spec.ts

test("a game that is already in the library on that platform is refused", async ({ page }) => {
  await addGame(page, { title: "Hades", platform: "PC" });

  await expect(page.locator("#form-error")).toHaveText(DUPLICATE_MESSAGE);
  await expect(toast(page)).toBeEmpty();
  await expect(stat(page, "total")).toHaveText("12");
});

test("a backlog game cannot be given a rating", async ({ page }) => {
  await addGame(page, { title: "Unplayed Game", status: "backlog", rating: "5" });

  await expect(fieldError(page, "rating")).toHaveText("A game in the backlog cannot have a rating.");
  await expect(stat(page, "total")).toHaveText("12");
});

for (const rating of ["0", "11"]) {
  test(`a rating of ${rating} is refused`, async ({ page }) => {
    await addGame(page, { title: "Out Of Range", status: "playing", rating });

    await expect(fieldError(page, "rating")).toHaveText(RATING_MESSAGE);
    await expect(stat(page, "total")).toHaveText("12");
  });
}

test("an error message goes away once the field is fixed", async ({ page }) => {
  await addGame(page, {});
  await expect(fieldError(page, "title")).toHaveText("Title is required.");

  await addGame(page, { title: "Fixed Title" });

  await expect(toast(page)).toHaveText("Game added");
  await expect(fieldError(page, "title")).toBeEmpty();
  await expect(page.locator("#title")).not.toHaveAttribute("aria-invalid", "true");
});

test("the form is empty again after a game is added", async ({ page }) => {
  await addGame(page, {
    title: "Full Form Game",
    platform: "Switch",
    genre: "Puzzle",
    status: "completed",
    rating: "8",
    hours: "12.5",
    year: "2020",
  });
  await expect(toast(page)).toHaveText("Game added");

  await expect(page.locator("#title")).toHaveValue("");
  await expect(page.locator("#genre")).toHaveValue("");
  await expect(page.locator("#status")).toHaveValue("backlog");
  await expect(page.locator("#rating")).toHaveValue("");
  await expect(page.locator("#hours_played")).toHaveValue("");
  await expect(page.locator("#release_year")).toHaveValue("");
});

test("a game with no rating or year shows a dash in those columns", async ({ page }) => {
  const title = "No Rating Or Year";
  await addGame(page, { title, status: "playing" });
  await expect(toast(page)).toHaveText("Game added");

  // The new game may be on the second page, so search for it
  await search(page, title);
  const cells = row(page, title).getByRole("cell");

  await expect(cells.nth(4)).toHaveText("–");
  await expect(cells.nth(6)).toHaveText("–");
});

test("HTML in a title is shown as text", async ({ page }) => {
  const title = "<b>Bold</b>";
  await addGame(page, { title });
  await expect(toast(page)).toHaveText("Game added");

  await search(page, title);

  await expect(row(page, title)).toBeVisible();
  await expect(rows(page).locator("b")).toHaveCount(0);
});
