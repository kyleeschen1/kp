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
import {
  kpNativeKatexConformanceReleaseProfile,
  type KpNativeKatexConformanceLifecycleAction
} from "./fixtures/native-katex-compositor-conformance-release.ts";

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
      `/?artifact=${scenario.animationId}&playhead=0&theme=dark`,
      { waitUntil: "networkidle" }
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
  expect(xReport?.failures).toEqual([]);
  expect(xReport?.status).toBe("passed");
  expect(JSON.parse(JSON.stringify(reports))).toEqual(reports);
  expect(pageErrors).toEqual([]);
});

test("pressures the bounded lifecycle cohort on one reusable page", async ({
  browserName,
  page
}) => {
  test.slow();
  expect(kpNativeKatexConformanceReleaseProfile.engines).toContain(browserName);
  expect(kpNativeKatexConformanceReleaseProfile.scenariosPerEngine)
    .toBeLessThanOrEqual(12);
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  for (const scenario of
    kpNativeKatexConformanceReleaseProfile.lifecycleScenarios) {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1_280, height: 720 });
    await page.goto(
      `/?artifact=${scenario.animationId}` +
      `&playhead=${scenario.initialPlayhead}&theme=${scenario.theme}`,
      { waitUntil: "networkidle" }
    );
    const surface = await readySurface(page, scenario.animationId);
    await lifecyclePressureHandlers[scenario.action]({ page, ...surface });
    await expectOneConformancePaintOwner(surface.stage);
  }

  expect(pageErrors).toEqual([]);
});

interface LifecyclePressureContext {
  readonly page: Page;
  readonly player: Locator;
  readonly stage: Locator;
  readonly seek: Locator;
}

type LifecyclePressureHandler = (
  context: LifecyclePressureContext
) => Promise<void>;

const lifecyclePressureHandlers: Record<
  KpNativeKatexConformanceLifecycleAction,
  LifecyclePressureHandler
> = {
  "direct-seek": async ({ stage, seek }) => {
    await seek.fill("0.61");
    await expect(stage).toHaveAttribute(
      "data-kp-carrier-preserving-simplification-progress",
      "0.61"
    );
  },
  reverse: async ({ page, player, stage, seek }) => {
    await player.focus();
    await page.keyboard.press("r");
    await expect(player).toHaveAttribute(
      "data-kp-editor-animation-direction",
      "rewind"
    );
    await seek.fill("0.25");
    await expect(stage).toHaveAttribute(
      "data-kp-carrier-preserving-simplification-progress",
      "0.75"
    );
  },
  interruption: async ({ player, stage, seek }) => {
    await seek.fill("0.05");
    await player.locator('[data-action="toggle-editor-animation"]').click();
    await expect.poll(async () => Number(
      await player.getAttribute("data-kp-editor-animation-progress")
    )).toBeGreaterThan(0.05);
    await seek.fill("0.36");
    await expect(player).not.toHaveAttribute(
      "data-kp-editor-animation-status",
      "playing"
    );
    await expect(stage).toHaveAttribute(
      "data-kp-carrier-preserving-simplification-progress",
      "0.36"
    );
  },
  "font-invalidation": async ({ page, stage }) => {
    const revision = await measurementRevision(stage);
    await page.evaluate(() => {
      document.fonts.dispatchEvent(new Event("loadingdone"));
    });
    await expect.poll(() => measurementRevision(stage))
      .toBeGreaterThan(revision);
    await expect(stage).toHaveAttribute(
      "data-kp-carrier-preserving-simplification-progress",
      "0.41"
    );
  },
  "viewport-resize": async ({ page, stage }) => {
    const revision = await measurementRevision(stage);
    await page.setViewportSize({ width: 1_100, height: 800 });
    await expect.poll(() => measurementRevision(stage))
      .toBeGreaterThan(revision);
    await expect(stage).toHaveAttribute(
      "data-kp-carrier-preserving-simplification-progress",
      "0.36"
    );
  },
  "dpr-change": async ({ page, stage }) => {
    const revision = await measurementRevision(stage);
    await page.evaluate(() => {
      Object.defineProperty(window, "devicePixelRatio", {
        configurable: true,
        value: window.devicePixelRatio === 1 ? 2 : 1
      });
      window.dispatchEvent(new Event("resize"));
    });
    await expect.poll(() => measurementRevision(stage))
      .toBeGreaterThan(revision);
    await expect(stage).toHaveAttribute(
      "data-kp-carrier-preserving-simplification-progress",
      "0.59"
    );
  },
  "theme-change": async ({ page, stage }) => {
    const toolbar = page.getByRole("complementary", {
      name: "Development tools"
    });
    const toggle = toolbar.getByRole("button", { name: "Dark mode" });
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await toggle.click();
    await expect(page.locator("[data-kp-svelte-catalogue-shell]"))
      .toHaveAttribute("data-kp-animation-catalogue-theme", "light");
    await expect(stage).toHaveAttribute(
      "data-kp-carrier-preserving-simplification-progress",
      "0.57"
    );
  },
  "reduced-motion": async ({ page, player, stage, seek }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await player.evaluate((element) => {
      element.dataset["kpEditorAnimationAccessibilityMode"] =
        "reduced-motion";
    });
    await seek.fill("0.8");
    await expect(stage).toHaveAttribute(
      "data-kp-carrier-preserving-simplification-progress",
      "1"
    );
    await expect(stage).toHaveAttribute(
      "data-kp-carrier-preserving-simplification-visual-owner",
      "target-native"
    );
  }
};

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
  return { player, stage, seek };
}

async function measurementRevision(stage: Locator): Promise<number> {
  return Number(await stage.getAttribute(
    "data-kp-carrier-preserving-simplification-measurement-revision"
  ));
}

async function expectOneConformancePaintOwner(stage: Locator): Promise<void> {
  await expect.poll(() => stage.evaluate((root) => {
    const endpoints = [...root.querySelectorAll<HTMLElement>(
      ".kp-carrier-preserving-simplification-stage__endpoint"
    )].filter((element) => Number(getComputedStyle(element).opacity) > 0);
    const materialOwners = [...root.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )].filter((element) => Number(getComputedStyle(element).opacity) > 0);
    return endpoints.length + Number(materialOwners.length > 0);
  })).toBe(1);
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
