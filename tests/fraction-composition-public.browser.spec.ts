import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

const route = "/learn/math/fraction-composition/";
const captureRoot = path.resolve("tmp/codex/public-fraction-composition");

test("public symbolic lesson enhances the canonical stage and seeks directly", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);

  const lesson = page.locator("[data-kp-public-symbolic-lesson]");
  const root = page.locator("[data-kp-algebra-attention-stage]");
  const stageHost = root.locator("[data-kp-algebra-stage-host]");
  const canonical = root.locator(
    '[data-kp-canonical-equation-host="chrome-free-v1"]'
  );
  const scrubber = root.locator("[data-kp-algebra-attention-scrubber]");

  await expect(lesson).toBeVisible();
  await expect(root).toBeVisible();
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-active-beat",
    "read-scope"
  );
  await expect(canonical).toHaveCount(1);
  await expect(canonical).toHaveAttribute(
    "data-kp-reader-canonical-equation-session-active",
    "true"
  );
  await expect(scrubber).toBeEnabled();
  const initialSize = await canonical.evaluate(size);

  await scrubber.fill("100");
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-active-beat",
    "distribute:motion"
  );
  await expect(stageHost).toHaveAttribute(
    "data-kp-algebra-canonical-global-progress",
    "100"
  );
  await expect(canonical).toHaveCount(1);
  expect(await canonical.evaluate(size)).toEqual(initialSize);

  await scrubber.fill("300");
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-active-beat",
    "evaluate-constant:motion"
  );
  await expect(root.locator(
    "[data-kp-algebra-attention-beat]:not([hidden])"
  )).toContainText("constant becomes");
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth + 1
  )).toBe(true);

  await page.locator("[data-kp-dev-toolbar]").evaluate((node) => {
    (node as HTMLElement).style.display = "none";
  });
  await mkdir(captureRoot, { recursive: true });
  await lesson.screenshot({ path: path.join(captureRoot, "wide.png") });
});

test("opt-in distribution arc keeps its cue stable and holds native settlement", async ({
  page
}) => {
  await page.goto(`${route}?attentionArc=distribution`, {
    waitUntil: "domcontentloaded"
  });

  const root = page.locator("[data-kp-algebra-attention-stage]");
  const stageHost = root.locator("[data-kp-algebra-stage-host]");
  const canonical = root.locator(
    '[data-kp-canonical-equation-host="chrome-free-v1"]'
  );
  const toggle = root.locator(
    '[data-kp-algebra-attention-action="toggle"]'
  );
  const scrubber = root.locator("[data-kp-algebra-attention-scrubber]");
  const arcInstruction = root.locator(
    "[data-kp-algebra-attention-arc-instruction]"
  );
  const interpretation = root.locator(
    "[data-kp-algebra-attention-interpretation]"
  );

  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-variant",
    "distribution-arc"
  );
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-active-beat",
    "distribute:motion"
  );
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-arc-phase",
    "prepare"
  );
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-duration-ms",
    "4800"
  );
  await expect(stageHost).toHaveAttribute(
    "data-kp-algebra-canonical-range",
    "distribute-and-normalize"
  );
  await expect(arcInstruction).toBeVisible();
  await expect(arcInstruction).toContainText(
    "Follow the factor as it distributes into both addends"
  );
  await expect(arcInstruction).toContainText(
    "Keep the denominator"
  );
  await expect(arcInstruction).toContainText(
    "attached to each resulting fraction"
  );
  await expect(interpretation).toBeHidden();
  await mkdir(captureRoot, { recursive: true });
  await root.screenshot({
    path: path.join(captureRoot, "attention-arc-opening.png"),
    animations: "disabled"
  });

  const instructionText = await arcInstruction.textContent();
  await toggle.click();
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-arc-phase",
    "transform"
  );
  await expect.poll(async () => Number(
    await stageHost.getAttribute("data-kp-algebra-canonical-local-progress")
  )).toBeGreaterThan(0);
  expect(await arcInstruction.textContent()).toBe(instructionText);
  await toggle.click();

  await scrubber.fill("1000");
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-arc-phase",
    "settle"
  );
  await expect(stageHost).toHaveAttribute(
    "data-kp-algebra-canonical-local-progress",
    "1000"
  );
  await expect(canonical).toHaveAttribute(
    "data-kp-reader-accessible-equation-state",
    "fraction-solve.state.normalized"
  );
  await expect(arcInstruction).toBeHidden();
  await expect(interpretation).toBeVisible();
  await expect(interpretation).toContainText(
    "Nothing crossed the equals sign"
  );
  await expect(toggle).toHaveText("Replay");
  await root.screenshot({
    path: path.join(captureRoot, "attention-arc-settled.png"),
    animations: "disabled"
  });

  await scrubber.fill("500");
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-arc-phase",
    "transform"
  );
  await expect(arcInstruction).toBeVisible();
  await expect(interpretation).toBeHidden();
  await expect(canonical).toHaveCount(1);
});

test("opt-in distribution arc reduces motion to its direct endpoint", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${route}?attentionArc=distribution`, {
    waitUntil: "domcontentloaded"
  });

  const root = page.locator("[data-kp-algebra-attention-stage]");
  const stageHost = root.locator("[data-kp-algebra-stage-host]");
  await root.locator(
    '[data-kp-algebra-attention-action="toggle"]'
  ).click();

  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-arc-phase",
    "settle"
  );
  await expect(stageHost).toHaveAttribute(
    "data-kp-algebra-canonical-local-progress",
    "1000"
  );
  await expect(root.locator(
    '[data-kp-canonical-equation-host="chrome-free-v1"]'
  )).toHaveAttribute(
    "data-kp-reader-accessible-equation-state",
    "fraction-solve.state.normalized"
  );
});

test("distributed evidence compares two static operations without a live session", async ({
  page
}) => {
  await page.goto(`${route}?evidence=static`, {
    waitUntil: "domcontentloaded"
  });

  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-algebra-view",
    "distributed-evidence-static"
  );
  await expect(page.locator(
    "[data-kp-algebra-attention-stage]"
  )).toBeHidden();
  await expect(page.locator(
    '[data-kp-canonical-equation-host="chrome-free-v1"]'
  )).toHaveCount(0);
  await expect(page.locator(
    '[data-kp-algebra-evidence-range="distribute-and-normalize"]'
  )).toBeVisible();
  await expect(page.locator(
    '[data-kp-algebra-evidence-range="evaluate-constant"]'
  )).toBeVisible();
  const article = page.getByRole("article");
  await expect(article.getByText(
    "Follow the factor as it distributes into both addends."
  )).toBeVisible();
  await expect(article.getByText(
    "Hold the variable fraction in place while"
  )).toBeVisible();
  await page.locator("[data-kp-dev-toolbar]").evaluate((node) => {
    (node as HTMLElement).style.display = "none";
  });
  await page.locator("#distribute").scrollIntoViewIfNeeded();
  await mkdir(captureRoot, { recursive: true });
  await page.screenshot({
    path: path.join(captureRoot, "distributed-static.png"),
    animations: "disabled"
  });
});

test("distributed evidence reuses one live renderer across consecutive sockets", async ({
  page
}) => {
  await page.goto(`${route}?evidence=motion`, {
    waitUntil: "domcontentloaded"
  });

  const publication = page.locator(
    "[data-kp-algebra-fraction-composition-publication]"
  );
  const stageHost = page.locator("[data-kp-algebra-stage-host]");
  const first = page.locator(
    '[data-kp-algebra-evidence-range="distribute-and-normalize"]'
  );
  const second = page.locator(
    '[data-kp-algebra-evidence-range="evaluate-constant"]'
  );
  const canonical = page.locator(
    '[data-kp-canonical-equation-host="chrome-free-v1"]'
  );

  await expect(publication).toHaveAttribute(
    "data-kp-algebra-evidence-active-range",
    "distribute-and-normalize"
  );
  await expect(stageHost).toHaveAttribute(
    "data-kp-algebra-canonical-range",
    "distribute-and-normalize"
  );
  await expect(canonical).toHaveCount(1);
  await expect(first.locator("[data-kp-algebra-live-surface]")).toHaveCount(1);
  await first.locator("[data-kp-algebra-range-scrubber]").fill("1000");
  await expect(canonical).toHaveAttribute(
    "data-kp-reader-accessible-equation-state",
    "fraction-solve.state.normalized"
  );

  await second.locator("[data-kp-algebra-evidence-activate]").click();
  await expect(publication).toHaveAttribute(
    "data-kp-algebra-evidence-active-range",
    "evaluate-constant"
  );
  await expect(stageHost).toHaveAttribute(
    "data-kp-algebra-canonical-range",
    "evaluate-constant"
  );
  await expect(first.locator(
    ':scope > [data-kp-algebra-static-checkpoint="normalized"]'
  )).toBeVisible();
  await expect(second.locator("[data-kp-algebra-live-surface]")).toHaveCount(1);
  await expect(canonical).toHaveCount(1);
  await expect(canonical).toHaveAttribute(
    "data-kp-reader-accessible-equation-state",
    "fraction-solve.state.normalized"
  );
  await second.locator("[data-kp-algebra-range-scrubber]").fill("1000");
  await expect(canonical).toHaveAttribute(
    "data-kp-reader-accessible-equation-state",
    "fraction-solve.state.constant-quotient"
  );
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth + 1
  )).toBe(true);
  await page.locator("[data-kp-dev-toolbar]").evaluate((node) => {
    (node as HTMLElement).style.display = "none";
  });
  await second.scrollIntoViewIfNeeded();
  await mkdir(captureRoot, { recursive: true });
  await page.screenshot({
    path: path.join(captureRoot, "distributed-motion.png"),
    animations: "disabled"
  });
});

test("public symbolic route restores a semantic endpoint without replay", async ({
  page
}) => {
  await page.goto(`${route}#kp-ref:solve/normalized`, {
    waitUntil: "domcontentloaded"
  });

  const host = page.locator("[data-kp-algebra-stage-host]");
  await expect(host).toHaveAttribute("data-kp-algebra-location-kind", "checkpoint");
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-range-status",
    /idle|settled|paused/u
  );
  expect(Number(await host.getAttribute(
    "data-kp-algebra-canonical-global-progress"
  ))).toBeGreaterThan(0);
});

test("phone composition keeps the complete stage and controls in view", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route, { waitUntil: "domcontentloaded" });

  await expect(page.locator("[data-kp-algebra-attention-visual]")).toBeVisible();
  await expect(page.locator(
    '[data-kp-algebra-attention-action="toggle"]'
  )).toBeVisible();
  await expect(page.locator(
    "[data-kp-algebra-attention-scrubber]"
  )).toBeVisible();
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth + 1
  )).toBe(true);
  await page.locator("[data-kp-dev-toolbar]").evaluate((node) => {
    (node as HTMLElement).style.display = "none";
  });
  await mkdir(captureRoot, { recursive: true });
  await page.locator("[data-kp-public-symbolic-lesson]").screenshot({
    path: path.join(captureRoot, "phone.png")
  });
});

test("the complete lesson remains searchable without client JavaScript", async ({
  browser,
  baseURL
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(new URL(route, baseURL).toString());
    await expect(page.getByRole("heading", {
      name: "What does the fraction multiply?"
    }).first()).toBeVisible();
    await expect(page.getByRole("article").getByText(
      "Follow the factor as it distributes into both addends."
    )).toBeVisible();
    await expect(page.locator(
      "[data-kp-algebra-attention-stage]"
    )).toBeHidden();
    await expect(page.locator(
      ".kp-algebra-article > article .kp-article-math--display .katex"
    ).first()).toBeVisible();
    await expect(page.locator(
      "[data-kp-algebra-attention-scrubber]"
    )).toBeDisabled();
  } finally {
    await context.close();
  }
});

function size(node: Element): { width: number; height: number } {
  const rect = node.getBoundingClientRect();
  return { width: Math.round(rect.width), height: Math.round(rect.height) };
}
