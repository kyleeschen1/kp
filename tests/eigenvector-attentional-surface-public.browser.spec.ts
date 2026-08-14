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
  const next = page.locator("[data-kp-eigenvector-next]");
  await next.hover();
  await page.mouse.down();
  expect(await next.evaluate((node) => getComputedStyle(node).transform))
    .not.toBe("none");
  await page.mouse.up();
  await expect(publication).toHaveAttribute(
    "data-kp-current-beat",
    "watch-the-fan"
  );
  expect(await page.locator(
    '[data-kp-representation="diagram.eigenvector-demo/vector/v"]'
  ).getAttribute("x2")).toBe("338");
  await expect(page).toHaveURL(/#watch-the-fan$/u);
  await page.goBack();
  await expect(publication).toHaveAttribute(
    "data-kp-current-beat",
    "most-vectors-turn"
  );
});

test("scroll scrubs one reversible transition and settles without autoplay", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const publication = page.locator("[data-kp-eigenvector-public]");
  const stage = page.locator("[data-kp-eigenvector-endpoint]");
  const scrollWatchTo = async (viewportRatio: number): Promise<void> => {
    await page.locator("#watch-the-fan").evaluate((node, ratio) => {
      const documentTop = node.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, documentTop - window.innerHeight * ratio);
    }, viewportRatio);
  };

  await scrollWatchTo(0.45);
  await expect(publication).toHaveAttribute(
    "data-kp-current-beat",
    "watch-the-fan"
  );
  await expect.poll(async () => Number(
    await stage.getAttribute("data-kp-transition-progress")
  )).toBeGreaterThan(0.45);
  await expect.poll(async () => Number(
    await stage.getAttribute("data-kp-transition-progress")
  )).toBeLessThan(0.55);

  await scrollWatchTo(0.56);
  await expect.poll(async () => Number(
    await stage.getAttribute("data-kp-transition-progress")
  )).toBeLessThan(0.03);

  await scrollWatchTo(0.32);
  await expect.poll(async () => Number(
    await stage.getAttribute("data-kp-transition-progress")
  )).toBe(1);

  await expect(page.locator('[data-kp-representation="diagram.eigenvector-demo/vector/v"]'))
    .toHaveAttribute("x2", "338");
});

test("direct seeks atomically clear stale representations and equations", async ({
  page
}) => {
  await page.goto(`${route}#reveal-the-eigenspace`, {
    waitUntil: "domcontentloaded"
  });
  const visibleRepresentations = () => page.locator(
    '.kp-eigenvector-stage__vectors ' +
    '[data-kp-representation][style*="--kp-eigen-presence: 1"]'
  );

  await expect(visibleRepresentations()).toHaveCount(1);
  await page.locator("[data-kp-eigenvector-next]").click();
  await expect(page.locator("[data-kp-eigenvector-public]")).toHaveAttribute(
    "data-kp-current-beat",
    "compressed-recall"
  );
  await expect(visibleRepresentations()).toHaveCount(7);
  await expect(page.locator('[data-kp-equation-form]:visible')).toHaveCount(1);
  await page.locator("[data-kp-eigenvector-previous]").click();
  await expect(visibleRepresentations()).toHaveCount(1);
  await expect(page.locator('[data-kp-equation-form]:visible')).toHaveCount(1);
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
  const scalarLine = page.locator(
    '[data-kp-representation="diagram.eigenvector-demo/vector/2v"]'
  );
  const synchronous = await slider.evaluate((node) => {
    const input = node as HTMLInputElement;
    const line = document.querySelector<SVGLineElement>(
      '[data-kp-representation="diagram.eigenvector-demo/vector/2v"]'
    );
    const before = line?.getAttribute("x2");
    input.value = "0";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return { before, after: line?.getAttribute("x2") };
  });
  expect(synchronous.after).toBe(synchronous.before);
  await expect(scalarLine).toHaveAttribute("x2", "260", { timeout: 1_000 });
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
