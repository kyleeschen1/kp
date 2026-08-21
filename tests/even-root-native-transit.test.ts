import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEvenRootNativeEndpoints,
  type KpEvenRootNativeEndpoint
} from "../src/rendering/even-root-native-endpoints.ts";
import {
  compileKpEvenRootEvaluationTransitPlan,
  compileKpEvenRootInversePowerTransitPlan
} from "../src/rendering/even-root-transit-session.ts";
import {
  createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexPaintAtomObservation
} from "../src/rendering/native-katex-rendered-scene.ts";
import {
  sampleKpNativeKatexSceneTracks
} from "../src/rendering/native-katex-scene-compositor.ts";
import {
  createKpEvenRootSolveExemplar
} from "../src/semantic/even-root-solve-exemplar.ts";

const exemplar = createKpEvenRootSolveExemplar();
const endpoints = createKpEvenRootNativeEndpoints(exemplar);

test("even-root endpoints preserve native syntax without fabricating index ink", () => {
  assert.equal(endpoints.inversePower.source.rawLatex, "x^2=9");
  assert.equal(
    endpoints.inversePower.target.rawLatex,
    "x=\\pm\\sqrt{9}"
  );
  assert.equal(endpoints.evaluation.target.rawLatex, "x=\\pm3");
  assert.match(endpoints.inversePower.target.nativeHtmlAndMathml, /hide-tail/u);
  assert.equal(
    endpoints.inversePower.target.nodes.some(({ entityId }) =>
      entityId === "radical.index.implicit-two"
    ),
    false
  );
  assert.equal(
    endpoints.inversePower.target.nodes.find(({ role }) =>
      role === "radical-operator"
    )?.measurement,
    "native-structure"
  );
});

test("inverse power transfers visible exponent toward implicit index role", () => {
  const measured = measuredPair(endpoints.inversePower, [
    ["subject", 10, 28, 14, 22],
    ["exponent", 24, 12, 8, 12],
    ["relation", 40, 28, 14, 22],
    ["value", 62, 28, 14, 22]
  ], [
    ["subject", 5, 28, 14, 22],
    ["relation", 27, 28, 14, 22],
    ["plus-minus", 48, 28, 18, 22],
    ["radical-operator", 72, 20, 24, 32],
    ["radicand", 91, 28, 14, 22]
  ]);
  const plan = compileKpEvenRootInversePowerTransitPlan({
    exemplar,
    endpoints: endpoints.inversePower,
    ...measured
  });
  const exponent = plan.tracks.find(({ sourceAtomId }) =>
    sourceAtomId === "source.exponent"
  );
  assert.ok(exponent);
  assert.equal(exponent.lifecycle, "eliminate");
  assert.ok(exponent.endRect.left > exponent.startRect.left);
  assert.ok((exponent.sampleMaterialScale?.(0.44) ?? 1) < 0.3);
  const radical = plan.tracks.find(({ targetAtomId }) =>
    targetAtomId === "target.radical-operator"
  );
  assert.ok(radical);
  assert.equal(radical.lifecycle, "introduce");
  assert.equal(radical.sampleOpacityProgress?.(0.2), 0);
  assert.equal(radical.sampleOpacityProgress?.(0.56), 1);
  assert.ok(plan.tracks.some(({ lifecycle }) => lifecycle === "persist"));
});

test("root evaluation is a separate deterministic ink-knot transition", () => {
  const measured = measuredPair(endpoints.evaluation, [
    ["subject", 5, 28, 14, 22],
    ["relation", 27, 28, 14, 22],
    ["plus-minus", 48, 28, 18, 22],
    ["radical-operator", 72, 20, 24, 32],
    ["radicand", 91, 28, 14, 22]
  ], [
    ["subject", 18, 28, 14, 22],
    ["relation", 40, 28, 14, 22],
    ["plus-minus", 61, 28, 18, 22],
    ["value", 84, 28, 14, 22]
  ]);
  const plan = compileKpEvenRootEvaluationTransitPlan({
    exemplar,
    endpoints: endpoints.evaluation,
    ...measured
  });
  const sourceContributors = plan.tracks.filter(({ sourceAtomId }) =>
    sourceAtomId === "source.radical-operator" ||
    sourceAtomId === "source.radicand"
  );
  assert.equal(sourceContributors.length, 2);
  assert.ok(sourceContributors.every(({ sampleMaterialScale }) =>
    (sampleMaterialScale?.(0.5) ?? 1) <= 0.161
  ));
  const result = plan.tracks.find(({ targetAtomId }) =>
    targetAtomId === "target.value"
  );
  assert.ok(result);
  assert.equal(result.lifecycle, "introduce");
  assert.ok((result.sampleMaterialScale?.(0.5) ?? 1) <= 0.161);

  const first = sampleKpNativeKatexSceneTracks(plan.tracks, 0.47, false);
  sampleKpNativeKatexSceneTracks(plan.tracks, 0.9, false);
  assert.deepEqual(
    sampleKpNativeKatexSceneTracks(plan.tracks, 0.47, false),
    first
  );
});

type MeasuredTuple = readonly [
  KpEvenRootNativeEndpoint["nodes"][number]["role"],
  number,
  number,
  number,
  number
];

function measuredPair(
  pair: Readonly<{
    readonly source: KpEvenRootNativeEndpoint;
    readonly target: KpEvenRootNativeEndpoint;
  }>,
  sourceGeometry: readonly MeasuredTuple[],
  targetGeometry: readonly MeasuredTuple[]
) {
  const ownerDocument = {};
  const stage = { ownerDocument } as HTMLElement;
  return {
    source: scene(stage, pair.source, sourceGeometry),
    target: scene(stage, pair.target, targetGeometry)
  };
}

function scene(
  stage: HTMLElement,
  endpoint: KpEvenRootNativeEndpoint,
  geometry: readonly MeasuredTuple[]
) {
  const root = { ownerDocument: stage.ownerDocument } as HTMLElement;
  const atoms = geometry.map(([role, left, top, width, height], index) => {
    const node = endpoint.nodes.find((candidate) => candidate.role === role);
    if (node === undefined) throw new Error(`Missing endpoint role ${role}.`);
    return Object.freeze({
      kind: "native-katex-paint-atom-observation" as const,
      lifecycle: "renderer-session" as const,
      id: `${endpoint.endpoint}.${role}`,
      endpoint: endpoint.endpoint,
      semanticEntityId: node.entityId,
      presentationGroupId: node.presentationGroupId,
      paintKind: role === "radical-operator" ? "path" as const : "glyph" as const,
      paintMeasurement: role === "radical-operator"
        ? "subtree" as const
        : "atomic-text" as const,
      visualKey: `${role}:${node.referentId}`,
      sourceElement: root,
      rect: Object.freeze({ left, top, width, height }),
      baselineY: top + height,
      styleFingerprint: "font-family:KaTeX_Main|font-size:32px",
      zOrder: index,
      fontRevision: 7
    }) satisfies KpNativeKatexPaintAtomObservation;
  });
  return createKpNativeKatexRenderedSceneObservation({
    endpoint: endpoint.endpoint,
    stage,
    root,
    atoms,
    groups: atoms.map((atom) => Object.freeze({
      id: atom.presentationGroupId,
      semanticEntityId: atom.semanticEntityId,
      atomIds: Object.freeze([atom.id]),
      rect: atom.rect
    })),
    fontRevision: 7,
    viewportKey: `${endpoint.endpoint}:wide@1:font-7`
  });
}
