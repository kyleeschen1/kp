import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import { createLinearSolveAnimationAsset } from "./linear-solve-adapter.ts";
import { createProgramTraceAnimationAsset } from "./programming-adapter.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type CreateKpAssetSelectorInput,
  type KpSemanticAssetObject
} from "../semantic/asset.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import { createKpCancellationPresentationAuthoringMetadata } from "../semantic/cancellation-presentation-authoring.ts";
import {
  createLatexComparisonObject,
  createLatexFormObject,
  type LatexComparisonObject,
  type LatexFormObject
} from "../semantic/latex-form.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationParallel,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";

const comparisonAnimationId = "animation.comparison.linear-solve-programming";
const comparisonTimelineId = "timeline.comparison.linear-solve-programming.shared";
const comparisonEquationRenderTargetId = "render.comparison.linear-solve.equation";
const comparisonProgrammingRenderTargetId = "render.comparison.programming.trace";
const jacobianHessianAnimationId = "animation.comparison.jacobian-hessian";
const jacobianHessianTimelineId = "timeline.comparison.jacobian-hessian.shared";
const jacobianRenderTargetId = "render.comparison.jacobian.formula";
const hessianRenderTargetId = "render.comparison.hessian.formula";
const jacobianFormulaId = "formula-jacobian";
const hessianFormulaId = "formula-hessian";
const jacobianHessianComparisonId = "comparison-jacobian-hessian";
const presentJacobianTransformationId =
  "transform.comparison.jacobian-hessian.present-jacobian";
const presentHessianTransformationId =
  "transform.comparison.jacobian-hessian.present-hessian";
const compareDerivativeStructureTransformationId =
  "transform.comparison.jacobian-hessian.compare-derivative-structure";

export function createComparisonLayoutAnimationAssets():
  readonly KpAnimationAsset[] {
  return [
    createLinearSolveProgrammingComparisonAnimationAsset(),
    createJacobianHessianComparisonAnimationAsset()
  ];
}

export function createLinearSolveProgrammingComparisonAnimationAsset():
  KpAnimationAsset {
  const equation = createLinearSolveAnimationAsset();
  const programming = createProgramTraceAnimationAsset();
  const equationRenderTarget = equation.renderTargets[0];
  const programmingRenderTarget = programming.renderTargets[0];

  if (equationRenderTarget === undefined) {
    throw new Error(`Animation ${equation.id} has no render target.`);
  }

  if (programmingRenderTarget === undefined) {
    throw new Error(`Animation ${programming.id} has no render target.`);
  }

  // A comparison layout is a visual composition: both child animations keep
  // their own phase semantics while the parent gives them one shared progress.
  const root = createSemanticTransformationParallel({
    id: "diagram.comparison.linear-solve-programming.parallel",
    label: "Linear solve and programming trace comparison",
    children: [
      equation.transformationTree.root,
      programming.transformationTree.root
    ],
    summary:
      "Run equation and programming animation phases under one shared progress clock."
  });

  return createKpAnimationAsset({
    id: comparisonAnimationId,
    title: "Linear solve and programming trace comparison",
    bundle: createKpAssetBundle({
      id: "asset.comparison.linear-solve-programming",
      title: "Linear solve and programming trace comparison assets",
      objects: [
        ...equation.bundle.objects,
        ...programming.bundle.objects
      ]
    }),
    transformations: [
      ...equation.transformations,
      ...programming.transformations
    ],
    transformationTree: createEditableSemanticTransformationTree({
      root,
      annotations: [
        ...equation.transformationTree.annotations,
        ...programming.transformationTree.annotations
      ]
    }),
    timeline: {
      id: comparisonTimelineId,
      durationMs: equation.timeline?.durationMs ?? 2400,
      beatCount: equation.timeline?.beatCount ?? 50,
      markerIds: [equation.id, programming.id]
    },
    layout: {
      id: "layout.comparison.linear-solve-programming.row",
      kind: "row",
      childIds: [
        comparisonEquationRenderTargetId,
        comparisonProgrammingRenderTargetId
      ],
      title: "Equation and program trace"
    },
    renderTargets: [
      {
        id: comparisonEquationRenderTargetId,
        kind: "equation",
        objectIds: equationRenderTarget.objectIds,
        selectorIds: equationRenderTarget.selectorIds,
        transformationIds: equationRenderTarget.transformationIds,
        timelineId: comparisonTimelineId,
        summary: "Left pane equation animation render target.",
        metadata: {
          childAnimationId: equation.id,
          pane: "left"
        }
      },
      {
        id: comparisonProgrammingRenderTargetId,
        kind: "programming",
        objectIds: programmingRenderTarget.objectIds,
        selectorIds: programmingRenderTarget.selectorIds,
        transformationIds: programmingRenderTarget.transformationIds,
        timelineId: comparisonTimelineId,
        summary: "Right pane programming trace animation render target.",
        metadata: {
          childAnimationId: programming.id,
          pane: "right"
        }
      }
    ],
    checks: [
      {
        id: "check.comparison.linear-solve-programming.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: comparisonAnimationId
      },
      {
        id: "check.comparison.linear-solve-programming.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: root.id
      }
    ],
    dashboard: {
      rowId: "animation-comparison-linear-solve-programming",
      tags: ["animation", "comparison", "layout", "programming", "equation"],
      sampleTargetIds: [
        comparisonEquationRenderTargetId,
        comparisonProgrammingRenderTargetId
      ],
      sourceRefIds: [equation.id, programming.id]
    },
    metadata: {
      childAnimationIds: `${equation.id} ${programming.id}`,
      compositionKind: "synchronized-comparison",
      clockCoupling: "shared-progress",
      ...createKpCancellationPresentationAuthoringMetadata("preserve-flow")
    }
  });
}

export function createJacobianHessianComparisonAnimationAsset():
  KpAnimationAsset {
  const jacobian = createLatexFormObject({
    id: jacobianFormulaId,
    label: "Jacobian",
    latex: String.raw`J_f(x) = \left[\frac{\partial f_i}{\partial x_j}\right]`,
    summary: "First-order local linear map for a vector-valued function.",
    tags: ["calculus", "linear-algebra", "jacobian"]
  });
  const hessian = createLatexFormObject({
    id: hessianFormulaId,
    label: "Hessian",
    latex:
      String.raw`H_f(x) = \left[\frac{\partial^2 f}{\partial x_i\partial x_j}\right]`,
    summary: "Second-order curvature matrix for a scalar-valued function.",
    tags: ["calculus", "linear-algebra", "hessian"]
  });
  const comparison = createLatexComparisonObject({
    id: jacobianHessianComparisonId,
    label: "Jacobian / Hessian",
    formIds: [jacobian.id, hessian.id],
    summary:
      "Compare first-order linearization data with second-order curvature data."
  });
  const jacobianObject = createLatexFormSemanticAssetObject(jacobian, [
    {
      id: "formula-jacobian.expression",
      kind: "latex-expression",
      label: "Jacobian formula",
      summary: "The full Jacobian matrix expression."
    },
    {
      id: "formula-jacobian.derivative-order",
      kind: "derivative-order",
      label: "first derivative"
    },
    {
      id: "formula-jacobian.matrix-entries",
      kind: "matrix-entry-template",
      label: "partial f_i over partial x_j"
    },
    {
      id: "formula-jacobian.interpretation",
      kind: "interpretation",
      label: "local linear map"
    }
  ]);
  const hessianObject = createLatexFormSemanticAssetObject(hessian, [
    {
      id: "formula-hessian.expression",
      kind: "latex-expression",
      label: "Hessian formula",
      summary: "The full Hessian matrix expression."
    },
    {
      id: "formula-hessian.derivative-order",
      kind: "derivative-order",
      label: "second derivative"
    },
    {
      id: "formula-hessian.matrix-entries",
      kind: "matrix-entry-template",
      label: "partial squared f over partial x_i partial x_j"
    },
    {
      id: "formula-hessian.interpretation",
      kind: "interpretation",
      label: "curvature matrix"
    }
  ]);
  const comparisonObject = createLatexComparisonSemanticAssetObject(comparison);
  const presentJacobian = createPresentLatexFormTransformation({
    id: presentJacobianTransformationId,
    title: "Present Jacobian formula",
    formId: jacobian.id,
    selectorIds: [
      "formula-jacobian.expression",
      "formula-jacobian.derivative-order",
      "formula-jacobian.matrix-entries",
      "formula-jacobian.interpretation"
    ]
  });
  const presentHessian = createPresentLatexFormTransformation({
    id: presentHessianTransformationId,
    title: "Present Hessian formula",
    formId: hessian.id,
    selectorIds: [
      "formula-hessian.expression",
      "formula-hessian.derivative-order",
      "formula-hessian.matrix-entries",
      "formula-hessian.interpretation"
    ]
  });
  const compareDerivativeStructure = createKpSemanticTransformation({
    id: compareDerivativeStructureTransformationId,
    definitionId: "definition.comparison.jacobian-hessian.derivative-structure",
    transformType: "compareDerivativeMatrixForms",
    title: "Compare Jacobian and Hessian derivative structure",
    sourceObjectIds: [jacobian.id, hessian.id],
    targetObjectIds: [comparison.id],
    preserves: ["structure", "role"],
    correspondence: [
      {
        sourceSelectorId: "formula-jacobian.derivative-order",
        targetSelectorId: "comparison-jacobian-hessian.first-order",
        preserves: ["role"],
        summary: "The Jacobian contributes the first-order derivative role."
      },
      {
        sourceSelectorId: "formula-hessian.derivative-order",
        targetSelectorId: "comparison-jacobian-hessian.second-order",
        preserves: ["role"],
        summary: "The Hessian contributes the second-order derivative role."
      },
      {
        sourceSelectorId: "formula-jacobian.matrix-entries",
        targetSelectorId: "comparison-jacobian-hessian.shared-matrix-form",
        preserves: ["structure"],
        summary: "The Jacobian is represented as a matrix of partial derivatives."
      },
      {
        sourceSelectorId: "formula-hessian.matrix-entries",
        targetSelectorId: "comparison-jacobian-hessian.shared-matrix-form",
        preserves: ["structure"],
        summary: "The Hessian is represented as a matrix of second partials."
      }
    ],
    assumptions: [
      "Jacobian applies to vector-valued functions.",
      "Hessian applies to scalar-valued functions with second partials."
    ],
    lawRefs: [
      {
        id: "law.derivative-order.role-separation",
        level: "qualitative",
        summary:
          "The comparison preserves derivative-order roles rather than claiming equivalent objects."
      }
    ]
  });
  const presentPair = createSemanticTransformationParallel({
    id: "diagram.comparison.jacobian-hessian.present-pair",
    label: "Present Jacobian and Hessian formulas",
    children: [
      createSemanticTransformationLeaf(
        semanticTransformationRef(presentJacobian)
      ),
      createSemanticTransformationLeaf(
        semanticTransformationRef(presentHessian)
      )
    ],
    summary:
      "Show both derivative matrix forms under the same comparison clock."
  });
  const root = createSemanticTransformationSequence({
    id: "diagram.comparison.jacobian-hessian.sequence",
    label: "Jacobian and Hessian comparison",
    children: [
      presentPair,
      createSemanticTransformationLeaf(
        semanticTransformationRef(compareDerivativeStructure)
      )
    ],
    summary:
      "Present the two formulas, then focus their derivative-order and matrix-entry relationship."
  });

  return createKpAnimationAsset({
    id: jacobianHessianAnimationId,
    title: "Jacobian and Hessian comparison",
    bundle: createKpAssetBundle({
      id: "asset.comparison.jacobian-hessian",
      title: "Jacobian and Hessian comparison assets",
      objects: [jacobianObject, hessianObject, comparisonObject]
    }),
    transformations: [
      presentJacobian,
      presentHessian,
      compareDerivativeStructure
    ],
    transformationTree: createEditableSemanticTransformationTree({
      root,
      annotations: [
        {
          id: "focus.comparison.jacobian-hessian.matrix-structure",
          kind: "focus",
          targetNodeId: compareDerivativeStructureTransformationId,
          placement: "during",
          selectorIds: [
            "formula-jacobian.matrix-entries",
            "formula-hessian.matrix-entries",
            "comparison-jacobian-hessian.shared-matrix-form"
          ],
          summary:
            "Focus the shared matrix-of-partials structure during the comparison."
        },
        {
          id: "pause.comparison.jacobian-hessian.compare",
          kind: "pause",
          targetNodeId: compareDerivativeStructureTransformationId,
          placement: "after",
          durationBeats: 2
        }
      ]
    }),
    timeline: {
      id: jacobianHessianTimelineId,
      durationMs: 1800,
      beatCount: 50,
      markerIds: [
        presentJacobianTransformationId,
        presentHessianTransformationId,
        compareDerivativeStructureTransformationId
      ]
    },
    layout: {
      id: "layout.comparison.jacobian-hessian.row",
      kind: "row",
      childIds: [jacobianRenderTargetId, hessianRenderTargetId],
      title: "Jacobian and Hessian formulas"
    },
    renderTargets: [
      {
        id: jacobianRenderTargetId,
        kind: "equation",
        objectIds: [jacobian.id, comparison.id],
        selectorIds: [
          "formula-jacobian.expression",
          "formula-jacobian.derivative-order",
          "formula-jacobian.matrix-entries",
          "comparison-jacobian-hessian.first-order",
          "comparison-jacobian-hessian.shared-matrix-form"
        ],
        transformationIds: [
          presentJacobianTransformationId,
          compareDerivativeStructureTransformationId
        ],
        timelineId: jacobianHessianTimelineId,
        summary: "Left pane Jacobian formula comparison target.",
        metadata: {
          pane: "left",
          comparisonRole: "jacobian",
          derivativeOrder: 1
        }
      },
      {
        id: hessianRenderTargetId,
        kind: "equation",
        objectIds: [hessian.id, comparison.id],
        selectorIds: [
          "formula-hessian.expression",
          "formula-hessian.derivative-order",
          "formula-hessian.matrix-entries",
          "comparison-jacobian-hessian.second-order",
          "comparison-jacobian-hessian.shared-matrix-form"
        ],
        transformationIds: [
          presentHessianTransformationId,
          compareDerivativeStructureTransformationId
        ],
        timelineId: jacobianHessianTimelineId,
        summary: "Right pane Hessian formula comparison target.",
        metadata: {
          pane: "right",
          comparisonRole: "hessian",
          derivativeOrder: 2
        }
      }
    ],
    checks: [
      {
        id: "check.comparison.jacobian-hessian.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: jacobianHessianAnimationId
      },
      {
        id: "check.comparison.jacobian-hessian.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: root.id
      }
    ],
    dashboard: {
      rowId: "animation-comparison-jacobian-hessian",
      tags: [
        "animation",
        "comparison",
        "layout",
        "equation",
        "calculus",
        "linear-algebra"
      ],
      sampleTargetIds: [jacobianRenderTargetId, hessianRenderTargetId],
      sourceRefIds: [jacobian.id, hessian.id, comparison.id]
    },
    metadata: {
      compositionKind: "synchronized-comparison",
      comparisonKind: "jacobian-hessian",
      clockCoupling: "shared-progress",
      derivativeOrders: "1 2"
    }
  });
}

function createLatexFormSemanticAssetObject(
  form: LatexFormObject,
  selectors: readonly CreateKpAssetSelectorInput[]
): KpSemanticAssetObject<LatexFormObject> {
  return createKpSemanticAssetObject({
    id: form.id,
    objectType: "latex-form",
    title: form.label,
    value: form,
    selectors,
    provenance: {
      kind: "authored",
      sourceIds: [],
      summary: form.summary
    },
    metadata: {
      latex: form.latex,
      tags: form.tags.join(" ")
    }
  });
}

function createLatexComparisonSemanticAssetObject(
  comparison: LatexComparisonObject
): KpSemanticAssetObject<LatexComparisonObject> {
  return createKpSemanticAssetObject({
    id: comparison.id,
    objectType: "latex-comparison",
    title: comparison.label,
    value: comparison,
    selectors: [
      {
        id: "comparison-jacobian-hessian.first-order",
        kind: "comparison-role",
        label: "first-order data"
      },
      {
        id: "comparison-jacobian-hessian.second-order",
        kind: "comparison-role",
        label: "second-order data"
      },
      {
        id: "comparison-jacobian-hessian.shared-matrix-form",
        kind: "shared-structure",
        label: "matrix of partial derivatives"
      }
    ],
    provenance: {
      kind: "authored",
      sourceIds: [...comparison.formIds],
      summary: comparison.summary
    }
  });
}

function createPresentLatexFormTransformation(input: {
  readonly id: string;
  readonly title: string;
  readonly formId: string;
  readonly selectorIds: readonly string[];
}): KpSemanticTransformation {
  return createKpSemanticTransformation({
    id: input.id,
    definitionId: "definition.latex-form.present",
    transformType: "presentLatexForm",
    title: input.title,
    sourceObjectIds: [input.formId],
    targetObjectIds: [input.formId],
    preserves: ["identity", "presentation"],
    correspondence: input.selectorIds.map((selectorId) => ({
      sourceSelectorId: selectorId,
      targetSelectorId: selectorId,
      preserves: ["identity", "presentation"],
      summary: "The authored LaTeX selector remains the same rendered form."
    }))
  });
}

function semanticTransformationRef(
  transformation: KpSemanticTransformation
) {
  return createSemanticTransformationRef({
    id: transformation.id,
    kind: transformation.transformType,
    sourceObjectIds: transformation.sourceObjectIds,
    targetObjectIds: transformation.targetObjectIds,
    preserves: transformation.preserves,
    summary: transformation.title
  });
}
