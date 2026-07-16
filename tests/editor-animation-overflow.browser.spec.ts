import { expect, test } from "@playwright/test";

import type {
  KpAnimationViewportOverflowReport
} from "../src/editor/animation-viewport-overflow.ts";

interface OverflowAuditSample {
  readonly descriptorId: string;
  readonly viewportWidth: number;
  readonly progress: number;
  readonly report: KpAnimationViewportOverflowReport;
}

const viewportWidths = [360, 768, 1280] as const;
const checkpoints = [0, 0.5, 0.92, 1] as const;

test("native equation fitting contains long formulas without transform scaling", async ({
  page
}) => {
  for (const viewportWidth of [360, 768]) {
    await page.setViewportSize({ width: viewportWidth, height: 1000 });
    await page.goto("/");
    await page.locator('[data-action="set-editor-animation"]').selectOption(
      "editor-animation.animation.sample.fourier-transform-pair"
    );
    const player = page.locator("[data-kp-editor-animation-player]");
    await player.locator('[data-action="seek-editor-animation"]').fill("0");
    const fitted = await player.locator(
      "[data-kp-editor-equation-stage] .editor-equation-stage__transition"
    ).first().evaluate((transition) => ({
      scale: Number(
        (transition as HTMLElement).dataset["kpEditorEquationNativeFitScale"]
      ),
      mode:
        (transition as HTMLElement)
          .dataset["kpEditorEquationNativeFitMode"],
      objects: Array.from(transition.querySelectorAll<HTMLElement>(
        ".editor-equation-stage__object"
      )).map((object) => ({
        clientWidth: object.clientWidth,
        scrollWidth: object.scrollWidth,
        fontSize: getComputedStyle(object).fontSize,
        transform: getComputedStyle(object).transform
      }))
    }));

    expect(fitted.scale).toBeLessThanOrEqual(1);
    expect(["native", "fitted", "minimum-constrained"])
      .toContain(fitted.mode);
    expect(fitted.objects.every(
      (object) => object.scrollWidth <= object.clientWidth + 1
    )).toBe(true);
    expect(fitted.objects.every(
      (object) => object.transform === "none"
    )).toBe(true);
    expect(new Set(fitted.objects.map((object) => object.fontSize)).size)
      .toBe(1);
  }
});

test("animation catalog overflow audit covers every descriptor and viewport", async ({
  page
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: viewportWidths[0], height: 1000 });
  await page.goto("/");
  const selector = page.locator('[data-action="set-editor-animation"]');
  const player = page.locator("[data-kp-editor-animation-player]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  const descriptorIds = await selector.locator("option").evaluateAll(
    (options) => options.map((option) => (option as HTMLOptionElement).value)
  );
  const samples: OverflowAuditSample[] = [];

  for (const viewportWidth of viewportWidths) {
    await page.setViewportSize({ width: viewportWidth, height: 1000 });
    for (const descriptorId of descriptorIds) {
      await selector.selectOption(descriptorId);
      for (const progress of checkpoints) {
        await scrubber.fill(String(progress));
        const report = await player.locator(
          "[data-kp-editor-animation-stage]"
        ).evaluate(async (stage) => {
          const modulePath = "/src/editor/animation-viewport-overflow.ts";
          const { measureKpAnimationViewportOverflow } = await import(
            modulePath
          ) as typeof import(
            "../src/editor/animation-viewport-overflow.ts"
          );
          return measureKpAnimationViewportOverflow(stage as HTMLElement);
        });
        samples.push({ descriptorId, viewportWidth, progress, report });
      }
    }
  }

  expect(new Set(samples.map((sample) => sample.descriptorId)).size)
    .toBe(descriptorIds.length);
  expect(new Set(samples.map((sample) => sample.viewportWidth)))
    .toEqual(new Set(viewportWidths));
  expect(samples).toHaveLength(
    descriptorIds.length * viewportWidths.length * checkpoints.length
  );
  expect(samples.every((sample) => sample.report.samples.length > 0))
    .toBe(true);

  const scrollbarFindings = samples.flatMap((sample) =>
    sample.report.issues
      .filter((issue) => issue.kind === "nested-scrollbar")
      .map((issue) => ({
        descriptorId: sample.descriptorId,
        viewportWidth: sample.viewportWidth,
        progress: sample.progress,
        elementRef: issue.elementRef,
        axis: issue.axis,
        overflowExtent: issue.overflowExtent
      }))
  );
  const contentOverflowFindings = samples.flatMap((sample) =>
    sample.report.issues
      .filter((issue) => issue.kind === "content-overflow")
      .map((issue) => ({
        descriptorId: sample.descriptorId,
        viewportWidth: sample.viewportWidth,
        progress: sample.progress,
        elementRef: issue.elementRef,
        axis: issue.axis,
        overflowExtent: issue.overflowExtent
      }))
  );
  const findingsByViewport = Object.fromEntries(viewportWidths.map(
    (viewportWidth) => [
      viewportWidth,
      scrollbarFindings.filter(
        (finding) => finding.viewportWidth === viewportWidth
      ).length
    ]
  ));
  const findingsByAxis = Object.fromEntries(["x", "y"].map((axis) => [
    axis,
    scrollbarFindings.filter((finding) => finding.axis === axis).length
  ]));
  const maximumOverflow = scrollbarFindings.reduce(
    (maximum, finding) =>
      finding.overflowExtent > maximum.overflowExtent ? finding : maximum,
    {
      descriptorId: "none",
      viewportWidth: 0,
      progress: 0,
      elementRef: "none",
      axis: "x" as const,
      overflowExtent: 0
    }
  );

  console.log(JSON.stringify({
    descriptorCount: descriptorIds.length,
    sampleCount: samples.length,
    nestedScrollbarCount: scrollbarFindings.length,
    contentOverflowCount: contentOverflowFindings.length,
    contentOverflowByElement: Object.fromEntries(
      [...new Set(contentOverflowFindings.map(
        (finding) => finding.elementRef
      ))].map((elementRef) => [
        elementRef,
        contentOverflowFindings.filter(
          (finding) => finding.elementRef === elementRef
        ).length
      ])
    ),
    findingsByViewport,
    findingsByAxis,
    maximumOverflow
  }));

  expect(scrollbarFindings).toEqual([]);
  expect(contentOverflowFindings.filter(
    (finding) =>
      finding.elementRef !== "div.editor-equation-stage__object"
  )).toEqual([]);
});
