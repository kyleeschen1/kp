import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpNativeKatexHandoffTelemetry,
  createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexHandoffPaintObservation,
  type KpNativeKatexPaintAtomObservation
} from "../src/rendering/native-katex-rendered-scene.ts";
import {
  calculateKpNativeKatexCommonHandoffAlignment,
  compileKpNativeKatexHierarchicalScenePlan,
  compileKpNativeKatexSceneTracks,
  correlateKpNativeKatexSceneHandoff,
  createKpNativeKatexScenePlayback,
  createKpNativeKatexSceneReconciliation,
  reconcileKpNativeKatexScenes,
  sampleKpNativeKatexSceneTracks
} from "../src/rendering/native-katex-scene-compositor.ts";

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

test("common handoff alignment accepts only one bounded consensus delta", () => {
  const telemetry = alignmentTelemetry({
    pairs: [{
      id: "pair.x",
      materialRect: { left: 10, top: 20, width: 12, height: 24 },
      nativeRect: { left: 10.5, top: 19.75, width: 12, height: 24 },
      materialBaselineY: 40,
      nativeBaselineY: 39.75
    }, {
      id: "pair.y",
      materialRect: { left: 30, top: 20, width: 12, height: 24 },
      nativeRect: { left: 30.52, top: 19.76, width: 12, height: 24 },
      materialBaselineY: 40,
      nativeBaselineY: 39.76
    }]
  });
  const alignment = calculateKpNativeKatexCommonHandoffAlignment({
    telemetry,
    tolerancePx: 0.05,
    maximumCorrectionPx: 1
  });

  assert.equal(alignment.kind, "native-katex-common-handoff-alignment");
  assert.equal(alignment.status, "correctable");
  assert.ok(Math.abs(alignment.translateX - 0.51) < 1e-12);
  assert.ok(Math.abs(alignment.translateY + 0.245) < 1e-12);
  assert.deepEqual(alignment.rejectedIds, []);
  assert.equal(Object.isFrozen(alignment), true);
  assert.equal(Object.isFrozen(alignment.rejectedIds), true);
});

test("common handoff alignment is inverse and suppresses sub-tolerance drift", () => {
  const forwardTelemetry = alignmentTelemetry({
    pairs: [{
      id: "pair.x",
      materialRect: { left: 10, top: 20, width: 12, height: 24 },
      nativeRect: { left: 10.5, top: 19.75, width: 12, height: 24 },
      materialBaselineY: 40,
      nativeBaselineY: 39.75
    }]
  });
  const reverseTelemetry = alignmentTelemetry({
    pairs: [{
      id: "pair.x",
      materialRect: { left: 10.5, top: 19.75, width: 12, height: 24 },
      nativeRect: { left: 10, top: 20, width: 12, height: 24 },
      materialBaselineY: 39.75,
      nativeBaselineY: 40
    }]
  });
  const calculate = (telemetry: ReturnType<typeof alignmentTelemetry>) =>
    calculateKpNativeKatexCommonHandoffAlignment({
      telemetry,
      tolerancePx: 0.05,
      maximumCorrectionPx: 1
    });
  const forward = calculate(forwardTelemetry);
  const reverse = calculate(reverseTelemetry);
  const aligned = calculateKpNativeKatexCommonHandoffAlignment({
    telemetry: alignmentTelemetry({
      pairs: [{
        id: "pair.x",
        materialRect: { left: 10, top: 20, width: 12, height: 24 },
        nativeRect: { left: 10.01, top: 20.01, width: 12, height: 24 },
        materialBaselineY: 40,
        nativeBaselineY: 40.01
      }]
    }),
    tolerancePx: 0.05,
    maximumCorrectionPx: 1
  });

  assert.equal(reverse.translateX, -forward.translateX);
  assert.equal(reverse.translateY, -forward.translateY);
  assert.equal(aligned.status, "already-aligned");
});

test("common handoff alignment rejects outliers and non-translational paint", () => {
  const calculate = (
    pairs: Parameters<typeof alignmentTelemetry>[0]["pairs"]
  ) => calculateKpNativeKatexCommonHandoffAlignment({
    telemetry: alignmentTelemetry({ pairs }),
    tolerancePx: 0.05,
    maximumCorrectionPx: 1
  });
  const basePair = {
    id: "pair.x",
    materialRect: { left: 10, top: 20, width: 12, height: 24 },
    nativeRect: { left: 10.5, top: 19.75, width: 12, height: 24 }
  };

  const outlier = calculate([
    basePair,
    {
      ...basePair,
      id: "pair.y",
      nativeRect: { ...basePair.nativeRect, left: 10.52 }
    },
    {
      ...basePair,
      id: "pair.outlier",
      nativeRect: { ...basePair.nativeRect, left: 10.8 }
    }
  ]);
  assert.equal(outlier.status, "unsupported");
  assert.equal(outlier.reason, "alignment-outlier");
  assert.ok(Math.abs(outlier.translateX - 0.52) < 1e-12);
  assert.deepEqual(outlier.rejectedIds, ["pair.outlier"]);
  assert.equal(calculate([{
    ...basePair,
    materialStyle: "font-size:65px",
    nativeStyle: "font-size:46px"
  }]).reason, "style-mismatch");
  assert.equal(calculate([{
    ...basePair,
    nativeRect: { ...basePair.nativeRect, width: 11 }
  }]).reason, "shape-mismatch");
  assert.equal(calculate([{
    ...basePair,
    nativePaintFingerprint: "glyph:y"
  }]).reason, "paint-mismatch");
});

test("fraction endpoint style drift cannot become a common translation", () => {
  const result = calculateKpNativeKatexCommonHandoffAlignment({
    telemetry: alignmentTelemetry({
      pairs: [{
        id: "fraction.glyph.x",
        materialRect: { left: 10, top: 20, width: 12, height: 24 },
        nativeRect: { left: 10.08, top: 20.04, width: 12, height: 24 },
        materialStyle: "font-size:46.0768px",
        nativeStyle: "font-size:46.0768px"
      }, {
        id: "fraction.operator.add",
        materialRect: { left: 24, top: 20, width: 12, height: 24 },
        nativeRect: { left: 24.08, top: 20.04, width: 12, height: 24 },
        materialStyle: "font-size:65.824px",
        nativeStyle: "font-size:46.0768px"
      }]
    }),
    tolerancePx: 0.2,
    maximumCorrectionPx: 1
  });

  assert.equal(result.status, "unsupported");
  assert.equal(result.reason, "style-mismatch");
  assert.deepEqual(result.rejectedIds, ["fraction.operator.add"]);
});

test("common handoff alignment rejects unbounded and invalid corrections", () => {
  const telemetry = alignmentTelemetry({
    pairs: [{
      id: "pair.x",
      materialRect: { left: 10, top: 20, width: 12, height: 24 },
      nativeRect: { left: 12, top: 20, width: 12, height: 24 }
    }]
  });
  assert.equal(calculateKpNativeKatexCommonHandoffAlignment({
    telemetry,
    tolerancePx: 0.05,
    maximumCorrectionPx: 1
  }).reason, "correction-exceeds-bound");
  assert.throws(
    () => calculateKpNativeKatexCommonHandoffAlignment({
      telemetry,
      tolerancePx: Number.NaN,
      maximumCorrectionPx: 1
    }),
    /alignment tolerance must be finite and nonnegative/
  );
  assert.throws(
    () => calculateKpNativeKatexCommonHandoffAlignment({
      telemetry,
      tolerancePx: 0.05,
      maximumCorrectionPx: -1
    }),
    /maximum alignment correction must be finite and nonnegative/
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

test("scene playback direct seeks and reverses without hidden clock state", () => {
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
  const playback = createKpNativeKatexScenePlayback({
    stage,
    sourceRoot: source.root,
    targetRoot: target.root,
    reconciliation,
    tracks
  });
  const forward = [0, 0.25, 0.5, 0.75, 1].map(playback.sample);
  const reverse = [1, 0.75, 0.5, 0.25, 0].map(playback.sample);

  assert.equal(playback.lifecycle, "renderer-session");
  assert.equal(Object.isFrozen(playback), true);
  assert.equal(Object.isFrozen(playback.tracks), true);
  assert.deepEqual(reverse, [...forward].reverse());
  assert.deepEqual(playback.sample(0.5), playback.sample(0.5));
  assert.throws(
    () => createKpNativeKatexScenePlayback({
      stage,
      sourceRoot: source.root,
      targetRoot: target.root,
      reconciliation,
      tracks: [{ ...tracks[0]!, visualAtomId: "unknown.atom" }]
    }),
    /unknown visual atom/
  );
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
