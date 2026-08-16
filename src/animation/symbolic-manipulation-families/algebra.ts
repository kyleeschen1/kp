import {
  createKpSymbolicManipulationFamily,
  type KpSymbolicManipulationFamily
} from "../symbolic-manipulation-family.ts";
import {
  createKpSemanticTransformationDefinition
} from "../../semantic/asset-transformation.ts";
import {
  createKpSymbolicManipulationFamilyPackDeclaration,
  symbolicManipulationFamilyRowId
} from "../symbolic-manipulation-family-pack.ts";

export function createAlgebraBothSidesFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.algebra.add-both-sides",
    "definition.symbolic.algebra.subtract-both-sides",
    "definition.symbolic.algebra.multiply-both-sides",
    "definition.symbolic.algebra.divide-both-sides"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.algebra.both-sides",
    title: "Both-sides equation operations",
    domain: "algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "equation.before",
        objectType: "equation",
        title: "Source equation",
        selectorRoles: [
          { id: "lhs.variable", kind: "term" },
          { id: "equals", kind: "relation" },
          { id: "rhs.value", kind: "term" }
        ]
      },
      {
        id: "equation.after",
        objectType: "equation",
        title: "Equation after both-sides operation",
        selectorRoles: [
          { id: "lhs.variable", kind: "term" },
          { id: "equals", kind: "relation" },
          { id: "rhs.value", kind: "term" },
          { id: "operation.artifact", kind: "term" }
        ]
      }
    ],
    transformationDefinitions: [
      createBothSidesDefinition({
        id: "definition.symbolic.algebra.add-both-sides",
        transformType: "addBothSides",
        title: "Add the same value to both sides",
        lawId: "law.equation.add-both-sides",
        assumption: "Adding equal quantities preserves equality."
      }),
      createBothSidesDefinition({
        id: "definition.symbolic.algebra.subtract-both-sides",
        transformType: "subtractBothSides",
        title: "Subtract the same value from both sides",
        lawId: "law.equation.subtract-both-sides",
        assumption: "Subtracting equal quantities preserves equality."
      }),
      createBothSidesDefinition({
        id: "definition.symbolic.algebra.multiply-both-sides",
        transformType: "multiplyBothSides",
        title: "Multiply both sides by the same value",
        lawId: "law.equation.multiply-both-sides",
        assumption:
          "Multiplying both sides preserves equality; equivalence requires a non-zero multiplier."
      }),
      createBothSidesDefinition({
        id: "definition.symbolic.algebra.divide-both-sides",
        transformType: "divideBothSides",
        title: "Divide both sides by the same non-zero value",
        lawId: "law.equation.divide-both-sides",
        assumption:
          "Dividing equal quantities by the same non-zero value preserves equality."
      })
    ],
    visualMotifs: [
      {
        id: "motif.algebra.both-sides.append-after-shift",
        motifKind: "append-after-shift",
        transformationDefinitionIds: definitionIds,
        summary:
          "Persistent tokens shift first, then the operation artifact appears on both sides."
      }
    ],
    runtimeSamples: [
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
    ],
    graphEquivalents: [
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
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.linear-solve.both-sides",
        fixtureFamilyId: "generated.linear-solve",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated linear-solve traces can map add/subtract/multiply/divide both-sides steps to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.algebra.both-sides.predict-next",
        kind: "predict-next",
        transformationDefinitionIds: definitionIds,
        summary:
          "Predict-next cards can ask which operation isolates or preserves the equation next."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId("family.algebra.both-sides"),
      tags: ["equation", "inverse-operation", "generated-problem"]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for algebra: add, subtract, multiply, and divide both sides while preserving equality.",
      searchSummary:
        "add, subtract, multiply, and divide both sides while preserving equality",
      graphEquivalentKinds: "equation-graph"
    }
  });
}

function createBothSidesDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["equation.before"],
    targetObjectRoles: ["equation.after"],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "equation.before",
        sourceSelectorRole: "lhs.variable",
        targetObjectRole: "equation.after",
        targetSelectorRole: "lhs.variable",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "equation.before",
        sourceSelectorRole: "equals",
        targetObjectRole: "equation.after",
        targetSelectorRole: "equals",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "equation.before",
        sourceSelectorRole: "rhs.value",
        targetObjectRole: "equation.after",
        targetSelectorRole: "rhs.value",
        preserves: ["identity", "role"]
      }
    ]
  });
}

export function createAlgebraCancelCombineFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.algebra.cancel-additive-inverses",
    "definition.symbolic.algebra.cancel-multiplicative-inverses",
    "definition.symbolic.algebra.combine-like-terms"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.algebra.cancel-combine",
    title: "Cancellation and combine-like-terms",
    domain: "algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "expression.before",
        objectType: "expression",
        title: "Expression before simplification",
        selectorRoles: [
          { id: "context.persistent", kind: "context" },
          { id: "inverse.left", kind: "term" },
          { id: "inverse.operator", kind: "operator" },
          { id: "inverse.right", kind: "term" },
          { id: "like.coefficient.left", kind: "coefficient" },
          { id: "like.factor.left", kind: "factor" },
          { id: "like.operator", kind: "operator" },
          { id: "like.coefficient.right", kind: "coefficient" },
          { id: "like.factor.right", kind: "factor" }
        ]
      },
      {
        id: "expression.after",
        objectType: "expression",
        title: "Expression after simplification",
        selectorRoles: [
          { id: "context.persistent", kind: "context" },
          { id: "like.coefficient.combined", kind: "coefficient" },
          { id: "like.factor.combined", kind: "factor" }
        ]
      }
    ],
    transformationDefinitions: [
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.algebra.cancel-additive-inverses",
        transformType: "cancelAdditiveInverses",
        title: "Cancel additive inverses",
        sourceObjectRoles: ["expression.before"],
        targetObjectRoles: ["expression.after"],
        preserves: ["value"],
        assumptions: [
          "Additive inverse terms are on the same expression side and sum to zero."
        ],
        lawRefs: [
          {
            id: "law.algebra.additive-inverse-cancellation",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "expression.before",
            sourceSelectorRole: "context.persistent",
            targetObjectRole: "expression.after",
            targetSelectorRole: "context.persistent",
            preserves: ["identity", "role"]
          }
        ]
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.algebra.cancel-multiplicative-inverses",
        transformType: "cancelMultiplicativeInverses",
        title: "Cancel multiplicative inverses",
        sourceObjectRoles: ["expression.before"],
        targetObjectRoles: ["expression.after"],
        preserves: ["value"],
        assumptions: [
          "Multiplicative inverse factors are non-zero and multiply to one."
        ],
        lawRefs: [
          {
            id: "law.algebra.multiplicative-inverse-cancellation",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "expression.before",
            sourceSelectorRole: "context.persistent",
            targetObjectRole: "expression.after",
            targetSelectorRole: "context.persistent",
            preserves: ["identity", "role"]
          }
        ]
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.algebra.combine-like-terms",
        transformType: "combineLikeTerms",
        title: "Combine like terms",
        sourceObjectRoles: ["expression.before"],
        targetObjectRoles: ["expression.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "Like terms share the same symbolic factor and only their coefficients combine."
        ],
        lawRefs: [
          {
            id: "law.algebra.combine-like-terms",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "expression.before",
            sourceSelectorRole: "context.persistent",
            targetObjectRole: "expression.after",
            targetSelectorRole: "context.persistent",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "expression.before",
            sourceSelectorRole: "like.coefficient.left",
            targetObjectRole: "expression.after",
            targetSelectorRole: "like.coefficient.combined",
            preserves: ["role"]
          },
          {
            sourceObjectRole: "expression.before",
            sourceSelectorRole: "like.factor.left",
            targetObjectRole: "expression.after",
            targetSelectorRole: "like.factor.combined",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "expression.before",
            sourceSelectorRole: "like.coefficient.right",
            targetObjectRole: "expression.after",
            targetSelectorRole: "like.coefficient.combined",
            preserves: ["role"]
          },
          {
            sourceObjectRole: "expression.before",
            sourceSelectorRole: "like.factor.right",
            targetObjectRole: "expression.after",
            targetSelectorRole: "like.factor.combined",
            preserves: ["identity", "role"]
          }
        ]
      })
    ],
    visualMotifs: [
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
    ],
    runtimeSamples: [
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
    ],
    graphEquivalents: [
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
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.linear-simplify.cancel-combine",
        fixtureFamilyId: "generated.linear-simplify",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated simplification traces can map inverse-pair cancellation and like-term combination to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.algebra.cancel-combine.predict-next",
        kind: "predict-next",
        transformationDefinitionIds: definitionIds,
        summary:
          "Predict-next cards can ask which inverse pair vanishes or which like terms combine next."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId("family.algebra.cancel-combine"),
      tags: [
        "cancelation",
        "simplification",
        "like-terms",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for cancellation and combining like terms with reversible vanish/coalesce motifs.",
      searchSummary:
        "cancel additive inverses multiplicative inverses combine like terms simplify reversible midpoint vanish coalesce replacement",
      graphEquivalentKinds: "expression-evaluation"
    }
  });
}

export function createAlgebraDistributionFactoringFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.algebra.distribute-product-over-sum",
    "definition.symbolic.algebra.factor-common-term"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.algebra.distribution-factoring",
    title: "Distribution and factoring",
    domain: "algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "expression.factored",
        objectType: "expression",
        title: "Factored expression",
        selectorRoles: [
          { id: "context.persistent", kind: "context" },
          { id: "factor.shared", kind: "factor" },
          { id: "product.operator", kind: "operator" },
          { id: "group.open", kind: "wrapper" },
          { id: "group.term.left", kind: "term" },
          { id: "group.operator", kind: "operator" },
          { id: "group.term.right", kind: "term" },
          { id: "group.close", kind: "wrapper" }
        ]
      },
      {
        id: "expression.distributed",
        objectType: "expression",
        title: "Distributed expression",
        selectorRoles: [
          { id: "context.persistent", kind: "context" },
          { id: "factor.left.copy", kind: "factor" },
          { id: "product.operator.left", kind: "operator" },
          { id: "term.left", kind: "term" },
          { id: "distributed.operator", kind: "operator" },
          { id: "factor.right.copy", kind: "factor" },
          { id: "product.operator.right", kind: "operator" },
          { id: "term.right", kind: "term" }
        ]
      }
    ],
    transformationDefinitions: [
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.algebra.distribute-product-over-sum",
        transformType: "distributeProductOverSum",
        title: "Distribute product over sum",
        sourceObjectRoles: ["expression.factored"],
        targetObjectRoles: ["expression.distributed"],
        preserves: ["value", "structure"],
        assumptions: [
          "The grouped terms form a sum or difference and the shared factor applies to the whole group."
        ],
        lawRefs: [
          {
            id: "law.algebra.distribution",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "expression.factored",
            sourceSelectorRole: "context.persistent",
            targetObjectRole: "expression.distributed",
            targetSelectorRole: "context.persistent",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "expression.factored",
            sourceSelectorRole: "factor.shared",
            targetObjectRole: "expression.distributed",
            targetSelectorRole: "factor.left.copy",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "expression.factored",
            sourceSelectorRole: "factor.shared",
            targetObjectRole: "expression.distributed",
            targetSelectorRole: "factor.right.copy",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "expression.factored",
            sourceSelectorRole: "group.term.left",
            targetObjectRole: "expression.distributed",
            targetSelectorRole: "term.left",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "expression.factored",
            sourceSelectorRole: "group.operator",
            targetObjectRole: "expression.distributed",
            targetSelectorRole: "distributed.operator",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "expression.factored",
            sourceSelectorRole: "group.term.right",
            targetObjectRole: "expression.distributed",
            targetSelectorRole: "term.right",
            preserves: ["identity", "role"]
          }
        ]
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.algebra.factor-common-term",
        transformType: "factorCommonTerm",
        title: "Factor a common term",
        sourceObjectRoles: ["expression.distributed"],
        targetObjectRoles: ["expression.factored"],
        preserves: ["value", "structure"],
        assumptions: [
          "Distributed terms share a common factor that can be reconciled into one factored role."
        ],
        lawRefs: [
          {
            id: "law.algebra.common-factor",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "expression.distributed",
            sourceSelectorRole: "context.persistent",
            targetObjectRole: "expression.factored",
            targetSelectorRole: "context.persistent",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "expression.distributed",
            sourceSelectorRole: "factor.left.copy",
            targetObjectRole: "expression.factored",
            targetSelectorRole: "factor.shared",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "expression.distributed",
            sourceSelectorRole: "factor.right.copy",
            targetObjectRole: "expression.factored",
            targetSelectorRole: "factor.shared",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "expression.distributed",
            sourceSelectorRole: "term.left",
            targetObjectRole: "expression.factored",
            targetSelectorRole: "group.term.left",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "expression.distributed",
            sourceSelectorRole: "distributed.operator",
            targetObjectRole: "expression.factored",
            targetSelectorRole: "group.operator",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "expression.distributed",
            sourceSelectorRole: "term.right",
            targetObjectRole: "expression.factored",
            targetSelectorRole: "group.term.right",
            preserves: ["identity", "role"]
          }
        ]
      })
    ],
    visualMotifs: [
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
    ],
    runtimeSamples: [
      {
        id: "sample.animation.distribution.expand-a-sum",
        animationId: "animation.generated.distribution.expand-a-sum",
        availability: "concrete",
        renderTargetKinds: ["equation"],
        transformationDefinitionIds: [
          "definition.symbolic.algebra.distribute-product-over-sum"
        ],
        summary:
          "The expand-a-sum animation copies a shared factor into both products with a reversible sweep."
      },
      {
        id: "sample.animation.factoring.factor-common-a",
        animationId: "animation.generated.distribution.factor-common-a",
        availability: "concrete",
        renderTargetKinds: ["equation"],
        transformationDefinitionIds: [
          "definition.symbolic.algebra.factor-common-term"
        ],
        summary:
          "The factor-common-a animation reconciles matching factor copies before wrapping the remaining sum."
      }
    ],
    graphEquivalents: [
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
        sampleAssetIds: [
          "animation.generated.distribution.expand-a-sum",
          "animation.generated.distribution.factor-common-a"
        ],
        summary:
          "Distribution splits one rectangle into pieces while factoring regroups equal total area."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.algebra-expand-factor.distribution",
        fixtureFamilyId: "generated.algebra-expand-factor",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated expand/factor traces can map copied factors, grouped terms, and artifact wrappers to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.algebra.distribution-factoring.relationship",
        kind: "relationship",
        transformationDefinitionIds: definitionIds,
        summary:
          "Relationship cards can ask which distributed factors reconcile into a shared factor."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.algebra.distribution-factoring"
      ),
      tags: [
        "distribution",
        "factoring",
        "inverse-operation",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for distributing products over sums and factoring common terms.",
      searchSummary:
        "distribute factor common term expand collect inverse operation copied factor grouped artifacts area model",
      graphEquivalentKinds: "area-model"
    }
  });
}

export function createAlgebraFractionSimplificationFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.algebra.split-fraction-sum",
    "definition.symbolic.algebra.merge-fractions",
    "definition.symbolic.algebra.cancel-common-factor",
    "definition.symbolic.algebra.create-common-denominator",
    "definition.symbolic.algebra.reciprocal-rewrite"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.algebra.fraction-simplification",
    title: "Fraction simplification",
    domain: "algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "fraction.before",
        objectType: "fraction",
        title: "Fraction before rewrite",
        selectorRoles: [
          { id: "numerator", kind: "term" },
          { id: "fraction.bar", kind: "fraction-bar" },
          { id: "denominator", kind: "term" },
          { id: "common.factor.numerator", kind: "factor" },
          { id: "common.factor.denominator", kind: "factor" }
        ]
      },
      {
        id: "fraction.after",
        objectType: "fraction",
        title: "Fraction after rewrite",
        selectorRoles: [
          { id: "numerator", kind: "term" },
          { id: "fraction.bar", kind: "fraction-bar" },
          { id: "denominator", kind: "term" },
          { id: "operation.artifact", kind: "operator" },
          { id: "denominator.copy", kind: "term" }
        ]
      }
    ],
    transformationDefinitions: [
      createFractionDefinition({
        id: "definition.symbolic.algebra.split-fraction-sum",
        transformType: "splitFractionSum",
        title: "Split a fraction over a numerator sum",
        lawId: "law.algebra.fraction-sum-split",
        preserves: ["value", "structure"],
        assumption:
          "The numerator is a sum or difference whose terms can each share the same denominator."
      }),
      createFractionDefinition({
        id: "definition.symbolic.algebra.merge-fractions",
        transformType: "mergeFractions",
        title: "Merge fractions over a common denominator",
        lawId: "law.algebra.fraction-sum-merge",
        sourceObjectRole: "fraction.after",
        targetObjectRole: "fraction.before",
        preserves: ["value", "structure"],
        assumption:
          "Fractions have a compatible denominator and can be merged into one numerator expression."
      }),
      createFractionDefinition({
        id: "definition.symbolic.algebra.cancel-common-factor",
        transformType: "cancelCommonFactor",
        title: "Cancel a common numerator and denominator factor",
        lawId: "law.algebra.fraction-common-factor",
        preserves: ["value"],
        assumption:
          "Common numerator and denominator factors are equal and non-zero."
      }),
      createFractionDefinition({
        id: "definition.symbolic.algebra.create-common-denominator",
        transformType: "createCommonDenominator",
        title: "Create a common denominator",
        lawId: "law.algebra.common-denominator",
        preserves: ["value", "structure"],
        assumption:
          "Multiplying numerator and denominator by the same non-zero expression preserves value."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.algebra.reciprocal-rewrite",
        transformType: "reciprocalRewrite",
        title: "Rewrite as a reciprocal fraction",
        sourceObjectRoles: ["fraction.before"],
        targetObjectRoles: ["fraction.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "The denominator is non-zero and reciprocal notation swaps numerator and denominator roles."
        ],
        lawRefs: [
          {
            id: "law.algebra.reciprocal-rewrite",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "fraction.before",
            sourceSelectorRole: "numerator",
            targetObjectRole: "fraction.after",
            targetSelectorRole: "denominator",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "fraction.before",
            sourceSelectorRole: "denominator",
            targetObjectRole: "fraction.after",
            targetSelectorRole: "numerator",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "fraction.before",
            sourceSelectorRole: "fraction.bar",
            targetObjectRole: "fraction.after",
            targetSelectorRole: "fraction.bar",
            preserves: ["presentation", "role"]
          }
        ]
      })
    ],
    visualMotifs: [
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
    ],
    runtimeSamples: [
      {
        id: "sample.animation.fraction-simplification.basic",
        animationId: "animation.generated.fraction-expression.two-fourths",
        availability: "concrete",
        renderTargetKinds: ["equation"],
        transformationDefinitionIds: definitionIds,
        summary:
          "Basic rational-expression sample exercises split, merge, simplify, common-denominator, and reciprocal forms."
      }
    ],
    graphEquivalents: [
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
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.rational-simplify.fraction",
        fixtureFamilyId: "generated.rational-simplify",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated rational-expression traces can map fraction bar, denominator-copy, and reciprocal steps to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.algebra.fraction.predict-next",
        kind: "predict-next",
        transformationDefinitionIds: definitionIds,
        summary:
          "Predict-next cards can hide the next fraction rewrite or ask which denominator copy appears."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.algebra.fraction-simplification"
      ),
      tags: [
        "fraction",
        "simplification",
        "common-denominator",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for splitting, merging, simplifying, common-denominator, and reciprocal fraction rewrites.",
      searchSummary:
        "fraction simplify split merge reciprocal common denominator numerator denominator fraction bar rational value",
      graphEquivalentKinds: "number-line"
    }
  });
}

function createFractionDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly preserves: readonly ["value"] | readonly ["value", "structure"];
  readonly assumption: string;
  readonly sourceObjectRole?: string | undefined;
  readonly targetObjectRole?: string | undefined;
}) {
  const sourceObjectRole = input.sourceObjectRole ?? "fraction.before";
  const targetObjectRole = input.targetObjectRole ?? "fraction.after";

  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: [sourceObjectRole],
    targetObjectRoles: [targetObjectRole],
    preserves: input.preserves,
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole,
        sourceSelectorRole: "numerator",
        targetObjectRole,
        targetSelectorRole: "numerator",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole,
        sourceSelectorRole: "fraction.bar",
        targetObjectRole,
        targetSelectorRole: "fraction.bar",
        preserves: ["presentation", "role"]
      },
      {
        sourceObjectRole,
        sourceSelectorRole: "denominator",
        targetObjectRole,
        targetSelectorRole: "denominator",
        preserves: ["identity", "role"]
      }
    ]
  });
}

export function createAlgebraExponentLogFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.algebra.multiply-same-base-powers",
    "definition.symbolic.algebra.divide-same-base-powers",
    "definition.symbolic.algebra.power-of-power",
    "definition.symbolic.algebra.power-to-root",
    "definition.symbolic.algebra.log-exp-inverse",
    "definition.symbolic.algebra.log-product"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.algebra.exponent-log-laws",
    title: "Exponent and logarithm laws",
    domain: "algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "power.before",
        objectType: "expression",
        title: "Power or function expression before rewrite",
        selectorRoles: [
          { id: "base", kind: "term" },
          { id: "exponent.left", kind: "exponent" },
          { id: "operator", kind: "operator" },
          { id: "exponent.right", kind: "exponent" },
          { id: "function.name", kind: "function-name" },
          { id: "function.argument", kind: "argument" },
          { id: "function.open", kind: "wrapper" },
          { id: "function.close", kind: "wrapper" }
        ]
      },
      {
        id: "power.after",
        objectType: "expression",
        title: "Power or function expression after rewrite",
        selectorRoles: [
          { id: "base", kind: "term" },
          { id: "exponent", kind: "exponent" },
          { id: "operator", kind: "operator" },
          { id: "function.name", kind: "function-name" },
          { id: "function.argument", kind: "argument" },
          { id: "function.open", kind: "wrapper" },
          { id: "function.close", kind: "wrapper" },
          { id: "radical.index", kind: "radical-index" },
          { id: "radical.path", kind: "radical-path" },
          { id: "artifact.operator", kind: "operator" }
        ]
      }
    ],
    transformationDefinitions: [
      createPowerDefinition({
        id: "definition.symbolic.algebra.multiply-same-base-powers",
        transformType: "multiplySameBasePowers",
        title: "Multiply powers with the same base",
        lawId: "law.algebra.exponent-product",
        assumption:
          "Powers have the same base, so exponents combine by addition under the domain assumptions."
      }),
      createPowerDefinition({
        id: "definition.symbolic.algebra.divide-same-base-powers",
        transformType: "divideSameBasePowers",
        title: "Divide powers with the same base",
        lawId: "law.algebra.exponent-quotient",
        assumption:
          "Powers have the same non-zero base, so exponents combine by subtraction."
      }),
      createPowerDefinition({
        id: "definition.symbolic.algebra.power-of-power",
        transformType: "powerOfPower",
        title: "Rewrite a power of a power",
        lawId: "law.algebra.power-of-power",
        assumption:
          "Nested powers share one base and compose exponents under the domain assumptions."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.algebra.power-to-root",
        transformType: "powerToRoot",
        title: "Rewrite a rational power as a root",
        sourceObjectRoles: ["power.before"],
        targetObjectRoles: ["power.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "The base and root index satisfy the domain assumptions for the chosen real or complex branch."
        ],
        lawRefs: [
          {
            id: "law.algebra.power-root",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "power.before",
            sourceSelectorRole: "base",
            targetObjectRole: "power.after",
            targetSelectorRole: "base",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "power.before",
            sourceSelectorRole: "exponent.left",
            targetObjectRole: "power.after",
            targetSelectorRole: "radical.index",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "power.before",
            sourceSelectorRole: "exponent.right",
            targetObjectRole: "power.after",
            targetSelectorRole: "radical.path",
            preserves: ["presentation", "role"]
          }
        ]
      }),
      createFunctionWrapDefinition({
        id: "definition.symbolic.algebra.log-exp-inverse",
        transformType: "logExpInverse",
        title: "Cancel logarithm and exponential wrappers",
        lawId: "law.algebra.log-exp-inverse",
        assumption:
          "Logarithm and exponential wrappers are inverse functions on the represented domain."
      }),
      createFunctionWrapDefinition({
        id: "definition.symbolic.algebra.log-product",
        transformType: "logProduct",
        title: "Rewrite logarithm of a product",
        lawId: "law.algebra.log-product",
        assumption:
          "Log product rewrites require positive factors in the real-valued setting."
      })
    ],
    visualMotifs: [
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
    ],
    runtimeSamples: [
      {
        id: "sample.animation.exponent-combine.square-as-product",
        animationId: "animation.generated.exponent.square-as-product",
        availability: "concrete",
        renderTargetKinds: ["equation"],
        transformationDefinitionIds: [
          "definition.symbolic.algebra.multiply-same-base-powers"
        ],
        summary:
          "The square-as-product animation rewinds repeated factors into an exponent-combine view with a persistent base."
      },
      {
        id: "sample.animation.radical-rewrite.square-root-as-power",
        animationId: "animation.generated.radical.square-root-as-power",
        availability: "concrete",
        renderTargetKinds: ["equation"],
        transformationDefinitionIds: [
          "definition.symbolic.algebra.power-to-root"
        ],
        summary:
          "The square-root-as-power animation folds rational exponent geometry into a radical while preserving the base."
      },
      {
        id: "sample.animation.function-wrap.apply-f",
        animationId: "animation.generated.function-wrap.apply-f",
        availability: "concrete",
        renderTargetKinds: ["equation"],
        summary:
          "The apply-f animation exercises the family function-wrap motif while preserving argument identity and wrapper ownership."
      }
    ],
    graphEquivalents: [
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
        sampleAssetIds: [
          "animation.generated.exponent.square-as-product",
          "animation.generated.radical.square-root-as-power"
        ],
        summary:
          "Exponent, root, and logarithm rewrites preserve function values where the domain assumptions hold."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.exponent-log-simplify",
        fixtureFamilyId: "generated.exponent-log-simplify",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated exponent/log traces can map base persistence, exponent combination, radical folds, and function wrappers to this family."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.algebra.exponent-log.cloze",
        kind: "cloze",
        transformationDefinitionIds: definitionIds,
        summary:
          "Cloze cards can hide the resulting exponent, radical index, or unwrapped argument."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId("family.algebra.exponent-log-laws"),
      tags: [
        "exponent",
        "logarithm",
        "inverse-operation",
        "radical",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for powers, roots, exponent laws, logarithm laws, and inverse rewrites.",
      searchSummary:
        "exponent logarithm power root radical inverse product quotient law base argument function wrapper",
      graphEquivalentKinds: "function-graph"
    }
  });
}

function createPowerDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["power.before"],
    targetObjectRoles: ["power.after"],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "power.before",
        sourceSelectorRole: "base",
        targetObjectRole: "power.after",
        targetSelectorRole: "base",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "power.before",
        sourceSelectorRole: "exponent.left",
        targetObjectRole: "power.after",
        targetSelectorRole: "exponent",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "power.before",
        sourceSelectorRole: "exponent.right",
        targetObjectRole: "power.after",
        targetSelectorRole: "exponent",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "power.before",
        sourceSelectorRole: "operator",
        targetObjectRole: "power.after",
        targetSelectorRole: "artifact.operator",
        preserves: ["presentation", "role"]
      }
    ]
  });
}

function createFunctionWrapDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["power.before"],
    targetObjectRoles: ["power.after"],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "power.before",
        sourceSelectorRole: "function.argument",
        targetObjectRole: "power.after",
        targetSelectorRole: "function.argument",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "power.before",
        sourceSelectorRole: "function.name",
        targetObjectRole: "power.after",
        targetSelectorRole: "function.name",
        preserves: ["role"]
      },
      {
        sourceObjectRole: "power.before",
        sourceSelectorRole: "function.open",
        targetObjectRole: "power.after",
        targetSelectorRole: "function.open",
        preserves: ["presentation", "role"]
      },
      {
        sourceObjectRole: "power.before",
        sourceSelectorRole: "function.close",
        targetObjectRole: "power.after",
        targetSelectorRole: "function.close",
        preserves: ["presentation", "role"]
      }
    ]
  });
}

export function createAlgebraInequalityFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.algebra.inequality-add-both-sides",
    "definition.symbolic.algebra.inequality-multiply-positive",
    "definition.symbolic.algebra.inequality-multiply-negative",
    "definition.symbolic.algebra.inequality-divide-negative"
  ];
  const signFlipDefinitionIds = [
    "definition.symbolic.algebra.inequality-multiply-negative",
    "definition.symbolic.algebra.inequality-divide-negative"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.algebra.inequality",
    title: "Inequality transformations",
    domain: "algebra",
    status: "promoted",
    objectRoles: [
      {
        id: "inequality.before",
        objectType: "inequality",
        title: "Inequality before operation",
        selectorRoles: [
          { id: "lhs.term", kind: "term" },
          { id: "relation", kind: "relation" },
          { id: "rhs.term", kind: "term" },
          { id: "multiplier.sign", kind: "sign" }
        ]
      },
      {
        id: "inequality.after",
        objectType: "inequality",
        title: "Inequality after operation",
        selectorRoles: [
          { id: "lhs.term", kind: "term" },
          { id: "relation", kind: "relation" },
          { id: "relation.flip", kind: "relation" },
          { id: "rhs.term", kind: "term" },
          { id: "operation.artifact", kind: "term" }
        ]
      }
    ],
    transformationDefinitions: [
      createInequalityDefinition({
        id: "definition.symbolic.algebra.inequality-add-both-sides",
        transformType: "addBothSidesInequality",
        title: "Add the same quantity to both sides of an inequality",
        lawId: "law.inequality.add-both-sides",
        assumption: "Adding the same quantity preserves inequality order.",
        targetRelationSelector: "relation"
      }),
      createInequalityDefinition({
        id: "definition.symbolic.algebra.inequality-multiply-positive",
        transformType: "multiplyPositiveBothSidesInequality",
        title: "Multiply both sides of an inequality by a positive quantity",
        lawId: "law.inequality.multiply-positive",
        assumption: "Multiplication by a positive quantity preserves order.",
        targetRelationSelector: "relation"
      }),
      createInequalityDefinition({
        id: "definition.symbolic.algebra.inequality-multiply-negative",
        transformType: "multiplyNegativeBothSidesInequality",
        title: "Multiply both sides of an inequality by a negative quantity",
        lawId: "law.inequality.multiply-negative-flip",
        assumption:
          "Multiplication by a negative quantity preserves the solution set only when the relation flips.",
        targetRelationSelector: "relation.flip"
      }),
      createInequalityDefinition({
        id: "definition.symbolic.algebra.inequality-divide-negative",
        transformType: "divideNegativeBothSidesInequality",
        title: "Divide both sides of an inequality by a negative quantity",
        lawId: "law.inequality.divide-negative-flip",
        assumption:
          "Division by a negative quantity preserves the solution set only when the relation flips.",
        targetRelationSelector: "relation.flip"
      })
    ],
    visualMotifs: [
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
        transformationDefinitionIds: signFlipDefinitionIds,
        summary:
          "Negative scaling keeps both sides equivalent only when the relation glyph flips as a first-class semantic event."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.inequality.sign-flip.basic",
        animationId: "animation.inequality.sign-flip.basic",
        availability: "concrete",
        renderTargetKinds: ["equation"],
        transformationDefinitionIds: [
          "definition.symbolic.algebra.inequality-multiply-negative"
        ],
        summary:
          "Basic inequality sign-flip sample exercises relation.flip semantics for negative scaling."
      }
    ],
    graphEquivalents: [
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
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.inequality-solve.sign-flip",
        fixtureFamilyId: "generated.inequality-solve",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated inequality-solving traces can require a valid sign-flip transform before animating negative scaling."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.algebra.inequality.sign-flip",
        kind: "predict-next",
        transformationDefinitionIds: signFlipDefinitionIds,
        summary:
          "Predict-next cards can ask whether the inequality relation should flip."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId("family.algebra.inequality"),
      tags: [
        "inequality",
        "sign-flip",
        "validity",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for inequality-preserving operations and sign-flip cases.",
      searchSummary:
        "inequality preserve order sign flip multiply divide negative valid transform number line solution set",
      graphEquivalentKinds: "number-line,region-graph"
    }
  });
}

function createInequalityDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly assumption: string;
  readonly targetRelationSelector: "relation" | "relation.flip";
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["inequality.before"],
    targetObjectRoles: ["inequality.after"],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "inequality.before",
        sourceSelectorRole: "lhs.term",
        targetObjectRole: "inequality.after",
        targetSelectorRole: "lhs.term",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "inequality.before",
        sourceSelectorRole: "relation",
        targetObjectRole: "inequality.after",
        targetSelectorRole: input.targetRelationSelector,
        preserves:
          input.targetRelationSelector === "relation"
            ? ["presentation", "role"]
            : ["role"]
      },
      {
        sourceObjectRole: "inequality.before",
        sourceSelectorRole: "rhs.term",
        targetObjectRole: "inequality.after",
        targetSelectorRole: "rhs.term",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "inequality.before",
        sourceSelectorRole: "multiplier.sign",
        targetObjectRole: "inequality.after",
        targetSelectorRole: "operation.artifact",
        preserves: ["value", "role"]
      }
    ]
  });
}

export const kpAlgebraSymbolicManipulationFamilyPack =
  createKpSymbolicManipulationFamilyPackDeclaration({
    id: "symbolic-family-pack.algebra",
    domain: "algebra",
    familyIds: [
      "family.algebra.both-sides",
      "family.algebra.cancel-combine",
      "family.algebra.distribution-factoring",
      "family.algebra.fraction-simplification",
      "family.algebra.exponent-log-laws",
      "family.algebra.inequality"
],
    createFamilies: () => [
      createAlgebraBothSidesFamily(),
      createAlgebraCancelCombineFamily(),
      createAlgebraDistributionFactoringFamily(),
      createAlgebraFractionSimplificationFamily(),
      createAlgebraExponentLogFamily(),
      createAlgebraInequalityFamily()
    ]
  });
