import type { KpAnimationAsset } from "./asset.ts";
import { createKpAssetBundle, createKpSemanticAssetObject } from
  "../semantic/asset.ts";
import { createGraph2DObject } from "../semantic/graph.ts";
import { createKpSemanticTransformation } from
  "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from
  "../semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationParallel
} from "../semantic/transformation-composition.ts";
import {
  deriveKpMatrixLinearMapSemantics
} from "./matrix-linear-map-semantics.ts";
import {
  KP_MATRIX_LINEAR_MAP_DURATION_MS,
  kpMatrixLinearMapPacingId
} from "./matrix-linear-map-pacing.ts";

interface KpCoordinateVectorObject {
  readonly id: string;
  readonly type: "vector";
  readonly label: string;
  readonly coordinates: readonly number[];
  readonly coordinateRole: "input" | "output";
}

export function enrichKpMatrixLinearMapAsset(
  animation: KpAnimationAsset
): KpAnimationAsset {
  if (
    animation.id !==
    "animation.generated.linear-algebra.matrix-vector.two-by-two"
  ) {
    return animation;
  }
  const semantics = deriveKpMatrixLinearMapSemantics(animation);
  if (animation.bundle.objects.some((object) =>
    object.id === semantics.linearMap.id
  )) {
    return animation;
  }
  const prefix = semantics.linearMap.id;
  const graph = createGraph2DObject({
    id: `${prefix}.graph`,
    label: "Input and transformed vector plane",
    xAxisId: `${prefix}.graph.x-axis`,
    yAxisId: `${prefix}.graph.y-axis`,
    xDomain: [-2, 16],
    yDomain: [-2, 16],
    width: 520,
    height: 360
  });
  const inputVector: KpCoordinateVectorObject = {
    id: `${prefix}.vector.input`,
    type: "vector",
    label: "v",
    coordinates: semantics.inputCoordinates,
    coordinateRole: "input"
  };
  const outputVector: KpCoordinateVectorObject = {
    id: `${prefix}.vector.output`,
    type: "vector",
    label: "T_A(v)",
    coordinates: semantics.outputCoordinates,
    coordinateRole: "output"
  };
  const derived = {
    kind: "derived" as const,
    sourceIds: [animation.bundle.objects[0]!.id],
    summary: "Derived from the canonical generated matrix-vector expression."
  };
  const semanticObjects = [
    semanticObject(semantics.matrix, "matrix", "matrix entries", derived),
    semanticObject(semantics.linearMap, "map", "linear map", {
      ...derived,
      sourceIds: [semantics.matrix.id]
    }),
    semanticObject(semantics.domainBasis, "basis-vectors", "domain basis", {
      ...derived,
      sourceIds: [semantics.matrix.id]
    }),
    semanticObject(semantics.codomainBasis, "basis-vectors", "codomain basis", {
      ...derived,
      sourceIds: [semantics.matrix.id]
    }),
    ...semantics.mappedBasisVectors.map((vector) =>
      semanticObject(vector, "body", `T_A(e_${vector.basisVectorIndex + 1})`, {
        ...derived,
        sourceIds: [semantics.matrix.id, semantics.domainBasis.id]
      })
    ),
    semanticObject(graph, "viewport", "vector plane", {
      ...derived,
      sourceIds: [semantics.linearMap.id]
    }),
    semanticObject(inputVector, "body", "input vector", derived),
    semanticObject(outputVector, "body", "mapped vector", {
      ...derived,
      sourceIds: [semantics.linearMap.id, inputVector.id]
    })
  ];
  const equationTarget = animation.renderTargets.find(
    (target) => target.kind === "equation"
  );
  if (equationTarget === undefined || animation.timeline === undefined) {
    throw new Error(
      `Matrix linear-map animation ${animation.id} requires an equation target and shared timeline.`
    );
  }
  const graphTargetId = `render.${animation.id.slice("animation.".length)}.graph`;
  const calculationTransformation = animation.transformations[0]!;
  const applicationTransformation = createKpSemanticTransformation({
    id: `${calculationTransformation.id}.apply-linear-map`,
    definitionId: "definition.symbolic.linear-algebra.apply-linear-map",
    transformType: "applyLinearMapToVector",
    title: "Apply the same matrix as a linear map",
    sourceObjectIds: [semantics.linearMap.id, inputVector.id],
    targetObjectIds: [semantics.linearMap.id, outputVector.id],
    preserves: ["identity", "value", "structure", "role"],
    correspondence: [
      {
        sourceSelectorId: `${semantics.linearMap.id}.map`,
        targetSelectorId: `${semantics.linearMap.id}.map`,
        preserves: ["identity", "structure"],
        summary: "The strict LinearMap persists while it acts on the vector."
      },
      {
        sourceSelectorId: `${inputVector.id}.body`,
        targetSelectorId: `${outputVector.id}.body`,
        preserves: ["value", "role"],
        summary: "The input vector maps to the exact computed output vector."
      }
    ],
    assumptions: [
      `domain basis ${semantics.domainBasis.id}`,
      `codomain basis ${semantics.codomainBasis.id}`
    ],
    lawRefs: [{
      id: "law.linear-algebra.linear-map-application",
      level: "strict",
      summary: "T_A(v) equals the exact matrix-vector product Av."
    }]
  });

  return {
    ...animation,
    // This canonical learner view needs time to read each product, sum, and
    // geometric consequence. The generated arithmetic asset keeps its compact
    // base duration until it is enriched with this presentation contract.
    timeline: {
      ...animation.timeline,
      durationMs: KP_MATRIX_LINEAR_MAP_DURATION_MS,
      beatCount: 120
    },
    bundle: createKpAssetBundle({
      id: animation.bundle.id,
      title: animation.bundle.title,
      objects: [...animation.bundle.objects, ...semanticObjects]
    }),
    transformations: [calculationTransformation, applicationTransformation],
    // These are equivalent symbolic and geometric views of one operation,
    // not sequential mutations of one representation into the other.
    transformationTree: createEditableSemanticTransformationTree({
      root: createSemanticTransformationParallel({
        // Preserve the imported diagram root identity because strict checks
        // and external provenance already name this composition boundary.
        id: animation.transformationTree.root.id,
        label: "Calculate coordinates and apply the linear map",
        children: [
          createSemanticTransformationLeaf(
            createSemanticTransformationRef(calculationTransformation)
          ),
          createSemanticTransformationLeaf(
            createSemanticTransformationRef(applicationTransformation)
          )
        ],
        summary: "Two synchronized representations of the same exact operation."
      }),
      annotations: animation.transformationTree.annotations
    }),
    layout: {
      id: `layout.${animation.id.slice("animation.".length)}.equation-graph`,
      kind: "row",
      childIds: [equationTarget.id, graphTargetId],
      title: "Calculation and geometric action",
      metadata: {
        clockCoupling: "shared-progress"
      }
    },
    renderTargets: [
      equationTarget,
      {
        id: graphTargetId,
        kind: "graph",
        objectIds: semanticObjects.map((object) => object.id),
        selectorIds: semanticObjects.flatMap((object) =>
          object.selectors.map((selector) => selector.id)
        ),
        transformationIds: [applicationTransformation.id],
        timelineId: animation.timeline.id,
        summary: "Geometric action of the same exact matrix-vector calculation.",
        metadata: {
          graphMotionKind: "matrix-linear-map",
          linearMapId: semantics.linearMap.id,
          sourceVectorId: inputVector.id,
          targetVectorId: outputVector.id,
          revealPolicy: "after-row-calculation"
        }
      }
    ],
    dashboard: animation.dashboard === undefined
      ? undefined
      : {
          ...animation.dashboard,
          sampleTargetIds: [equationTarget.id, graphTargetId]
        },
    checks: [
      ...animation.checks,
      {
        id: `check.${animation.id.slice("animation.".length)}.linear-map-application`,
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: applicationTransformation.id,
        summary: "The geometric application shares exact seek and rewind state."
      }
    ],
    metadata: {
      ...animation.metadata,
      matrixLinearMapEnriched: true,
      matrixLinearMapPacing: kpMatrixLinearMapPacingId,
      clockCoupling: "shared-progress"
    }
  };
}

function semanticObject<
  TValue extends { readonly id: string; readonly type: string; readonly label?: string }
>(
  value: TValue,
  selectorKind: string,
  selectorLabel: string,
  provenance: Parameters<typeof createKpSemanticAssetObject>[0]["provenance"]
) {
  return createKpSemanticAssetObject({
    id: value.id,
    objectType: value.type,
    title: value.label ?? value.id,
    value,
    selectors: [{
      id: `${value.id}.${selectorKind}`,
      kind: selectorKind,
      label: selectorLabel
    }],
    provenance
  });
}
