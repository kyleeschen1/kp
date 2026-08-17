import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpHomomorphicFusionChoreography
} from "../src/animation/equation-operation-choreography.ts";
import {
  kpCanonicalLogQuotientFunctionWrapInvocationGroup,
  kpCanonicalLogQuotientHomomorphicFusionChoreography
} from "../src/animation/log-quotient-homomorphic-fusion.ts";
import {
  isKpCompiledFunctionWrapInvocationGroup
} from "../src/animation/function-wrap-invocation.ts";
import {
  applyKpNativeKatexOperationChoreography
} from "../src/rendering/native-katex-operation-choreography.ts";
import type {
  KpNativeKatexPaintMeasuredSceneTrack
} from "../src/rendering/native-katex-scene-compositor.ts";
import type {
  KpNativeKatexPaintAtomObservation,
  KpNativeKatexRenderedSceneObservation
} from "../src/rendering/native-katex-rendered-scene.ts";
import {
  kpCanonicalCompiledLogQuotientOperation
} from "../src/semantic/log-quotient-transformation-compiler.ts";

test("quotient binds the candidate homomorphic-fusion grammar to exact lineage", () => {
  const choreography =
    kpCanonicalLogQuotientHomomorphicFusionChoreography;
  assert.equal(choreography.kind, "homomorphic-fusion");
  assert.equal(choreography.maturity, "candidate");
  assert.equal(choreography.canonicalShape, "H(a) o H(b) -> H(a star b)");
  assert.equal(
    isKpCompiledFunctionWrapInvocationGroup(choreography.targetFunctionWrap),
    true
  );
  assert.equal(choreography.targetFunctionWrap.motifId, "motif.function-wrap.v1");
  assert.deepEqual(choreography.targetFunctionWrap.branches.map((branch) => ({
    sourceArgumentEntityIds: branch.sourceArgumentEntityIds,
    targetArgumentEntityIds: branch.targetArgumentEntityIds,
    functionEntityIds: branch.functionEntityIds,
    enclosureEntityRoles: branch.enclosureEntityRoles
  })), [{
    sourceArgumentEntityIds: [
      "source.left.argument.x",
      "source.right.argument.y"
    ],
    targetArgumentEntityIds: ["target.numerator.x", "target.denominator.y"],
    functionEntityIds: ["target.log", "target.log.operator"],
    enclosureEntityRoles: [
      { entityId: "target.log.open", side: "leading" },
      { entityId: "target.log.close", side: "trailing" }
    ]
  }]);
  assert.deepEqual(choreography.operatorGlyphFusion, {
    relationRecordId: "correspondence.log-quotient.operator-fusion",
    sourceEntityIds: [
      "source.left.log.operator",
      "source.right.log.operator"
    ],
    targetEntityIds: ["target.log.operator"]
  });
  assert.deepEqual(
    choreography.argumentTransfers.map(({ role, route }) => ({ role, route })),
    [
      { role: "left", route: "arc-above" },
      { role: "right", route: "arc-below" }
    ]
  );
  assert.deepEqual(
    choreography.connectorDerivation.forbiddenIdentityPairs,
    [{
      sourceEntityId: "source.subtract",
      targetEntityId: "target.quotient.bar"
    }]
  );
  assert.ok(
    choreography.sourceEnclosureRetirement.exitWindow.end <=
      choreography.connectorDerivation.exitWindow.start
  );
  assert.ok(
    choreography.connectorDerivation.exitWindow.end <=
      Math.min(
        choreography.operatorFusionWindow.start,
        choreography.argumentTransferWindow.start
      )
  );
  assert.ok(
    Math.max(
      choreography.operatorFusionWindow.end,
      choreography.argumentTransferWindow.end
    ) <= Math.min(...choreography.targetStructureEntries.map(
      ({ entryWindow }) => entryWindow.start
    ))
  );
});

test("homomorphic choreography routes arguments but keeps operator fusion direct", () => {
  const source = scene("source", [
    atom("source", "source.left.log.operator", 0, 30),
    atom("source", "source.right.log.operator", 120, 30),
    atom("source", "source.left.argument.x", 28, 30),
    atom("source", "source.right.argument.y", 148, 30),
    atom("source", "source.left.log.open", 20, 30),
    atom("source", "source.left.log.close", 42, 30),
    atom("source", "source.right.log.open", 140, 30),
    atom("source", "source.right.log.close", 162, 30),
    atom("source", "source.subtract", 82, 30)
  ]);
  const target = scene("target", [
    atom("target", "target.log.operator", 48, 30),
    atom("target", "target.numerator.x", 92, 18),
    atom("target", "target.denominator.y", 92, 44),
    atom("target", "target.log.open", 70, 30),
    atom("target", "target.log.close", 116, 30),
    atom("target", "target.quotient.bar", 86, 36, "rule", 28, 1)
  ]);
  const targetByEntity = new Map(target.atoms.map((entry) => [
    entry.semanticEntityId,
    entry
  ]));
  const sourceByEntity = new Map(source.atoms.map((entry) => [
    entry.semanticEntityId,
    entry
  ]));
  const tracks: KpNativeKatexPaintMeasuredSceneTrack[] = [
    mergeTrack(sourceByEntity.get("source.left.log.operator")!, targetByEntity.get("target.log.operator")!, 0),
    mergeTrack(sourceByEntity.get("source.right.log.operator")!, targetByEntity.get("target.log.operator")!, 1),
    persistTrack(sourceByEntity.get("source.left.argument.x")!, targetByEntity.get("target.numerator.x")!, 0),
    persistTrack(sourceByEntity.get("source.right.argument.y")!, targetByEntity.get("target.denominator.y")!, 1),
    ...[
      "source.left.log.open",
      "source.left.log.close",
      "source.right.log.open",
      "source.right.log.close",
      "source.subtract"
    ].map((entityId, index) => eliminateTrack(sourceByEntity.get(entityId)!, index)),
    introduceTrack(targetByEntity.get("target.log.open")!, 0),
    introduceTrack(targetByEntity.get("target.log.close")!, 1),
    introduceTrack(targetByEntity.get("target.quotient.bar")!, 2)
  ];
  const routed = applyKpNativeKatexOperationChoreography({
    tracks,
    source,
    target,
    choreography: kpCanonicalLogQuotientHomomorphicFusionChoreography
  });
  const bySourceEntity = new Map(routed.flatMap((track) => {
    const entityId = track.sourceAtomId === undefined
      ? undefined
      : source.atoms.find(({ id }) => id === track.sourceAtomId)
        ?.semanticEntityId;
    return entityId === undefined ? [] : [[entityId, track] as const];
  }));
  assert.equal(
    bySourceEntity.get("source.left.log.operator")?.motionPath,
    undefined
  );
  assert.equal(
    bySourceEntity.get("source.left.log.operator")?.motionAxisConstraint,
    undefined
  );
  assert.equal(
    bySourceEntity.get("source.left.argument.x")?.motionPath?.variant,
    "arc-above"
  );
  assert.equal(
    bySourceEntity.get("source.right.argument.y")?.motionPath?.variant,
    "arc-below"
  );
  const retiredOpen = bySourceEntity.get("source.left.log.open")!;
  assert.deepEqual(retiredOpen.startRect, retiredOpen.endRect);
  const bar = routed.find((track) =>
    track.targetAtomId === targetByEntity.get("target.quotient.bar")!.id
  )!;
  assert.equal(bar.startRect.width, 1);
  assert.equal(bar.endRect.width, 28);
});

test("homomorphic mint rejects a connector-to-structure identity", () => {
  assert.throws(() => createKpHomomorphicFusionChoreography({
    transformation:
      kpCanonicalCompiledLogQuotientOperation.transformation,
    direction: "forward",
    targetFunctionWrap:
      kpCanonicalLogQuotientFunctionWrapInvocationGroup,
    operatorApplicationFusionRecordId:
      "correspondence.log-quotient.application-fusion",
    operatorGlyphFusionRecordId:
      "correspondence.log-quotient.operator-fusion",
    argumentTransfers: [
      {
        id: "left",
        role: "left",
        relationRecordId: "correspondence.log-quotient.x-to-numerator",
        route: "arc-above"
      },
      {
        id: "right",
        role: "right",
        relationRecordId: "correspondence.log-quotient.y-to-denominator",
        route: "arc-below"
      }
    ],
    connectorDerivationRecordId:
      "correspondence.log-quotient.difference-derives-quotient",
    forbiddenConnectorIdentityPairs: [{
      sourceEntityId: "source.subtract",
      targetEntityId: "target.quotient"
    }],
    sourceEnclosureRetirementRecordId:
      "correspondence.log-quotient.retire-source-enclosures",
    targetStructureEntries: [
      {
        relationRecordId:
          "correspondence.log-quotient.introduce-fraction-bar",
        entryWindow: { start: 0.72, end: 0.9 }
      }
    ],
    operatorFusionWindow: { start: 0.1, end: 0.6 },
    argumentTransferWindow: { start: 0.1, end: 0.7 },
    connectorRetirementWindow: { start: 0.08, end: 0.09 },
    sourceRetirementWindow: { start: 0.01, end: 0.08 }
  }), /cannot preserve identity as target structure/);
});

test("homomorphic mint releases enclosures before continuants cross them", () => {
  assert.throws(() => createKpHomomorphicFusionChoreography({
    ...canonicalHomomorphicInput(),
    sourceRetirementWindow: { start: 0.08, end: 0.2 }
  }), /enclosures must retire before the connector/);
});

test("homomorphic mint rejects copied function-wrap claims", () => {
  const input = canonicalHomomorphicInput();
  assert.throws(() => createKpHomomorphicFusionChoreography({
    ...input,
    targetFunctionWrap: {
      ...input.targetFunctionWrap
    }
  }), /compiled function-wrap authority/);
});

test("homomorphic mint clears the connector before moving material", () => {
  assert.throws(() => createKpHomomorphicFusionChoreography({
    ...canonicalHomomorphicInput(),
    connectorRetirementWindow: { start: 0.1, end: 0.2 }
  }), /connector must retire before material transfers/);
});

test("homomorphic mint settles material before target structure enters", () => {
  const input = canonicalHomomorphicInput();
  assert.throws(() => createKpHomomorphicFusionChoreography({
    ...input,
    targetStructureEntries: [
      {
        ...input.targetStructureEntries[0],
        entryWindow: { start: 0.6, end: 0.82 }
      },
      input.targetStructureEntries[1]!
    ]
  }), /target structure must enter after material transfers settle/);
});

function canonicalHomomorphicInput():
  Parameters<typeof createKpHomomorphicFusionChoreography>[0] {
  const base = kpCanonicalLogQuotientHomomorphicFusionChoreography;
  return {
    transformation:
      kpCanonicalCompiledLogQuotientOperation.transformation,
    direction: "forward",
    targetFunctionWrap: base.targetFunctionWrap,
    operatorApplicationFusionRecordId:
      base.operatorApplicationFusion.relationRecordId,
    operatorGlyphFusionRecordId: base.operatorGlyphFusion.relationRecordId,
    argumentTransfers: [
      {
        id: "left",
        role: "left",
        relationRecordId: base.argumentTransfers[0].relationRecordId,
        route: "arc-above"
      },
      {
        id: "right",
        role: "right",
        relationRecordId: base.argumentTransfers[1].relationRecordId,
        route: "arc-below"
      }
    ],
    connectorDerivationRecordId:
      base.connectorDerivation.relationRecordId,
    forbiddenConnectorIdentityPairs:
      base.connectorDerivation.forbiddenIdentityPairs,
    sourceEnclosureRetirementRecordId:
      base.sourceEnclosureRetirement.relationRecordId,
    targetStructureEntries: [
      {
        relationRecordId: base.targetStructureEntries[0].relationRecordId,
        entryWindow: base.targetStructureEntries[0].entryWindow
      },
      {
        relationRecordId: base.targetStructureEntries[1]!.relationRecordId,
        entryWindow: base.targetStructureEntries[1]!.entryWindow
      }
    ],
    operatorFusionWindow: base.operatorFusionWindow,
    argumentTransferWindow: base.argumentTransferWindow,
    connectorRetirementWindow: base.connectorDerivation.exitWindow,
    sourceRetirementWindow:
      base.sourceEnclosureRetirement.exitWindow
  };
}

function scene(
  endpoint: "source" | "target",
  atoms: readonly KpNativeKatexPaintAtomObservation[]
): KpNativeKatexRenderedSceneObservation {
  const element = {} as HTMLElement;
  return {
    kind: "native-katex-rendered-scene-observation",
    lifecycle: "renderer-session",
    endpoint,
    stage: element,
    root: element,
    atoms,
    groups: [],
    fontRevision: 1,
    viewportKey: "test"
  };
}

function atom(
  endpoint: "source" | "target",
  semanticEntityId: string,
  left: number,
  top: number,
  paintKind: "glyph" | "rule" = "glyph",
  width = 12,
  height = 18
): KpNativeKatexPaintAtomObservation {
  return {
    kind: "native-katex-paint-atom-observation",
    lifecycle: "renderer-session",
    id: `${endpoint}.${semanticEntityId}`,
    endpoint,
    semanticEntityId,
    presentationGroupId: `group.${semanticEntityId}`,
    paintKind,
    visualKey: `${paintKind}:${semanticEntityId}`,
    sourceElement: {} as HTMLElement,
    rect: { left, top, width, height },
    styleFingerprint: "test",
    zOrder: 0,
    fontRevision: 1
  };
}

function mergeTrack(
  source: KpNativeKatexPaintAtomObservation,
  target: KpNativeKatexPaintAtomObservation,
  index: number
): KpNativeKatexPaintMeasuredSceneTrack {
  return baseTrack("merge", source, target, index, 1, 1);
}

function persistTrack(
  source: KpNativeKatexPaintAtomObservation,
  target: KpNativeKatexPaintAtomObservation,
  index: number
): KpNativeKatexPaintMeasuredSceneTrack {
  return baseTrack("persist", source, target, index, 1, 1);
}

function eliminateTrack(
  source: KpNativeKatexPaintAtomObservation,
  index: number
): KpNativeKatexPaintMeasuredSceneTrack {
  return baseTrack(
    "eliminate",
    source,
    { ...source, id: `${source.id}.target`, rect: { ...source.rect, top: source.rect.top - 8 } },
    index,
    1,
    0
  );
}

function introduceTrack(
  target: KpNativeKatexPaintAtomObservation,
  index: number
): KpNativeKatexPaintMeasuredSceneTrack {
  return baseTrack(
    "introduce",
    { ...target, id: `${target.id}.source`, rect: { ...target.rect, top: target.rect.top + 8 } },
    target,
    index,
    0,
    1
  );
}

function baseTrack(
  lifecycle: "persist" | "merge" | "introduce" | "eliminate",
  source: KpNativeKatexPaintAtomObservation,
  target: KpNativeKatexPaintAtomObservation,
  index: number,
  startOpacity: 0 | 1,
  endOpacity: 0 | 1
): KpNativeKatexPaintMeasuredSceneTrack {
  return {
    id: `track.${lifecycle}.${index}.${source.semanticEntityId}`,
    componentId: `component.${lifecycle}.${index}`,
    lifecycle,
    sourceAtomId: lifecycle === "introduce" ? undefined : source.id,
    targetAtomId: lifecycle === "eliminate" ? undefined : target.id,
    visualAtomId: source.id,
    paintKind: source.paintKind,
    sizingMode: source.paintKind === "rule" ? "rule-length" : "rect",
    startRect: source.rect,
    endRect: target.rect,
    startPaintRect: source.rect,
    endPaintRect: target.rect,
    startOpacity,
    endOpacity
  } as KpNativeKatexPaintMeasuredSceneTrack;
}
