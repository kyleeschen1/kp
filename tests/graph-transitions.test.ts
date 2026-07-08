import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createGraph3DTo2DTransitionDescriptor,
  createGraphSurfaceModeTransition,
  createGraphSurfaceMorphTargets
} from "../src/rendering/graph-transitions.ts";
import {
  createDefaultGraph3DScene,
  type Graph3DObject
} from "../src/semantic/graph.ts";

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
