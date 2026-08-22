import assert from "node:assert/strict";
import test from "node:test";

import {
  sampleKpSemanticMotionChoreography
} from "../src/domain-ir/semantic-motion-choreography-compiler.ts";
import {
  kpCanonicalCompiledLogProductSemanticMotion
} from "../src/semantic/log-product-semantic-motion.ts";
import {
  sampleKpLogProductMaterialDepthChoreography
} from "../src/animation/log-product-material-depth-choreography.ts";

function sample(progress: number) {
  return sampleKpSemanticMotionChoreography({
    choreography: kpCanonicalCompiledLogProductSemanticMotion,
    progress,
    direction: "forward"
  });
}

test("source application activates cohesively during orient", () => {
  const orient = kpCanonicalCompiledLogProductSemanticMotion.tracks.find(
    ({ eventId }) => eventId === "event.log-product.orient"
  )!;
  const midpoint = (orient.window.start + orient.window.end) / 2;
  const poses = sampleKpLogProductMaterialDepthChoreography({
    mode: "material",
    choreography: sample(midpoint)
  });

  assert.ok(
    poses["role.material.log-product.source-application"].normalizedDepth > 0
  );
  assert.ok(
    poses["role.material.log-product.source-application"].activity > 0
  );
  assert.deepEqual(
    poses["role.material.log-product.persistent-factor"],
    { plane: "surface", normalizedDepth: 0, activity: 0 }
  );
  assert.deepEqual(
    poses["role.material.log-product.target-application-syntax"],
    { plane: "surface", normalizedDepth: 0, activity: 0 }
  );
});

test("source application holds activation until source release begins", () => {
  const orient = kpCanonicalCompiledLogProductSemanticMotion.tracks.find(
    ({ eventId }) => eventId === "event.log-product.orient"
  )!;
  const release = kpCanonicalCompiledLogProductSemanticMotion.tracks.find(
    ({ eventId }) => eventId === "event.log-product.release-shells"
  )!;
  const between = (orient.window.end + release.window.start) / 2;
  const poses = sampleKpLogProductMaterialDepthChoreography({
    mode: "material",
    choreography: sample(between)
  });
  assert.deepEqual(
    poses["role.material.log-product.source-application"],
    { plane: "active", normalizedDepth: 1, activity: 1 }
  );
});

test("flat and no-depth choreography remain exact surface rest", () => {
  for (const mode of ["flat", "no-depth"] as const) {
    const poses = sampleKpLogProductMaterialDepthChoreography({
      mode,
      choreography: sample(0.5)
    });
    assert.ok(Object.values(poses).every((pose) =>
      pose.plane === "surface" &&
      pose.normalizedDepth === 0 &&
      pose.activity === 0
    ));
  }
});
