import {
  createKpFractionCompositionEquationAsset
} from "../semantic/fraction-composition-equation-asset.ts";
import {
  createKpFractionCompositionEvaluationTree
} from "../semantic/fraction-composition-evaluation-tree.ts";
import {
  createKpCanonicalBalancedSolveAnimationAsset
} from "./canonical-balanced-solve-animation.ts";

export function createKpFractionCompositionEquationAnimationAsset() {
  const source = createKpFractionCompositionEquationAsset();
  const tree = createKpFractionCompositionEvaluationTree();
  return createKpCanonicalBalancedSolveAnimationAsset({
    id: "animation.fraction-composition.two-thirds-solve",
    title: "Distribute and solve with a fraction",
    bundle: source.bundle,
    transformations: source.transformations,
    transformationTree: tree,
    timeline: {
      id: "timeline.fraction-composition.shared",
      durationMs: 8_400,
      beatCount: 130,
      markerIds: source.bundle.objects.map(({ id }) => id)
    },
    layout: {
      id: "layout.fraction-composition.animation",
      kind: "pinned-stage",
      targetId: "render.fraction-composition.equation"
    },
    renderTargets: [{
      id: "render.fraction-composition.equation",
      kind: "equation",
      objectIds: source.bundle.objects.map(({ id }) => id),
      transformationIds: source.transformations.map(({ id }) => id),
      timelineId: "timeline.fraction-composition.shared"
    }],
    checks: [
      {
        id: "check.fraction-composition.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: "animation.fraction-composition.two-thirds-solve"
      },
      {
        id: "check.fraction-composition.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: tree.root.id
      }
    ],
    exportTargets: [{
      id: "export.fraction-composition.static-steps",
      kind: "static-step",
      artifactId: "artifact.fraction-composition.static-steps"
    }],
    dashboard: {
      rowId: "animation-fraction-composition",
      tags: ["animation", "equation", "fraction", "solve", "foldable", "exemplar"],
      sourceRefIds: [source.sourceTraceId]
    },
    metadata: {
      sourceTraceId: source.sourceTraceId,
      foldTreeId: tree.root.id,
      paintPolicy: "opaque-lineage",
      nativeEndpointAuthority: "native-katex",
      canonicalPaintPolicy: "exclusive-when-active"
    }
  });
}
