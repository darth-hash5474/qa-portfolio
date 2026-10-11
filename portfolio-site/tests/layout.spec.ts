import { expect, test } from "@playwright/test";

const WIDTHS = [320, 375, 768, 1280, 1920];

for (const width of WIDTHS) {
  test(`nothing spills off the side at ${width}px wide`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);

    expect(pageWidth).toBeLessThanOrEqual(width);
  });
}

test("the projects use two columns on a wide screen and one on a phone", async ({ page }) => {
  const name = page.locator(".project-name").first();
  const body = page.locator(".project-body").first();

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const wideName = (await name.boundingBox())!;
  const wideBody = (await body.boundingBox())!;
  expect(wideBody.x).toBeGreaterThan(wideName.x + wideName.width);

  await page.setViewportSize({ width: 375, height: 800 });
  const narrowName = (await name.boundingBox())!;
  const narrowBody = (await body.boundingBox())!;
  expect(narrowBody.y).toBeGreaterThanOrEqual(narrowName.y + narrowName.height);
});

test("the check marks are not animated when the reader asks for less motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  // With motion turned off the marks must be fully drawn straight away, not waiting on an animation
  const animation = await page.locator(".mark path").first().evaluate((path) => getComputedStyle(path).animationName);
  expect(animation).toBe("none");
  await expect(page.locator(".mark").first()).toBeVisible();
});

test("the stylesheet loads", async ({ page }) => {
  const response = await page.request.get("/styles.css");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/css");
});
