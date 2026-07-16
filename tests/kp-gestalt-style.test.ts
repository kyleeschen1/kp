import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpGestaltStyleCatalog,
  createKpGestaltStylePackage,
  serializeKpGestaltStylePackage,
  validateKpGestaltStylePackage,
  type KpGestaltStylePackageInput
} from "../src/animation/gestalt-style.ts";

const organicInput: KpGestaltStylePackageInput = {
  id: "kp.organic-subtle",
  version: "1.0.0",
  title: "KP Organic Subtle",
  channels: {
    path: {
      curvature: 0.58,
      diagonalPreference: 0.72,
      oppositeCornerPreference: 0.86
    },
    propagation: { strength: 0.5, staggerStrength: 0.42 },
    microMotion: { function: "identity-sine", amplitude: 0.12 },
    deformation: { tokenCeiling: 0.08, fragmentCeiling: 0.24 },
    cohesion: { strength: 0.82 },
    acceleration: { character: "organic" },
    focus: { profile: "flat", strength: 0.55 },
    depth: { enabled: false, strength: 0 },
    context: { dimming: 0.08 },
    pacing: { tempo: 0.52, recognitionDwell: 0.64 },
    opacity: { continuantFloor: 0.96 }
  },
  adaptation: {
    numericBounds: [
      { path: "path.curvature", minimum: 0.4, maximum: 0.8 },
      { path: "microMotion.amplitude", minimum: 0, maximum: 0.2 }
    ],
    lockedChannelPaths: ["microMotion.function", "acceleration.character"]
  },
  lawIds: ["style.organic-subtle.exact-calm-settlement"],
  requiredCapabilities: ["motion.path.arc", "motion.seek.direct-sampling"],
  optionalCapabilities: ["focus.depth.css-2_5d"],
  trustedPrimitiveIds: ["kp.primitive.arc", "kp.primitive.identity-micro-motion"],
  accessibilityProjectionIds: [
    "projection.full",
    "projection.reduced",
    "projection.static"
  ],
  conformance: {
    fixtureIds: ["fixture.function-wrap", "fixture.radical-rewrite"],
    resultIds: ["conformance.organic-subtle.v1"]
  },
  provenance: {
    author: "Kinetic Press",
    sourceRef: "docs/superpowers/specs/2026-07-16-phase-ordered-choreography-and-gestalt-styles-design.md",
    license: "internal"
  },
  integrity: `sha256:${"a".repeat(64)}`
};

test("gestalt style packages are exactly pinned, declarative, and fingerprinted", () => {
  const style = createKpGestaltStylePackage(organicInput);
  assert.equal(style.kind, "gestalt-style-package");
  assert.match(style.resolvedFingerprint, /^fnv1a64:[a-f0-9]{16}$/);
  assert.deepEqual(validateKpGestaltStylePackage(style), []);
});

test("style serialization and fingerprints are deterministic", () => {
  const first = createKpGestaltStylePackage(organicInput);
  const second = createKpGestaltStylePackage(structuredClone(organicInput));
  assert.equal(first.resolvedFingerprint, second.resolvedFingerprint);
  assert.equal(
    serializeKpGestaltStylePackage(first),
    serializeKpGestaltStylePackage(second)
  );
});

test("published versions are immutable within a catalog", () => {
  const first = createKpGestaltStylePackage(organicInput);
  const changed = createKpGestaltStylePackage({
    ...organicInput,
    title: "Mutated published style"
  });
  assert.throws(
    () => createKpGestaltStyleCatalog([first, changed]),
    /Published gestalt style kp\.organic-subtle@1\.0\.0 is immutable/
  );
});

test("style validation rejects ranges, unbounded channels, and raw keyframes", () => {
  const imported = {
    ...organicInput,
    version: "^1.0.0",
    channels: {
      ...organicInput.channels,
      path: {
        ...organicInput.channels.path!,
        curvature: 1.4
      }
    },
    keyframes: [{ transform: "translateX(20px)" }]
  } as KpGestaltStylePackageInput & { keyframes: unknown };
  const issues = validateKpGestaltStylePackage(imported);
  assert.ok(issues.some((issue) => issue.path === "version"));
  assert.ok(issues.some((issue) => issue.path === "channels.path.curvature"));
  assert.ok(issues.some((issue) => issue.path === "$.keyframes"));
});

test("style adaptation bounds contain published values and reject malformed ranges", () => {
  const issues = validateKpGestaltStylePackage({
    ...organicInput,
    adaptation: {
      numericBounds: [
        { path: "path.curvature", minimum: 0.6, maximum: 0.5 },
        { path: "microMotion.amplitude", minimum: 0.13, maximum: 0.2 }
      ],
      lockedChannelPaths: [
        "microMotion.function",
        "microMotion.function"
      ]
    }
  });
  assert.ok(issues.some((issue) =>
    issue.message.includes("ordered normalized values")
  ));
  assert.ok(issues.some((issue) =>
    issue.message.includes("falls outside its adaptation bounds")
  ));
  assert.ok(issues.some((issue) =>
    issue.message.includes("Duplicate categorical channel path")
  ));
});

test("base dependencies are exact and cannot self-reference", () => {
  const issues = validateKpGestaltStylePackage({
    ...organicInput,
    base: { id: organicInput.id, version: organicInput.version }
  });
  assert.deepEqual(issues, [{
    path: "base",
    message: "Gestalt style package cannot depend on itself."
  }]);
});

test("capability strength and accessibility projections are explicit", () => {
  const issues = validateKpGestaltStylePackage({
    ...organicInput,
    optionalCapabilities: [
      ...organicInput.optionalCapabilities,
      organicInput.requiredCapabilities[0]!
    ],
    accessibilityProjectionIds: []
  });
  assert.deepEqual(issues, [
    {
      path: "optionalCapabilities[1]",
      message:
        "Capability motion.path.arc cannot be both required and optional."
    },
    {
      path: "accessibilityProjectionIds",
      message: "Expected at least one pinned identifier."
    }
  ]);
});
