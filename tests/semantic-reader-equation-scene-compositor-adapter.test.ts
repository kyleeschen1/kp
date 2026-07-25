import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexPaintAtomObservation
} from "../src/rendering/native-katex-rendered-scene.ts";
import {
  compileKpReaderEquationMaterialPlan,
  projectKpReaderEquationRenderPlan
} from "../src/reader/renderers/public-api.ts";
import {
  createKpReaderEquationSceneCompositorSession
} from "../src/reader/renderers/equation-scene-compositor-adapter.ts";

const ownerDocument = {};
const stage = { ownerDocument } as HTMLElement;
const sourceRoot = { ownerDocument } as HTMLElement;
const targetRoot = { ownerDocument } as HTMLElement;
const sourceElement = { ownerDocument } as HTMLElement;
const targetElement = { ownerDocument } as HTMLElement;

function plans() {
  const animation = createLinearSolveAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: "runtime.reader.compositor",
    animation,
    direction: "forward",
    progress: 0.5
  });
  const renderPlan = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame
  });
  return {
    renderPlan,
    materialPlan: compileKpReaderEquationMaterialPlan(renderPlan)
  };
}

function scene(
  endpoint: "source" | "target",
  semanticEntityId: string
) {
  const groupId = `group.${endpoint}.x`;
  const atom: KpNativeKatexPaintAtomObservation = {
    kind: "native-katex-paint-atom-observation",
    lifecycle: "renderer-session",
    id: `atom.${endpoint}.x`,
    endpoint,
    semanticEntityId,
    presentationGroupId: groupId,
    paintKind: "glyph",
    visualKey: "glyph:x",
    sourceElement: endpoint === "source" ? sourceElement : targetElement,
    rect: {
      left: endpoint === "source" ? 10 : 90,
      top: 20,
      width: 12,
      height: 24
    },
    styleFingerprint: "font:KaTeX_Math",
    zOrder: 0,
    fontRevision: 1
  };
  return createKpNativeKatexRenderedSceneObservation({
    endpoint,
    stage,
    root: endpoint === "source" ? sourceRoot : targetRoot,
    atoms: [atom],
    groups: [{
      id: groupId,
      semanticEntityId,
      atomIds: [atom.id],
      rect: atom.rect
    }],
    fontRevision: 1,
    viewportKey: "reader-wide"
  });
}

test("reader correspondence creates only a transient compositor session", () => {
  const { renderPlan, materialPlan } = plans();
  const transition = renderPlan.transitions[0]!;
  const xRelation = transition.relations.find(
    ({ recordId }) => recordId === "x-persists"
  )!;
  const session = createKpReaderEquationSceneCompositorSession({
    renderPlan,
    materialPlan,
    transitionId: transition.id,
    source: scene("source", xRelation.sourceSelectorIds[0]!),
    target: scene("target", xRelation.targetSelectorIds[0]!)
  });

  assert.equal(session.lifecycle, "renderer-session");
  assert.equal(session.reconciliation.dispositions.length, 1);
  assert.equal(session.reconciliation.dispositions[0]?.lifecycle, "persist");
  assert.equal(session.tracks.length, 1);
  assert.equal(session.playback.sample(0.5)[0]?.rect.left, 50);
  assert.equal(
    session.relations.find(({ id }) => id === "reader-paint.x-persists")
      ?.relation,
    "persist"
  );
});

test("durable reader plans and static projections contain no compositor state", () => {
  const { renderPlan, materialPlan } = plans();
  const serialized = JSON.stringify({ renderPlan, materialPlan });

  for (const forbidden of [
    "renderer-session",
    "scene-compositor",
    "\"tracks\"",
    "\"rect\"",
    "sourceElement",
    "fontRevision",
    "viewportKey"
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }
  assert.equal("compositorSession" in renderPlan, false);
  assert.equal("compositorSession" in materialPlan, false);
});

test("adapter rejects material plans that are detached from canonical lineage", () => {
  const { renderPlan, materialPlan } = plans();
  const transition = renderPlan.transitions[0]!;
  const xRelation = transition.relations.find(
    ({ recordId }) => recordId === "x-persists"
  )!;
  assert.throws(
    () => createKpReaderEquationSceneCompositorSession({
      renderPlan,
      materialPlan: { ...materialPlan, renderPlanId: "equation-plan.forged" },
      transitionId: transition.id,
      source: scene("source", xRelation.sourceSelectorIds[0]!),
      target: scene("target", xRelation.targetSelectorIds[0]!)
    }),
    /does not belong/
  );
});
