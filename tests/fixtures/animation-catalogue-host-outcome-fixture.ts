import assert from "node:assert/strict";

import {
  createKpAnimationCatalogueProjection
} from "../../src/editor/animation-catalogue-projection.ts";
import type {
  KpAnimationCatalogueSurfaceHostability
} from "../../src/editor/animation-catalogue-surface-hostability.ts";

export function createKpAnimationCatalogueHostOutcomeFixture() {
  const entry = createKpAnimationCatalogueProjection().entries.find(
    ({ animationId }) => animationId === "animation.linear-solve.solve-x"
  );
  assert.ok(entry);
  const hostability: KpAnimationCatalogueSurfaceHostability = {
    schemaVersion: "kp.animation-catalogue-surface-hostability.v1",
    kind: "animation-catalogue-surface-hostability",
    descriptorId: entry.primaryDescriptorId,
    animationId: entry.animationId,
    surfaceKind: "equation",
    status: "ready",
    slots: [{
      slotKind: "equation",
      status: "ready",
      adapterId: "editor-animation-surface.equation.katex"
    }],
    unsupportedTargetKinds: []
  };
  return { entry, hostability };
}
