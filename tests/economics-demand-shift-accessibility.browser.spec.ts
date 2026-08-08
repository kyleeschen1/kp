import { expect, test } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/";

test("published lesson exposes semantic graph state and keyboard checkpoints", async ({
  page
}) => {
  await page.goto(route);
  const root = page.locator("[data-kp-economics-static-publication]");
  const state = root.locator('[data-kp-economics-accessible-state][role="status"]');

  await expect(root.getByRole("heading", {
    level: 1,
    name: /Why does an increase in demand/
  })).toBeVisible();
  await expect(root.getByRole("navigation", { name: "In this lesson" }))
    .toHaveCount(1);
  await expect(root.getByRole("img", {
    name: "Supply and demand equilibrium graph animation"
  })).toBeVisible();
  await expect(root.getByRole("progressbar", {
    name: "Demand shifts progress"
  })).toHaveAttribute("aria-valuenow", "0");
  await expect(state).toContainText("quantity six hundred boxes");
  await expect(root).toHaveAttribute(
    "data-kp-economics-static-enhancement",
    "ready"
  );

  await page.keyboard.press("Alt+ArrowRight");
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-motion-progress",
    "0.720"
  );
  await expect(state).toContainText("Demand is moving right");
  await page.keyboard.press("Alt+ArrowLeft");
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-motion-progress",
    "0.000"
  );
  await expect(state).toContainText("quantity six hundred boxes");
});

test("no-JavaScript phone publication remains searchable and natively navigable", async ({
  browser
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();
  try {
    await page.goto(`${route}#kp-block-supply-movement`);
    const root = page.locator("[data-kp-economics-static-publication]");
    const disclosure = root.locator("[data-kp-tutorial-toc-disclosure]");
    const summary = disclosure.locator("summary");

    await expect(root).toBeVisible();
    await expect(root.locator("[data-kp-economics-tutorial-passage]"))
      .toHaveCount(11);
    await expect(root).toContainText(
      "Quantity supplied rose because equilibrium selected a new point"
    );
    await expect(summary).toBeVisible();
    await expect(disclosure).toHaveAttribute("open", "");
    await summary.focus();
    await summary.press("Enter");
    await expect(disclosure).not.toHaveAttribute("open", "");
    await summary.press("Enter");
    await expect(disclosure).toHaveAttribute("open", "");
    await expect(root.getByRole("link", { name: "Supply did not shift" }))
      .toHaveAttribute("href", `${route}#kp-block-supply-movement`);
    await expect(root.getByRole("button", { name: "Play" }).first())
      .toBeDisabled();
    await expect(root.getByRole("slider", {
      name: "Scrub animation progress"
    }).first()).toBeDisabled();
    expect(new URL(page.url()).hash).toBe("#kp-block-supply-movement");
  } finally {
    await context.close();
  }
});

test("reduced motion keeps semantic stepping while suppressing presentation motion", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);
  const root = page.locator("[data-kp-economics-static-publication]");
  const scrub = root.locator(
    '[data-kp-tutorial-motion-controls="demand-shift"]'
  );

  await expect(scrub).toHaveAttribute(
    "aria-label",
    "Animation timeline. Automatic scroll motion is disabled."
  );
  await expect(scrub).toHaveAttribute(
    "data-kp-tutorial-scrub-reduced-motion",
    "true"
  );
  await scrub.getByRole("link", {
    name: "Next semantic checkpoint"
  }).click();
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-motion-progress",
    "0.720"
  );
  await expect(root.locator("[data-kp-economics-accessible-state]"))
    .toContainText("Equilibrium handoff");
  await expect.poll(() => root.locator("[data-kp-editor-graph-svg]")
    .evaluate((element) => getComputedStyle(element).transitionDuration))
    .toBe("0s");
});

test("forced colors retain graph structure, controls, and visible focus", async ({
  page
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto(route);
  const root = page.locator("[data-kp-economics-static-publication]");
  const axis = root.locator("[data-kp-editor-graph-axis]").first();
  const curve = root.locator(
    ".editor-graph-stage__economics-curve--supply"
  );
  const next = root.getByRole("link", {
    name: "Next semantic checkpoint"
  }).first();

  expect(await page.evaluate(() => matchMedia("(forced-colors: active)").matches))
    .toBe(true);
  await expect(axis).not.toHaveCSS("stroke", "none");
  await expect(curve).not.toHaveCSS("stroke", "none");
  await next.focus();
  await expect.poll(() => next.evaluate((element) => ({
    style: getComputedStyle(element).outlineStyle,
    width: getComputedStyle(element).outlineWidth
  }))).toEqual({ style: "solid", width: "2px" });
  await expect(root.getByRole("progressbar").first()).toBeVisible();
});
