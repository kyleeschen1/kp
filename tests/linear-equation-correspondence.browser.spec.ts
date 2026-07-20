import { expect, test } from "@playwright/test";

const conceptPath = "/concepts/mathematics/linear-equations/solve-with-balance";

test.beforeEach(async ({ page }) => {
  await page.goto(conceptPath);
  const url = new URL(page.url());
  url.searchParams.delete("focus");
  await page.goto(url.href);
  await expect(page.locator("[data-kp-linear-equation-coordinated-stage]")).toBeVisible();
  const title = page.locator("[data-kp-concept-room-title]");
  const target = page.locator(
    '[data-kp-correspondence-surface="symbolic"][data-kp-correspondence-semantic-id="term.two-x"]'
  ).last();
  await target.click();
  await expect(page).toHaveURL(/focus=term.two-x/);
  await title.hover();
  await page.locator(
    '[data-kp-correspondence-surface="symbolic"][data-kp-correspondence-semantic-id="term.two-x"]'
  ).last().click();
  await expect.poll(() => new URL(page.url()).searchParams.getAll("focus")).toEqual([]);
  await title.hover();
});

test("hover traces an explicit semantic id across prose, equation, and balance without persisting", async ({ page }) => {
  const link = page.locator('[data-kp-concept-semantic-link="term.two-x"]').first();
  const targets = page.locator('[data-kp-correspondence-semantic-id="term.two-x"]');
  await expect(link).toHaveAttribute("title", "Two copies of the unknown x.");
  expect(await targets.count()).toBeGreaterThanOrEqual(3);
  expect(await targets.evaluateAll((elements) => [...new Set(elements.map((element) =>
    (element as HTMLElement).dataset["kpCorrespondenceSurface"]
  ))].sort())).toEqual(["balance", "prose", "symbolic"]);
  await link.hover();
  await expect.poll(() => targets.evaluateAll((elements) => elements.every((element) =>
    element.classList.contains("kp-role-focus-primary") &&
    (element as HTMLElement).dataset["kpFocusChannels"] === "hover"
  ))).toBe(true);
  await expect(page.locator("[data-kp-concept-semantic-definition]"))
    .toHaveText("Two copies of the unknown x.");
  const affordances = await page.evaluate(() => {
    const symbolic = document.querySelector<HTMLElement>(
      '[data-kp-correspondence-surface="symbolic"][data-kp-correspondence-semantic-id="term.two-x"]'
    )!;
    const balance = document.querySelector<SVGElement>(
      '[data-kp-correspondence-surface="balance"][data-kp-correspondence-semantic-id="term.two-x"]'
    )!;
    return {
      symbolicWash: getComputedStyle(symbolic).backgroundColor,
      symbolicRing: getComputedStyle(symbolic).boxShadow,
      balanceEmphasis: getComputedStyle(balance).filter
    };
  });
  expect(affordances.symbolicWash).not.toBe("rgba(0, 0, 0, 0)");
  expect(affordances.symbolicRing).not.toBe("none");
  expect(affordances.balanceEmphasis).not.toBe("none");
  expect(new URL(page.url()).searchParams.getAll("focus")).toEqual([]);

  await page.locator("[data-kp-concept-room-title]").hover();
  await expect.poll(() => targets.evaluateAll((elements) => elements.every((element) =>
    !element.classList.contains("kp-role-focus-primary") &&
    (element as HTMLElement).dataset["kpFocusChannels"] === undefined
  ))).toBe(true);
  await expect(page.locator("[data-kp-concept-semantic-definition]"))
    .toContainText("Select a linked idea");
  expect(new URL(page.url()).searchParams.getAll("focus")).toEqual([]);
});

test("keyboard inspection pins a semantic id and restores it from the URL", async ({ page }) => {
  const balanceTarget = page.locator(
    '[data-kp-correspondence-surface="balance"][data-kp-correspondence-semantic-id="term.two-x"]'
  ).first();
  await balanceTarget.focus();
  await expect(balanceTarget).toHaveAttribute("data-kp-focus-channels", "keyboard");
  await expect(page.locator("[data-kp-concept-semantic-definition]"))
    .toHaveText("Two copies of the unknown x.");
  await balanceTarget.press(" ");
  await expect(page).toHaveURL(/focus=term.two-x/);

  await page.getByRole("link", { name: "Together", exact: true }).focus();
  const pinned = page.locator('[data-kp-correspondence-semantic-id="term.two-x"]');
  await expect.poll(() => pinned.evaluateAll((elements) => elements.every((element) =>
    element.classList.contains("kp-role-focus-primary") &&
    (element as HTMLElement).dataset["kpFocusChannels"] === "pinned"
  ))).toBe(true);
  const pinnedUrl = page.url();
  await page.reload();
  await expect(page).toHaveURL(pinnedUrl);
  await expect.poll(() => page.locator('[data-kp-correspondence-semantic-id="term.two-x"]')
    .evaluateAll((elements) => elements.every((element) =>
      (element as HTMLElement).dataset["kpFocusChannels"] === "pinned"
    ))).toBe(true);
});

test("click and touch-equivalent activation toggle one canonical pin across representations", async ({ page }) => {
  const symbolicTarget = page.locator(
    '[data-kp-correspondence-surface="symbolic"][data-kp-correspondence-semantic-id="term.two-x"]'
  ).last();
  await symbolicTarget.click();
  await page.locator("[data-kp-concept-room-title]").hover();
  await expect(page).toHaveURL(/focus=term.two-x/);
  await expect.poll(() => page.locator('[data-kp-correspondence-semantic-id="term.two-x"]')
    .evaluateAll((elements) => elements.every((element) =>
      (element as HTMLElement).dataset["kpFocusChannels"] === "pinned"
    ))).toBe(true);

  const balanceTarget = page.locator(
    '[data-kp-correspondence-surface="balance"][data-kp-correspondence-semantic-id="term.two-x"]'
  ).first();
  await balanceTarget.dispatchEvent("click");
  await expect.poll(() => new URL(page.url()).searchParams.getAll("focus")).toEqual([]);
  await page.locator("[data-kp-concept-room-title]").hover();
  await expect.poll(() => page.locator('[data-kp-correspondence-semantic-id="term.two-x"]')
    .evaluateAll((elements) => elements.every((element) =>
      !element.classList.contains("kp-role-focus-primary")
    ))).toBe(true);
});

test("operation links use authored identities rather than glyph matching", async ({ page }) => {
  const divideLink = page.locator('[data-kp-concept-semantic-link="operation.divide-two"]');
  await divideLink.click();
  await expect(page).toHaveURL(/checkpoint=divide-two/);
  await expect(page).toHaveURL(/focus=operation.divide-two/);
  const operationTargets = page.locator(
    '[data-kp-correspondence-semantic-id="operation.divide-two"]'
  );
  await expect(operationTargets.first()).toHaveAttribute("data-kp-focus-channels", "pinned");
  await expect(operationTargets.first()).toHaveAttribute(
    "title",
    "Divide both sides into two equal groups."
  );
});
