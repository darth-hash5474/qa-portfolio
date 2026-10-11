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
  const title = "Sid Meier's Civilization VI";
  await page.getByLabel("title").fill(title);
  await page.locator("#game-form").getByLabel("status").selectOption("playing");
  await page.getByRole("button", {name: "Add Game"}).click();
  await expect(page.locator("#toast")).toHaveText('Game added');
  await page.getByRole("searchbox", {name: "Search"}).fill(title);
  await expect(page.getByRole("cell", {name: title, exact: true})).toBeVisible();
});

// Click add game with an empty form
test("Receive error 'Title is required', and list remains unchanged", async ({page}) => {
  await page.getByRole("button", {name: "Add game"}).click();

  // The message is shown in the paragraph under the Title input, not in the input itself
  await expect(page.locator('[data-error-for="title"]')).toHaveText("Title is required.");

  // Nothing was added: no success message and still twelve games
  await expect(page.locator("#toast")).toBeEmpty();
  await expect(page.getByTestId("stat-total")).toHaveText("12");
});

test("Input title consisting only of spaces", async ({page}) => {
  const space_title = "     ";
  await page.getByLabel("title").fill(space_title);
  await page.getByRole("button", {name: "Add Game"}).click();

  await expect(page.locator('[data-error-for="title"]')).toHaveText("Title is required.");
  await expect(page.getByTestId("stat-total")).toHaveText("12");
});
