import type { KpAnimationAsset } from "./asset.ts";
import { createKpAssetBundle, createKpSemanticAssetObject } from
  "../semantic/asset.ts";
import { createGraph2DObject } from "../semantic/graph.ts";
import {
  deriveKpMatrixLinearMapSemantics
} from "./matrix-linear-map-semantics.ts";

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

  return {
    ...animation,
    bundle: createKpAssetBundle({
      id: animation.bundle.id,
      title: animation.bundle.title,
      objects: [...animation.bundle.objects, ...semanticObjects]
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
        transformationIds: [animation.transformations[0]!.id],
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
    metadata: {
      ...animation.metadata,
      matrixLinearMapEnriched: true,
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
