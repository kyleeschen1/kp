import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { expect, test } from "@playwright/test";

const route = "/tutorials/algebra/fraction-composition/?view=attention-stage";
const outputRoot = resolve("tmp/codex/algebra-attention-stage");

test.beforeAll(async () => {
  await mkdir(outputRoot, { recursive: true });
});

test("the attention stage re-frames one searchable canonical equation", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);

  const root = page.locator("[data-kp-algebra-attention-stage]");
  const visual = root.locator("[data-kp-algebra-attention-visual]");
  const passage = root.locator(
    "[data-kp-algebra-attention-beat]:not([hidden])"
  );
  const controls = root.locator(".kp-algebra-attention-stage__controls");
  const back = root.locator('[data-kp-algebra-attention-action="back"]');
  const primary = root.locator(
    '[data-kp-algebra-attention-action="continue"]'
  );
  const stageHost = root.locator("[data-kp-algebra-stage-host]");
  const canonical = page.locator(
    '[data-kp-canonical-equation-host="chrome-free-v1"]'
  );

  await expect(root).toBeVisible();
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-active-beat",
    "read-scope"
  );
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-tempo",
    "deliberate"
  );
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-duration-ms",
    "31200"
  );
  await expect(passage).toContainText(
    "The factor multiplies the complete grouped expression"
  );
  await expect(canonical).toHaveCount(1);
  await expect(canonical).toHaveAttribute(
    "data-kp-reader-canonical-equation-session-active",
    "true"
  );
  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveCount(0);

  const initialBoxes = await readCompositionBoxes();
  expect(initialBoxes.visual.bottom).toBeLessThanOrEqual(
    initialBoxes.passage.top
  );
  expect(initialBoxes.passage.bottom).toBeLessThanOrEqual(
    initialBoxes.controls.top
  );
  expect(initialBoxes.root.top).toBeGreaterThanOrEqual(0);
  expect(initialBoxes.root.bottom).toBeLessThanOrEqual(900);

  await page.screenshot({
    path: resolve(outputRoot, "opening.png"),
    animations: "disabled"
  });

  const stageColors = await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>(
      ".kp-reader-equation-stage"
    );
    const host = document.querySelector<HTMLElement>(
      "[data-kp-algebra-stage-host]"
    );
    if (stage === null || host === null) {
      throw new Error("Expected canonical attention-stage surfaces.");
    }
    const hostStyle = getComputedStyle(host);
    return {
      stage: getComputedStyle(stage).backgroundColor,
      semanticSurface: hostStyle.getPropertyValue("--kp-semantic-surface")
        .trim(),
      attentionSurface: hostStyle.getPropertyValue(
        "--kp-algebra-attention-surface"
      ).trim()
    };
  });
  expect(stageColors.stage).not.toBe("rgb(255, 255, 255)");
  expect(stageColors.semanticSurface).toBe(stageColors.attentionSurface);
  const salienceOpacities = await canonical.locator(
    "[data-kp-fraction-salience-bound]"
  ).evaluateAll((elements) => elements.map((element) =>
    getComputedStyle(element).opacity
  ));
  expect(salienceOpacities.length).toBeGreaterThan(0);
  expect([...new Set(salienceOpacities)]).toEqual(["1"]);
  await expect(controls.locator("button")).toHaveCount(2);
  await expect(root.locator(
    "[data-kp-algebra-attention-progress]"
  )).toHaveCount(0);

  await canonical.evaluate((element) => {
    element.setAttribute("data-kp-test-retained-attention-stage", "true");
  });
  const backBox = await requiredBox(back);
  const primaryBox = await requiredBox(primary);
  await stageHost.evaluate((element) => {
    const samples: string[] = [];
    const record = () => {
      samples.push([
        element.dataset["kpAlgebraCanonicalRangeStatus"],
        element.dataset["kpAlgebraCanonicalLocalProgress"]
      ].join(":"));
      element.dataset["kpTestAttentionTimelineSamples"] = samples.join(",");
    };
    const observer = new MutationObserver(() => {
      record();
      if (element.dataset["kpAlgebraCanonicalRangeStatus"] === "settled") {
        observer.disconnect();
      }
    });
    observer.observe(element, {
      attributes: true,
      attributeFilter: [
        "data-kp-algebra-canonical-range-status",
        "data-kp-algebra-canonical-local-progress"
      ]
    });
    record();
  });
  await primary.click();

  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-active-beat",
    "distribute:motion"
  );
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-motion-state",
    "orient"
  );
  await expect(passage).toContainText(
    "Watch the outside factor distribute into both addends"
  );
  const motionPassage = await passage.textContent();
  await expect(stageHost).toHaveAttribute(
    "data-kp-algebra-canonical-local-progress",
    "0"
  );
  await expect(primary).toHaveText("Continue");
  await expect(primary).toHaveAttribute(
    "data-kp-algebra-attention-primary-state",
    "play"
  );
  await expect(primary).toBeEnabled();

  await primary.click();
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-motion-state",
    "acting"
  );
  await expect(primary).toHaveText("Pause");
  await expect(passage).toHaveText(motionPassage ?? "");
  await expect(stageHost).toHaveAttribute(
    "data-kp-algebra-canonical-local-progress",
    "1000",
    { timeout: 7_000 }
  );
  await expect(stageHost).toHaveAttribute(
    "data-kp-test-attention-timeline-samples",
    /settled:1000/u
  );
  const timelineSamples = (
    await stageHost.getAttribute("data-kp-test-attention-timeline-samples") ?? ""
  ).split(",");
  expect(timelineSamples.some((sample) => sample.startsWith("playing:")))
    .toBe(true);
  expect(timelineSamples).toContainEqual(
    expect.stringMatching(/^playing:(?:[1-9]\d{0,2})$/u)
  );
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-motion-state",
    "inspect"
  );
  await expect(primary).toHaveText("Continue");
  await expect(primary).toHaveAttribute(
    "data-kp-algebra-attention-primary-state",
    "advance"
  );
  await expect(passage).toHaveText(motionPassage ?? "");
  await expect(passage).toBeVisible();
  const heldGlobalProgress = await stageHost.getAttribute(
    "data-kp-algebra-canonical-global-progress"
  );
  expect(heldGlobalProgress).not.toBeNull();
  await expect(page.locator(
    "[data-kp-algebra-fraction-composition-publication]"
  )).toHaveAttribute("data-kp-article-semantic-focus-source", "story");
  await expect(page.locator(".kp-reader-semantic-focus")).not.toHaveCount(0);
  await expect(canonical).toHaveCount(1);
  await expect(canonical).toHaveAttribute(
    "data-kp-test-retained-attention-stage",
    "true"
  );

  const settledBoxes = await readCompositionBoxes();
  expectClose(settledBoxes.visual.width, initialBoxes.visual.width);
  expectClose(settledBoxes.visual.height, initialBoxes.visual.height);
  expectBoxClose(await requiredBox(back), backBox);
  expectBoxClose(await requiredBox(primary), primaryBox);

  const article = root.locator("+ article");
  await expect(article.getByRole("heading", {
    name: "What does the fraction multiply?"
  })).toBeAttached();
  await expect(article).toContainText("Read the grouped expression first");
  await expect(article).toContainText("Check the result in the original equation");

  await page.screenshot({
    path: resolve(outputRoot, "distribution-settled.png"),
    animations: "disabled"
  });

  await primary.click();
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-active-beat",
    "evaluate-constant:motion"
  );
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-motion-state",
    "orient"
  );
  await expect(stageHost).toHaveAttribute(
    "data-kp-algebra-canonical-local-progress",
    "0"
  );
  await expect(stageHost).toHaveAttribute(
    "data-kp-algebra-canonical-global-progress",
    heldGlobalProgress!
  );

  async function readCompositionBoxes() {
    return {
      root: await requiredBox(root),
      visual: await requiredBox(visual),
      passage: await requiredBox(root.locator(
        "[data-kp-algebra-attention-beat]:not([hidden])"
      )),
      controls: await requiredBox(controls)
    };
  }
});

interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

async function requiredBox(locator: {
  boundingBox(): Promise<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>;
}): Promise<Box> {
  const box = await locator.boundingBox();
  if (box === null) throw new Error("Expected a rendered attention-stage box.");
  return Object.freeze({
    ...box,
    top: box.y,
    right: box.x + box.width,
    bottom: box.y + box.height,
    left: box.x
  });
}

function expectBoxClose(actual: Box, expected: Box): void {
  expectClose(actual.x, expected.x);
  expectClose(actual.y, expected.y);
  expectClose(actual.width, expected.width);
  expectClose(actual.height, expected.height);
}

function expectClose(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
}
