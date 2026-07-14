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
      animationId: "animation.fraction-simplification.basic",
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
      sampleAssetIds: ["animation.fraction-simplification.basic"],
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
