import assert from "node:assert/strict";
import test from "node:test";

import type {
  KpAnimationCatalogueHealth
} from "../src/editor/animation-catalogue-health.ts";
import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import {
  projectKpAnimationCatalogueResultRows
} from "../src/editor/animation-catalogue-result-projection.ts";

const entries = createKpAnimationCatalogueProjection().entries;
const selectedAnimationId = "animation.dot-projection.basic";
const selectedHealth: KpAnimationCatalogueHealth = {
  schemaVersion: "kp.animation-catalogue-health.v1",
  kind: "animation-catalogue-health",
  animationId: selectedAnimationId,
  status: "ready",
  reasons: []
};

test("result projection shares fuzzy rows and keeps selected identity stable", () => {
  const selectedRows = projectKpAnimationCatalogueResultRows({
    entries,
    selectedAnimationId,
    selectedHealth
  });
  const fuzzyRows = projectKpAnimationCatalogueResultRows({
    entries,
    selectedAnimationId,
    selectedHealth,
    query: "slvx"
  });

  assert.equal(selectedRows.length, 45);
  assert.equal(selectedRows[0]?.entry.animationId, selectedAnimationId);
  assert.deepEqual(selectedRows[0], {
    entry: selectedRows[0]?.entry,
    selected: true,
    href: "/?artifact=animation.dot-projection.basic",
    domainLabel: "Linear Algebra",
    healthStatus: "ready",
    healthLabel: "Ready",
    healthEvidence: "selected-host"
  });
  assert.equal(
    fuzzyRows[0]?.entry.animationId,
    "animation.linear-solve.solve-x"
  );
  assert.equal(fuzzyRows[0]?.selected, false);
  assert.equal(fuzzyRows[0]?.healthStatus, "review");
  assert.equal(fuzzyRows[0]?.healthEvidence, "pending");
  assert.equal(Object.isFrozen(fuzzyRows), true);
});

test("result projection rejects health from a different selected asset", () => {
  assert.throws(() => projectKpAnimationCatalogueResultRows({
    entries,
    selectedAnimationId,
    selectedHealth: { ...selectedHealth, animationId: "animation.other" }
  }), /does not match selection/);
});
