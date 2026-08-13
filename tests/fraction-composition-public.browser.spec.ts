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
    await expect(page.getByText(
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
