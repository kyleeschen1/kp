import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpOperationPresentationCertificate,
  evaluateKpOperationPresentationConformance,
  evaluateKpOperationPresentationCoverage,
  evaluateKpOperationPresentationMaterialRoles,
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

test("operation coverage accepts exact atomic and contiguous compound traces", () => {
  const atomic = createKpOperationPresentationCertificate(traceInput());
  assert.deepEqual(evaluateKpOperationPresentationCoverage(atomic), []);

  const compound = createKpOperationPresentationCertificate({
    ...traceInput(),
    spans: [{
      ...traceInput().spans[0]!,
      id: "span.compound",
      presentation: "compound",
      representedOperationIds: [
        "operation.balance",
        "operation.evaluate"
      ]
    }]
  });
  assert.deepEqual(evaluateKpOperationPresentationCoverage(compound), []);
});

test("operation coverage reports omissions, duplicates, and reordered work", () => {
  const base = createKpOperationPresentationCertificate(traceInput());
  const broken: KpOperationPresentationCertificate = {
    ...base,
    spans: [
      base.spans[1]!,
      base.spans[1]!
    ]
  };

  assert.deepEqual(
    evaluateKpOperationPresentationCoverage(broken).map(({ code }) => code),
    [
      "operation-coverage.missing",
      "operation-coverage.duplicate",
      "operation-coverage.presentation-order"
    ]
  );
});

test("compound coverage cannot skip an intervening authority operation", () => {
  const input = traceInput();
  const certificate = createKpOperationPresentationCertificate({
    ...input,
    authorityOperations: [
      input.authorityOperations[0]!,
      {
        id: "operation.middle",
        semanticRank: 1,
        canonicalOperationId: "canonical.middle"
      },
      {
        ...input.authorityOperations[1]!,
        semanticRank: 2
      }
    ],
    spans: [{
      ...input.spans[0]!,
      presentation: "compound",
      representedOperationIds: [
        "operation.balance",
        "operation.evaluate"
      ]
    }]
  });

  assert.deepEqual(
    evaluateKpOperationPresentationCoverage(certificate).map(
      ({ code }) => code
    ),
    [
      "operation-coverage.missing",
      "operation-coverage.presentation-order",
      "operation-coverage.noncontiguous-compound"
    ]
  );
});

test("material roles distinguish focal action from continuant reflow", () => {
  const certificate = createKpOperationPresentationCertificate({
    ...validInput(),
    spans: [{
      ...validInput().spans[0]!,
      phases: [
        {
          id: "phase.reflow",
          phaseId: "reflow",
          activityKind: "move-continuant",
          materialEntityIds: ["material.equality"]
        },
        validInput().spans[0]!.phases[0]!
      ]
    }]
  });

  assert.deepEqual(
    evaluateKpOperationPresentationMaterialRoles(certificate),
    []
  );
});

test("material-role laws reject arcing continuants and omitted focal ink", () => {
  const certificate = createKpOperationPresentationCertificate({
    ...validInput(),
    materials: [
      ...validInput().materials,
      {
        entityId: "material.unused",
        semanticRoleId: "role.unused",
        presentationRole: "structural"
      }
    ],
    spans: [{
      ...validInput().spans[0]!,
      phases: [{
        id: "phase.act",
        phaseId: "act",
        activityKind: "execute-operation",
        materialEntityIds: ["material.equality"]
      }]
    }]
  });

  assert.deepEqual(
    evaluateKpOperationPresentationMaterialRoles(certificate).map(
      ({ code, entityId }) => [code, entityId]
    ),
    [
      ["material-role.unused", "material.six"],
      ["material-role.continuant-acted", "material.equality"],
      ["material-role.continuant-not-reflowed", "material.equality"],
      ["material-role.unused", "material.unused"]
    ]
  );
});

test("introduced and structural material have incompatible action duties", () => {
  const certificate = createKpOperationPresentationCertificate({
    ...validInput(),
    materials: [
      {
        entityId: "material.result",
        semanticRoleId: "role.result",
        presentationRole: "introduced"
      },
      {
        entityId: "material.paren",
        semanticRoleId: "role.structure",
        presentationRole: "structural"
      }
    ],
    spans: [{
      ...validInput().spans[0]!,
      phases: [
        {
          id: "phase.reflow",
          phaseId: "reflow",
          activityKind: "reserve-space",
          materialEntityIds: ["material.result"]
        },
        {
          id: "phase.act",
          phaseId: "act",
          activityKind: "execute-operation",
          materialEntityIds: ["material.paren"]
        }
      ]
    }]
  });

  assert.deepEqual(
    evaluateKpOperationPresentationMaterialRoles(certificate).map(
      ({ code }) => code
    ),
    [
      "material-role.operation-result-not-acted",
      "material-role.structural-acted"
    ]
  );
});

test("phase and motif conformance accepts reflow before registered action", () => {
  const certificate = createKpOperationPresentationCertificate({
    ...validInput(),
    spans: [{
      ...validInput().spans[0]!,
      phases: [
        {
          id: "phase.reflow",
          phaseId: "reflow",
          activityKind: "move-continuant",
          materialEntityIds: ["material.equality"]
        },
        validInput().spans[0]!.phases[0]!
      ]
    }]
  });

  assert.deepEqual(evaluateKpOperationPresentationConformance({
    certificate,
    motifRegistry: [{
      motifId: "motif.equation.balance",
      canonicalOperationIds: ["canonical.equation.balance"]
    }]
  }), []);
});

test("phase conformance rejects late reflow and unreserved introduction", () => {
  const certificate = createKpOperationPresentationCertificate({
    ...validInput(),
    materials: [
      ...validInput().materials,
      {
        entityId: "material.result",
        semanticRoleId: "role.result",
        presentationRole: "introduced"
      }
    ],
    spans: [{
      ...validInput().spans[0]!,
      phases: [
        {
          id: "phase.act",
          phaseId: "act",
          activityKind: "execute-operation",
          materialEntityIds: ["material.six", "material.result"]
        },
        {
          id: "phase.late-reflow",
          phaseId: "reflow",
          activityKind: "move-continuant",
          materialEntityIds: ["material.equality"]
        }
      ]
    }]
  });

  assert.deepEqual(evaluateKpOperationPresentationConformance({
    certificate,
    motifRegistry: [{
      motifId: "motif.equation.balance",
      canonicalOperationIds: ["canonical.equation.balance"]
    }]
  }).map(({ code }) => code), [
    "presentation-phase.out-of-order",
    "presentation-phase.reflow-after-act",
    "presentation-phase.introduced-without-reservation"
  ]);
});

test("motif conformance rejects generic and incompatible motion", () => {
  const certificate = createKpOperationPresentationCertificate(validInput());

  assert.deepEqual(evaluateKpOperationPresentationConformance({
    certificate,
    motifRegistry: []
  }).map(({ code }) => code), [
    "presentation-motif.unregistered"
  ]);
  assert.deepEqual(evaluateKpOperationPresentationConformance({
    certificate,
    motifRegistry: [{
      motifId: "motif.equation.balance",
      canonicalOperationIds: ["canonical.factor"]
    }]
  }).map(({ code }) => code), [
    "presentation-motif.operation-mismatch"
  ]);
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

function traceInput() {
  const input = validInput();
  return {
    ...input,
    authorityOperations: [
      input.authorityOperations[0]!,
      {
        id: "operation.evaluate",
        semanticRank: 1,
        canonicalOperationId: "canonical.evaluate"
      }
    ],
    spans: [
      input.spans[0]!,
      {
        ...input.spans[0]!,
        id: "span.evaluate",
        representedOperationIds: ["operation.evaluate"],
        sourceStateId: "state.balanced",
        targetStateId: "state.evaluated",
        motifId: "motif.evaluate"
      }
    ]
  };
}
