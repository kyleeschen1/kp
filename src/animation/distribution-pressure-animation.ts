import {
  compileKpDistributionChoreography,
  sampleKpDistributionChoreography,
  type KpDistributionChoreographyInput
} from "./distribution-choreography.ts";
import {
  kpCanonicalDistributionPressureContract
} from "../semantic/distribution-pressure-contract.ts";
import {
  kpCanonicalCompiledDistributionPressureSemanticMotion
} from "../semantic/distribution-pressure-semantic-motion.ts";

const contract = kpCanonicalDistributionPressureContract;
const addendContinuants = contract.continuants.filter(
  ({ role }) => role !== "connector"
);

/**
 * The pressure caller is deliberately only semantic bindings over the proven
 * distribution capability. Paths, timing, sampling, and paint stay owned by
 * the existing choreography and native equation renderer.
 */
export const kpCanonicalDistributionPressureBinding = Object.freeze({
  id: "binding.distribution.expand-a-sum.pressure",
  sourceFactorId: contract.factorFanOut.sourceFactorSelectorId,
  factorCopyIds: contract.factorFanOut.targetFactorSelectorIds,
  addendPairs: Object.freeze(addendContinuants.map(
    ({ sourceSelectorId, targetSelectorId }, semanticIndex) => Object.freeze({
      sourceId: sourceSelectorId,
      targetId: targetSelectorId,
      semanticIndex
    })
  )),
  connectorPairs: Object.freeze([Object.freeze({
    sourceId: contract.connectorAttachment.sourceSelectorId,
    targetId: contract.connectorAttachment.targetSelectorId,
    semanticIndex: 0,
    motionConstraint: contract.connectorAttachment.motionConstraint
  })]),
  groupingArtifactIds: contract.groupingRetirement.sourceSelectorIds,
  semanticMotion: kpCanonicalCompiledDistributionPressureSemanticMotion
} satisfies KpDistributionChoreographyInput);

export const kpCanonicalDistributionPressurePlan =
  compileKpDistributionChoreography(
    kpCanonicalDistributionPressureBinding
  );

export function sampleKpCanonicalDistributionPressureAnimation(
  progress: number
) {
  return sampleKpDistributionChoreography({
    plan: kpCanonicalDistributionPressurePlan,
    progress
  });
}
