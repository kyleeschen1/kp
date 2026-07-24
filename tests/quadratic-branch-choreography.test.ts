import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpQuadraticBranchChoreography,
  sampleKpQuadraticBranchChoreography
} from "../src/animation/quadratic-branch-choreography.ts";

const methods = [
  "method.quadratic.completing-square",
  "method.quadratic.formula"
] as const;

test("both methods use stable sign branches and native reunion", () => {
  for (const methodId of methods) {
    const choreography = createKpQuadraticBranchChoreography(methodId);
    assert.deepEqual(choreography.branchLabels, ["x = 2", "x = 3"]);
    assert.deepEqual(choreography.fission.targetEntityIds, [
      `branch.${methodId}.minus`,
      `branch.${methodId}.plus`
    ]);
    assert.deepEqual(choreography.fusion.targetEntityIds, [
      "katex.quadratic.solution-set.native"
    ]);
  }
});

test("ownership transfer is exclusive with no opacity-hidden geometry", () => {
  const choreography = createKpQuadraticBranchChoreography(methods[0]);
  for (let index = 0; index <= 100; index += 1) {
    const frame = sampleKpQuadraticBranchChoreography({
      choreography,
      progress: index / 100
    });
    assert.ok(frame.motion.sources.every(({ scale }) => scale > 0));
    assert.ok(frame.motion.targets.every(({ scale }) => scale > 0));
    const owners = [
      ...frame.motion.sources.filter(({ ownsMaterial }) => ownsMaterial),
      ...frame.motion.targets.filter(({ ownsMaterial }) => ownsMaterial)
    ];
    assert.equal(owners.length, frame.motion.ownership.ownerEntityIds.length);
  }
});

test("wide and narrow layouts retain positive branch separation", () => {
  const choreography = createKpQuadraticBranchChoreography(methods[0]);
  assert.ok(choreography.responsiveSeparation.wide > choreography.responsiveSeparation.narrow);
  assert.ok(choreography.responsiveSeparation.narrow > 0);
});

test("the endpoint belongs solely to the native solution set", () => {
  const choreography = createKpQuadraticBranchChoreography(methods[1]);
  const endpoint = sampleKpQuadraticBranchChoreography({
    choreography,
    progress: 1
  });
  assert.equal(endpoint.nativeEndpoint, true);
  assert.deepEqual(endpoint.motion.ownership.ownerEntityIds, [
    choreography.nativeSolutionSetId
  ]);
  assert.ok(endpoint.motion.sources.every(({ opacity }) => opacity === 0));
});

test("direct seek and rewind produce the same semantic choreography frame", () => {
  const choreography = createKpQuadraticBranchChoreography(methods[0]);
  for (const progress of [0, 0.2, 0.54, 0.55, 0.71, 1]) {
    const forward = sampleKpQuadraticBranchChoreography({
      choreography,
      progress
    });
    const rewind = sampleKpQuadraticBranchChoreography({
      choreography,
      progress: 1 - progress,
      direction: "rewind"
    });
    assert.deepEqual(rewind, forward);
  }
});

test("choreography is JSON-stable", () => {
  const choreography = createKpQuadraticBranchChoreography(methods[0]);
  assert.deepEqual(JSON.parse(JSON.stringify(choreography)), choreography);
});
