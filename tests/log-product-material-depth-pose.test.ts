import assert from "node:assert/strict";
import test from "node:test";

import {
  sampleKpLogProductMaterialDepthPose
} from "../src/animation/log-product-material-depth-pose.ts";
import {
  kpLogProductMaterialRoleDefinitions
} from "../src/animation/log-product-material-depth-roles.ts";

const flatPose = {
  plane: "surface",
  normalizedDepth: 0,
  activity: 0
} as const;

test("flat and no-depth projections are exactly inert for every role verb", () => {
  for (const role of kpLogProductMaterialRoleDefinitions) {
    for (const verb of role.physicalVerbs) {
      for (const progress of [-1, 0, 0.2, 0.5, 0.8, 1, 2]) {
        assert.deepEqual(sampleKpLogProductMaterialDepthPose({
          mode: "flat",
          verb,
          progress
        }), flatPose);
        assert.deepEqual(sampleKpLogProductMaterialDepthPose({
          mode: "no-depth",
          verb,
          progress
        }), flatPose);
      }
    }
  }
});

test("material depth sampling is deterministic and bounded", () => {
  for (const role of kpLogProductMaterialRoleDefinitions) {
    for (const verb of role.physicalVerbs) {
      for (const progress of [-1, 0, 0.25, 0.5, 0.75, 1, 2]) {
        const request = { mode: "material", verb, progress } as const;
        const first = sampleKpLogProductMaterialDepthPose(request);
        const second = sampleKpLogProductMaterialDepthPose(request);
        assert.deepEqual(first, second);
        assert.ok(first.normalizedDepth >= -1);
        assert.ok(first.normalizedDepth <= 1);
        assert.ok(first.activity >= 0);
        assert.ok(first.activity <= 1);
      }
    }
  }
});

test("material verbs describe constrained surface, active, and subsurface travel", () => {
  assert.deepEqual(sampleKpLogProductMaterialDepthPose({
    mode: "material",
    verb: "activate",
    progress: 1
  }), {
    plane: "active",
    normalizedDepth: 1,
    activity: 1
  });
  assert.deepEqual(sampleKpLogProductMaterialDepthPose({
    mode: "material",
    verb: "impress",
    progress: 1
  }), {
    plane: "subsurface",
    normalizedDepth: -1,
    activity: 1
  });
  assert.deepEqual(sampleKpLogProductMaterialDepthPose({
    mode: "material",
    verb: "settle",
    progress: 1
  }), flatPose);
});
