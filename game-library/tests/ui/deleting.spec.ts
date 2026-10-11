import { expect, test } from "@playwright/test";
import { openFreshLibrary, row, rows, search, stat, toast } from "./helpers";

test.beforeEach(async ({ page, request }) => {
  await openFreshLibrary(page, request);
});

test("Delete asks for confirmation and names the game", async ({ page }) => {
  await page.getByRole("button", { name: "Delete Hades" }).click();

  await expect(page.locator("#delete-dialog")).toBeVisible();
  await expect(page.locator("#delete-message")).toContainText("Hades");
});

test("cancelling the confirmation keeps the game", async ({ page }) => {
  await page.getByRole("button", { name: "Delete Hades" }).click();
  await page.locator("#delete-cancel").click();

  await expect(page.locator("#delete-dialog")).toBeHidden();
  await expect(row(page, "Hades")).toBeVisible();
  await expect(stat(page, "total")).toHaveText("12");
});

test("confirming removes the game", async ({ page }) => {
  await page.getByRole("button", { name: "Delete Hades" }).click();
  await page.locator("#delete-confirm").click();

  await expect(toast(page)).toHaveText("Game deleted");
  await expect(row(page, "Hades")).toHaveCount(0);
  await expect(stat(page, "total")).toHaveText("11");
});

test("HTML in a title is shown as text in the confirmation", async ({ page, request }) => {
  // Create the game through the API, then reload so the page shows it
  const title = "<i>Italic</i>";
  await request.post("/api/games", { data: { title, platform: "PC" } });
  await page.reload();
  await search(page, title);

  await row(page, title).getByRole("button", { name: "Delete" }).click();

  await expect(page.locator("#delete-message")).toContainText(title);
  await expect(page.locator("#delete-message i")).toHaveCount(0);
});

test("deleting the game being edited returns the form to adding", async ({ page }) => {
  await page.getByRole("button", { name: "Edit Hades" }).click();
  await page.getByRole("button", { name: "Delete Hades" }).click();
  await page.locator("#delete-confirm").click();

  await expect(toast(page)).toHaveText("Game deleted");
  await expect(page.locator("#form-heading")).toHaveText("Add a game");
  await expect(page.locator("#title")).toHaveValue("");
});

test("emptying the last page goes back to the previous page", async ({ page }) => {
  // With the list sorted by title, page 2 holds Stardew Valley and Tetris Effect
  await page.getByRole("button", { name: "Next" }).click();
  await expect(rows(page)).toHaveCount(2);

  for (const title of ["Stardew Valley", "Tetris Effect"]) {
    await page.getByRole("button", { name: `Delete ${title}` }).click();
    await page.locator("#delete-confirm").click();
    await expect(row(page, title)).toHaveCount(0);
  }

  await expect(page.getByTestId("page-info")).toHaveText("Page 1 of 1");
  await expect(rows(page)).toHaveCount(10);
});
