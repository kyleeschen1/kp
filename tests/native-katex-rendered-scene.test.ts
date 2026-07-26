import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpNativeKatexHandoffTelemetry,
  createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexHandoffPaintObservation,
  type KpNativeKatexPaintAtomObservation
} from "../src/rendering/native-katex-rendered-scene.ts";
import {
  assessKpNativeKatexTypographyHandoff,
  compareKpNativeKatexTypographyHandoffModels,
  compileKpNativeKatexHierarchicalScenePlan,
  compileKpNativeKatexSceneTracks,
  compileKpNativeKatexTypographyStylePlan,
  correlateKpNativeKatexSceneHandoff,
  createKpNativeKatexRendererSession,
  createKpNativeKatexSceneReconciliation,
  evaluateKpNativeKatexTypographyHandoffLaw,
  projectKpNativeKatexSemanticPaintRelations,
  reconcileKpNativeKatexScenes,
  reverseKpNativeKatexSemanticPaintRelations,
  selectKpNativeKatexTypographyRealizationDisposition,
  sampleKpNativeKatexSceneTracks,
  sampleKpNativeKatexTypographyStylePlan
} from "../src/rendering/native-katex-scene-compositor.ts";
import type {
  KpStageRelativeRect
} from "../src/rendering/native-katex-fragment-observer.ts";

const ownerDocument = {};
const stage = { ownerDocument } as HTMLElement;
const root = { ownerDocument } as HTMLElement;
const sourceElement = { ownerDocument } as HTMLElement;

function atom(
  id = "atom.source.x",
  presentationGroupId = "group.source"
): KpNativeKatexPaintAtomObservation {
  return {
    kind: "native-katex-paint-atom-observation",
    lifecycle: "renderer-session",
    id,
    endpoint: "source",
    semanticEntityId: "entity.x",
    presentationGroupId,
    paintKind: "glyph",
    visualKey: "glyph:x",
    sourceElement,
    rect: { left: 10, top: 20, width: 12, height: 24 },
    styleFingerprint: "font:KaTeX_Math",
    zOrder: 0,
    fontRevision: 2
  };
}

function handoffObservation(
  overrides: Partial<KpNativeKatexHandoffPaintObservation> = {}
): KpNativeKatexHandoffPaintObservation {
  return {
    kind: "native-katex-handoff-paint-observation",
    lifecycle: "renderer-session",
    id: "handoff.material.x",
    side: "material",
    paintAtomId: "target.paint.glyph.0",
    semanticEntityId: "entity.x",
    presentationGroupId: "group.target",
    paintKind: "glyph",
    element: sourceElement,
    rect: { left: 10, top: 20, width: 12, height: 24 },
    baselineY: 42,
    wrapperTransform: "matrix(1, 0, 0, 1, 0, 0)",
    wrapperFingerprint: "display:inline|font-size:16px",
    clipPath: "none",
    paintFingerprint: "glyph:x",
    styleFingerprint: "font-family:KaTeX_Math",
    opacity: 1,
    fontRevision: 2,
    ...overrides
  };
}

function alignmentTelemetry(input: {
  readonly pairs: readonly {
    readonly id: string;
    readonly materialRect: KpNativeKatexHandoffPaintObservation["rect"];
    readonly nativeRect: KpNativeKatexHandoffPaintObservation["rect"];
    readonly materialBaselineY?: number | null;
    readonly nativeBaselineY?: number | null;
    readonly materialStyle?: string;
    readonly nativeStyle?: string;
    readonly materialPaintFingerprint?: string;
    readonly nativePaintFingerprint?: string;
  }[];
}) {
  return createKpNativeKatexHandoffTelemetry({
    stage,
    progress: 0.999,
    observations: input.pairs.flatMap((pair) => [
      handoffObservation({
        id: `${pair.id}.material`,
        side: "material",
        paintAtomId: `paint.${pair.id}`,
        semanticEntityId: `entity.${pair.id}`,
        rect: pair.materialRect,
        baselineY: pair.materialBaselineY ?? 42,
        styleFingerprint: pair.materialStyle ?? "font-family:KaTeX_Math",
        paintFingerprint: pair.materialPaintFingerprint ?? "glyph:x"
      }),
      handoffObservation({
        id: `${pair.id}.native`,
        side: "native-target",
        paintAtomId: `paint.${pair.id}`,
        semanticEntityId: `entity.${pair.id}`,
        rect: pair.nativeRect,
        baselineY: pair.nativeBaselineY ?? 42,
        styleFingerprint: pair.nativeStyle ?? "font-family:KaTeX_Math",
        paintFingerprint: pair.nativePaintFingerprint ?? "glyph:x"
      })
    ]),
    fontRevision: 2,
    viewportKey: "wide"
  });
}

test("handoff telemetry is immutable renderer-session evidence", () => {
  const telemetry = createKpNativeKatexHandoffTelemetry({
    stage,
    progress: 0.999,
    observations: [
      handoffObservation(),
      handoffObservation({
        id: "handoff.native.rule",
        side: "native-target",
        paintAtomId: "target.paint.rule.1",
        paintKind: "rule",
        baselineY: null,
        paintFingerprint: "rule",
        ruleGeometry: {
          axis: "horizontal",
          left: 8,
          top: 39,
          width: 32,
          thickness: 1
        }
      })
    ],
    fontRevision: 2,
    viewportKey: "wide:1040x360@font-2"
  });

  assert.equal(telemetry.lifecycle, "renderer-session");
  assert.equal(telemetry.progress, 0.999);
  assert.equal(Object.isFrozen(telemetry.observations), true);
  assert.equal(Object.isFrozen(telemetry.observations[0]?.rect), true);
  assert.equal(
    Object.isFrozen(telemetry.observations[1]?.ruleGeometry),
    true
  );
  assert.strictEqual(telemetry.observations[0]?.element, sourceElement);
});

test("typography handoff law separates exact style from bounded transforms", () => {
  const telemetry = alignmentTelemetry({
    pairs: [{
      id: "pair.exact",
      materialRect: { left: 10, top: 20, width: 12, height: 24 },
      nativeRect: { left: 10.08, top: 20.04, width: 12.02, height: 24.01 },
      materialBaselineY: 40,
      nativeBaselineY: 40.04
    }, {
      id: "pair.transform",
      materialRect: { left: 24, top: 20, width: 12, height: 24 },
      nativeRect: { left: 23.96, top: 20, width: 11.98, height: 23.96 },
      materialBaselineY: 40,
      nativeBaselineY: 41.47,
      materialStyle:
        "font-family:KaTeX_Main|font-size:65.824px|font-style:normal|font-weight:400|color:rgb(23, 36, 31)|line-height:78.9888px",
      nativeStyle:
        "font-family:KaTeX_Main|font-size:46.0768px|font-style:normal|font-weight:400|color:rgb(23, 36, 31)|line-height:55.2922px"
    }]
  });
  const law = evaluateKpNativeKatexTypographyHandoffLaw({
    telemetry,
    tolerancePx: 0.05,
    maximumTranslationPx: 2,
    maximumScaleRatio: 1.1
  });

  assert.equal(law.status, "continuous");
  assert.deepEqual(
    law.assessments.map(({ id, compatibility, settlement }) => ({
      id,
      compatibility,
      settlement
    })),
    [{
      id: "pair.exact",
      compatibility: "style-compatible",
      settlement: "continuous"
    }, {
      id: "pair.transform",
      compatibility: "transform-compatible",
      settlement: "continuous"
    }]
  );
  assert.equal(Object.isFrozen(law), true);
  assert.equal(Object.isFrozen(law.assessments), true);
});

test("typography handoff metrics are reverse symmetric", () => {
  const telemetry = alignmentTelemetry({
    pairs: [{
      id: "pair.transform",
      materialRect: { left: 10, top: 20, width: 12, height: 24 },
      nativeRect: { left: 10.25, top: 19.75, width: 9, height: 18 },
      materialBaselineY: 40,
      nativeBaselineY: 39.75,
      materialStyle: "font-size:16px|line-height:20px|color:black",
      nativeStyle: "font-size:12px|line-height:15px|color:black"
    }]
  });
  const [from, to] = telemetry.observations;
  const assess = (
    first: KpNativeKatexHandoffPaintObservation,
    second: KpNativeKatexHandoffPaintObservation
  ) => assessKpNativeKatexTypographyHandoff({
    from: first,
    to: second,
    tolerancePx: 0.05,
    maximumTranslationPx: 1,
    maximumScaleRatio: 1.5
  });
  const forward = assess(from!, to!);
  const reverse = assess(to!, from!);

  assert.equal(forward.compatibility, "transform-compatible");
  assert.equal(reverse.compatibility, forward.compatibility);
  assert.equal(reverse.translateX, -forward.translateX);
  assert.equal(reverse.translateY, -forward.translateY);
  assert.equal(reverse.scaleX, 1 / forward.scaleX);
  assert.equal(reverse.scaleY, 1 / forward.scaleY);
  assert.equal(reverse.stretchRatio, forward.stretchRatio);
  assert.deepEqual(reverse.reasons, forward.reasons);
});

test("unsupported typography settles at the exact native checkpoint", () => {
  const telemetry = alignmentTelemetry({
    pairs: [{
      id: "pair.style",
      materialRect: { left: 10, top: 20, width: 12, height: 24 },
      nativeRect: { left: 10.25, top: 20, width: 12, height: 24 },
      materialStyle: "font-size:16px|color:black",
      nativeStyle: "font-size:16px|color:red"
    }, {
      id: "pair.bounds",
      materialRect: { left: 20, top: 20, width: 12, height: 24 },
      nativeRect: { left: 23, top: 20, width: 6, height: 12 }
    }]
  });
  const law = evaluateKpNativeKatexTypographyHandoffLaw({
    telemetry,
    tolerancePx: 0.05,
    maximumTranslationPx: 1,
    maximumScaleRatio: 1.5
  });

  assert.equal(law.status, "native-checkpoint");
  assert.deepEqual(law.unsupportedIds, ["pair.bounds", "pair.style"]);
  assert.deepEqual(law.assessments.map(({ settlement }) => settlement), [
    "native-checkpoint",
    "native-checkpoint"
  ]);
  assert.deepEqual(law.assessments[0]?.reasons, [
    "scale-exceeds-bound",
    "translation-exceeds-bound"
  ]);
  assert.deepEqual(law.assessments[1]?.reasons, ["style-mismatch"]);
});

test("typography handoff law rejects invalid generic bounds", () => {
  const [from, to] = alignmentTelemetry({
    pairs: [{
      id: "pair.x",
      materialRect: { left: 10, top: 20, width: 12, height: 24 },
      nativeRect: { left: 10, top: 20, width: 12, height: 24 }
    }]
  }).observations;
  assert.throws(
    () => assessKpNativeKatexTypographyHandoff({
      from: from!,
      to: to!,
      tolerancePx: 0.05,
      maximumTranslationPx: 1,
      maximumScaleRatio: 0.99
    }),
    /scale ratio must be finite and at least one/
  );
});

test("model comparison selects exact target paint over live style interpolation", () => {
  const telemetry = alignmentTelemetry({
    pairs: [{
      id: "pair.transform",
      materialRect: { left: 24, top: 20, width: 12, height: 24 },
      nativeRect: { left: 23.96, top: 20, width: 11.98, height: 23.96 },
      materialBaselineY: 40,
      nativeBaselineY: 41.47,
      materialStyle:
        "font-family:KaTeX_Main|font-size:65.824px|line-height:78.9888px|color:black",
      nativeStyle:
        "font-family:KaTeX_Main|font-size:46.0768px|line-height:55.2922px|color:black"
    }]
  });
  const comparison = compareKpNativeKatexTypographyHandoffModels({
    telemetry,
    tolerancePx: 0.1,
    maximumTranslationPx: 2,
    maximumScaleRatio: 1.1
  });

  assert.equal(comparison.selectedModel, "target-style-reverse-flip");
  assert.deepEqual(comparison.candidates.map((candidate) => ({
    id: candidate.id,
    status: candidate.status,
    endpointGuarantee: candidate.endpointGuarantee,
    maximumEndpointResidualPx: candidate.maximumEndpointResidualPx,
    requiresLiveStyleInterpolation:
      candidate.requiresLiveStyleInterpolation,
    nativeMutationCount: candidate.nativeMutationCount
  })), [{
    id: "target-style-reverse-flip",
    status: "eligible",
    endpointGuarantee: "exact",
    maximumEndpointResidualPx: 0,
    requiresLiveStyleInterpolation: false,
    nativeMutationCount: 0
  }, {
    id: "dual-endpoint-interpolation",
    status: "eligible",
    endpointGuarantee: "bounded",
    maximumEndpointResidualPx: 0.1,
    requiresLiveStyleInterpolation: true,
    nativeMutationCount: 0
  }, {
    id: "native-checkpoint-settlement",
    status: "eligible",
    endpointGuarantee: "exact",
    maximumEndpointResidualPx: 0,
    requiresLiveStyleInterpolation: false,
    nativeMutationCount: 0
  }]);
  assert.ok(
    Math.abs(
      comparison.candidates[0]!.maximumPreSettlementResidualPx - 1.47
    ) < 1e-12
  );
  assert.equal(Object.isFrozen(comparison.candidates), true);
});

test("model comparison selects checkpoint settlement for unsupported paint", () => {
  const comparison = compareKpNativeKatexTypographyHandoffModels({
    telemetry: alignmentTelemetry({
      pairs: [{
        id: "pair.incompatible",
        materialRect: { left: 10, top: 20, width: 12, height: 24 },
        nativeRect: { left: 10, top: 20, width: 12, height: 24 },
        materialStyle: "font-size:16px|color:black",
        nativeStyle: "font-size:16px|color:red"
      }]
    }),
    tolerancePx: 0.1,
    maximumTranslationPx: 2,
    maximumScaleRatio: 1.1
  });

  assert.equal(comparison.selectedModel, "native-checkpoint-settlement");
  assert.deepEqual(
    comparison.candidates.map(({ id, status }) => ({ id, status })),
    [{
      id: "target-style-reverse-flip",
      status: "ineligible"
    }, {
      id: "dual-endpoint-interpolation",
      status: "ineligible"
    }, {
      id: "native-checkpoint-settlement",
      status: "eligible"
    }]
  );
});

test("model comparison is permutation deterministic and bounded", () => {
  const pairs = [{
    id: "pair.b",
    materialRect: { left: 20, top: 20, width: 12, height: 24 },
    nativeRect: { left: 20.25, top: 19.75, width: 12, height: 24 }
  }, {
    id: "pair.a",
    materialRect: { left: 10, top: 20, width: 12, height: 24 },
    nativeRect: { left: 10.25, top: 19.75, width: 12, height: 24 }
  }] as const;
  const compare = (
    orderedPairs: Parameters<typeof alignmentTelemetry>[0]["pairs"]
  ) => compareKpNativeKatexTypographyHandoffModels({
    telemetry: alignmentTelemetry({ pairs: orderedPairs }),
    tolerancePx: 0.1,
    maximumTranslationPx: 2,
    maximumScaleRatio: 1.1
  });
  const forward = compare(pairs);
  const permuted = compare([...pairs].reverse());
  assert.deepEqual(permuted, forward);

  const startedAt = performance.now();
  for (let index = 0; index < 5_000; index += 1) compare(pairs);
  assert.ok(
    performance.now() - startedAt < 2_000,
    "5,000 pure model comparisons should remain a bounded microcheck"
  );
});

test("selected style plan is immutable measured renderer-session state", () => {
  const plan = compileKpNativeKatexTypographyStylePlan({
    telemetry: alignmentTelemetry({
      pairs: [{
        id: "pair.transform",
        materialRect: { left: 24, top: 20, width: 12, height: 24 },
        nativeRect: { left: 23.96, top: 20, width: 11.98, height: 23.96 },
        materialBaselineY: 40,
        nativeBaselineY: 41.47,
        materialStyle: "font-size:65.824px|line-height:78.9888px|color:black",
        nativeStyle: "font-size:46.0768px|line-height:55.2922px|color:black"
      }]
    }),
    correlations: [{
      kind: "native-katex-handoff-correlation",
      lifecycle: "renderer-session",
      id: "pair.transform",
      materialOwnerId: "owner.transform",
      trackId: "track.transform",
      componentId: "component.transform",
      atomLifecycle: "persist",
      visualAtomId: "paint.pair.transform",
      sourceAtomId: "source.transform",
      targetAtomId: "paint.pair.transform",
      semanticEntityId: "entity.transform",
      disposition: "target-bound"
    }],
    tolerancePx: 0.1,
    maximumTranslationPx: 2,
    maximumScaleRatio: 1.1
  });

  assert.equal(plan.lifecycle, "renderer-session");
  assert.equal(plan.model, "target-style-reverse-flip");
  assert.deepEqual(plan.entries[0], {
    id: "pair.transform",
    materialOwnerId: "owner.transform",
    componentId: "component.transform",
    atomLifecycle: "persist",
    targetPaintAtomId: "paint.pair.transform",
    paintKind: "glyph",
    model: "target-style-reverse-flip",
    targetRect: { left: 23.96, top: 20, width: 11.98, height: 23.96 },
    inverseTranslateX: 0.03999999999999915,
    inverseTranslateY: -1.4699999999999989,
    inverseScaleX: 12 / 11.98,
    inverseScaleY: 24 / 23.96,
    targetStyleFingerprint:
      "font-size:46.0768px|line-height:55.2922px|color:black"
  });
  assert.equal(Object.isFrozen(plan), true);
  assert.equal(Object.isFrozen(plan.entries), true);
  assert.equal(Object.isFrozen(plan.entries[0]?.targetRect), true);
  assert.equal("element" in plan.entries[0]!, false);
});

test("unsupported style plan compiles only exact checkpoint settlement", () => {
  const plan = compileKpNativeKatexTypographyStylePlan({
    telemetry: alignmentTelemetry({
      pairs: [{
        id: "pair.incompatible",
        materialRect: { left: 10, top: 20, width: 12, height: 24 },
        nativeRect: { left: 14, top: 20, width: 5, height: 24 },
        materialStyle: "font-size:16px|color:black",
        nativeStyle: "font-size:16px|color:red"
      }]
    }),
    correlations: [{
      kind: "native-katex-handoff-correlation",
      lifecycle: "renderer-session",
      id: "pair.incompatible",
      materialOwnerId: "owner.incompatible",
      trackId: "track.incompatible",
      componentId: "component.incompatible",
      atomLifecycle: "unsupported",
      visualAtomId: "paint.pair.incompatible",
      targetAtomId: "paint.pair.incompatible",
      semanticEntityId: "entity.incompatible",
      disposition: "target-bound"
    }],
    tolerancePx: 0.1,
    maximumTranslationPx: 2,
    maximumScaleRatio: 1.1
  });

  assert.equal(plan.model, "native-checkpoint-settlement");
  assert.deepEqual({
    model: plan.entries[0]?.model,
    inverseTranslateX: plan.entries[0]?.inverseTranslateX,
    inverseTranslateY: plan.entries[0]?.inverseTranslateY,
    inverseScaleX: plan.entries[0]?.inverseScaleX,
    inverseScaleY: plan.entries[0]?.inverseScaleY
  }, {
    model: "native-checkpoint-settlement",
    inverseTranslateX: 0,
    inverseTranslateY: 0,
    inverseScaleX: 1,
    inverseScaleY: 1
  });
});

test("style plan requires total correlation-to-target paint coverage", () => {
  const telemetry = alignmentTelemetry({
    pairs: [{
      id: "pair.x",
      materialRect: { left: 10, top: 20, width: 12, height: 24 },
      nativeRect: { left: 10, top: 20, width: 12, height: 24 }
    }]
  });
  const compile = (targetAtomId: string, id = "pair.x") =>
    compileKpNativeKatexTypographyStylePlan({
      telemetry,
      correlations: [{
        kind: "native-katex-handoff-correlation",
        lifecycle: "renderer-session",
        id,
        materialOwnerId: "owner.x",
        trackId: "track.x",
        componentId: "component.x",
        atomLifecycle: "persist",
        visualAtomId: "paint.pair.x",
        targetAtomId,
        semanticEntityId: "entity.x",
        disposition: "target-bound"
      }],
      tolerancePx: 0.1,
      maximumTranslationPx: 2,
      maximumScaleRatio: 1.1
    });

  assert.throws(() => compile("paint.pair.x", "pair.missing"), /cannot find/);
  assert.throws(() => compile("paint.wrong"), /no matching target paint atom/);
});

test("realization disposition preserves every structural paint kind", () => {
  const base = {
    id: "entry.paint",
    materialOwnerId: "owner.paint",
    componentId: "component.paint",
    atomLifecycle: "persist" as const,
    targetPaintAtomId: "target.paint",
    paintKind: "glyph" as const,
    model: "target-style-reverse-flip" as const,
    targetRect: { left: 10, top: 20, width: 12, height: 24 },
    inverseTranslateX: 0,
    inverseTranslateY: 0,
    inverseScaleX: 1,
    inverseScaleY: 1,
    targetStyleFingerprint: "style"
  };
  assert.deepEqual(
    (["glyph", "rule", "path", "delimiter", "accent"] as const).map(
      (paintKind) => selectKpNativeKatexTypographyRealizationDisposition({
        ...base,
        paintKind
      })
    ),
    [
      "html-clone",
      "preserve-structural-paint",
      "preserve-structural-paint",
      "preserve-structural-paint",
      "preserve-structural-paint"
    ]
  );
  assert.equal(
    selectKpNativeKatexTypographyRealizationDisposition({
      ...base,
      model: "native-checkpoint-settlement"
    }),
    "native-checkpoint"
  );
});

test("style sampling is finite, reversible, and settles with zero velocity", () => {
  const plan = {
    kind: "native-katex-typography-style-plan" as const,
    lifecycle: "renderer-session" as const,
    model: "target-style-reverse-flip" as const,
    entries: [{
      id: "entry.paint",
      materialOwnerId: "owner.paint",
      componentId: "component.paint",
      atomLifecycle: "persist" as const,
      targetPaintAtomId: "target.paint",
      paintKind: "glyph" as const,
      model: "target-style-reverse-flip" as const,
      targetRect: { left: 11, top: 19, width: 10, height: 20 },
      inverseTranslateX: -1,
      inverseTranslateY: 1.5,
      inverseScaleX: 1.2,
      inverseScaleY: 1.2,
      targetStyleFingerprint: "style"
    }]
  };
  const progresses = [0, 0.25, 0.5, 0.75, 1];
  const forward = progresses.map((progress) =>
    sampleKpNativeKatexTypographyStylePlan(plan, progress)
  );
  const reverse = [...progresses].reverse().map((progress) =>
    sampleKpNativeKatexTypographyStylePlan(plan, progress)
  );

  assert.deepEqual(reverse, [...forward].reverse());
  assert.deepEqual(forward[0]?.entries[0], {
    id: "entry.paint",
    translateX: -1,
    translateY: 1.5,
    scaleX: 1.2,
    scaleY: 1.2
  });
  assert.deepEqual(forward.at(-1)?.entries[0], {
    id: "entry.paint",
    translateX: 0,
    translateY: 0,
    scaleX: 1,
    scaleY: 1
  });
  assert.equal(forward.every((frame) =>
    Object.values(frame.entries[0]!).every((value) =>
      typeof value === "string" || Number.isFinite(value)
    ) &&
    !("opacity" in frame.entries[0]!)
  ), true);
  const at = (progress: number) =>
    sampleKpNativeKatexTypographyStylePlan(plan, progress)
      .entries[0]!.translateY;
  assert.ok(Math.abs(at(1) - at(0.999)) < Math.abs(at(0.999) - at(0.998)));
  assert.equal(sampleKpNativeKatexTypographyStylePlan(plan, -1).progress, 0);
  assert.equal(sampleKpNativeKatexTypographyStylePlan(plan, 2).progress, 1);
  assert.throws(
    () => sampleKpNativeKatexTypographyStylePlan(plan, Number.NaN),
    /style progress must be finite/
  );
});

test("style sampling can follow the whole generic scene transit", () => {
  const plan = {
    kind: "native-katex-typography-style-plan" as const,
    lifecycle: "renderer-session" as const,
    model: "target-style-reverse-flip" as const,
    entries: [{
      id: "entry.paint",
      materialOwnerId: "native-scene-owner.track.paint",
      componentId: "component.paint",
      atomLifecycle: "persist" as const,
      targetPaintAtomId: "target.paint",
      paintKind: "glyph" as const,
      model: "target-style-reverse-flip" as const,
      targetRect: { left: 11, top: 19, width: 10, height: 20 },
      inverseTranslateX: -1,
      inverseTranslateY: 1,
      inverseScaleX: 1.2,
      inverseScaleY: 1.2,
      targetStyleFingerprint: "style"
    }]
  };
  const sceneFrames = [{
    trackId: "track.paint",
    componentId: "component.paint",
    lifecycle: "persist" as const,
    visualAtomId: "source.paint",
    paintKind: "glyph" as const,
    sizingMode: "rect" as const,
    rect: { left: 10, top: 20, width: 12, height: 24 },
    opacity: 1
  }];

  assert.deepEqual(
    sampleKpNativeKatexTypographyStylePlan(plan, 0.25, sceneFrames)
      .entries[0],
    {
      id: "entry.paint",
      translateX: -1,
      translateY: 1,
      scaleX: 1.2,
      scaleY: 1.2
    }
  );
  assert.throws(
    () => sampleKpNativeKatexTypographyStylePlan(plan, 0.25, []),
    /scene frame/
  );
});

test("glyph paint frames preserve contact with uniform font scaling", () => {
  const plan = {
    kind: "native-katex-typography-style-plan" as const,
    lifecycle: "renderer-session" as const,
    model: "target-style-reverse-flip" as const,
    entries: [{
      id: "entry.paint",
      materialOwnerId: "native-scene-owner.track.paint",
      componentId: "component.paint",
      atomLifecycle: "persist" as const,
      targetPaintAtomId: "target.paint",
      paintKind: "glyph" as const,
      model: "target-style-reverse-flip" as const,
      targetRect: { left: 30, top: 10, width: 6, height: 12 },
      glyphPaintFrame: {
        sourceLeft: 10,
        sourceTop: 20,
        sourceInsetX: 1,
        sourceInsetY: 2,
        targetInsetX: 0.5,
        targetInsetY: 1,
        sourceScale: 2
      },
      inverseTranslateX: -20,
      inverseTranslateY: 10,
      inverseScaleX: 2,
      inverseScaleY: 2,
      targetStyleFingerprint: "style"
    }]
  };
  const sourceFrame = [{
    trackId: "track.paint",
    componentId: "component.paint",
    lifecycle: "persist" as const,
    visualAtomId: "source.paint",
    paintKind: "glyph" as const,
    sizingMode: "rect" as const,
    rect: { left: 10, top: 20, width: 12, height: 24 },
    opacity: 1
  }];
  const targetFrame = [{
    ...sourceFrame[0]!,
    rect: { left: 30, top: 10, width: 6, height: 12 }
  }];

  assert.deepEqual(
    sampleKpNativeKatexTypographyStylePlan(plan, 0, sourceFrame).entries[0],
    {
      id: "entry.paint",
      translateX: -20,
      translateY: 10,
      scaleX: 2,
      scaleY: 2
    }
  );
  assert.deepEqual(
    sampleKpNativeKatexTypographyStylePlan(plan, 1, targetFrame).entries[0],
    {
      id: "entry.paint",
      translateX: 0,
      translateY: 0,
      scaleX: 1,
      scaleY: 1
    }
  );
});

test("handoff telemetry rejects invalid geometry and document boundaries", () => {
  const create = (
    observation: KpNativeKatexHandoffPaintObservation,
    progress = 0.999
  ) => createKpNativeKatexHandoffTelemetry({
    stage,
    progress,
    observations: [observation],
    fontRevision: 2,
    viewportKey: "wide"
  });

  assert.throws(
    () => create(handoffObservation(), 1.1),
    /between zero and one/
  );
  assert.throws(
    () => create(handoffObservation({ baselineY: Number.NaN })),
    /finite baseline/
  );
  assert.throws(
    () => create(handoffObservation({ opacity: 1.1 })),
    /bounded opacity/
  );
  assert.throws(
    () => create(handoffObservation({
      element: { ownerDocument: {} } as HTMLElement
    })),
    /another document/
  );
  assert.throws(
    () => create(handoffObservation({
      paintKind: "rule",
      baselineY: null
    })),
    /requires rule geometry/
  );
  assert.throws(
    () => create(handoffObservation({
      ruleGeometry: {
        axis: "horizontal",
        left: 0,
        top: 0,
        width: 12,
        thickness: 1
      }
    })),
    /cannot carry rule geometry/
  );
});

test("rendered scene observations remain explicit renderer-session state", () => {
  const scene = createKpNativeKatexRenderedSceneObservation({
    endpoint: "source",
    stage,
    root,
    atoms: [atom()],
    groups: [{
      id: "group.source",
      semanticEntityId: "entity.expression",
      atomIds: ["atom.source.x"],
      rect: { left: 10, top: 20, width: 12, height: 24 }
    }],
    fontRevision: 2,
    viewportKey: "wide:1040x360@font-2"
  });

  assert.equal(scene.lifecycle, "renderer-session");
  assert.strictEqual(scene.atoms[0]?.sourceElement, sourceElement);
  assert.equal(Object.isFrozen(scene.atoms[0]?.rect), true);
  assert.equal(Object.isFrozen(scene.groups[0]?.atomIds), true);
});

test("rendered scenes reject duplicate, unowned, and cross-document atoms", () => {
  const base = {
    endpoint: "source" as const,
    stage,
    root,
    groups: [{
      id: "group.source",
      semanticEntityId: "entity.expression",
      atomIds: ["atom.source.x"],
      rect: { left: 10, top: 20, width: 12, height: 24 }
    }],
    fontRevision: 2,
    viewportKey: "wide"
  };
  assert.throws(
    () => createKpNativeKatexRenderedSceneObservation({
      ...base,
      atoms: [atom(), atom()]
    }),
    /duplicated/
  );
  assert.throws(
    () => createKpNativeKatexRenderedSceneObservation({
      ...base,
      atoms: [atom("atom.source.x", "group.missing")]
    }),
    /no presentation group/
  );
  assert.throws(
    () => createKpNativeKatexRenderedSceneObservation({
      ...base,
      atoms: [{
        ...atom(),
        sourceElement: { ownerDocument: {} } as HTMLElement
      }]
    }),
    /one renderer document/
  );
});

test("renderer-session scene state is absent from durable animation artifacts", async () => {
  const source = await import("../src/animation/linear-solve-adapter.ts");
  const assetModule = await import("../src/animation/asset.ts");
  const forged = {
    ...source.createLinearSolveAnimationAsset(),
    renderedScene: { stage, root, atoms: [atom()] },
    paintAtoms: [atom()],
    presentationGroups: [{ domHandle: root }],
    sceneTracks: [{ keyframes: [] }],
    typographyStylePlan: {
      kind: "native-katex-typography-style-plan",
      lifecycle: "renderer-session",
      entries: []
    },
    handoffTelemetry: createKpNativeKatexHandoffTelemetry({
      stage,
      progress: 0.999,
      observations: [handoffObservation()],
      fontRevision: 2,
      viewportKey: "wide"
    })
  } as unknown as Parameters<typeof assetModule.createKpAnimationAsset>[0];
  const asset = assetModule.createKpAnimationAsset(forged);
  const serialized = JSON.stringify(asset);

  for (const field of [
    "renderedScene",
    "paintAtoms",
    "presentationGroups",
    "sceneTracks",
    "typographyStylePlan",
    "handoffTelemetry"
  ]) {
    assert.equal(field in asset, false);
    assert.equal(serialized.includes(field), false);
  }
});

test("scene reconciliation requires exactly one disposition per endpoint atom", () => {
  const source = createScene("source", ["source.x", "source.plus"]);
  const target = createScene("target", ["target.x"]);
  const reconciliation = createKpNativeKatexSceneReconciliation({
    source,
    target,
    dispositions: [{
      id: "persist.x",
      lifecycle: "persist",
      sourceAtomIds: ["source.x"],
      targetAtomIds: ["target.x"],
      semanticEntityIds: ["symbol.x"]
    }, {
      id: "eliminate.plus",
      lifecycle: "eliminate",
      sourceAtomIds: ["source.plus"],
      targetAtomIds: [],
      semanticEntityIds: ["operator.plus"]
    }]
  });

  assert.equal(reconciliation.dispositions.length, 2);
  assert.throws(
    () => createKpNativeKatexSceneReconciliation({
      source,
      target,
      dispositions: [{
        id: "persist.x",
        lifecycle: "persist",
        sourceAtomIds: ["source.x"],
        targetAtomIds: ["target.x"],
        semanticEntityIds: ["symbol.x"]
      }]
    }),
    /source atom source.plus has no disposition/
  );
  assert.throws(
    () => createKpNativeKatexSceneReconciliation({
      source,
      target,
      dispositions: [{
        id: "persist.x",
        lifecycle: "persist",
        sourceAtomIds: ["source.x"],
        targetAtomIds: ["target.x"],
        semanticEntityIds: ["symbol.x"]
      }, {
        id: "duplicate.x",
        lifecycle: "eliminate",
        sourceAtomIds: ["source.x", "source.plus"],
        targetAtomIds: [],
        semanticEntityIds: ["symbol.x", "operator.plus"]
      }]
    }),
    /multiple dispositions/
  );
});

test("scene reconciliation rejects invalid multiplicity and silent unsupported work", () => {
  const source = createScene("source", ["source.a", "source.b"]);
  const target = createScene("target", ["target.a"]);
  assert.throws(
    () => createKpNativeKatexSceneReconciliation({
      source,
      target,
      dispositions: [{
        id: "bad.merge",
        lifecycle: "merge",
        sourceAtomIds: ["source.a"],
        targetAtomIds: ["target.a"],
        semanticEntityIds: ["entity.a"]
      }, {
        id: "source.b",
        lifecycle: "eliminate",
        sourceAtomIds: ["source.b"],
        targetAtomIds: [],
        semanticEntityIds: ["entity.b"]
      }]
    }),
    /invalid merge arity/
  );
  assert.throws(
    () => createKpNativeKatexSceneReconciliation({
      source,
      target,
      dispositions: [{
        id: "unsupported",
        lifecycle: "unsupported",
        sourceAtomIds: ["source.a", "source.b"],
        targetAtomIds: ["target.a"],
        semanticEntityIds: ["entity.a"]
      }]
    }),
    /invalid unsupported arity/
  );
});

test("grouped scene matching is deterministic and semantic-constrained", () => {
  const source = createScene("source", ["source.x", "source.unrelated-x"]);
  const target = createScene("target", ["target.x", "target.other-x"]);
  const remap = (scene: ReturnType<typeof createScene>, entities: readonly string[]) =>
    createKpNativeKatexRenderedSceneObservation({
      ...scene,
      atoms: scene.atoms.map((paintAtom, index) => ({
        ...paintAtom,
        semanticEntityId: entities[index]!,
        visualKey: "glyph:x"
      }))
    });
  const result = reconcileKpNativeKatexScenes({
    source: remap(source, ["symbol.x", "source.unrelated"]),
    target: remap(target, ["symbol.x", "target.unrelated"])
  });

  assert.equal(result.dispositions.find(({ lifecycle }) =>
    lifecycle === "persist"
  )?.semanticEntityIds[0], "symbol.x");
  assert.equal(result.dispositions.filter(({ lifecycle }) =>
    lifecycle === "persist"
  ).length, 1);
  assert.equal(result.dispositions.filter(({ lifecycle }) =>
    lifecycle === "eliminate"
  ).length, 1);
  assert.equal(result.dispositions.filter(({ lifecycle }) =>
    lifecycle === "introduce"
  ).length, 1);
  assert.deepEqual(
    result.dispositions.map(({ id }) => id),
    reconcileKpNativeKatexScenes({
      source: remap(source, ["symbol.x", "source.unrelated"]),
      target: remap(target, ["symbol.x", "target.unrelated"])
    }).dispositions.map(({ id }) => id)
  );
});

test("explicit semantic relations compile generic merge multiplicity", () => {
  const source = createScene("source", ["source.a", "source.b"]);
  const target = createScene("target", ["target.result"]);
  const result = reconcileKpNativeKatexScenes({
    source,
    target,
    relations: [{
      id: "lineage.denominators",
      relation: "merge",
      sourceEntityIds: ["entity.a", "entity.b"],
      targetEntityIds: ["entity.result"]
    }]
  });

  assert.deepEqual(result.dispositions.map(({ lifecycle }) => lifecycle), ["merge"]);
  assert.deepEqual(result.dispositions[0]?.sourceAtomIds, ["source.a", "source.b"]);
  assert.deepEqual(result.dispositions[0]?.targetAtomIds, ["target.result"]);
});

test("canonical lineage projects and reverses through existing paint relations", () => {
  const relations = projectKpNativeKatexSemanticPaintRelations({
    groups: [{
      id: "lineage.base",
      kind: "one-to-one",
      sourceEntityIds: ["power.base"],
      targetEntityIds: ["radical.radicand"]
    }, {
      id: "lineage.copy",
      kind: "one-to-many",
      sourceEntityIds: ["source.shared"],
      targetEntityIds: ["target.left", "target.right"]
    }, {
      id: "lineage.absorb",
      kind: "removal",
      sourceEntityIds: ["power.numerator"],
      targetEntityIds: []
    }]
  });

  assert.deepEqual(relations, [{
    id: "paint.lineage.base",
    relation: "persist",
    sourceEntityIds: ["power.base"],
    targetEntityIds: ["radical.radicand"]
  }, {
    id: "paint.lineage.copy",
    relation: "split",
    sourceEntityIds: ["source.shared"],
    targetEntityIds: ["target.left", "target.right"]
  }]);
  assert.deepEqual(reverseKpNativeKatexSemanticPaintRelations(relations), [{
    id: "reverse.paint.lineage.base",
    relation: "persist",
    sourceEntityIds: ["radical.radicand"],
    targetEntityIds: ["power.base"]
  }, {
    id: "reverse.paint.lineage.copy",
    relation: "merge",
    sourceEntityIds: ["target.left", "target.right"],
    targetEntityIds: ["source.shared"]
  }]);
  assert.throws(
    () => projectKpNativeKatexSemanticPaintRelations({
      groups: [{
        id: "duplicate",
        kind: "removal",
        sourceEntityIds: ["a"],
        targetEntityIds: []
      }, {
        id: "duplicate",
        kind: "introduction",
        sourceEntityIds: [],
        targetEntityIds: ["b"]
      }]
    }),
    /unique and non-empty/
  );
});

test("generic split reconciliation is total, permutation-stable, and reversible", () => {
  const source = createScene("source", ["source.denominator"]);
  const target = createScene("target", [
    "target.denominator.left",
    "target.denominator.right"
  ]);
  const reversedTarget = createKpNativeKatexRenderedSceneObservation({
    ...target,
    atoms: [...target.atoms].reverse(),
    groups: target.groups.map((group) => ({
      ...group,
      atomIds: [...group.atomIds].reverse()
    }))
  });
  const relations = [{
    id: "lineage.structural-copy",
    relation: "split" as const,
    sourceEntityIds: ["entity.denominator"],
    targetEntityIds: [
      "entity.denominator.left",
      "entity.denominator.right"
    ]
  }];
  const compile = (candidateTarget: typeof target) => {
    const reconciliation = reconcileKpNativeKatexScenes({
      source,
      target: candidateTarget,
      relations
    });
    const tracks = compileKpNativeKatexSceneTracks(
      compileKpNativeKatexHierarchicalScenePlan(reconciliation)
    );
    return {
      reconciliation,
      tracks,
      correlations: correlateKpNativeKatexSceneHandoff({
        reconciliation,
        tracks
      })
    };
  };
  const direct = compile(target);
  const permuted = compile(reversedTarget);

  assert.deepEqual(direct.reconciliation.dispositions, [
    {
      id: "lineage.structural-copy.0",
      lifecycle: "split",
      sourceAtomIds: ["source.denominator"],
      targetAtomIds: [
        "target.denominator.left",
        "target.denominator.right"
      ],
      semanticEntityIds: [
        "entity.denominator",
        "entity.denominator.left",
        "entity.denominator.right"
      ]
    }
  ]);
  assert.deepEqual(
    direct.reconciliation.dispositions,
    permuted.reconciliation.dispositions
  );
  assert.deepEqual(
    direct.correlations.map(({ targetAtomId }) => targetAtomId),
    ["target.denominator.left", "target.denominator.right"]
  );
  assert.equal(
    new Set(direct.correlations.map(({ materialOwnerId }) =>
      materialOwnerId
    )).size,
    2
  );
  const progresses = [0, 0.25, 0.5, 0.75, 1];
  const forward = progresses.map((progress) =>
    sampleKpNativeKatexSceneTracks(direct.tracks, progress)
  );
  const reverse = [...progresses].reverse().map((progress) =>
    sampleKpNativeKatexSceneTracks(direct.tracks, progress)
  ).reverse();
  assert.deepEqual(forward, reverse);
  assert.deepEqual(
    forward[0]!.map(({ rect }) => rect),
    [source.atoms[0]!.rect, source.atoms[0]!.rect]
  );
  assert.deepEqual(
    forward.at(-1)!.map(({ rect }) => rect),
    target.atoms.map(({ rect }) => rect)
  );
  const missingLineage = reconcileKpNativeKatexScenes({
    source,
    target,
    relations: [{
      ...relations[0]!,
      targetEntityIds: ["entity.denominator.missing"]
    }]
  });
  assert.deepEqual(
    missingLineage.dispositions.map(({ lifecycle }) => lifecycle).sort(),
    ["eliminate", "introduce", "introduce"]
  );
  assert.equal(
    missingLineage.dispositions.some(({ lifecycle }) =>
      lifecycle === "split"
    ),
    false
  );
});

test("hierarchical scene plans separate component motion from child residuals", () => {
  const source = createScene("source", ["source.a", "source.b"]);
  const target = createScene("target", ["target.result"]);
  const reconciliation = reconcileKpNativeKatexScenes({
    source,
    target,
    relations: [{
      id: "lineage.merge",
      relation: "merge",
      sourceEntityIds: ["entity.a", "entity.b"],
      targetEntityIds: ["entity.result"]
    }]
  });
  const plan = compileKpNativeKatexHierarchicalScenePlan(reconciliation);
  const component = plan.components[0]!;

  assert.equal(component.lifecycle, "merge");
  assert.deepEqual(component.sourceBounds, {
    left: 0,
    top: 0,
    width: 30,
    height: 20
  });
  assert.deepEqual(component.targetBounds, {
    left: 0,
    top: 0,
    width: 10,
    height: 20
  });
  assert.deepEqual(
    component.atoms.filter(({ endpoint }) => endpoint === "source")
      .map(({ localRect }) => localRect.left),
    [0, 20]
  );
  assert.equal(
    plan.components.flatMap(({ atoms }) => atoms).length,
    source.atoms.length + target.atoms.length
  );
});

test("generic scene tracks sample exact finite endpoints and reverse identically", () => {
  const source = createScene("source", ["source.a", "source.b"]);
  const target = createScene("target", ["target.result"]);
  const reconciliation = reconcileKpNativeKatexScenes({
    source,
    target,
    relations: [{
      id: "lineage.merge",
      relation: "merge",
      sourceEntityIds: ["entity.a", "entity.b"],
      targetEntityIds: ["entity.result"]
    }]
  });
  const tracks = compileKpNativeKatexSceneTracks(
    compileKpNativeKatexHierarchicalScenePlan(reconciliation)
  );
  const start = sampleKpNativeKatexSceneTracks(tracks, 0);
  const middle = sampleKpNativeKatexSceneTracks(tracks, 0.5);
  const end = sampleKpNativeKatexSceneTracks(tracks, 1);

  assert.equal(tracks.length, 2);
  assert.equal(tracks.every(({ sizingMode }) => sizingMode === "rect"), true);
  assert.deepEqual(start.map(({ rect }) => rect), source.atoms.map(({ rect }) => rect));
  assert.deepEqual(end.map(({ rect }) => rect), [
    target.atoms[0]!.rect,
    target.atoms[0]!.rect
  ]);
  assert.deepEqual(start.map(({ opacity }) => opacity), [1, 1]);
  assert.deepEqual(end.map(({ opacity }) => opacity), [1, 0]);
  assert.equal(middle.every(({ rect, opacity }) =>
    Object.values(rect).every(Number.isFinite) && Number.isFinite(opacity)
  ), true);
  assert.deepEqual(
    sampleKpNativeKatexSceneTracks(tracks, 0.5),
    middle
  );
  assert.throws(
    () => sampleKpNativeKatexSceneTracks(tracks, Number.NaN),
    /progress must be finite/
  );
});

test("handoff correlation derives merge and split targets from reconciliation", () => {
  const mergeReconciliation = reconcileKpNativeKatexScenes({
    source: createScene("source", ["source.a", "source.b"]),
    target: createScene("target", ["target.result"]),
    relations: [{
      id: "lineage.merge",
      relation: "merge",
      sourceEntityIds: ["entity.a", "entity.b"],
      targetEntityIds: ["entity.result"]
    }]
  });
  const mergeTracks = compileKpNativeKatexSceneTracks(
    compileKpNativeKatexHierarchicalScenePlan(mergeReconciliation)
  );
  const merge = correlateKpNativeKatexSceneHandoff({
    reconciliation: mergeReconciliation,
    tracks: [...mergeTracks].reverse()
  });
  assert.equal(merge.length, 2);
  assert.deepEqual(
    merge.map(({ targetAtomId }) => targetAtomId),
    ["target.result", "target.result"]
  );
  assert.deepEqual(
    merge.map(({ trackId }) => trackId),
    [...mergeTracks].map(({ id }) => id).sort()
  );

  const splitReconciliation = reconcileKpNativeKatexScenes({
    source: createScene("source", ["source.origin"]),
    target: createScene("target", ["target.left", "target.right"]),
    relations: [{
      id: "lineage.split",
      relation: "split",
      sourceEntityIds: ["entity.origin"],
      targetEntityIds: ["entity.left", "entity.right"]
    }]
  });
  const splitTracks = compileKpNativeKatexSceneTracks(
    compileKpNativeKatexHierarchicalScenePlan(splitReconciliation)
  );
  const split = correlateKpNativeKatexSceneHandoff({
    reconciliation: splitReconciliation,
    tracks: splitTracks
  });
  assert.deepEqual(
    split.map(({ targetAtomId }) => targetAtomId),
    ["target.left", "target.right"]
  );
  assert.equal(split.every(({ disposition }) =>
    disposition === "target-bound"
  ), true);
});

test("handoff correlation rejects duplicate, missing, and unbacked targets", () => {
  const reconciliation = reconcileKpNativeKatexScenes({
    source: createScene("source", ["source.origin", "source.old"]),
    target: createScene("target", ["target.left", "target.right"]),
    relations: [{
      id: "lineage.split",
      relation: "split",
      sourceEntityIds: ["entity.origin"],
      targetEntityIds: ["entity.left", "entity.right"]
    }]
  });
  const tracks = compileKpNativeKatexSceneTracks(
    compileKpNativeKatexHierarchicalScenePlan(reconciliation)
  );
  const departing = correlateKpNativeKatexSceneHandoff({
    reconciliation,
    tracks
  }).find(({ atomLifecycle }) => atomLifecycle === "eliminate");
  assert.equal(departing?.disposition, "departing-without-native-target");
  assert.equal(departing?.targetAtomId, undefined);

  assert.throws(
    () => correlateKpNativeKatexSceneHandoff({
      reconciliation,
      tracks: [...tracks, tracks[0]!]
    }),
    /unique track IDs/
  );
  assert.throws(
    () => correlateKpNativeKatexSceneHandoff({
      reconciliation,
      tracks: tracks.filter(({ targetAtomId }) =>
        targetAtomId !== "target.right"
      )
    }),
    /target.right has no material handoff correlation/
  );
  assert.throws(
    () => correlateKpNativeKatexSceneHandoff({
      reconciliation,
      tracks: tracks.map((sceneTrack) =>
        sceneTrack.targetAtomId === "target.left"
          ? { ...sceneTrack, targetAtomId: "target.unknown" }
          : sceneTrack
      )
    }),
    /no lineage-backed native target atom/
  );
});

test("renderer session preserves compatible native material without atomizing", () => {
  const source = createScene("source", ["source.x"]);
  const target = createScene("target", ["target.x"]);
  const reconciliation = reconcileKpNativeKatexScenes({ source, target });
  const tracks = compileKpNativeKatexSceneTracks(
    compileKpNativeKatexHierarchicalScenePlan(reconciliation)
  );
  const materialLayer = {
    querySelectorAll: () => []
  } as unknown as HTMLElement;
  const continuityStage = {
    ownerDocument,
    querySelector: () => materialLayer,
    querySelectorAll: () => []
  } as unknown as HTMLElement;
  const sourceRoot = {
    ownerDocument,
    style: { opacity: "" }
  } as unknown as HTMLElement;
  const targetRoot = {
    ownerDocument,
    style: { opacity: "" }
  } as unknown as HTMLElement;
  const session = createKpNativeKatexRendererSession({
    stage: continuityStage,
    sourceRoot,
    targetRoot,
    reconciliation,
    tracks
  });

  assert.equal(session.mode, "native-continuity");
  const forward = [0, 0.25, 0.5, 0.75, 1].map(session.apply);
  const reverse = [1, 0.75, 0.5, 0.25, 0].map(session.apply);
  assert.deepEqual(reverse.map(({ frames }) => frames), [
    ...forward.map(({ frames }) => frames)
  ].reverse());
  assert.equal(forward.slice(0, -1).every((frame) =>
    frame.visualOwner === "source-native" &&
    frame.sourceNativeOpacity === 1 &&
    frame.materialSceneOpacity === 0 &&
    frame.targetNativeOpacity === 0
  ), true);
  assert.equal(forward.at(-1)?.visualOwner, "target-native");
  assert.equal(sourceRoot.style.opacity, "1");
  assert.equal(targetRoot.style.opacity, "0");
});

test("renderer session direct seeks and reverses without hidden clock state", () => {
  const source = createScene("source", ["source.a", "source.b"]);
  const target = createScene("target", ["target.result"]);
  const reconciliation = reconcileKpNativeKatexScenes({
    source,
    target,
    relations: [{
      id: "lineage.merge",
      relation: "merge",
      sourceEntityIds: ["entity.a", "entity.b"],
      targetEntityIds: ["entity.result"]
    }]
  });
  const tracks = compileKpNativeKatexSceneTracks(
    compileKpNativeKatexHierarchicalScenePlan(reconciliation)
  );
  const playback = createKpNativeKatexRendererSession({
    stage,
    sourceRoot: source.root,
    targetRoot: target.root,
    reconciliation,
    tracks
  });
  assert.equal(playback.kind, "native-katex-renderer-session");
  assert.equal(playback.lifecycle, "renderer-session");
  assert.equal(playback.mode, "atom-transit");
  const forward = [0, 0.25, 0.5, 0.75, 1].map(playback.sample);
  const reverse = [1, 0.75, 0.5, 0.25, 0].map(playback.sample);

  assert.equal(playback.lifecycle, "renderer-session");
  assert.equal(Object.isFrozen(playback), true);
  assert.equal(Object.isFrozen(playback.tracks), true);
  assert.deepEqual(reverse, [...forward].reverse());
  assert.deepEqual(playback.sample(0.5), playback.sample(0.5));
  assert.throws(
    () => createKpNativeKatexRendererSession({
      stage,
      sourceRoot: source.root,
      targetRoot: target.root,
      reconciliation,
      tracks: [{ ...tracks[0]!, visualAtomId: "unknown.atom" }]
    }),
    /unknown visual atom/
  );
});

test("one atom-transit session carries the complete structural cohort", () => {
  const paint = (
    scene: ReturnType<typeof createScene>,
    kinds: Readonly<Record<string, "glyph" | "rule" | "path">>
  ) => createKpNativeKatexRenderedSceneObservation({
    ...scene,
    atoms: scene.atoms.map((paintAtom) => ({
      ...paintAtom,
      paintKind: kinds[paintAtom.id] ?? "glyph",
      visualKey: `${kinds[paintAtom.id] ?? "glyph"}:shared`
    }))
  });
  const source = paint(createScene("source", [
    "source.persist",
    "source.merge.a",
    "source.merge.b",
    "source.split",
    "source.remove"
  ]), {
    "source.split": "rule",
    "source.remove": "path"
  });
  const target = paint(createScene("target", [
    "target.persist",
    "target.merge",
    "target.split.a",
    "target.split.b",
    "target.add"
  ]), {
    "target.split.a": "rule",
    "target.split.b": "rule",
    "target.add": "path"
  });
  const reconciliation = reconcileKpNativeKatexScenes({
    source,
    target,
    relations: [{
      id: "lineage.merge",
      relation: "merge",
      sourceEntityIds: ["entity.merge.a", "entity.merge.b"],
      targetEntityIds: ["entity.merge"]
    }, {
      id: "lineage.split",
      relation: "split",
      sourceEntityIds: ["entity.split"],
      targetEntityIds: ["entity.split.a", "entity.split.b"]
    }]
  });
  const tracks = compileKpNativeKatexSceneTracks(
    compileKpNativeKatexHierarchicalScenePlan(reconciliation)
  );
  const session = createKpNativeKatexRendererSession({
    stage,
    sourceRoot: source.root,
    targetRoot: target.root,
    reconciliation,
    tracks
  });
  const lifecycles = new Set(session.tracks.map(({ lifecycle }) => lifecycle));
  const paintKinds = new Set(session.tracks.map(({ paintKind }) => paintKind));
  const direct = session.sample(0.63);
  session.sample(0.14);

  assert.equal(session.mode, "atom-transit");
  assert.deepEqual([...lifecycles].sort(), [
    "eliminate",
    "introduce",
    "merge",
    "persist",
    "split"
  ]);
  assert.deepEqual([...paintKinds].sort(), ["glyph", "path", "rule"]);
  assert.deepEqual(session.sample(0.63), direct);
  assert.deepEqual(session.sample(0), tracks.map((track) => ({
    trackId: track.id,
    componentId: track.componentId,
    lifecycle: track.lifecycle,
    visualAtomId: track.visualAtomId,
    paintKind: track.paintKind,
    sizingMode: track.sizingMode,
    rect: track.startRect,
    opacity: track.startOpacity
  })));
});

test("structural rule tracks use generic continuous length interpolation", () => {
  const source = createScene("source", ["source.rule.a", "source.rule.b"]);
  const target = createScene("target", ["target.rule"]);
  const ruleScene = (scene: ReturnType<typeof createScene>) =>
    createKpNativeKatexRenderedSceneObservation({
      ...scene,
      atoms: scene.atoms.map((paintAtom) => ({
        ...paintAtom,
        paintKind: "rule" as const,
        visualKey: "rule"
      }))
    });
  const tracks = compileKpNativeKatexSceneTracks(
    compileKpNativeKatexHierarchicalScenePlan(reconcileKpNativeKatexScenes({
      source: ruleScene(source),
      target: ruleScene(target),
      relations: [{
        id: "lineage.rules",
        relation: "merge",
        sourceEntityIds: ["entity.rule.a", "entity.rule.b"],
        targetEntityIds: ["entity.rule"]
      }]
    }))
  );
  const middle = sampleKpNativeKatexSceneTracks(tracks, 0.5);

  assert.equal(tracks.length, 2);
  assert.equal(tracks.every(({ sizingMode }) =>
    sizingMode === "rule-length"
  ), true);
  assert.equal(middle.every(({ rect }, index) =>
    rect.width > Math.min(
      tracks[index]!.startRect.width,
      tracks[index]!.endRect.width
    ) - 0.001 &&
    rect.width < Math.max(
      tracks[index]!.startRect.width,
      tracks[index]!.endRect.width
    ) + 0.001
  ), true);
});

test("generic split bifurcates one structural rule into two exact tracks", () => {
  const asRuleScene = (
    scene: ReturnType<typeof createScene>,
    rects: readonly KpStageRelativeRect[]
  ) => createKpNativeKatexRenderedSceneObservation({
    ...scene,
    atoms: scene.atoms.map((paintAtom, index) => ({
      ...paintAtom,
      paintKind: "rule" as const,
      visualKey: "rule",
      rect: rects[index]!
    })),
    groups: scene.groups.map((group) => ({
      ...group,
      rect: {
        left: Math.min(...rects.map(({ left }) => left)),
        top: Math.min(...rects.map(({ top }) => top)),
        width: Math.max(...rects.map(({ left, width }) => left + width)) -
          Math.min(...rects.map(({ left }) => left)),
        height: Math.max(...rects.map(({ height }) => height))
      }
    }))
  });
  const source = asRuleScene(
    createScene("source", ["source.rule"]),
    [{ left: 20, top: 18, width: 60, height: 2 }]
  );
  const target = asRuleScene(
    createScene("target", ["target.rule.left", "target.rule.right"]),
    [
      { left: 0, top: 20, width: 25, height: 2 },
      { left: 70, top: 20, width: 35, height: 2 }
    ]
  );
  const reconciliation = reconcileKpNativeKatexScenes({
    source,
    target,
    relations: [{
      id: "lineage.structural-copy",
      relation: "split",
      sourceEntityIds: ["entity.rule"],
      targetEntityIds: ["entity.rule.left", "entity.rule.right"]
    }]
  });
  const tracks = compileKpNativeKatexSceneTracks(
    compileKpNativeKatexHierarchicalScenePlan(reconciliation)
  );
  const correlations = correlateKpNativeKatexSceneHandoff({
    reconciliation,
    tracks
  });
  const progresses = Array.from({ length: 101 }, (_, index) => index / 100);
  const forward = progresses.map((progress) =>
    sampleKpNativeKatexSceneTracks(tracks, progress)
  );
  const reverse = [...progresses].reverse().map((progress) =>
    sampleKpNativeKatexSceneTracks(tracks, progress)
  ).reverse();

  assert.equal(tracks.length, 2);
  assert.equal(tracks.every(({ lifecycle, paintKind, sizingMode }) =>
    lifecycle === "split" &&
    paintKind === "rule" &&
    sizingMode === "rule-length"
  ), true);
  assert.deepEqual(
    correlations.map(({ targetAtomId }) => targetAtomId),
    ["target.rule.left", "target.rule.right"]
  );
  assert.deepEqual(forward, reverse);
  assert.deepEqual(
    forward[0]!.map(({ rect }) => rect),
    [source.atoms[0]!.rect, source.atoms[0]!.rect]
  );
  assert.deepEqual(
    forward.at(-1)!.map(({ rect }) => rect),
    target.atoms.map(({ rect }) => rect)
  );
  assert.equal(forward.flat().every(({ rect, opacity }) =>
    Object.values(rect).every(Number.isFinite) &&
    Number.isFinite(opacity) &&
    rect.width > 0 &&
    rect.height > 0
  ), true);
});

test("generic lifecycle timing converges before merge loss and moves local departures", () => {
  const source = createScene("source", ["source.a", "source.b", "source.old"]);
  const target = createScene("target", ["target.result", "target.new"]);
  const reconciliation = reconcileKpNativeKatexScenes({
    source,
    target,
    relations: [{
      id: "lineage.merge",
      relation: "merge",
      sourceEntityIds: ["entity.a", "entity.b"],
      targetEntityIds: ["entity.result"]
    }]
  });
  const tracks = compileKpNativeKatexSceneTracks(
    compileKpNativeKatexHierarchicalScenePlan(reconciliation)
  );
  const mergeSecondary = tracks.find(({ lifecycle, endOpacity }) =>
    lifecycle === "merge" && endOpacity === 0
  )!;
  const departure = tracks.find(({ lifecycle }) =>
    lifecycle === "eliminate"
  )!;
  const introduction = tracks.find(({ lifecycle }) =>
    lifecycle === "introduce"
  )!;
  const early = sampleKpNativeKatexSceneTracks(tracks, 0.5);
  const late = sampleKpNativeKatexSceneTracks(tracks, 0.8);

  assert.equal(
    early.find(({ trackId }) => trackId === mergeSecondary.id)?.opacity,
    1
  );
  assert.ok(
    late.find(({ trackId }) => trackId === mergeSecondary.id)!.opacity < 1
  );
  assert.equal(departure.endRect.top, departure.startRect.top - 8);
  assert.equal(introduction.startRect.top, introduction.endRect.top + 8);
});

function createScene(
  endpoint: "source" | "target",
  ids: readonly string[]
) {
  return createKpNativeKatexRenderedSceneObservation({
    endpoint,
    stage,
    root,
    atoms: ids.map((id, index) => ({
      ...atom(id, `group.${endpoint}`),
      endpoint,
      semanticEntityId: id.replace(/^(source|target)\./, "entity."),
      rect: { left: index * 20, top: 0, width: 10, height: 20 }
    })),
    groups: [{
      id: `group.${endpoint}`,
      semanticEntityId: `entity.${endpoint}`,
      atomIds: ids,
      rect: { left: 0, top: 0, width: Math.max(10, ids.length * 20 - 10), height: 20 }
    }],
    fontRevision: 1,
    viewportKey: endpoint
  });
}
