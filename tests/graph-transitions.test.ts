import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createGraph3DTo2DTransitionDescriptor,
  createLinearMapVectorMotionSampler,
  createGraphSurfaceModeMotionPlan,
  createGraphSurfaceModeSampler,
  createGraphSurfaceModeTransition,
  createGraphSurfaceMorphTargets,
  interpolateGraphSurfaceModeTransition
} from "../src/rendering/graph-transitions.ts";
import {
  createDefaultGraph3DScene,
  type Graph3DObject
} from "../src/semantic/graph.ts";
import { deriveLinearMapFromMatrix } from "../src/semantic/linear-map.ts";
import { createMatrixObject } from "../src/semantic/matrix.ts";

test("createGraphSurfaceModeTransition resamples mesh and donut onto matching topology", () => {
  const scene = createDefaultGraph3DScene();
  const graph = scene[0] as Graph3DObject;
  const transition = createGraphSurfaceModeTransition(
    scene,
    graph,
    "mesh",
    "donut"
  );
  const channel = transition.channels[0];

  assert.equal(transition.sourceMode, "mesh");
  assert.equal(transition.targetMode, "donut");
  assert.equal(transition.uSampleCount, 37);
  assert.equal(transition.vSampleCount, 21);
  assert.equal(transition.materialCrossfade, true);
  assert.equal(transition.channels.length, 1);
  assert.equal(channel?.source.vertices.length, 777);
  assert.equal(channel?.target.vertices.length, 777);
  assert.equal(channel?.source.uv.length, 777);
  assert.deepEqual(channel?.source.uv[0], { u: 0, v: 0 });
  assert.deepEqual(channel?.source.uv.at(-1), { u: 1, v: 1 });
  assert.equal(channel?.source.role, "mesh");
  assert.equal(channel?.target.role, "donut");
  assert.equal(channel?.material.crossfade, true);
});

test("createGraphSurfaceModeTransition duplicates single-surface modes for hyperplane channels", () => {
  const scene = createDefaultGraph3DScene();
  const graph = scene[0] as Graph3DObject;
  const transition = createGraphSurfaceModeTransition(
    scene,
    graph,
    "mesh",
    "hyperplanes"
  );

  assert.equal(transition.channels.length, 2);
  assert.deepEqual(
    transition.channels.map((channel) => channel.source.surfaceId),
    ["saddle-surface", "saddle-surface"]
  );
  assert.deepEqual(
    transition.channels.map((channel) => channel.target.role),
    ["hyperplane-positive", "hyperplane-negative"]
  );
  assert.ok(
    transition.channels.every(
      (channel) =>
        channel.source.vertices.length === channel.target.vertices.length
    )
  );
});

test("createGraphSurfaceMorphTargets exposes current mode uv topology", () => {
  const scene = createDefaultGraph3DScene();
  const graph = {
    ...(scene[0] as Graph3DObject),
    surfaceMode: "donut" as const
  };
  const targets = createGraphSurfaceMorphTargets(scene, graph, graph.surfaceMode);
  const target = targets[0];

  assert.equal(targets.length, 1);
  assert.equal(target?.mode, "donut");
  assert.equal(target?.role, "donut");
  assert.equal(target?.uSampleCount, 37);
  assert.equal(target?.vSampleCount, 19);
  assert.equal(target?.vertices.length, 703);
  assert.equal(target?.uv.length, 703);
});

test("interpolateGraphSurfaceModeTransition samples visible intermediate vertices", () => {
  const scene = createDefaultGraph3DScene();
  const graph = scene[0] as Graph3DObject;
  const transition = createGraphSurfaceModeTransition(
    scene,
    graph,
    "mesh",
    "donut"
  );
  const frame = interpolateGraphSurfaceModeTransition(transition, 0.5);
  const source = transition.channels[0]?.source.vertices[10];
  const target = transition.channels[0]?.target.vertices[10];
  const midpoint = frame.channels[0]?.vertices[10];

  assert.equal(frame.progress, 0.5);
  assert.equal(frame.channels.length, 1);
  assert.equal(frame.channels[0]?.role, "donut");
  assert.equal(frame.channels[0]?.vertices.length, 777);
  assert.ok(source !== undefined);
  assert.ok(target !== undefined);
  assert.ok(midpoint !== undefined);
  assert.ok(Math.abs(midpoint.x - (source.x + target.x) / 2) < 1e-12);
  assert.ok(Math.abs(midpoint.y - (source.y + target.y) / 2) < 1e-12);
  assert.ok(Math.abs(midpoint.z - (source.z + target.z) / 2) < 1e-12);
});

test("graph surface mode sampler uses the shared animation clock contract", () => {
  const scene = createDefaultGraph3DScene();
  const graph = scene[0] as Graph3DObject;
  const transition = createGraphSurfaceModeTransition(
    scene,
    graph,
    "mesh",
    "donut"
  );
  const plan = createGraphSurfaceModeMotionPlan(graph, transition);
  const sampler = createGraphSurfaceModeSampler(transition, {
    planId: plan.id,
    timelineId: "graph-surface-mode"
  });
  const frame = sampler.sample(0.5);
  const rewindFrame = sampler.sample(0.5);
  const startFrame = sampler.sample(Number.NaN);
  const endFrame = sampler.sample(2);

  assert.equal(plan.rendererNeutral, true);
  assert.equal(plan.kind, "graph-surface-mode-transition");
  assert.deepEqual(plan.transformationRefs[0]?.preserves, [
    "identity",
    "structure"
  ]);
  assert.deepEqual(frame, rewindFrame);
  assert.equal(frame.planId, plan.id);
  assert.equal(frame.timelineId, "graph-surface-mode");
  assert.equal(frame.progress, 0.5);
  assert.equal(startFrame.progress, 0);
  assert.equal(endFrame.progress, 1);
});

test("linear map vector motion sampler exposes graph-readable diagnostics", () => {
  const matrix = createMatrixObject({
    id: "scale",
    label: "S",
    rows: [
      [2, 0],
      [0, 3]
    ]
  });
  const { object: linearMap } = deriveLinearMapFromMatrix(matrix, {
    id: "linear-map.scale"
  });
  const sampler = createLinearMapVectorMotionSampler(linearMap, [1, 2], {
    graphId: "xy-graph",
    planId: "scale-vector.plan",
    timelineId: "scale-vector.timeline",
    vectorId: "v"
  });
  const frame = sampler.sample(0.5);
  const rewindFrame = sampler.sample(0.5);
  const startFrame = sampler.sample(Number.NaN);
  const endFrame = sampler.sample(2);

  assert.deepEqual(frame, rewindFrame);
  assert.equal(frame.kind, "graph-vector-motion");
  assert.equal(frame.graphId, "xy-graph");
  assert.equal(frame.vectorId, "v");
  assert.equal(frame.linearMapId, "linear-map.scale");
  assert.equal(frame.progress, 0.5);
  assert.deepEqual(frame.sourceVector, [1, 2]);
  assert.deepEqual(frame.targetVector, [2, 6]);
  assert.deepEqual(frame.sampledVector, [1.5, 4]);
  assert.deepEqual(frame.displacement, [1, 4]);
  assert.equal(frame.diagnostics.sourceDimension, 2);
  assert.equal(frame.diagnostics.targetDimension, 2);
  assert.equal(frame.diagnostics.componentCount, 2);
  assert.equal(frame.diagnostics.displacementMagnitude, Math.sqrt(17));
  assert.deepEqual(startFrame.sampledVector, [1, 2]);
  assert.deepEqual(endFrame.sampledVector, [2, 6]);
});

test("linear map vector motion sampler rejects dimension mismatches", () => {
  const matrix = createMatrixObject({
    id: "scale",
    label: "S",
    rows: [
      [2, 0],
      [0, 3]
    ]
  });
  const { object: linearMap } = deriveLinearMapFromMatrix(matrix);

  assert.throws(
    () => createLinearMapVectorMotionSampler(linearMap, [1, 2, 3]),
    /expects a source vector of dimension 2/
  );
});

test("createGraph3DTo2DTransitionDescriptor faces the xy plane and fades z", () => {
  const scene = createDefaultGraph3DScene();
  const graph = scene[0] as Graph3DObject;
  const descriptor = createGraph3DTo2DTransitionDescriptor(scene, graph);

  assert.equal(descriptor.kind, "graph-3d-to-2d");
  assert.equal(descriptor.graphId, "saddle-orbit-graph");
  assert.deepEqual(descriptor.camera.from, graph.camera);
  assert.deepEqual(descriptor.camera.target, {
    ...graph.camera,
    azimuthDegrees: 0,
    elevationDegrees: -90
  });
  assert.equal(descriptor.camera.targetPlane, "xy");
  assert.deepEqual(descriptor.flatten, {
    fromZScale: 1,
    targetZ: 0,
    toZScale: 0
  });
  assert.deepEqual(
    descriptor.axes.map((axis) => ({
      orientation: axis.orientation,
      targetOpacity: axis.targetOpacity,
      targetVisibility: axis.targetVisibility
    })),
    [
      { orientation: "x", targetOpacity: 1, targetVisibility: "visible" },
      { orientation: "y", targetOpacity: 1, targetVisibility: "visible" },
      { orientation: "z", targetOpacity: 0, targetVisibility: "hidden" }
    ]
  );
});
