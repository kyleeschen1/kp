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

export function createCalculusDerivativeRulesFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.calculus.derivative-sum-rule",
    "definition.symbolic.calculus.derivative-constant-multiple",
    "definition.symbolic.calculus.derivative-power-rule",
    "definition.symbolic.calculus.derivative-product-rule",
    "definition.symbolic.calculus.derivative-quotient-rule",
    "definition.symbolic.calculus.derivative-chain-rule"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.calculus.derivative-rules",
    title: "Derivative rules",
    domain: "calculus",
    status: "promoted",
    objectRoles: [
      {
        id: "derivative.before",
        objectType: "derivative-expression",
        title: "Derivative expression before rule application",
        selectorRoles: [
          { id: "derivative.operator", kind: "operator" },
          { id: "outer.function", kind: "function" },
          { id: "inner.function", kind: "function" },
          { id: "variable", kind: "variable" },
          { id: "exponent", kind: "exponent" },
          { id: "factor.left", kind: "factor" },
          { id: "factor.right", kind: "factor" }
        ]
      },
      {
        id: "derivative.after",
        objectType: "derivative-expression",
        title: "Derivative expression after rule application",
        selectorRoles: [
          { id: "derivative.operator", kind: "operator" },
          { id: "outer.derivative", kind: "function" },
          { id: "inner.derivative", kind: "function" },
          { id: "variable", kind: "variable" },
          { id: "exponent.decremented", kind: "exponent" },
          { id: "coefficient", kind: "coefficient" },
          { id: "product.operator", kind: "operator" },
          { id: "quotient.bar", kind: "fraction-bar" }
        ]
      },
      {
        id: "derivative.secant-finite",
        objectType: "derivative-expression",
        title: "Finite difference quotient",
        selectorRoles: [
          { id: "quotient", kind: "fraction" },
          { id: "anchor", kind: "function-value" },
          { id: "increment", kind: "variable" }
        ]
      },
      {
        id: "derivative.limit",
        objectType: "derivative-expression",
        title: "Derivative at an anchor",
        selectorRoles: [
          { id: "derivative.operator", kind: "derivative-operator" },
          { id: "anchor", kind: "argument" },
          { id: "value", kind: "value" }
        ]
      }
    ],
    transformationDefinitions: [
      createDerivativeDefinition({
        id: "definition.symbolic.calculus.derivative-sum-rule",
        transformType: "derivativeSumRule",
        title: "Apply the derivative sum rule",
        lawId: "law.calculus.derivative-sum",
        assumption: "The derivative is linear over finite sums."
      }),
      createDerivativeDefinition({
        id: "definition.symbolic.calculus.derivative-constant-multiple",
        transformType: "derivativeConstantMultipleRule",
        title: "Apply the derivative constant multiple rule",
        lawId: "law.calculus.derivative-constant-multiple",
        assumption: "The constant factor is independent of the differentiation variable."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.calculus.derivative-power-rule",
        transformType: "derivativePowerRule",
        title: "Apply the derivative power rule",
        sourceObjectRoles: ["derivative.before"],
        targetObjectRoles: ["derivative.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "The power rule applies for the represented exponent and differentiation domain."
        ],
        lawRefs: [
          {
            id: "law.calculus.derivative-power",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "derivative.before",
            sourceSelectorRole: "variable",
            targetObjectRole: "derivative.after",
            targetSelectorRole: "variable",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "derivative.before",
            sourceSelectorRole: "exponent",
            targetObjectRole: "derivative.after",
            targetSelectorRole: "coefficient",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "derivative.before",
            sourceSelectorRole: "exponent",
            targetObjectRole: "derivative.after",
            targetSelectorRole: "exponent.decremented",
            preserves: ["value", "role"]
          }
        ]
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.calculus.derivative-limit",
        transformType: "convergeDifferenceQuotient",
        title: "Converge a finite difference quotient to the derivative",
        sourceObjectRoles: ["derivative.secant-finite"],
        targetObjectRoles: ["derivative.limit"],
        preserves: ["value", "role"],
        assumptions: [
          "The represented function is differentiable at the fixed anchor."
        ],
        lawRefs: [
          {
            id: "law.calculus.derivative.difference-quotient-limit",
            level: "sampled"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "derivative.secant-finite",
            sourceSelectorRole: "quotient",
            targetObjectRole: "derivative.limit",
            targetSelectorRole: "derivative.operator",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "derivative.secant-finite",
            sourceSelectorRole: "anchor",
            targetObjectRole: "derivative.limit",
            targetSelectorRole: "anchor",
            preserves: ["identity", "role"]
          }
        ]
      }),
      createDerivativeDefinition({
        id: "definition.symbolic.calculus.derivative-product-rule",
        transformType: "derivativeProductRule",
        title: "Apply the derivative product rule",
        lawId: "law.calculus.derivative-product",
        assumption:
          "Both factors are differentiable and the product rule expands into two coordinated branches."
      }),
      createDerivativeDefinition({
        id: "definition.symbolic.calculus.derivative-quotient-rule",
        transformType: "derivativeQuotientRule",
        title: "Apply the derivative quotient rule",
        lawId: "law.calculus.derivative-quotient",
        assumption:
          "The denominator is non-zero and both numerator and denominator are differentiable."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.calculus.derivative-chain-rule",
        transformType: "derivativeChainRule",
        title: "Apply the derivative chain rule",
        sourceObjectRoles: ["derivative.before"],
        targetObjectRoles: ["derivative.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "The outer and inner functions are differentiable on the represented domain."
        ],
        lawRefs: [
          {
            id: "law.calculus.derivative-chain",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "derivative.before",
            sourceSelectorRole: "outer.function",
            targetObjectRole: "derivative.after",
            targetSelectorRole: "outer.derivative",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "derivative.before",
            sourceSelectorRole: "inner.function",
            targetObjectRole: "derivative.after",
            targetSelectorRole: "inner.derivative",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "derivative.before",
            sourceSelectorRole: "variable",
            targetObjectRole: "derivative.after",
            targetSelectorRole: "variable",
            preserves: ["identity", "role"]
          }
        ]
      })
    ],
    visualMotifs: [
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
        id: "motif.calculus.derivative.limit-convergence",
        motifKind: "limit-convergence",
        transformationDefinitionIds: [
          "definition.symbolic.calculus.derivative-limit"
        ],
        summary:
          "A finite secant and its difference quotient continuously approach the tangent and derivative at one fixed anchor."
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
    ],
    runtimeSamples: [
      {
        id: "sample.animation.derivative-rules.basic",
        animationId:
          "animation.generated.calculus.derivative.power-rule-x-cubed",
        availability: "concrete",
        renderTargetKinds: ["equation"],
        transformationDefinitionIds: [
          "definition.symbolic.calculus.derivative-power-rule"
        ],
        summary:
          "Generated x-cubed derivative sample exercises the power-rule exponent drop into coefficient position."
      },
      {
        id: "sample.animation.derivative-rules.tangent-graph",
        animationId: "animation.derivative-rules.tangent-graph",
        availability: "concrete",
        renderTargetKinds: ["graph"],
        transformationDefinitionIds: [
          "definition.symbolic.calculus.derivative-limit"
        ],
        summary:
          "The x-cubed graph sample synchronizes a KaTeX finite difference quotient with secant-to-tangent convergence."
      }
    ],
    graphEquivalents: [
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
        sampleAssetIds: [
          "animation.generated.calculus.derivative.power-rule-x-cubed"
        ],
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
          "One shared h parameter drives the finite quotient, moving curve point, secant slope, tangent limit, and exact rewind."
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.calculus-derivative-rules",
        fixtureFamilyId: "generated.calculus-derivative-rules",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated derivative traces can map each rule application to reusable derivative animations."
      }
    ],
    flashcardHooks: [
      {
        id: "hook.flashcard.calculus.derivative-rule.pick",
        kind: "predict-next",
        transformationDefinitionIds: definitionIds,
        summary:
          "Predict-next cards can ask which derivative rule applies and what sub-derivative appears next."
      }
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId("family.calculus.derivative-rules"),
      tags: [
        "derivative",
        "chain-rule",
        "tangent",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for sum, constant multiple, power, product, quotient, and chain derivative rules.",
      searchSummary:
        "derivative sum power product quotient chain rule tangent slope exponent drop composite branch",
      graphEquivalentKinds: "tangent-line"
    }
  });
}

function createDerivativeDefinition(input: {
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
    sourceObjectRoles: ["derivative.before"],
    targetObjectRoles: ["derivative.after"],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "derivative.before",
        sourceSelectorRole: "derivative.operator",
        targetObjectRole: "derivative.after",
        targetSelectorRole: "derivative.operator",
        preserves: ["presentation", "role"]
      },
      {
        sourceObjectRole: "derivative.before",
        sourceSelectorRole: "factor.left",
        targetObjectRole: "derivative.after",
        targetSelectorRole: "outer.derivative",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "derivative.before",
        sourceSelectorRole: "factor.right",
        targetObjectRole: "derivative.after",
        targetSelectorRole: "inner.derivative",
        preserves: ["identity", "role"]
      }
    ]
  });
}

export function createCalculusIntegralFtcFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.calculus.integral-sum-rule",
    "definition.symbolic.calculus.antiderivative-rule",
    "definition.symbolic.calculus.definite-integral-ftc",
    "definition.symbolic.calculus.accumulation-derivative-ftc"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.calculus.integral-ftc",
    title: "Integral and FTC transformations",
    domain: "calculus",
    status: "promoted",
    objectRoles: [
      {
        id: "integral.before",
        objectType: "integral-expression",
        title: "Integral expression before rewrite",
        selectorRoles: [
          { id: "integral.sign", kind: "operator" },
          { id: "lower.bound", kind: "bound" },
          { id: "upper.bound", kind: "bound" },
          { id: "integrand", kind: "function" },
          { id: "differential", kind: "operator" },
          { id: "variable", kind: "variable" }
        ]
      },
      {
        id: "integral.after",
        objectType: "integral-expression",
        title: "Integral expression after rewrite",
        selectorRoles: [
          { id: "antiderivative", kind: "function" },
          { id: "lower.bound", kind: "bound" },
          { id: "upper.bound", kind: "bound" },
          { id: "evaluation.bar", kind: "operator" },
          { id: "variable", kind: "variable" },
          { id: "area.region", kind: "graph-region" }
        ]
      }
    ],
    transformationDefinitions: [
      createIntegralDefinition({
        id: "definition.symbolic.calculus.integral-sum-rule",
        transformType: "integralSumRule",
        title: "Apply the integral sum rule",
        lawId: "law.calculus.integral-sum",
        assumption: "The integral is linear over finite sums."
      }),
      createIntegralDefinition({
        id: "definition.symbolic.calculus.antiderivative-rule",
        transformType: "antiderivativeRule",
        title: "Rewrite an indefinite integral as an antiderivative",
        lawId: "law.calculus.antiderivative",
        assumption:
          "The chosen antiderivative differentiates back to the integrand on the represented domain."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.calculus.definite-integral-ftc",
        transformType: "definiteIntegralFtc",
        title: "Evaluate a definite integral by the Fundamental Theorem of Calculus",
        sourceObjectRoles: ["integral.before"],
        targetObjectRoles: ["integral.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "The integrand is continuous on the interval and has the represented antiderivative."
        ],
        lawRefs: [
          {
            id: "law.calculus.ftc-evaluation",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "integral.before",
            sourceSelectorRole: "integrand",
            targetObjectRole: "integral.after",
            targetSelectorRole: "antiderivative",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "integral.before",
            sourceSelectorRole: "lower.bound",
            targetObjectRole: "integral.after",
            targetSelectorRole: "lower.bound",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "integral.before",
            sourceSelectorRole: "upper.bound",
            targetObjectRole: "integral.after",
            targetSelectorRole: "upper.bound",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "integral.before",
            sourceSelectorRole: "variable",
            targetObjectRole: "integral.after",
            targetSelectorRole: "variable",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "integral.before",
            sourceSelectorRole: "integral.sign",
            targetObjectRole: "integral.after",
            targetSelectorRole: "evaluation.bar",
            preserves: ["presentation", "role"]
          }
        ]
      }),
      createIntegralDefinition({
        id: "definition.symbolic.calculus.accumulation-derivative-ftc",
        transformType: "accumulationDerivativeFtc",
        title: "Relate an accumulation function derivative to its integrand",
        lawId: "law.calculus.ftc-accumulation-derivative",
        assumption:
          "The upper bound varies and the integrand is continuous on the accumulated interval."
      })
    ],
    visualMotifs: [
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
    ],
    runtimeSamples: [
      {
        id: "sample.animation.integral-ftc.basic",
        animationId: "animation.sample.fundamental-theorem-calculus",
        availability: "concrete",
        renderTargetKinds: ["equation"],
        transformationDefinitionIds: [
          "definition.symbolic.calculus.definite-integral-ftc",
          "definition.symbolic.calculus.accumulation-derivative-ftc"
        ],
        summary:
          "The FTC comparison sample links accumulation-derivative and net-change equation forms on one clock."
      },
      {
        id: "sample.animation.integral-ftc.area-sweep",
        animationId: "animation.integral-ftc.area-sweep",
        availability: "concrete",
        renderTargetKinds: ["graph"],
        transformationDefinitionIds: [
          "definition.symbolic.calculus.accumulation-derivative-ftc"
        ],
        summary:
          "The t-squared area sweep preserves upper-bound provenance while sampling exact accumulation."
      }
    ],
    graphEquivalents: [
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
        sampleAssetIds: ["animation.integral-ftc.area-sweep"],
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
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.calculus-integral-ftc",
        fixtureFamilyId: "generated.calculus-integral-ftc",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated integral traces can map antiderivatives, definite bounds, and FTC evaluation to this family."
      }
    ],
    flashcardHooks: [
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
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId("family.calculus.integral-ftc"),
      tags: [
        "integral",
        "ftc",
        "area",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for antiderivatives, definite integrals, bounds, and the Fundamental Theorem of Calculus.",
      searchSummary:
        "integral antiderivative definite bounds fundamental theorem calculus area accumulation lower upper",
      graphEquivalentKinds: "area-accumulation"
    }
  });
}

function createIntegralDefinition(input: {
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
    sourceObjectRoles: ["integral.before"],
    targetObjectRoles: ["integral.after"],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "integral.before",
        sourceSelectorRole: "integrand",
        targetObjectRole: "integral.after",
        targetSelectorRole: "antiderivative",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "integral.before",
        sourceSelectorRole: "variable",
        targetObjectRole: "integral.after",
        targetSelectorRole: "variable",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "integral.before",
        sourceSelectorRole: "integral.sign",
        targetObjectRole: "integral.after",
        targetSelectorRole: "evaluation.bar",
        preserves: ["presentation", "role"]
      }
    ]
  });
}

export function createCalculusTaylorLocalLinearizationFamily():
  KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.calculus.taylor-expansion",
    "definition.symbolic.calculus.taylor-truncation",
    "definition.symbolic.calculus.local-linearization",
    "definition.symbolic.calculus.remainder-annotation"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.calculus.taylor-local-linearization",
    title: "Taylor and local linearization",
    domain: "calculus",
    status: "promoted",
    objectRoles: [
      {
        id: "taylor.before",
        objectType: "approximation-expression",
        title: "Function expression before approximation",
        selectorRoles: [
          { id: "function", kind: "function" },
          { id: "center", kind: "point" },
          { id: "variable", kind: "variable" },
          { id: "derivative.order", kind: "order" },
          { id: "factorial", kind: "factorial" },
          { id: "remainder", kind: "annotation" }
        ]
      },
      {
        id: "taylor.after",
        objectType: "approximation-expression",
        title: "Approximation expression after rewrite",
        selectorRoles: [
          { id: "polynomial.term", kind: "term" },
          { id: "center", kind: "point" },
          { id: "variable", kind: "variable" },
          { id: "derivative.value", kind: "coefficient" },
          { id: "order.marker", kind: "order" },
          { id: "remainder.annotation", kind: "annotation" }
        ]
      }
    ],
    transformationDefinitions: [
      createTaylorDefinition({
        id: "definition.symbolic.calculus.taylor-expansion",
        transformType: "taylorExpansion",
        title: "Expand a function into a Taylor polynomial",
        lawId: "law.calculus.taylor-expansion",
        preserves: ["value", "structure"],
        assumption:
          "The function is sufficiently differentiable near the represented center."
      }),
      createTaylorDefinition({
        id: "definition.symbolic.calculus.taylor-truncation",
        transformType: "taylorTruncation",
        title: "Truncate a Taylor expansion",
        lawId: "law.calculus.taylor-truncation",
        preserves: ["structure"],
        assumption:
          "Truncation is an approximation step and requires explicit remainder or error metadata."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.calculus.local-linearization",
        transformType: "localLinearization",
        title: "Build a local linear approximation",
        sourceObjectRoles: ["taylor.before"],
        targetObjectRoles: ["taylor.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "The first-order approximation is centered at the represented point."
        ],
        lawRefs: [
          {
            id: "law.calculus.local-linearization",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "taylor.before",
            sourceSelectorRole: "function",
            targetObjectRole: "taylor.after",
            targetSelectorRole: "polynomial.term",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "taylor.before",
            sourceSelectorRole: "center",
            targetObjectRole: "taylor.after",
            targetSelectorRole: "center",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "taylor.before",
            sourceSelectorRole: "variable",
            targetObjectRole: "taylor.after",
            targetSelectorRole: "variable",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "taylor.before",
            sourceSelectorRole: "derivative.order",
            targetObjectRole: "taylor.after",
            targetSelectorRole: "derivative.value",
            preserves: ["value", "role"]
          }
        ]
      }),
      createTaylorDefinition({
        id: "definition.symbolic.calculus.remainder-annotation",
        transformType: "remainderAnnotation",
        title: "Annotate a Taylor remainder",
        lawId: "law.calculus.taylor-remainder",
        preserves: ["structure"],
        assumption:
          "The omitted terms are represented by an explicit remainder or error annotation."
      })
    ],
    visualMotifs: [
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
    ],
    runtimeSamples: [
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
    ],
    graphEquivalents: [
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
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.calculus-taylor-linearization",
        fixtureFamilyId: "generated.calculus-taylor-linearization",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated approximation traces can map expansion, truncation, local linearization, and remainder steps to this family."
      }
    ],
    flashcardHooks: [
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
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.calculus.taylor-local-linearization"
      ),
      tags: [
        "taylor",
        "linearization",
        "approximation",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for Taylor expansion, truncation, remainder annotation, and local linear approximation.",
      searchSummary:
        "taylor series local linearization approximation remainder tangent polynomial center",
      graphEquivalentKinds: "function-graph,tangent-line"
    }
  });
}

function createTaylorDefinition(input: {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly lawId: string;
  readonly preserves: readonly ("value" | "structure")[];
  readonly assumption: string;
}) {
  return createKpSemanticTransformationDefinition({
    id: input.id,
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: ["taylor.before"],
    targetObjectRoles: ["taylor.after"],
    preserves: input.preserves,
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "taylor.before",
        sourceSelectorRole: "function",
        targetObjectRole: "taylor.after",
        targetSelectorRole: "polynomial.term",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "taylor.before",
        sourceSelectorRole: "center",
        targetObjectRole: "taylor.after",
        targetSelectorRole: "center",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "taylor.before",
        sourceSelectorRole: "remainder",
        targetObjectRole: "taylor.after",
        targetSelectorRole: "remainder.annotation",
        preserves: ["role"]
      }
    ]
  });
}

export function createCalculusGradientJacobianFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.calculus.scalar-gradient",
    "definition.symbolic.calculus.jacobian-matrix",
    "definition.symbolic.calculus.directional-derivative",
    "definition.symbolic.calculus.local-linear-map"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.calculus.gradient-jacobian",
    title: "Gradient and Jacobian",
    domain: "calculus",
    status: "promoted",
    objectRoles: [
      {
        id: "multivar.before",
        objectType: "multivariable-function",
        title: "Multivariable function before differential view",
        selectorRoles: [
          { id: "function.output", kind: "component" },
          { id: "input.vector", kind: "vector" },
          { id: "variable.row", kind: "variable" },
          { id: "variable.column", kind: "variable" },
          { id: "partial.operator", kind: "operator" }
        ]
      },
      {
        id: "multivar.after",
        objectType: "multivariable-linearization",
        title: "Gradient or Jacobian differential view",
        selectorRoles: [
          { id: "gradient.vector", kind: "vector" },
          { id: "jacobian.matrix", kind: "matrix" },
          { id: "row.index", kind: "matrix-row" },
          { id: "column.index", kind: "matrix-column" },
          { id: "partial.derivative", kind: "partial-derivative" },
          { id: "local.linear.map", kind: "linear-map" }
        ]
      }
    ],
    transformationDefinitions: [
      createGradientDefinition({
        id: "definition.symbolic.calculus.scalar-gradient",
        transformType: "scalarGradient",
        title: "Build a scalar gradient vector",
        lawId: "law.calculus.scalar-gradient",
        assumption:
          "The scalar field is differentiable with respect to the represented input variables."
      }),
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.calculus.jacobian-matrix",
        transformType: "jacobianMatrix",
        title: "Build a Jacobian matrix",
        sourceObjectRoles: ["multivar.before"],
        targetObjectRoles: ["multivar.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "Each output component is differentiable with respect to each input variable."
        ],
        lawRefs: [
          {
            id: "law.calculus.jacobian-matrix",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "multivar.before",
            sourceSelectorRole: "function.output",
            targetObjectRole: "multivar.after",
            targetSelectorRole: "row.index",
            preserves: ["role"]
          },
          {
            sourceObjectRole: "multivar.before",
            sourceSelectorRole: "variable.column",
            targetObjectRole: "multivar.after",
            targetSelectorRole: "column.index",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "multivar.before",
            sourceSelectorRole: "partial.operator",
            targetObjectRole: "multivar.after",
            targetSelectorRole: "partial.derivative",
            preserves: ["presentation", "role"]
          },
          {
            sourceObjectRole: "multivar.before",
            sourceSelectorRole: "input.vector",
            targetObjectRole: "multivar.after",
            targetSelectorRole: "jacobian.matrix",
            preserves: ["structure", "role"]
          }
        ]
      }),
      createGradientDefinition({
        id: "definition.symbolic.calculus.directional-derivative",
        transformType: "directionalDerivative",
        title: "Build a directional derivative",
        lawId: "law.calculus.directional-derivative",
        assumption:
          "The direction vector and gradient are defined at the represented point."
      }),
      createGradientDefinition({
        id: "definition.symbolic.calculus.local-linear-map",
        transformType: "localLinearMap",
        title: "Project a Jacobian into a local linear map",
        lawId: "law.calculus.local-linear-map",
        assumption:
          "The Jacobian represents the first-order linear approximation near the point."
      })
    ],
    visualMotifs: [
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
    ],
    runtimeSamples: [
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
    ],
    graphEquivalents: [
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
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.calculus-gradient-jacobian",
        fixtureFamilyId: "generated.calculus-gradient-jacobian",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated multivariable traces can map partial derivatives into gradient, Jacobian, and local-linear-map forms."
      }
    ],
    flashcardHooks: [
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
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.calculus.gradient-jacobian"
      ),
      tags: [
        "gradient",
        "jacobian",
        "local-linear-map",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for scalar gradients and vector-valued Jacobians with local-linear-map views.",
      searchSummary:
        "gradient jacobian partial derivatives matrix local linear map multivariable vector field",
      graphEquivalentKinds: "local-linear-map,vector-field"
    }
  });
}

function createGradientDefinition(input: {
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
    sourceObjectRoles: ["multivar.before"],
    targetObjectRoles: ["multivar.after"],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "multivar.before",
        sourceSelectorRole: "input.vector",
        targetObjectRole: "multivar.after",
        targetSelectorRole: "gradient.vector",
        preserves: ["structure", "role"]
      },
      {
        sourceObjectRole: "multivar.before",
        sourceSelectorRole: "variable.column",
        targetObjectRole: "multivar.after",
        targetSelectorRole: "column.index",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "multivar.before",
        sourceSelectorRole: "partial.operator",
        targetObjectRole: "multivar.after",
        targetSelectorRole: "partial.derivative",
        preserves: ["presentation", "role"]
      }
    ]
  });
}

export function createCalculusHessianOptimizationFamily(): KpSymbolicManipulationFamily {
  const definitionIds = [
    "definition.symbolic.calculus.hessian-matrix",
    "definition.symbolic.calculus.quadratic-form",
    "definition.symbolic.calculus.second-derivative-test",
    "definition.symbolic.calculus.stationarity-condition"
  ];

  return createKpSymbolicManipulationFamily({
    id: "family.calculus.hessian-optimization",
    title: "Hessian and optimization",
    domain: "calculus",
    status: "promoted",
    objectRoles: [
      {
        id: "hessian.before",
        objectType: "second-order-function",
        title: "Second-order function before optimization view",
        selectorRoles: [
          { id: "scalar.function", kind: "function" },
          { id: "gradient.vector", kind: "vector" },
          { id: "variable.row", kind: "variable" },
          { id: "variable.column", kind: "variable" },
          { id: "critical.point", kind: "point" }
        ]
      },
      {
        id: "hessian.after",
        objectType: "second-order-optimization-view",
        title: "Hessian or optimization view",
        selectorRoles: [
          { id: "hessian.matrix", kind: "matrix" },
          { id: "hessian.row", kind: "matrix-row" },
          { id: "hessian.column", kind: "matrix-column" },
          { id: "quadratic.form", kind: "quadratic-form" },
          { id: "eigenvalue.sign", kind: "sign" },
          { id: "curvature.classification", kind: "classification" },
          { id: "critical.point", kind: "point" }
        ]
      }
    ],
    transformationDefinitions: [
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.calculus.hessian-matrix",
        transformType: "hessianMatrix",
        title: "Build a Hessian matrix",
        sourceObjectRoles: ["hessian.before"],
        targetObjectRoles: ["hessian.after"],
        preserves: ["value", "structure"],
        assumptions: [
          "The scalar function has second partial derivatives at the represented point."
        ],
        lawRefs: [
          {
            id: "law.calculus.hessian-matrix",
            level: "strict"
          }
        ],
        correspondenceTemplates: [
          {
            sourceObjectRole: "hessian.before",
            sourceSelectorRole: "scalar.function",
            targetObjectRole: "hessian.after",
            targetSelectorRole: "hessian.matrix",
            preserves: ["value", "role"]
          },
          {
            sourceObjectRole: "hessian.before",
            sourceSelectorRole: "variable.row",
            targetObjectRole: "hessian.after",
            targetSelectorRole: "hessian.row",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "hessian.before",
            sourceSelectorRole: "variable.column",
            targetObjectRole: "hessian.after",
            targetSelectorRole: "hessian.column",
            preserves: ["identity", "role"]
          },
          {
            sourceObjectRole: "hessian.before",
            sourceSelectorRole: "critical.point",
            targetObjectRole: "hessian.after",
            targetSelectorRole: "critical.point",
            preserves: ["identity", "role"]
          }
        ]
      }),
      createHessianDefinition({
        id: "definition.symbolic.calculus.quadratic-form",
        transformType: "quadraticForm",
        title: "Project a Hessian into a quadratic form",
        lawId: "law.calculus.quadratic-form",
        assumption:
          "The Hessian describes the second-order local quadratic form at the point."
      }),
      createHessianDefinition({
        id: "definition.symbolic.calculus.second-derivative-test",
        transformType: "secondDerivativeTest",
        title: "Apply the second derivative test",
        lawId: "law.calculus.second-derivative-test",
        assumption:
          "The critical point is stationary and the Hessian eigenvalue signs determine the local classification when nondegenerate."
      }),
      createHessianDefinition({
        id: "definition.symbolic.calculus.stationarity-condition",
        transformType: "stationarityCondition",
        title: "Apply the stationarity condition",
        lawId: "law.calculus.stationarity",
        assumption:
          "The gradient vanishes at the represented critical point."
      })
    ],
    visualMotifs: [
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
    ],
    runtimeSamples: [
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
    ],
    graphEquivalents: [
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
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.calculus-hessian-optimization",
        fixtureFamilyId: "generated.calculus-hessian-optimization",
        transformationDefinitionIds: definitionIds,
        summary:
          "Generated optimization traces can map Hessian construction, quadratic forms, and second-derivative tests to this family."
      }
    ],
    flashcardHooks: [
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
    ],
    dashboard: {
      rowId: symbolicManipulationFamilyRowId(
        "family.calculus.hessian-optimization"
      ),
      tags: [
        "hessian",
        "optimization",
        "curvature",
        "generated-problem",
        "flashcard"
      ]
    },
    metadata: {
      summary:
        "Promoted symbolic manipulation family for Hessians, quadratic forms, second-derivative tests, and optimization stationarity.",
      searchSummary:
        "hessian optimization curvature quadratic form second derivative stationarity critical point eigenvalue",
      graphEquivalentKinds: "curvature,quadratic-form"
    }
  });
}

function createHessianDefinition(input: {
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
    sourceObjectRoles: ["hessian.before"],
    targetObjectRoles: ["hessian.after"],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "hessian.before",
        sourceSelectorRole: "scalar.function",
        targetObjectRole: "hessian.after",
        targetSelectorRole: "quadratic.form",
        preserves: ["value", "role"]
      },
      {
        sourceObjectRole: "hessian.before",
        sourceSelectorRole: "critical.point",
        targetObjectRole: "hessian.after",
        targetSelectorRole: "critical.point",
        preserves: ["identity", "role"]
      },
      {
        sourceObjectRole: "hessian.before",
        sourceSelectorRole: "gradient.vector",
        targetObjectRole: "hessian.after",
        targetSelectorRole: "curvature.classification",
        preserves: ["role"]
      }
    ]
  });
}

export const kpCalculusSymbolicManipulationFamilyPack =
  createKpSymbolicManipulationFamilyPackDeclaration({
    id: "symbolic-family-pack.calculus",
    domain: "calculus",
    familyIds: [
      "family.calculus.derivative-rules",
      "family.calculus.integral-ftc",
      "family.calculus.taylor-local-linearization",
      "family.calculus.gradient-jacobian",
      "family.calculus.hessian-optimization"
],
    createFamilies: () => [
      createCalculusDerivativeRulesFamily(),
      createCalculusIntegralFtcFamily(),
      createCalculusTaylorLocalLinearizationFamily(),
      createCalculusGradientJacobianFamily(),
      createCalculusHessianOptimizationFamily()
    ]
  });
