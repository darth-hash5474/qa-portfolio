import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

for (const viewport of [
  { name: "desktop", width: 1280, height: 900 },
  { name: "phone", width: 375, height: 800 },
]) {
  test(`axe finds no accessibility problems on a ${viewport.name} screen`, async ({ page }) => {
    await page.setViewportSize(viewport);

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

    // List each problem by rule and element so a failure says what to fix
    const problems = results.violations.map((violation) => ({
      rule: violation.id,
      help: violation.help,
      elements: violation.nodes.map((node) => node.target.join(" ")),
    }));
    expect(problems).toEqual([]);
  });
}

test("there is exactly one main heading", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

// Screen reader users navigate by headings, so a level must never be skipped on the way down
test("heading levels never skip a level", async ({ page }) => {
  const levels = await page
    .getByRole("heading")
    .evaluateAll((headings) => headings.map((heading) => Number(heading.tagName.slice(1))));

  for (let index = 1; index < levels.length; index++) {
    expect(levels[index] - levels[index - 1], `heading ${index + 1} skips a level`).toBeLessThanOrEqual(1);
  }
});

test("the page declares its language", async ({ page }) => {
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("the first Tab press reaches a skip link that moves to the content", async ({ page }) => {
  await page.keyboard.press("Tab");

  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("every link can be reached with the keyboard", async ({ page }) => {
  const linkCount = await page.getByRole("link").count();

  for (let press = 0; press < linkCount; press++) {
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toHaveRole("link");
  }
});

test("the decorative check marks are hidden from screen readers", async ({ page }) => {
  for (const mark of await page.locator(".mark").all()) {
    await expect(mark).toHaveAttribute("aria-hidden", "true");
  }
});
