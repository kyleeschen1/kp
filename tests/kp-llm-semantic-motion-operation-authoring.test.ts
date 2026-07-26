import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpLlmAnimationDraftV2
} from "../src/animation/llm-animation-draft-v2-compiler.ts";
import {
  kpLlmAuthorCompilerBoundaryVersion,
  kpLlmAnimationDraftV2SchemaVersion,
  type KpLlmAnimationDraftV2
} from "../src/animation/llm-animation-draft-v2.ts";
import {
  createKpLlmSemanticMotionOperationCatalog
} from "../src/animation/llm-semantic-motion-operation-authoring.ts";

test("LLM authoring catalog binds promoted operations to existing semantic motifs", () => {
  const catalog = createKpLlmSemanticMotionOperationCatalog();
  const byId = new Map(catalog.operations.map((operation) => [operation.operationId, operation]));

  assert.deepEqual(catalog.operationPacks, [
    { packId: "kp.core", version: "1.0.0" },
    { packId: "kp.algebra", version: "0.1.0" },
    { packId: "kp.semantic-motion", version: "0.1.0" }
  ]);
  assert.equal(byId.get("kp.algebra.rewrite-power-as-root")?.visualMotif, "radical-corner-transfer");
  assert.equal(byId.get("kp.algebra.distribute-multiplication")?.visualMotif, "copy-fan-out");
  assert.equal(byId.get("kp.semantic-motion.derivative-power-rule")?.visualMotif, "derivative-power");
  assert.equal(byId.get("kp.semantic-motion.dot-product")?.visualMotif, "dot-product-accumulate");
  assert.equal(byId.get("kp.semantic-motion.matrix-vector")?.visualMotif, "matrix-row-compose");
  assert.equal(byId.get("kp.semantic-motion.matrix-matrix")?.visualMotif, "matrix-cell-compose");
  assert.deepEqual(
    byId.get("kp.semantic-motion.matrix-matrix")?.allowedLineageRelations,
    ["identity", "role-change", "fan-out", "fan-in"]
  );
  assert.equal(
    byId.get("kp.semantic-motion.matrix-matrix")?.ownershipMode,
    "fission-fusion"
  );
  assert.deepEqual(byId.get("kp.semantic-motion.matrix-matrix")?.pacing, {
    kind: "per-cell",
    unitRoleId: "result-cells"
  });
  assert.equal(
    byId.get("kp.semantic-motion.matrix-matrix")?.reverse.validity,
    "authored-history-only"
  );
  assert.ok(
    byId.get("kp.semantic-motion.matrix-matrix")?.cost.tokenRoleIds.includes(
      "result-cells"
    )
  );
  assert.deepEqual(
    byId.get("kp.semantic-motion.matrix-matrix")?.explanationDepths,
    ["compact", "standard", "expanded"]
  );
  assert.ok(catalog.operations.every((operation) => operation.roles.length > 0));
  assert.ok(catalog.operations.every((operation) => operation.semanticPhaseIds.length > 0));
  assert.deepEqual(catalog.prohibitedAuthoringFields.slice(0, 4), [
    "coordinates",
    "paths",
    "keyframes",
    "timing"
  ]);
  for (const field of [
    "durations",
    "motion primitives",
    "easing",
    "opacity",
    "styles and typography",
    "paint fragments",
    "geometry and bounds",
    "DOM",
    "SVG"
  ]) {
    assert.ok(catalog.prohibitedAuthoringFields.includes(field));
  }
});

test("LLM compiler resolves matrix composition into the promoted transform and core grammar", () => {
  const result = compileKpLlmAnimationDraftV2(matrixMatrixDraft());
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;

  const compiled = result.resolvedOperations[0]!;
  const { governance, ...resolved } = compiled;
  assert.deepEqual([resolved], [{
    kind: "llm-resolved-operation",
    derivationId: "derivation.generated.matrix-matrix",
    operationStepId: "operation.generated.matrix-matrix",
    operationId: "kp.semantic-motion.matrix-matrix",
    operationPack: { packId: "kp.semantic-motion", version: "0.1.0" },
    canonicalComposition: ["kp.core.persist", "kp.core.copy", "kp.core.merge"],
    sourceTransformType: "multiplyMatrices",
    roleBindings: {
      "left-rows": ["source.left-row-0", "source.left-row-1"],
      "right-columns": ["source.right-column-0", "source.right-column-1"],
      "cell-products": [
        "target.cell-product-0-0",
        "target.cell-product-0-1",
        "target.cell-product-1-0",
        "target.cell-product-1-1"
      ],
      "result-cells": [
        "target.result-cell-0-0",
        "target.result-cell-0-1",
        "target.result-cell-1-0",
        "target.result-cell-1-1"
      ]
    },
    lineageBindings: [{
      relation: "fan-in",
      sourceEntityIds: [
        "source.left-row-0",
        "source.left-row-1",
        "source.right-column-0",
        "source.right-column-1"
      ],
      targetEntityIds: [
        "target.cell-product-0-0",
        "target.cell-product-0-1",
        "target.cell-product-1-0",
        "target.cell-product-1-1",
        "target.result-cell-0-0",
        "target.result-cell-0-1",
        "target.result-cell-1-0",
        "target.result-cell-1-1"
      ]
    }],
    ownershipMode: "fission-fusion",
    explanationDepth: "expanded"
  }]);
  assert.equal(result.targetTrust, "provisional");
  assert.equal(result.epistemicBranches[0]?.status, "provisional");
  assert.deepEqual(governance.pacing, {
    kind: "per-cell",
    semanticUnitCount: 4
  });
  assert.equal(governance.cost.tokenCount, 12);
  assert.equal(governance.reverse.validity, "authored-history-only");
  assert.equal(governance.reverse.choreographyKind, "historical-reconstruction");
});

test("LLM target mathematics stays provisional unless external evidence authorizes it", () => {
  const student = matrixMatrixDraft();
  const selfAuthorized: KpLlmAnimationDraftV2 = {
    ...student,
    authoringContext: {
      ...student.authoringContext,
      targetMathAuthority: "trusted-source-evidence"
    }
  };
  const rejectedStudent = compileKpLlmAnimationDraftV2(selfAuthorized);
  assert.equal(rejectedStudent.status, "repair-required");
  assert.ok(rejectedStudent.status === "repair-required" &&
    rejectedStudent.diagnostics.some((item) =>
      /cannot self-authorize target mathematics/.test(item.message)
    ));

  const uploaded = matrixMatrixDraft();
  const unsupportedEvidence: KpLlmAnimationDraftV2 = {
    ...uploaded,
    authoringContext: {
      source: "uploaded-material",
      targetMathAuthority: "trusted-source-evidence",
      historicalReplayRequested: false
    }
  };
  const rejectedUpload = compileKpLlmAnimationDraftV2(unsupportedEvidence);
  assert.equal(rejectedUpload.status, "repair-required");
  assert.ok(rejectedUpload.status === "repair-required" &&
    rejectedUpload.diagnostics.some((item) =>
      /requires valid source evidence/.test(item.message)
    ));
});

test("uploaded incorrect mathematics compiles only as explicit historical replay", () => {
  const draft = matrixMatrixDraft();
  const target = draft.states[1]!;
  const historical: KpLlmAnimationDraftV2 = {
    ...draft,
    authoringContext: {
      source: "uploaded-material",
      targetMathAuthority: "requires-validation",
      historicalReplayRequested: true
    },
    states: [draft.states[0]!, {
      ...target,
      epistemic: {
        ...target.epistemic,
        status: "invalid",
        rationale: "The uploaded derivation records an incorrect product."
      }
    }]
  };
  const result = compileKpLlmAnimationDraftV2(historical);
  assert.equal(result.status, "accepted");
  assert.equal(result.status === "accepted" && result.targetTrust, "historical-replay");
  assert.equal(
    result.status === "accepted" && result.epistemicBranches[0]?.status,
    "historical-invalid"
  );
});

test("promoted operation role contracts reject missing semantic intermediates", () => {
  const draft = matrixMatrixDraft();
  const operation = draft.derivations[0]!.operations[0]!;
  const invalid: KpLlmAnimationDraftV2 = {
    ...draft,
    derivations: [{
      ...draft.derivations[0]!,
      operations: [{
        ...operation,
        roleBindings: {
          ...operation.roleBindings,
          "cell-products": []
        }
      }]
    }]
  };

  const result = compileKpLlmAnimationDraftV2(invalid);
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(result.gaps[0]?.reason, "missing-definition-binding");
  assert.match(result.diagnostics[0]?.path ?? "", /roleBindings\.cell-products$/);
  assert.match(result.diagnostics[0]?.message ?? "", /requires one-or-more; received 0/);
});

test("LLM operation intent cannot override registered lineage or ownership", () => {
  const draft = matrixMatrixDraft();
  const operation = draft.derivations[0]!.operations[0]!;
  const invalid = {
    ...draft,
    derivations: [{
      ...draft.derivations[0]!,
      operations: [{
        ...operation,
        ownershipMode: "continuant",
        lineageBindings: [{
          relation: "introduction",
          sourceEntityIds: operation.lineageBindings[0]!.sourceEntityIds,
          targetEntityIds: operation.lineageBindings[0]!.targetEntityIds
        }],
        explanationDepth: "cinematic"
      }]
    }]
  } as unknown as KpLlmAnimationDraftV2;
  const result = compileKpLlmAnimationDraftV2(invalid);
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.ok(result.diagnostics.some((diagnostic) =>
    diagnostic.path.endsWith(".ownershipMode") &&
    /requires fission-fusion ownership/.test(diagnostic.message)
  ));
  assert.ok(result.diagnostics.some((diagnostic) =>
    diagnostic.path.endsWith(".lineageBindings[0].relation") &&
    /does not permit introduction lineage/.test(diagnostic.message)
  ));
  assert.ok(result.diagnostics.some((diagnostic) =>
    diagnostic.path.endsWith(".explanationDepth")
  ));
});

function matrixMatrixDraft(): KpLlmAnimationDraftV2 {
  const sourceEntities = [
    entity("source.left-row-0", "matrix-row", "left row 0"),
    entity("source.left-row-1", "matrix-row", "left row 1"),
    entity("source.right-column-0", "matrix-column", "right column 0"),
    entity("source.right-column-1", "matrix-column", "right column 1")
  ];
  const cellProducts = [0, 1].flatMap((row) =>
    [0, 1].map((column) =>
      entity(
        `target.cell-product-${row}-${column}`,
        "dot-product-intermediate",
        `row ${row} dot column ${column}`
      )
    )
  );
  const resultCells = [0, 1].flatMap((row) =>
    [0, 1].map((column) =>
      entity(
        `target.result-cell-${row}-${column}`,
        "matrix-result-cell",
        `result cell ${row},${column}`
      )
    )
  );
  return {
    schemaVersion: kpLlmAnimationDraftV2SchemaVersion,
    authorCompilerBoundaryVersion: kpLlmAuthorCompilerBoundaryVersion,
    id: "animation.generated.matrix-matrix",
    title: "Generated matrix multiplication",
    authoringContext: {
      source: "student-prompt",
      targetMathAuthority: "requires-validation",
      historicalReplayRequested: false
    },
    operationPacks: [
      { packId: "kp.core", version: "1.0.0" },
      { packId: "kp.semantic-motion", version: "0.1.0" }
    ],
    states: [
      {
        id: "state.generated.matrix-matrix.source",
        title: "Two source matrices",
        surfaceKind: "equation",
        content: { latex: "\\begin{bmatrix}1&2\\\\3&4\\end{bmatrix}\\begin{bmatrix}2&0\\\\1&2\\end{bmatrix}" },
        entities: sourceEntities,
        epistemic: epistemic("state.generated.matrix-matrix.source", "state")
      },
      {
        id: "state.generated.matrix-matrix.target",
        title: "Composed result matrix",
        surfaceKind: "equation",
        content: { latex: "\\begin{bmatrix}4&4\\\\10&8\\end{bmatrix}" },
        entities: [...cellProducts, ...resultCells],
        epistemic: epistemic("state.generated.matrix-matrix.target", "state")
      }
    ],
    derivations: [{
      id: "derivation.generated.matrix-matrix",
      title: "Compose rows and columns",
      sourceStateIds: ["state.generated.matrix-matrix.source"],
      targetStateIds: ["state.generated.matrix-matrix.target"],
      operations: [{
        id: "operation.generated.matrix-matrix",
        operationId: "kp.semantic-motion.matrix-matrix",
        roleBindings: {
          "left-rows": ["source.left-row-0", "source.left-row-1"],
          "right-columns": ["source.right-column-0", "source.right-column-1"],
          "cell-products": cellProducts.map((item) => item.id),
          "result-cells": resultCells.map((item) => item.id)
        },
        lineageBindings: [{
          relation: "fan-in",
          sourceEntityIds: sourceEntities.map((item) => item.id),
          targetEntityIds: [
            ...cellProducts.map((item) => item.id),
            ...resultCells.map((item) => item.id)
          ]
        }],
        ownershipMode: "fission-fusion",
        explanationDepth: "expanded"
      }],
      provenance: { kind: "authored", sourceId: "prompt.matrix-matrix" },
      epistemic: epistemic("derivation.generated.matrix-matrix", "transition")
    }],
    saliencePlan: {
      id: "salience.generated.matrix-matrix",
      kind: "animation-salience-plan",
      intents: [{
        id: "salience.generated.matrix-matrix.results",
        kind: "reveal",
        targetEntityIds: resultCells.map((item) => item.id),
        disclosureId: "disclosure.generated.matrix-matrix.results",
        summary: "Reveal result cells in semantic row-major order."
      }]
    }
  };
}

function entity(id: string, semanticKind: string, label: string) {
  return {
    id,
    semanticKind,
    label,
    provenance: { kind: "authored" as const, sourceId: "prompt.matrix-matrix" }
  };
}

function epistemic(id: string, kind: "state" | "transition") {
  return {
    kind: "epistemic-annotation" as const,
    subject: { kind, id },
    status: "valid" as const,
    rationale: "The authored operation is intended as a valid derivation.",
    evidenceIds: [],
    disclosure: { trigger: { kind: "immediate" as const }, announce: false }
  };
}
