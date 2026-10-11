import { expect, test } from "@playwright/test";
import { openFreshLibrary, rows, search } from "./helpers";

test.beforeEach(async ({ page, request }) => {
  await openFreshLibrary(page, request);
});

test("the first page has Previous disabled and Next enabled", async ({ page }) => {
  await expect(page.getByTestId("page-info")).toHaveText("Page 1 of 2");
  await expect(page.getByRole("button", { name: "Previous" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Next" })).toBeEnabled();
});

test("the last page has Next disabled and Previous enabled", async ({ page }) => {
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByTestId("page-info")).toHaveText("Page 2 of 2");
  await expect(rows(page)).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Previous" })).toBeEnabled();
});

test("Previous goes back to the first page", async ({ page }) => {
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Previous" }).click();

  await expect(page.getByTestId("page-info")).toHaveText("Page 1 of 2");
  await expect(rows(page)).toHaveCount(10);
});

test("the count shows the total number of matching games on every page", async ({ page }) => {
  test.fail(true, "Known bug: the count shows the number of games on the current page, not the total");

  await expect(page.getByTestId("result-count")).toHaveText("12 games");

  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByTestId("page-info")).toHaveText("Page 2 of 2");

  await expect(page.getByTestId("result-count")).toHaveText("12 games");
});

test("the count is singular for one match", async ({ page }) => {
  await search(page, "hades");

  await expect(page.getByTestId("result-count")).toHaveText("1 game");
});

test("ten games fit on a single page", async ({ page, request }) => {
  // Remove two of the twelve games through the API, then reload
  await request.delete("/api/games/1");
  await request.delete("/api/games/2");
  await page.reload();

  await expect(page.getByTestId("page-info")).toHaveText("Page 1 of 1");
  await expect(rows(page)).toHaveCount(10);
  await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
});
