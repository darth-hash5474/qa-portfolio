import { expect, test } from "@playwright/test";

// Put the library back to its twelve seeded games before every test
test.beforeEach(async ({ page, request }) => {
  await request.post("/api/test/reset");
  await page.goto("/");
});

// Starter test: the first page of the list shows ten games
test("the library lists the first page of games", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Game Library" })).toBeVisible();
  await expect(page.locator("#games-body tr")).toHaveCount(10);
  await expect(page.getByTestId("page-info")).toHaveText("Page 1 of 2");
});

// Add a game to the library
test("A new game appears in the list", async ({page}) => {
  const title = "Sid Meier's Civilization VI"
  await page.getByLabel("title").fill(title);
  await page.locator("#game-form").getByLabel("status").selectOption("playing");
  await page.getByRole("button", {name: "Add Game"}).click();
  await expect(page.locator("#toast")).toHaveText('Game added');
  await page.getByRole("searchbox", {name: "Search"}).fill(title);
  await expect(page.getByRole("cell", {name: title, exact: true})).toBeVisible();
});