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
