import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpOperationPresentationCertificate,
  validateKpOperationPresentationCertificate,
  type KpOperationPresentationCertificate
} from "../src/animation/operation-presentation-certificate.ts";

test("operation-presentation certificate is renderer-neutral and immutable by copy", () => {
  const input = validInput();
  const certificate = createKpOperationPresentationCertificate(input);

  assert.equal(
    certificate.kind,
    "kp-operation-presentation-certificate"
  );
  assert.equal(
    certificate.schemaVersion,
    "kp.operation-presentation-certificate.v1"
  );
  assert.deepEqual(
    certificate.spans[0]?.representedOperationIds,
    ["operation.balance"]
  );

  input.spans[0]!.representedOperationIds[0] = "mutated";
  input.spans[0]!.phases[0]!.materialEntityIds[0] = "mutated";
  assert.equal(
    certificate.spans[0]?.representedOperationIds[0],
    "operation.balance"
  );
  assert.equal(
    certificate.spans[0]?.phases[0]?.materialEntityIds[0],
    "material.six"
  );
  assert.doesNotMatch(JSON.stringify(certificate), /dom|svg|pixel|keyframe/i);
});

test("certificate rejects structurally invalid authority and material references", () => {
  const certificate: KpOperationPresentationCertificate = {
    ...createKpOperationPresentationCertificate(validInput()),
    spans: [{
      ...createKpOperationPresentationCertificate(validInput()).spans[0]!,
      representedOperationIds: ["operation.missing"],
      phases: [{
        id: "phase.act",
        phaseId: "act",
        activityKind: "execute-operation",
        materialEntityIds: ["material.missing"]
      }]
    }]
  };

  assert.deepEqual(
    validateKpOperationPresentationCertificate(certificate).map(
      ({ path }) => path
    ),
    [
      "spans[0].representedOperationIds[0]",
      "spans[0].phases[0].materialEntityIds[0]"
    ]
  );
});

test("atomic spans cannot silently claim compound operation coverage", () => {
  assert.throws(
    () => createKpOperationPresentationCertificate({
      ...validInput(),
      authorityOperations: [
        ...validInput().authorityOperations,
        {
          id: "operation.evaluate",
          semanticRank: 1,
          canonicalOperationId: "canonical.evaluate"
        }
      ],
      spans: [{
        ...validInput().spans[0]!,
        representedOperationIds: [
          "operation.balance",
          "operation.evaluate"
        ]
      }]
    }),
    /atomic span must represent exactly one operation/i
  );
});

function validInput() {
  return {
    id: "certificate.quadratic.balance",
    authorityRefId: "authority.quadratic.completing-square",
    timelineRefId: "timeline.quadratic",
    authorityOperations: [{
      id: "operation.balance",
      semanticRank: 0,
      canonicalOperationId: "canonical.equation.balance"
    }],
    materials: [
      {
        entityId: "material.six",
        semanticRoleId: "role.constant",
        presentationRole: "focal-operand" as const
      },
      {
        entityId: "material.equality",
        semanticRoleId: "role.equality",
        presentationRole: "continuant" as const
      }
    ],
    spans: [{
      id: "span.balance",
      presentation: "atomic" as const,
      representedOperationIds: ["operation.balance"],
      sourceStateId: "state.standard",
      targetStateId: "state.balanced",
      motifId: "motif.equation.balance",
      phases: [{
        id: "phase.act",
        phaseId: "act" as const,
        activityKind: "execute-operation" as const,
        materialEntityIds: ["material.six"]
      }]
    }]
  };
}
