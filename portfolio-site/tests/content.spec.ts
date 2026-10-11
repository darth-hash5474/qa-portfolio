import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("the page introduces Gavin as a self-taught QA engineer", async ({ page }) => {
  await expect(page).toHaveTitle(/Gavin Griffith/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Self-taught QA engineer");
  await expect(page.locator(".lede")).toContainText("Gavin Griffith");
});

test("the page has a description for search results and link previews", async ({ page }) => {
  const description = await page.locator('meta[name="description"]').getAttribute("content");

  expect(description).toBeTruthy();
  expect(description!.length).toBeGreaterThan(50);
  expect(description!.length).toBeLessThan(200);
});

// These tags are what LinkedIn and chat apps show when the link is shared
test("the page has a title, description and address for link previews", async ({ page }) => {
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Gavin Griffith/);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", /.{30,}/);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "https://gaving.dev/",
  );
});

// Every claim in the opening list must come with at least one link to its evidence
test("each opening claim links to evidence", async ({ page }) => {
  const claims = page.locator(".checks li");
  await expect(claims).toHaveCount(5);

  for (const claim of await claims.all()) {
    await expect(claim.locator(".claim")).not.toBeEmpty();
    expect(await claim.getByRole("link").count()).toBeGreaterThan(0);
  }
});

for (const section of ["Projects", "Skills", "Background", "Contact"]) {
  test(`the ${section} link in the header jumps to that section`, async ({ page }) => {
    await page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: section }).click();

    await expect(page).toHaveURL(new RegExp(`#${section.toLowerCase()}$`));
    await expect(page.getByRole("heading", { level: 2, name: section })).toBeInViewport();
  });
}

test("both projects are listed with what their tests found", async ({ page }) => {
  const projects = page.locator(".project");
  await expect(projects).toHaveCount(2);

  const navidrome = projects.filter({ has: page.getByRole("heading", { name: "Navidrome" }) });
  await expect(navidrome.locator(".findings li")).toHaveCount(2);
  await expect(navidrome.getByRole("link", { name: "Read the issue" })).toHaveAttribute(
    "href",
    "https://github.com/navidrome/navidrome/issues/6310",
  );

  const gameLibrary = projects.filter({ has: page.getByRole("heading", { name: "Game Library" }) });
  await expect(gameLibrary.locator(".findings li")).toHaveCount(4);
});

// A finding's status must be readable as text, not shown by colour alone
test("every finding has a status label", async ({ page }) => {
  for (const finding of await page.locator(".findings li").all()) {
    await expect(finding.locator(".status")).toHaveText(/Confirmed, fix in review|Documented|Planted, found/);
  }
});

test("every skill links to a file that shows it", async ({ page }) => {
  const skills = page.locator(".skills li");
  expect(await skills.count()).toBeGreaterThan(10);

  for (const skill of await skills.all()) {
    await expect(skill.getByRole("link")).toHaveCount(1);
  }
});

test("the background lists the steps in order", async ({ page }) => {
  const steps = page.getByRole("list", { name: "How the repository grew" }).getByRole("listitem");

  await expect(steps).toHaveCount(7);
  await expect(steps.first()).toContainText("Plain Python scripts");
  await expect(steps.last()).toContainText("This site");
});

test("the contact section links to the repository, GitHub and LinkedIn", async ({ page }) => {
  const contact = page.locator("#contact");

  await expect(contact.getByRole("link", { name: "The qa-portfolio repository" })).toHaveAttribute(
    "href",
    "https://github.com/darth-hash5474/qa-portfolio",
  );
  await expect(contact.getByRole("link", { name: "darth-hash5474 on GitHub" })).toHaveAttribute(
    "href",
    "https://github.com/darth-hash5474",
  );
  await expect(contact.getByRole("link", { name: "Gavin Griffith on LinkedIn" })).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/gavin-griffith",
  );
});
