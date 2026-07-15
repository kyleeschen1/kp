import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../semantic/asset.ts";
import {
  createKpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf
} from "../semantic/transformation-composition.ts";

export const inequalitySignFlipAnimationId =
  "animation.inequality.sign-flip.basic";

const sourceObjectId = "inequality.sign-flip.source";
const targetObjectId = "inequality.sign-flip.target";
const transformationId = "transform.inequality.sign-flip.multiply-negative";
const definitionId =
  "definition.symbolic.algebra.inequality-multiply-negative";
const lawId = "law.inequality.multiply-negative-flip";
const timelineId = "timeline.inequality.sign-flip.basic";
const renderTargetId = "render.inequality.sign-flip.basic.equation";

export function createInequalitySignFlipAnimationAsset(): KpAnimationAsset {
  const source = createInequalityObject({
    id: sourceObjectId,
    title: "Source inequality",
    latex: "x < 3",
    side: "source",
    lhsLatex: "x",
    relationLatex: "<",
    rhsLatex: "3"
  });
  const target = createInequalityObject({
    id: targetObjectId,
    title: "Inequality after multiplying by -2",
    latex: "-2x > -6",
    side: "target",
    lhsLatex: "-2x",
    relationLatex: ">",
    rhsLatex: "-6"
  });
  const transformation = createKpSemanticTransformation({
    id: transformationId,
    definitionId,
    transformType: "multiplyNegativeBothSidesInequality",
    title: "Multiply both sides by -2 and flip the relation",
    sourceObjectIds: [source.id],
    targetObjectIds: [target.id],
    preserves: ["structure", "value", "role"],
    correspondence: [
      correspondence("full", ["structure", "value"]),
      correspondence("lhs", ["structure", "role"]),
      correspondence("relation", ["role"]),
      correspondence("rhs", ["structure", "role"])
    ],
    assumptions: [
      "The multiplier -2 is negative, so the inequality relation must flip."
    ],
    lawRefs: [
      {
        id: lawId,
        level: "strict",
        summary:
          "Multiplication by a negative quantity preserves the solution set only when the relation flips."
      }
    ]
  });
  const treeRoot = createSemanticTransformationLeaf(
    createSemanticTransformationRef({
      id: transformation.id,
      kind: transformation.transformType,
      sourceObjectIds: transformation.sourceObjectIds,
      targetObjectIds: transformation.targetObjectIds,
      preserves: transformation.preserves,
      summary: transformation.title
    })
  );

  return createKpAnimationAsset({
    id: inequalitySignFlipAnimationId,
    title: "Inequality sign flip",
    bundle: createKpAssetBundle({
      id: "asset.inequality.sign-flip.basic",
      title: "Inequality sign-flip assets",
      objects: [source, target]
    }),
    transformations: [transformation],
    transformationTree: createEditableSemanticTransformationTree({
      root: treeRoot,
      annotations: [
        {
          id: "focus.inequality.sign-flip.relation",
          kind: "focus",
          targetNodeId: transformation.id,
          placement: "during",
          selectorIds: [selectorId("source", "relation"), selectorId("target", "relation")]
        },
        {
          id: "pause.inequality.sign-flip.relation",
          kind: "pause",
          targetNodeId: transformation.id,
          placement: "after",
          durationBeats: 1
        }
      ]
    }),
    timeline: {
      id: timelineId,
      durationMs: 2400,
      beatCount: 50
    },
    layout: {
      id: "layout.inequality.sign-flip.basic",
      kind: "single",
      targetId: renderTargetId
    },
    renderTargets: [
      {
        id: renderTargetId,
        kind: "equation",
        objectIds: [source.id, target.id],
        selectorIds: [
          ...source.selectors.map((selector) => selector.id),
          ...target.selectors.map((selector) => selector.id)
        ],
        transformationIds: [transformation.id],
        timelineId,
        summary:
          "Shows the relation pivot from less-than to greater-than as both sides scale by -2."
      }
    ],
    checks: [
      {
        id: "check.inequality.sign-flip.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: inequalitySignFlipAnimationId
      },
      {
        id: "check.inequality.sign-flip.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: transformation.id
      },
      {
        id: "check.inequality.sign-flip.negative-multiplier",
        lawId,
        level: "strict",
        targetId: transformation.id
      }
    ],
    exportTargets: [
      {
        id: "export.inequality.sign-flip.frames",
        kind: "frame-sequence",
        artifactId: "artifact.inequality.sign-flip.gif.frames"
      }
    ],
    dashboard: {
      rowId: "animation-inequality-sign-flip-basic",
      tags: ["animation", "equation", "inequality", "sign-flip", "algebra"],
      sourceRefIds: [definitionId, lawId]
    },
    metadata: {
      sourceFamilyId: "family.algebra.inequality",
      summary:
        "Multiply an inequality by a negative quantity while the relation flips to preserve its solution set."
    }
  });
}

function createInequalityObject(input: {
  readonly id: string;
  readonly title: string;
  readonly latex: string;
  readonly side: "source" | "target";
  readonly lhsLatex: string;
  readonly relationLatex: string;
  readonly rhsLatex: string;
}) {
  return createKpSemanticAssetObject({
    id: input.id,
    objectType: "equation",
    title: input.title,
    value: { latex: input.latex },
    selectors: [
      selector(input.side, "full", input.latex),
      selector(input.side, "lhs", input.lhsLatex),
      selector(input.side, "relation", input.relationLatex, {
        semanticRole: input.side === "target" ? "relation.flip" : "relation.source"
      }),
      selector(input.side, "rhs", input.rhsLatex)
    ],
    metadata: {
      latex: input.latex,
      representation: "inequality",
      relation: input.relationLatex
    }
  });
}

function selector(
  side: "source" | "target",
  role: "full" | "lhs" | "relation" | "rhs",
  latex: string,
  metadata?: Readonly<Record<string, string>>
) {
  return {
    id: selectorId(side, role),
    kind: role === "relation" ? "relation" : "equation",
    label: latex,
    metadata
  };
}

function selectorId(
  side: "source" | "target",
  role: "full" | "lhs" | "relation" | "rhs"
): string {
  return `inequality.sign-flip.${side}.${role}`;
}

function correspondence(
  role: "full" | "lhs" | "relation" | "rhs",
  preserves: readonly ("structure" | "value" | "role")[]
) {
  return {
    sourceSelectorId: selectorId("source", role),
    targetSelectorId: selectorId("target", role),
    preserves
  };
}
