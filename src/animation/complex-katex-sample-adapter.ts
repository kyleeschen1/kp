import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type CreateKpAssetSelectorInput,
  type KpSemanticAssetObject
} from "../semantic/asset.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation,
  type KpTransformationPreservation
} from "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
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
import {
  createKpSemanticMaterialEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";

interface ComplexKatexSampleFormSpec {
  readonly id: string;
  readonly label: string;
  readonly latex: string;
  readonly summary: string;
  readonly tags: readonly string[];
  readonly selectors: readonly CreateKpAssetSelectorInput[];
  readonly renderTargetId: string;
  readonly renderTargetSummary: string;
  readonly pane: "left" | "right";
  readonly comparisonSelectorIds: readonly string[];
}

interface ComplexKatexSampleCompareCorrespondenceSpec {
  readonly sourceSelectorId: string;
  readonly targetSelectorId: string;
  readonly preserves: readonly KpTransformationPreservation[];
  readonly summary: string;
}

interface ComplexKatexSampleSpec {
  readonly id: string;
  readonly title: string;
  readonly bundleTitle: string;
  readonly comparisonId: string;
  readonly comparisonLabel: string;
  readonly comparisonSummary: string;
  readonly forms: readonly [
    ComplexKatexSampleFormSpec,
    ComplexKatexSampleFormSpec
  ];
  readonly comparisonSelectors: readonly CreateKpAssetSelectorInput[];
  readonly compareTransformType: string;
  readonly compareTransformTitle: string;
  readonly compareDefinitionId: string;
  readonly compareCorrespondence: readonly ComplexKatexSampleCompareCorrespondenceSpec[];
  readonly compareAssumptions: readonly string[];
  readonly focusSelectorIds: readonly string[];
  readonly dashboardTags: readonly string[];
  readonly metadata: Readonly<Record<string, string | number | boolean>>;
}

export function createComplexKatexSampleAnimationAssets():
  readonly KpAnimationAsset[] {
  return [
    createFundamentalTheoremCalculusSampleAnimationAsset(),
    createFourierTransformPairSampleAnimationAsset()
  ];
}

export function createFundamentalTheoremCalculusSampleAnimationAsset():
  KpAnimationAsset {
  return createLatexPairComparisonAnimationAsset({
    id: "fundamental-theorem-calculus",
    title: "Fundamental Theorem of Calculus forms",
    bundleTitle: "Fundamental Theorem of Calculus sample assets",
    comparisonId: "comparison-ftc-forms",
    comparisonLabel: "Fundamental Theorem forms",
    comparisonSummary:
      "Compare the derivative and net-change forms of the Fundamental Theorem of Calculus.",
    forms: [
      {
        id: "formula-ftc-derivative",
        label: "FTC: derivative form",
        latex: String.raw`\frac{d}{dx}\int_a^x f(t)\,dt=f(x)`,
        summary:
          "Differentiating an accumulated integral recovers the integrand.",
        tags: ["calculus", "fundamental-theorem"],
        selectors: [
          {
            id: "formula-ftc-derivative.expression",
            kind: "latex-expression",
            label: "derivative form"
          },
          {
            id: "formula-ftc-derivative.accumulation",
            kind: "accumulation-integral",
            label: "accumulated integral"
          },
          {
            id: "formula-ftc-derivative.derivative-operator",
            kind: "derivative-operator",
            label: "d/dx"
          },
          {
            id: "formula-ftc-derivative.recovered-integrand",
            kind: "integrand",
            label: "f(x)"
          }
        ],
        renderTargetId: "render.sample.ftc.derivative-form",
        renderTargetSummary: "Left pane derivative-form FTC equation target.",
        pane: "left",
        comparisonSelectorIds: [
          "comparison-ftc-forms.derivative-form",
          "comparison-ftc-forms.integral-derivative-duality"
        ]
      },
      {
        id: "formula-ftc-net-change",
        label: "FTC: net change form",
        latex: String.raw`\int_a^b f'(x)\,dx=f(b)-f(a)`,
        summary:
          "A definite integral of a derivative measures total change.",
        tags: ["calculus", "fundamental-theorem"],
        selectors: [
          {
            id: "formula-ftc-net-change.expression",
            kind: "latex-expression",
            label: "net-change form"
          },
          {
            id: "formula-ftc-net-change.definite-integral",
            kind: "definite-integral",
            label: "integral of f prime"
          },
          {
            id: "formula-ftc-net-change.endpoint-difference",
            kind: "endpoint-difference",
            label: "f(b)-f(a)"
          },
          {
            id: "formula-ftc-net-change.total-change",
            kind: "interpretation",
            label: "total change"
          }
        ],
        renderTargetId: "render.sample.ftc.net-change-form",
        renderTargetSummary: "Right pane net-change FTC equation target.",
        pane: "right",
        comparisonSelectorIds: [
          "comparison-ftc-forms.net-change-form",
          "comparison-ftc-forms.integral-derivative-duality"
        ]
      }
    ],
    comparisonSelectors: [
      {
        id: "comparison-ftc-forms.derivative-form",
        kind: "comparison-role",
        label: "derivative form"
      },
      {
        id: "comparison-ftc-forms.net-change-form",
        kind: "comparison-role",
        label: "net-change form"
      },
      {
        id: "comparison-ftc-forms.integral-derivative-duality",
        kind: "shared-structure",
        label: "integration and differentiation as inverse operations"
      }
    ],
    compareTransformType: "compareFundamentalTheoremForms",
    compareTransformTitle: "Compare FTC derivative and net-change forms",
    compareDefinitionId: "definition.sample.ftc.compare-forms",
    compareCorrespondence: [
      {
        sourceSelectorId: "formula-ftc-derivative.accumulation",
        targetSelectorId: "comparison-ftc-forms.derivative-form",
        preserves: ["role"],
        summary:
          "The accumulated integral is the object differentiated in the first form."
      },
      {
        sourceSelectorId: "formula-ftc-net-change.endpoint-difference",
        targetSelectorId: "comparison-ftc-forms.net-change-form",
        preserves: ["role"],
        summary:
          "The endpoint difference is the target value in the net-change form."
      },
      {
        sourceSelectorId: "formula-ftc-derivative.derivative-operator",
        targetSelectorId: "comparison-ftc-forms.integral-derivative-duality",
        preserves: ["structure"],
        summary:
          "The derivative form exposes how differentiation cancels accumulation."
      },
      {
        sourceSelectorId: "formula-ftc-net-change.definite-integral",
        targetSelectorId: "comparison-ftc-forms.integral-derivative-duality",
        preserves: ["structure"],
        summary:
          "The net-change form exposes the same inverse-operation relationship over an interval."
      }
    ],
    compareAssumptions: [
      "The integrand is continuous on the interval.",
      "The antiderivative interpretation is valid for the displayed functions."
    ],
    focusSelectorIds: [
      "formula-ftc-derivative.derivative-operator",
      "formula-ftc-net-change.definite-integral",
      "comparison-ftc-forms.integral-derivative-duality"
    ],
    dashboardTags: [
      "animation",
      "equation",
      "calculus",
      "fundamental-theorem",
      "sample"
    ],
    metadata: {
      sampleKind: "fundamental-theorem-calculus",
      domain: "calculus",
      clockCoupling: "shared-progress"
    }
  });
}

export function createFourierTransformPairSampleAnimationAsset():
  KpAnimationAsset {
  return createLatexPairComparisonAnimationAsset({
    id: "fourier-transform-pair",
    title: "Fourier transform pair",
    bundleTitle: "Fourier transform pair sample assets",
    comparisonId: "comparison-fourier-transform-pair",
    comparisonLabel: "Fourier transform pair",
    comparisonSummary:
      "Compare the forward Fourier transform with its inverse reconstruction formula.",
    forms: [
      {
        id: "formula-fourier-transform",
        label: "Fourier transform",
        latex:
          String.raw`\widehat{f}(\xi)=\mathcal{F}\{f\}(\xi)=\int_{-\infty}^{\infty} f(x)e^{-2\pi i x\xi}\,dx`,
        summary:
          "Represents a function by its frequency-domain components.",
        tags: ["analysis", "fourier"],
        selectors: [
          {
            id: "formula-fourier-transform.expression",
            kind: "latex-expression",
            label: "forward transform"
          },
          {
            id: "formula-fourier-transform.frequency-function",
            kind: "frequency-domain-function",
            label: "f hat of xi"
          },
          {
            id: "formula-fourier-transform.kernel",
            kind: "kernel",
            label: "negative exponential kernel"
          },
          {
            id: "formula-fourier-transform.measure",
            kind: "differential",
            label: "dx"
          }
        ],
        renderTargetId: "render.sample.fourier.forward-transform",
        renderTargetSummary: "Left pane forward Fourier transform target.",
        pane: "left",
        comparisonSelectorIds: [
          "comparison-fourier-transform-pair.forward",
          "comparison-fourier-transform-pair.kernel-sign"
        ]
      },
      {
        id: "formula-inverse-fourier-transform",
        label: "Inverse Fourier transform",
        latex:
          String.raw`f(x)=\int_{-\infty}^{\infty}\widehat{f}(\xi)e^{2\pi i x\xi}\,d\xi`,
        summary:
          "Reconstructs the original function from its frequency representation.",
        tags: ["analysis", "fourier"],
        selectors: [
          {
            id: "formula-inverse-fourier-transform.expression",
            kind: "latex-expression",
            label: "inverse transform"
          },
          {
            id: "formula-inverse-fourier-transform.time-function",
            kind: "spatial-domain-function",
            label: "f of x"
          },
          {
            id: "formula-inverse-fourier-transform.kernel",
            kind: "kernel",
            label: "positive exponential kernel"
          },
          {
            id: "formula-inverse-fourier-transform.measure",
            kind: "differential",
            label: "d xi"
          }
        ],
        renderTargetId: "render.sample.fourier.inverse-transform",
        renderTargetSummary: "Right pane inverse Fourier transform target.",
        pane: "right",
        comparisonSelectorIds: [
          "comparison-fourier-transform-pair.inverse",
          "comparison-fourier-transform-pair.kernel-sign"
        ]
      }
    ],
    comparisonSelectors: [
      {
        id: "comparison-fourier-transform-pair.forward",
        kind: "comparison-role",
        label: "forward transform"
      },
      {
        id: "comparison-fourier-transform-pair.inverse",
        kind: "comparison-role",
        label: "inverse transform"
      },
      {
        id: "comparison-fourier-transform-pair.kernel-sign",
        kind: "shared-structure",
        label: "opposite exponential kernel signs"
      }
    ],
    compareTransformType: "compareFourierTransformPair",
    compareTransformTitle: "Compare Fourier forward and inverse formulas",
    compareDefinitionId: "definition.sample.fourier.compare-transform-pair",
    compareCorrespondence: [
      {
        sourceSelectorId: "formula-fourier-transform.frequency-function",
        targetSelectorId: "comparison-fourier-transform-pair.forward",
        preserves: ["role"],
        summary:
          "The forward transform produces the frequency-domain function."
      },
      {
        sourceSelectorId: "formula-inverse-fourier-transform.time-function",
        targetSelectorId: "comparison-fourier-transform-pair.inverse",
        preserves: ["role"],
        summary:
          "The inverse transform reconstructs the original-domain function."
      },
      {
        sourceSelectorId: "formula-fourier-transform.kernel",
        targetSelectorId: "comparison-fourier-transform-pair.kernel-sign",
        preserves: ["structure"],
        summary:
          "The forward transform uses the negative-sign exponential kernel."
      },
      {
        sourceSelectorId: "formula-inverse-fourier-transform.kernel",
        targetSelectorId: "comparison-fourier-transform-pair.kernel-sign",
        preserves: ["structure"],
        summary:
          "The inverse transform uses the positive-sign exponential kernel."
      }
    ],
    compareAssumptions: [
      "The formulas use the unitary-free convention with 2 pi in the exponent.",
      "Function-space hypotheses are intentionally represented as sample metadata."
    ],
    focusSelectorIds: [
      "formula-fourier-transform.kernel",
      "formula-inverse-fourier-transform.kernel",
      "comparison-fourier-transform-pair.kernel-sign"
    ],
    dashboardTags: ["animation", "equation", "analysis", "fourier", "sample"],
    metadata: {
      sampleKind: "fourier-transform-pair",
      domain: "analysis",
      clockCoupling: "shared-progress"
    }
  });
}

function createLatexPairComparisonAnimationAsset(
  spec: ComplexKatexSampleSpec
): KpAnimationAsset {
  const forms = [
    createLatexFormObject({
      id: spec.forms[0].id,
      label: spec.forms[0].label,
      latex: spec.forms[0].latex,
      summary: spec.forms[0].summary,
      tags: spec.forms[0].tags
    }),
    createLatexFormObject({
      id: spec.forms[1].id,
      label: spec.forms[1].label,
      latex: spec.forms[1].latex,
      summary: spec.forms[1].summary,
      tags: spec.forms[1].tags
    })
  ] as const;
  const comparison = createLatexComparisonObject({
    id: spec.comparisonId,
    label: spec.comparisonLabel,
    formIds: forms.map((form) => form.id),
    summary: spec.comparisonSummary
  });
  const formObjects = forms.map((form, index) =>
    createLatexFormSemanticAssetObject(form, spec.forms[index]!.selectors)
  );
  const comparisonObject =
    createLatexComparisonSemanticAssetObject(comparison, spec.comparisonSelectors);
  const presentTransformations = forms.map((form, index) =>
    createPresentLatexFormTransformation({
      id: `transform.sample.${spec.id}.present-${index + 1}`,
      title: `Present ${form.label}`,
      formId: form.id,
      selectorIds: spec.forms[index]!.selectors.map((selector) => selector.id)
    })
  );
  const compareTransformation = createKpSemanticTransformation({
    id: `transform.sample.${spec.id}.compare`,
    definitionId: spec.compareDefinitionId,
    transformType: spec.compareTransformType,
    title: spec.compareTransformTitle,
    sourceObjectIds: forms.map((form) => form.id),
    targetObjectIds: [comparison.id],
    preserves: ["structure", "role"],
    correspondence: spec.compareCorrespondence,
    assumptions: spec.compareAssumptions,
    lawRefs: [
      {
        id: `law.sample.${spec.id}.role-comparison`,
        level: "qualitative",
        summary:
          "The sample comparison preserves named roles and structure without asserting object equivalence."
      }
    ]
  });
  const presentPair = createSemanticTransformationParallel({
    id: `diagram.sample.${spec.id}.present-pair`,
    label: `Present ${spec.title}`,
    children: presentTransformations.map((transformation) =>
      createSemanticTransformationLeaf(semanticTransformationRef(transformation))
    )
  });
  const root = createSemanticTransformationSequence({
    id: `diagram.sample.${spec.id}.sequence`,
    label: spec.title,
    children: [
      presentPair,
      createSemanticTransformationLeaf(
        semanticTransformationRef(compareTransformation)
      )
    ],
    summary:
      "Present both complex KaTeX formulas, then focus their structural comparison."
  });
  const timelineId = `timeline.sample.${spec.id}.shared`;

  return createKpAnimationAsset({
    id: `animation.sample.${spec.id}`,
    title: spec.title,
    bundle: createKpAssetBundle({
      id: `asset.sample.${spec.id}`,
      title: spec.bundleTitle,
      objects: [...formObjects, comparisonObject]
    }),
    transformations: [...presentTransformations, compareTransformation],
    transformationTree: createEditableSemanticTransformationTree({
      root,
      annotations: [
        {
          id: `focus.sample.${spec.id}.comparison`,
          kind: "focus",
          targetNodeId: compareTransformation.id,
          placement: "during",
          selectorIds: spec.focusSelectorIds,
          summary: "Focus the structural relationship being compared."
        },
        {
          id: `pause.sample.${spec.id}.comparison`,
          kind: "pause",
          targetNodeId: compareTransformation.id,
          placement: "after",
          durationBeats: 2
        }
      ]
    }),
    timeline: {
      id: timelineId,
      durationMs: 1800,
      beatCount: 50,
      markerIds: [
        ...presentTransformations.map((transformation) => transformation.id),
        compareTransformation.id
      ]
    },
    layout: {
      id: `layout.sample.${spec.id}.row`,
      kind: "row",
      childIds: spec.forms.map((form) => form.renderTargetId),
      title: spec.title
    },
    renderTargets: spec.forms.map((form, index) => ({
      id: form.renderTargetId,
      kind: "equation",
      objectIds: [forms[index]!.id, comparison.id],
      selectorIds: [
        ...form.selectors.map((selector) => selector.id),
        ...form.comparisonSelectorIds
      ],
      transformationIds: [
        presentTransformations[index]!.id,
        compareTransformation.id
      ],
      timelineId,
      summary: form.renderTargetSummary,
      metadata: {
        pane: form.pane,
        sampleKind: String(spec.metadata["sampleKind"] ?? spec.id),
        formulaId: forms[index]!.id
      }
    })),
    presentationProfile:
      createKpSemanticMaterialEquationPresentationProfileV1(),
    checks: [
      {
        id: `check.sample.${spec.id}.reference-closure`,
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: `animation.sample.${spec.id}`
      },
      {
        id: `check.sample.${spec.id}.seek-rewind`,
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: root.id
      }
    ],
    dashboard: {
      rowId: `animation-sample-${spec.id}`,
      tags: spec.dashboardTags,
      sampleTargetIds: spec.forms.map((form) => form.renderTargetId),
      sourceRefIds: [
        ...forms.map((form) => form.id),
        comparison.id
      ]
    },
    metadata: {
      ...spec.metadata,
      compositionKind: "synchronized-comparison"
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
  comparison: LatexComparisonObject,
  selectors: readonly CreateKpAssetSelectorInput[]
): KpSemanticAssetObject<LatexComparisonObject> {
  return createKpSemanticAssetObject({
    id: comparison.id,
    objectType: "latex-comparison",
    title: comparison.label,
    value: comparison,
    selectors,
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
