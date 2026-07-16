import assert from "node:assert/strict";
import test from "node:test";

import { createKpDiagramScene } from "../src/semantic/diagram-scene.ts";
import {
  composeKpSemanticScenes,
  createKpSemanticSceneTransition,
  projectKpDiagramSceneToSemanticScene,
  projectKpEquationTransitionStateToSemanticScene
} from "../src/semantic/semantic-scene-protocol.ts";
import { createKpSemanticLineageGraph } from "../src/semantic/semantic-lineage-graph.ts";
import { createKpEquationTransitionIr } from "../src/rendering/equation-transition-ir.ts";

test("equations conform to the shared entity, group, region, and fragment scene seam", () => {
  const ir = equationIr();
  const scene = projectKpEquationTransitionStateToSemanticScene({ ir, side: "source" });
  assert.equal(scene.kind, "semantic-scene");
  assert.equal(scene.surfaceKind, "equation");
  assert.deepEqual(scene.registry.entities.map((entity) => entity.id), ["before.x"]);
  assert.equal(scene.registry.displayFragments[0]?.semanticEntityId, "before.x");
  assert.deepEqual(scene.groups[0]?.memberEntityIds, ["before.x"]);
  assert.equal(scene.regions[0]?.role, "source");
});

test("DiagramScene projects through the same seam without promoting layout coordinates", () => {
  const diagram = createKpDiagramScene({
    id: "diagram.pipeline",
    title: "Pipeline",
    width: 640,
    height: 320,
    nodes: [
      { id: "node.a", selectorId: "selector.a", shape: "rectangle", x: 10, y: 20, width: 80, height: 40, label: "A" },
      { id: "node.b", selectorId: "selector.b", shape: "circle", x: 200, y: 20, width: 40, height: 40, label: "B" }
    ],
    edges: [{ id: "edge.ab", selectorId: "selector.edge-ab", sourceNodeId: "node.a", targetNodeId: "node.b", directed: true }],
    groups: [{ id: "group.pipeline", selectorId: "selector.group", nodeIds: ["node.a", "node.b"], label: "Pipeline", padding: 20 }],
    labels: []
  });
  const scene = projectKpDiagramSceneToSemanticScene(diagram);
  assert.equal(scene.surfaceKind, "diagram");
  assert.deepEqual(scene.relations[0]?.sourceEntityIds, ["selector.a"]);
  assert.deepEqual(scene.groups[0]?.memberEntityIds, ["selector.a", "selector.b"]);
  assert.equal(JSON.stringify(scene).includes('"x"'), false);
  assert.equal(JSON.stringify(scene).includes('"padding"'), false);
});

test("equation and diagram semantics compose without promoting either layout", () => {
  const equation = projectKpEquationTransitionStateToSemanticScene({
    ir: equationIr(),
    side: "source"
  });
  const diagram = projectKpDiagramSceneToSemanticScene(createKpDiagramScene({
    id: "diagram.input",
    title: "Input",
    width: 240,
    height: 120,
    nodes: [{
      id: "node.value",
      selectorId: "input.value",
      shape: "circle",
      x: 32,
      y: 24,
      width: 48,
      height: 48,
      label: "3"
    }],
    edges: [],
    groups: [],
    labels: []
  }));
  const mixed = composeKpSemanticScenes({
    id: "scene.mixed.input-equation",
    title: "Input and equation",
    scenes: [diagram, equation]
  });

  assert.equal(mixed.surfaceKind, "mixed");
  assert.deepEqual(mixed.registry.entities.map((entity) => entity.id), [
    "input.value",
    "before.x"
  ]);
  assert.equal(JSON.stringify(mixed).includes('"width"'), false);
  assert.equal(JSON.stringify(mixed).includes('"x":'), false);
});

test("scene transitions share authoritative lineage across surface adapters", () => {
  const ir = equationIr();
  const source = projectKpEquationTransitionStateToSemanticScene({ ir, side: "source" });
  const target = projectKpEquationTransitionStateToSemanticScene({ ir, side: "target" });
  const lineage = createKpSemanticLineageGraph({
    id: "lineage.x",
    sourceEntityIds: ["before.x"],
    targetEntityIds: ["after.x"],
    edges: [{
      id: "persist.x",
      relation: "persist",
      sourceEntityIds: ["before.x"],
      targetEntityIds: ["after.x"],
      summary: "x persists."
    }]
  });
  const transition = createKpSemanticSceneTransition({
    id: "scene-transition.x",
    source,
    target,
    correspondenceMap: ir.correspondenceMap,
    lineageGraph: lineage
  });
  assert.equal(transition.lineageGraph.edges[0]?.relation, "persist");
  assert.equal(transition.correspondenceMap.records[0]?.relation, "identity");
});

function equationIr() {
  return createKpEquationTransitionIr({
    id: "equation-transition.x",
    transformationId: "transform.x",
    transformType: "persist",
    title: "Persist x",
    source: [{
      objectId: "equation.before",
      latex: "x",
      selectors: [{ id: "before.x", kind: "semantic", semanticKind: "term", label: "x" }]
    }],
    target: [{
      objectId: "equation.after",
      latex: "x",
      selectors: [{ id: "after.x", kind: "semantic", semanticKind: "term", label: "x" }]
    }],
    correspondenceMap: {
      id: "correspondence.x",
      records: [{
        id: "persist.x",
        relation: "identity",
        sourceSelectorIds: ["before.x"],
        targetSelectorIds: ["after.x"],
        summary: "x persists."
      }]
    }
  });
}
