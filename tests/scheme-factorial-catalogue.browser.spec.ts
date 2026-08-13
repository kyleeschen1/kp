import { mkdir } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

const animationId = "animation.programming.scheme-factorial";
const evidenceDirectory = "tmp/codex/scheme-factorial";

test.beforeEach(async () => {
  await mkdir(evidenceDirectory, { recursive: true });
});

test("catalogue hosts the approved Scheme surface with direct deterministic seeks", async ({
  page
}) => {
  const resources = new Set<string>();
  page.on("response", (response) => resources.add(response.url()));
  await page.setViewportSize({ width: 1_280, height: 900 });
  await page.goto(`/?artifact=${animationId}&playhead=0.5`, {
    waitUntil: "networkidle"
  });
  await waitForSchemePaint(page, 0.5);

  const shell = page.locator("[data-kp-animation-catalogue]");
  const player = shell.locator("[data-kp-editor-animation-player]");
  const slot = player.locator(
    '[data-kp-editor-animation-surface-slot="programming"]');
  const stage = slot.locator("[data-kp-scheme-full-evaluation]");
  await expect(shell).toHaveAttribute(
    "data-kp-animation-catalogue-selection", animationId);
  await expect(shell.locator("iframe")).toHaveCount(0);
  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "adapter.programming.scheme-factorial-full-evaluation"
  );
  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-status", "ready");
  await expect(stage).toHaveAttribute(
    "data-kp-scheme-paint-owner", "code-material");
  await expect(stage).toHaveAttribute(
    "data-kp-scheme-native-owner", "native.scheme.semantic-dom");
  const stageBox = await stage.boundingBox();
  expect(stageBox).not.toBeNull();
  expect(stageBox!.width).toBeGreaterThan(500);
  await expect(stage.locator(".kp-scheme-first-expansion__accessible"))
    .not.toHaveText("");
  await page.screenshot({
    path: `${evidenceDirectory}/catalogue-midpoint.png`,
    fullPage: true,
    animations: "disabled"
  });

  await seek(page, 1);
  await waitForSchemePaint(page, 1);
  await expect(stage.locator(".kp-scheme-first-expansion__accessible"))
    .toHaveText("6");
  await player.press("R");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-direction", "rewind");
  // Rewind is intentionally animated; Home proves the independent exact seek.
  await player.press("Home");
  await waitForSchemePaint(page, 0);
  await expect(stage.locator(".kp-scheme-first-expansion__accessible"))
    .toHaveText("(factorial 3)");

  const names = [...resources].join("\n");
  expect(names).not.toMatch(
    /scheme-factorial-(?:evaluator|parser|trace-artifact|trace\.generated|canonical-full-evaluation)/u
  );
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth + 1
  )).toBe(true);
});

test("catalogue reduced motion resolves directly to a settled Scheme state", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/?artifact=${animationId}&playhead=0.72`, {
    waitUntil: "networkidle"
  });
  await waitForSchemePaint(page, 0.72);

  const stage = page.locator("[data-kp-scheme-full-evaluation]");
  await expect(stage).toHaveAttribute(
    "data-kp-scheme-full-evaluation-phase", "settle");
  await expect(stage.locator("[data-kp-scheme-first-expansion-token]")).not.toHaveCount(0);
  await expect(page.locator("[data-kp-editor-animation-player] canvas, iframe"))
    .toHaveCount(0);
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth + 1
  )).toBe(true);
});

async function seek(page: Page, progress: number): Promise<void> {
  await page.locator('[data-action="seek-editor-animation"]')
    .evaluate((node, value) => {
      const range = node as HTMLInputElement;
      range.value = String(value);
      range.dispatchEvent(new Event("input", { bubbles: true }));
    }, progress);
}

async function waitForSchemePaint(page: Page, progress: number): Promise<void> {
  await page.waitForFunction(({ animationId: expectedId, progress: expected }) => {
    const shell = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue]");
    const player = shell?.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player]");
    return shell?.dataset["kpAnimationCatalogueSelection"] === expectedId &&
      shell.dataset["kpAnimationCatalogueHostOutcome"] === "painted" &&
      player?.dataset["kpEditorAnimationHydrated"] === "true" &&
      Math.abs(Number(player.dataset["kpEditorAnimationProgress"]) - expected) <
        0.001 &&
      shell.querySelector("[data-kp-scheme-full-evaluation]") !== null;
  }, { animationId, progress });
}
