import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpExponentialHomomorphismNativeEndpoints,
  type KpExponentialNativeEndpoint
} from "../src/rendering/exponential-homomorphism-native-endpoints.ts";
import {
  compileKpExponentialHomomorphismTransitPlan,
  projectKpExponentialHomomorphismNativePaintRelations
} from "../src/rendering/exponential-homomorphism-transit-session.ts";
import {
  createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexPaintAtomObservation
} from "../src/rendering/native-katex-rendered-scene.ts";
import { sampleKpNativeKatexSceneTracks } from
  "../src/rendering/native-katex-scene-compositor.ts";
import { kpExponentialQuotientPressureAuthority } from
  "../src/semantic/exponential-quotient-pressure.ts";

const authority = kpExponentialQuotientPressureAuthority;
const endpoints = createKpExponentialHomomorphismNativeEndpoints(authority);
const measured = measuredEndpoints();

test("quotient pressure compiles exact Native KaTeX endpoint ownership", () => {
  assert.equal(endpoints.source.rawLatex, "e^{a-b}");
  assert.equal(endpoints.target.rawLatex, "\\frac{e^{a}}{e^{b}}");
  assert.match(endpoints.target.nativeHtmlAndMathml, /class="frac-line"/u);
  const bar = endpoints.target.nodes.find(({ role }) =>
    role === "combination-connector"
  );
  assert.equal(bar?.measurement, "native-ink");
  assert.ok(bar?.motionId);
});

test("quotient pressure uses one measured compositor cohort", () => {
  const relations = projectKpExponentialHomomorphismNativePaintRelations(
    authority,
    "vertical-quotient"
  );
  assert.deepEqual(relations.map(({ relation }) => relation), [
    "persist",
    "persist",
    "split"
  ]);
  const plan = compilePlan();
  assert.equal(plan.tracks.length, 6);
  assert.ok(plan.tracks.every(({ semanticMotionUnitId }) =>
    semanticMotionUnitId ===
      `motion-unit.${authority.id}.homomorphic-resolution`
  ));
  const barTrack = plan.tracks.find(({ lifecycle, targetAtomId }) =>
    lifecycle === "introduce" && targetAtomId === "target.paint.bar"
  );
  assert.ok(barTrack);
  assert.equal(barTrack?.sampleMaterialScale?.(0.1), 0.1);
  assert.equal(barTrack?.sampleOpacityProgress?.(0.23), 0);
  assert.equal(barTrack?.sampleMaterialScale?.(0.23), 0.1);
  assert.equal(barTrack?.sampleMaterialScale?.(0.36), 1);
});

test("vertical pressure seeks and rewinds without terminal corrections", () => {
  const tracks = compilePlan().tracks;
  const middle = sampleKpNativeKatexSceneTracks(tracks, 0.23, false);
  sampleKpNativeKatexSceneTracks(tracks, 1, false);
  assert.deepEqual(
    sampleKpNativeKatexSceneTracks(tracks, 0.23, false),
    middle
  );
  const start = sampleKpNativeKatexSceneTracks(tracks, 0, false);
  const end = sampleKpNativeKatexSceneTracks(tracks, 1, false);
  assert.ok(start.every(({ rect }, index) =>
    sameRect(rect, tracks[index]!.startRect)
  ));
  assert.ok(end.every(({ rect }, index) =>
    sameRect(rect, tracks[index]!.endRect)
  ));
});

function compilePlan() {
  return compileKpExponentialHomomorphismTransitPlan({
    authority,
    sourceEndpoint: endpoints.source,
    targetEndpoint: endpoints.target,
    source: measured.source,
    target: measured.target,
    targetTopology: "vertical-quotient"
  });
}

function measuredEndpoints() {
  const ownerDocument = {};
  const stage = { ownerDocument } as HTMLElement;
  const sourceRoot = { ownerDocument } as HTMLElement;
  const targetRoot = { ownerDocument } as HTMLElement;
  const sourceAtoms = [
    atom(endpoints.source, "base", 0, "e", 12, 34, 12, 18,
      sourceRoot, "source"),
    atom(endpoints.source, "exponent-payload", 0, "a", 25, 18, 8, 12,
      sourceRoot, "source"),
    atom(endpoints.source, "combination-connector", 0, "-", 35, 18, 9, 12,
      sourceRoot, "source"),
    atom(endpoints.source, "exponent-payload", 1, "b", 46, 18, 8, 12,
      sourceRoot, "source")
  ];
  const targetAtoms = [
    atom(endpoints.target, "base", 0, "e", 32, 12, 12, 18,
      targetRoot, "target"),
    atom(endpoints.target, "exponent-payload", 0, "a", 45, 2, 8, 12,
      targetRoot, "target"),
    atom(endpoints.target, "combination-connector", 0, "bar", 28, 32, 34, 1,
      targetRoot, "target", "rule", "target.paint.bar"),
    atom(endpoints.target, "base", 1, "e", 32, 42, 12, 18,
      targetRoot, "target"),
    atom(endpoints.target, "exponent-payload", 1, "b", 45, 32, 8, 12,
      targetRoot, "target")
  ];
  return {
    source: scene("source", stage, sourceRoot, sourceAtoms),
    target: scene("target", stage, targetRoot, targetAtoms)
  };
}

function scene(
  side: "source" | "target",
  stage: HTMLElement,
  root: HTMLElement,
  atoms: readonly KpNativeKatexPaintAtomObservation[]
) {
  return createKpNativeKatexRenderedSceneObservation({
    endpoint: side,
    stage,
    root,
    atoms,
    groups: atoms.map((value) => Object.freeze({
      id: value.presentationGroupId,
      semanticEntityId: value.semanticEntityId,
      atomIds: Object.freeze([value.id]),
      rect: value.rect
    })),
    fontRevision: 4,
    viewportKey: `${side}:wide@1:font-4`
  });
}

function atom(
  endpoint: KpExponentialNativeEndpoint,
  role: KpExponentialNativeEndpoint["nodes"][number]["role"],
  ordinal: number,
  glyph: string,
  left: number,
  top: number,
  width: number,
  height: number,
  sourceElement: HTMLElement,
  side: "source" | "target",
  paintKind: "glyph" | "rule" = "glyph",
  id = `${side}.paint.${role}.${ordinal}`
): KpNativeKatexPaintAtomObservation {
  const node = endpoint.nodes.find((candidate) =>
    candidate.role === role && candidate.ordinal === ordinal
  );
  if (node === undefined) throw new Error(`Missing ${side} ${role}[${ordinal}].`);
  return Object.freeze({
    kind: "native-katex-paint-atom-observation" as const,
    lifecycle: "renderer-session" as const,
    id,
    endpoint: side,
    semanticEntityId: node.occurrenceId,
    presentationGroupId: node.presentationGroupId,
    paintKind,
    visualKey: `${paintKind}:${glyph}`,
    sourceElement,
    rect: Object.freeze({ left, top, width, height }),
    styleFingerprint: "font-family:KaTeX_Main|font-size:32px",
    zOrder: ordinal,
    fontRevision: 4
  });
}

function sameRect(
  left: { left: number; top: number; width: number; height: number },
  right: { left: number; top: number; width: number; height: number }
): boolean {
  return left.left === right.left && left.top === right.top &&
    left.width === right.width && left.height === right.height;
}
