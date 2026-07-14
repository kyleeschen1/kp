import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createSymbolicManipulationFamilyRegistry,
  symbolicManipulationFamilyById
} from "../src/animation/symbolic-manipulation-family-registry.ts";
import {
  validateKpSymbolicManipulationFamily
} from "../src/animation/symbolic-manipulation-family.ts";
import {
  createSymbolicManipulationFamilyAgendaRows
} from "../src/project-dashboard/symbolic-family-catalog.ts";
import {
  createSemanticAssetCatalogAgendaRows
} from "../src/project-dashboard/semantic-asset-catalog.ts";

test("symbolic manipulation family registry seeds the approved library families", () => {
  const families = createSymbolicManipulationFamilyRegistry();

  assert.deepEqual(
    families.map((family) => family.id),
    [
      "family.algebra.both-sides",
      "family.algebra.cancel-combine",
      "family.algebra.distribution-factoring",
      "family.algebra.fraction-simplification",
      "family.algebra.exponent-log-laws",
      "family.algebra.inequality",
      "family.calculus.derivative-rules",
      "family.calculus.integral-ftc",
      "family.calculus.taylor-local-linearization",
      "family.calculus.gradient-jacobian",
      "family.calculus.hessian-optimization",
      "family.linear-algebra.vector-add-scale",
      "family.linear-algebra.dot-projection",
      "family.linear-algebra.matrix-vector",
      "family.linear-algebra.matrix-matrix-composition",
      "family.linear-algebra.row-operations",
      "family.linear-algebra.determinant-inverse",
      "family.linear-algebra.basis-eigen"
    ]
  );
  assert.equal(
    families.find((family) => family.id === "family.linear-algebra.matrix-matrix-composition")
      ?.metadata?.["composition"],
    "matrix multiplication as composed dot products"
  );
});

test("algebra both-sides family promotes operation definitions and sample hooks", () => {
  const family = symbolicManipulationFamilyById("family.algebra.both-sides");

  assert.ok(family);
  assert.equal(family.status, "promoted");
  assert.deepEqual(
    family.objectRoles.map((role) => [
      role.id,
      role.objectType,
      role.selectorRoles.map((selector) => selector.id)
    ]),
    [
      [
        "equation.before",
        "equation",
        ["lhs.variable", "equals", "rhs.value"]
      ],
      [
        "equation.after",
        "equation",
        ["lhs.variable", "equals", "rhs.value", "operation.artifact"]
      ]
    ]
  );
  assert.deepEqual(
    family.transformationDefinitions.map((definition) => [
      definition.id,
      definition.transformType,
      definition.preserves,
      definition.lawRefs?.[0]?.id
    ]),
    [
      [
        "definition.symbolic.algebra.add-both-sides",
        "addBothSides",
        ["value", "structure"],
        "law.equation.add-both-sides"
      ],
      [
        "definition.symbolic.algebra.subtract-both-sides",
        "subtractBothSides",
        ["value", "structure"],
        "law.equation.subtract-both-sides"
      ],
      [
        "definition.symbolic.algebra.multiply-both-sides",
        "multiplyBothSides",
        ["value", "structure"],
        "law.equation.multiply-both-sides"
      ],
      [
        "definition.symbolic.algebra.divide-both-sides",
        "divideBothSides",
        ["value", "structure"],
        "law.equation.divide-both-sides"
      ]
    ]
  );
  assert.deepEqual(
    family.transformationDefinitions[1]?.correspondenceTemplates.map(
      (correspondence) => [
        correspondence.sourceSelectorRole,
        correspondence.targetSelectorRole,
        correspondence.preserves
      ]
    ),
    [
      ["lhs.variable", "lhs.variable", ["identity", "role"]],
      ["equals", "equals", ["identity", "role"]],
      ["rhs.value", "rhs.value", ["identity", "role"]]
    ]
  );
  assert.deepEqual(family.visualMotifs, [
    {
      id: "motif.algebra.both-sides.append-after-shift",
      motifKind: "append-after-shift",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.add-both-sides",
        "definition.symbolic.algebra.subtract-both-sides",
        "definition.symbolic.algebra.multiply-both-sides",
        "definition.symbolic.algebra.divide-both-sides"
      ],
      summary:
        "Persistent tokens shift first, then the operation artifact appears on both sides."
    }
  ]);
  assert.deepEqual(family.runtimeSamples, [
    {
      id: "sample.animation.solve-x.both-sides",
      animationId: "animation.solve-x",
      renderTargetKinds: ["equation"],
      transformationDefinitionIds: [
        "definition.symbolic.algebra.subtract-both-sides"
      ],
      summary: "Existing x + 3 = 7 animation exercises subtract-both-sides."
    }
  ]);
  assert.deepEqual(family.graphEquivalents, [
    {
      id: "graph.algebra.both-sides.solution-set",
      title: "Equation solution set is preserved",
      representationKind: "equation-graph",
      exactness: "qualitative",
      preserves: ["value"],
      lawRefs: [
        {
          id: "law.graph.solution-set-preservation",
          level: "qualitative"
        }
      ],
      sampleAssetIds: ["animation.solve-x"],
      summary:
        "Both-sides operations preserve the solution set even when the rendered equation changes."
    }
  ]);
  assert.deepEqual(family.generatedProblemHooks, [
    {
      id: "hook.generated.linear-solve.both-sides",
      fixtureFamilyId: "generated.linear-solve",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.add-both-sides",
        "definition.symbolic.algebra.subtract-both-sides",
        "definition.symbolic.algebra.multiply-both-sides",
        "definition.symbolic.algebra.divide-both-sides"
      ],
      summary:
        "Generated linear-solve traces can map add/subtract/multiply/divide both-sides steps to this family."
    }
  ]);
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("algebra cancel-combine family promotes inverse and like-term semantics", () => {
  const family = symbolicManipulationFamilyById("family.algebra.cancel-combine");

  assert.ok(family);
  assert.equal(family.status, "promoted");
  assert.deepEqual(
    family.objectRoles.map((role) => [
      role.id,
      role.objectType,
      role.selectorRoles.map((selector) => selector.id)
    ]),
    [
      [
        "expression.before",
        "expression",
        [
          "context.persistent",
          "inverse.left",
          "inverse.operator",
          "inverse.right",
          "like.coefficient.left",
          "like.factor.left",
          "like.operator",
          "like.coefficient.right",
          "like.factor.right"
        ]
      ],
      [
        "expression.after",
        "expression",
        [
          "context.persistent",
          "like.coefficient.combined",
          "like.factor.combined"
        ]
      ]
    ]
  );
  assert.deepEqual(
    family.transformationDefinitions.map((definition) => [
      definition.id,
      definition.transformType,
      definition.preserves,
      definition.lawRefs?.[0]?.id
    ]),
    [
      [
        "definition.symbolic.algebra.cancel-additive-inverses",
        "cancelAdditiveInverses",
        ["value"],
        "law.algebra.additive-inverse-cancellation"
      ],
      [
        "definition.symbolic.algebra.cancel-multiplicative-inverses",
        "cancelMultiplicativeInverses",
        ["value"],
        "law.algebra.multiplicative-inverse-cancellation"
      ],
      [
        "definition.symbolic.algebra.combine-like-terms",
        "combineLikeTerms",
        ["value", "structure"],
        "law.algebra.combine-like-terms"
      ]
    ]
  );
  assert.deepEqual(
    family.transformationDefinitions[2]?.correspondenceTemplates.map(
      (correspondence) => [
        correspondence.sourceSelectorRole,
        correspondence.targetSelectorRole,
        correspondence.preserves
      ]
    ),
    [
      ["context.persistent", "context.persistent", ["identity", "role"]],
      ["like.coefficient.left", "like.coefficient.combined", ["role"]],
      ["like.factor.left", "like.factor.combined", ["identity", "role"]],
      ["like.coefficient.right", "like.coefficient.combined", ["role"]],
      ["like.factor.right", "like.factor.combined", ["identity", "role"]]
    ]
  );
  assert.deepEqual(family.visualMotifs, [
    {
      id: "motif.algebra.cancel-combine.midpoint-vanish",
      motifKind: "midpoint-vanish",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.cancel-additive-inverses",
        "definition.symbolic.algebra.cancel-multiplicative-inverses"
      ],
      summary:
        "Inverse tokens move to their midpoint, shrink together, then fade once overlapped.",
      metadata: {
        reversible: true,
        reverseMotifKind: "emerge-from-midpoint"
      }
    },
    {
      id: "motif.algebra.cancel-combine.coalesce-replacement",
      motifKind: "coalesce-replacement",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.combine-like-terms"
      ],
      summary:
        "Like terms converge to a shared point while the replacement term grows from that point on rewindable timing.",
      metadata: {
        reversible: true
      }
    }
  ]);
  assert.deepEqual(family.runtimeSamples, [
    {
      id: "sample.animation.solve-x.cancel-additive-inverses",
      animationId: "animation.solve-x",
      renderTargetKinds: ["equation"],
      transformationDefinitionIds: [
        "definition.symbolic.algebra.cancel-additive-inverses"
      ],
      summary:
        "Existing x + 3 - 3 cancellation exercises additive inverse vanish."
    }
  ]);
  assert.deepEqual(family.graphEquivalents, [
    {
      id: "graph.algebra.cancel-combine.expression-value",
      title: "Expression value is preserved",
      representationKind: "expression-evaluation",
      exactness: "exact",
      preserves: ["value"],
      lawRefs: [
        {
          id: "law.graph.expression-value-preservation",
          level: "strict"
        }
      ],
      sampleAssetIds: ["animation.solve-x"],
      summary:
        "Cancellation and combine-like-terms keep equivalent expressions or equation sides on the same value trace."
    }
  ]);
  assert.deepEqual(family.generatedProblemHooks, [
    {
      id: "hook.generated.linear-simplify.cancel-combine",
      fixtureFamilyId: "generated.linear-simplify",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.cancel-additive-inverses",
        "definition.symbolic.algebra.cancel-multiplicative-inverses",
        "definition.symbolic.algebra.combine-like-terms"
      ],
      summary:
        "Generated simplification traces can map inverse-pair cancellation and like-term combination to this family."
    }
  ]);
  assert.deepEqual(family.flashcardHooks, [
    {
      id: "hook.flashcard.algebra.cancel-combine.predict-next",
      kind: "predict-next",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.cancel-additive-inverses",
        "definition.symbolic.algebra.cancel-multiplicative-inverses",
        "definition.symbolic.algebra.combine-like-terms"
      ],
      summary:
        "Predict-next cards can ask which inverse pair vanishes or which like terms combine next."
    }
  ]);
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("symbolic manipulation family dashboard rows expose comparable readiness fields", () => {
  const rows = createSymbolicManipulationFamilyAgendaRows("");

  assert.equal(rows.length, 18);
  assert.deepEqual(rows[0], {
    id: "symbolic-family-algebra-both-sides",
    title: "Both-sides equation operations",
    summary:
      "Promoted symbolic manipulation family for algebra: add, subtract, multiply, and divide both sides while preserving equality.",
    status: "active",
    detail: "symbolic family",
    kind: "protocol-api",
    depth: 0,
    tags: [
      "symbolic-family",
      "algebra",
      "promoted",
      "equation",
      "inverse-operation",
      "generated-problem"
    ],
    dataAttributes: [
      ["data-kp-symbolic-family", "family.algebra.both-sides"],
      ["data-kp-symbolic-family-domain", "algebra"],
      ["data-kp-symbolic-family-status", "promoted"]
    ],
    relatedIds: [
      "family.algebra.both-sides",
      "run-contract.kp.animation.symbolic-manipulation-library-v0"
    ],
    previewFields: [
      { label: "Symbolic family", value: "family.algebra.both-sides" },
      { label: "Domain", value: "algebra" },
      { label: "Family status", value: "promoted" },
      { label: "Object roles", value: "2" },
      { label: "Transform definitions", value: "4" },
      { label: "Visual motifs", value: "1" },
      { label: "Runtime samples", value: "1" },
      { label: "Graph equivalents", value: "1" },
      { label: "Generated problem hooks", value: "1" },
      { label: "Flashcard hooks", value: "0" },
      { label: "Validation", value: "passed" }
    ],
    searchFields: [
      "semantic asset catalog",
      "symbolic manipulation family catalog",
      "symbolic family",
      "family.algebra.both-sides",
      "Both-sides equation operations",
      "algebra",
      "promoted",
      "equation",
      "inverse-operation",
      "generated-problem",
      "add, subtract, multiply, and divide both sides while preserving equality",
      "graph-equivalent:equation-graph",
      "flashcard-ready:false",
      "generated-problem-ready:true"
    ]
  });
});

test("symbolic family rows are searchable through the semantic asset catalog", () => {
  assert.deepEqual(
    createSymbolicManipulationFamilyAgendaRows(
      "matrix multiplication dot products"
    ).map((row) => row.id),
    ["symbolic-family-linear-algebra-matrix-matrix-composition"]
  );
  assert.deepEqual(
    createSemanticAssetCatalogAgendaRows(
      "symbolic family hessian curvature graph-equivalent"
    ).map((row) => row.id),
    ["symbolic-family-calculus-hessian-optimization"]
  );
});
