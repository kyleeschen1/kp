import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  kpCrossDomainAnimationApiAudit
} from "../src/architecture/cross-domain-animation-api-audit.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

test("cross-domain API audit has unique ids and source-backed ownership", () => {
  assert.equal(
    new Set(kpCrossDomainAnimationApiAudit.map(({ id }) => id)).size,
    kpCrossDomainAnimationApiAudit.length
  );
  for (const entry of kpCrossDomainAnimationApiAudit) {
    assert.ok(entry.ownerPaths.length > 0, `${entry.id} needs an owner`);
    for (const path of [...entry.ownerPaths, ...entry.callerPaths]) {
      assert.ok(existsSync(join(projectRoot, path)), `${entry.id} references missing ${path}`);
    }
  }
});

test("shared promotion requires two structurally different approved callers", () => {
  const promoted = kpCrossDomainAnimationApiAudit.filter(
    ({ decision }) => decision === "promote-shared-contract"
  );
  assert.deepEqual(
    promoted.map(({ id }) => id),
    [
      "promotion.synchronized-model-projection-clock",
      "promotion.dimensional-continuity-graph-profile",
      "promotion.dynamic-exact-display-policy",
      "promotion.bounded-integer-query-codec"
    ]
  );
  for (const entry of promoted) {
    assert.deepEqual(entry.callerAnimationIds, [
      "animation.economics.supply-demand-equilibrium-shift",
      "animation.physics.constant-force-work-energy"
    ]);
    assert.ok(entry.preservationBoundary.length > 30);
  }
});

test("domain truth and renderer composition remain outside shared promotion", () => {
  const domainEntries = kpCrossDomainAnimationApiAudit.filter(
    ({ tier }) => tier === "domain-adapter"
  );
  assert.deepEqual(
    domainEntries.map(({ decision }) => decision),
    ["retain", "retain"]
  );
  assert.ok(
    domainEntries.every(({ callerAnimationIds }) => callerAnimationIds.length === 1)
  );
});

test("only zero-caller rendering motif facades are approved for retirement", () => {
  const retired = kpCrossDomainAnimationApiAudit.filter(
    ({ decision }) => decision === "retire-adjacent-facade"
  );
  assert.equal(retired.length, 1);
  assert.equal(retired[0]?.id, "compatibility.rendering-motif-facades");
  assert.deepEqual(retired[0]?.callerPaths, []);
  assert.match(retired[0]?.retirementCondition ?? "", /canonical motif owner/);
});

test("Jacobian Hessian remains a presentation candidate rather than inferred deletion", () => {
  const candidate = kpCrossDomainAnimationApiAudit.find(
    ({ id }) => id === "candidate.jacobian-hessian-presentation"
  );
  assert.equal(candidate?.tier, "retirement-candidate");
  assert.equal(candidate?.decision, "defer");
  assert.match(candidate?.preservationBoundary ?? "", /Do not delete/);
});
