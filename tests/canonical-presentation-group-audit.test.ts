import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCanonicalPresentationAuditReport
} from "../src/editor/canonical-presentation-group-audit.ts";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createKpSemanticAnimationPreservationManifest
} from "../src/editor/semantic-animation-preservation-manifest.ts";

test("canonical presentation audit covers every preserved animation exactly once", () => {
  const report = createKpCanonicalPresentationAuditReport();
  const manifest = createKpSemanticAnimationPreservationManifest();

  assert.deepEqual(
    report.entries.map((entry) => entry.animationId),
    manifest.map((entry) => entry.animationId)
  );
  assert.equal(new Set(report.entries.map((entry) => entry.animationId)).size, 9);
  assert.equal(report.declaredTargetCount, 2);
  assert.equal(report.exemptTargetCount, 3);
  assert.equal(report.missingTargetCount, 4);
});

test("known radical residual blocks family promotion without hiding the exemplar", () => {
  const report = createKpCanonicalPresentationAuditReport();
  const radical = report.entries.find((entry) => entry.topic === "radical");

  assert.ok(radical);
  assert.equal(radical.status, "blocked");
  assert.deepEqual(radical.targets.map((target) => target.disposition), [
    "missing-contract"
  ]);
  assert.deepEqual(radical.residuals.map((residual) => residual.id), [
    "known-residual.radical.initial-fraction-handoff"
  ]);
  assert.ok(report.blockedAnimationIds.includes(radical.animationId));
});

test("only explicit contracts and justified exemptions pass the audit", () => {
  const report = createKpCanonicalPresentationAuditReport();
  const distribution = report.entries.find(
    (entry) => entry.topic === "distribution"
  );
  const matrix = report.entries.find(
    (entry) => entry.topic === "matrix-composition"
  );
  const trace = report.entries.find(
    (entry) => entry.topic === "program-trace"
  );

  assert.ok(distribution);
  assert.equal(distribution.status, "pass");
  assert.ok(distribution.targets.every(
    (target) => target.disposition === "declared-contract"
  ));
  const distributionTransformation = createKpAnimationAssets()
    .find((animation) => animation.id === distribution.animationId)
    ?.transformations[0];
  assert.ok(distributionTransformation);
  assert.ok(distribution.targets.every((target) =>
    target.declarationId?.startsWith(
      `${distributionTransformation.id}.distribution-choreography.product.`
    )
  ));

  assert.ok(matrix);
  assert.equal(matrix.status, "pass");
  assert.equal(
    matrix.targets[0]?.exemptionReason,
    "nonvisual-structure"
  );

  assert.ok(trace);
  assert.equal(trace.status, "pass");
  assert.deepEqual(trace.targets, []);
});
