import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type KpSemanticAssetObject
} from "../semantic/asset.ts";
import {
  createKpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf
} from "../semantic/transformation-composition.ts";
import {
  createAxis2DObject,
  createGraph2DObject
} from "../semantic/graph.ts";
import {
  createKpSupplyDemandEquilibriumModel,
  type KpSupplyDemandEquilibriumModelV1
} from "../../domains/economics/supply-demand-equilibrium-model.ts";

export const economicsEquilibriumAnimationId =
  "animation.economics.supply-demand-equilibrium-shift";
export const economicsEquilibriumTransformationId =
  "transform.economics.shift-demand-intercept";

const graphId = "graph.economics.supply-demand";
const beforeStateId = "state.economics.supply-demand.before";
const afterStateId = "state.economics.supply-demand.after";
const marketSidesId = "market-sides.economics.supply-demand";
const timelineId = "timeline.economics.supply-demand-equilibrium-shift";
const renderTargetId = "render.economics.supply-demand-equilibrium-shift";

export function createEconomicsEquilibriumAnimationAsset(
  model: KpSupplyDemandEquilibriumModelV1 =
    createKpSupplyDemandEquilibriumModel()
): KpAnimationAsset {
  const graph = createGraph2DObject({
    id: graphId,
    label: "Supply and demand",
    xAxisId: model.input.axes.quantity.id,
    yAxisId: model.input.axes.price.id,
    xDomain: exactDomain(model.input.axes.quantity),
    yDomain: exactDomain(model.input.axes.price),
    width: 640,
    height: 420
  });
  const quantityAxis = createAxis2DObject({
    id: graph.xAxisId,
    graphId,
    label: "Quantity (Q)",
    orientation: "x",
    domain: graph.xDomain,
    tickStep: exactNumber(model.input.axes.quantity.tickStep)
  });
  const priceAxis = createAxis2DObject({
    id: graph.yAxisId,
    graphId,
    label: "Price (P)",
    orientation: "y",
    domain: graph.yDomain,
    tickStep: exactNumber(model.input.axes.price.tickStep)
  });
  const graphObject = semanticObject(graph, [
    { id: `${graphId}.viewport`, kind: "viewport", label: "market graph" }
  ]);
  const modelObject = createKpSemanticAssetObject({
    id: model.id,
    objectType: "economics-supply-demand-model",
    title: "Exact supply-demand model",
    value: model,
    selectors: [
      { id: `${model.id}.model`, kind: "domain-model", label: "Exact market model" }
    ]
  });
  const quantityAxisObject = semanticObject(quantityAxis, [
    { id: `${quantityAxis.id}.axis`, kind: "quantity-axis", label: "Quantity Q" }
  ]);
  const priceAxisObject = semanticObject(priceAxis, [
    { id: `${priceAxis.id}.axis`, kind: "price-axis", label: "Price P" }
  ]);
  const supplyObject = createKpSemanticAssetObject({
    id: model.input.supply.id,
    objectType: "economics-linear-supply-curve",
    title: "Supply curve",
    value: {
      graphId,
      equationForm: model.input.supply.equationForm,
      priceIntercept: model.input.supply.priceIntercept,
      priceChangePerQuantity: model.input.supply.priceChangePerQuantity
    },
    selectors: [
      { id: `${model.input.supply.id}.body`, kind: "supply-curve", label: "Supply" },
      { id: `${model.input.supply.id}.equation`, kind: "equation", label: "Supply equation" }
    ]
  });
  const demandObject = createKpSemanticAssetObject({
    id: model.input.demand.id,
    objectType: "economics-linear-demand-curve",
    title: "Demand curve",
    value: {
      graphId,
      equationForm: model.input.demand.equationForm,
      priceChangePerQuantity: model.input.demand.priceChangePerQuantity,
      priceInterceptBefore: model.input.demand.priceInterceptBefore,
      priceInterceptAfter: model.input.demand.priceInterceptAfter
    },
    selectors: [
      { id: `${model.input.demand.id}.body`, kind: "demand-curve", label: "Demand" },
      { id: `${model.input.demand.id}.equation`, kind: "equation", label: "Demand equation" }
    ]
  });
  const parameterObject = createKpSemanticAssetObject({
    id: model.input.demand.interceptParameterId,
    objectType: "economics-parameter",
    title: "Demand price intercept",
    value: {
      before: model.input.demand.priceInterceptBefore,
      after: model.input.demand.priceInterceptAfter
    },
    selectors: [
      { id: `${model.input.demand.interceptParameterId}.before`, kind: "parameter-value", label: "Initial demand intercept" },
      { id: `${model.input.demand.interceptParameterId}.after`, kind: "parameter-value", label: "Shifted demand intercept" }
    ]
  });
  const equilibriumObject = createKpSemanticAssetObject({
    id: model.input.equilibriumId,
    objectType: "economics-equilibrium",
    title: "Market equilibrium",
    value: {
      before: model.states.before.equilibrium,
      after: model.states.after.equilibrium
    },
    selectors: [
      { id: `${model.input.equilibriumId}.before`, kind: "equilibrium-point", label: "Initial equilibrium" },
      { id: `${model.input.equilibriumId}.after`, kind: "equilibrium-point", label: "New equilibrium" }
    ]
  });
  const marketSidesObject = createKpSemanticAssetObject({
    id: marketSidesId,
    objectType: "economics-market-sides",
    title: "Surplus and shortage sides",
    value: {
      surplus: model.input.surplusSide,
      shortage: model.input.shortageSide
    },
    selectors: [
      { id: `${marketSidesId}.surplus`, kind: "surplus-side", label: "Surplus above equilibrium price" },
      { id: `${marketSidesId}.shortage`, kind: "shortage-side", label: "Shortage below equilibrium price" }
    ]
  });
  const beforeState = equilibriumStateObject(
    beforeStateId,
    "Initial supply-demand state",
    model.states.before
  );
  const afterState = equilibriumStateObject(
    afterStateId,
    "Shifted supply-demand state",
    model.states.after
  );
  const objects = [
    modelObject,
    graphObject,
    quantityAxisObject,
    priceAxisObject,
    supplyObject,
    demandObject,
    parameterObject,
    equilibriumObject,
    marketSidesObject,
    beforeState,
    afterState
  ];
  const transformation = createKpSemanticTransformation({
    id: economicsEquilibriumTransformationId,
    definitionId: "definition.economics.demand-intercept-shift",
    transformType: "shiftDemandIntercept",
    title: "Increase demand and move market equilibrium",
    sourceObjectIds: [
      graphId,
      model.id,
      quantityAxis.id,
      priceAxis.id,
      model.input.supply.id,
      model.input.demand.id,
      model.input.demand.interceptParameterId,
      model.input.equilibriumId,
      marketSidesId,
      beforeStateId
    ],
    targetObjectIds: [
      graphId,
      model.id,
      quantityAxis.id,
      priceAxis.id,
      model.input.supply.id,
      model.input.demand.id,
      model.input.demand.interceptParameterId,
      model.input.equilibriumId,
      marketSidesId,
      afterStateId
    ],
    preserves: ["identity", "role", "structure"],
    correspondence: [
      persistent(`${graphId}.viewport`),
      persistent(`${model.id}.model`, ["identity", "value", "structure"]),
      persistent(`${quantityAxis.id}.axis`),
      persistent(`${priceAxis.id}.axis`),
      persistent(`${model.input.supply.id}.body`, ["identity", "value", "presentation"]),
      persistent(`${model.input.supply.id}.equation`, ["identity", "value", "presentation"]),
      persistent(`${model.input.demand.id}.body`, ["identity", "role"]),
      persistent(`${model.input.demand.id}.equation`, ["identity", "role"]),
      {
        sourceSelectorId: `${model.input.demand.interceptParameterId}.before`,
        targetSelectorId: `${model.input.demand.interceptParameterId}.after`,
        preserves: ["role"]
      },
      {
        sourceSelectorId: `${model.input.equilibriumId}.before`,
        targetSelectorId: `${model.input.equilibriumId}.after`,
        preserves: ["role"]
      },
      persistent(`${marketSidesId}.surplus`, ["identity", "role"]),
      persistent(`${marketSidesId}.shortage`, ["identity", "role"]),
      {
        sourceSelectorId: `${beforeStateId}.snapshot`,
        targetSelectorId: `${afterStateId}.snapshot`,
        preserves: ["role", "structure"]
      }
    ],
    assumptions: [
      "Supply and demand are linear over the visible domain.",
      "Only the demand price intercept changes.",
      "Both exact equilibrium points lie inside the graph domain."
    ],
    lawRefs: [
      {
        id: "law.economics.supply-demand.exact-equilibrium",
        level: "strict",
        summary: "Supply price equals demand price at each exact equilibrium."
      },
      {
        id: "law.economics.supply-demand.market-side-preservation",
        level: "strict",
        summary: "Surplus remains above and shortage below equilibrium price."
      }
    ]
  });
  const root = createSemanticTransformationLeaf(
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
    id: economicsEquilibriumAnimationId,
    title: "Supply and demand equilibrium shift",
    bundle: createKpAssetBundle({
      id: "asset.economics.supply-demand-equilibrium-shift",
      title: "Supply and demand equilibrium assets",
      objects
    }),
    transformations: [transformation],
    transformationTree: createEditableSemanticTransformationTree({
      root,
      annotations: [
        {
          id: "focus.economics.demand-shift",
          kind: "focus",
          targetNodeId: transformation.id,
          placement: "during",
          selectorIds: [
            `${model.input.demand.id}.body`,
            `${model.input.equilibriumId}.before`,
            `${model.input.equilibriumId}.after`
          ],
          summary: "Follow the demand shift and the equilibrium handoff."
        }
      ]
    }),
    timeline: { id: timelineId, durationMs: 2400, beatCount: 48 },
    layout: {
      id: "layout.economics.supply-demand-equilibrium-shift",
      kind: "single",
      targetId: renderTargetId
    },
    renderTargets: [
      {
        id: renderTargetId,
        kind: "graph",
        objectIds: objects.map(({ id }) => id),
        selectorIds: objects.flatMap((object) =>
          object.selectors.map(({ id }) => id)
        ),
        transformationIds: [transformation.id],
        timelineId,
        summary: "Native SVG supply-demand graph with one exact equilibrium shift.",
        metadata: {
          graphMotionKind: "economics-supply-demand-equilibrium-shift",
          graphId,
          modelObjectId: model.id,
          supplyCurveId: model.input.supply.id,
          demandCurveId: model.input.demand.id,
          equilibriumId: model.input.equilibriumId,
          interceptParameterId: model.input.demand.interceptParameterId,
          beforeStateId,
          afterStateId
        }
      }
    ],
    checks: [
      {
        id: "check.economics.supply-demand.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: economicsEquilibriumAnimationId
      },
      {
        id: "check.economics.supply-demand.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: transformation.id
      },
      {
        id: "check.economics.supply-demand.exact-equilibrium",
        lawId: "law.economics.supply-demand.exact-equilibrium",
        level: "strict",
        targetId: transformation.id
      }
    ],
    metadata: {
      domain: "economics",
      graphMotionKind: "economics-supply-demand-equilibrium-shift",
      modelId: model.id
    }
  });
}

function equilibriumStateObject(
  id: string,
  title: string,
  value: KpSupplyDemandEquilibriumModelV1["states"]["before"] |
    KpSupplyDemandEquilibriumModelV1["states"]["after"]
): KpSemanticAssetObject {
  return createKpSemanticAssetObject({
    id,
    objectType: "economics-supply-demand-state",
    title,
    value,
    selectors: [
      { id: `${id}.snapshot`, kind: "market-state", label: title },
      { id: `${id}.demand-intercept`, kind: "parameter-value", label: "Demand intercept" },
      { id: `${id}.equilibrium-point`, kind: "equilibrium-point", label: "Equilibrium point" }
    ]
  });
}

function semanticObject<T extends { readonly id: string; readonly type: string }>(
  value: T,
  selectors: readonly { readonly id: string; readonly kind: string; readonly label: string }[]
): KpSemanticAssetObject<T> {
  return createKpSemanticAssetObject({
    id: value.id,
    objectType: value.type,
    title: "label" in value && typeof value.label === "string" ? value.label : value.id,
    value,
    selectors
  });
}

function persistent(
  selectorId: string,
  preserves: readonly ("identity" | "value" | "role" | "structure" | "presentation")[] =
    ["identity", "role", "structure"]
) {
  return {
    sourceSelectorId: selectorId,
    targetSelectorId: selectorId,
    preserves
  };
}

function exactDomain(axis: {
  readonly minimum: { readonly numerator: string; readonly denominator: string };
  readonly maximum: { readonly numerator: string; readonly denominator: string };
}): readonly [number, number] {
  return [exactNumber(axis.minimum), exactNumber(axis.maximum)];
}

function exactNumber(value: {
  readonly numerator: string;
  readonly denominator: string;
}): number {
  return Number(value.numerator) / Number(value.denominator);
}
