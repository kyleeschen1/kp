import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpOperationPresentationCertificate,
  evaluateKpOperationPresentationConformance,
  evaluateKpOperationPresentationCoverage,
  evaluateKpOperationPresentationMaterialRoles
} from "../src/animation/operation-presentation-certificate.ts";
import { createCanonicalKpQuadraticAnimation } from "../src/animation/quadratic-branching-asset.ts";
import { createCanonicalKpQuadraticSemanticFixture } from "../src/semantic/quadratic-branching-fixture.ts";
import { createCanonicalKpCompletingSquareAuthority } from "../src/semantic/quadratic-completing-square-authority.ts";

test("the rejected generic quadratic checkpoint projection cannot certify", () => {
  const animation = createCanonicalKpQuadraticAnimation();
  assert.ok(animation.animation.transformations.length > 0);
  assert.ok(animation.animation.transformations.every(
    ({ transformType }) => transformType === "quadraticSemanticCheckpoint"
  ));

  const certificate = rejectedGenericCheckpointCertificate();
  assert.deepEqual(evaluateKpOperationPresentationCoverage(certificate), []);
  assert.deepEqual(
    evaluateKpOperationPresentationMaterialRoles(certificate).map(
      ({ code, entityId }) => [code, entityId]
    ),
    [
      ["material-role.continuant-acted", "material.quadratic-term"],
      ["material-role.continuant-not-reflowed", "material.quadratic-term"],
      ["material-role.continuant-acted", "material.linear-term"],
      ["material-role.continuant-not-reflowed", "material.linear-term"],
      ["material-role.continuant-acted", "material.equality"],
      ["material-role.continuant-not-reflowed", "material.equality"]
    ]
  );
  assert.deepEqual(
    evaluateKpOperationPresentationConformance({
      certificate,
      motifRegistry: []
    }).map(({ code }) => code),
    [
      "presentation-motif.unregistered",
      "presentation-motif.unregistered",
      "presentation-motif.unregistered"
    ]
  );
});

function rejectedGenericCheckpointCertificate() {
  const authority = createCanonicalKpCompletingSquareAuthority(
    createCanonicalKpQuadraticSemanticFixture()
  );
  return createKpOperationPresentationCertificate({
    id: "certificate.quadratic.rejected-generic-checkpoints",
    authorityRefId: authority.id,
    timelineRefId: "timeline.quadratic.solution-branching.shared",
    authorityOperations: authority.rewrites.map((rewrite, semanticRank) => ({
      id: rewrite.id,
      semanticRank,
      canonicalOperationId: rewrite.operation
    })),
    materials: [
      {
        entityId: "material.quadratic-term",
        semanticRoleId: "quadratic-term",
        presentationRole: "continuant"
      },
      {
        entityId: "material.linear-term",
        semanticRoleId: "linear-term",
        presentationRole: "continuant"
      },
      {
        entityId: "material.equality",
        semanticRoleId: "equality",
        presentationRole: "continuant"
      },
      {
        entityId: "material.changed-state",
        semanticRoleId: "checkpoint-difference",
        presentationRole: "focal-operand"
      }
    ],
    spans: authority.rewrites.map((rewrite, index) => ({
      id: `span.rejected.${index}`,
      presentation: "atomic",
      representedOperationIds: [rewrite.id],
      sourceStateId: rewrite.sourceStateId,
      targetStateId: rewrite.targetStateId,
      motifId: "motif.generic-checkpoint-arc",
      phases: [{
        id: `phase.rejected.${index}.act`,
        phaseId: "act",
        activityKind: "execute-operation",
        // This records the observed bug: every matched token receives the arc.
        materialEntityIds: [
          "material.quadratic-term",
          "material.linear-term",
          "material.equality",
          "material.changed-state"
        ]
      }]
    }))
  });
}
