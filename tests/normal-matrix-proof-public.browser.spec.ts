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
  await expect(stage.locator(
    "[data-kp-normal-proof-scrub]"
  )).toBeEnabled();
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
  await expect(fallback.locator(
    "[data-kp-normal-proof-scrub]"
  )).toBeDisabled();
  await expect(page.locator("[data-kp-normal-proof-session]")).toHaveCount(0);
});

test("direct checkpoint URLs restore one endpoint without replay", async ({ page }) => {
  await page.goto(
    `${route}?checkpoint=norm-equation&utm_source=return#proof-stage`,
    { waitUntil: "domcontentloaded" }
  );
  const stage = page.locator("[data-kp-normal-proof-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-normal-proof-active-checkpoint",
    "norm-equation"
  );
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute("data-kp-normal-proof-time-ms", "7200");
  await expect(stage.locator(
    '[data-kp-normal-proof-settled-scene="norm-equation"]'
  )).toBeVisible();
  await expect(stage.locator("[data-kp-normal-proof-moving]"))
    .toHaveCount(0);
  expect(new URL(page.url()).searchParams.get("utm_source")).toBe("return");
  expect(new URL(page.url()).hash).toBe("#proof-stage");
});

test("static direct checkpoint projection creates no motion session", async ({
  page
}) => {
  await page.goto(`${route}?checkpoint=remainder-zero&evidence=static`, {
    waitUntil: "domcontentloaded"
  });
  const stage = page.locator("[data-kp-normal-proof-stage]");

  await expect(stage).toHaveAttribute(
    "data-kp-normal-proof-active-checkpoint",
    "remainder-zero"
  );
  await expect(stage.locator(
    '[data-kp-normal-proof-settled-scene="remainder-zero"]'
  )).toBeVisible();
  await expect(stage.locator("[data-kp-normal-proof-scrub]")).toBeDisabled();
  await expect(page.locator("[data-kp-normal-proof-session]")).toHaveCount(0);
});

test("scrubbing replaces checkpoint history and popstate restores directly", async ({
  page
}) => {
  await page.goto(`${route}?checkpoint=row-column-norms&utm_source=return`, {
    waitUntil: "domcontentloaded"
  });
  const stage = page.locator("[data-kp-normal-proof-stage]");
  await stage.scrollIntoViewIfNeeded();
  const scrub = stage.locator("[data-kp-normal-proof-scrub]");
  await expect(scrub).toBeEnabled();

  await scrub.evaluate((input) => {
    (input as HTMLInputElement).value = "9600";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(stage).toHaveAttribute(
    "data-kp-normal-proof-active-checkpoint",
    "remainder-zero"
  );
  expect(new URL(page.url()).searchParams.get("checkpoint"))
    .toBe("remainder-zero");
  expect(new URL(page.url()).searchParams.get("utm_source")).toBe("return");

  await page.evaluate(() => {
    window.history.pushState(null, "", "?checkpoint=eigenbasis&utm_source=return");
  });
  await page.goBack();
  await expect(stage).toHaveAttribute(
    "data-kp-normal-proof-active-checkpoint",
    "remainder-zero"
  );
  await page.goForward();
  await expect(stage).toHaveAttribute(
    "data-kp-normal-proof-active-checkpoint",
    "eigenbasis"
  );
  await expect(stage).toHaveAttribute("data-kp-normal-proof-time-ms", "4800");
});

test("one compact control seeks continuously and jumps among checkpoint stops", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const stage = page.locator("[data-kp-normal-proof-stage]");
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute(
    "data-kp-normal-proof-session",
    "deterministic-seek"
  );
  const scrub = stage.locator("[data-kp-normal-proof-scrub]");
  const status = stage.locator(".kp-nps");
  const controlsBox = await stage.locator(
    ".kp-normal-proof-controls"
  ).boundingBox();
  await expect(scrub).toBeEnabled();
  await expect(scrub).toHaveValue("0");

  await scrub.evaluate((input, timeMs) => {
    (input as HTMLInputElement).value = String(timeMs);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, 5_500);
  await expect(stage).toHaveAttribute("data-kp-normal-proof-time-ms", "5500");
  await expect(scrub).toHaveValue("5500");
  await expect(status).toContainText("Rows and columns become product entries");

  await scrub.press("ArrowRight");
  await expect(stage).toHaveAttribute("data-kp-normal-proof-time-ms", "7200");
  await scrub.press("ArrowLeft");
  await expect(stage).toHaveAttribute("data-kp-normal-proof-time-ms", "4800");
  await scrub.press("Home");
  await expect(stage).toHaveAttribute("data-kp-normal-proof-time-ms", "0");
  await scrub.press("End");
  await expect(stage).toHaveAttribute("data-kp-normal-proof-time-ms", "12000");

  await page.waitForTimeout(150);
  await expect(stage).toHaveAttribute("data-kp-normal-proof-time-ms", "12000");
  expect(await stage.locator(
    ".kp-normal-proof-controls"
  ).boundingBox()).toEqual(controlsBox);
});

test("cycle A seeks deterministically and hands its native endpoint to cycle B", async ({
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
  await expect(stage).toHaveAttribute("data-kp-normal-proof-attention-phase", "orient");
  await expect(stage).toHaveAttribute(
    "data-kp-normal-proof-active-checkpoint",
    "norm-equation"
  );
  await expect(stage.locator(
    "[data-kp-normal-proof-settled-scene]:not([hidden])"
  )).toHaveCount(1);
  await expect(stage.locator("[data-kp-normal-proof-moving]")).toHaveCount(0);
});

test("cycle B preserves r through handoff and settles the recursive endpoint", async ({
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

  await seekNormalProofStage(stage, 7_600);
  await expect(stage).toHaveAttribute("data-kp-normal-proof-attention-phase", "orient");
  await expect(stage.locator(
    "[data-kp-normal-proof-transient-copy]:not([hidden])"
  )).toHaveCount(0);

  await seekNormalProofStage(stage, 9_000);
  await expect(stage).toHaveAttribute("data-kp-normal-proof-attention-phase", "act");
  await expect(stage).toHaveAttribute(
    "data-kp-normal-proof-active-checkpoint",
    "norm-equation"
  );
  await expect(stage.locator(
    "[data-kp-normal-proof-transient-copy]:not([hidden])"
  )).toHaveCount(2);
  expect(await stage.locator(
    '[data-kp-normal-proof-transient-copy]:not([hidden])'
  ).evaluateAll((nodes) => nodes.every((node) =>
    getComputedStyle(node).opacity === "1"
  ))).toBe(true);

  await seekNormalProofStage(stage, 9_590);
  await expect(stage.locator(
    '[data-kp-normal-proof-transient-copy="remainder-zero"]'
  )).toHaveAttribute("data-kp-normal-proof-handoff", "complete");
  await expect(stage.locator(
    '[data-kp-normal-proof-settled-scene="norm-equation"] [data-kp-normal-proof-matrix-footprint] [data-kp-normal-proof-path="normal-proof/matrix/row-remainder"]'
  )).toContainText("r");

  await seekNormalProofStage(stage, 9_600);
  await expect(stage).toHaveAttribute("data-kp-normal-proof-attention-phase", "settle");
  await expect(stage.locator(
    "[data-kp-normal-proof-transient-copy]:not([hidden])"
  )).toHaveCount(0);
  await expect(stage).toHaveAttribute(
    "data-kp-normal-proof-active-checkpoint",
    "remainder-zero"
  );
  await expect(stage.locator(
    '[data-kp-normal-proof-settled-scene="remainder-zero"] [data-kp-normal-proof-matrix-footprint] [data-kp-normal-proof-path="normal-proof/matrix/row-remainder"]'
  )).toContainText("0");

  await seekNormalProofStage(stage, 10_800);
  await expect(stage).toHaveAttribute("data-kp-normal-proof-attention-phase", "inspect");
  await expect(stage.locator(
    '[data-kp-normal-proof-settled-scene="recursion"] [data-kp-normal-proof-moving="true"]'
  )).toHaveCount(1);
  expect(await stage.locator(
    "[data-kp-normal-proof-stage-viewport]"
  ).boundingBox()).toEqual(viewportBox);

  const inspectSignature = await stage.evaluate((node) => ({
    checkpoint: (node as HTMLElement).dataset["kpNormalProofActiveCheckpoint"],
    phase: (node as HTMLElement).dataset["kpNormalProofAttentionPhase"],
    moving: node.querySelectorAll('[data-kp-normal-proof-moving="true"]').length
  }));
  await seekNormalProofStage(stage, 8_300);
  await seekNormalProofStage(stage, 10_800);
  expect(await stage.evaluate((node) => ({
    checkpoint: (node as HTMLElement).dataset["kpNormalProofActiveCheckpoint"],
    phase: (node as HTMLElement).dataset["kpNormalProofAttentionPhase"],
    moving: node.querySelectorAll('[data-kp-normal-proof-moving="true"]').length
  }))).toEqual(inspectSignature);

  await seekNormalProofStage(stage, 12_000);
  await expect(stage).not.toHaveAttribute("data-kp-normal-proof-attention-phase", /.+/);
  await expect(stage).toHaveAttribute(
    "data-kp-normal-proof-active-checkpoint",
    "recursion"
  );
  await expect(stage.locator("[data-kp-normal-proof-moving]")).toHaveCount(0);
});

test("reduced motion snaps direct seeks to native checkpoint endpoints", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const stage = page.locator("[data-kp-normal-proof-stage]");
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute(
    "data-kp-normal-proof-session",
    "deterministic-seek"
  );

  await seekNormalProofStage(stage, 9_590);
  await expect(stage).toHaveAttribute("data-kp-normal-proof-time-ms", "7200");
  await expect(stage).toHaveAttribute(
    "data-kp-normal-proof-active-checkpoint",
    "norm-equation"
  );
  await expect(stage.locator("[data-kp-normal-proof-moving]")).toHaveCount(0);

  await seekNormalProofStage(stage, 9_600);
  await expect(stage).toHaveAttribute("data-kp-normal-proof-time-ms", "9600");
  await expect(stage).toHaveAttribute(
    "data-kp-normal-proof-active-checkpoint",
    "remainder-zero"
  );
  await expect(stage.locator(
    "[data-kp-normal-proof-transient-copy]:not([hidden])"
  )).toHaveCount(0);
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
