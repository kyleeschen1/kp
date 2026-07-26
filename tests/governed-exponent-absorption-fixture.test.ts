import assert from "node:assert/strict";
import test from "node:test";

import {
  projectKpAnimationAsset,
  recomposeKpAnimationAsset
} from "../src/animation/asset-projections.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  createKpGovernedExponentAbsorptionFixture
} from "../src/authoring/canonical-animation-public-api.ts";
import {
  createKpGovernedExponentRadicalPromotionCandidate
} from "../src/authoring/governed-exponent-radical-promotion.ts";
import {
  createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexPaintAtomObservation
} from "../src/rendering/native-katex-rendered-scene.ts";
import {
  createKpReaderEquationSceneCompositorSession
} from "../src/reader/renderers/equation-scene-compositor-adapter.ts";
import {
  compileKpReaderEquationMaterialPlan,
  projectKpReaderEquationRenderPlan,
  type KpReaderEquationStatePlan
} from "../src/reader/renderers/public-api.ts";

const ownerDocument = {};
const stage = { ownerDocument } as HTMLElement;
const sourceRoot = { ownerDocument } as HTMLElement;
const targetRoot = { ownerDocument } as HTMLElement;

test("existing governed unit-exponent trace compiles into the v2 construction", () => {
  const fixture = createKpGovernedExponentAbsorptionFixture();
  const predecessor = createKpGovernedExponentRadicalPromotionCandidate()
    .recordedProviderResponses.find(
      ({ id }) => id === fixture.predecessorRequestId
    );
  const operation = fixture.compilation.construction.operations[0]!;
  const evidence = fixture.compilation.mathematicalVerification.operations[0]!;

  assert.ok(predecessor);
  assert.equal(predecessor.operationIntent.operationId,
    "kp.algebra.unwrap-unit-exponent");
  assert.equal(predecessor.source.sourceId, fixture.request.source.sourceId);
  assert.equal(predecessor.source.revisionId, fixture.request.source.revisionId);
  assert.equal(operation.transformationId,
    "transform.generated.exponent.square-as-product.unwrap-unit-exponent");
  assert.equal(operation.definitionId,
    "definition.generated.exponent.unwrap-unit-exponent");
  assert.deepEqual(evidence.strictLawIds, [
    "law.arithmetic.unit-exponent"
  ]);
  assert.ok(operation.lineage.some(({ relation, targetEntityIds }) =>
    relation === "removal" && targetEntityIds.length === 0
  ));
});

test("unit-exponent absorption uses the canonical elimination session", () => {
  const fixture = createKpGovernedExponentAbsorptionFixture();
  const animation = fixture.authority.animation;
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: "runtime.governed.exponent-absorption",
    animation,
    direction: "forward",
    progress: 0.75
  });
  const renderPlan = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame
  });
  const materialPlan = compileKpReaderEquationMaterialPlan(renderPlan);
  const transition = renderPlan.transitions[0]!;
  const session = createKpReaderEquationSceneCompositorSession({
    renderPlan,
    materialPlan,
    transitionId: transition.id,
    source: scene("source", transition.source[0]!),
    target: scene("target", transition.target[0]!)
  });
  const first = session.sample(0.37);
  session.sample(0.84);

  assert.deepEqual(renderPlan.diagnostics, []);
  assert.deepEqual(materialPlan.diagnostics, []);
  assert.equal(session.kind, "native-katex-renderer-session");
  assert.equal(session.lifecycle, "renderer-session");
  assert.equal(session.mode, "atom-transit");
  assert.ok(session.tracks.some(({ lifecycle }) => lifecycle === "eliminate"));
  assert.deepEqual(session.sample(0.37), first);
  assert.ok([0, 0.25, 0.5, 0.75, 1].every((progress) =>
    session.sample(progress).every(({ opacity, rect }) =>
      Number.isFinite(opacity) &&
      [rect.left, rect.top, rect.width, rect.height].every(Number.isFinite)
    )
  ));
});

test("unit-exponent construction stays static and headless", () => {
  const fixture = createKpGovernedExponentAbsorptionFixture();
  const animation = fixture.authority.animation;
  const projections = projectKpAnimationAsset(animation);
  const recomposed = recomposeKpAnimationAsset(projections);

  assert.deepEqual(recomposed, animation);
  assert.deepEqual(
    projections.productManifest.exportTargets.map(({ kind }) => kind),
    ["frame-sequence"]
  );
  for (const direction of ["forward", "rewind"] as const) {
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const sample = () => sampleKpAnimationRuntimeFrame({
        animation,
        direction,
        progress
      });
      assert.deepEqual(sample(), sample());
      assert.deepEqual(sample().diagnostics, []);
    }
  }
  const durable = JSON.stringify({
    request: fixture.request,
    construction: fixture.compilation.construction,
    projections
  });
  for (const forbidden of [
    "renderer-session",
    "sourceElement",
    "\"rect\"",
    "fontRevision",
    "viewportKey"
  ]) {
    assert.equal(durable.includes(forbidden), false, forbidden);
  }
});

function scene(
  endpoint: "source" | "target",
  statePlan: KpReaderEquationStatePlan
) {
  const root = endpoint === "source" ? sourceRoot : targetRoot;
  const atoms = statePlan.selectors.map((selector, index) => {
    const groupId = `group.${endpoint}.${index}`;
    const atom: KpNativeKatexPaintAtomObservation = {
      kind: "native-katex-paint-atom-observation",
      lifecycle: "renderer-session",
      id: `atom.${endpoint}.${index}`,
      endpoint,
      semanticEntityId: selector.id,
      presentationGroupId: groupId,
      paintKind: "glyph",
      visualKey: `glyph:${selector.label ?? selector.id}`,
      sourceElement: { ownerDocument } as HTMLElement,
      rect: {
        left: (endpoint === "source" ? 20 : 80) + index * 24,
        top: selector.id.endsWith("residual-exponent") ? 4 : 24,
        width: 14,
        height: 20
      },
      styleFingerprint: "font:KaTeX_Main",
      zOrder: index,
      fontRevision: 1
    };
    return { atom, groupId };
  });
  return createKpNativeKatexRenderedSceneObservation({
    endpoint,
    stage,
    root,
    atoms: atoms.map(({ atom }) => atom),
    groups: atoms.map(({ atom, groupId }) => ({
      id: groupId,
      semanticEntityId: atom.semanticEntityId,
      atomIds: [atom.id],
      rect: atom.rect
    })),
    fontRevision: 1,
    viewportKey: "governed-exponent-headless"
  });
}
