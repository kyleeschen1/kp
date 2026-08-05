import {
  compileKpTutorialSemanticTransitAuthoring,
  defineKpTutorialSemanticTransit,
  defineKpTutorialStageObject,
  defineKpTutorialTextReference
} from "../kp-tutorial-semantic-transit-authoring.ts";

const priceAxisReference = defineKpTutorialTextReference({
  id: "price-axis-inline",
  passageId: "graph-at-rest"
});

const priceAxisObject = defineKpTutorialStageObject({
  id: "axis-price",
  stageId: "demand-shift-graph"
});

const priceAxisTransit = defineKpTutorialSemanticTransit({
  id: "price-axis-correspondence",
  sourceReferenceId: priceAxisReference.id,
  destinationObjectId: priceAxisObject.id
});

/** One literal P-to-P correspondence; no display text or DOM position is identity. */
export function compileKpEconomicsDemandShiftSemanticTransitExemplar(
  passageIds: readonly string[]
) {
  return compileKpTutorialSemanticTransitAuthoring({
    textReferences: [priceAxisReference],
    stageObjects: [priceAxisObject],
    transits: [priceAxisTransit],
    passageIds,
    stageIds: [priceAxisObject.stageId]
  });
}
