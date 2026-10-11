import { expect, test } from "@playwright/test";
import { addGame, openFreshLibrary, row, rows, search, toast } from "./helpers";

test.beforeEach(async ({ page, request }) => {
  await openFreshLibrary(page, request);
});

// The title is the first cell of every row
function titleCells(page) {
  return rows(page).locator("td:first-child");
}

for (const text of ["hades", "HADES", "ade"]) {
  test(`searching for "${text}" finds Hades`, async ({ page }) => {
    await search(page, text);

    await expect(rows(page)).toHaveCount(1);
    await expect(row(page, "Hades")).toBeVisible();
  });
}

test("a search with no match shows an empty message", async ({ page }) => {
  await search(page, "zzz");

  await expect(page.locator("#empty-message")).toHaveText("No games found.");
  await expect(page.locator("#games-table")).toBeHidden();
});

test("clearing the search brings the full list back", async ({ page }) => {
  await search(page, "hades");
  await expect(rows(page)).toHaveCount(1);

  await search(page, "");

  await expect(rows(page)).toHaveCount(10);
});

test("filtering by status shows only games with that status", async ({ page }) => {
  await page.locator("#filter-status").selectOption("backlog");

  await expect(rows(page)).toHaveCount(3);
  await expect(rows(page).locator("td:nth-child(4)")).toHaveText(["backlog", "backlog", "backlog"]);
});

test("filtering by platform shows only games on that platform", async ({ page }) => {
  await page.locator("#filter-platform").selectOption("Xbox");

  await expect(titleCells(page)).toHaveText(["Forza Horizon 5", "Halo Infinite"]);
});

test("search and a filter work together", async ({ page }) => {
  // "ha" matches Hades and Halo Infinite, but only Hades is completed
  await search(page, "ha");
  await page.locator("#filter-status").selectOption("completed");

  await expect(titleCells(page)).toHaveText(["Hades"]);
});

// Each sort option, with the three games that should come first
const SORT_CASES = [
  { option: "Title (A to Z)", first: ["Celeste", "Disco Elysium", "Elden Ring"] },
  { option: "Title (Z to A)", first: ["Tetris Effect", "Stardew Valley", "Outer Wilds"] },
  { option: "Rating (high to low)", first: ["Hades", "Hollow Knight", "Elden Ring"] },
  { option: "Rating (low to high)", first: ["Halo Infinite", "Monument Valley", "Stardew Valley"] },
  { option: "Hours played (most first)", first: ["Stardew Valley", "Elden Ring", "Hades"] },
  { option: "Release year (newest first)", first: ["Elden Ring", "Halo Infinite", "Forza Horizon 5"] },
  { option: "Release year (oldest first)", first: ["Monument Valley", "Stardew Valley", "Hollow Knight"] },
];

for (const { option, first } of SORT_CASES) {
  test(`sorting by "${option}" puts the right games first`, async ({ page }) => {
    await page.locator("#sort").selectOption({ label: option });

    for (const [index, title] of first.entries()) {
      await expect(titleCells(page).nth(index)).toHaveText(title);
    }
  });
}

test('sorting by "Recently added" puts a new game first', async ({ page }) => {
  await addGame(page, { title: "Newest Game" });
  await expect(toast(page)).toHaveText("Game added");

  await page.locator("#sort").selectOption({ label: "Recently added" });

  await expect(titleCells(page).first()).toHaveText("Newest Game");
});

for (const option of ["Rating (high to low)", "Rating (low to high)"]) {
  test(`unrated games come last when sorting by "${option}"`, async ({ page }) => {
    await page.locator("#sort").selectOption({ label: option });

    // Four of the twelve games are unrated, so the two on the last page must both be unrated
    await page.getByRole("button", { name: "Next" }).click();

    await expect(rows(page).locator("td:nth-child(5)")).toHaveText(["–", "–"]);
  });
}

test("searching from page 2 starts the results at page 1", async ({ page }) => {
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByTestId("page-info")).toHaveText("Page 2 of 2");

  // Nine of the twelve titles contain the letter e
  await search(page, "e");

  await expect(page.getByTestId("page-info")).toHaveText("Page 1 of 1");
  await expect(rows(page)).toHaveCount(9);
});
