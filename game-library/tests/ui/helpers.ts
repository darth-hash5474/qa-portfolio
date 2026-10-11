import type { APIRequestContext, Locator, Page } from "@playwright/test";

// The values that can be typed into the add and edit form. Leave a field out to keep what is there.
export interface GameFields {
  title?: string;
  platform?: string;
  genre?: string;
  status?: string;
  rating?: string;
  hours?: string;
  year?: string;
}

// Put the library back to its twelve seeded games and open the page
export async function openFreshLibrary(page: Page, request: APIRequestContext) {
  await request.post("/api/test/reset");
  await page.goto("/");
}

// The form and the filters both have Platform and Status dropdowns, so the form fields are found by id
export async function fillForm(page: Page, fields: GameFields) {
  if (fields.title !== undefined) await page.locator("#title").fill(fields.title);
  if (fields.platform !== undefined) await page.locator("#platform").selectOption(fields.platform);
  if (fields.genre !== undefined) await page.locator("#genre").fill(fields.genre);
  if (fields.status !== undefined) await page.locator("#status").selectOption(fields.status);
  if (fields.rating !== undefined) await page.locator("#rating").fill(fields.rating);
  if (fields.hours !== undefined) await page.locator("#hours_played").fill(fields.hours);
  if (fields.year !== undefined) await page.locator("#release_year").fill(fields.year);
}

export async function addGame(page: Page, fields: GameFields) {
  await fillForm(page, fields);
  await page.getByRole("button", { name: "Add game" }).click();
}

// Every row in the list
export function rows(page: Page): Locator {
  return page.locator("#games-body tr");
}

// The row for one game, found by the exact text of its title cell
export function row(page: Page, title: string): Locator {
  return rows(page).filter({ has: page.getByRole("cell", { name: title, exact: true }) });
}

// Type into the search box above the list
export async function search(page: Page, text: string) {
  await page.locator("#search").fill(text);
}

// The message under one form field: title, platform, genre, status, rating, hours_played or release_year
export function fieldError(page: Page, field: string): Locator {
  return page.locator(`[data-error-for="${field}"]`);
}

// One number in the stats panel: total, completed, completion-rate, average-rating or total-hours
export function stat(page: Page, name: string): Locator {
  return page.getByTestId(`stat-${name}`);
}

export function toast(page: Page): Locator {
  return page.locator("#toast");
}
