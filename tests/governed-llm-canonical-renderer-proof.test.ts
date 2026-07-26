import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpGovernedExponentRadicalPromotionCandidate
} from "../src/authoring/governed-exponent-radical-promotion.ts";
import {
  createKpGovernedFractionFanOutExemplar
} from "../src/authoring/governed-fraction-fan-out-exemplar.ts";
import {
  compileKpNativeKatexHierarchicalScenePlan,
  compileKpNativeKatexSceneTracks,
  createKpNativeKatexRendererSession,
  projectKpNativeKatexSemanticPaintRelations,
  reconcileKpNativeKatexScenes
} from "../src/rendering/native-katex-scene-compositor.ts";
import {
  createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexPaintAtomObservation
} from "../src/rendering/native-katex-rendered-scene.ts";

const ownerDocument = {};
const stage = { ownerDocument } as HTMLElement;
const sourceRoot = { ownerDocument } as HTMLElement;
const targetRoot = { ownerDocument } as HTMLElement;

test("governed LLM fixtures reach one canonical renderer session", () => {
  const fraction = createKpGovernedFractionFanOutExemplar();
  const exponentRadical = createKpGovernedExponentRadicalPromotionCandidate();
  const compilations = [
    fraction.compilation,
    ...exponentRadical.compilations
  ];

  assert.equal(compilations.length, 4);
  const evidence = compilations.map(({ plan }) => {
    const relations = projectKpNativeKatexSemanticPaintRelations({
      groups: plan.operation.correspondence.map((correspondence, index) => ({
        id: `${plan.requestId}.${index}`,
        kind: lineageKind(
          correspondence.sourceEntityIds.length,
          correspondence.targetEntityIds.length
        ),
        sourceEntityIds: correspondence.sourceEntityIds,
        targetEntityIds: correspondence.targetEntityIds
      }))
    });
    const sourceIds = unique(plan.operation.correspondence.flatMap(
      ({ sourceEntityIds }) => sourceEntityIds
    ));
    const targetIds = unique(plan.operation.correspondence.flatMap(
      ({ targetEntityIds }) => targetEntityIds
    ));
    const source = scene("source", sourceIds);
    const target = scene("target", targetIds);
    const reconciliation = reconcileKpNativeKatexScenes({
      source,
      target,
      relations
    });
    const tracks = compileKpNativeKatexSceneTracks(
      compileKpNativeKatexHierarchicalScenePlan(reconciliation)
    );
    const session = createKpNativeKatexRendererSession({
      stage,
      sourceRoot,
      targetRoot,
      reconciliation,
      tracks
    });
    const first = session.sample(0.42);
    session.sample(0.8);
    const rewound = session.sample(0.42);

    assert.equal(session.kind, "native-katex-renderer-session");
    assert.equal(session.lifecycle, "renderer-session");
    assert.equal(session.mode, "atom-transit");
    assert.deepEqual(rewound, first);
    assert.ok(session.sample(0).every(finiteTrackFrame));
    assert.ok(session.sample(1).every(finiteTrackFrame));
    return {
      requestId: plan.requestId,
      operationId: plan.operation.operationId,
      sessionKind: session.kind,
      sessionMode: session.mode,
      lifecycles: unique(session.tracks.map(({ lifecycle }) => lifecycle))
    };
  });

  assert.deepEqual(evidence.map(({ operationId }) => operationId), [
    "kp.algebra.distribute-multiplication",
    "kp.algebra.lower-exponent",
    "kp.algebra.unwrap-unit-exponent",
    "kp.algebra.rewrite-power-as-root"
  ]);
  assert.ok(evidence.every(({ sessionKind }) =>
    sessionKind === "native-katex-renderer-session"
  ));
  assert.ok(evidence.some(({ lifecycles }) => lifecycles.includes("split")));
  assert.ok(evidence.some(({ lifecycles }) => lifecycles.includes("eliminate")));
});

test("governed drafts and canonical traces remain static and renderer-neutral", () => {
  const fraction = createKpGovernedFractionFanOutExemplar();
  const exponentRadical = createKpGovernedExponentRadicalPromotionCandidate();
  const artifacts = [
    {
      request: fraction.recordedProviderResponse,
      plan: fraction.compilation.plan
    },
    ...exponentRadical.recordedProviderResponses.map((request, index) => ({
      request,
      plan: exponentRadical.compilations[index]!.plan
    }))
  ];

  for (const artifact of artifacts) {
    assert.deepEqual(
      structuredClone(artifact),
      JSON.parse(JSON.stringify(artifact))
    );
    const keys = collectKeys(artifact);
    for (const forbidden of [
      "bounds",
      "computedStyle",
      "dom",
      "fragments",
      "geometry",
      "keyframes",
      "paint",
      "rect",
      "renderer",
      "style",
      "timing",
      "timingTable"
    ]) {
      assert.equal(keys.includes(forbidden), false, forbidden);
    }
  }
});

function scene(
  endpoint: "source" | "target",
  semanticEntityIds: readonly string[]
) {
  const atoms = semanticEntityIds.map((semanticEntityId, index) => {
    const atom: KpNativeKatexPaintAtomObservation = {
      kind: "native-katex-paint-atom-observation",
      lifecycle: "renderer-session",
      id: `atom.${endpoint}.${index}`,
      endpoint,
      semanticEntityId,
      presentationGroupId: `group.${endpoint}.${index}`,
      paintKind: "glyph",
      visualKey: "glyph:governed-proof",
      sourceElement: { ownerDocument } as HTMLElement,
      rect: {
        left: (endpoint === "source" ? 10 : 80) + index * 20,
        top: 20,
        width: 12,
        height: 24
      },
      styleFingerprint: "font:KaTeX_Main",
      zOrder: index,
      fontRevision: 1
    };
    return atom;
  });
  return createKpNativeKatexRenderedSceneObservation({
    endpoint,
    stage,
    root: endpoint === "source" ? sourceRoot : targetRoot,
    atoms,
    groups: atoms.map((atom) => ({
      id: atom.presentationGroupId,
      semanticEntityId: atom.semanticEntityId,
      atomIds: [atom.id],
      rect: atom.rect
    })),
    fontRevision: 1,
    viewportKey: "governed-headless-proof"
  });
}

function lineageKind(
  sourceCount: number,
  targetCount: number
):
  | "one-to-one"
  | "many-to-one"
  | "one-to-many"
  | "introduction"
  | "removal" {
  if (sourceCount === 0) return "introduction";
  if (targetCount === 0) return "removal";
  if (sourceCount > 1 && targetCount === 1) return "many-to-one";
  if (sourceCount === 1 && targetCount > 1) return "one-to-many";
  return "one-to-one";
}

function finiteTrackFrame(frame: {
  readonly rect: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  readonly opacity: number;
}): boolean {
  return [
    frame.rect.left,
    frame.rect.top,
    frame.rect.width,
    frame.rect.height,
    frame.opacity
  ].every(Number.isFinite);
}

function unique<T>(values: readonly T[]): readonly T[] {
  return [...new Set(values)];
}

function collectKeys(value: unknown): readonly string[] {
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) => [
    key,
    ...collectKeys(child)
  ]);
}
