import { expect, test } from "@playwright/test";

const route = "/learn/math/normal-matrices/";

test("public proof is readable before and after lazy capability load", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });

  const publication = page.locator("[data-kp-normal-proof-publication]");
  await expect(publication).toBeVisible();
  await expect(publication.getByRole("heading", {
    name: "Why does a normal matrix have an orthonormal eigenbasis?"
  })).toBeVisible();
  await expect(publication.locator("math").first()).toBeAttached();
  await publication.locator(
    "[data-kp-normal-proof-stage-fallback]"
  ).scrollIntoViewIfNeeded();
  await expect(publication).toHaveAttribute(
    "data-kp-normal-proof-capability",
    "ready"
  );
  const stage = publication.locator("[data-kp-normal-proof-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-normal-proof-native-owner",
    "settled-katex"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-normal-proof-geometry",
    "settled"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-normal-proof-fragment-count",
    "6"
  );
  await expect(stage.locator(
    "[data-kp-normal-proof-settled-scene]"
  )).toHaveCount(6);
  await expect(stage.locator(
    "[data-kp-normal-proof-settled-scene]:not([hidden])"
  )).toHaveCount(1);
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth + 1
  )).toBe(true);
});

test("all settled checkpoints share one fixed stage footprint", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const stage = page.locator("[data-kp-normal-proof-stage]");
  await stage.scrollIntoViewIfNeeded();
  const viewport = stage.locator("[data-kp-normal-proof-stage-viewport]");
  const initial = await viewport.boundingBox();
  expect(initial).not.toBeNull();

  const sizes = await stage.locator(
    "[data-kp-normal-proof-settled-scene]"
  ).evaluateAll((scenes) => scenes.map((active) => {
    for (const scene of scenes) {
      (scene as HTMLElement).hidden = scene !== active;
    }
    const viewport = active.parentElement!.getBoundingClientRect();
    const matrix = (active as HTMLElement).querySelector<HTMLElement>(
      "[data-kp-normal-proof-matrix-footprint]"
    )!.getBoundingClientRect();
    return {
      viewport: [viewport.width, viewport.height],
      matrix: [matrix.width, matrix.height]
    };
  }));

  expect(new Set(sizes.map(({ viewport }) => viewport.join(":"))).size).toBe(1);
  expect(new Set(sizes.map(({ matrix }) => matrix.join(":"))).size).toBe(1);
});

test("enhancement preserves static geometry at phone width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${route}?evidence=static`, { waitUntil: "domcontentloaded" });
  const staticStage = page.locator("[data-kp-normal-proof-stage]");
  await staticStage.scrollIntoViewIfNeeded();
  const staticBox = await staticStage.locator(
    "[data-kp-normal-proof-stage-viewport]"
  ).boundingBox();

  await page.goto(route, { waitUntil: "domcontentloaded" });
  const motionStage = page.locator("[data-kp-normal-proof-stage]");
  await motionStage.scrollIntoViewIfNeeded();
  await expect(motionStage).toHaveAttribute(
    "data-kp-normal-proof-geometry",
    "settled"
  );
  const motionBox = await motionStage.locator(
    "[data-kp-normal-proof-stage-viewport]"
  ).boundingBox();

  expect(motionBox).toEqual(staticBox);
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth + 1
  )).toBe(true);
});

test("static evidence keeps the same proof without creating a session", async ({
  page
}) => {
  await page.goto(`${route}?evidence=static`, {
    waitUntil: "domcontentloaded"
  });

  const publication = page.locator("[data-kp-normal-proof-publication]");
  const fallback = publication.locator(
    "[data-kp-normal-proof-stage-fallback]"
  );
  await expect(publication).toBeVisible();
  await fallback.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);

  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-normal-proof-evidence",
    "static"
  );
  await expect(publication).not.toHaveAttribute(
    "data-kp-normal-proof-capability",
    "ready"
  );
  await expect(fallback.locator("math").first()).toBeAttached();
  await expect(page.locator("[data-kp-normal-proof-session]")).toHaveCount(0);
});

test("cycle A seeks deterministically and settles back to native KaTeX", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const stage = page.locator("[data-kp-normal-proof-stage]");
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute(
    "data-kp-normal-proof-session",
    "deterministic-seek"
  );
  const viewportBox = await stage.locator(
    "[data-kp-normal-proof-stage-viewport]"
  ).boundingBox();

  for (const [timeMs, phase] of [
    [4_800, "orient"],
    [5_500, "act"],
    [6_500, "settle"],
    [7_000, "inspect"]
  ] as const) {
    await seekNormalProofStage(stage, timeMs);
    await expect(stage).toHaveAttribute("data-kp-normal-proof-time-ms", String(timeMs));
    await expect(stage).toHaveAttribute("data-kp-normal-proof-attention-phase", phase);
    expect(await stage.locator(
      "[data-kp-normal-proof-stage-viewport]"
    ).boundingBox()).toEqual(viewportBox);
  }

  await seekNormalProofStage(stage, 5_500);
  expect(await stage.locator(
    '[data-kp-normal-proof-moving="true"]'
  ).evaluateAll((nodes) => nodes.every((node) =>
    getComputedStyle(node).opacity === "1"
  ))).toBe(true);
  const signature = await stage.evaluate((node) => ({
    checkpoint: (node as HTMLElement).dataset["kpNormalProofActiveCheckpoint"],
    phase: (node as HTMLElement).dataset["kpNormalProofAttentionPhase"],
    moving: node.querySelectorAll('[data-kp-normal-proof-moving="true"]').length
  }));
  await seekNormalProofStage(stage, 7_100);
  await seekNormalProofStage(stage, 5_500);
  expect(await stage.evaluate((node) => ({
    checkpoint: (node as HTMLElement).dataset["kpNormalProofActiveCheckpoint"],
    phase: (node as HTMLElement).dataset["kpNormalProofAttentionPhase"],
    moving: node.querySelectorAll('[data-kp-normal-proof-moving="true"]').length
  }))).toEqual(signature);

  await seekNormalProofStage(stage, 7_200);
  await expect(stage).not.toHaveAttribute("data-kp-normal-proof-attention-phase", /.+/);
  await expect(stage).toHaveAttribute(
    "data-kp-normal-proof-active-checkpoint",
    "norm-equation"
  );
  await expect(stage.locator(
    "[data-kp-normal-proof-settled-scene]:not([hidden])"
  )).toHaveCount(1);
  await expect(stage.locator("[data-kp-normal-proof-moving]")).toHaveCount(0);
});

async function seekNormalProofStage(
  stage: import("@playwright/test").Locator,
  timeMs: number
): Promise<void> {
  await stage.evaluate((node, requestedTimeMs) => {
    node.dispatchEvent(new CustomEvent("kp:normal-proof-seek", {
      detail: { timeMs: requestedTimeMs }
    }));
  }, timeMs);
}
