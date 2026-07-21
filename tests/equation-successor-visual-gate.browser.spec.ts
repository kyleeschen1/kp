import { expect, test, type Page } from "@playwright/test";

import { evaluateKpEquationMotionClearanceSequence } from
  "../src/rendering/equation-motion-clearance.ts";

const route = (progress: number) =>
  "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1" +
  `&kpProgress=${progress}`;

interface RectEvidence {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly opacity: number;
  readonly fontFamily: string;
}

interface SuccessorEvidence {
  readonly stageWidth: number;
  readonly seven: RectEvidence;
  readonly minus: RectEvidence;
  readonly three: RectEvidence;
  readonly four: RectEvidence;
  readonly x: RectEvidence;
  readonly equals: RectEvidence;
}

test("successor phases preserve expression order and exclusive target ownership", async ({ page }) => {
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(viewport);

    const converging = await evidenceAt(page, 867);
    expect(converging.seven.opacity).toBeGreaterThan(0.99);
    expect(converging.minus.opacity).toBeGreaterThan(0);
    expect(converging.minus.opacity).toBeLessThan(0.99);
    expect(converging.three.opacity).toBeGreaterThan(0.99);
    expect(converging.four.opacity).toBe(0);
    expect(centerX(converging.seven)).toBeLessThan(centerX(converging.minus));
    expect(centerX(converging.minus)).toBeLessThan(centerX(converging.three));
    expect(centerY(converging.seven)).toBeLessThan(centerY(converging.three));
    expect(centerY(converging.three) - centerY(converging.seven)).toBeGreaterThan(4);
    assertProtectedClearance(converging);
    assertWithinStage(converging);

    const catalystRetiring = await evidenceAt(page, 893);
    expect(catalystRetiring.minus.opacity).toBeLessThan(0.2);
    expect(catalystRetiring.seven.opacity).toBeGreaterThan(0.9);
    expect(catalystRetiring.three.opacity).toBeGreaterThan(0.9);
    expect(catalystRetiring.four.opacity).toBe(0);

    const operandsRetiring = await evidenceAt(page, 917);
    expect(operandsRetiring.minus.opacity).toBe(0);
    expect(operandsRetiring.seven.opacity).toBeGreaterThan(0);
    expect(operandsRetiring.three.opacity).toBeGreaterThan(0);
    expect(operandsRetiring.four.opacity).toBe(0);

    const sourcesCleared = await evidenceAt(page, 943);
    expect(sourcesCleared.seven.opacity).toBe(0);
    expect(sourcesCleared.minus.opacity).toBe(0);
    expect(sourcesCleared.three.opacity).toBe(0);
    expect(sourcesCleared.four.opacity).toBeGreaterThan(0.5);

    const result = await evidenceAt(page, 967);
    expect(result.seven.opacity).toBe(0);
    expect(result.minus.opacity).toBe(0);
    expect(result.three.opacity).toBe(0);
    expect(result.four.opacity).toBeGreaterThan(0.95);
    expect(result.four.fontFamily).toContain("KaTeX");
  }
});

test("dense successor sampling remains continuous and exactly retraces", async ({ page }) => {
  await page.goto(route(840));
  const forward = new Map<number, SuccessorEvidence>();
  const samples: SuccessorEvidence[] = [];
  for (let progress = 840; progress <= 968; progress += 4) {
    await seekByScroll(page, progress);
    const evidence = await successorEvidence(page);
    forward.set(progress, evidence);
    samples.push(evidence);
  }

  const travel = samples.slice(1).flatMap((sample, index) => [
    distance(sample.seven, samples[index]!.seven),
    distance(sample.minus, samples[index]!.minus),
    distance(sample.three, samples[index]!.three)
  ]);
  const opacityDelta = samples.slice(1).flatMap((sample, index) =>
    (["seven", "minus", "three", "four"] as const).map((symbol) => ({
      symbol,
      from: 840 + index * 4,
      to: 844 + index * 4,
      delta: Math.abs(sample[symbol].opacity - samples[index]![symbol].opacity)
    }))
  );
  expect(Math.max(...travel)).toBeLessThan(4);
  const maximumOpacityDelta = [...opacityDelta].sort(
    (left, right) => right.delta - left.delta
  )[0]!;
  expect(maximumOpacityDelta.delta, JSON.stringify(maximumOpacityDelta)).toBeLessThan(0.2);

  for (const progress of [968, 920, 880, 840]) {
    await seekByScroll(page, progress);
    const rewound = await successorEvidence(page);
    const original = forward.get(progress)!;
    for (const key of ["seven", "minus", "three", "four"] as const) {
      expect(distance(rewound[key], original[key])).toBeLessThan(0.1);
      expect(rewound[key].opacity).toBeCloseTo(original[key].opacity, 4);
    }
  }
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-playback-direction",
    "rewind"
  );
});

test("dense successor ink remains clear of protected continuants", async ({ page }) => {
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(route(780));
    const frames = [];
    const forward = new Map<number, SuccessorEvidence>();
    for (let progress = 780; progress <= 940; progress += 4) {
      await seekByScroll(page, progress);
      const evidence = await successorEvidence(page);
      forward.set(progress, evidence);
      frames.push(clearanceFrame(progress, evidence));
    }
    const report = evaluateKpEquationMotionClearanceSequence({
      frames,
      requirements: [{
        id: "solve-x.successor-protected-continuants",
        movingIds: ["seven", "minus", "three"],
        protectedIds: ["x", "equals"],
        minClearancePx: 2
      }],
      maxSpatialStepPx: 1,
      maxProgressStep: 0.004
    });
    expect(report.passed, JSON.stringify({
      first: frames[0],
      diagnostics: report.diagnostics.slice(0, 3)
    })).toBe(true);
    expect(report.minimumClearancePx).not.toBeNull();
    expect(report.sampledFrameCount).toBeGreaterThanOrEqual(frames.length);

    const rewindFrames = [];
    for (let progress = 940; progress >= 780; progress -= 4) {
      await seekByScroll(page, progress);
      const rewound = await successorEvidence(page);
      const original = forward.get(progress)!;
      for (const id of ["seven", "minus", "three", "x", "equals"] as const) {
        expect(distance(rewound[id], original[id])).toBeLessThan(0.1);
        expect(rewound[id].opacity).toBeCloseTo(original[id].opacity, 4);
      }
      rewindFrames.push(clearanceFrame(progress, rewound));
    }
    const rewindReport = evaluateKpEquationMotionClearanceSequence({
      frames: rewindFrames.reverse(),
      requirements: [{
        id: "solve-x.successor-protected-continuants",
        movingIds: ["seven", "minus", "three"],
        protectedIds: ["x", "equals"],
        minClearancePx: 2
      }],
      maxSpatialStepPx: 1,
      maxProgressStep: 0.004
    });
    expect(
      rewindReport.passed,
      JSON.stringify(rewindReport.diagnostics.slice(0, 3))
    ).toBe(true);
    await expect(page.locator("body")).toHaveAttribute(
      "data-kp-reader-playback-direction",
      "rewind"
    );
  }
});

function clearanceFrame(progress: number, evidence: SuccessorEvidence) {
  return {
    progress: progress / 1_000,
    ink: (["seven", "minus", "three", "x", "equals"] as const).map((id) => ({
      id,
      ...evidence[id]
    }))
  };
}

async function evidenceAt(page: Page, progress: number): Promise<SuccessorEvidence> {
  await page.goto(route(progress));
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    String(progress)
  );
  return successorEvidence(page);
}

async function successorEvidence(page: Page): Promise<SuccessorEvidence> {
  return page.locator("[data-kp-reader-equation-stage]").evaluate((stage) => {
    const stageBounds = stage.getBoundingClientRect();
    const find = (selector: string): HTMLElement => {
      const element = stage.querySelector<HTMLElement>(selector);
      if (element === null) throw new Error(`Missing successor gate element ${selector}.`);
      return element;
    };
    const evidence = (element: HTMLElement): RectEvidence => {
      const bounds = element.getBoundingClientRect();
      let opacity = 1;
      let current: HTMLElement | null = element;
      while (current !== null) {
        opacity *= Number.parseFloat(getComputedStyle(current).opacity);
        if (current === stage) break;
        current = current.parentElement;
      }
      return {
        left: bounds.left - stageBounds.left,
        top: bounds.top - stageBounds.top,
        width: bounds.width,
        height: bounds.height,
        opacity,
        fontFamily: getComputedStyle(
          element.querySelector<HTMLElement>(".mord") ?? element
        ).fontFamily
      };
    };
    const fragment = (suffix: string) => find(
      `[data-kp-reader-equation-material-fragment-id*="${suffix}"]`
    );
    return {
      stageWidth: stageBounds.width,
      seven: evidence(fragment("left-simplified.rhs.7")),
      minus: evidence(fragment("left-simplified.rhs.minus")),
      three: evidence(fragment("left-simplified.rhs.3")),
      four: evidence(fragment("solved.rhs.4")),
      x: evidence(fragment("left-simplified.lhs.x")),
      equals: evidence(fragment("left-simplified.equals"))
    };
  });
}

async function seekByScroll(page: Page, progressPermille: number): Promise<void> {
  await page.evaluate((target) => {
    const beats = [...document.querySelectorAll<HTMLElement>("[data-kp-beat]")];
    const first = beats[0];
    const last = beats.at(-1);
    if (first === undefined || last === undefined) throw new Error("Reader beats unavailable.");
    const firstRect = first.getBoundingClientRect();
    const lastRect = last.getBoundingClientRect();
    const start = window.scrollY + firstRect.top + firstRect.height * 0.36;
    const end = window.scrollY + lastRect.top + lastRect.height * 0.64;
    const readerPosition = start + (end - start) * target / 1_000;
    window.scrollTo(0, readerPosition - window.innerHeight * 0.48);
  }, progressPermille);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    String(progressPermille)
  );
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

function assertProtectedClearance(evidence: SuccessorEvidence): void {
  for (const source of [evidence.seven, evidence.minus, evidence.three]) {
    expect(intersects(source, evidence.x)).toBe(false);
    expect(intersects(source, evidence.equals)).toBe(false);
  }
}

function assertWithinStage(evidence: SuccessorEvidence): void {
  for (const source of [evidence.seven, evidence.minus, evidence.three]) {
    expect(source.left).toBeGreaterThanOrEqual(0);
    expect(source.left + source.width).toBeLessThanOrEqual(evidence.stageWidth);
  }
}

function centerX(rect: RectEvidence): number {
  return rect.left + rect.width / 2;
}

function centerY(rect: RectEvidence): number {
  return rect.top + rect.height / 2;
}

function distance(left: RectEvidence, right: RectEvidence): number {
  return Math.hypot(centerX(left) - centerX(right), centerY(left) - centerY(right));
}

function intersects(left: RectEvidence, right: RectEvidence): boolean {
  return left.left < right.left + right.width &&
    left.left + left.width > right.left &&
    left.top < right.top + right.height &&
    left.top + left.height > right.top;
}
