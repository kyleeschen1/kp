import { expect, test, type Locator, type Page } from "@playwright/test";

import { kpTwoTimesOneCarrierAnimationId } from
  "../src/animation/operation-evaluation-adapter.ts";
import {
  kpTwoTimesOneCarrierSelectorIds
} from "../src/semantic/carrier-preserving-simplification-exemplar.ts";
import {
  kpGeneratedAddZeroAnimationId,
  kpGeneratedAddZeroCarrierSelectorIds
} from "../src/semantic/generated-add-zero-carrier-preserving-simplification.ts";
import { assessKpNativeKatexCompositorContinuity } from
  "./support/native-katex-compositor-continuity-laws.ts";
import { createKpNativeKatexCompositorDiagnosticReport } from
  "./support/native-katex-compositor-diagnostic-report.ts";
import {
  createKpNativeKatexConformanceSeamTrace,
  expectedKpNativeKatexOwnerForSampleSlot,
  type KpNativeKatexConformanceSampleSlot,
  type KpNativeKatexConformanceSeamSample
} from "./support/native-katex-compositor-seam-trace.ts";

const checkpoints = Object.freeze([
  { slot: "source-native", progress: 0 },
  { slot: "source-material-seam", progress: 0.001 },
  { slot: "material-midpoint", progress: 0.5 },
  { slot: "material-target-seam", progress: 0.999 },
  { slot: "target-native", progress: 1 }
] as const satisfies readonly {
  readonly slot: KpNativeKatexConformanceSampleSlot;
  readonly progress: number;
}[]);

const scenarios = Object.freeze([
  {
    animationId: kpTwoTimesOneCarrierAnimationId,
    transitionId: "transition.conformance.two-times-one",
    semanticEntityId: "carrier.two",
    shapeId: "shape.digit-two" as const,
    sourceSelectorId: kpTwoTimesOneCarrierSelectorIds.sourceCarrier,
    targetSelectorId: kpTwoTimesOneCarrierSelectorIds.targetCarrier
  },
  {
    animationId: kpGeneratedAddZeroAnimationId,
    transitionId: "transition.conformance.add-zero",
    semanticEntityId: "carrier.x",
    shapeId: "shape.italic-x" as const,
    sourceSelectorId: kpGeneratedAddZeroCarrierSelectorIds.sourceCarrier,
    targetSelectorId: kpGeneratedAddZeroCarrierSelectorIds.targetCarrier
  }
]);

test("captures two deterministic actual-paint seam traces on one reusable page", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const reports = [];

  for (const scenario of scenarios) {
    await page.goto(
      `/?artifact=${scenario.animationId}&playhead=0&theme=dark`
    );
    const { stage, seek } = await readySurface(page, scenario.animationId);
    const samples: KpNativeKatexConformanceSeamSample[] = [];
    for (const checkpoint of checkpoints) {
      await seek.fill(String(checkpoint.progress));
      await expect(stage).toHaveAttribute(
        "data-kp-carrier-preserving-simplification-progress",
        String(checkpoint.progress)
      );
      samples.push(await observeCheckpoint({
        stage,
        checkpoint,
        scenario
      }));
    }
    const trace = createKpNativeKatexConformanceSeamTrace({
      transitionId: scenario.transitionId,
      lifecycleRevision: Number(await stage.getAttribute(
        "data-kp-carrier-preserving-simplification-measurement-revision"
      )),
      fontRevision: Number(await stage.getAttribute(
        "data-kp-carrier-preserving-simplification-font-revision"
      )),
      viewportKey: await stage.getAttribute(
        "data-kp-carrier-preserving-simplification-viewport-key"
      ) ?? "",
      samples
    });
    reports.push(createKpNativeKatexCompositorDiagnosticReport({
      trace,
      assessment: assessKpNativeKatexCompositorContinuity({ trace })
    }));
  }

  expect(reports).toHaveLength(scenarios.length);
  expect(reports.every(({ samples }) =>
    samples.length === checkpoints.length
  )).toBe(true);
  const twoReport = reports.find(({ shapeId }) =>
    shapeId === "shape.digit-two"
  );
  expect(twoReport).toBeDefined();
  expect(twoReport?.status).toBe("passed");
  expect(twoReport?.failures).toEqual([]);
  const xReport = reports.find(({ shapeId }) => shapeId === "shape.italic-x");
  expect(xReport).toBeDefined();
  expect(xReport?.status).toBe("failed");
  expect(xReport?.failures.map(({ seam, reasons }) => ({ seam, reasons })))
    .toEqual([
      {
        seam: "source-to-material",
        reasons: ["vertical-translation"]
      },
      {
        seam: "material-to-target",
        reasons: ["vertical-translation"]
      }
    ]);
  expect(xReport?.failures[0]?.metrics.verticalTranslationPx)
    .toBeGreaterThan(10);
  expect(xReport?.failures[1]?.metrics.verticalTranslationPx)
    .toBeLessThan(-10);
  expect(JSON.parse(JSON.stringify(reports))).toEqual(reports);
  expect(pageErrors).toEqual([]);
});

async function readySurface(page: Page, animationId: string) {
  const player = page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator(
    "[data-kp-carrier-preserving-simplification-stage]"
  );
  const seek = player.locator('[data-action="seek-editor-animation"]');
  await expect(stage).toHaveAttribute(
    "data-kp-carrier-preserving-simplification-stage",
    "ready",
    { timeout: 15_000 }
  );
  return { stage, seek };
}

async function observeCheckpoint(input: {
  readonly stage: Locator;
  readonly checkpoint: typeof checkpoints[number];
  readonly scenario: typeof scenarios[number];
}): Promise<KpNativeKatexConformanceSeamSample> {
  const measured = await input.stage.evaluate(async (stage, argument) => {
    const geometryModulePath =
      "/src/rendering/native-katex-paint-geometry.ts";
    const geometry = await import(/* @vite-ignore */ geometryModulePath);
    const source = stage.querySelector<HTMLElement>(
      `[data-kp-semantic-entity-id="${CSS.escape(argument.sourceSelectorId)}"]`
    );
    const target = stage.querySelector<HTMLElement>(
      `[data-kp-semantic-entity-id="${CSS.escape(argument.targetSelectorId)}"]`
    );
    const materialOwner = stage.querySelector<HTMLElement>(
      `[data-kp-equation-material-semantic-entity-id="${
        CSS.escape(argument.sourceSelectorId)
      }"]`
    );
    const material = materialOwner?.firstElementChild;
    if (
      source === null ||
      target === null ||
      materialOwner === null ||
      !(material instanceof HTMLElement)
    ) {
      throw new Error("Conformance fixture lacks one correlated paint owner.");
    }
    const owner = argument.owner;
    const active = owner === "native-source"
      ? source
      : owner === "material" ? material : target;
    const effectiveOpacity = (element: HTMLElement): number => {
      let opacity = 1;
      let current: HTMLElement | null = element;
      while (current !== null) {
        opacity *= Number(getComputedStyle(current).opacity);
        if (current === stage) return opacity;
        current = current.parentElement;
      }
      throw new Error("Conformance paint is outside its stage.");
    };
    return {
      rect: geometry.measureKpNativeKatexTextInkRect(stage, active),
      baselineY: geometry.measureKpNativeKatexBaselineY(stage, active),
      effectiveOpacity: effectiveOpacity(active),
      paintOpacityByOwner: {
        "native-source": effectiveOpacity(source),
        material: effectiveOpacity(material),
        "native-target": effectiveOpacity(target)
      }
    };
  }, {
    sourceSelectorId: input.scenario.sourceSelectorId,
    targetSelectorId: input.scenario.targetSelectorId,
    owner: expectedKpNativeKatexOwnerForSampleSlot(input.checkpoint.slot)
  });
  const owner = expectedKpNativeKatexOwnerForSampleSlot(input.checkpoint.slot);
  return {
    slot: input.checkpoint.slot,
    progress: input.checkpoint.progress,
    owner,
    paintOpacityByOwner: measured.paintOpacityByOwner,
    observation: {
      kind: "native-katex-conformance-visible-ink",
      measurementAuthority: "realized-paint",
      coordinateSpace: "stage-layout-px",
      shapeId: input.scenario.shapeId,
      semanticEntityId: input.scenario.semanticEntityId,
      rect: measured.rect,
      baselineY: measured.baselineY,
      effectiveOpacity: measured.effectiveOpacity
    }
  };
}
