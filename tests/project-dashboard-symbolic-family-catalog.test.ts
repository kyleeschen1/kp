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
  createSymbolicManipulationLibraryProgressRows,
  createSymbolicManipulationFamilyAgendaRows,
  createSymbolicManipulationFamilyFlashcardProjectionRows
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
      animationId: "animation.linear-solve.solve-x",
      availability: "concrete",
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
      sampleAssetIds: ["animation.linear-solve.solve-x"],
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
  assert.deepEqual(family.flashcardHooks, [
    {
      id: "hook.flashcard.algebra.both-sides.predict-next",
      kind: "predict-next",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.add-both-sides",
        "definition.symbolic.algebra.subtract-both-sides",
        "definition.symbolic.algebra.multiply-both-sides",
        "definition.symbolic.algebra.divide-both-sides"
      ],
      summary:
        "Predict-next cards can ask which operation isolates or preserves the equation next."
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
      animationId: "animation.linear-solve.solve-x",
      availability: "concrete",
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
      sampleAssetIds: ["animation.linear-solve.solve-x"],
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

test("algebra distribution-factoring family models copied and grouped artifacts", () => {
  const family = symbolicManipulationFamilyById(
    "family.algebra.distribution-factoring"
  );

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
        "expression.factored",
        "expression",
        [
          "context.persistent",
          "factor.shared",
          "product.operator",
          "group.open",
          "group.term.left",
          "group.operator",
          "group.term.right",
          "group.close"
        ]
      ],
      [
        "expression.distributed",
        "expression",
        [
          "context.persistent",
          "factor.left.copy",
          "product.operator.left",
          "term.left",
          "distributed.operator",
          "factor.right.copy",
          "product.operator.right",
          "term.right"
        ]
      ]
    ]
  );
  assert.deepEqual(
    family.transformationDefinitions.map((definition) => [
      definition.id,
      definition.transformType,
      definition.sourceObjectRoles,
      definition.targetObjectRoles,
      definition.lawRefs?.[0]?.id
    ]),
    [
      [
        "definition.symbolic.algebra.distribute-product-over-sum",
        "distributeProductOverSum",
        ["expression.factored"],
        ["expression.distributed"],
        "law.algebra.distribution"
      ],
      [
        "definition.symbolic.algebra.factor-common-term",
        "factorCommonTerm",
        ["expression.distributed"],
        ["expression.factored"],
        "law.algebra.common-factor"
      ]
    ]
  );
  assert.deepEqual(
    family.transformationDefinitions[0]?.correspondenceTemplates.map(
      (correspondence) => [
        correspondence.sourceSelectorRole,
        correspondence.targetSelectorRole,
        correspondence.preserves
      ]
    ),
    [
      ["context.persistent", "context.persistent", ["identity", "role"]],
      ["factor.shared", "factor.left.copy", ["value", "role"]],
      ["factor.shared", "factor.right.copy", ["value", "role"]],
      ["group.term.left", "term.left", ["identity", "role"]],
      ["group.operator", "distributed.operator", ["identity", "role"]],
      ["group.term.right", "term.right", ["identity", "role"]]
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
      ["context.persistent", "context.persistent", ["identity", "role"]],
      ["factor.left.copy", "factor.shared", ["value", "role"]],
      ["factor.right.copy", "factor.shared", ["value", "role"]],
      ["term.left", "group.term.left", ["identity", "role"]],
      ["distributed.operator", "group.operator", ["identity", "role"]],
      ["term.right", "group.term.right", ["identity", "role"]]
    ]
  );
  assert.deepEqual(family.visualMotifs, [
    {
      id: "motif.algebra.distribution-factoring.copy-sweep",
      motifKind: "copy-sweep",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.distribute-product-over-sum"
      ],
      summary:
        "The shared factor yields two value-preserving copies that sweep into each distributed product while grouping artifacts fade away.",
      metadata: {
        reversible: true,
        inverseMotifKind: "group-wrap"
      }
    },
    {
      id: "motif.algebra.distribution-factoring.group-wrap",
      motifKind: "group-wrap",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.factor-common-term"
      ],
      summary:
        "Matching factor copies reconcile into one shared factor, then grouping artifacts wrap the remaining sum.",
      metadata: {
        reversible: true,
        inverseMotifKind: "copy-sweep"
      }
    }
  ]);
  assert.deepEqual(family.runtimeSamples, [
    {
      id: "sample.animation.distribution-factoring.basic",
      animationId: "animation.distribution-factoring.basic",
      renderTargetKinds: ["equation"],
      transformationDefinitionIds: [
        "definition.symbolic.algebra.distribute-product-over-sum",
        "definition.symbolic.algebra.factor-common-term"
      ],
      summary:
        "Basic a(b + c) and ab + ac sample exercises distribution and factoring as reversible views."
    }
  ]);
  assert.deepEqual(family.graphEquivalents, [
    {
      id: "graph.algebra.distribution-factoring.area-model",
      title: "Area model preserves total area",
      representationKind: "area-model",
      exactness: "exact",
      preserves: ["value", "structure"],
      lawRefs: [
        {
          id: "law.graph.area-distribution",
          level: "strict"
        }
      ],
      sampleAssetIds: ["animation.distribution-factoring.basic"],
      summary:
        "Distribution splits one rectangle into pieces while factoring regroups equal total area."
    }
  ]);
  assert.deepEqual(family.generatedProblemHooks, [
    {
      id: "hook.generated.algebra-expand-factor.distribution",
      fixtureFamilyId: "generated.algebra-expand-factor",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.distribute-product-over-sum",
        "definition.symbolic.algebra.factor-common-term"
      ],
      summary:
        "Generated expand/factor traces can map copied factors, grouped terms, and artifact wrappers to this family."
    }
  ]);
  assert.deepEqual(family.flashcardHooks, [
    {
      id: "hook.flashcard.algebra.distribution-factoring.relationship",
      kind: "relationship",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.distribute-product-over-sum",
        "definition.symbolic.algebra.factor-common-term"
      ],
      summary:
        "Relationship cards can ask which distributed factors reconcile into a shared factor."
    }
  ]);
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("algebra fraction simplification family covers bars, copies, and reciprocal swaps", () => {
  const family = symbolicManipulationFamilyById(
    "family.algebra.fraction-simplification"
  );

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
        "fraction.before",
        "fraction",
        [
          "numerator",
          "fraction.bar",
          "denominator",
          "common.factor.numerator",
          "common.factor.denominator"
        ]
      ],
      [
        "fraction.after",
        "fraction",
        [
          "numerator",
          "fraction.bar",
          "denominator",
          "operation.artifact",
          "denominator.copy"
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
        "definition.symbolic.algebra.split-fraction-sum",
        "splitFractionSum",
        ["value", "structure"],
        "law.algebra.fraction-sum-split"
      ],
      [
        "definition.symbolic.algebra.merge-fractions",
        "mergeFractions",
        ["value", "structure"],
        "law.algebra.fraction-sum-merge"
      ],
      [
        "definition.symbolic.algebra.cancel-common-factor",
        "cancelCommonFactor",
        ["value"],
        "law.algebra.fraction-common-factor"
      ],
      [
        "definition.symbolic.algebra.create-common-denominator",
        "createCommonDenominator",
        ["value", "structure"],
        "law.algebra.common-denominator"
      ],
      [
        "definition.symbolic.algebra.reciprocal-rewrite",
        "reciprocalRewrite",
        ["value", "structure"],
        "law.algebra.reciprocal-rewrite"
      ]
    ]
  );
  assert.deepEqual(
    family.transformationDefinitions[4]?.correspondenceTemplates.map(
      (correspondence) => [
        correspondence.sourceSelectorRole,
        correspondence.targetSelectorRole,
        correspondence.preserves
      ]
    ),
    [
      ["numerator", "denominator", ["identity", "role"]],
      ["denominator", "numerator", ["identity", "role"]],
      ["fraction.bar", "fraction.bar", ["presentation", "role"]]
    ]
  );
  assert.deepEqual(family.visualMotifs, [
    {
      id: "motif.algebra.fraction.line-persist",
      motifKind: "fraction-line-persist",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.split-fraction-sum",
        "definition.symbolic.algebra.merge-fractions",
        "definition.symbolic.algebra.cancel-common-factor"
      ],
      summary:
        "Fraction bars act as persistent anchors while non-persistent operators and canceled factors fade."
    },
    {
      id: "motif.algebra.fraction.denominator-copy-align",
      motifKind: "denominator-copy-align",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.create-common-denominator"
      ],
      summary:
        "Denominator copies appear only after existing numerator and bar geometry shifts into place."
    },
    {
      id: "motif.algebra.fraction.reciprocal-swap",
      motifKind: "reciprocal-swap",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.reciprocal-rewrite"
      ],
      summary:
        "Numerator and denominator trade vertical roles while the fraction bar remains a stable visual reference."
    }
  ]);
  assert.deepEqual(family.runtimeSamples, [
    {
      id: "sample.animation.fraction-simplification.basic",
      animationId: "animation.generated.fraction-expression.two-fourths",
      availability: "concrete",
      renderTargetKinds: ["equation"],
      transformationDefinitionIds: [
        "definition.symbolic.algebra.split-fraction-sum",
        "definition.symbolic.algebra.merge-fractions",
        "definition.symbolic.algebra.cancel-common-factor",
        "definition.symbolic.algebra.create-common-denominator",
        "definition.symbolic.algebra.reciprocal-rewrite"
      ],
      summary:
        "Basic rational-expression sample exercises split, merge, simplify, common-denominator, and reciprocal forms."
    }
  ]);
  assert.deepEqual(family.graphEquivalents, [
    {
      id: "graph.algebra.fraction.rational-value",
      title: "Rational value is preserved",
      representationKind: "number-line",
      exactness: "exact",
      preserves: ["value"],
      lawRefs: [
        {
          id: "law.graph.rational-value-preservation",
          level: "strict"
        }
      ],
      sampleAssetIds: [
        "animation.generated.fraction-expression.two-fourths"
      ],
      summary:
        "Fraction rewrites keep the represented rational value fixed even when numerator, denominator, and bars are rearranged."
    }
  ]);
  assert.deepEqual(family.generatedProblemHooks, [
    {
      id: "hook.generated.rational-simplify.fraction",
      fixtureFamilyId: "generated.rational-simplify",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.split-fraction-sum",
        "definition.symbolic.algebra.merge-fractions",
        "definition.symbolic.algebra.cancel-common-factor",
        "definition.symbolic.algebra.create-common-denominator",
        "definition.symbolic.algebra.reciprocal-rewrite"
      ],
      summary:
        "Generated rational-expression traces can map fraction bar, denominator-copy, and reciprocal steps to this family."
    }
  ]);
  assert.deepEqual(family.flashcardHooks, [
    {
      id: "hook.flashcard.algebra.fraction.predict-next",
      kind: "predict-next",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.split-fraction-sum",
        "definition.symbolic.algebra.merge-fractions",
        "definition.symbolic.algebra.cancel-common-factor",
        "definition.symbolic.algebra.create-common-denominator",
        "definition.symbolic.algebra.reciprocal-rewrite"
      ],
      summary:
        "Predict-next cards can hide the next fraction rewrite or ask which denominator copy appears."
    }
  ]);
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("algebra exponent-log family preserves bases and wrapped arguments", () => {
  const family = symbolicManipulationFamilyById(
    "family.algebra.exponent-log-laws"
  );

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
        "power.before",
        "expression",
        [
          "base",
          "exponent.left",
          "operator",
          "exponent.right",
          "function.name",
          "function.argument",
          "function.open",
          "function.close"
        ]
      ],
      [
        "power.after",
        "expression",
        [
          "base",
          "exponent",
          "operator",
          "function.name",
          "function.argument",
          "function.open",
          "function.close",
          "radical.index",
          "radical.path",
          "artifact.operator"
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
        "definition.symbolic.algebra.multiply-same-base-powers",
        "multiplySameBasePowers",
        ["value", "structure"],
        "law.algebra.exponent-product"
      ],
      [
        "definition.symbolic.algebra.divide-same-base-powers",
        "divideSameBasePowers",
        ["value", "structure"],
        "law.algebra.exponent-quotient"
      ],
      [
        "definition.symbolic.algebra.power-of-power",
        "powerOfPower",
        ["value", "structure"],
        "law.algebra.power-of-power"
      ],
      [
        "definition.symbolic.algebra.power-to-root",
        "powerToRoot",
        ["value", "structure"],
        "law.algebra.power-root"
      ],
      [
        "definition.symbolic.algebra.log-exp-inverse",
        "logExpInverse",
        ["value", "structure"],
        "law.algebra.log-exp-inverse"
      ],
      [
        "definition.symbolic.algebra.log-product",
        "logProduct",
        ["value", "structure"],
        "law.algebra.log-product"
      ]
    ]
  );
  assert.deepEqual(
    family.transformationDefinitions[3]?.correspondenceTemplates.map(
      (correspondence) => [
        correspondence.sourceSelectorRole,
        correspondence.targetSelectorRole,
        correspondence.preserves
      ]
    ),
    [
      ["base", "base", ["identity", "role"]],
      ["exponent.left", "radical.index", ["value", "role"]],
      ["exponent.right", "radical.path", ["presentation", "role"]]
    ]
  );
  assert.deepEqual(
    family.transformationDefinitions[4]?.correspondenceTemplates.map(
      (correspondence) => [
        correspondence.sourceSelectorRole,
        correspondence.targetSelectorRole,
        correspondence.preserves
      ]
    ),
    [
      ["function.argument", "function.argument", ["identity", "role"]],
      ["function.name", "function.name", ["role"]],
      ["function.open", "function.open", ["presentation", "role"]],
      ["function.close", "function.close", ["presentation", "role"]]
    ]
  );
  assert.deepEqual(family.visualMotifs, [
    {
      id: "motif.algebra.exponent-log.exponent-stack-align",
      motifKind: "exponent-stack-align",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.multiply-same-base-powers",
        "definition.symbolic.algebra.divide-same-base-powers",
        "definition.symbolic.algebra.power-of-power"
      ],
      summary:
        "Persistent bases stay fixed while exponent tokens align, combine, or separate in the superscript region."
    },
    {
      id: "motif.algebra.exponent-log.root-fold",
      motifKind: "root-fold",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.power-to-root"
      ],
      summary:
        "The base persists while exponent geometry folds into radical index and path geometry."
    },
    {
      id: "motif.algebra.exponent-log.function-wrap-settle",
      motifKind: "function-wrap-settle",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.log-exp-inverse",
        "definition.symbolic.algebra.log-product"
      ],
      summary:
        "Function names and parens wrap or unwrap around a persistent argument, then settle to final spacing."
    }
  ]);
  assert.deepEqual(family.runtimeSamples, [
    {
      id: "sample.animation.power-radical-fold.basic",
      animationId: "animation.power-radical-fold.basic",
      renderTargetKinds: ["equation"],
      transformationDefinitionIds: [
        "definition.symbolic.algebra.power-to-root",
        "definition.symbolic.algebra.log-exp-inverse"
      ],
      summary:
        "Basic exponent-to-root and log/exp inverse sample exercises persistent base and argument semantics."
    }
  ]);
  assert.deepEqual(family.graphEquivalents, [
    {
      id: "graph.algebra.exponent-log.function-equivalence",
      title: "Function equivalence is preserved on its domain",
      representationKind: "function-graph",
      exactness: "sampled",
      preserves: ["value"],
      lawRefs: [
        {
          id: "law.graph.exponent-log-equivalence",
          level: "sampled"
        }
      ],
      sampleAssetIds: ["animation.power-radical-fold.basic"],
      summary:
        "Exponent, root, and logarithm rewrites preserve function values where the domain assumptions hold."
    }
  ]);
  assert.deepEqual(family.generatedProblemHooks, [
    {
      id: "hook.generated.exponent-log-simplify",
      fixtureFamilyId: "generated.exponent-log-simplify",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.multiply-same-base-powers",
        "definition.symbolic.algebra.divide-same-base-powers",
        "definition.symbolic.algebra.power-of-power",
        "definition.symbolic.algebra.power-to-root",
        "definition.symbolic.algebra.log-exp-inverse",
        "definition.symbolic.algebra.log-product"
      ],
      summary:
        "Generated exponent/log traces can map base persistence, exponent combination, radical folds, and function wrappers to this family."
    }
  ]);
  assert.deepEqual(family.flashcardHooks, [
    {
      id: "hook.flashcard.algebra.exponent-log.cloze",
      kind: "cloze",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.multiply-same-base-powers",
        "definition.symbolic.algebra.divide-same-base-powers",
        "definition.symbolic.algebra.power-of-power",
        "definition.symbolic.algebra.power-to-root",
        "definition.symbolic.algebra.log-exp-inverse",
        "definition.symbolic.algebra.log-product"
      ],
      summary:
        "Cloze cards can hide the resulting exponent, radical index, or unwrapped argument."
    }
  ]);
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("algebra inequality family distinguishes preserving and sign-flip operations", () => {
  const family = symbolicManipulationFamilyById("family.algebra.inequality");

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
        "inequality.before",
        "inequality",
        ["lhs.term", "relation", "rhs.term", "multiplier.sign"]
      ],
      [
        "inequality.after",
        "inequality",
        [
          "lhs.term",
          "relation",
          "relation.flip",
          "rhs.term",
          "operation.artifact"
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
        "definition.symbolic.algebra.inequality-add-both-sides",
        "addBothSidesInequality",
        ["value", "structure"],
        "law.inequality.add-both-sides"
      ],
      [
        "definition.symbolic.algebra.inequality-multiply-positive",
        "multiplyPositiveBothSidesInequality",
        ["value", "structure"],
        "law.inequality.multiply-positive"
      ],
      [
        "definition.symbolic.algebra.inequality-multiply-negative",
        "multiplyNegativeBothSidesInequality",
        ["value", "structure"],
        "law.inequality.multiply-negative-flip"
      ],
      [
        "definition.symbolic.algebra.inequality-divide-negative",
        "divideNegativeBothSidesInequality",
        ["value", "structure"],
        "law.inequality.divide-negative-flip"
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
      ["lhs.term", "lhs.term", ["identity", "role"]],
      ["relation", "relation.flip", ["role"]],
      ["rhs.term", "rhs.term", ["identity", "role"]],
      ["multiplier.sign", "operation.artifact", ["value", "role"]]
    ]
  );
  assert.deepEqual(family.visualMotifs, [
    {
      id: "motif.algebra.inequality.append-preserve-relation",
      motifKind: "append-after-shift",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.inequality-add-both-sides",
        "definition.symbolic.algebra.inequality-multiply-positive"
      ],
      summary:
        "Persistent inequality terms shift first, then same-side operation artifacts appear while the relation persists."
    },
    {
      id: "motif.algebra.inequality.relation-flip-pivot",
      motifKind: "relation-flip-pivot",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.inequality-multiply-negative",
        "definition.symbolic.algebra.inequality-divide-negative"
      ],
      summary:
        "Negative scaling keeps both sides equivalent only when the relation glyph flips as a first-class semantic event."
    }
  ]);
  assert.deepEqual(family.runtimeSamples, [
    {
      id: "sample.animation.inequality.sign-flip.basic",
      animationId: "animation.inequality.sign-flip.basic",
      renderTargetKinds: ["equation"],
      transformationDefinitionIds: [
        "definition.symbolic.algebra.inequality-multiply-negative"
      ],
      summary:
        "Basic inequality sign-flip sample exercises relation.flip semantics for negative scaling."
    }
  ]);
  assert.deepEqual(family.graphEquivalents, [
    {
      id: "graph.algebra.inequality.number-line-solution-set",
      title: "Number-line solution set is preserved",
      representationKind: "number-line",
      exactness: "exact",
      preserves: ["value"],
      lawRefs: [
        {
          id: "law.graph.inequality-solution-set-preservation",
          level: "strict"
        }
      ],
      sampleAssetIds: ["animation.inequality.sign-flip.basic"],
      summary:
        "Inequality operations preserve the number-line solution set when sign-flip rules are followed."
    }
  ]);
  assert.deepEqual(family.generatedProblemHooks, [
    {
      id: "hook.generated.inequality-solve.sign-flip",
      fixtureFamilyId: "generated.inequality-solve",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.inequality-add-both-sides",
        "definition.symbolic.algebra.inequality-multiply-positive",
        "definition.symbolic.algebra.inequality-multiply-negative",
        "definition.symbolic.algebra.inequality-divide-negative"
      ],
      summary:
        "Generated inequality-solving traces can require a valid sign-flip transform before animating negative scaling."
    }
  ]);
  assert.deepEqual(family.flashcardHooks, [
    {
      id: "hook.flashcard.algebra.inequality.sign-flip",
      kind: "predict-next",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.inequality-multiply-negative",
        "definition.symbolic.algebra.inequality-divide-negative"
      ],
      summary:
        "Predict-next cards can ask whether the inequality relation should flip."
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
      { label: "Flashcard hooks", value: "1" },
      { label: "Validation", value: "passed" },
      { label: "Practice maturity", value: "practice-ready" }
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
      "flashcard-ready:true",
      "generated-problem-ready:true",
      "maturity:practice-ready"
    ]
  });
});

test("symbolic library progress rows summarize cross-domain coverage and blockers", () => {
  const rows = createSymbolicManipulationLibraryProgressRows("");
  const overall = rows[0];

  assert.equal(rows.length, 4);
  assert.equal(overall?.id, "symbolic-library-progress-all");
  assert.equal(overall?.detail, "18/18 families ready");
  assert.deepEqual(
    overall?.previewFields
      .filter((field) =>
        [
          "Families",
          "Ready families",
          "Transform definitions",
          "Runtime sample refs",
          "Concrete runtime samples",
          "Planned runtime samples",
          "Law status",
          "Generated problem hooks",
          "Flashcard hooks",
          "Paused-frame drill-down candidates",
          "Blockers"
        ].includes(field.label)
      )
      .map((field) => [field.label, field.value]),
    [
      ["Families", "18"],
      ["Ready families", "18"],
      ["Transform definitions", "71"],
      ["Runtime sample refs", "20"],
      ["Concrete runtime samples", "3"],
      ["Planned runtime samples", "17"],
      ["Law status", "passed"],
      ["Generated problem hooks", "18"],
      ["Flashcard hooks", "18"],
      ["Paused-frame drill-down candidates", "47"],
      ["Blockers", "None"]
    ]
  );
  assert.deepEqual(
    createSemanticAssetCatalogAgendaRows(
      "symbolic library domain:linear-algebra law-status:passed blockers:none paused-frame-drilldown:available"
    ).map((row) => row.id),
    ["symbolic-library-progress-linear-algebra"]
  );
});

test("algebra generated problem rows surface practice-ready maturity", () => {
  assert.deepEqual(
    createSymbolicManipulationFamilyAgendaRows(
      "algebra maturity:practice-ready generated-problem-ready:true flashcard-ready:true"
    ).map((row) => [
      row.id,
      row.previewFields.find((field) => field.label === "Practice maturity")
        ?.value
    ]),
    [
      ["symbolic-family-algebra-both-sides", "practice-ready"],
      ["symbolic-family-algebra-cancel-combine", "practice-ready"],
      ["symbolic-family-algebra-distribution-factoring", "practice-ready"],
      ["symbolic-family-algebra-fraction-simplification", "practice-ready"],
      ["symbolic-family-algebra-exponent-log-laws", "practice-ready"],
      ["symbolic-family-algebra-inequality", "practice-ready"]
    ]
  );
});

test("calculus derivative rules family models rule-specific persistence", () => {
  const family = symbolicManipulationFamilyById(
    "family.calculus.derivative-rules"
  );

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
        "derivative.before",
        "derivative-expression",
        [
          "derivative.operator",
          "outer.function",
          "inner.function",
          "variable",
          "exponent",
          "factor.left",
          "factor.right"
        ]
      ],
      [
        "derivative.after",
        "derivative-expression",
        [
          "derivative.operator",
          "outer.derivative",
          "inner.derivative",
          "variable",
          "exponent.decremented",
          "coefficient",
          "product.operator",
          "quotient.bar"
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
        "definition.symbolic.calculus.derivative-sum-rule",
        "derivativeSumRule",
        ["value", "structure"],
        "law.calculus.derivative-sum"
      ],
      [
        "definition.symbolic.calculus.derivative-constant-multiple",
        "derivativeConstantMultipleRule",
        ["value", "structure"],
        "law.calculus.derivative-constant-multiple"
      ],
      [
        "definition.symbolic.calculus.derivative-power-rule",
        "derivativePowerRule",
        ["value", "structure"],
        "law.calculus.derivative-power"
      ],
      [
        "definition.symbolic.calculus.derivative-product-rule",
        "derivativeProductRule",
        ["value", "structure"],
        "law.calculus.derivative-product"
      ],
      [
        "definition.symbolic.calculus.derivative-quotient-rule",
        "derivativeQuotientRule",
        ["value", "structure"],
        "law.calculus.derivative-quotient"
      ],
      [
        "definition.symbolic.calculus.derivative-chain-rule",
        "derivativeChainRule",
        ["value", "structure"],
        "law.calculus.derivative-chain"
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
      ["variable", "variable", ["identity", "role"]],
      ["exponent", "coefficient", ["value", "role"]],
      ["exponent", "exponent.decremented", ["value", "role"]]
    ]
  );
  assert.deepEqual(
    family.transformationDefinitions[5]?.correspondenceTemplates.map(
      (correspondence) => [
        correspondence.sourceSelectorRole,
        correspondence.targetSelectorRole,
        correspondence.preserves
      ]
    ),
    [
      ["outer.function", "outer.derivative", ["identity", "role"]],
      ["inner.function", "inner.derivative", ["identity", "role"]],
      ["variable", "variable", ["identity", "role"]]
    ]
  );
  assert.deepEqual(family.visualMotifs, [
    {
      id: "motif.calculus.derivative.distribute-operator",
      motifKind: "derivative-distribute",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.derivative-sum-rule",
        "definition.symbolic.calculus.derivative-constant-multiple"
      ],
      summary:
        "The derivative operator duplicates across additive terms while constants persist as coefficients."
    },
    {
      id: "motif.calculus.derivative.exponent-drop",
      motifKind: "exponent-drop",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.derivative-power-rule"
      ],
      summary:
        "The exponent drops into coefficient position while a decremented exponent remains in the superscript region."
    },
    {
      id: "motif.calculus.derivative.rule-branch",
      motifKind: "rule-branch",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.derivative-product-rule",
        "definition.symbolic.calculus.derivative-quotient-rule",
        "definition.symbolic.calculus.derivative-chain-rule"
      ],
      summary:
        "Composite rules branch into coordinated sub-derivatives that can be animated in parallel or sequence."
    }
  ]);
  assert.deepEqual(family.runtimeSamples, [
    {
      id: "sample.animation.derivative-rules.basic",
      animationId: "animation.derivative-rules.basic",
      renderTargetKinds: ["equation"],
      transformationDefinitionIds: [
        "definition.symbolic.calculus.derivative-power-rule",
        "definition.symbolic.calculus.derivative-chain-rule"
      ],
      summary:
        "Basic derivative sample exercises power-rule exponent drop and chain-rule nested persistence."
    },
    {
      id: "sample.animation.derivative-rules.tangent-graph",
      animationId: "animation.derivative-rules.tangent-graph",
      renderTargetKinds: ["graph"],
      transformationDefinitionIds: [
        "definition.symbolic.calculus.derivative-power-rule",
        "definition.symbolic.calculus.derivative-chain-rule"
      ],
      summary:
        "Graph sample projects derivative-rule steps onto tangent line and local-slope motion."
    }
  ]);
  assert.deepEqual(family.graphEquivalents, [
    {
      id: "graph.calculus.derivative.tangent-line",
      title: "Derivative corresponds to tangent slope",
      representationKind: "tangent-line",
      exactness: "sampled",
      preserves: ["value"],
      lawRefs: [
        {
          id: "law.graph.derivative-tangent-slope",
          level: "sampled"
        }
      ],
      sampleAssetIds: ["animation.derivative-rules.basic"],
      summary:
        "Derivative-rule rewrites preserve the symbolic derivative whose value drives tangent slope samples."
    },
    {
      id: "graph.calculus.derivative.local-slope-motion",
      title: "Derivative drives local-slope motion",
      representationKind: "local-slope-motion",
      exactness: "sampled",
      preserves: ["value"],
      lawRefs: [
        {
          id: "law.graph.derivative-local-slope-motion",
          level: "sampled"
        }
      ],
      sampleAssetIds: ["animation.derivative-rules.tangent-graph"],
      summary:
        "A shared derivative value can drive a tangent handle, secant-to-tangent limit cue, or local-slope marker without changing the symbolic step."
    }
  ]);
  assert.deepEqual(family.generatedProblemHooks, [
    {
      id: "hook.generated.calculus-derivative-rules",
      fixtureFamilyId: "generated.calculus-derivative-rules",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.derivative-sum-rule",
        "definition.symbolic.calculus.derivative-constant-multiple",
        "definition.symbolic.calculus.derivative-power-rule",
        "definition.symbolic.calculus.derivative-product-rule",
        "definition.symbolic.calculus.derivative-quotient-rule",
        "definition.symbolic.calculus.derivative-chain-rule"
      ],
      summary:
        "Generated derivative traces can map each rule application to reusable derivative animations."
    }
  ]);
  assert.deepEqual(family.flashcardHooks, [
    {
      id: "hook.flashcard.calculus.derivative-rule.pick",
      kind: "predict-next",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.derivative-sum-rule",
        "definition.symbolic.calculus.derivative-constant-multiple",
        "definition.symbolic.calculus.derivative-power-rule",
        "definition.symbolic.calculus.derivative-product-rule",
        "definition.symbolic.calculus.derivative-quotient-rule",
        "definition.symbolic.calculus.derivative-chain-rule"
      ],
      summary:
        "Predict-next cards can ask which derivative rule applies and what sub-derivative appears next."
    }
  ]);
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("calculus derivative rules family projects to tangent graph samples", () => {
  const family = symbolicManipulationFamilyById(
    "family.calculus.derivative-rules"
  );

  assert.ok(family);
  assert.deepEqual(
    family.runtimeSamples.filter((sample) =>
      sample.renderTargetKinds.includes("graph")
    ),
    [
      {
        id: "sample.animation.derivative-rules.tangent-graph",
        animationId: "animation.derivative-rules.tangent-graph",
        renderTargetKinds: ["graph"],
        transformationDefinitionIds: [
          "definition.symbolic.calculus.derivative-power-rule",
          "definition.symbolic.calculus.derivative-chain-rule"
        ],
        summary:
          "Graph sample projects derivative-rule steps onto tangent line and local-slope motion."
      }
    ]
  );
  assert.deepEqual(
    family.graphEquivalents.map((equivalent) => [
      equivalent.id,
      equivalent.representationKind,
      equivalent.sampleAssetIds,
      equivalent.summary
    ]),
    [
      [
        "graph.calculus.derivative.tangent-line",
        "tangent-line",
        ["animation.derivative-rules.basic"],
        "Derivative-rule rewrites preserve the symbolic derivative whose value drives tangent slope samples."
      ],
      [
        "graph.calculus.derivative.local-slope-motion",
        "local-slope-motion",
        ["animation.derivative-rules.tangent-graph"],
        "A shared derivative value can drive a tangent handle, secant-to-tangent limit cue, or local-slope marker without changing the symbolic step."
      ]
    ]
  );
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("calculus integral and FTC family preserves integrands and bounds", () => {
  const family = symbolicManipulationFamilyById("family.calculus.integral-ftc");

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
        "integral.before",
        "integral-expression",
        [
          "integral.sign",
          "lower.bound",
          "upper.bound",
          "integrand",
          "differential",
          "variable"
        ]
      ],
      [
        "integral.after",
        "integral-expression",
        [
          "antiderivative",
          "lower.bound",
          "upper.bound",
          "evaluation.bar",
          "variable",
          "area.region"
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
        "definition.symbolic.calculus.integral-sum-rule",
        "integralSumRule",
        ["value", "structure"],
        "law.calculus.integral-sum"
      ],
      [
        "definition.symbolic.calculus.antiderivative-rule",
        "antiderivativeRule",
        ["value", "structure"],
        "law.calculus.antiderivative"
      ],
      [
        "definition.symbolic.calculus.definite-integral-ftc",
        "definiteIntegralFtc",
        ["value", "structure"],
        "law.calculus.ftc-evaluation"
      ],
      [
        "definition.symbolic.calculus.accumulation-derivative-ftc",
        "accumulationDerivativeFtc",
        ["value", "structure"],
        "law.calculus.ftc-accumulation-derivative"
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
      ["integrand", "antiderivative", ["value", "role"]],
      ["lower.bound", "lower.bound", ["identity", "role"]],
      ["upper.bound", "upper.bound", ["identity", "role"]],
      ["variable", "variable", ["identity", "role"]],
      ["integral.sign", "evaluation.bar", ["presentation", "role"]]
    ]
  );
  assert.deepEqual(family.visualMotifs, [
    {
      id: "motif.calculus.integral.antiderivative-emerge",
      motifKind: "antiderivative-emerge",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.integral-sum-rule",
        "definition.symbolic.calculus.antiderivative-rule"
      ],
      summary:
        "The integrand persists into an antiderivative form while integral and differential artifacts fade."
    },
    {
      id: "motif.calculus.integral.bounds-evaluate",
      motifKind: "bounds-evaluate",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.definite-integral-ftc"
      ],
      summary:
        "Bounds move from integral limits to evaluation positions around the antiderivative."
    },
    {
      id: "motif.calculus.integral.area-accumulation",
      motifKind: "area-accumulation",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.accumulation-derivative-ftc"
      ],
      summary:
        "Changing upper bounds sweep an area region while preserving the integrand as the accumulated rate."
    }
  ]);
  assert.deepEqual(family.runtimeSamples, [
    {
      id: "sample.animation.integral-ftc.basic",
      animationId: "animation.integral-ftc.basic",
      renderTargetKinds: ["equation", "graph"],
      transformationDefinitionIds: [
        "definition.symbolic.calculus.definite-integral-ftc",
        "definition.symbolic.calculus.accumulation-derivative-ftc"
      ],
      summary:
        "Basic FTC sample links bound movement, antiderivative evaluation, and area accumulation."
    },
    {
      id: "sample.animation.integral-ftc.area-sweep",
      animationId: "animation.integral-ftc.area-sweep",
      renderTargetKinds: ["graph"],
      transformationDefinitionIds: [
        "definition.symbolic.calculus.definite-integral-ftc",
        "definition.symbolic.calculus.accumulation-derivative-ftc"
      ],
      summary:
        "Graph-only area sweep sample preserves bound provenance while showing sampled accumulation."
    }
  ]);
  assert.deepEqual(family.graphEquivalents, [
    {
      id: "graph.calculus.integral.area-accumulation",
      title: "Definite integral corresponds to accumulated area",
      representationKind: "area-accumulation",
      exactness: "sampled",
      preserves: ["value"],
      lawRefs: [
        {
          id: "law.graph.integral-area-accumulation",
          level: "sampled"
        }
      ],
      sampleAssetIds: ["animation.integral-ftc.basic"],
      summary:
        "Integral and FTC rewrites preserve the accumulated area represented between the lower and upper bounds."
    },
    {
      id: "graph.calculus.integral.area-sweep-provenance",
      title: "Area sweep preserves bound provenance",
      representationKind: "area-sweep-provenance",
      exactness: "sampled",
      preserves: ["value"],
      lawRefs: [
        {
          id: "law.graph.integral-area-sweep-provenance",
          level: "sampled"
        }
      ],
      sampleAssetIds: ["animation.integral-ftc.area-sweep"],
      summary:
        "Area sweep samples are visually sampled but preserve symbolic bound provenance from the integral family."
    }
  ]);
  assert.deepEqual(family.generatedProblemHooks, [
    {
      id: "hook.generated.calculus-integral-ftc",
      fixtureFamilyId: "generated.calculus-integral-ftc",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.integral-sum-rule",
        "definition.symbolic.calculus.antiderivative-rule",
        "definition.symbolic.calculus.definite-integral-ftc",
        "definition.symbolic.calculus.accumulation-derivative-ftc"
      ],
      summary:
        "Generated integral traces can map antiderivatives, definite bounds, and FTC evaluation to this family."
    }
  ]);
  assert.deepEqual(family.flashcardHooks, [
    {
      id: "hook.flashcard.calculus.integral-ftc.bounds",
      kind: "relationship",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.definite-integral-ftc",
        "definition.symbolic.calculus.accumulation-derivative-ftc"
      ],
      summary:
        "Relationship cards can ask how bounds, antiderivatives, and area regions correspond."
    }
  ]);
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("calculus integral family projects to area sweep graph samples", () => {
  const family = symbolicManipulationFamilyById("family.calculus.integral-ftc");

  assert.ok(family);
  assert.deepEqual(
    family.runtimeSamples.filter((sample) =>
      sample.renderTargetKinds.includes("graph") &&
      sample.id === "sample.animation.integral-ftc.area-sweep"
    ),
    [
      {
        id: "sample.animation.integral-ftc.area-sweep",
        animationId: "animation.integral-ftc.area-sweep",
        renderTargetKinds: ["graph"],
        transformationDefinitionIds: [
          "definition.symbolic.calculus.definite-integral-ftc",
          "definition.symbolic.calculus.accumulation-derivative-ftc"
        ],
        summary:
          "Graph-only area sweep sample preserves bound provenance while showing sampled accumulation."
      }
    ]
  );
  assert.deepEqual(
    family.graphEquivalents.map((equivalent) => [
      equivalent.id,
      equivalent.representationKind,
      equivalent.exactness,
      equivalent.sampleAssetIds,
      equivalent.summary
    ]),
    [
      [
        "graph.calculus.integral.area-accumulation",
        "area-accumulation",
        "sampled",
        ["animation.integral-ftc.basic"],
        "Integral and FTC rewrites preserve the accumulated area represented between the lower and upper bounds."
      ],
      [
        "graph.calculus.integral.area-sweep-provenance",
        "area-sweep-provenance",
        "sampled",
        ["animation.integral-ftc.area-sweep"],
        "Area sweep samples are visually sampled but preserve symbolic bound provenance from the integral family."
      ]
    ]
  );
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("calculus Taylor family models approximation and local linearization", () => {
  const family = symbolicManipulationFamilyById(
    "family.calculus.taylor-local-linearization"
  );

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
        "taylor.before",
        "approximation-expression",
        [
          "function",
          "center",
          "variable",
          "derivative.order",
          "factorial",
          "remainder"
        ]
      ],
      [
        "taylor.after",
        "approximation-expression",
        [
          "polynomial.term",
          "center",
          "variable",
          "derivative.value",
          "order.marker",
          "remainder.annotation"
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
        "definition.symbolic.calculus.taylor-expansion",
        "taylorExpansion",
        ["value", "structure"],
        "law.calculus.taylor-expansion"
      ],
      [
        "definition.symbolic.calculus.taylor-truncation",
        "taylorTruncation",
        ["structure"],
        "law.calculus.taylor-truncation"
      ],
      [
        "definition.symbolic.calculus.local-linearization",
        "localLinearization",
        ["value", "structure"],
        "law.calculus.local-linearization"
      ],
      [
        "definition.symbolic.calculus.remainder-annotation",
        "remainderAnnotation",
        ["structure"],
        "law.calculus.taylor-remainder"
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
      ["function", "polynomial.term", ["value", "role"]],
      ["center", "center", ["identity", "role"]],
      ["variable", "variable", ["identity", "role"]],
      ["derivative.order", "derivative.value", ["value", "role"]]
    ]
  );
  assert.deepEqual(family.visualMotifs, [
    {
      id: "motif.calculus.taylor.polynomial-layer-build",
      motifKind: "polynomial-layer-build",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.taylor-expansion"
      ],
      summary:
        "Derivative-order terms layer into a polynomial approximation around a persistent center."
    },
    {
      id: "motif.calculus.taylor.truncate-remainder",
      motifKind: "truncate-remainder",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.taylor-truncation",
        "definition.symbolic.calculus.remainder-annotation"
      ],
      summary:
        "Higher-order terms collapse into an explicit remainder annotation instead of disappearing silently."
    },
    {
      id: "motif.calculus.taylor.local-tangent-settle",
      motifKind: "local-tangent-settle",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.local-linearization"
      ],
      summary:
        "The approximation settles into tangent-line geometry at the preserved center point."
    }
  ]);
  assert.deepEqual(family.runtimeSamples, [
    {
      id: "sample.animation.taylor-local-linearization.basic",
      animationId: "animation.taylor-local-linearization.basic",
      renderTargetKinds: ["equation", "graph"],
      transformationDefinitionIds: [
        "definition.symbolic.calculus.taylor-expansion",
        "definition.symbolic.calculus.local-linearization"
      ],
      summary:
        "Basic Taylor sample links symbolic approximation terms to tangent and polynomial graph overlays."
    }
  ]);
  assert.deepEqual(family.graphEquivalents, [
    {
      id: "graph.calculus.taylor.local-polynomial",
      title: "Taylor polynomial approximates the function locally",
      representationKind: "function-graph",
      exactness: "sampled",
      preserves: ["structure"],
      lawRefs: [
        {
          id: "law.graph.taylor-local-approximation",
          level: "sampled"
        }
      ],
      sampleAssetIds: ["animation.taylor-local-linearization.basic"],
      summary:
        "Taylor and local-linearization rewrites project to tangent or local-polynomial overlays near the expansion center."
    }
  ]);
  assert.deepEqual(family.generatedProblemHooks, [
    {
      id: "hook.generated.calculus-taylor-linearization",
      fixtureFamilyId: "generated.calculus-taylor-linearization",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.taylor-expansion",
        "definition.symbolic.calculus.taylor-truncation",
        "definition.symbolic.calculus.local-linearization",
        "definition.symbolic.calculus.remainder-annotation"
      ],
      summary:
        "Generated approximation traces can map expansion, truncation, local linearization, and remainder steps to this family."
    }
  ]);
  assert.deepEqual(family.flashcardHooks, [
    {
      id: "hook.flashcard.calculus.taylor.approximation",
      kind: "relationship",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.taylor-expansion",
        "definition.symbolic.calculus.local-linearization"
      ],
      summary:
        "Relationship cards can ask how a symbolic Taylor term maps to graph-local approximation behavior."
    }
  ]);
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("calculus gradient and Jacobian family maps partials into vector and matrix views", () => {
  const family = symbolicManipulationFamilyById(
    "family.calculus.gradient-jacobian"
  );

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
        "multivar.before",
        "multivariable-function",
        [
          "function.output",
          "input.vector",
          "variable.row",
          "variable.column",
          "partial.operator"
        ]
      ],
      [
        "multivar.after",
        "multivariable-linearization",
        [
          "gradient.vector",
          "jacobian.matrix",
          "row.index",
          "column.index",
          "partial.derivative",
          "local.linear.map"
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
        "definition.symbolic.calculus.scalar-gradient",
        "scalarGradient",
        ["value", "structure"],
        "law.calculus.scalar-gradient"
      ],
      [
        "definition.symbolic.calculus.jacobian-matrix",
        "jacobianMatrix",
        ["value", "structure"],
        "law.calculus.jacobian-matrix"
      ],
      [
        "definition.symbolic.calculus.directional-derivative",
        "directionalDerivative",
        ["value", "structure"],
        "law.calculus.directional-derivative"
      ],
      [
        "definition.symbolic.calculus.local-linear-map",
        "localLinearMap",
        ["value", "structure"],
        "law.calculus.local-linear-map"
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
      ["function.output", "row.index", ["role"]],
      ["variable.column", "column.index", ["identity", "role"]],
      ["partial.operator", "partial.derivative", ["presentation", "role"]],
      ["input.vector", "jacobian.matrix", ["structure", "role"]]
    ]
  );
  assert.deepEqual(family.visualMotifs, [
    {
      id: "motif.calculus.gradient.gradient-vector-emerge",
      motifKind: "gradient-vector-emerge",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.scalar-gradient",
        "definition.symbolic.calculus.directional-derivative"
      ],
      summary:
        "Scalar partial derivatives align into a gradient vector while input-variable identity persists."
    },
    {
      id: "motif.calculus.gradient.jacobian-matrix-fill",
      motifKind: "jacobian-matrix-fill",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.jacobian-matrix"
      ],
      summary:
        "Output components and input variables fill Jacobian rows and columns with explicit provenance."
    },
    {
      id: "motif.calculus.gradient.local-linear-map",
      motifKind: "local-linear-map",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.local-linear-map"
      ],
      summary:
        "The Jacobian matrix projects into a local-linear-map graph view around the chosen point."
    }
  ]);
  assert.deepEqual(family.runtimeSamples, [
    {
      id: "sample.animation.gradient-jacobian.basic",
      animationId: "animation.gradient-jacobian.basic",
      renderTargetKinds: ["equation", "matrix", "graph"],
      transformationDefinitionIds: [
        "definition.symbolic.calculus.scalar-gradient",
        "definition.symbolic.calculus.jacobian-matrix",
        "definition.symbolic.calculus.local-linear-map"
      ],
      summary:
        "Basic multivariable sample links gradient vector, Jacobian matrix, and local-linear-map views."
    }
  ]);
  assert.deepEqual(family.graphEquivalents, [
    {
      id: "graph.calculus.gradient-jacobian.local-linear-map",
      title: "Jacobian is the local linear map",
      representationKind: "local-linear-map",
      exactness: "sampled",
      preserves: ["value", "structure"],
      lawRefs: [
        {
          id: "law.graph.jacobian-local-linear-map",
          level: "sampled"
        }
      ],
      sampleAssetIds: ["animation.gradient-jacobian.basic"],
      summary:
        "Gradient and Jacobian symbolic views project to vector-field and local-linear-map graph equivalents."
    }
  ]);
  assert.deepEqual(family.generatedProblemHooks, [
    {
      id: "hook.generated.calculus-gradient-jacobian",
      fixtureFamilyId: "generated.calculus-gradient-jacobian",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.scalar-gradient",
        "definition.symbolic.calculus.jacobian-matrix",
        "definition.symbolic.calculus.directional-derivative",
        "definition.symbolic.calculus.local-linear-map"
      ],
      summary:
        "Generated multivariable traces can map partial derivatives into gradient, Jacobian, and local-linear-map forms."
    }
  ]);
  assert.deepEqual(family.flashcardHooks, [
    {
      id: "hook.flashcard.calculus.gradient-jacobian.compare",
      kind: "relationship",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.scalar-gradient",
        "definition.symbolic.calculus.jacobian-matrix",
        "definition.symbolic.calculus.local-linear-map"
      ],
      summary:
        "Relationship cards can compare scalar gradients, Jacobian rows/columns, and local-linear-map effects."
    }
  ]);
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("calculus Hessian family maps second partials to curvature and optimization views", () => {
  const family = symbolicManipulationFamilyById(
    "family.calculus.hessian-optimization"
  );

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
        "hessian.before",
        "second-order-function",
        [
          "scalar.function",
          "gradient.vector",
          "variable.row",
          "variable.column",
          "critical.point"
        ]
      ],
      [
        "hessian.after",
        "second-order-optimization-view",
        [
          "hessian.matrix",
          "hessian.row",
          "hessian.column",
          "quadratic.form",
          "eigenvalue.sign",
          "curvature.classification",
          "critical.point"
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
        "definition.symbolic.calculus.hessian-matrix",
        "hessianMatrix",
        ["value", "structure"],
        "law.calculus.hessian-matrix"
      ],
      [
        "definition.symbolic.calculus.quadratic-form",
        "quadraticForm",
        ["value", "structure"],
        "law.calculus.quadratic-form"
      ],
      [
        "definition.symbolic.calculus.second-derivative-test",
        "secondDerivativeTest",
        ["value", "structure"],
        "law.calculus.second-derivative-test"
      ],
      [
        "definition.symbolic.calculus.stationarity-condition",
        "stationarityCondition",
        ["value", "structure"],
        "law.calculus.stationarity"
      ]
    ]
  );
  assert.deepEqual(
    family.transformationDefinitions[0]?.correspondenceTemplates.map(
      (correspondence) => [
        correspondence.sourceSelectorRole,
        correspondence.targetSelectorRole,
        correspondence.preserves
      ]
    ),
    [
      ["scalar.function", "hessian.matrix", ["value", "role"]],
      ["variable.row", "hessian.row", ["identity", "role"]],
      ["variable.column", "hessian.column", ["identity", "role"]],
      ["critical.point", "critical.point", ["identity", "role"]]
    ]
  );
  assert.deepEqual(family.visualMotifs, [
    {
      id: "motif.calculus.hessian.matrix-fill",
      motifKind: "hessian-matrix-fill",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.hessian-matrix"
      ],
      summary:
        "Second partial derivatives fill Hessian rows and columns while variable provenance persists."
    },
    {
      id: "motif.calculus.hessian.quadratic-form-surface",
      motifKind: "quadratic-form-surface",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.quadratic-form"
      ],
      summary:
        "The Hessian matrix projects into a quadratic-form surface around the critical point."
    },
    {
      id: "motif.calculus.hessian.curvature-classification",
      motifKind: "curvature-classification",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.second-derivative-test",
        "definition.symbolic.calculus.stationarity-condition"
      ],
      summary:
        "Eigenvalue signs and stationarity conditions produce a derived curvature classification."
    }
  ]);
  assert.deepEqual(family.runtimeSamples, [
    {
      id: "sample.animation.hessian-optimization.basic",
      animationId: "animation.hessian-optimization.basic",
      renderTargetKinds: ["equation", "matrix", "graph"],
      transformationDefinitionIds: [
        "definition.symbolic.calculus.hessian-matrix",
        "definition.symbolic.calculus.quadratic-form",
        "definition.symbolic.calculus.second-derivative-test"
      ],
      summary:
        "Basic Hessian sample links second partial matrix entries to quadratic-form and curvature graph views."
    }
  ]);
  assert.deepEqual(family.graphEquivalents, [
    {
      id: "graph.calculus.hessian.quadratic-form",
      title: "Hessian determines local quadratic curvature",
      representationKind: "quadratic-form",
      exactness: "sampled",
      preserves: ["value", "structure"],
      lawRefs: [
        {
          id: "law.graph.hessian-quadratic-curvature",
          level: "sampled"
        }
      ],
      sampleAssetIds: ["animation.hessian-optimization.basic"],
      summary:
        "Hessian symbolic views project to local quadratic curvature and optimization classification graph views."
    }
  ]);
  assert.deepEqual(family.generatedProblemHooks, [
    {
      id: "hook.generated.calculus-hessian-optimization",
      fixtureFamilyId: "generated.calculus-hessian-optimization",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.hessian-matrix",
        "definition.symbolic.calculus.quadratic-form",
        "definition.symbolic.calculus.second-derivative-test",
        "definition.symbolic.calculus.stationarity-condition"
      ],
      summary:
        "Generated optimization traces can map Hessian construction, quadratic forms, and second-derivative tests to this family."
    }
  ]);
  assert.deepEqual(family.flashcardHooks, [
    {
      id: "hook.flashcard.calculus.hessian-optimization.compare",
      kind: "relationship",
      transformationDefinitionIds: [
        "definition.symbolic.calculus.hessian-matrix",
        "definition.symbolic.calculus.quadratic-form",
        "definition.symbolic.calculus.second-derivative-test"
      ],
      summary:
        "Relationship cards can compare Hessian entries, quadratic-form geometry, and curvature classifications."
    }
  ]);
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("linear algebra vector add-scale family preserves components and graph arrows", () => {
  const family = symbolicManipulationFamilyById(
    "family.linear-algebra.vector-add-scale"
  );

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
        "vector.before",
        "vector-expression",
        ["vector.left", "vector.right", "scalar", "component", "origin", "tip"]
      ],
      [
        "vector.after",
        "vector-expression",
        [
          "vector.result",
          "scaled.vector",
          "component",
          "origin",
          "tip",
          "parallelogram.edge"
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
        "definition.symbolic.linear-algebra.vector-addition",
        "vectorAddition",
        ["value", "structure"],
        "law.linear-algebra.vector-addition"
      ],
      [
        "definition.symbolic.linear-algebra.scalar-multiplication",
        "scalarMultiplication",
        ["value", "structure"],
        "law.linear-algebra.scalar-multiplication"
      ],
      [
        "definition.symbolic.linear-algebra.component-decomposition",
        "componentDecomposition",
        ["value", "structure"],
        "law.linear-algebra.component-decomposition"
      ],
      [
        "definition.symbolic.linear-algebra.graphical-vector-composition",
        "graphicalVectorComposition",
        ["value", "presentation"],
        "law.graph.vector-composition"
      ]
    ]
  );
  assert.deepEqual(
    family.transformationDefinitions[0]?.correspondenceTemplates.map(
      (correspondence) => [
        correspondence.sourceSelectorRole,
        correspondence.targetSelectorRole,
        correspondence.preserves
      ]
    ),
    [
      ["vector.left", "vector.result", ["value", "role"]],
      ["vector.right", "vector.result", ["value", "role"]],
      ["origin", "origin", ["identity", "role"]],
      ["tip", "tip", ["identity", "role"]],
      ["component", "component", ["identity", "role"]]
    ]
  );
  assert.deepEqual(family.visualMotifs, [
    {
      id: "motif.linear-algebra.vector.tip-to-tail",
      motifKind: "tip-to-tail",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.vector-addition",
        "definition.symbolic.linear-algebra.graphical-vector-composition"
      ],
      summary:
        "Vector arrows move tip-to-tail while component identities remain tied to the symbolic result."
    },
    {
      id: "motif.linear-algebra.vector.scalar-stretch",
      motifKind: "scalar-stretch",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.scalar-multiplication"
      ],
      summary:
        "Scalar multiplication stretches or reverses the vector arrow while preserving origin/component provenance."
    },
    {
      id: "motif.linear-algebra.vector.component-lift",
      motifKind: "component-lift",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.component-decomposition"
      ],
      summary:
        "Component entries lift into coordinate-axis arrows and can fold back into vector notation."
    }
  ]);
  assert.deepEqual(family.runtimeSamples, [
    {
      id: "sample.animation.vector-add-scale.basic",
      animationId: "animation.vector-add-scale.basic",
      renderTargetKinds: ["equation", "graph"],
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.vector-addition",
        "definition.symbolic.linear-algebra.scalar-multiplication",
        "definition.symbolic.linear-algebra.graphical-vector-composition"
      ],
      summary:
        "Basic vector sample links symbolic component operations to graph arrow composition."
    }
  ]);
  assert.deepEqual(family.graphEquivalents, [
    {
      id: "graph.linear-algebra.vector-add-scale.arrow-composition",
      title: "Vector operations correspond to arrow geometry",
      representationKind: "vector-graph",
      exactness: "exact",
      preserves: ["value", "presentation"],
      lawRefs: [
        {
          id: "law.graph.vector-arrow-composition",
          level: "strict"
        }
      ],
      sampleAssetIds: ["animation.vector-add-scale.basic"],
      summary:
        "Vector addition and scaling preserve the represented vector while changing arrow placement or length."
    }
  ]);
  assert.deepEqual(family.generatedProblemHooks, [
    {
      id: "hook.generated.linear-algebra-vector-add-scale",
      fixtureFamilyId: "generated.linear-algebra-vector-add-scale",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.vector-addition",
        "definition.symbolic.linear-algebra.scalar-multiplication",
        "definition.symbolic.linear-algebra.component-decomposition",
        "definition.symbolic.linear-algebra.graphical-vector-composition"
      ],
      summary:
        "Generated vector traces can map component arithmetic, scaling, and graph arrow composition to this family."
    }
  ]);
  assert.deepEqual(family.flashcardHooks, [
    {
      id: "hook.flashcard.linear-algebra.vector-add-scale.predict",
      kind: "predict-next",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.vector-addition",
        "definition.symbolic.linear-algebra.scalar-multiplication"
      ],
      summary:
        "Predict-next cards can ask for the resulting vector or graphical arrow placement."
    }
  ]);
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("linear algebra dot-projection family links scalar, projection, and angle views", () => {
  const family = symbolicManipulationFamilyById(
    "family.linear-algebra.dot-projection"
  );

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
        "dot.before",
        "dot-product-expression",
        [
          "vector.left",
          "vector.right",
          "component.left",
          "component.right",
          "angle",
          "length.left",
          "length.right"
        ]
      ],
      [
        "dot.after",
        "dot-product-interpretation",
        [
          "scalar.result",
          "projection.vector",
          "orthogonal.component",
          "angle",
          "length.left",
          "length.right"
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
        "definition.symbolic.linear-algebra.dot-product",
        "dotProduct",
        ["value", "structure"],
        "law.linear-algebra.dot-product"
      ],
      [
        "definition.symbolic.linear-algebra.vector-projection",
        "vectorProjection",
        ["value", "structure"],
        "law.linear-algebra.vector-projection"
      ],
      [
        "definition.symbolic.linear-algebra.orthogonality-test",
        "orthogonalityTest",
        ["value", "structure"],
        "law.linear-algebra.orthogonality"
      ],
      [
        "definition.symbolic.linear-algebra.angle-from-dot",
        "angleFromDotProduct",
        ["value", "structure"],
        "law.linear-algebra.dot-angle"
      ]
    ]
  );
  assert.deepEqual(
    family.transformationDefinitions[0]?.correspondenceTemplates.map(
      (correspondence) => [
        correspondence.sourceSelectorRole,
        correspondence.targetSelectorRole,
        correspondence.preserves
      ]
    ),
    [
      ["vector.left", "scalar.result", ["value", "role"]],
      ["vector.right", "scalar.result", ["value", "role"]],
      ["angle", "angle", ["identity", "role"]],
      ["length.left", "length.left", ["identity", "role"]],
      ["length.right", "length.right", ["identity", "role"]]
    ]
  );
  assert.deepEqual(family.visualMotifs, [
    {
      id: "motif.linear-algebra.dot.component-pair-sum",
      motifKind: "component-pair-sum",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.dot-product"
      ],
      summary:
        "Component pairs align, multiply, and accumulate into a scalar dot-product result."
    },
    {
      id: "motif.linear-algebra.dot.projection-drop",
      motifKind: "projection-drop",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.vector-projection",
        "definition.symbolic.linear-algebra.orthogonality-test"
      ],
      summary:
        "One vector drops perpendicularly onto another while the orthogonal component remains explicit."
    },
    {
      id: "motif.linear-algebra.dot.angle-sweep",
      motifKind: "angle-sweep",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.angle-from-dot"
      ],
      summary:
        "Angle and length tokens sweep into the geometric dot-product interpretation."
    }
  ]);
  assert.deepEqual(family.runtimeSamples, [
    {
      id: "sample.animation.dot-projection.basic",
      animationId: "animation.dot-projection.basic",
      renderTargetKinds: ["equation", "graph"],
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.dot-product",
        "definition.symbolic.linear-algebra.vector-projection",
        "definition.symbolic.linear-algebra.angle-from-dot"
      ],
      summary:
        "Basic dot/projection sample links scalar dot products to projection and angle graph views."
    }
  ]);
  assert.deepEqual(family.graphEquivalents, [
    {
      id: "graph.linear-algebra.dot-projection.geometry",
      title: "Dot product corresponds to projection geometry",
      representationKind: "vector-graph",
      exactness: "exact",
      preserves: ["value", "presentation"],
      lawRefs: [
        {
          id: "law.graph.dot-projection-geometry",
          level: "strict"
        }
      ],
      sampleAssetIds: ["animation.dot-projection.basic"],
      summary:
        "Dot product, projection, orthogonality, and angle interpretations preserve the same vector relationship."
    }
  ]);
  assert.deepEqual(family.generatedProblemHooks, [
    {
      id: "hook.generated.linear-algebra-dot-projection",
      fixtureFamilyId: "generated.linear-algebra-dot-projection",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.dot-product",
        "definition.symbolic.linear-algebra.vector-projection",
        "definition.symbolic.linear-algebra.orthogonality-test",
        "definition.symbolic.linear-algebra.angle-from-dot"
      ],
      summary:
        "Generated vector traces can map dot products, projections, orthogonality, and angle steps to this family."
    }
  ]);
  assert.deepEqual(family.flashcardHooks, [
    {
      id: "hook.flashcard.linear-algebra.dot-projection.relationship",
      kind: "relationship",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.dot-product",
        "definition.symbolic.linear-algebra.vector-projection",
        "definition.symbolic.linear-algebra.angle-from-dot"
      ],
      summary:
        "Relationship cards can ask how scalar dot products, projections, and angles encode the same relationship."
    }
  ]);
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("linear algebra matrix-vector family composes rows, entries, and graph maps", () => {
  const family = symbolicManipulationFamilyById(
    "family.linear-algebra.matrix-vector"
  );

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
        "matrixVector.before",
        "matrix-vector-expression",
        ["matrix", "matrix.row", "matrix.entry", "vector", "vector.entry"]
      ],
      [
        "matrixVector.after",
        "matrix-vector-result",
        [
          "result.vector",
          "result.entry",
          "row.dot.product",
          "linear.map",
          "transformed.vector"
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
        "definition.symbolic.linear-algebra.matrix-vector-multiply",
        "matrixVectorMultiply",
        ["value", "structure"],
        "law.linear-algebra.matrix-vector"
      ],
      [
        "definition.symbolic.linear-algebra.row-dot-products",
        "rowDotProducts",
        ["value", "structure"],
        "law.linear-algebra.matrix-row-dot"
      ],
      [
        "definition.symbolic.linear-algebra.apply-linear-map",
        "applyLinearMap",
        ["value", "presentation"],
        "law.linear-algebra.linear-map-application"
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
      ["matrix.row", "row.dot.product", ["identity", "role"]],
      ["matrix.entry", "row.dot.product", ["value", "role"]],
      ["vector.entry", "row.dot.product", ["value", "role"]],
      ["vector", "result.vector", ["value", "role"]]
    ]
  );
  assert.deepEqual(family.visualMotifs, [
    {
      id: "motif.linear-algebra.matrix-vector.row-dot-sweep",
      motifKind: "row-dot-sweep",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.row-dot-products",
        "definition.symbolic.linear-algebra.matrix-vector-multiply"
      ],
      summary:
        "Each matrix row sweeps across vector entries to form one persistent result entry."
    },
    {
      id: "motif.linear-algebra.matrix-vector.linear-map-apply",
      motifKind: "linear-map-apply",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.apply-linear-map"
      ],
      summary:
        "The matrix expression projects into a graph transform of the input vector."
    }
  ]);
  assert.deepEqual(family.runtimeSamples, [
    {
      id: "sample.animation.matrix-vector.basic",
      animationId: "animation.matrix-vector.basic",
      renderTargetKinds: ["equation", "matrix", "graph"],
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.matrix-vector-multiply",
        "definition.symbolic.linear-algebra.row-dot-products",
        "definition.symbolic.linear-algebra.apply-linear-map"
      ],
      summary:
        "Basic matrix-vector sample links row dot products to a linear-map graph transform."
    }
  ]);
  assert.deepEqual(family.graphEquivalents, [
    {
      id: "graph.linear-algebra.matrix-vector.linear-map",
      title: "Matrix-vector multiplication applies a linear map",
      representationKind: "linear-map",
      exactness: "exact",
      preserves: ["value", "presentation"],
      lawRefs: [
        {
          id: "law.graph.matrix-vector-linear-map",
          level: "strict"
        }
      ],
      sampleAssetIds: ["animation.matrix-vector.basic"],
      summary:
        "Matrix-vector multiplication preserves the linear-map relation between input and transformed output vectors."
    }
  ]);
  assert.deepEqual(family.generatedProblemHooks, [
    {
      id: "hook.generated.linear-algebra-matrix-vector",
      fixtureFamilyId: "generated.linear-algebra-matrix-vector",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.matrix-vector-multiply",
        "definition.symbolic.linear-algebra.row-dot-products",
        "definition.symbolic.linear-algebra.apply-linear-map"
      ],
      summary:
        "Generated matrix-vector traces can map row dot products and graph linear-map application to this family."
    }
  ]);
  assert.deepEqual(family.flashcardHooks, [
    {
      id: "hook.flashcard.linear-algebra.matrix-vector.row-dot",
      kind: "predict-next",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.row-dot-products",
        "definition.symbolic.linear-algebra.matrix-vector-multiply"
      ],
      summary:
        "Predict-next cards can ask which row dot product creates each result entry."
    }
  ]);
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("linear algebra matrix-matrix family composes dot-product cells and map composition", () => {
  const family = symbolicManipulationFamilyById(
    "family.linear-algebra.matrix-matrix-composition"
  );

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
        "matrixMatrix.before",
        "matrix-matrix-expression",
        [
          "left.matrix",
          "left.row",
          "left.entry",
          "right.matrix",
          "right.column",
          "right.entry"
        ]
      ],
      [
        "matrixMatrix.after",
        "matrix-matrix-result",
        [
          "result.matrix",
          "result.entry",
          "cell.dot.product",
          "left.linear.map",
          "right.linear.map",
          "composed.linear.map"
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
        "definition.symbolic.linear-algebra.matrix-matrix-multiply",
        "matrixMatrixMultiply",
        ["value", "structure"],
        "law.linear-algebra.matrix-matrix"
      ],
      [
        "definition.symbolic.linear-algebra.cell-dot-products",
        "cellDotProducts",
        ["value", "structure"],
        "law.linear-algebra.matrix-cell-dot"
      ],
      [
        "definition.symbolic.linear-algebra.compose-linear-maps",
        "composeLinearMaps",
        ["value", "presentation"],
        "law.linear-algebra.linear-map-composition"
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
      ["left.row", "cell.dot.product", ["identity", "role"]],
      ["right.column", "cell.dot.product", ["identity", "role"]],
      ["left.entry", "cell.dot.product", ["value", "role"]],
      ["right.entry", "cell.dot.product", ["value", "role"]],
      ["left.matrix", "result.matrix", ["value", "role"]],
      ["right.matrix", "result.matrix", ["value", "role"]]
    ]
  );
  assert.deepEqual(family.visualMotifs, [
    {
      id: "motif.linear-algebra.matrix-matrix.cell-dot-grid",
      motifKind: "cell-dot-grid",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.cell-dot-products",
        "definition.symbolic.linear-algebra.matrix-matrix-multiply"
      ],
      summary:
        "Each output cell is staged as a row-column dot product in a reusable grid beat."
    },
    {
      id: "motif.linear-algebra.matrix-matrix.map-composition",
      motifKind: "linear-map-composition",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.compose-linear-maps"
      ],
      summary:
        "The right map applies first, then the left map, matching the composed matrix order."
    }
  ]);
  assert.deepEqual(family.runtimeSamples, [
    {
      id: "sample.animation.matrix-matrix.basic",
      animationId: "animation.matrix-matrix.basic",
      renderTargetKinds: ["equation", "matrix", "graph"],
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.matrix-matrix-multiply",
        "definition.symbolic.linear-algebra.cell-dot-products",
        "definition.symbolic.linear-algebra.compose-linear-maps"
      ],
      summary:
        "Basic matrix-matrix sample composes cell dot products with a graph linear-map composition."
    }
  ]);
  assert.deepEqual(family.graphEquivalents, [
    {
      id: "graph.linear-algebra.matrix-matrix.linear-map-composition",
      title: "Matrix multiplication composes linear maps",
      representationKind: "linear-map-composition",
      exactness: "exact",
      preserves: ["value", "presentation"],
      lawRefs: [
        {
          id: "law.graph.matrix-matrix-linear-map-composition",
          level: "strict"
        }
      ],
      sampleAssetIds: ["animation.matrix-matrix.basic"],
      summary:
        "Matrix-matrix multiplication preserves the order-sensitive composition of the two linear maps."
    }
  ]);
  assert.deepEqual(family.generatedProblemHooks, [
    {
      id: "hook.generated.linear-algebra-matrix-matrix",
      fixtureFamilyId: "generated.linear-algebra-matrix-matrix",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.matrix-matrix-multiply",
        "definition.symbolic.linear-algebra.cell-dot-products",
        "definition.symbolic.linear-algebra.compose-linear-maps"
      ],
      summary:
        "Generated matrix multiplication traces can map each result entry to row-column dot products and graph composition."
    }
  ]);
  assert.deepEqual(family.flashcardHooks, [
    {
      id: "hook.flashcard.linear-algebra.matrix-matrix.cell",
      kind: "predict-next",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.cell-dot-products",
        "definition.symbolic.linear-algebra.matrix-matrix-multiply"
      ],
      summary:
        "Predict-next cards can ask which row and column create a selected result cell."
    }
  ]);
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("linear algebra row operations family records system equivalence and determinant impact", () => {
  const family = symbolicManipulationFamilyById(
    "family.linear-algebra.row-operations"
  );

  assert.ok(family);
  assert.equal(family.status, "promoted");
  assert.equal(
    family.metadata?.["determinantImpact"],
    "swap flips sign, scale multiplies determinant, replacement preserves determinant"
  );
  assert.deepEqual(
    family.objectRoles.map((role) => [
      role.id,
      role.objectType,
      role.selectorRoles.map((selector) => selector.id)
    ]),
    [
      [
        "rowOperation.before",
        "augmented-matrix-or-system",
        [
          "matrix",
          "row",
          "row.entry",
          "equation.system",
          "solution.set",
          "determinant"
        ]
      ],
      [
        "rowOperation.after",
        "row-operation-result",
        [
          "matrix",
          "row",
          "row.entry",
          "equivalent.system",
          "solution.set",
          "determinant.factor",
          "operation.annotation"
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
        "definition.symbolic.linear-algebra.row-swap",
        "rowSwap",
        ["value", "structure"],
        "law.linear-algebra.row-swap"
      ],
      [
        "definition.symbolic.linear-algebra.row-scale",
        "rowScale",
        ["value", "structure"],
        "law.linear-algebra.row-scale"
      ],
      [
        "definition.symbolic.linear-algebra.row-replacement",
        "rowReplacement",
        ["value", "structure"],
        "law.linear-algebra.row-replacement"
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
      ["row", "row", ["identity", "role"]],
      ["row.entry", "row.entry", ["value", "role"]],
      ["equation.system", "equivalent.system", ["value", "structure"]],
      ["solution.set", "solution.set", ["identity", "value"]],
      ["determinant", "determinant.factor", ["value", "role"]]
    ]
  );
  assert.deepEqual(family.visualMotifs, [
    {
      id: "motif.linear-algebra.row-operation.swap-slide",
      motifKind: "row-swap-slide",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.row-swap"
      ],
      summary:
        "Selected rows exchange positions while row identities remain visible through the swap."
    },
    {
      id: "motif.linear-algebra.row-operation.scale-pulse",
      motifKind: "row-scale-pulse",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.row-scale"
      ],
      summary:
        "A nonzero scalar focus propagates across each entry in the selected row."
    },
    {
      id: "motif.linear-algebra.row-operation.replacement-compose",
      motifKind: "row-replacement-compose",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.row-replacement"
      ],
      summary:
        "A scaled source row is composed into a target row without changing the solution set."
    }
  ]);
  assert.deepEqual(family.runtimeSamples, [
    {
      id: "sample.animation.row-operations.basic",
      animationId: "animation.row-operations.basic",
      renderTargetKinds: ["equation", "matrix", "graph"],
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.row-swap",
        "definition.symbolic.linear-algebra.row-scale",
        "definition.symbolic.linear-algebra.row-replacement"
      ],
      summary:
        "Basic row-operation sample links matrix row edits to equivalent systems and determinant annotations."
    }
  ]);
  assert.deepEqual(family.graphEquivalents, [
    {
      id: "graph.linear-algebra.row-operations.solution-set",
      title: "Elementary row operations preserve solution sets",
      representationKind: "solution-set",
      exactness: "exact",
      preserves: ["value", "presentation"],
      lawRefs: [
        {
          id: "law.graph.row-operations-solution-set",
          level: "strict"
        }
      ],
      sampleAssetIds: ["animation.row-operations.basic"],
      summary:
        "Row operations can be shown as equivalent-system moves while the represented solution set persists."
    }
  ]);
  assert.deepEqual(family.generatedProblemHooks, [
    {
      id: "hook.generated.linear-algebra-row-operations",
      fixtureFamilyId: "generated.linear-algebra-row-operations",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.row-swap",
        "definition.symbolic.linear-algebra.row-scale",
        "definition.symbolic.linear-algebra.row-replacement"
      ],
      summary:
        "Generated elimination traces can map each elementary row operation to this family."
    }
  ]);
  assert.deepEqual(family.flashcardHooks, [
    {
      id: "hook.flashcard.linear-algebra.row-operations.effect",
      kind: "relationship",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.row-swap",
        "definition.symbolic.linear-algebra.row-scale",
        "definition.symbolic.linear-algebra.row-replacement"
      ],
      summary:
        "Relationship cards can ask how each row operation affects solution sets and determinants."
    }
  ]);
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("linear algebra determinant-inverse family links scale, orientation, and undo maps", () => {
  const family = symbolicManipulationFamilyById(
    "family.linear-algebra.determinant-inverse"
  );

  assert.ok(family);
  assert.equal(family.status, "promoted");
  assert.equal(
    family.metadata?.["invertibilityCondition"],
    "matrix inverse requires nonzero determinant"
  );
  assert.deepEqual(
    family.objectRoles.map((role) => [
      role.id,
      role.objectType,
      role.selectorRoles.map((selector) => selector.id)
    ]),
    [
      [
        "determinantInverse.before",
        "linear-map-or-matrix",
        [
          "matrix",
          "matrix.entry",
          "determinant",
          "input.vector",
          "unit.area",
          "unit.volume"
        ]
      ],
      [
        "determinantInverse.after",
        "determinant-inverse-result",
        [
          "determinant.value",
          "area.volume.scale",
          "inverse.matrix",
          "output.vector",
          "identity.map",
          "orientation"
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
        "definition.symbolic.linear-algebra.determinant-compute",
        "determinantCompute",
        ["value", "structure"],
        "law.linear-algebra.determinant"
      ],
      [
        "definition.symbolic.linear-algebra.determinant-area-volume",
        "determinantAreaVolumeScale",
        ["value", "presentation"],
        "law.linear-algebra.determinant-area-volume"
      ],
      [
        "definition.symbolic.linear-algebra.matrix-inverse",
        "matrixInverse",
        ["value", "structure"],
        "law.linear-algebra.matrix-inverse"
      ],
      [
        "definition.symbolic.linear-algebra.inverse-undo-linear-map",
        "inverseUndoLinearMap",
        ["value", "presentation"],
        "law.linear-algebra.inverse-linear-map"
      ]
    ]
  );
  assert.deepEqual(
    family.transformationDefinitions[3]?.correspondenceTemplates.map(
      (correspondence) => [
        correspondence.sourceSelectorRole,
        correspondence.targetSelectorRole,
        correspondence.preserves
      ]
    ),
    [
      ["matrix", "inverse.matrix", ["value", "role"]],
      ["determinant", "inverse.matrix", ["value", "role"]],
      ["input.vector", "output.vector", ["identity", "value"]],
      ["matrix", "identity.map", ["structure", "role"]]
    ]
  );
  assert.deepEqual(family.visualMotifs, [
    {
      id: "motif.linear-algebra.determinant.area-volume-scale",
      motifKind: "area-volume-scale",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.determinant-area-volume",
        "definition.symbolic.linear-algebra.determinant-compute"
      ],
      summary:
        "A unit area or volume deforms under the matrix while determinant magnitude is tracked as scale."
    },
    {
      id: "motif.linear-algebra.determinant.orientation-flip",
      motifKind: "orientation-flip",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.determinant-area-volume"
      ],
      summary:
        "Negative determinant cases surface orientation reversal as presentation, not token identity."
    },
    {
      id: "motif.linear-algebra.inverse.map-undo",
      motifKind: "linear-map-undo",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.matrix-inverse",
        "definition.symbolic.linear-algebra.inverse-undo-linear-map"
      ],
      summary:
        "The inverse map runs the transformed vector back through the identity reference frame."
    }
  ]);
  assert.deepEqual(family.runtimeSamples, [
    {
      id: "sample.animation.determinant-inverse.basic",
      animationId: "animation.determinant-inverse.basic",
      renderTargetKinds: ["equation", "matrix", "graph"],
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.determinant-compute",
        "definition.symbolic.linear-algebra.determinant-area-volume",
        "definition.symbolic.linear-algebra.matrix-inverse",
        "definition.symbolic.linear-algebra.inverse-undo-linear-map"
      ],
      summary:
        "Basic determinant-inverse sample links determinant scale to inverse undoing on the graph."
    }
  ]);
  assert.deepEqual(family.graphEquivalents, [
    {
      id: "graph.linear-algebra.determinant.area-volume-scaling",
      title: "Determinant measures area or volume scaling",
      representationKind: "area-volume-scaling",
      exactness: "exact",
      preserves: ["value", "presentation"],
      lawRefs: [
        {
          id: "law.graph.determinant-area-volume",
          level: "strict"
        }
      ],
      sampleAssetIds: ["animation.determinant-inverse.basic"],
      summary:
        "The determinant value is represented as signed area or volume scale under the linear map."
    },
    {
      id: "graph.linear-algebra.inverse.linear-map-undo",
      title: "An inverse matrix undoes a linear map",
      representationKind: "linear-map",
      exactness: "exact",
      preserves: ["value", "presentation"],
      lawRefs: [
        {
          id: "law.graph.inverse-linear-map-undo",
          level: "strict"
        }
      ],
      sampleAssetIds: ["animation.determinant-inverse.basic"],
      summary:
        "The inverse graph view composes a matrix with its inverse to return to the identity map."
    }
  ]);
  assert.deepEqual(family.generatedProblemHooks, [
    {
      id: "hook.generated.linear-algebra-determinant-inverse",
      fixtureFamilyId: "generated.linear-algebra-determinant-inverse",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.determinant-compute",
        "definition.symbolic.linear-algebra.determinant-area-volume",
        "definition.symbolic.linear-algebra.matrix-inverse",
        "definition.symbolic.linear-algebra.inverse-undo-linear-map"
      ],
      summary:
        "Generated determinant and inverse traces can expose scale, orientation, and nonzero determinant checks."
    }
  ]);
  assert.deepEqual(family.flashcardHooks, [
    {
      id: "hook.flashcard.linear-algebra.determinant-inverse.relationship",
      kind: "relationship",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.determinant-area-volume",
        "definition.symbolic.linear-algebra.inverse-undo-linear-map"
      ],
      summary:
        "Relationship cards can ask how determinant scale predicts invertibility and inverse behavior."
    }
  ]);
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("linear algebra basis-eigen family tracks coordinate changes and eigenline persistence", () => {
  const family = symbolicManipulationFamilyById(
    "family.linear-algebra.basis-eigen"
  );

  assert.ok(family);
  assert.equal(family.status, "promoted");
  assert.equal(
    family.metadata?.["spectralScope"],
    "starter diagonalization examples, not a full eigensolver"
  );
  assert.deepEqual(
    family.objectRoles.map((role) => [
      role.id,
      role.objectType,
      role.selectorRoles.map((selector) => selector.id)
    ]),
    [
      [
        "basisEigen.before",
        "basis-or-linear-map",
        [
          "matrix",
          "basis",
          "basis.vector",
          "coordinate.vector",
          "eigenvector",
          "eigenvalue"
        ]
      ],
      [
        "basisEigen.after",
        "basis-eigen-result",
        [
          "changed.basis",
          "coordinate.vector",
          "transformed.vector",
          "eigenline",
          "scaled.eigenvector",
          "diagonal.matrix"
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
        "definition.symbolic.linear-algebra.change-basis",
        "changeBasis",
        ["value", "structure"],
        "law.linear-algebra.change-basis"
      ],
      [
        "definition.symbolic.linear-algebra.coordinate-transform",
        "coordinateTransform",
        ["value", "presentation"],
        "law.linear-algebra.coordinate-transform"
      ],
      [
        "definition.symbolic.linear-algebra.eigenvector-relation",
        "eigenvectorRelation",
        ["identity", "structure"],
        "law.linear-algebra.eigenvector"
      ],
      [
        "definition.symbolic.linear-algebra.diagonalization-starter",
        "diagonalizationStarter",
        ["value", "structure"],
        "law.linear-algebra.diagonalization"
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
      ["matrix", "scaled.eigenvector", ["value", "role"]],
      ["eigenvector", "eigenline", ["identity", "role"]],
      ["eigenvalue", "scaled.eigenvector", ["value", "role"]],
      ["eigenvector", "transformed.vector", ["identity", "value"]]
    ]
  );
  assert.deepEqual(family.visualMotifs, [
    {
      id: "motif.linear-algebra.basis.frame-morph",
      motifKind: "basis-frame-morph",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.change-basis"
      ],
      summary:
        "Basis vectors move as a frame while represented vectors keep their underlying identity."
    },
    {
      id: "motif.linear-algebra.basis.coordinate-relabel",
      motifKind: "coordinate-grid-relabel",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.coordinate-transform"
      ],
      summary:
        "Coordinate entries relabel against the new basis without implying a physical vector moved."
    },
    {
      id: "motif.linear-algebra.eigen.line-scale",
      motifKind: "eigenline-scale",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.eigenvector-relation",
        "definition.symbolic.linear-algebra.diagonalization-starter"
      ],
      summary:
        "Eigenvectors remain on their eigenline while the eigenvalue controls scaling."
    }
  ]);
  assert.deepEqual(family.runtimeSamples, [
    {
      id: "sample.animation.basis-eigen.basic",
      animationId: "animation.basis-eigen.basic",
      renderTargetKinds: ["equation", "matrix", "graph"],
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.change-basis",
        "definition.symbolic.linear-algebra.coordinate-transform",
        "definition.symbolic.linear-algebra.eigenvector-relation",
        "definition.symbolic.linear-algebra.diagonalization-starter"
      ],
      summary:
        "Basic basis-eigen sample links coordinate changes to eigenline scaling and a diagonalization starter."
    }
  ]);
  assert.deepEqual(family.graphEquivalents, [
    {
      id: "graph.linear-algebra.basis-change.linear-map",
      title: "Basis changes relabel a linear map",
      representationKind: "linear-map",
      exactness: "exact",
      preserves: ["value", "presentation"],
      lawRefs: [
        {
          id: "law.graph.basis-change-linear-map",
          level: "strict"
        }
      ],
      sampleAssetIds: ["animation.basis-eigen.basic"],
      summary:
        "Changing basis alters coordinates and grid presentation while preserving the underlying vector and linear map."
    },
    {
      id: "graph.linear-algebra.eigen.eigenline",
      title: "Eigenvectors persist as invariant directions",
      representationKind: "eigenvector-graph",
      exactness: "exact",
      preserves: ["identity", "presentation"],
      lawRefs: [
        {
          id: "law.graph.eigenvector-invariant-direction",
          level: "strict"
        }
      ],
      sampleAssetIds: ["animation.basis-eigen.basic"],
      summary:
        "The eigen graph view keeps the eigenvector on the same line while the transform scales it."
    }
  ]);
  assert.deepEqual(family.generatedProblemHooks, [
    {
      id: "hook.generated.linear-algebra-basis-eigen",
      fixtureFamilyId: "generated.linear-algebra-basis-eigen",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.change-basis",
        "definition.symbolic.linear-algebra.coordinate-transform",
        "definition.symbolic.linear-algebra.eigenvector-relation",
        "definition.symbolic.linear-algebra.diagonalization-starter"
      ],
      summary:
        "Generated basis and eigen examples can map coordinate changes, eigen relations, and starter diagonalization steps."
    }
  ]);
  assert.deepEqual(family.flashcardHooks, [
    {
      id: "hook.flashcard.linear-algebra.basis-eigen.relationship",
      kind: "relationship",
      transformationDefinitionIds: [
        "definition.symbolic.linear-algebra.change-basis",
        "definition.symbolic.linear-algebra.eigenvector-relation"
      ],
      summary:
        "Relationship cards can ask which values change under coordinate relabeling and which directions remain invariant."
    }
  ]);
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("symbolic family flashcard projection rows expose hooks without lesson markup", () => {
  const clozeRows =
    createSymbolicManipulationFamilyFlashcardProjectionRows(
      "flashcard:cloze exponent-log"
    );
  assert.deepEqual(
    clozeRows.map((row) => ({
      id: row.id,
      detail: row.detail,
      tags: row.tags,
      relatedIds: row.relatedIds.slice(0, 3),
      cardKind: row.previewFields.find((field) => field.label === "Card kind")
        ?.value
    })),
    [
      {
        id:
          "symbolic-flashcard-family-algebra-exponent-log-laws-hook-flashcard-algebra-exponent-log-cloze",
        detail: "symbolic flashcard hook",
        tags: [
          "symbolic-flashcard",
          "algebra",
          "cloze",
          "cloze",
          "study"
        ],
        relatedIds: [
          "family.algebra.exponent-log-laws",
          "hook.flashcard.algebra.exponent-log.cloze",
          "definition.symbolic.algebra.multiply-same-base-powers"
        ],
        cardKind: "cloze"
      }
    ]
  );

  assert.deepEqual(
    createSymbolicManipulationFamilyFlashcardProjectionRows(
      "flashcard:focus-relationship determinant inverse"
    )
      .map((row) => [
        row.id,
        row.previewFields.find((field) => field.label === "Hook kind")?.value,
        row.previewFields.find((field) => field.label === "Card kind")?.value,
        row.searchFields.includes("lesson-markup:false")
      ]),
    [
      [
        "symbolic-flashcard-family-linear-algebra-determinant-inverse-hook-flashcard-linear-algebra-determinant-inverse-relationship",
        "relationship",
        "focus-relationship",
        true
      ]
    ]
  );
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
  assert.deepEqual(
    createSemanticAssetCatalogAgendaRows(
      "symbolic flashcard flashcard:focus-relationship determinant inverse"
    ).map((row) => row.id),
    [
      "symbolic-flashcard-family-linear-algebra-determinant-inverse-hook-flashcard-linear-algebra-determinant-inverse-relationship"
    ]
  );
});
