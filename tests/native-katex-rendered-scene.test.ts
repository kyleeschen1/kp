import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexPaintAtomObservation
} from "../src/rendering/native-katex-rendered-scene.ts";

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
    sceneTracks: [{ keyframes: [] }]
  } as unknown as Parameters<typeof assetModule.createKpAnimationAsset>[0];
  const asset = assetModule.createKpAnimationAsset(forged);
  const serialized = JSON.stringify(asset);

  for (const field of [
    "renderedScene",
    "paintAtoms",
    "presentationGroups",
    "sceneTracks"
  ]) {
    assert.equal(field in asset, false);
    assert.equal(serialized.includes(field), false);
  }
});
