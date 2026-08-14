import { expect, test } from "@playwright/test";

const route = "/learn/math/eigenvectors/";

test("scoped root and static publication expose the whole explanation", async ({
  page
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(new RegExp(`${route}(?:#.*)?$`, "u"));
  await expect(page.getByRole("heading", {
    name: "A direction that survives"
  })).toBeVisible();
  await expect(page.locator("[data-kp-eigenvector-passage]")).toHaveCount(9);
  await expect(page.locator("#reveal-the-eigenspace")).toContainText(
    "Together with zero, they form the eigenspace"
  );
  await expect(page.locator("[data-kp-eigenvector-diagram]")).toHaveCount(1);
  await expect(page.locator("iframe, canvas")).toHaveCount(0);
});

test("no-JavaScript fallback keeps searchable prose, math, and hash transport", async ({
  browser
}) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:4195",
    javaScriptEnabled: false
  });
  const page = await context.newPage();
  await page.goto(route, { waitUntil: "domcontentloaded" });

  await expect(page.locator("[data-kp-eigenvector-passage]")).toHaveCount(9);
  await expect(page.locator("math").first()).toBeAttached();
  await expect(page.locator("[data-kp-eigenvector-next]")).toHaveAttribute(
    "href",
    "#watch-the-fan"
  );
  await expect(page.locator("[data-kp-eigenvector-diagram]")).toHaveCount(1);
  await context.close();
});

test("a direct beat and object URL restores one exact endpoint", async ({ page }) => {
  await page.goto(
    `${route}?focus=eigenvector-demo%2Fvector%2Fv#geometry-becomes-equation`,
    { waitUntil: "domcontentloaded" }
  );
  const publication = page.locator("[data-kp-eigenvector-public]");
  const stage = page.locator("[data-kp-eigenvector-endpoint]");

  await expect(publication).toHaveAttribute(
    "data-kp-current-beat",
    "geometry-becomes-equation"
  );
  await expect(publication).toHaveAttribute(
    "data-kp-focus-object",
    "eigenvector-demo/vector/v"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-eigenvector-endpoint",
    "geometry-becomes-equation"
  );
  await expect(page.locator('[data-kp-equation-form="Av=3v"]')).toBeVisible();
  await expect(page.locator(
    '[data-kp-semantic-object="eigenvector-demo/vector/v"][data-kp-direct-focus="true"]'
  ).first()).toBeAttached();
});

test("fixed transport changes discrete states and browser history restores them", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const publication = page.locator("[data-kp-eigenvector-public]");
  const transport = page.locator("[data-kp-eigenvector-transport]");

  await expect(transport).toHaveCSS("position", "fixed");
  await page.locator("[data-kp-eigenvector-next]").click();
  await expect(publication).toHaveAttribute(
    "data-kp-current-beat",
    "watch-the-fan"
  );
  await expect(page).toHaveURL(/#watch-the-fan$/u);
  await page.goBack();
  await expect(publication).toHaveAttribute(
    "data-kp-current-beat",
    "most-vectors-turn"
  );
});

test("scroll chooses one beat and its bounded transition settles", async ({ page }) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const publication = page.locator("[data-kp-eigenvector-public]");
  await page.locator("#one-direction-survives").evaluate((node) =>
    node.scrollIntoView({ block: "start" })
  );

  await expect(publication).toHaveAttribute(
    "data-kp-current-beat",
    "one-direction-survives"
  );
  await page.waitForTimeout(1_050);
  await expect(page.locator('[data-kp-representation="diagram.eigenvector-demo/vector/v"]'))
    .toHaveAttribute("x2", "338");
});

test("prediction and scalar manipulation emit semantic consequences", async ({ page }) => {
  await page.goto(`${route}#predict-a-multiple`, {
    waitUntil: "domcontentloaded"
  });
  await page.getByRole("button", { name: "6v", exact: true }).click();
  await expect(page.locator("[data-kp-eigenvector-public]")).toHaveAttribute(
    "data-kp-current-beat",
    "verify-the-multiple"
  );
  await expect(page.locator("[data-kp-eigenvector-prediction-feedback]"))
    .toContainText("Linearity");

  await page.goto(`${route}#reveal-the-eigenspace`, {
    waitUntil: "domcontentloaded"
  });
  const slider = page.getByRole("slider", { name: /Move along the line/u });
  await slider.fill("0");
  await expect(page.locator("[data-kp-eigenvector-scalar-feedback]"))
    .toContainText("zero is not an eigenvector");
});

test("phone and reduced-motion projections remain bounded", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route, { waitUntil: "domcontentloaded" });

  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth + 1
  )).toBe(true);
  await page.locator("[data-kp-eigenvector-next]").click();
  await expect(page.locator("[data-kp-eigenvector-public]")).toHaveAttribute(
    "data-kp-current-beat",
    "watch-the-fan"
  );
  await expect(page.locator('[data-kp-representation="diagram.eigenvector-demo/vector/v"]'))
    .toHaveAttribute("x2", "338");
  const box = await page.locator("[data-kp-eigenvector-stage-host]")
    .boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeLessThanOrEqual(390);
  expect(box!.height).toBeLessThan(844 * 0.55);
});

test("forced colors preserve focus and visible keyboard navigation", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto(`${route}?focus=eigenvector-demo%2Fvector%2Fv#one-direction-survives`, {
    waitUntil: "domcontentloaded"
  });
  const next = page.locator("[data-kp-eigenvector-next]");
  await next.focus();
  expect(await next.evaluate((node) =>
    getComputedStyle(node).outlineWidth
  )).toBe("2px");
  await expect(page.locator(
    '[data-kp-semantic-object="eigenvector-demo/vector/v"][data-kp-direct-focus="true"]'
  ).first()).toBeAttached();
});
