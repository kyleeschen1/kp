import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCanonicalPresentationAuditReport,
  gateKpCanonicalPresentationPromotion
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
  assert.deepEqual(
    gateKpCanonicalPresentationPromotion(radical),
    {
      schemaVersion: "kp.canonical-presentation-promotion-result.v1",
      animationId: radical.animationId,
      status: "blocked",
      promotable: false,
      declaredTargetCount: 0,
      exemptTargetCount: 0,
      diagnostics: [
        {
          code: "promotion.presentation.missing-contract",
          severity: "error",
          sourceId: "radical.complete-notation",
          message:
            "Compound target radical.complete-notation has no presentation-group contract or typed exemption."
        },
        {
          code: "promotion.presentation.known-residual",
          severity: "error",
          sourceId:
            "docs/project/decisions/2026-07-24-kp-radical-cross-renderer-handoff-residual.md",
          message:
            "Human review retains a small initial 1/2 jerk at the animation-specific DOM/KaTeX-to-WebGL ownership boundary."
        }
      ]
    }
  );
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
  assert.equal(
    gateKpCanonicalPresentationPromotion(distribution).promotable,
    true
  );

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
