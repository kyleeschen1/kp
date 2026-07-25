import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexPaintAtomObservation
} from "../src/rendering/native-katex-rendered-scene.ts";
import {
  compileKpNativeKatexHierarchicalScenePlan,
  compileKpNativeKatexSceneTracks,
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
