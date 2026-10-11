import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const REPO_URL = "https://github.com/darth-hash5474/qa-portfolio";
const REPO_ROOT = path.resolve(__dirname, "..", "..");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

// Collects the href of every link on the page
async function allHrefs(page: Page): Promise<string[]> {
  return page.getByRole("link").evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
}

test("every link has somewhere to go and text that says where", async ({ page }) => {
  const links = await page.getByRole("link").all();
  expect(links.length).toBeGreaterThan(20);

  for (const link of links) {
    await expect(link).toHaveAttribute("href", /^(#[\w-]+|https:\/\/.+)/);
    await expect(link).not.toBeEmpty();
  }
});

test("every link within the page points at a section that exists", async ({ page }) => {
  const anchors = (await allHrefs(page)).filter((href) => href.startsWith("#"));
  expect(anchors.length).toBeGreaterThan(0);

  for (const anchor of anchors) {
    await expect(page.locator(anchor), `nothing on the page has the id ${anchor}`).toHaveCount(1);
  }
});

// The page promises that every claim links to code in the repository.
// This checks that each of those files and folders is really there.
test("every link into the repository points at a file or folder that exists", async ({ page }) => {
  const pattern = new RegExp(`^${REPO_URL}/(?:blob|tree)/main/(.+)$`);
  const repoPaths = (await allHrefs(page))
    .map((href) => href.match(pattern)?.[1])
    .filter((repoPath): repoPath is string => repoPath !== undefined);

  expect(repoPaths.length).toBeGreaterThan(15);

  for (const repoPath of repoPaths) {
    expect(fs.existsSync(path.join(REPO_ROOT, repoPath)), `${repoPath} is not in the repository`).toBe(true);
  }
});

test("links to CI runs name workflow files that exist", async ({ page }) => {
  const pattern = new RegExp(`^${REPO_URL}/actions/workflows/(.+)$`);
  const workflows = (await allHrefs(page))
    .map((href) => href.match(pattern)?.[1])
    .filter((workflow): workflow is string => workflow !== undefined);

  expect(workflows.length).toBe(3);

  for (const workflow of workflows) {
    const file = path.join(REPO_ROOT, ".github", "workflows", workflow);
    expect(fs.existsSync(file), `${workflow} is not a workflow in the repository`).toBe(true);
  }
});

test("external links only go to GitHub and LinkedIn", async ({ page }) => {
  const allowed = ["github.com", "www.linkedin.com"];
  const external = (await allHrefs(page)).filter((href) => href.startsWith("https://"));

  for (const href of external) {
    expect(allowed, `${href} goes somewhere unexpected`).toContain(new URL(href).hostname);
  }
});

// Two links with the same words should lead to the same place, or a screen reader user can't tell them apart
test("links with the same text go to the same place", async ({ page }) => {
  const seen = new Map<string, string>();

  for (const link of await page.getByRole("link").all()) {
    const text = (await link.innerText()).trim();
    const href = (await link.getAttribute("href")) ?? "";

    if (seen.has(text)) {
      expect(href, `"${text}" is used for two different links`).toBe(seen.get(text));
    }
    seen.set(text, href);
  }
});
