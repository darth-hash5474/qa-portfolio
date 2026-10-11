import { expect, test } from "@playwright/test";
import { addGame, fillForm, openFreshLibrary, stat, toast } from "./helpers";

test.beforeEach(async ({ page, request }) => {
  await openFreshLibrary(page, request);
});

test("the stats describe the seeded library", async ({ page }) => {
  await expect(stat(page, "total")).toHaveText("12");
  await expect(stat(page, "completed")).toHaveText("5");
  await expect(stat(page, "completion-rate")).toHaveText("42%");
  await expect(stat(page, "average-rating")).toHaveText("8.1");
  await expect(stat(page, "total-hours")).toHaveText("378");
});

test("adding a completed, rated game updates every stat", async ({ page }) => {
  await addGame(page, { title: "Stats Game", status: "completed", rating: "10", hours: "10" });
  await expect(toast(page)).toHaveText("Game added");

  await expect(stat(page, "total")).toHaveText("13");
  await expect(stat(page, "completed")).toHaveText("6");
  // 6 of 13 completed is 46%, and the nine ratings now average 8.3
  await expect(stat(page, "completion-rate")).toHaveText("46%");
  await expect(stat(page, "average-rating")).toHaveText("8.3");
  await expect(stat(page, "total-hours")).toHaveText("388");
});

test("an unrated game does not change the average rating", async ({ page }) => {
  await addGame(page, { title: "Unrated Game", status: "playing" });
  await expect(toast(page)).toHaveText("Game added");

  await expect(stat(page, "total")).toHaveText("13");
  await expect(stat(page, "average-rating")).toHaveText("8.1");
});

test("marking a game completed raises the completed count", async ({ page }) => {
  await page.getByRole("button", { name: "Edit Elden Ring" }).click();
  await fillForm(page, { status: "completed" });
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(toast(page)).toHaveText("Game updated");

  await expect(stat(page, "completed")).toHaveText("6");
  await expect(stat(page, "completion-rate")).toHaveText("50%");
});

test("deleting a game lowers the total", async ({ page }) => {
  await page.getByRole("button", { name: "Delete Hades" }).click();
  await page.locator("#delete-confirm").click();
  await expect(toast(page)).toHaveText("Game deleted");

  await expect(stat(page, "total")).toHaveText("11");
  await expect(stat(page, "completed")).toHaveText("4");
});
