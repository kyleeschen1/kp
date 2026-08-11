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
  const progress = root.locator("[data-kp-algebra-attention-progress]");
  const controls = root.locator(".kp-algebra-attention-stage__controls");
  const stageHost = root.locator("[data-kp-algebra-stage-host]");
  const canonical = page.locator(
    '[data-kp-canonical-equation-host="chrome-free-v1"]'
  );

  await expect(root).toBeVisible();
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-active-beat",
    "read-scope"
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
    initialBoxes.progress.top
  );
  expect(initialBoxes.progress.bottom).toBeLessThanOrEqual(
    initialBoxes.controls.top
  );
  expect(initialBoxes.root.top).toBeGreaterThanOrEqual(0);
  expect(initialBoxes.root.bottom).toBeLessThanOrEqual(900);

  await page.screenshot({
    path: resolve(outputRoot, "opening.png"),
    animations: "disabled"
  });

  await canonical.evaluate((element) => {
    element.setAttribute("data-kp-test-retained-attention-stage", "true");
  });
  const backBox = await requiredBox(
    root.getByRole("button", { name: "Back" })
  );
  const forwardBox = await requiredBox(
    root.getByRole("button", { name: "Forward" })
  );
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
  await root.getByRole("button", { name: "Forward" }).click();

  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-active-beat",
    "distribute:motion"
  );
  await expect(passage).toContainText(
    "Watch the outside factor distribute into both addends"
  );
  await expect(progress).not.toHaveJSProperty("value", 0);
  await expect(stageHost).toHaveAttribute(
    "data-kp-algebra-canonical-local-progress",
    "1000",
    { timeout: 4_000 }
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
  await expect(passage).toBeVisible();
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
  expectBoxClose(
    await requiredBox(root.getByRole("button", { name: "Back" })),
    backBox
  );
  expectBoxClose(
    await requiredBox(root.getByRole("button", { name: "Forward" })),
    forwardBox
  );

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

  async function readCompositionBoxes() {
    return {
      root: await requiredBox(root),
      visual: await requiredBox(visual),
      passage: await requiredBox(root.locator(
        "[data-kp-algebra-attention-beat]:not([hidden])"
      )),
      progress: await requiredBox(root.locator(
        ".kp-algebra-attention-stage__progress"
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
