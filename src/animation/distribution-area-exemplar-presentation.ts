import {
  compileKpDistributionChoreography,
  type KpDistributionChoreographyPlan
} from "./distribution-choreography.ts";
import {
  compileKpFactoringChoreography,
  type KpFactoringChoreographyPlan
} from "./factoring-choreography.ts";
import {
  createKpDistributionAreaExemplarCrossSurfaceModel,
  type KpDistributionAreaExemplarConceptId,
  type KpDistributionAreaExemplarCrossSurfaceModel
} from "../semantic/distribution-area-exemplar-cross-surface.ts";

export type KpDistributionAreaLocalPresentationKind =
  | "derive-constant-product"
  | "decompose-constant-product";

export interface KpDistributionAreaLocalPresentationIntent {
  readonly kind: KpDistributionAreaLocalPresentationKind;
  readonly id: string;
  readonly sourceSelectorIds: readonly string[];
  readonly targetSelectorIds: readonly string[];
  readonly conceptIds: readonly KpDistributionAreaExemplarConceptId[];
  readonly geometryAction: "settle-region-label" | "reveal-region-factors";
  readonly surfaceCoordination: "lockstep";
}

export interface KpDistributionAreaExemplarPresentationPlan {
  readonly id: string;
  readonly model: KpDistributionAreaExemplarCrossSurfaceModel;
  readonly forward: readonly [
    KpDistributionChoreographyPlan,
    KpDistributionAreaLocalPresentationIntent
  ];
  readonly reverse: readonly [
    KpDistributionAreaLocalPresentationIntent,
    KpFactoringChoreographyPlan
  ];
}

/** Compiles intent and ownership transfer only; layout and timing are later boundaries. */
export function compileKpDistributionAreaExemplarPresentationPlan():
  KpDistributionAreaExemplarPresentationPlan {
  const model = createKpDistributionAreaExemplarCrossSurfaceModel();
  const state = model.trace.stateObjectIds;
  const factored = (suffix: string) => `${state.factored}.${suffix}`;
  const distributed = (suffix: string) => `${state.distributed}.${suffix}`;
  const expanded = (suffix: string) => `${state.expanded}.${suffix}`;

  const distribute = compileKpDistributionChoreography({
    id: `${model.id}.presentation.distribute`,
    sourceFactorId: factored("factor.3"),
    factorCopyIds: [
      distributed("left.factor.3"),
      distributed("right.factor.3")
    ],
    addendPairs: [
      { sourceId: factored("term.x"), targetId: distributed("left.term.x"), semanticIndex: 0 },
      { sourceId: factored("term.2"), targetId: distributed("right.term.2"), semanticIndex: 1 }
    ],
    connectorPairs: [
      { sourceId: factored("plus"), targetId: distributed("plus"), semanticIndex: 0 }
    ],
    groupingArtifactIds: [factored("left-paren"), factored("right-paren")]
  });
  const evaluate: KpDistributionAreaLocalPresentationIntent = {
    kind: "derive-constant-product",
    id: `${model.id}.presentation.evaluate-three-times-two`,
    sourceSelectorIds: [
      distributed("right.factor.3"),
      distributed("right.times"),
      distributed("right.term.2")
    ],
    targetSelectorIds: [expanded("right.product.6")],
    conceptIds: ["factor.3", "term.2", "product.6"],
    geometryAction: "settle-region-label",
    surfaceCoordination: "lockstep"
  };
  const decompose: KpDistributionAreaLocalPresentationIntent = {
    kind: "decompose-constant-product",
    id: `${model.id}.presentation.decompose-six`,
    sourceSelectorIds: [expanded("right.product.6")],
    targetSelectorIds: [
      distributed("right.factor.3"),
      distributed("right.times"),
      distributed("right.term.2")
    ],
    conceptIds: ["product.6", "factor.3", "term.2"],
    geometryAction: "reveal-region-factors",
    surfaceCoordination: "lockstep"
  };
  const factor = compileKpFactoringChoreography({
    id: `${model.id}.presentation.factor`,
    factorCopyIds: [
      distributed("left.factor.3"),
      distributed("right.factor.3")
    ],
    commonFactorId: factored("factor.3"),
    addendPairs: [
      { sourceId: distributed("left.term.x"), targetId: factored("term.x"), semanticIndex: 0 },
      { sourceId: distributed("right.term.2"), targetId: factored("term.2"), semanticIndex: 1 }
    ],
    connectorPairs: [
      { sourceId: distributed("plus"), targetId: factored("plus"), semanticIndex: 0 }
    ],
    groupingArtifactIds: [factored("left-paren"), factored("right-paren")]
  });

  return {
    id: `${model.id}.presentation-plan`,
    model,
    forward: [distribute, evaluate],
    reverse: [decompose, factor]
  };
}
