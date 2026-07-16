import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpGestaltAccessibilityFamily,
  validateKpGestaltAccessibilityFamily
} from "../src/animation/gestalt-accessibility.ts";
import type { KpResolvedGestaltStyle } from "../src/animation/gestalt-style-resolution.ts";

const style: KpResolvedGestaltStyle = {
  kind: "resolved-gestalt-style",
  pinnedStyle: { id: "kp.organic-subtle", version: "1.0.0" },
  selectedStyle: { id: "kp.organic-subtle", version: "1.0.0" },
  channels: {
    path: { curvature: 0.6, diagonalPreference: 0.7, oppositeCornerPreference: 0.8 },
    microMotion: { function: "identity-sine", amplitude: 0.12 },
    deformation: { tokenCeiling: 0.08, fragmentCeiling: 0.2 },
    focus: { profile: "flat", strength: 0.5 },
    depth: { enabled: true, strength: 0.3 }
  },
  appliedLayerIds: ["kp.organic-subtle@1.0.0"],
  diagnostics: [],
  fingerprint: "fnv1a64:0123456789abcdef"
};

test("accessibility compiler publishes the complete projection family", () => {
  const family = compileKpGestaltAccessibilityFamily({
    style,
    phaseIds: ["orient", "reflow", "act", "settle", "release"],
    traversalRankIds: ["rank.0", "rank.1", "rank.2"]
  });
  assert.deepEqual(
    family.projections.map((projection) => projection.kind),
    ["full", "reduced", "static", "narrated", "high-contrast", "no-depth", "keyboard", "rewind"]
  );
  assert.deepEqual(validateKpGestaltAccessibilityFamily(family), []);
});

test("reduced and static projections preserve causal checkpoints and traversal", () => {
  const family = compileKpGestaltAccessibilityFamily({
    style,
    phaseIds: ["orient", "reflow", "act", "settle", "release"],
    traversalRankIds: ["rank.0", "rank.1", "rank.2"]
  });
  for (const kind of ["reduced", "static"] as const) {
    const projection = family.projections.find((item) => item.kind === kind)!;
    assert.equal(projection.sampling, "semantic-checkpoints");
    assert.equal(projection.channels.microMotion?.amplitude, 0);
    assert.equal(projection.channels.deformation?.tokenCeiling, 0);
    assert.deepEqual(projection.preservesTraversalRankIds, ["rank.0", "rank.1", "rank.2"]);
  }
});

test("high contrast and no-depth projections do not use depth as meaning", () => {
  const family = compileKpGestaltAccessibilityFamily({
    style,
    phaseIds: ["orient", "act", "settle", "release"],
    traversalRankIds: ["rank.0"]
  });
  const contrast = family.projections.find((item) => item.kind === "high-contrast")!;
  const noDepth = family.projections.find((item) => item.kind === "no-depth")!;
  assert.equal(contrast.channels.focus?.strength, 1);
  assert.equal(contrast.channels.depth?.enabled, false);
  assert.equal(noDepth.channels.depth?.strength, 0);
});

test("validation rejects reduced motion that drops causal phases", () => {
  const family = compileKpGestaltAccessibilityFamily({
    style,
    phaseIds: ["orient", "reflow", "act", "settle", "release"],
    traversalRankIds: ["rank.0", "rank.1"]
  });
  const invalid = {
    ...family,
    projections: family.projections.map((projection) =>
      projection.kind === "reduced"
        ? { ...projection, preservesPhaseIds: ["act", "settle"] }
        : projection
    )
  };
  assert.ok(
    validateKpGestaltAccessibilityFamily(invalid)
      .some((issue) => issue.message.includes("changed causal phase order"))
  );
});
