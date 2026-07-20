import { expect, test } from "@playwright/test";

const conceptPath = "/concepts/mathematics/linear-equations/solve-with-balance";

test("semantic inspection has a bounded keyboard order and contextual accessible names", async ({ page }) => {
  await page.goto(conceptPath);
  await page.getByRole("link", { name: "Touch", exact: true }).click();

  const narration = page.locator("[data-kp-concept-narration]");
  await expect(narration).toHaveAttribute("role", "status");
  await expect(narration).toHaveAttribute("aria-atomic", "true");
  await expect(narration).toContainText("Keep both sides equal");

  const keyboardTargets = page.locator('[data-kp-correspondence-keyboard-target="true"]');
  const keys = await keyboardTargets.evaluateAll((elements) => elements.map((element) => {
    const target = element as HTMLElement;
    return `${target.dataset["kpCorrespondenceSurface"]}.${target.dataset["kpCorrespondenceSemanticId"]}`;
  }));
  expect(keys.length).toBeGreaterThan(2);
  expect(new Set(keys).size).toBe(keys.length);
  await expect(page.locator('[data-kp-correspondence-target]:not(a)[tabindex="0"]'))
    .toHaveCount(keys.length);

  const stepLabels = await page.locator('[data-kp-concept-share-checkpoint]:not([data-kp-concept-share-checkpoint="current"])')
    .evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label")));
  expect(stepLabels).toEqual([
    "Copy link to Keep both sides equal step",
    "Copy link to Remove the added three step",
    "Copy link to Reveal one x step",
    "Copy link to Read the solution step"
  ]);
  await expect(page.getByRole("button", { name: "Copy link to current frame" })).toHaveCount(1);

  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toHaveAttribute("data-kp-correspondence-target", "true");
  expect(await focused.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("solid");

  await page.getByRole("button", { name: "Next step" }).click();
  await expect(narration).toContainText("Remove the added three");
  await expect(narration).toContainText("Subtract 3 from both sides");
});

test("reduced motion presents a complete static semantic frame", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(conceptPath);
  await expect(page.locator('[data-kp-concept-room-mounted="true"]')).toBeAttached();
  const url = new URL(page.url());
  url.searchParams.set("checkpoint", "subtract-three");
  url.searchParams.set("t", "575");
  url.searchParams.set("mode", "touch");
  url.searchParams.set("projection", "coordinated");
  await page.goto(url.href);

  await expect(page.locator('[data-kp-symbolic-motion-state="native-reduced-motion"]')).toBeVisible();
  await expect(page.locator('[data-kp-balance-motion-role="matched-removal-unit"]')).toHaveCount(0);
  await expect(page.locator("[data-kp-concept-narration]")).toContainText("Moving toward Reveal one x");
  await expect(page.locator("[data-kp-concept-narration]")).toContainText("Divide both sides by 2");
  await expect(page.locator("[data-kp-concept-copy-rail]")).toContainText("x = 5/2");
});

test("forced colors retain explicit focus and correspondence boundaries", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto(conceptPath);
  await page.getByRole("link", { name: "Touch", exact: true }).click();
  await page.keyboard.press("Tab");

  expect(await page.evaluate(() => matchMedia("(forced-colors: active)").matches)).toBe(true);
  const focusedStyle = await page.locator(":focus").evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(focusedStyle.outlineStyle).toBe("solid");
  expect(Number.parseFloat(focusedStyle.outlineWidth)).toBeGreaterThanOrEqual(2);
  await expect(page.locator("[data-kp-concept-room-shell]")).toHaveCSS("border-style", "solid");
});
