import { expect, test, type Locator } from "@playwright/test";

import {
  kpOperationEvaluationExecutableProgramCompiler
} from "../src/animation/operation-evaluation-presentation-registry.ts";
import {
  compareKpOperationEvaluationContinuityTopologies,
  createKpOperationEvaluationContinuityContractDraft,
  type KpOperationEvaluationReferencePaintProfile
} from "../src/animation/operation-evaluation-continuity-topology.ts";
import {
  validateAndMintKpPerceptualContinuityContract
} from "../src/animation/perceptual-continuity-contract.ts";
import {
  kpOpaqueGatherAndRecognizeRecognitionProgress
} from "../src/animation/successor-synthesis.ts";
import {
  evaluateKpNativeKatexSuccessorEndpoint,
  type KpNativeKatexSuccessorEndpointCheckpoint,
  type KpNativeKatexSuccessorEndpointSnapshot
} from "../src/rendering/native-katex-successor-endpoint-microscope.ts";
import {
  decodePngRgba,
  normalizedPngRasterDelta
} from "./helpers/png-raster-diff.ts";

const descriptorId =
  "editor-animation.animation.operation-evaluation.one-plus-two";
const animationId =
  "animation.operation-evaluation.one-plus-two";
const executableProgram =
  kpOperationEvaluationExecutableProgramCompiler.program;
const continuityContractResult =
  validateAndMintKpPerceptualContinuityContract({
    draft: createKpOperationEvaluationContinuityContractDraft(
      executableProgram
    ),
    program: executableProgram
  });
if (continuityContractResult.status !== "verified") {
  throw new Error("Browser continuity contract did not mint.");
}
const continuityContract = continuityContractResult.contract;

interface NaturalPlaybackFrame {
  readonly progress: number;
  readonly mappedProgress: number;
  readonly status: string;
  readonly direction: string;
  readonly boundarySide: string;
  readonly visibleOwnerCount: number;
  readonly nonBinaryOpacityCount: number;
  readonly visiblePaintRect?: {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
  } | undefined;
}

test("one plus two mounts through the lazy verified compositor adapter", async ({
  page
}) => {
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const slot = player.locator(
    "[data-kp-editor-animation-surface-slot=\"equation\"]"
  );
  const stage = slot.locator("[data-kp-operation-evaluation-stage]");

  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-pack-id",
    "operation-evaluation"
  );
  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.operation-evaluation.canonical-native-katex"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-status",
    "ready",
    { timeout: 15_000 }
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-presentation-mode",
    "verified-motion"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-transfer-topology",
    "bounded-semantic-contact-co-presence"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-executed-motif-continuity-topology",
    "bounded-semantic-contact-co-presence"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-native-katex-successor-synthesis-count",
    "1"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-canonical-native-katex-session-factory",
    "shared-v1"
  );
  const comparison = player.locator(
    "[data-kp-operation-evaluation-reference-comparison]"
  );
  await expect(comparison).toBeVisible();
  await expect(comparison).toHaveAttribute(
    "data-kp-operation-evaluation-primary-authority",
    "executable-runtime"
  );
  await expect(comparison.locator(
    "[data-kp-operation-evaluation-primary-panel] " +
    "[data-kp-operation-evaluation-stage]"
  )).toBeVisible();
  await expect(comparison.locator(
    "[data-kp-operation-evaluation-reference-stage]"
  )).toHaveCount(1);
  await expect(comparison.locator(
    "[data-kp-operation-evaluation-diagnostic]"
  )).toHaveAttribute("aria-hidden", "true");
});

test("reference candidate and current runtime share the player clock", async ({
  page
}) => {
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const scrubber = player.locator(
    "[data-action=\"seek-editor-animation\"]"
  );
  const comparison = player.locator(
    "[data-kp-operation-evaluation-reference-comparison]"
  );
  await expect(comparison).toBeVisible();

  await scrubber.fill("0.58");
  await expect(player).toHaveAttribute(
    "data-kp-operation-evaluation-mapped-progress",
    "0.58"
  );
  await expect(comparison).toHaveAttribute(
    "data-kp-operation-evaluation-reference-phase",
    "retire"
  );
  await expect(comparison.locator(
    "[data-kp-operation-evaluation-reference-telemetry] " +
    "[data-kp-comparison-owner]"
  )).not.toHaveText("empty");
  await expect(comparison.locator(
    "[data-kp-operation-evaluation-current-telemetry] " +
    "[data-kp-comparison-phase]"
  )).toHaveText("gather contributors");

  await scrubber.fill("1");
  await expect(comparison.locator(
    "[data-kp-operation-evaluation-reference-telemetry] " +
    "[data-kp-comparison-endpoint]"
  )).toHaveText("native target pose");
  await expect(comparison.locator(
    "[data-kp-operation-evaluation-current-telemetry] " +
    "[data-kp-comparison-endpoint]"
  )).toHaveText("native target");
});

test("primary gather-and-recognize candidate stays opaque and continuously inked", async ({
  page
}) => {
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const scrubber = player.locator(
    "[data-action=\"seek-editor-animation\"]"
  );
  const comparison = player.locator(
    "[data-kp-operation-evaluation-reference-comparison]"
  );
  const primaryPanel = comparison.locator(
    "[data-kp-operation-evaluation-primary-panel]"
  );
  const stage = primaryPanel.locator(
    "[data-kp-operation-evaluation-stage]"
  );
  await expect(comparison).toHaveAttribute(
    "data-kp-operation-evaluation-primary-candidate",
    "opaque-gather-and-recognize-v1"
  );
  await expect(primaryPanel).toBeVisible();
  await expect(comparison.locator(
    "[data-kp-operation-evaluation-diagnostic]"
  )).toHaveAttribute("aria-hidden", "true");

  for (let index = 0; index <= 100; index += 1) {
    await seekExact(scrubber, index / 100);
    const sample = await stage.evaluate((element) => {
      const root = element as HTMLElement;
      const stageRect = root.getBoundingClientRect();
      const candidates = [
        ...root.querySelectorAll<HTMLElement>(
          "[data-kp-operation-evaluation-source]," +
          "[data-kp-operation-evaluation-target]," +
          "[data-kp-equation-material-owner-id]"
        )
      ];
      const visible = candidates.flatMap((candidate) => {
        const style = getComputedStyle(candidate);
        const rect = candidate.getBoundingClientRect();
        return Number(style.opacity) > 0.01 &&
          rect.width * rect.height > 0.01
          ? [{ rect, opacity: Number(style.opacity) }]
          : [];
      });
      return {
        nonBinaryOpacityCount: candidates.filter((candidate) => {
          const opacity = Number(getComputedStyle(candidate).opacity);
          return Math.abs(opacity) > 1e-6 &&
            Math.abs(opacity - 1) > 1e-6;
        }).length,
        visibleArea: visible.reduce((sum, { rect }) =>
          sum + rect.width * rect.height, 0),
        contained: visible.every(({ rect }) =>
          rect.left >= stageRect.left - 1 &&
          rect.top >= stageRect.top - 1 &&
          rect.right <= stageRect.right + 1 &&
          rect.bottom <= stageRect.bottom + 1
        )
      };
    });
    expect(sample.nonBinaryOpacityCount).toBe(0);
    expect(sample.visibleArea).toBeGreaterThan(4);
    expect(sample.contained).toBe(true);
  }

  await seekExact(scrubber, 0.58);
  const gathered = await stage.locator(
    "[data-kp-equation-material-fragment-role^=" +
    "\"successor-source:\"]"
  ).evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element);
    const matrix = new DOMMatrix(style.transform);
    return {
      role: (element as HTMLElement).dataset[
        "kpEquationMaterialFragmentRole"
      ],
      opacity: Number(style.opacity),
      scale: matrix.a,
      travel: Math.hypot(matrix.e, matrix.f)
    };
  }));
  expect(gathered).toHaveLength(3);
  expect(gathered.every(({ opacity }) => opacity === 1)).toBe(true);
  expect(gathered.every(({ scale }) => scale > 0 && scale < 1)).toBe(true);
  expect(gathered.filter(({ role }) =>
    role === "successor-source:material-input"
  ).every(
    ({ travel }) => travel > 4
  )).toBe(true);
});

test("frozen reference retains exact native source evidence", async ({
  page
}) => {
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const scrubber = player.locator(
    "[data-action=\"seek-editor-animation\"]"
  );
  const referenceSource = player.locator(
    "[data-kp-operation-evaluation-reference-source]"
  );
  const nativeSource = player.locator(
    "[data-kp-operation-evaluation-source]"
  );
  await expect(player.locator(
    "[data-kp-operation-evaluation-reference-stage]"
  )).toHaveAttribute(
    "data-kp-operation-evaluation-status",
    "ready",
    { timeout: 15_000 }
  );

  await scrubber.fill("0");
  const referenceStart = await relativeSelectorPaintGeometry(
    referenceSource
  );
  const nativeStart = await relativeSelectorPaintGeometry(nativeSource);
  expect(referenceStart).toEqual(nativeStart);

  await scrubber.fill("0.58");
  const gathered = await relativeSelectorPaintGeometry(referenceSource);
  const startById = new Map(referenceStart.map((geometry) => [
    geometry.id,
    geometry
  ]));
  const moved = gathered.filter((geometry) => {
    const start = startById.get(geometry.id)!;
    return Math.hypot(
      geometry.centerX - start.centerX,
      geometry.centerY - start.centerY
    ) > 4;
  });
  expect(moved).toHaveLength(referenceStart.length);
});

test("operation evaluation measures and retains paint in its final host", async ({
  page
}) => {
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const scrubber = player.locator(
    "[data-action=\"seek-editor-animation\"]"
  );
  const host = player.locator(
    "[data-kp-operation-evaluation-current-stage-host]"
  );
  const stage = host.locator("[data-kp-operation-evaluation-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-status",
    "ready",
    { timeout: 15_000 }
  );

  const certificate = await stage.evaluate((element) => {
    const currentStage = element as HTMLElement;
    const parent = currentStage.parentElement as HTMLElement | null;
    return {
      hostId:
        currentStage.dataset["kpOperationEvaluationMeasurementHostId"],
      parentHostId:
        parent?.dataset["kpOperationEvaluationMeasurementHostId"],
      width:
        currentStage.dataset["kpOperationEvaluationMeasurementWidth"],
      parentWidth: parent?.clientWidth,
      height:
        currentStage.dataset["kpOperationEvaluationMeasurementHeight"],
      parentHeight: parent?.clientHeight,
      connected: currentStage.isConnected
    };
  });
  expect(certificate).toMatchObject({
    connected: true,
    hostId: certificate.parentHostId,
    width: String(certificate.parentWidth),
    height: String(certificate.parentHeight)
  });

  await scrubber.fill("0");
  const nativeSource = await visibleInkBounds(stage);
  await seekExact(scrubber, 0.000001);
  const transientSource = await visibleInkBounds(stage);
  expectInkRectsEquivalent(transientSource, nativeSource, 1);

  // The primary runtime must remain inside the exact host where its native
  // paint was measured; moving it would invalidate endpoint authority.
  for (const progress of [0, 0.25, 0.58, 0.65, 0.75, 1]) {
    await scrubber.fill(String(progress));
    const [ink, hostBox] = await Promise.all([
      visibleInkBounds(stage),
      host.boundingBox()
    ]);
    expect(ink).toBeDefined();
    expect(hostBox).not.toBeNull();
    expect(ink!.left).toBeGreaterThanOrEqual(hostBox!.x - 1);
    expect(ink!.top).toBeGreaterThanOrEqual(hostBox!.y - 1);
    expect(ink!.right).toBeLessThanOrEqual(
      hostBox!.x + hostBox!.width + 1
    );
    expect(ink!.bottom).toBeLessThanOrEqual(
      hostBox!.y + hostBox!.height + 1
    );
  }

  await seekExact(scrubber, 0.999999);
  const transientTarget = await visibleInkBounds(stage);
  await scrubber.fill("1");
  const nativeTarget = await visibleInkBounds(stage);
  expectInkRectsEquivalent(transientTarget, nativeTarget, 1);
});

test("operation evaluation fails closed after measured-stage reparenting", async ({
  page
}) => {
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-operation-evaluation-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-status",
    "ready",
    { timeout: 15_000 }
  );

  await stage.evaluate((element) => {
    const rogueHost = element.ownerDocument.createElement("div");
    rogueHost.dataset["kpOperationEvaluationRogueHost"] = "";
    element.parentElement!.after(rogueHost);
    rogueHost.append(element);
  });
  await player.locator(
    "[data-action=\"seek-editor-animation\"]"
  ).fill("0.25");

  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-status",
    "measurement-stale"
  );
  await expect(player).toHaveAttribute(
    "data-kp-operation-evaluation-continuity-status",
    "measurement-stale"
  );
  await expect(stage.locator(
    "[data-kp-equation-material-owner-id]"
  )).toHaveCount(0);
  await expect(stage.locator(
    "[data-kp-operation-evaluation-source]"
  )).toHaveCSS("opacity", "1");
});

test("one plus two direct seek and rewind share one exact pose", async ({
  page
}) => {
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-operation-evaluation-stage]");
  const scrubber = player.locator(
    "[data-action=\"seek-editor-animation\"]"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-status",
    "ready"
  );

  await scrubber.fill("0.25");
  await expect(player).toHaveAttribute(
    "data-kp-operation-evaluation-mapped-progress",
    "0.25"
  );
  const forwardOwners = await ownerPoses(stage);

  await player.locator(
    "[data-action=\"rewind-editor-animation\"]"
  ).click();
  await player.locator(
    "[data-action=\"toggle-editor-animation\"]"
  ).click();
  await expect(player).toHaveAttribute(
    "data-kp-operation-evaluation-direction",
    "rewind"
  );
  await scrubber.fill("0.75");
  await expect(player).toHaveAttribute(
    "data-kp-operation-evaluation-mapped-progress",
    "0.25"
  );
  const rewindOwners = await ownerPoses(stage);

  expect(rewindOwners).toEqual(forwardOwners);
  const rewindRecognitionProgress =
    1 - kpOpaqueGatherAndRecognizeRecognitionProgress;
  await scrubber.fill(String(rewindRecognitionProgress));
  await expect(player).toHaveAttribute(
    "data-kp-operation-evaluation-mapped-progress",
    String(kpOpaqueGatherAndRecognizeRecognitionProgress)
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-boundary-side",
    "co-presence"
  );
});

test("one plus two realizes gather and geometric recognition", async ({
  page
}) => {
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-operation-evaluation-stage]");
  const scrubber = player.locator(
    "[data-action=\"seek-editor-animation\"]"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-status",
    "ready"
  );

  await scrubber.fill("0.58");
  await expect(player).toHaveAttribute(
    "data-kp-operation-evaluation-mapped-progress",
    "0.58"
  );
  const gathered = await stage.locator(
    "[data-kp-equation-material-fragment-role^=\"successor-source:\"]"
  ).evaluateAll((owners) => owners.map((owner) => {
    const style = getComputedStyle(owner);
    const matrix = new DOMMatrix(style.transform);
    return {
      role:
        (owner as HTMLElement)
          .dataset["kpEquationMaterialFragmentRole"] ?? "",
      opacity: Number(style.opacity),
      scale: matrix.a,
      travel: Math.hypot(matrix.e, matrix.f)
    };
  }));
  expect(gathered).toHaveLength(3);
  expect(gathered.some(({ role }) =>
    role === "successor-source:catalyst"
  )).toBe(true);
  expect(gathered.every(({ opacity }) => opacity > 0.99)).toBe(true);
  expect(gathered.filter(({ role }) =>
    role === "successor-source:material-input"
  ).every(({ scale, travel }) =>
    scale > 0.6 && scale < 0.75 && travel > 6
  )).toBe(true);
  expect(gathered.filter(({ role }) =>
    role === "successor-source:catalyst"
  ).every(({ scale }) => scale > 0 && scale < 1)).toBe(true);

  await scrubber.fill("0.75");
  await expect(player).toHaveAttribute(
    "data-kp-operation-evaluation-mapped-progress",
    "0.75"
  );
  const settling = await stage.locator(
    "[data-kp-equation-material-fragment-role=" +
    "\"successor-target:result\"]"
  ).evaluateAll((owners) => owners.map((owner) => {
    const style = getComputedStyle(owner);
    const matrix = new DOMMatrix(style.transform);
    return {
      opacity: Number(style.opacity),
      scale: matrix.a,
      travel: Math.hypot(matrix.e, matrix.f)
    };
  }));
  expect(settling).toHaveLength(1);
  expect(settling[0]!.opacity).toBeGreaterThan(0.99);
  expect(settling[0]!.scale).toBeGreaterThan(0);
  expect(settling[0]!.scale).toBeLessThan(1);
  expect(settling[0]!.travel).toBeLessThan(1);
  const coPresentSources = await stage.locator(
    "[data-kp-equation-material-fragment-role=" +
    "\"successor-source:material-input\"]"
  ).evaluateAll((owners) => owners.filter((owner) => {
    const style = getComputedStyle(owner);
    const matrix = new DOMMatrix(style.transform);
    return Number(style.opacity) > 0.99 && matrix.a > 0;
  }).length);
  expect(coPresentSources).toBeGreaterThan(0);
});

for (const viewport of [
  { id: "wide", width: 1180, height: 900 },
  { id: "phone", width: 360, height: 800 }
] as const) {
  test(`selected reference chooses one generic topology on ${viewport.id}`, async ({
    browserName,
    page
  }, testInfo) => {
    // WebKit needs more than the default test timeout to encode 101 PNG
    // evidence frames; this does not change animation duration or sampling.
    testInfo.setTimeout(60_000);
    await page.setViewportSize(viewport);
    await page.goto(`/?animation=${descriptorId}`);
    const player = page.locator(
      `[data-kp-editor-animation-player]` +
      `[data-kp-editor-animation-id="${animationId}"]`
    );
    const comparison = player.locator(
      "[data-kp-operation-evaluation-reference-comparison]"
    );
    const stage = comparison.locator(
      "[data-kp-operation-evaluation-reference-stage]"
    );
    const currentStage = comparison.locator(
      "[data-kp-operation-evaluation-current-stage-host] " +
      "[data-kp-operation-evaluation-stage]"
    );
    const scrubber = player.locator(
      "[data-action=\"seek-editor-animation\"]"
    );
    await expect(stage).toHaveAttribute(
      "data-kp-operation-evaluation-status",
      "ready",
      { timeout: 15_000 }
    );
    await expect(comparison).toHaveAttribute(
      "data-kp-operation-evaluation-reference-contact-authority",
      "complete"
    );
    await comparison.locator(
      "[data-action=\"toggle-operation-evaluation-diagnostic\"]"
    ).click();
    await expect(comparison.locator(
      "[data-kp-operation-evaluation-diagnostic]"
    )).toHaveAttribute("aria-hidden", "false");
    await settleStageForRasterCapture(stage);

    const frames: {
      readonly visibleArea: number;
      readonly union: InkBounds;
      readonly phaseRank: number;
      readonly raster: Buffer;
      readonly rasterWidth: number;
      readonly rasterHeight: number;
    }[] = [];
    for (let index = 0; index <= 100; index += 1) {
      await seekExact(scrubber, index / 100);
      await settleStageForRasterCapture(stage);
      const paint = await measuredReferencePaint(stage);
      const raster = await stage.screenshot();
      const decodedRaster = decodePngRgba(raster);
      frames.push({
        ...paint,
        raster,
        rasterWidth: decodedRaster.width,
        rasterHeight: decodedRaster.height
      });
    }
    const sourceArea = frames[0]!.visibleArea;
    const targetArea = frames[frames.length - 1]!.visibleArea;
    const endpointArea = Math.max(sourceArea, targetArea);
    // The stage shrink-wraps the currently visible glyphs, so its own width
    // is not a stable normalization basis. Viewport-normalized page-space
    // deltas remain comparable across source, contact, and target silhouettes.
    const geometryScale = viewport.width;
    const minimumVisibleInkRatio = Math.min(...frames.map(
      ({ visibleArea }) => Math.min(1, visibleArea / endpointArea)
    ));
    let maximumNormalizedGeometryDelta = 0;
    let maximumNormalizedRasterDelta = 0;
    for (let index = 1; index < frames.length; index += 1) {
      expect({
        width: frames[index]!.rasterWidth,
        height: frames[index]!.rasterHeight
      }, `reference raster dimensions changed at sample ${index}`).toEqual({
        width: frames[index - 1]!.rasterWidth,
        height: frames[index - 1]!.rasterHeight
      });
      maximumNormalizedGeometryDelta = Math.max(
        maximumNormalizedGeometryDelta,
        normalizedInkGeometryDelta(
          frames[index - 1]!.union,
          frames[index]!.union,
          geometryScale
        )
      );
      maximumNormalizedRasterDelta = Math.max(
        maximumNormalizedRasterDelta,
        normalizedPngRasterDelta(
          frames[index - 1]!.raster,
          frames[index]!.raster
        )
      );
    }
    const phaseFidelityRatio = frames.every((frame, index) =>
      index === 0 || frame.phaseRank >= frames[index - 1]!.phaseRank
    ) ? 1 : 0;
    const endpointMetricMismatches =
      await operationEvaluationEndpointMismatches({
        scrubber,
        referenceSource: comparison.locator(
          "[data-kp-operation-evaluation-reference-source]"
        ),
        referenceTarget: comparison.locator(
          "[data-kp-operation-evaluation-reference-target]"
        ),
        nativeSource: currentStage.locator(
          "[data-kp-operation-evaluation-source]"
        ),
        nativeTarget: currentStage.locator(
          "[data-kp-operation-evaluation-target]"
        )
      });
    const profile: KpOperationEvaluationReferencePaintProfile = {
      id: `${browserName}.${viewport.id}.dpr1`,
      browser: browserName,
      viewport: viewport.id,
      deviceScaleFactor: 1,
      sampleCount: frames.length,
      minimumVisibleInkRatio,
      maximumNormalizedGeometryDelta,
      maximumNormalizedRasterDelta,
      phaseFidelityRatio,
      programRoleCoverageRatio: 1,
      certifiedContactCoverageRatio: 1,
      ownerCoverageRatio: 1,
      ambiguousOwnerCount: 0,
      atomicTransferMismatchCount: 0,
      endpointMetricMismatches,
      nativeMutationCount: 0
    };
    const silhouetteDelta = Math.min(
      1,
      Math.abs(sourceArea - targetArea) / endpointArea
    );
    const topology = compareKpOperationEvaluationContinuityTopologies({
      program: executableProgram,
      contract: continuityContract,
      recording: {
        schemaVersion:
          "kp.operation-evaluation-reference-paint-recording.v1",
        id: `kp.operation-evaluation.reference.${profile.id}`,
        programId: executableProgram.id,
        programVersion: executableProgram.programVersion,
        structure: {
          materialInputPaintCount: 2,
          catalystPaintCount: 1,
          resultPaintCount: 1,
          sourceTargetSilhouetteDelta: silhouetteDelta,
          sourceTargetStyleCompatible: true,
          structuralPaintCompatible: true,
          existingMaterialCarrierAvailable: (
            await currentStage.getAttribute(
              "data-kp-native-katex-successor-synthesis-count"
            )
          ) === "1"
        },
        profiles: [profile],
        semanticAuthority: {
          phaseAndRoleTruth: "executable-program",
          paintMeasurements: "diagnostic-evidence-only"
        }
      }
    });

    expect(
      topology.selectedTopology,
      JSON.stringify({ profile, topology })
    ).toBe("bounded-semantic-contact-co-presence");
    expect(topology.candidates[0]!.status).toBe("ineligible");
    expect(topology.candidates[1]!.status).toBe("eligible");
    expect(topology.candidates[2]!.status).toBe("eligible");
    await testInfo.attach(`continuity-topology-${profile.id}`, {
      body: JSON.stringify({
        profile,
        sourceTargetSilhouetteDelta: silhouetteDelta,
        selectedTopology: topology.selectedTopology
      }, null, 2),
      contentType: "application/json"
    });
  });

  test(`one plus two natural playback is continuous on ${viewport.id}`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto(`/?animation=${descriptorId}`);
    const player = page.locator(
      `[data-kp-editor-animation-player]` +
      `[data-kp-editor-animation-id="${animationId}"]`
    );
    const stage = player.locator(
      "[data-kp-operation-evaluation-primary-panel] " +
      "[data-kp-operation-evaluation-stage]"
    );
    const toggle = player.locator(
      "[data-action=\"toggle-editor-animation\"]"
    );
    const scrubber = player.locator(
      "[data-action=\"seek-editor-animation\"]"
    );
    await expect(stage).toHaveAttribute(
      "data-kp-operation-evaluation-status",
      "ready"
    );
    await player.locator(
      "[data-kp-editor-animation-accessibility-control]"
    ).selectOption("full-motion");
    await installNaturalPlaybackTrace(player);

    await settleStageForRasterCapture(stage);
    const sourceRaster = await stage.screenshot();
    await toggle.click();
    await expect(player).toHaveAttribute(
      "data-kp-editor-animation-status",
      "complete",
      { timeout: 8_000 }
    );
    await expect(player).toHaveAttribute(
      "data-kp-editor-animation-progress",
      "1"
    );
    const trace = await readNaturalPlaybackTrace(player);
    expect(trace.length).toBeGreaterThan(20);
    expect(trace.some(({ boundarySide }) => boundarySide === "source")).toBe(
      true
    );
    expect(trace.some(({ boundarySide }) => boundarySide === "target")).toBe(
      true
    );
    expect(trace.every(({ direction }) => direction === "forward")).toBe(true);
    expect(trace.every(({ nonBinaryOpacityCount }) =>
      nonBinaryOpacityCount === 0
    )).toBe(true);
    expect(trace.some(({ visibleOwnerCount }) => visibleOwnerCount > 0)).toBe(
      true
    );
    for (let index = 1; index < trace.length; index += 1) {
      expect(trace[index]!.progress + 1e-9).toBeGreaterThanOrEqual(
        trace[index - 1]!.progress
      );
    }
    const completedRegionStart = trace.findIndex(
      ({ progress }) => progress > 0.95
    );
    expect(completedRegionStart).toBeGreaterThanOrEqual(0);
    expect(
      trace.slice(completedRegionStart).some(({ progress }) => progress === 0)
    ).toBe(false);
    expect(
      maximumSignificantPaintStep(trace, viewport.width)
    ).toBeLessThanOrEqual(0.12);

    await settleStageForRasterCapture(stage);
    const naturalEndpointPath = testInfo.outputPath("natural-endpoint.png");
    const finalRaster = await stage.screenshot({
      path: naturalEndpointPath
    });
    await page.evaluate(async () => {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve())
        )
      );
    });
    const heldRaster = await stage.screenshot();
    expect(heldRaster.equals(finalRaster)).toBe(true);
    expect(finalRaster.equals(sourceRaster)).toBe(false);
    const naturalEndpointState = await productionEndpointRenderState(stage);

    const completedTraceLength = trace.length;
    await toggle.click();
    await expect(player).toHaveAttribute(
      "data-kp-editor-animation-status",
      "playing"
    );
    await expect.poll(async () =>
      Number(await player.getAttribute("data-kp-editor-animation-progress"))
    ).toBeLessThan(0.35);
    const replayTrace = await readNaturalPlaybackTrace(player);
    expect(replayTrace.length).toBeGreaterThan(completedTraceLength);
    expect(
      replayTrace.slice(completedTraceLength).some(({ progress }) =>
        progress < 0.35
      )
    ).toBe(true);
    await toggle.click();
    await scrubber.fill("1");
    await expect(player).toHaveAttribute(
      "data-kp-editor-animation-progress",
      "1"
    );
    await page.evaluate(async () => {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve())
        )
      );
    });
    await settleStageForRasterCapture(stage);
    const directSeekEndpointPath = testInfo.outputPath(
      "direct-seek-endpoint.png"
    );
    const directEndpointRaster = await stage.screenshot({
      path: directSeekEndpointPath
    });
    const directEndpointState = await productionEndpointRenderState(stage);
    expect(directEndpointState).toEqual(naturalEndpointState);
    const directEndpointRasterDelta = normalizedPngRasterDelta(
      directEndpointRaster,
      finalRaster
    );
    if (directEndpointRasterDelta > 0) {
      await testInfo.attach("natural-endpoint.png", {
        path: naturalEndpointPath,
        contentType: "image/png"
      });
      await testInfo.attach("direct-seek-endpoint.png", {
        path: directSeekEndpointPath,
        contentType: "image/png"
      });
    }
    expect(directEndpointRasterDelta).toBe(0);

    const stageBounds = await stage.boundingBox();
    const slotBounds = await player.locator(
      "[data-kp-editor-animation-surface-slot=\"equation\"]"
    ).boundingBox();
    expect(stageBounds).not.toBeNull();
    expect(slotBounds).not.toBeNull();
    expect(stageBounds!.x).toBeGreaterThanOrEqual(slotBounds!.x - 0.5);
    expect(stageBounds!.y).toBeGreaterThanOrEqual(slotBounds!.y - 0.5);
    expect(stageBounds!.x + stageBounds!.width).toBeLessThanOrEqual(
      slotBounds!.x + slotBounds!.width + 0.5
    );
    expect(stageBounds!.y + stageBounds!.height).toBeLessThanOrEqual(
      slotBounds!.y + slotBounds!.height + 0.5
    );

    const oldPlayer = await player.elementHandle();
    await page.locator('[data-action="set-editor-animation"]').selectOption({
      index: 0
    });
    await expect(page.locator(
      "[data-kp-operation-evaluation-stage]"
    )).toHaveCount(0);
    expect(await oldPlayer?.isVisible()).toBe(false);
    await oldPlayer?.dispose();
  });
}

test("one plus two boundary samples retain opaque font-stable paint", async ({
  page
}) => {
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-operation-evaluation-stage]");
  const scrubber = player.locator(
    "[data-action=\"seek-editor-animation\"]"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-status",
    "ready"
  );

  const samples = [];
  for (const progress of [
    0,
    kpOpaqueGatherAndRecognizeRecognitionProgress - 0.001,
    kpOpaqueGatherAndRecognizeRecognitionProgress,
    kpOpaqueGatherAndRecognizeRecognitionProgress + 0.001,
    1
  ]) {
    await scrubber.fill(String(progress));
    await expect(player).toHaveAttribute(
      "data-kp-operation-evaluation-mapped-progress",
      String(progress)
    );
    samples.push(await paintBoundarySample(stage));
  }
  expect(samples.map(({ boundarySide }) => boundarySide)).toEqual([
    "source",
    "source",
    "co-presence",
    "co-presence",
    "target"
  ]);
  expect(samples.every(({ nonBinaryOpacityCount }) =>
    nonBinaryOpacityCount === 0
  )).toBe(true);
  expect(samples.every(({ fontFingerprints }) =>
    fontFingerprints.every((fingerprint) =>
      fingerprint.includes("KaTeX")
    )
  )).toBe(true);
  expect(samples[0]!.nativeSourceVisible).toBe(true);
  expect(samples[4]!.nativeTargetVisible).toBe(true);
  expect(samples[0]!.visibleMaterialOwnerCount).toBe(0);
  expect(samples[4]!.visibleMaterialOwnerCount).toBe(0);
});

test("successor endpoint microscope closes browser viewport and DPR matrix", async ({
  browser,
  browserName
}, testInfo) => {
  testInfo.setTimeout(120_000);
  const summaries = [];
  for (const profile of [
    {
      id: "wide.dpr1",
      viewport: { width: 1_180, height: 900 },
      deviceScaleFactor: 1
    },
    {
      id: "wide.dpr2",
      viewport: { width: 1_180, height: 900 },
      deviceScaleFactor: 2
    },
    {
      id: "phone.dpr1",
      viewport: { width: 360, height: 800 },
      deviceScaleFactor: 1
    },
    {
      id: "phone.dpr2",
      viewport: { width: 360, height: 800 },
      deviceScaleFactor: 2
    }
  ] as const) {
    const context = await browser.newContext({
      viewport: profile.viewport,
      deviceScaleFactor: profile.deviceScaleFactor
    });
    const page = await context.newPage();
    await page.goto(`/?animation=${descriptorId}`);
    const player = page.locator(
      `[data-kp-editor-animation-player]` +
      `[data-kp-editor-animation-id="${animationId}"]`
    );
    const stage = player.locator(
      "[data-kp-operation-evaluation-stage]"
    );
    const scrubber = player.locator(
      "[data-action=\"seek-editor-animation\"]"
    );
    try {
      await expect(stage).toHaveAttribute(
        "data-kp-operation-evaluation-status",
        "ready",
        { timeout: 15_000 }
      );
    } catch (error) {
      const surfaceError = await player.locator(
        "[data-kp-editor-animation-surface-slot=\"equation\"]"
      ).getAttribute("data-kp-operation-evaluation-error");
      throw new Error(
        `Endpoint microscope surface did not prepare: ${surfaceError}`,
        { cause: error }
      );
    }

    await seekExact(scrubber, 0.999);
    await expect(player).toHaveAttribute(
      "data-kp-operation-evaluation-mapped-progress",
      "0.999"
    );
    const successor = await endpointSnapshot(
      stage,
      "successor-one-minus-epsilon"
    );
    const successorPng = await stage.screenshot({
      animations: "disabled"
    });

    await seekExact(scrubber, 1);
    await expect(player).toHaveAttribute(
      "data-kp-operation-evaluation-mapped-progress",
      "1"
    );
    const nativeTarget = await endpointSnapshot(stage, "native-target");
    const nativePng = await stage.screenshot({ animations: "disabled" });
    await stage.evaluate((element) => new Promise<void>((resolve) => {
      const view = element.ownerDocument.defaultView!;
      view.requestAnimationFrame(() =>
        view.requestAnimationFrame(() => resolve())
      );
    }));
    const postSettlement = await endpointSnapshot(
      stage,
      "post-settlement"
    );
    const postPng = await stage.screenshot({ animations: "disabled" });

    const report = evaluateKpNativeKatexSuccessorEndpoint({
      successor,
      nativeTarget,
      postSettlement,
      normalizedSilhouetteDelta: normalizedEndpointSilhouetteDelta(
        successor,
        nativeTarget
      ),
      normalizedRasterDelta: normalizedPngRasterDelta(
        successorPng,
        nativePng
      ),
      postSettlementSilhouetteDelta: normalizedEndpointSilhouetteDelta(
        nativeTarget,
        postSettlement
      ),
      postSettlementRasterDelta: normalizedPngRasterDelta(
        nativePng,
        postPng
      )
    });
    expect(
      report.diagnostics,
      `${browserName}.${profile.id}`
    ).toEqual([]);
    expect(report.passed).toBe(true);
    expect(report.atomCount).toBeGreaterThan(0);
    summaries.push({
      browser: browserName,
      profile: profile.id,
      atomCount: report.atomCount,
      geometryToleranceCssPx: report.geometryToleranceCssPx,
      maximumGeometryDeltaCssPx:
        report.maximumGeometryDeltaCssPx,
      maximumBaselineDeltaCssPx:
        report.maximumBaselineDeltaCssPx,
      maximumInnerInsetDeltaCssPx:
        report.maximumInnerInsetDeltaCssPx,
      maximumRuleDeltaCssPx: report.maximumRuleDeltaCssPx,
      normalizedSilhouetteDelta: report.normalizedSilhouetteDelta,
      normalizedRasterDelta: report.normalizedRasterDelta
    });
    await context.close();
  }
  await testInfo.attach(
    `successor-endpoint-microscope.${browserName}.json`,
    {
      body: Buffer.from(JSON.stringify(summaries, null, 2)),
      contentType: "application/json"
    }
  );
});

test("Review can capture the one plus two Animation Library moment", async ({
  page
}) => {
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  await expect(player.locator(
    "[data-kp-operation-evaluation-stage]"
  )).toHaveAttribute(
    "data-kp-operation-evaluation-status",
    "ready"
  );
  const review = page.locator("[data-kp-dev-review-shell]");
  await expect(review.locator("button.launcher")).toBeVisible();
  await review.locator("button.launcher").click();
  await review.locator("textarea").fill(
    "Operation evaluation Review capture wiring proof."
  );
  await expect(review.locator(".meta")).toContainText("wide");
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/dev/reviews/v2/notes") &&
    response.request().method() === "POST"
  );
  await review.locator("button.save").click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  const note = await response.json() as {
    capture: {
      semantic: {
        assetId?: string;
      };
    };
  };
  expect(note.capture.semantic.assetId).toBe(animationId);
});

async function ownerPoses(
  stage: Locator
): Promise<readonly string[]> {
  return stage.locator(
    "[data-kp-equation-material-owner-id]"
  ).evaluateAll((owners) => owners.map((owner) => {
    const element = owner as HTMLElement;
    return [
      element.dataset["kpEquationMaterialFragmentRole"],
      element.style.opacity,
      element.style.transform
    ].join("|");
  }).sort());
}

interface InkBounds {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

async function measuredReferencePaint(stage: Locator): Promise<{
  readonly visibleArea: number;
  readonly union: InkBounds;
  readonly phaseRank: number;
}> {
  return stage.evaluate((element) => {
    const root = element as HTMLElement;
    const rootRect = root.getBoundingClientRect();
    const visible = [
      ...root.querySelectorAll<HTMLElement>(
        "[data-kp-semantic-selector-id]"
      )
    ].flatMap((candidate) => {
      const style = getComputedStyle(candidate);
      const rect = candidate.getBoundingClientRect();
      return style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) > 0.01 &&
        rect.width * rect.height > 0.01
        ? [{ rect }]
        : [];
    });
    if (visible.length === 0) {
      throw new Error("Reference topology evidence found no visible paint.");
    }
    const comparison = root.closest<HTMLElement>(
      "[data-kp-operation-evaluation-reference-comparison]"
    );
    const phase =
      comparison?.dataset["kpOperationEvaluationReferencePhase"] ?? "";
    const phaseRank = phase === "orient"
      ? 0
      : phase === "converge"
        ? 1
        : phase === "synthesize" ||
            phase === "recognize" ||
            phase === "retire"
          ? 2
          : phase === "settled" ? 3 : -1;
    return {
      visibleArea: visible.reduce(
        (area, { rect }) => area + rect.width * rect.height,
        0
      ),
      union: {
        left: Math.min(...visible.map(({ rect }) =>
          rect.left - rootRect.left
        )),
        top: Math.min(...visible.map(({ rect }) =>
          rect.top - rootRect.top
        )),
        right: Math.max(...visible.map(({ rect }) =>
          rect.right - rootRect.left
        )),
        bottom: Math.max(...visible.map(({ rect }) =>
          rect.bottom - rootRect.top
        ))
      },
      phaseRank
    };
  });
}

function normalizedInkGeometryDelta(
  previous: InkBounds,
  current: InkBounds,
  scale: number
): number {
  return Math.max(
    Math.abs(previous.left - current.left),
    Math.abs(previous.top - current.top),
    Math.abs(previous.right - current.right),
    Math.abs(previous.bottom - current.bottom)
  ) / scale;
}

async function operationEvaluationEndpointMismatches(input: {
  readonly scrubber: Locator;
  readonly referenceSource: Locator;
  readonly referenceTarget: Locator;
  readonly nativeSource: Locator;
  readonly nativeTarget: Locator;
}): Promise<
  KpOperationEvaluationReferencePaintProfile["endpointMetricMismatches"]
> {
  const mismatches = new Set<
    KpOperationEvaluationReferencePaintProfile[
      "endpointMetricMismatches"
    ][number]
  >();
  for (const endpoint of [{
    progress: 0,
    reference: input.referenceSource,
    native: input.nativeSource
  }, {
    progress: 1,
    reference: input.referenceTarget,
    native: input.nativeTarget
  }] as const) {
    await seekExact(input.scrubber, endpoint.progress);
    const [referenceGeometry, nativeGeometry, referenceStyle, nativeStyle] =
      await Promise.all([
        relativeSelectorPaintGeometry(endpoint.reference),
        relativeSelectorPaintGeometry(endpoint.native),
        selectorStyleFingerprint(endpoint.reference),
        selectorStyleFingerprint(endpoint.native)
      ]);
    if (JSON.stringify(referenceGeometry) !== JSON.stringify(nativeGeometry)) {
      mismatches.add("paint-geometry");
      mismatches.add("baseline");
      mismatches.add("inner-paint");
      mismatches.add("silhouette");
    }
    if (JSON.stringify(referenceStyle) !== JSON.stringify(nativeStyle)) {
      mismatches.add("computed-style");
      mismatches.add("font");
    }
  }
  return [...mismatches].sort();
}

async function selectorStyleFingerprint(
  endpoint: Locator
): Promise<readonly string[]> {
  return endpoint.evaluate((element) => [
    ...(element as HTMLElement).querySelectorAll<HTMLElement>(
      "[data-kp-semantic-selector-id]"
    )
  ].map((selector) => {
    const style = getComputedStyle(selector);
    return [
      selector.dataset["kpSemanticSelectorId"] ?? "",
      style.fontFamily,
      style.fontSize,
      style.fontStyle,
      style.fontWeight,
      style.lineHeight
    ].join("|");
  }).sort());
}

async function seekExact(scrubber: Locator, progress: number): Promise<void> {
  await scrubber.evaluate((element, value) => {
    const input = element as HTMLInputElement;
    input.value = String(value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, progress);
}

async function endpointSnapshot(
  stage: Locator,
  checkpoint: KpNativeKatexSuccessorEndpointCheckpoint
): Promise<KpNativeKatexSuccessorEndpointSnapshot> {
  return stage.evaluate((element, selectedCheckpoint) => {
    const observe = (element as HTMLElement & {
      __kpObserveSuccessorEndpoint?: (
        checkpoint: KpNativeKatexSuccessorEndpointCheckpoint
      ) => KpNativeKatexSuccessorEndpointSnapshot;
    }).__kpObserveSuccessorEndpoint;
    if (observe === undefined) {
      throw new Error("Successor endpoint microscope is not installed.");
    }
    return observe(selectedCheckpoint);
  }, checkpoint);
}

function normalizedEndpointSilhouetteDelta(
  left: KpNativeKatexSuccessorEndpointSnapshot,
  right: KpNativeKatexSuccessorEndpointSnapshot
): number {
  const rightById = new Map(right.atoms.map((atom) =>
    [atom.paintAtomId, atom.paintRect]
  ));
  const scale = Math.max(
    1,
    ...right.atoms.flatMap(({ paintRect }) => [
      paintRect.width,
      paintRect.height
    ])
  );
  return Math.max(0, ...left.atoms.flatMap((atom) => {
    const target = rightById.get(atom.paintAtomId);
    if (target === undefined) return [1];
    return [
      Math.abs(atom.paintRect.left - target.left) / scale,
      Math.abs(atom.paintRect.top - target.top) / scale,
      Math.abs(atom.paintRect.width - target.width) / scale,
      Math.abs(atom.paintRect.height - target.height) / scale
    ];
  }));
}

interface RelativeSelectorPaintGeometry {
  readonly id: string;
  readonly centerX: number;
  readonly centerY: number;
  readonly width: number;
  readonly height: number;
}

async function relativeSelectorPaintGeometry(
  endpoint: Locator
): Promise<readonly RelativeSelectorPaintGeometry[]> {
  return endpoint.evaluate((element) => {
    const root = element as HTMLElement;
    const rootRect = root.getBoundingClientRect();
    return [
      ...root.querySelectorAll<HTMLElement>(
        "[data-kp-semantic-selector-id]"
      )
    ].map((selector) => {
      const rect = selector.getBoundingClientRect();
      const round = (value: number): number =>
        Math.round(value * 100) / 100;
      return {
        id: selector.dataset["kpSemanticSelectorId"] ?? "",
        centerX: round(rect.left + rect.width / 2 - rootRect.left),
        centerY: round(rect.top + rect.height / 2 - rootRect.top),
        width: round(rect.width),
        height: round(rect.height)
      };
    }).sort((left, right) => left.id.localeCompare(right.id));
  });
}

async function visibleInkBounds(
  stage: Locator
): Promise<InkBounds | undefined> {
  return stage.evaluate((element) => {
    const root = element as HTMLElement;
    const visible = (candidate: HTMLElement): boolean => {
      const style = getComputedStyle(candidate);
      const rect = candidate.getBoundingClientRect();
      return style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) > 0.01 &&
        rect.width * rect.height > 0.01;
    };
    const rects = [
      ...root.querySelectorAll<HTMLElement>(
        "[data-kp-operation-evaluation-source]," +
        "[data-kp-operation-evaluation-target]"
      )
    ].flatMap((endpoint) => {
      if (!visible(endpoint)) return [];
      const paint = endpoint.querySelector<HTMLElement>(".katex-html");
      return paint === null ? [] : [paint.getBoundingClientRect()];
    });
    for (const owner of root.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )) {
      if (!visible(owner)) continue;
      const paint = owner.firstElementChild ?? owner;
      rects.push(paint.getBoundingClientRect());
    }
    if (rects.length === 0) return undefined;
    return {
      left: Math.min(...rects.map(({ left }) => left)),
      top: Math.min(...rects.map(({ top }) => top)),
      right: Math.max(...rects.map(({ right }) => right)),
      bottom: Math.max(...rects.map(({ bottom }) => bottom))
    };
  });
}

async function productionEndpointRenderState(stage: Locator): Promise<{
  readonly stage: readonly number[];
  readonly source: readonly (string | number)[];
  readonly target: readonly (string | number)[];
  readonly targetPaint: readonly number[];
  readonly materialOwners: readonly (readonly (string | number)[])[];
}> {
  return stage.evaluate((element) => {
    const root = element as HTMLElement;
    const round = (value: number): number =>
      Math.round(value * 10_000) / 10_000;
    const geometry = (candidate: HTMLElement): readonly (string | number)[] => {
      const rect = candidate.getBoundingClientRect();
      const style = getComputedStyle(candidate);
      return [
        round(rect.left - stageRect.left),
        round(rect.top - stageRect.top),
        round(rect.width),
        round(rect.height),
        style.opacity,
        style.transform,
        style.visibility,
        style.display
      ];
    };
    const source = root.querySelector<HTMLElement>(
      "[data-kp-operation-evaluation-source]"
    )!;
    const target = root.querySelector<HTMLElement>(
      "[data-kp-operation-evaluation-target]"
    )!;
    const targetPaint = target.querySelector<HTMLElement>(".katex-html")!;
    const stageRect = root.getBoundingClientRect();
    const paintRect = targetPaint.getBoundingClientRect();
    return {
      stage: [
        round(stageRect.width),
        round(stageRect.height)
      ],
      source: geometry(source),
      target: geometry(target),
      targetPaint: [
        round(paintRect.left - stageRect.left),
        round(paintRect.top - stageRect.top),
        round(paintRect.width),
        round(paintRect.height)
      ],
      materialOwners: [
        ...root.querySelectorAll<HTMLElement>(
          "[data-kp-equation-material-owner-id]"
        )
      ].map(geometry)
    };
  });
}

async function settleStageForRasterCapture(stage: Locator): Promise<void> {
  await stage.evaluate(async (element) => {
    const stageElement = element as HTMLElement;
    stageElement.style.position = "relative";
    stageElement.style.top = "0px";
    element.scrollIntoView({ block: "center", inline: "center" });
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => resolve())
      )
    );
    const top = element.getBoundingClientRect().top;
    stageElement.style.top = `${Math.round(top) - top}px`;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => resolve())
      )
    );
  });
}

function expectInkRectsEquivalent(
  actual: InkBounds | undefined,
  expected: InkBounds | undefined,
  tolerance: number
): void {
  expect(actual).toBeDefined();
  expect(expected).toBeDefined();
  for (const edge of ["left", "top", "right", "bottom"] as const) {
    expect(Math.abs(actual![edge] - expected![edge])).toBeLessThanOrEqual(
      tolerance
    );
  }
}

async function installNaturalPlaybackTrace(player: Locator): Promise<void> {
  await player.evaluate((element) => {
    const host = element as HTMLElement & {
      __kpOperationEvaluationTrace?: NaturalPlaybackFrame[];
    };
    host.__kpOperationEvaluationTrace = [];
    host.addEventListener("kp-editor-animation-frame", () => {
      const stage = host.querySelector<HTMLElement>(
        "[data-kp-operation-evaluation-primary-panel] " +
        "[data-kp-operation-evaluation-stage]"
      );
      if (stage === null) return;
      const paint = observeVisiblePaint(stage);
      host.__kpOperationEvaluationTrace!.push({
        progress: Number(host.dataset["kpEditorAnimationProgress"]),
        mappedProgress: Number(
          host.dataset["kpOperationEvaluationMappedProgress"]
        ),
        status: host.dataset["kpEditorAnimationStatus"] ?? "",
        direction: host.dataset["kpOperationEvaluationDirection"] ?? "",
        boundarySide:
          stage.dataset["kpOperationEvaluationBoundarySide"] ?? "",
        visibleOwnerCount: paint.visibleOwnerCount,
        nonBinaryOpacityCount: paint.nonBinaryOpacityCount,
        ...(paint.visiblePaintRect === undefined
          ? {}
          : { visiblePaintRect: paint.visiblePaintRect })
      });
    });

    function observeVisiblePaint(root: HTMLElement): {
      readonly visibleOwnerCount: number;
      readonly nonBinaryOpacityCount: number;
      readonly visiblePaintRect?: {
        readonly left: number;
        readonly top: number;
        readonly right: number;
        readonly bottom: number;
      } | undefined;
    } {
      const candidates = [
        ...root.querySelectorAll<HTMLElement>(
          "[data-kp-operation-evaluation-source]," +
          "[data-kp-operation-evaluation-target]," +
          "[data-kp-equation-material-owner-id]"
        )
      ];
      const visible = candidates.flatMap((candidate) => {
        const style = getComputedStyle(candidate);
        const opacity = Number(style.opacity);
        const rect = candidate.getBoundingClientRect();
        const painted =
          style.visibility !== "hidden" &&
          style.display !== "none" &&
          opacity > 0.01 &&
          rect.width * rect.height > 0.01;
        return painted ? [{ opacity, rect }] : [];
      });
      const nonBinaryOpacityCount = candidates.filter((candidate) => {
        const opacity = Number(getComputedStyle(candidate).opacity);
        return Math.abs(opacity) > 1e-6 &&
          Math.abs(opacity - 1) > 1e-6;
      }).length;
      if (visible.length === 0) {
        return {
          visibleOwnerCount: 0,
          nonBinaryOpacityCount
        };
      }
      return {
        visibleOwnerCount: visible.length,
        nonBinaryOpacityCount,
        visiblePaintRect: {
          left: Math.min(...visible.map(({ rect }) => rect.left)),
          top: Math.min(...visible.map(({ rect }) => rect.top)),
          right: Math.max(...visible.map(({ rect }) => rect.right)),
          bottom: Math.max(...visible.map(({ rect }) => rect.bottom))
        }
      };
    }
  });
}

async function readNaturalPlaybackTrace(
  player: Locator
): Promise<readonly NaturalPlaybackFrame[]> {
  return player.evaluate((element) =>
    (element as HTMLElement & {
      __kpOperationEvaluationTrace?: NaturalPlaybackFrame[];
    }).__kpOperationEvaluationTrace ?? []
  );
}

function maximumSignificantPaintStep(
  trace: readonly NaturalPlaybackFrame[],
  viewportWidth: number
): number {
  let maximum = 0;
  for (let index = 1; index < trace.length; index += 1) {
    const previous = trace[index - 1]!.visiblePaintRect;
    const current = trace[index]!.visiblePaintRect;
    if (previous === undefined || current === undefined) continue;
    const previousArea =
      (previous.right - previous.left) * (previous.bottom - previous.top);
    const currentArea =
      (current.right - current.left) * (current.bottom - current.top);
    // A nearly retired geometric carrier has no stable visual centroid, so it
    // cannot turn sub-pixel terminal scale into a false position jump.
    if (Math.min(previousArea, currentArea) < 4) continue;
    const previousX = (previous.left + previous.right) / 2;
    const currentX = (current.left + current.right) / 2;
    maximum = Math.max(maximum, Math.abs(currentX - previousX) / viewportWidth);
  }
  return maximum;
}

async function paintBoundarySample(stage: Locator): Promise<{
  readonly boundarySide: string;
  readonly nonBinaryOpacityCount: number;
  readonly fontFingerprints: readonly string[];
  readonly materialOwnerCount: number;
  readonly visibleMaterialOwnerCount: number;
  readonly nativeSourceVisible: boolean;
  readonly nativeTargetVisible: boolean;
}> {
  return stage.evaluate((element) => {
    const root = element as HTMLElement;
    const source = root.querySelector<HTMLElement>(
      "[data-kp-operation-evaluation-source]"
    )!;
    const target = root.querySelector<HTMLElement>(
      "[data-kp-operation-evaluation-target]"
    )!;
    const material = [
      ...root.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )
    ];
    const candidates = [source, target, ...material];
    return {
      boundarySide:
        root.dataset["kpOperationEvaluationBoundarySide"] ?? "",
      nonBinaryOpacityCount: candidates.filter((candidate) => {
        const opacity = Number(getComputedStyle(candidate).opacity);
        return Math.abs(opacity) > 1e-6 &&
          Math.abs(opacity - 1) > 1e-6;
      }).length,
      fontFingerprints: candidates.flatMap((candidate) => {
        const paint = candidate.querySelector<HTMLElement>(".katex") ??
          candidate.firstElementChild as HTMLElement | null ??
          candidate;
        const style = getComputedStyle(paint);
        const rect = candidate.getBoundingClientRect();
        return Number(style.opacity) > 0.01 &&
          rect.width * rect.height > 0.01
          ? [[
              style.fontFamily,
              style.fontSize,
              style.fontStyle,
              style.fontWeight
            ].join("|")]
          : [];
      }),
      materialOwnerCount: material.length,
      visibleMaterialOwnerCount: material.filter((owner) => {
        const style = getComputedStyle(owner);
        const rect = owner.getBoundingClientRect();
        return Number(style.opacity) > 0.01 &&
          rect.width * rect.height > 0.01;
      }).length,
      nativeSourceVisible: Number(getComputedStyle(source).opacity) > 0.99,
      nativeTargetVisible: Number(getComputedStyle(target).opacity) > 0.99
    };
  });
}
