import { createKpAnimationAssetBuilder } from "../animation/asset.ts";
import { createKpImmutableSemanticAssetObject } from "../semantic/immutable-asset.ts";
import { createKpSemanticTransformation } from "../semantic/asset-transformation.ts";
import { createKpCanonicalOperationPack } from "../semantic/canonical-operation-pack.ts";
import { assertCheckedMotionObservation, motionObservationFacts, type CheckedMotionObservation } from "../semantic/motion-observation.ts";
import { compileKpGovernedCanonicalConstruction } from "./governed-canonical-construction-compiler.ts";
import { createKpGovernedCanonicalConstructionRequest } from "./governed-semantic-request.ts";

export const motionObservationOperationPack = createKpCanonicalOperationPack({
  id: "project.motion-observation", scope: "project", version: "1.0.0", title: "Bounded motion observation",
  operationIds: ["motion.observe-linear-trip", "motion.change-fixed-origin"]
});

/** Domain checking establishes the facts; governed construction checks references
 * and lineage. Neither layer treats a declared law name as its own proof. */
export function compileMotionObservationAsset(record: CheckedMotionObservation) {
  assertCheckedMotionObservation(record);
  const facts = motionObservationFacts(record), samples = record.value.observations;
  const state = (name: string, origin: number, time: number) => createKpImmutableSemanticAssetObject({
    id: `${record.id}.${name}`, objectType: "motion-description", title: name,
    value: { pointId: record.value.pointId, origin, time, observationRecordId: record.id },
    selectors: [{ id: `${record.id}.${name}.point`, kind: "tracked-point", label: "Same represented point" },
      ...samples.map(sample => ({ id: `${record.id}.${name}.observation.${sample.id}`, kind: "observation", label: sample.id }))]
  });
  const initial = state("initial", 0, 0), recorded = state("recorded", 0, facts.duration),
    rebased = state("rebased", record.value.originShift, facts.duration);
  const pairs = [
    { from: initial, to: recorded, operation: "motion.observe-linear-trip", law: "motion.declared-linear-interpolation", title: "Read the modeled trip" },
    { from: recorded, to: rebased, operation: "motion.change-fixed-origin", law: "motion.fixed-origin-difference-invariance", title: "Change only the reference origin" }
  ];
  const builder = createKpAnimationAssetBuilder({ id: "animation.motion-observation", title: "How do we describe motion?" });
  [record, initial, recorded, rebased].forEach(object => builder.addObject(object));
  pairs.forEach(({ from, to, operation, law, title }) => builder.addTransformation(createKpSemanticTransformation({
    id: operation, definitionId: `definition.${operation}`, transformType: operation, title,
    sourceObjectIds: [from.id], targetObjectIds: [to.id], preserves: ["identity"],
    assumptions: ["Fixed positive axis and metre/second units", "Piecewise-linear interpolation is a declared model, not inferred continuous observation"],
    lawRefs: [{ id: law, level: "strict", summary: "Checked bounded integer record and deterministic model; not an empirical force law" }],
    correspondenceMap: { id: `lineage.${operation}`, records: from.selectors.map((selector, index) => ({
      id: `lineage.${operation}.${index}`, relation: "identity", sourceSelectorIds: [selector.id],
      targetSelectorIds: [to.selectors[index]!.id], summary: "Preserve point or observation identity across descriptive states"
    })) }
  })));
  builder.addRenderTarget({ id: "render.motion-observation", kind: "graph", objectIds: [record.id, initial.id, recorded.id, rebased.id],
    transformationIds: pairs.map(pair => pair.operation), summary: "Motion/table/position-time representation, one native 2D stage owner" });
  const animation = builder.build(), operationIds = animation.transformations.map(operation => operation.id);
  const source = { sourceId: record.id, revisionId: record.id, operationPacks: [{ packId: motionObservationOperationPack.id, version: motionObservationOperationPack.version }] };
  const request = createKpGovernedCanonicalConstructionRequest({
    schemaVersion: "kp.governed-semantic-authoring-request.v2", id: "request.motion-observation",
    source: { kind: "verified-semantic-source", ...source }, approvedObjectIds: animation.bundle.objects.map(object => object.id),
    approvedOperationIds: operationIds, explanationPurpose: { kind: "compare", objectIds: [initial.id, recorded.id, rebased.id], operationIds },
    detailLevel: "complete", compositionIntent: { kind: "sequence", operationIds }
  });
  const construction = compileKpGovernedCanonicalConstruction({ request, authority: { ...source, animation } });
  return Object.freeze({ record, animation, construction, facts });
}
