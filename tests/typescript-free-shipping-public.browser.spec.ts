import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

const route = "/learn/code/free-shipping/";
const captureRoot = path.resolve("tmp/codex/public-typescript");

test("public TypeScript lesson enhances static truth and seeks directly", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "networkidle" });

  const lesson = page.locator("[data-kp-public-typescript-lesson]");
  const stageHost = page.locator("[data-kp-public-typescript-stage]");
  const stage = page.locator("[data-kp-typescript-refactor-stage]");
  const play = page.locator("[data-kp-public-typescript-play]");
  const seek = page.locator("[data-kp-public-typescript-seek]");

  await expect(lesson).toBeVisible();
  await expect(stageHost).toHaveAttribute(
    "data-kp-public-typescript-enhanced",
    "true"
  );
  await expect(play).toBeEnabled();
  await expect(seek).toBeEnabled();
  await expect(stage).toHaveAttribute(
    "data-kp-typescript-active-projection",
    "projection.typescript.before"
  );
  await expect(stage.locator(
    '[data-kp-typescript-projection-current="true"] ' +
    '[data-kp-typescript-syntax-kind="number"]'
  ).first()).toHaveCSS("color", "rgb(237, 232, 208)");

  const initialSize = await stage.evaluate(size);
  await seek.evaluate((node) => {
    const range = node as HTMLInputElement;
    range.value = "0.68";
    range.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(stageHost).toHaveAttribute(
    "data-kp-public-typescript-progress",
    "0.6800"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-typescript-active-projection",
    "projection.typescript.cost-replaced"
  );
  expect(await stage.evaluate(size)).toEqual(initialSize);

  await page.locator(".kp-public-stage__chapters summary").click();
  await page.locator(
    '[data-kp-public-typescript-checkpoint="stage.verify-parity"]'
  ).click();
  await expect(stageHost).toHaveAttribute(
    "data-kp-public-typescript-progress",
    "1.0000"
  );
  await expect(page).toHaveURL(
    /checkpoint=stage\.verify-parity#refactor-stage$/u
  );
  await expect(stage).toHaveAttribute(
    "data-kp-typescript-active-projection",
    "projection.typescript.final"
  );
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth + 1
  )).toBe(true);
  await page.locator("[data-kp-dev-toolbar]").evaluate((node) => {
    (node as HTMLElement).style.display = "none";
  });
  await page.locator(".kp-public-stage__chapters summary").click();
  await mkdir(captureRoot, { recursive: true });
  await lesson.screenshot({ path: path.join(captureRoot, "wide.png") });
});

test("development mode mounts the shared Review and Pages chrome", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "networkidle" });

  await expect(page.locator("[data-kp-dev-review-shell]")).toHaveCount(1);
  await expect(page.locator("[data-kp-dev-toolbar]")).toHaveCount(1);
  const buildIdentity = await page.request.get("/__kp/dev-review/build");
  expect(buildIdentity.ok()).toBe(true);
  expect(await buildIdentity.json()).toMatchObject({ dirty: expect.any(Boolean) });
  await page.locator(
    '[data-kp-dev-toolbar-control="kp.dev-toolbar.pages"] summary'
  ).click();
  await expect(page.locator(
    '[data-kp-dev-toolbar-page="tutorial.public-typescript-free-shipping"]'
  )).toHaveAttribute("aria-current", "page");
});

test("checkpoint URL restores one endpoint without playback", async ({ page }) => {
  await page.goto(
    `${route}?checkpoint=stage.introduce-helper#refactor-stage`,
    { waitUntil: "networkidle" }
  );

  await expect(page.locator("[data-kp-public-typescript-stage]")).toHaveAttribute(
    "data-kp-public-typescript-progress",
    "0.3400"
  );
  await expect(page.locator("[data-kp-typescript-refactor-stage]")).toHaveAttribute(
    "data-kp-typescript-active-projection",
    "projection.typescript.helper-introduced"
  );
  await expect(page.locator("[data-kp-public-typescript-play]")).toHaveText(
    "Play"
  );
});

test("reduced motion maps free scrubbing to direct semantic checkpoints", async ({
  browser,
  baseURL
}) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  try {
    await page.goto(new URL(route, baseURL).toString(), {
      waitUntil: "networkidle"
    });
    await page.locator("[data-kp-public-typescript-seek]").evaluate((node) => {
      const range = node as HTMLInputElement;
      range.value = "0.4";
      range.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await expect(page.locator("[data-kp-public-typescript-stage]")).toHaveAttribute(
      "data-kp-public-typescript-progress",
      "0.3400"
    );
    await expect(page.locator("[data-kp-typescript-refactor-stage]")).toHaveAttribute(
      "data-kp-typescript-motion-mode",
      "reduced"
    );
    await expect(page.locator(
      "[data-kp-typescript-token-theater-active=true]"
    )).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test("phone composition preserves source and controls without overflow", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route, { waitUntil: "networkidle" });

  await expect(page.locator("[data-kp-public-typescript-stage]")).toBeVisible();
  await expect(page.locator("[data-kp-public-typescript-play]")).toBeVisible();
  await expect(page.locator("[data-kp-public-typescript-seek]")).toBeVisible();
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth + 1
  )).toBe(true);
  await page.locator("[data-kp-dev-toolbar]").evaluate((node) => {
    (node as HTMLElement).style.display = "none";
  });
  await mkdir(captureRoot, { recursive: true });
  await page.locator("[data-kp-public-typescript-lesson]").screenshot({
    path: path.join(captureRoot, "phone.png")
  });
});

test("the complete lesson remains readable without client JavaScript", async ({
  browser,
  baseURL
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(new URL(route, baseURL).toString());
    await expect(page.getByRole("heading", {
      name: "One rule, one answer"
    })).toBeVisible();
    await expect(page.locator("[data-kp-typescript-refactor-stage]")).toBeVisible();
    await expect(page.locator("[data-kp-public-typescript-play]")).toBeDisabled();
    await page.locator(".kp-public-stage__transcript summary").click();
    await expect(page.locator(".kp-public-stage__transcript pre")).toHaveCount(2);
  } finally {
    await context.close();
  }
});

function size(node: Element): { width: number; height: number } {
  const rect = node.getBoundingClientRect();
  return { width: Math.round(rect.width), height: Math.round(rect.height) };
}
