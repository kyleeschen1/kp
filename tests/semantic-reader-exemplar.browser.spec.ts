import { expect, test } from "@playwright/test";

test("semantic reader stays readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/reader/solve-x/");

  await expect(page.getByRole("heading", { name: "Solve for x" })).toBeVisible();
  await expect(page.getByText("An equation is a promise")).toBeVisible();
  await expect(page.locator("[data-kp-static-state]:not([hidden]) .katex")).toBeVisible();
  await expect(page.locator("body")).not.toHaveAttribute("data-kp-reader-hydrated", "true");
  await context.close();
});

test("scroll continuously drives anchored equation material without layout reads", async ({ page }) => {
  const errors: string[] = [];
  const loadedAssets: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => loadedAssets.push(response.url()));
  await page.goto("/reader/solve-x/");
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-hydrated", "true");
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toBeVisible();

  const secondBeat = page.locator("#beat\\.subtract");
  await secondBeat.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 160));
  await expect.poll(async () => Number(await page.locator("body").getAttribute(
    "data-kp-reader-progress"
  ))).toBeGreaterThan(100);
  await expect(page.locator("[data-kp-reader-equation-material-owner-id]").first()).toBeAttached();

  const readsBefore = Number(await stage.getAttribute("data-kp-reader-layout-reads"));
  await page.evaluate(() => {
    window.scrollBy(0, 24);
    window.scrollBy(0, 24);
    window.scrollBy(0, 24);
  });
  await page.waitForTimeout(220);
  expect(Number(await stage.getAttribute("data-kp-reader-layout-reads"))).toBe(readsBefore);
  expect(errors).toEqual([]);
  // Vite's source graph may inspect type-only editor references in development;
  // the production closure gate separately proves they are not deployed.
  const forbiddenAssets = loadedAssets.filter((url) =>
    /(?:graph-webgl|three(?:\.module)?(?:-|\.|\/))/i.test(url)
  );
  expect(forbiddenAssets).toEqual([]);
});

test("settled reader location is linkable and restores its progress", async ({ page }) => {
  await page.goto("/reader/solve-x/");
  await page.locator("#beat\\.cancel").scrollIntoViewIfNeeded();
  await page.waitForTimeout(260);
  await expect.poll(() => new URL(page.url()).searchParams.get("kpLesson"))
    .toBe("lesson.solve-x.x-plus-3");
  const progress = Number(new URL(page.url()).searchParams.get("kpProgress"));
  expect(progress).toBeGreaterThan(300);
  expect(progress).toBeLessThan(900);

  await page.reload();
  await expect.poll(async () => Number(await page.locator("body").getAttribute(
    "data-kp-reader-progress"
  ))).toBeCloseTo(progress, -1);
});

test("one material stage retains persistent semantic owners across transitions", async ({ page }) => {
  await page.goto("/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=300");
  const layers = page.locator("[data-kp-reader-equation-material-layer]");
  await expect(layers).toHaveCount(1);
  const xOwner = page.locator(
    '[data-kp-reader-equation-material-owner-id="material-owner.x-persists"]'
  );
  await expect(xOwner).toBeAttached();
  await xOwner.evaluate((element) => { element.dataset["kpPersistenceWitness"] = "same-node"; });

  await page.locator("#beat\\.solve").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 120));
  await expect.poll(async () => page.locator("body").getAttribute(
    "data-kp-reader-transition"
  )).toContain("simplify-right-difference");
  await expect(xOwner).toHaveAttribute("data-kp-persistence-witness", "same-node");
});
