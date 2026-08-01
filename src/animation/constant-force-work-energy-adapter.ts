import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type KpSemanticAssetObject
} from "../semantic/asset.ts";
import { createKpSemanticTransformation } from "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf
} from "../semantic/transformation-composition.ts";
import { createAxis2DObject, createGraph2DObject } from "../semantic/graph.ts";
import {
  createKpDiagramScene,
  createKpDiagramSceneSemanticObject,
  type KpDiagramScene
} from "../semantic/diagram-scene.ts";
import {
  createKpConstantForceWorkEnergyModel,
  type KpConstantForceWorkEnergyModelV1,
  type KpConstantForceWorkEnergyStateV1
} from "../../domains/physics/constant-force-work-energy-model.ts";

export const constantForceWorkEnergyAnimationId =
  "animation.physics.constant-force-work-energy";
export const constantForceWorkEnergyTransformationId =
  "transform.physics.accumulate-constant-force-work";

const timelineId = "timeline.physics.constant-force-work-energy";
const renderTargetId = "render.physics.constant-force-work-energy";
const theoremId = "relation.physics.work-energy.theorem";

export function createConstantForceWorkEnergyAnimationAsset(
  model: KpConstantForceWorkEnergyModelV1 =
    createKpConstantForceWorkEnergyModel()
): KpAnimationAsset {
  const graphId = model.input.forcePositionGraph.id;
  const graph = createGraph2DObject({
    id: graphId,
    label: "Horizontal net force over position",
    xAxisId: model.input.forcePositionGraph.positionAxis.id,
    yAxisId: model.input.forcePositionGraph.forceAxis.id,
    xDomain: exactDomain(model.input.forcePositionGraph.positionAxis),
    yDomain: exactDomain(model.input.forcePositionGraph.forceAxis),
    width: 720,
    height: 420
  });
  const positionAxis = createAxis2DObject({
    id: graph.xAxisId,
    graphId,
    label: "Position x (m)",
    orientation: "x",
    domain: graph.xDomain,
    tickStep: exactNumber(model.input.forcePositionGraph.positionAxis.tickStep)
  });
  const forceAxis = createAxis2DObject({
    id: graph.yAxisId,
    graphId,
    label: "Horizontal net force F_x (N)",
    orientation: "y",
    domain: graph.yDomain,
    tickStep: exactNumber(model.input.forcePositionGraph.forceAxis.tickStep)
  });
  const initialDiagram = createMotionDiagram(
    "initial",
    54,
    exactNumber(model.parameterState.netForceMagnitude)
  );
  const finalDiagram = createMotionDiagram(
    "final",
    286,
    exactNumber(model.parameterState.netForceMagnitude)
  );
  const graphObject = semanticObject(graph, [
    { id: `${graphId}.viewport`, kind: "viewport", label: "force-position graph" }
  ]);
  const positionAxisObject = semanticObject(positionAxis, [
    { id: `${positionAxis.id}.axis`, kind: "position-axis", label: "Position x" }
  ]);
  const forceAxisObject = semanticObject(forceAxis, [
    { id: `${forceAxis.id}.axis`, kind: "force-axis", label: "Horizontal force F_x" }
  ]);
  const modelObject = createKpSemanticAssetObject({
    id: model.id,
    objectType: "physics-constant-force-work-energy-model",
    title: "Exact constant-force work-energy model",
    value: model,
    selectors: [
      { id: `${model.id}.model`, kind: "domain-model", label: "Exact work-energy model" }
    ]
  });
  const parameterObject = createKpSemanticAssetObject({
    id: model.input.motion.netForce.parameter.id,
    objectType: "physics-force-parameter",
    title: "Horizontal net force",
    value: {
      current: model.parameterState.netForceMagnitude,
      minimum: model.input.motion.netForce.parameter.minimum,
      maximum: model.input.motion.netForce.parameter.maximum,
      step: model.input.motion.netForce.parameter.step,
      unitId: model.input.motion.netForce.unitId
    },
    selectors: [
      {
        id: `${model.input.motion.netForce.parameter.id}.value`,
        kind: "parameter-value",
        label: "Net force magnitude"
      }
    ]
  });
  const workAreaObject = createKpSemanticAssetObject({
    id: model.input.forcePositionGraph.workAreaId,
    objectType: "physics-work-area",
    title: "Accumulated work area",
    value: {
      graphId,
      forceSegmentId: model.input.forcePositionGraph.constantForceSegmentId,
      intervalId: model.input.motion.interval.id,
      unitId: model.input.units.joule.id
    },
    selectors: [
      {
        id: `${model.input.forcePositionGraph.workAreaId}.body`,
        kind: "work-area",
        label: "Area equal to accumulated work"
      }
    ]
  });
  const theoremObject = createKpSemanticAssetObject({
    id: theoremId,
    objectType: "physics-work-energy-relation",
    title: "Work-energy theorem",
    value: {
      workIntegralLatex: model.input.laws.workIntegralLatex,
      constantForceWorkLatex: model.input.laws.constantForceWorkLatex,
      workEnergyLatex: model.input.laws.workEnergyLatex,
      unitIdentity: model.input.laws.unitIdentity
    },
    selectors: [
      {
        id: `${theoremId}.equation`,
        kind: "equation",
        label: "Net work equals kinetic-energy change"
      }
    ]
  });
  const initialState = stateObject(model.states.initial);
  const finalState = stateObject(model.states.final);
  const objects = [
    modelObject,
    graphObject,
    positionAxisObject,
    forceAxisObject,
    createKpDiagramSceneSemanticObject(initialDiagram),
    createKpDiagramSceneSemanticObject(finalDiagram),
    parameterObject,
    workAreaObject,
    theoremObject,
    initialState,
    finalState
  ];
  const persistentObjectIds = [
    model.id,
    graphId,
    positionAxis.id,
    forceAxis.id,
    parameterObject.id,
    workAreaObject.id,
    theoremObject.id
  ];
  const transformation = createKpSemanticTransformation({
    id: constantForceWorkEnergyTransformationId,
    definitionId: "definition.physics.constant-force-work-energy",
    transformType: "accumulateConstantForceWork",
    title: "Accumulate constant-force work as kinetic energy",
    sourceObjectIds: [
      ...persistentObjectIds,
      initialDiagram.id,
      initialState.id
    ],
    targetObjectIds: [
      ...persistentObjectIds,
      finalDiagram.id,
      finalState.id
    ],
    preserves: ["identity", "role", "structure"],
    correspondence: [
      persistent(`${model.id}.model`, ["identity", "value", "structure"]),
      persistent(`${graphId}.viewport`),
      persistent(`${positionAxis.id}.axis`),
      persistent(`${forceAxis.id}.axis`),
      persistent(`${parameterObject.id}.value`, ["identity", "value", "role"]),
      persistent(`${workAreaObject.id}.body`, ["identity", "role"]),
      persistent(`${theoremObject.id}.equation`, ["identity", "value", "role"]),
      mapped(
        `${initialDiagram.id}.block`,
        `${finalDiagram.id}.block`,
        ["identity", "role"]
      ),
      mapped(
        `${initialDiagram.id}.force-tip`,
        `${finalDiagram.id}.force-tip`,
        ["role"]
      ),
      mapped(
        `${initialDiagram.id}.net-force`,
        `${finalDiagram.id}.net-force`,
        ["identity", "value", "role"]
      ),
      mapped(
        `${initialDiagram.id}.force-label`,
        `${finalDiagram.id}.force-label`,
        ["identity", "value", "role"]
      ),
      mapped(
        `${initialDiagram.id}.displacement-label`,
        `${finalDiagram.id}.displacement-label`,
        ["role"]
      ),
      mapped(
        `${initialState.id}.snapshot`,
        `${finalState.id}.snapshot`,
        ["role", "structure"]
      )
    ],
    assumptions: [
      "Motion is one-dimensional and horizontal.",
      "The net force is constant and parallel to displacement.",
      "Vertical forces cancel and the surface is frictionless."
    ],
    lawRefs: [
      {
        id: "law.physics.constant-force.work-area",
        level: "strict",
        summary: "The rectangular force-position area equals exact net work."
      },
      {
        id: "law.physics.work-energy.exact",
        level: "strict",
        summary: "Exact net work equals exact kinetic-energy change."
      },
      {
        id: "law.physics.work-energy.units",
        level: "strict",
        summary: "Newton-meter and joule share the same SI dimension."
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
    id: constantForceWorkEnergyAnimationId,
    title: "Constant force and kinetic-energy change",
    bundle: createKpAssetBundle({
      id: "asset.physics.constant-force-work-energy",
      title: "Constant-force work-energy assets",
      objects
    }),
    transformations: [transformation],
    transformationTree: createEditableSemanticTransformationTree({
      root,
      annotations: [
        {
          id: "focus.physics.work-area-energy",
          kind: "focus",
          targetNodeId: transformation.id,
          placement: "during",
          selectorIds: [
            `${workAreaObject.id}.body`,
            `${theoremObject.id}.equation`,
            `${finalDiagram.id}.block`
          ],
          summary: "Follow one displacement across diagram, graph area, work, and energy."
        }
      ]
    }),
    timeline: { id: timelineId, durationMs: 2800, beatCount: 56 },
    layout: {
      id: "layout.physics.constant-force-work-energy",
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
        summary: "One native SVG synchronizes force-position area, motion diagram, and work-energy equations.",
        metadata: {
          graphMotionKind: "physics-constant-force-work-energy",
          graphId,
          modelObjectId: model.id,
          initialDiagramId: initialDiagram.id,
          finalDiagramId: finalDiagram.id,
          forceParameterId: parameterObject.id,
          workAreaId: workAreaObject.id,
          theoremId,
          initialStateId: initialState.id,
          finalStateId: finalState.id
        }
      }
    ],
    checks: [
      {
        id: "check.physics.work-energy.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: constantForceWorkEnergyAnimationId
      },
      {
        id: "check.physics.work-energy.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: transformation.id
      },
      {
        id: "check.physics.work-energy.exact",
        lawId: "law.physics.work-energy.exact",
        level: "strict",
        targetId: transformation.id
      }
    ],
    dashboard: {
      rowId: constantForceWorkEnergyAnimationId,
      tags: [
        "animation",
        "physics",
        "graph",
        "diagram",
        "force",
        "work",
        "kinetic-energy"
      ]
    },
    metadata: {
      domain: "physics",
      graphMotionKind: "physics-constant-force-work-energy",
      modelId: model.id,
      summary:
        "Relates constant force over displacement to graph area, net work, and kinetic-energy change."
    }
  });
}

function createMotionDiagram(
  phase: "initial" | "final",
  blockX: number,
  forceMagnitude: number
): KpDiagramScene {
  const id = `diagram.physics.work-energy.${phase}`;
  const blockId = `${id}.block-node`;
  const forceTipId = `${id}.force-tip-node`;
  return createKpDiagramScene({
    id,
    title: `${phase === "initial" ? "Initial" : "Final"} constant-force motion diagram`,
    width: 420,
    height: 180,
    nodes: [
      {
        id: blockId,
        selectorId: `${id}.block`,
        shape: "rectangle",
        x: blockX,
        y: 76,
        width: 58,
        height: 46,
        label: "object"
      },
      {
        id: forceTipId,
        selectorId: `${id}.force-tip`,
        shape: "circle",
        x: blockX + 82 + forceMagnitude * 5,
        y: 96,
        width: 4,
        height: 4,
        label: "force endpoint"
      }
    ],
    edges: [
      {
        id: `${id}.net-force-edge`,
        selectorId: `${id}.net-force`,
        sourceNodeId: blockId,
        targetNodeId: forceTipId,
        directed: true
      }
    ],
    groups: [],
    labels: [
      {
        id: `${id}.force-label-node`,
        selectorId: `${id}.force-label`,
        targetId: `${id}.net-force-edge`,
        text: "F_x",
        placement: "above"
      },
      {
        id: `${id}.displacement-label-node`,
        selectorId: `${id}.displacement-label`,
        targetId: blockId,
        text: "\\Delta x",
        placement: "below"
      }
    ]
  });
}

function stateObject(
  state: KpConstantForceWorkEnergyStateV1
): KpSemanticAssetObject {
  return createKpSemanticAssetObject({
    id: state.id,
    objectType: "physics-work-energy-state",
    title: `${state.phase} work-energy state`,
    value: state,
    selectors: [
      {
        id: `${state.id}.snapshot`,
        kind: "physics-state",
        label: `${state.phase} work-energy state`
      }
    ]
  });
}

function semanticObject<T extends { readonly id: string; readonly type: string }>(
  value: T,
  selectors: readonly {
    readonly id: string;
    readonly kind: string;
    readonly label: string;
  }[]
): KpSemanticAssetObject<T> {
  return createKpSemanticAssetObject({
    id: value.id,
    objectType: value.type,
    title:
      "label" in value && typeof value.label === "string"
        ? value.label
        : value.id,
    value,
    selectors
  });
}

function persistent(
  selectorId: string,
  preserves: readonly (
    | "identity"
    | "value"
    | "role"
    | "structure"
    | "presentation"
  )[] = ["identity", "role", "structure"]
) {
  return {
    sourceSelectorId: selectorId,
    targetSelectorId: selectorId,
    preserves
  };
}

function mapped(
  sourceSelectorId: string,
  targetSelectorId: string,
  preserves: readonly (
    | "identity"
    | "value"
    | "role"
    | "structure"
    | "presentation"
  )[]
) {
  return { sourceSelectorId, targetSelectorId, preserves };
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
