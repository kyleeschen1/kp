import assert from "node:assert/strict";
import test from "node:test";
import {
  createKpDiagramScene,
  createKpDiagramSceneSemanticObject,
  createKpDiagramSceneTransition,
  validateKpDiagramScene
} from "../src/semantic/diagram-scene.ts";
import { createKpEditorAnimationDescriptor } from "../src/editor/animation-descriptor.ts";
import { dispatchKpEditorAnimationSurface } from "../src/editor/animation-surface-dispatch.ts";

const source = createKpDiagramScene({
  id: "diagram.flow.before",
  title: "Input flow",
  width: 640,
  height: 360,
  nodes: [
    { id: "node.input", selectorId: "before.input", shape: "rectangle", x: 80, y: 140, width: 120, height: 64, label: "Input" },
    { id: "node.output", selectorId: "before.output", shape: "rectangle", x: 440, y: 140, width: 120, height: 64, label: "Output" }
  ],
  edges: [
    { id: "edge.flow", selectorId: "before.flow", sourceNodeId: "node.input", targetNodeId: "node.output", directed: true }
  ],
  groups: [
    { id: "group.system", selectorId: "before.system", nodeIds: ["node.input", "node.output"], label: "System", padding: 24 }
  ],
  labels: [
    { id: "label.flow", selectorId: "before.flow-label", targetId: "edge.flow", text: "transforms", placement: "above" }
  ]
});

test("DiagramScene retains nodes, edges, groups, labels, and semantic selectors", () => {
  assert.deepEqual(validateKpDiagramScene(source), []);
  const object = createKpDiagramSceneSemanticObject(source);
  assert.equal(object.objectType, "diagram-scene");
  assert.deepEqual(object.selectors.map((selector) => selector.kind), [
    "diagram-node",
    "diagram-node",
    "diagram-edge",
    "diagram-group",
    "diagram-label"
  ]);
});

test("DiagramScene transition requires total semantic correspondence", () => {
  const target = createKpDiagramScene({
    ...source,
    id: "diagram.flow.after",
    title: "Resolved flow",
    nodes: source.nodes.map((node) => ({ ...node, selectorId: node.selectorId.replace("before", "after") })),
    edges: source.edges.map((edge) => ({ ...edge, selectorId: edge.selectorId.replace("before", "after") })),
    groups: source.groups.map((group) => ({ ...group, selectorId: group.selectorId.replace("before", "after") })),
    labels: source.labels.map((label) => ({ ...label, selectorId: label.selectorId.replace("before", "after") }))
  });
  const transition = createKpDiagramSceneTransition({
    id: "diagram-transition.flow",
    source,
    target,
    correspondenceMap: {
      id: "correspondence.flow",
      records: createKpDiagramSceneSemanticObject(source).selectors.map((selector, index) => ({
        id: `identity.${index}`,
        relation: "identity" as const,
        sourceSelectorIds: [selector.id],
        targetSelectorIds: [selector.id.replace("before", "after")],
        summary: `${selector.label} persists.`
      }))
    }
  });
  assert.equal(transition.correspondenceMap.records.length, 5);
});

test("DiagramScene reports invalid references and dispatches to a diagram surface", () => {
  const invalid = {
    ...source,
    edges: [{ ...source.edges[0]!, targetNodeId: "node.missing" }]
  };
  assert.match(validateKpDiagramScene(invalid)[0]?.message ?? "", /Unknown diagram node/);

  const descriptor = createKpEditorAnimationDescriptor({
    animationId: "animation.diagram.flow",
    title: "Flow",
    summary: "Semantic flow diagram",
    renderTargetKinds: ["diagram"]
  });
  assert.equal(dispatchKpEditorAnimationSurface(descriptor).kind, "diagram");
  assert.deepEqual(dispatchKpEditorAnimationSurface(descriptor).slotKinds, ["diagram"]);
});
