import { expect, test, type Page } from "@playwright/test";

const route = (progress: number) =>
  "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1" +
  `&kpProgress=${progress}`;

interface RectEvidence {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly opacity: number;
}

interface CancellationEvidence {
  readonly plus: RectEvidence;
  readonly minus: RectEvidence;
  readonly zero: RectEvidence;
  readonly x: RectEvidence;
  readonly equals: RectEvidence;
}

test("cancellation phases keep protected symbols clear at wide and narrow widths", async ({ page }) => {
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(viewport);
    const orbit = await evidenceAt(page, 517);
    expect(orbit.plus.opacity).toBeGreaterThan(0.99);
    expect(orbit.minus.opacity).toBeGreaterThan(0.99);
    expect(orbit.zero.opacity).toBe(0);
    expect(centerY(orbit.plus)).toBeLessThan(centerY(orbit.minus));
    expect(centerY(orbit.minus) - centerY(orbit.plus)).toBeGreaterThan(12);
    expect(intersects(orbit.plus, orbit.x)).toBe(false);
    expect(intersects(orbit.minus, orbit.x)).toBe(false);
    expect(intersects(orbit.plus, orbit.equals)).toBe(false);
    expect(intersects(orbit.minus, orbit.equals)).toBe(false);

    const termsCleared = await evidenceAt(page, 600);
    expect(termsCleared.plus.opacity).toBe(0);
    expect(termsCleared.minus.opacity).toBe(0);
    expect(termsCleared.zero.opacity).toBeLessThan(0.001);

    const witness = await evidenceAt(page, 620);
    expect(witness.plus.opacity).toBe(0);
    expect(witness.minus.opacity).toBe(0);
    expect(witness.zero.opacity).toBeGreaterThan(0.99);
    expect(intersects(witness.zero, witness.x)).toBe(false);
    expect(intersects(witness.zero, witness.equals)).toBe(false);

    const witnessCleared = await evidenceAt(page, 647);
    expect(witnessCleared.plus.opacity).toBe(0);
    expect(witnessCleared.minus.opacity).toBe(0);
    expect(witnessCleared.zero.opacity).toBe(0);

    const compacting = await evidenceAt(page, 655);
    expect(compacting.plus.opacity).toBe(0);
    expect(compacting.minus.opacity).toBe(0);
    expect(compacting.zero.opacity).toBe(0);
  }
});

test("dense cancellation sampling stays continuous and retraces on rewind", async ({ page }) => {
  await page.goto(route(480));
  const forward = new Map<number, CancellationEvidence>();
  const samples: CancellationEvidence[] = [];
  for (let progress = 480; progress <= 600; progress += 4) {
    await seekByScroll(page, progress);
    const evidence = await cancellationEvidence(page);
    forward.set(progress, evidence);
    samples.push(evidence);
  }
  const travel = samples.slice(1).flatMap((sample, index) => [
    {
      symbol: "plus",
      from: 480 + index * 4,
      to: 484 + index * 4,
      distance: distance(sample.plus, samples[index]!.plus),
      fromRect: samples[index]!.plus,
      toRect: sample.plus
    },
    {
      symbol: "minus",
      from: 480 + index * 4,
      to: 484 + index * 4,
      distance: distance(sample.minus, samples[index]!.minus),
      fromRect: samples[index]!.minus,
      toRect: sample.minus
    }
  ]);
  const opacityDelta = samples.slice(1).flatMap((sample, index) => [
    Math.abs(sample.plus.opacity - samples[index]!.plus.opacity),
    Math.abs(sample.minus.opacity - samples[index]!.minus.opacity)
  ]);
  const maximumTravel = [...travel].sort(
    (left, right) => right.distance - left.distance
  )[0]!;
  expect(maximumTravel.distance, JSON.stringify(maximumTravel)).toBeLessThan(6);
  expect(Math.max(...opacityDelta)).toBeLessThan(0.18);

  for (const progress of [600, 560, 520, 480]) {
    await seekByScroll(page, progress);
    const rewound = await cancellationEvidence(page);
    const original = forward.get(progress)!;
    expect(distance(rewound.plus, original.plus)).toBeLessThan(0.1);
    expect(distance(rewound.minus, original.minus)).toBeLessThan(0.1);
    expect(rewound.plus.opacity).toBeCloseTo(original.plus.opacity, 4);
    expect(rewound.minus.opacity).toBeCloseTo(original.minus.opacity, 4);
  }
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-playback-direction",
    "rewind"
  );
});

test("editor and reader render the same independent KaTeX +0 witness", async ({ page }) => {
  await page.goto("/?animation=editor-animation.animation.linear-solve.solve-x");
  const player = page.locator("[data-kp-editor-animation-player]");
  await player.locator('[data-action="seek-editor-animation"]').fill("0.62");
  const editorZero = player.locator("[data-kp-editor-independent-zero-witness]");
  await expect(editorZero).toBeVisible();
  await expect(editorZero).toContainText("+0");
  const editor = await normalizedWitness(
    editorZero,
    player.locator(
      '[data-kp-equation-material-source-motion-id*="after-subtract.lhs.x"]'
    ),
    player.locator(
      '[data-kp-equation-material-source-motion-id$="after-subtract.equals"]'
    )
  );

  await page.goto(route(620));
  const readerZero = page.locator("[data-kp-reader-independent-zero-witness]");
  await expect(readerZero).toBeVisible();
  await expect(readerZero).toContainText("+0");
  const reader = await normalizedWitness(
    readerZero,
    page.locator(
      '[data-kp-reader-equation-material-fragment-id*="after-subtract.lhs.x"]'
    ),
    page.locator(
      '[data-kp-reader-equation-material-fragment-id$="after-subtract.equals"]'
    )
  );

  expect(editor.fontFamily).toContain("KaTeX");
  expect(reader.fontFamily).toContain("KaTeX");
  expect(reader.fontSizePx / editor.fontSizePx).toBeGreaterThan(0.99);
  expect(reader.fontSizePx / editor.fontSizePx).toBeLessThan(1.01);
  expect(Math.abs(reader.relativeX - editor.relativeX)).toBeLessThan(0.05);
  expect(Math.abs(reader.baselineOffset - editor.baselineOffset)).toBeLessThan(0.08);
});

async function evidenceAt(page: Page, progress: number): Promise<CancellationEvidence> {
  await page.goto(route(progress));
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    String(progress)
  );
  return cancellationEvidence(page);
}

async function cancellationEvidence(page: Page): Promise<CancellationEvidence> {
  return page.locator("[data-kp-reader-equation-stage]").evaluate((stage) => {
    const stageBounds = stage.getBoundingClientRect();
    const find = (selector: string): HTMLElement => {
      const element = stage.querySelector<HTMLElement>(selector);
      if (element === null) throw new Error(`Missing cancellation gate element ${selector}.`);
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
        opacity
      };
    };
    return {
      plus: evidence(find(
        '[data-kp-reader-equation-material-fragment-id*="after-subtract.lhs.plus3"]'
      )),
      minus: evidence(find(
        '[data-kp-reader-equation-material-fragment-id*="after-subtract.lhs.minus3"]'
      )),
      zero: evidence(find("[data-kp-reader-independent-zero-witness]")),
      x: evidence(find(
        '[data-kp-reader-equation-material-fragment-id*="after-subtract.lhs.x"]'
      )),
      equals: evidence(find(
        '[data-kp-reader-equation-material-fragment-id$="after-subtract.equals"]'
      ))
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

async function normalizedWitness(
  witness: ReturnType<Page["locator"]>,
  x: ReturnType<Page["locator"]>,
  equals: ReturnType<Page["locator"]>
): Promise<{
  relativeX: number;
  baselineOffset: number;
  fontFamily: string;
  fontSizePx: number;
}> {
  const witnessBounds = await witness.boundingBox();
  const xBounds = await x.boundingBox();
  const equalsBounds = await equals.boundingBox();
  if (witnessBounds === null || xBounds === null || equalsBounds === null) {
    throw new Error("Witness reference geometry is not measurable.");
  }
  const typography = await witness.locator(".mord").first().evaluate((element) => {
    const style = getComputedStyle(element);
    return { fontFamily: style.fontFamily, fontSizePx: Number.parseFloat(style.fontSize) };
  });
  const witnessCenterX = witnessBounds.x + witnessBounds.width / 2;
  const witnessCenterY = witnessBounds.y + witnessBounds.height / 2;
  const xCenterX = xBounds.x + xBounds.width / 2;
  const xCenterY = xBounds.y + xBounds.height / 2;
  const equalsCenterX = equalsBounds.x + equalsBounds.width / 2;
  const equalsCenterY = equalsBounds.y + equalsBounds.height / 2;
  return {
    relativeX: (witnessCenterX - xCenterX) / (equalsCenterX - xCenterX),
    baselineOffset:
      (witnessCenterY - (xCenterY + equalsCenterY) / 2) / typography.fontSizePx,
    ...typography
  };
}

function centerY(rect: RectEvidence): number {
  return rect.top + rect.height / 2;
}

function distance(left: RectEvidence, right: RectEvidence): number {
  return Math.hypot(
    left.left + left.width / 2 - (right.left + right.width / 2),
    centerY(left) - centerY(right)
  );
}

function intersects(left: RectEvidence, right: RectEvidence): boolean {
  return left.left < right.left + right.width &&
    left.left + left.width > right.left &&
    left.top < right.top + right.height &&
    left.top + left.height > right.top;
}
