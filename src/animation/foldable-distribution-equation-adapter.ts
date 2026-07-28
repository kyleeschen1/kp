import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpSemanticMaterialEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";
import {
  createTransformTreeVisualMotifTimeline
} from "./motifs/visual-motif-composition.ts";
import {
  equationVisualMotifDescriptors
} from "./motifs/visual-motif.ts";
import {
  requireKpCanonicalOperationEvaluationPresentation,
  ruleFromKpResolvedOperationEvaluationPresentation
} from "./operation-evaluation-presentation-registry.ts";
import {
  createKpFoldableDistributionEquationAsset
} from "../semantic/foldable-distribution-equation-asset.ts";
import {
  createKpFoldableDistributionEvaluationTree
} from "../semantic/foldable-distribution-evaluation-tree.ts";

export function createKpFoldableDistributionEquationAnimationAsset():
  KpAnimationAsset {
  const source = createKpFoldableDistributionEquationAsset();
  const tree = createKpFoldableDistributionEvaluationTree();
  return createKpAnimationAsset({
    id: "animation.foldable-distribution.collect-like-terms",
    title: "Distribute and collect like terms",
    bundle: source.bundle,
    transformations: source.transformations,
    transformationTree: tree,
    timeline: {
      id: "timeline.foldable-distribution.shared",
      durationMs: 4_200,
      beatCount: 78,
      markerIds: [
        "factored",
        "distributed",
        "products-evaluated",
        "grouped",
        "coefficient-factored",
        "collected"
      ]
    },
    layout: {
      id: "layout.foldable-distribution.animation",
      kind: "pinned-stage",
      targetId: "render.foldable-distribution.equation"
    },
    renderTargets: [{
      id: "render.foldable-distribution.equation",
      kind: "equation",
      objectIds: source.bundle.objects.map(({ id }) => id),
      transformationIds: source.transformations.map(({ id }) => id),
      timelineId: "timeline.foldable-distribution.shared"
    }],
    checks: [
      {
        id: "check.foldable-distribution.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: "animation.foldable-distribution.collect-like-terms"
      },
      {
        id: "check.foldable-distribution.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: tree.root.id
      }
    ],
    exportTargets: [{
      id: "export.foldable-distribution.static-steps",
      kind: "static-step",
      artifactId: "artifact.foldable-distribution.static-steps"
    }],
    dashboard: {
      rowId: "animation-foldable-distribution",
      tags: [
        "animation",
        "equation",
        "distribution",
        "collection",
        "foldable",
        "exemplar"
      ],
      sourceRefIds: [source.sourceTraceId]
    },
    presentationProfile:
      createKpSemanticMaterialEquationPresentationProfileV1(),
    metadata: {
      sourceTraceId: source.sourceTraceId,
      foldTreeId: tree.root.id,
      paintPolicy: "opaque-lineage",
      nativeEndpointAuthority: "native-katex"
    }
  });
}

export function createKpFoldableDistributionVisualMotifTimeline() {
  const animation = createKpFoldableDistributionEquationAnimationAsset();
  const descriptor = (kind: "copy-fan-out" | "merge-fan-in") =>
    equationVisualMotifDescriptors.find(
      (candidate) => candidate.kind === kind
    )!;
  return createTransformTreeVisualMotifTimeline({
    id: "visual.foldable-distribution.canonical",
    tree: animation.transformationTree,
    rules: [
      {
        transformationKind: "distributeMultiplication",
        descriptor: descriptor("copy-fan-out"),
        definitionIds: [
          "definition.generated.distribution.distribute-multiplication"
        ],
        canonicalOperationIds: [
          "kp.core.persist",
          "kp.core.fan-out",
          "kp.core.reorder"
        ],
        trustedMotifIds: ["persist", "fan-out", "reorder"]
      },
      // Canonical arithmetic callers consume a nominally resolved registry
      // certificate; a local descriptor cannot accidentally restore fading.
      ruleFromKpResolvedOperationEvaluationPresentation(
        requireKpCanonicalOperationEvaluationPresentation(
          "simplifyConstantProduct"
        )
      ),
      {
        transformationKind: "groupLikeTerms",
        descriptor: {
          kind: "semantic-reorder-and-group",
          motionPrimitiveIds: ["shift"],
          phaseIds: ["reflow-signed-terms", "establish-groups", "native-settle"],
          summary:
            "Opaque signed terms reflow before their grouping structure settles."
        },
        canonicalOperationIds: ["kp.core.reorder", "kp.core.group"],
        trustedMotifIds: ["reorder", "group"]
      },
      {
        transformationKind: "factorCommonTerm",
        descriptor: descriptor("merge-fan-in"),
        definitionIds: [
          "definition.generated.distribution.factor-common-term"
        ],
        canonicalOperationIds: [
          "kp.core.persist",
          "kp.core.merge",
          "kp.core.group"
        ],
        trustedMotifIds: ["persist", "merge", "group"]
      },
      {
        transformationKind: "collectLikeTerms",
        descriptor: descriptor("merge-fan-in"),
        canonicalOperationIds: ["kp.core.merge"],
        trustedMotifIds: ["merge"]
      }
    ]
  });
}
