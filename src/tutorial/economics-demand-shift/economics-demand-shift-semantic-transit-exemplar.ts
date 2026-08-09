import {
  compileKpTutorialSemanticTransitAuthoring,
  defineKpTutorialSemanticTransit,
  defineKpTutorialStageObject,
  defineKpTutorialTextReference
} from "../kp-tutorial-semantic-transit-authoring.ts";

const priceAxisObject = defineKpTutorialStageObject({
  id: "axis-price",
  stageId: "demand-shift-graph"
});

/** One literal P-to-P correspondence; no display text or DOM position is identity. */
export function compileKpEconomicsDemandShiftSemanticTransitExemplar(
  passageIds: readonly string[],
  options: {
    readonly referenceId?: string | undefined;
    readonly passageId?: string | undefined;
  } = {}
) {
  const priceAxisReference = defineKpTutorialTextReference({
    id: options.referenceId ?? "price-axis-inline",
    passageId: options.passageId ?? "graph-at-rest"
  });
  const priceAxisTransit = defineKpTutorialSemanticTransit({
    id: "price-axis-correspondence",
    sourceReferenceId: priceAxisReference.id,
    destinationObjectId: priceAxisObject.id
  });
  return compileKpTutorialSemanticTransitAuthoring({
    textReferences: [priceAxisReference],
    stageObjects: [priceAxisObject],
    transits: [priceAxisTransit],
    passageIds,
    stageIds: [priceAxisObject.stageId]
  });
}
