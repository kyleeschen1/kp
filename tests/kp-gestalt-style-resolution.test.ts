import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpGestaltStyleCatalog,
  createKpGestaltStylePackage,
  type KpGestaltStylePackageInput
} from "../src/animation/gestalt-style.ts";
import {
  resolveKpGestaltStyle
} from "../src/animation/gestalt-style-resolution.ts";

const baseInput: KpGestaltStylePackageInput = {
  id: "kp.base-motion",
  version: "1.0.0",
  title: "Base Motion",
  channels: {
    path: {
      curvature: 0.3,
      diagonalPreference: 0.4,
      oppositeCornerPreference: 0.4
    },
    focus: { profile: "flat", strength: 0.4 }
  },
  adaptation: {
    numericBounds: [
      { path: "path.curvature", minimum: 0.1, maximum: 0.8 },
      { path: "path.diagonalPreference", minimum: 0.1, maximum: 0.9 },
      { path: "path.oppositeCornerPreference", minimum: 0.1, maximum: 1 },
      { path: "focus.strength", minimum: 0.2, maximum: 0.8 }
    ],
    lockedChannelPaths: ["focus.profile"]
  },
  lawIds: ["style.base.exact-settlement"],
  requiredCapabilities: [],
  optionalCapabilities: [],
  trustedPrimitiveIds: ["kp.primitive.direct"],
  accessibilityProjectionIds: ["projection.full"],
  conformance: {
    fixtureIds: ["fixture.base"],
    resultIds: ["result.base"]
  },
  provenance: { author: "KP", sourceRef: "spec", license: "internal" },
  integrity: `sha256:${"b".repeat(64)}`
};

const organicInput: KpGestaltStylePackageInput = {
  ...baseInput,
  id: "kp.organic-subtle",
  title: "Organic Subtle",
  base: { id: "kp.base-motion", version: "1.0.0" },
  channels: {
    path: {
      curvature: 0.6,
      diagonalPreference: 0.7,
      oppositeCornerPreference: 0.8
    },
    microMotion: { function: "identity-sine", amplitude: 0.1 }
  },
  adaptation: {
    numericBounds: [
      { path: "path.curvature", minimum: 0.5, maximum: 0.75 },
      { path: "path.diagonalPreference", minimum: 0.6, maximum: 0.85 },
      { path: "path.oppositeCornerPreference", minimum: 0.7, maximum: 1 },
      { path: "microMotion.amplitude", minimum: 0.05, maximum: 0.15 },
      { path: "focus.strength", minimum: 0.2, maximum: 0.8 }
    ],
    lockedChannelPaths: ["microMotion.function"]
  },
  lawIds: ["style.organic-subtle.exact-calm-settlement"],
  integrity: `sha256:${"c".repeat(64)}`
};

const catalog = createKpGestaltStyleCatalog([
  createKpGestaltStylePackage(baseInput),
  createKpGestaltStylePackage(organicInput)
]);

test("style resolution applies deterministic channel precedence", () => {
  const resolved = resolveKpGestaltStyle({
    pinnedStyle: { id: "kp.organic-subtle", version: "1.0.0" },
    catalog,
    project: {
      id: "project.override",
      channels: { path: { curvature: 0.65, diagonalPreference: 0.75, oppositeCornerPreference: 0.82 } }
    },
    animation: {
      id: "animation.override",
      channels: { focus: { profile: "elevated", strength: 0.5 } }
    },
    motif: {
      id: "motif.preference",
      channels: { path: { curvature: 0.7, diagonalPreference: 0.8, oppositeCornerPreference: 0.9 } }
    },
    accessibility: {
      id: "projection.no-depth",
      channels: { depth: { enabled: false, strength: 0 } }
    },
    motifConstraints: {
      id: "constraint.radical.opposite-corner",
      channels: { path: { curvature: 0.7, diagonalPreference: 0.8, oppositeCornerPreference: 1 } }
    }
  });
  assert.equal(resolved.channels.path?.oppositeCornerPreference, 1);
  assert.equal(resolved.channels.focus?.profile, "elevated");
  assert.equal(resolved.channels.depth?.enabled, false);
  assert.equal(resolved.diagnostics[0]?.code, "style.motif-constraint-applied");
  assert.match(resolved.fingerprint, /^fnv1a64:/);
});

test("same resolution inputs produce the same fingerprint", () => {
  const input = {
    pinnedStyle: { id: "kp.organic-subtle", version: "1.0.0" },
    catalog
  } as const;
  assert.equal(
    resolveKpGestaltStyle(input).fingerprint,
    resolveKpGestaltStyle(input).fingerprint
  );
});

test("viewer substitution selects another exact package without mutating the pin", () => {
  const resolved = resolveKpGestaltStyle({
    pinnedStyle: { id: "kp.organic-subtle", version: "1.0.0" },
    viewerSubstitution: { id: "kp.base-motion", version: "1.0.0" },
    catalog
  });
  assert.equal(resolved.pinnedStyle.id, "kp.organic-subtle");
  assert.equal(resolved.selectedStyle.id, "kp.base-motion");
  assert.equal(resolved.channels.path?.curvature, 0.3);
});

test("missing packages and base cycles produce typed diagnostics", () => {
  const missing = resolveKpGestaltStyle({
    pinnedStyle: { id: "kp.missing", version: "1.0.0" },
    catalog
  });
  assert.equal(missing.diagnostics[0]?.code, "style.missing-package");

  const cycleA = createKpGestaltStylePackage({
    ...baseInput,
    id: "kp.cycle-a",
    base: { id: "kp.cycle-b", version: "1.0.0" },
    integrity: `sha256:${"d".repeat(64)}`
  });
  const cycleB = createKpGestaltStylePackage({
    ...baseInput,
    id: "kp.cycle-b",
    base: { id: "kp.cycle-a", version: "1.0.0" },
    integrity: `sha256:${"e".repeat(64)}`
  });
  const cycle = resolveKpGestaltStyle({
    pinnedStyle: { id: "kp.cycle-a", version: "1.0.0" },
    catalog: createKpGestaltStyleCatalog([cycleA, cycleB])
  });
  assert.equal(cycle.diagnostics[0]?.code, "style.base-cycle");
});

test("runtime-imported style layers cannot override semantic choreography", () => {
  const resolved = resolveKpGestaltStyle({
    pinnedStyle: { id: "kp.organic-subtle", version: "1.0.0" },
    catalog,
    animation: {
      id: "animation.invalid",
      channels: {
        traversal: { order: ["wrong"] }
      } as never
    }
  });
  assert.deepEqual(
    resolved.diagnostics.filter((item) => item.code === "style.semantic-override"),
    [{
      code: "style.semantic-override",
      path: "animation.invalid.channels.traversal",
      severity: "error",
      message:
        "Gestalt style layer animation.invalid cannot override semantic choreography field traversal."
    }]
  );
  assert.equal(
    (resolved.channels as unknown as { traversal?: unknown }).traversal,
    undefined
  );
});

test("style layers remain inside the selected package adaptation family", () => {
  const resolved = resolveKpGestaltStyle({
    pinnedStyle: { id: "kp.organic-subtle", version: "1.0.0" },
    catalog,
    project: {
      id: "project.too-restrained",
      channels: {
        path: {
          curvature: 0.2,
          diagonalPreference: 0.3,
          oppositeCornerPreference: 0.4
        },
        microMotion: { function: "none", amplitude: 0.1 }
      }
    }
  });
  assert.equal(resolved.channels.path?.curvature, 0.6);
  assert.equal(resolved.channels.path?.diagonalPreference, 0.7);
  assert.equal(resolved.channels.microMotion?.function, "identity-sine");
  assert.equal(resolved.channels.microMotion?.amplitude, 0.1);
  assert.deepEqual(
    resolved.diagnostics.map((diagnostic) => diagnostic.code),
    [
      "style.adaptation-bound-exceeded",
      "style.adaptation-bound-exceeded",
      "style.adaptation-bound-exceeded",
      "style.locked-channel"
    ]
  );
});
