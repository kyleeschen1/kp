import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { expect, test } from "@playwright/test";

const route = "/tutorials/algebra/fraction-composition/?view=attention-stage";
const outputRoot = resolve("tmp/codex/algebra-attention-stage");

test.beforeAll(async () => {
  await mkdir(outputRoot, { recursive: true });
});

test("one semantic player continuously seeks the retained canonical equation", async ({
  page
}) => {
  let capturedReview: {
    readonly capture?: {
      readonly semantic?: {
        readonly documentId?: string;
        readonly activeTransformationIds?: readonly string[];
      };
    };
  } | undefined;
  await page.route("**/api/dev/reviews/v2/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith("/query")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(reviewQueryState())
      });
      return;
    }
    capturedReview = route.request().postDataJSON() as typeof capturedReview;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ...capturedReview,
        id: "review-note.1.algebra-attention",
        sequence: 1,
        status: "new"
      })
    });
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);

  const root = page.locator("[data-kp-algebra-attention-stage]");
  const visual = root.locator("[data-kp-algebra-attention-visual]");
  const passage = root.locator(
    "[data-kp-algebra-attention-beat]:not([hidden])"
  );
  const player = root.locator("[data-kp-algebra-attention-player]");
  const toggle = root.locator(
    '[data-kp-algebra-attention-action="toggle"]'
  );
  const scrubber = root.locator("[data-kp-algebra-attention-scrubber]");
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
  await expect(canonical).toHaveAttribute(
    "data-kp-reader-canonical-continuity-seams",
    "12"
  );
  expect(Number(await canonical.getAttribute(
    "data-kp-reader-canonical-baseline-residual"
  ))).toBeLessThanOrEqual(0.5);
  expect(Number(await canonical.getAttribute(
    "data-kp-reader-canonical-continuity-residual"
  ))).toBeLessThanOrEqual(0.5);
  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveCount(0);
  await expect(stageHost).toHaveAttribute(
    "data-kp-algebra-canonical-range",
    "attention-full-timeline"
  );
  await expect(toggle).toBeEnabled();
  await expect(scrubber).toBeEnabled();
  await expect(toggle).toHaveText("Play");
  await expect(player.locator("button")).toHaveCount(1);
  await expect(root.locator(
    ".kp-algebra-attention-stage__chapter-marks span"
  )).toHaveCount(6);

  const initialBoxes = await readCompositionBoxes();
  expect(initialBoxes.visual.bottom).toBeLessThanOrEqual(
    initialBoxes.passage.top
  );
  expect(initialBoxes.passage.bottom).toBeLessThanOrEqual(
    initialBoxes.player.top
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

  await canonical.evaluate((element) => {
    element.setAttribute("data-kp-test-retained-attention-stage", "true");
  });
  const visualBox = await requiredBox(visual);
  const playerBox = await requiredBox(player);

  // Direct seek changes the active chapter and canonical frame without
  // replaying earlier operations or replacing the equation host.
  await scrubber.fill("500");
  await expect(stageHost).toHaveAttribute(
    "data-kp-algebra-canonical-global-progress",
    "500"
  );
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-active-beat",
    "subtract-four:motion"
  );
  await expect(passage).toContainText("from the left and right together");
  await expect(scrubber).toHaveJSProperty("value", "500");
  await expect(canonical).toHaveCount(1);
  await expect(canonical).toHaveAttribute(
    "data-kp-test-retained-attention-stage",
    "true"
  );

  await scrubber.fill("100");
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-active-beat",
    "distribute:motion"
  );
  await expect(passage).toContainText("Watch the outside factor distribute");

  // The persistent plus sign follows product reflow on the shared math axis;
  // changing KaTeX wrapper heights must never introduce vertical travel.
  await scrubber.fill("20");
  const connectorEarly = await distributionConnectorCenter();
  await scrubber.fill("55");
  const connectorLate = await distributionConnectorCenter();
  expect(Math.abs(connectorLate.y - connectorEarly.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(connectorLate.x - connectorEarly.x)).toBeGreaterThan(1);

  // Playback and the visible slider consume the same physical clock.
  await scrubber.fill("0");
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-active-beat",
    "read-scope"
  );
  await toggle.click();
  await expect(toggle).toHaveText("Pause");
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-active-beat",
    "distribute:motion"
  );
  await expect.poll(async () => Number(
    await stageHost.getAttribute("data-kp-algebra-canonical-global-progress")
  )).toBeGreaterThan(0);
  await toggle.click();
  await expect(toggle).toHaveText("Play");

  await scrubber.fill("1000");
  await expect(stageHost).toHaveAttribute(
    "data-kp-algebra-canonical-global-progress",
    "1000"
  );
  await expect(root).toHaveAttribute(
    "data-kp-algebra-attention-active-beat",
    "verify-solution"
  );
  await expect(passage).toContainText(
    "into the original equation returns"
  );
  await expect(toggle).toHaveText("Replay");

  // The review shell loads after the first canonical sample. Its request must
  // replay that sample instead of leaving capture in an endless pending state.
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-dev-review-ready",
    "true"
  );
  const review = page.locator("[data-kp-dev-review-shell]");
  await page.locator("[data-kp-dev-toolbar]").getByRole("button", {
    name: "Review"
  }).click();
  await review.locator("textarea").fill("Check this algebra moment.");
  await expect(review.locator("button.save")).toBeEnabled();
  await review.locator("button.save").click();
  await expect(review.locator("output.status")).toHaveText("Saved note 1.");
  expect(capturedReview?.capture?.semantic?.documentId).toBe(
    "lesson.algebra.fraction-composition.article"
  );
  expect(
    capturedReview?.capture?.semantic?.activeTransformationIds?.length
  ).toBeGreaterThan(0);

  const settledBoxes = await readCompositionBoxes();
  expectClose(settledBoxes.visual.width, visualBox.width);
  expectClose(settledBoxes.visual.height, visualBox.height);
  expectBoxClose(await requiredBox(player), playerBox);

  const article = root.locator("+ article");
  await expect(article.getByRole("heading", {
    name: "What does the fraction multiply?"
  })).toBeAttached();
  await expect(article).toContainText("Read the grouped expression first");
  await expect(article).toContainText("Check the result in the original equation");

  await page.screenshot({
    path: resolve(outputRoot, "terminal.png"),
    animations: "disabled"
  });

  async function readCompositionBoxes() {
    return {
      root: await requiredBox(root),
      visual: await requiredBox(visual),
      passage: await requiredBox(root.locator(
        "[data-kp-algebra-attention-beat]:not([hidden])"
      )),
      player: await requiredBox(player)
    };
  }

  async function distributionConnectorCenter() {
    return canonical.evaluate((stage) => {
      const owners = [...stage.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-semantic-entity-id]"
      )].filter((owner) =>
        owner.dataset["kpEquationMaterialSemanticEntityId"] ===
          "fraction-fan-out.source.grouped-sum.operator.1" &&
        Number(getComputedStyle(owner).opacity) > 0.01
      );
      const owner = owners[0];
      if (owner === undefined) {
        throw new Error("Distribution connector material is not visible.");
      }
      const rect = owner.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    });
  }
});

function reviewQueryState(): unknown {
  return {
    query: { scope: "current", limit: 20, detail: "summary" },
    counts: {
      lifetime: 0,
      current: 0,
      currentNew: 0,
      historical: 0,
      matching: 0,
      byStatus: {
        new: 0,
        discussed: 0,
        grouped: 0,
        accepted: 0,
        fixed: 0,
        verified: 0,
        dismissed: 0
      }
    },
    rounds: [{
      id: "round.algebra-attention",
      sequence: 1,
      label: "Algebra attention",
      status: "open",
      synthetic: false,
      noteCount: 0,
      newCount: 0
    }],
    page: { notes: [], hasMore: false }
  };
}

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
