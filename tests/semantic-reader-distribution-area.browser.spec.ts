import { expect, test } from "@playwright/test";

const route = "/reader/distribution-area/";

test("semantic editor opens the synchronized algebra and area exemplar", async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  await page.goto("/", { waitUntil: "networkidle" });

  const library = page.locator("[data-kp-learner-experience-library]");
  const first = library.locator("[data-kp-learner-experience]").first();
  await expect(first).toHaveAttribute(
    "data-kp-learner-experience",
    "distribution-area-scroll-lesson"
  );
  const link = first.getByRole("link", { name: "Review algebra and area" });
  await expect(link).toHaveAttribute("href", route);
  await link.click();

  await expect(page).toHaveURL(/\/reader\/distribution-area\//);
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader", "distribution-area");
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-hydrated", "true");
  await expect(page.getByRole("heading", { name: "See distribution become area", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("distribution reader mounts review capture outside the visual stage", async ({ page }) => {
  await page.goto(`${route}?kpProgress=500`, { waitUntil: "networkidle" });
  await expect(page.locator("body")).toHaveAttribute("data-kp-dev-review-ready", "true");
  const host = page.locator("[data-kp-dev-review-shell]");
  await expect(host).toHaveAttribute("data-kp-dev-review-placement", "left-prose-rail");
  await host.locator("button.launcher").click();
  await expect(host.locator("textarea")).toBeEnabled();

  const stage = await page.locator("[data-kp-distribution-stage]").boundingBox();
  const panel = await host.locator("[role=dialog]").boundingBox();
  expect(stage).not.toBeNull();
  expect(panel).not.toBeNull();
  expect(panel!.x + panel!.width).toBeLessThanOrEqual(stage!.x);
});

test("distribution reader keeps one visual owner and reversible native endpoints", async ({ page }) => {
  await page.goto(`${route}?kpProgress=0&kpDirection=forward`, { waitUntil: "networkidle" });
  const stage = page.locator("[data-kp-distribution-stage]");
  const scrubber = page.locator("[data-kp-distribution-scrubber]");
  const factored = page.locator('[data-kp-native="factored"]');
  const expanded = page.locator('[data-kp-native="expanded"]');
  const material = page.locator("[data-kp-algebra-material]");

  await expect(stage).toHaveAttribute("data-kp-owner", "factored-native");
  await expect(factored).toBeVisible();
  await expect(expanded).toBeHidden();
  await expect(material).toBeHidden();

  await scrubber.fill("500");
  await expect(stage).toHaveAttribute("data-kp-owner", "material");
  await expect(factored).toBeHidden();
  await expect(expanded).toBeHidden();
  await expect(material).toBeVisible();

  await scrubber.fill("1000");
  await expect(stage).toHaveAttribute("data-kp-owner", "expanded-native");
  await expect(expanded).toBeVisible();
  await page.getByRole("button", { name: "Factor" }).click();
  await expect(stage).toHaveAttribute("data-kp-direction", "inverse");
  await expect(stage).toHaveAttribute("data-kp-owner", "expanded-native");
  await expect(scrubber).toHaveValue("0");

  await scrubber.fill("1000");
  await expect(stage).toHaveAttribute("data-kp-owner", "factored-native");
  await expect(factored).toBeVisible();
  await expect(page).toHaveURL(/kpDirection=inverse/);
  await expect(page).toHaveURL(/kpCheckpoint=factored/);
});

test("distribution URL restores the exact review moment and semantic cross-surface focus", async ({ page }) => {
  await page.goto(
    `${route}?kpLesson=lesson.algebra.distribution-area&kpVersion=1&kpCheckpoint=distributed&kpProgress=720&kpDirection=forward`,
    { waitUntil: "networkidle" }
  );
  const stage = page.locator("[data-kp-distribution-stage]");
  await expect(stage).toHaveAttribute("data-kp-owner", "material");
  await expect(stage).toHaveAttribute("data-kp-checkpoint", "distributed");
  await expect(page.locator("[data-kp-distribution-scrubber]")).toHaveValue("720");
  const toc = page.locator(".kp-lesson-toc");
  await expect(toc).toHaveAttribute("data-kp-toc-active-id", "beat.distribute");
  await expect(toc.locator('[data-kp-toc-active="true"]')).toHaveAttribute(
    "aria-current",
    "location"
  );
  await expect(page.locator('[data-kp-beat="beat.distribute"]')).toHaveAttribute(
    "aria-current",
    "step"
  );

  await page.getByRole("button", { name: "three" }).hover();
  await expect(page.locator('[data-kp-area-label="height"]')).toHaveAttribute(
    "data-kp-external-focus",
    "true"
  );
  await expect(page.locator('[data-kp-material-token="left-three"]')).toHaveAttribute(
    "data-kp-external-focus",
    "true"
  );
});

test("distribution reader remains searchable without JavaScript and contained on phone", async ({ browser }) => {
  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(route);
  await expect(staticPage.getByText("The same multiplication can be read as symbols")).toBeVisible();
  await expect(staticPage.locator("[data-kp-symbolic-transcript]")).toContainText(
    "3(x+2) → 3x+3·2 → 3x+6"
  );
  await expect(staticPage.locator('[data-kp-native="factored"]')).toBeVisible();
  await expect(staticPage.locator('[data-kp-native="expanded"]')).toBeHidden();
  await expect(staticPage.locator("svg text")).toHaveCount(0);
  await staticContext.close();

  const phone = await browser.newPage({ viewport: { width: 360, height: 640 } });
  await phone.goto(`${route}?kpProgress=720`, { waitUntil: "networkidle" });
  const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const stage = phone.locator("[data-kp-distribution-stage]");
  const algebra = phone.locator(".kp-distribution-algebra");
  const area = phone.locator(".kp-distribution-area");
  const [stageBox, algebraBox, areaBox] = await Promise.all([
    stage.boundingBox(), algebra.boundingBox(), area.boundingBox()
  ]);
  expect(stageBox).not.toBeNull();
  expect(algebraBox).not.toBeNull();
  expect(areaBox).not.toBeNull();
  expect(areaBox!.y).toBeGreaterThan(algebraBox!.y);
  expect(areaBox!.x).toBeGreaterThanOrEqual(stageBox!.x);
  expect(areaBox!.x + areaBox!.width).toBeLessThanOrEqual(stageBox!.x + stageBox!.width + 1);
  await phone.close();
});
