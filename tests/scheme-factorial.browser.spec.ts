import { mkdir } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

const route = "/tutorials/programming/scheme-factorial/";
const evidenceDirectory = "tmp/codex/scheme-factorial";

test.beforeEach(async () => {
  await mkdir(evidenceDirectory, { recursive: true });
});

test("captures the wide canonical story and direct checkpoint seeks", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_280, height: 900 });
  await page.goto(route);
  const root = page.locator("#app");
  await expect(root).toHaveAttribute(
    "data-kp-scheme-factorial-tutorial-mounted",
    "true"
  );
  await expect(page.getByRole("heading", {
    name: "How does (factorial 3) come back?"
  })).toBeVisible();
  await expect(page.locator("[data-kp-scheme-factorial-stage]")).toHaveAttribute(
    "data-kp-scheme-layout",
    "wide"
  );
  await expect(page.locator("kp-tutorial-scrub-bar")).toHaveAttribute(
    "data-kp-tutorial-scrub-enhancement",
    "ready"
  );
  await expect(page.locator("[data-kp-scheme-factorial-caption]")).toContainText(
    "definition"
  );
  await assertNoOverflow(page);
  await page.screenshot({
    path: `${evidenceDirectory}/wide-source.png`,
    fullPage: true
  });

  await page.goto(`${route}#kp-checkpoint-scheme-factorial.checkpoint.base-case`);
  await expect(root).toHaveAttribute(
    "data-kp-scheme-factorial-checkpoint",
    "scheme-factorial.checkpoint.base-case"
  );
  await expect(page.locator("[data-kp-scheme-factorial-caption]")).toContainText(
    "exact value 1"
  );
  await expect(page.locator("[data-kp-scheme-transient-overlay]")).toHaveCount(0);
  await page.screenshot({
    path: `${evidenceDirectory}/wide-base-case.png`,
    fullPage: true
  });

  await page.locator('a[data-action="next"]').click();
  await expect(root).toHaveAttribute(
    "data-kp-scheme-factorial-checkpoint",
    "scheme-factorial.checkpoint.return-cascade"
  );
  await expect(page).toHaveURL(/checkpoint\.return-cascade$/u);
});

test("scrubs canonical motifs with native endpoints and one paint owner", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_280, height: 900 });
  await page.goto(route);
  const seek = page.locator('input[data-action="seek"]');
  for (const [interval, local, kind] of [
    ["definition-seed", 0.2, "structural"],
    ["definition-seed", 0.75, "binding"],
    ["first-descent", 0.4, "primitive"],
    ["repeated-descent", 0.5, "summary"],
    ["base-case", 0.5, "branch"],
    ["return-cascade", 0.5, "return"]
  ] as const) {
    const progress = await timelineProgress(page, interval, local);
    await seek.fill(progress.toFixed(3));
    await expect(page.locator("[data-kp-scheme-transient-overlay]")).toHaveAttribute(
      "data-kp-scheme-motion-kind",
      kind
    );
    await expect(page.locator("[data-kp-scheme-paint-owner]")).toHaveCount(1);
    await expect(page.locator("[data-kp-scheme-native-layer] code").first())
      .toBeVisible();
  }
  await page.screenshot({
    path: `${evidenceDirectory}/wide-return-motion.png`,
    fullPage: true
  });
});

test("keeps fixed readable type on a compact phone stage", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${route}#kp-checkpoint-scheme-factorial.checkpoint.repeated-descent`);
  await expect(page.locator("[data-kp-scheme-factorial-stage]")).toHaveAttribute(
    "data-kp-scheme-layout",
    "compact"
  );
  const size = await page.locator(".kp-scheme-factorial-stage__native")
    .evaluate((element) => getComputedStyle(element).fontSize);
  expect(size).toBe("18px");
  await assertNoOverflow(page);
  await page.screenshot({
    path: `${evidenceDirectory}/phone-repeated-descent.png`,
    fullPage: true
  });
});

test("reduced motion preserves settled native code without overlays", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1_280, height: 900 });
  await page.goto(route);
  await page.locator('input[data-action="seek"]').fill("0.77");
  await expect(page.locator("[data-kp-scheme-transient-overlay]")).toHaveCount(0);
  await expect(page.locator("[data-kp-scheme-native-layer] code").first())
    .toBeVisible();
  await page.screenshot({
    path: `${evidenceDirectory}/reduced-return.png`,
    fullPage: true
  });
});

test("ships a searchable no-JavaScript fallback", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(route);
  await expect(page.getByRole("heading", {
    name: "How does (factorial 3) come back?"
  })).toBeVisible();
  const text = await page.locator("body").textContent();
  expect(text).toContain("(define (factorial n)");
  await expect(page.locator("[data-kp-scheme-checkpoint-transcript]")).toHaveCount(7);
  await expect(page.locator('input[data-action="seek"]')).toBeDisabled();
  await context.close();
});

test("keeps the learner resource boundary compact and evaluator-free", async ({
  page
}) => {
  const resources = new Set<string>();
  page.on("response", (response) => resources.add(response.url()));
  await page.goto(route);
  const names = [...resources].join("\n");
  expect(names).not.toMatch(/scheme-factorial-(?:evaluator|trace-artifact|trace\.generated)/u);
  expect(names).not.toMatch(/three\.module|katex|svelte/u);
  const artifactBytes = await page.locator(
    "script[data-kp-scheme-factorial-publication]"
  ).evaluate((element) => element.textContent?.length ?? 0);
  expect(artifactBytes).toBeLessThan(100_000);
});

async function assertNoOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - document.body.clientWidth,
    document: document.documentElement.scrollWidth -
      document.documentElement.clientWidth
  }));
  expect(overflow.body).toBeLessThanOrEqual(1);
  expect(overflow.document).toBeLessThanOrEqual(1);
}

async function timelineProgress(
  page: Page,
  motionKind: string,
  local: number
): Promise<number> {
  return page.locator("script[data-kp-scheme-factorial-publication]")
    .evaluate((element, input) => {
      const artifact = JSON.parse(element.textContent ?? "{}");
      const interval = artifact.timeline.intervals.find(
        (candidate: { motionKind: string }) =>
          candidate.motionKind === input.motionKind
      );
      if (interval === undefined) throw new Error("Missing timeline interval.");
      return interval.motion.start +
        (interval.motion.end - interval.motion.start) * input.local;
    }, { motionKind, local });
}
