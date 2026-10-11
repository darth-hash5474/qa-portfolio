import { expect, test } from "@playwright/test";
import { addGame, fillForm, openFreshLibrary, row, stat, toast } from "./helpers";

test.beforeEach(async ({ page, request }) => {
  await openFreshLibrary(page, request);
});

test("Edit fills the form with the game's values", async ({ page }) => {
  await page.getByRole("button", { name: "Edit Celeste" }).click();

  await expect(page.locator("#form-heading")).toHaveText("Edit game");
  await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

  await expect(page.locator("#title")).toHaveValue("Celeste");
  await expect(page.locator("#platform")).toHaveValue("Switch");
  await expect(page.locator("#genre")).toHaveValue("Platformer");
  await expect(page.locator("#status")).toHaveValue("completed");
  await expect(page.locator("#rating")).toHaveValue("9");
  await expect(page.locator("#hours_played")).toHaveValue("14");
  await expect(page.locator("#release_year")).toHaveValue("2018");
});

test("a changed title is saved and shown in the list", async ({ page }) => {
  await page.getByRole("button", { name: "Edit Celeste" }).click();
  await fillForm(page, { title: "Celeste Deluxe" });
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(toast(page)).toHaveText("Game updated");
  await expect(row(page, "Celeste Deluxe")).toBeVisible();
  await expect(row(page, "Celeste")).toHaveCount(0);
  await expect(stat(page, "total")).toHaveText("12");
});

test("every field can be changed", async ({ page }) => {
  await page.getByRole("button", { name: "Edit Celeste" }).click();
  await fillForm(page, {
    title: "Celeste Classic",
    platform: "PC",
    genre: "Arcade",
    status: "playing",
    rating: "7",
    hours: "20.5",
    year: "2019",
  });
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(toast(page)).toHaveText("Game updated");

  // The columns are title, platform, genre, status, rating, hours, year and then the buttons
  const cells = row(page, "Celeste Classic").getByRole("cell");
  await expect(cells.nth(1)).toHaveText("PC");
  await expect(cells.nth(2)).toHaveText("Arcade");
  await expect(cells.nth(3)).toHaveText("playing");
  await expect(cells.nth(4)).toHaveText("7");
  await expect(cells.nth(5)).toHaveText("20.5");
  await expect(cells.nth(6)).toHaveText("2019");
});

test("a game cannot be edited into a duplicate of another", async ({ page }) => {
  // Hollow Knight is already in the library on Switch, the same platform as Celeste
  await page.getByRole("button", { name: "Edit Celeste" }).click();
  await fillForm(page, { title: "Hollow Knight" });
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.locator("#form-error")).toHaveText("This game is already in the library on that platform.");
  await expect(row(page, "Celeste")).toBeVisible();
  await expect(row(page, "Hollow Knight")).toHaveCount(1);
});

test("Cancel abandons the edit", async ({ page }) => {
  await page.getByRole("button", { name: "Edit Celeste" }).click();
  await fillForm(page, { title: "Changed My Mind" });
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page.locator("#form-heading")).toHaveText("Add a game");
  await expect(page.locator("#title")).toHaveValue("");
  await expect(page.getByRole("button", { name: "Cancel" })).toBeHidden();
  await expect(row(page, "Celeste")).toBeVisible();
  await expect(row(page, "Changed My Mind")).toHaveCount(0);
});

test("after cancelling an edit, the form adds a new game", async ({ page }) => {
  test.fail(true, "Known bug: after Edit then Cancel, adding a game overwrites the game that was being edited");

  await page.getByRole("button", { name: "Edit Celeste" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();

  await addGame(page, { title: "Brand New Game" });

  await expect(toast(page)).toHaveText("Game added");
  await expect(stat(page, "total")).toHaveText("13");
  await expect(row(page, "Brand New Game")).toBeVisible();
  await expect(row(page, "Celeste")).toBeVisible();
});

test("clicking Edit on a second game replaces the first in the form", async ({ page }) => {
  await page.getByRole("button", { name: "Edit Celeste" }).click();
  await page.getByRole("button", { name: "Edit Hades" }).click();

  await expect(page.locator("#title")).toHaveValue("Hades");
  await expect(page.locator("#platform")).toHaveValue("PC");
});
