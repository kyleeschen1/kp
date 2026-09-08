import { BinaryJointModel, ProbabilityRepairGap } from "../../../domains/probability/binary-joint-model.ts";
import { compileBinaryProbabilityTrace, requireBinaryProbabilityTrace, type BinaryProbabilityTrace } from "../../../domains/probability/binary-probability-trace.ts";
import { createKpAnimationAssetBuilder } from "../../animation/asset.ts";
import { createKpSemanticAssetObject } from "../../semantic/asset.ts";
import { createKpSemanticTransformation } from "../../semantic/asset-transformation.ts";
import { createKpCanonicalOperationPack } from "../../semantic/canonical-operation-pack.ts";
import { compileKpGovernedCanonicalConstruction, type KpGovernedConstructionSourceAuthority } from "../../authoring/governed-canonical-construction-compiler.ts";
import { createKpGovernedCanonicalConstructionRequest } from "../../authoring/governed-semantic-request.ts";
import { sha256 } from "../../kernel/sha256.ts";

export const bayesArtifactId = "animation.probability.flagged-ticket-bayes";
export const bayesOperationPack = createKpCanonicalOperationPack({ id: "project.kp.binary-probability", scope: "project",
  version: "1.0.0", title: "Bounded binary probability operations",
  operationIds: ["construct", "collapse", "condition", "restore-population", "reorder"].map(kind => `probability.${kind}`) });

const owners = new WeakMap<KpGovernedConstructionSourceAuthority, BinaryProbabilityTrace>();
export function createBayesSourceAuthority(trace: BinaryProbabilityTrace): KpGovernedConstructionSourceAuthority {
  requireBinaryProbabilityTrace(trace);
  const { model } = trace;
  const serializeMass = (mass: { numerator: bigint; denominator: bigint }) => `${mass.numerator}/${mass.denominator}`;
  const source = { sourceId: model.sourceId, events: model.events,
    outcomes: model.outcomes.map(outcome => ({ id: outcome.id, key: outcome.key, mass: serializeMass(outcome.mass) })) };
  const revisionId = `sha256:${sha256(JSON.stringify(source))}`;
  const builder = createKpAnimationAssetBuilder({ id: bayesArtifactId, title: "Build a probability model; change the question" });
  for (const state of trace.states) {
    builder.addObject(createKpSemanticAssetObject({ id: state.id, objectType: "binary-probability-state", title: state.kind,
      value: { kind: state.kind, sourceId: model.sourceId, revisionId, outcomes: source.outcomes,
        firstEventId: state.kind === "population" ? null : model.events[state.tree.first].id,
        referencePopulationId: state.kind === "conditioned" ? state.population.evidence.populationId : `${model.sourceId}.population.all`,
        conditionalValue: state.kind === "conditioned" ? serializeMass(state.query.value) : null },
      selectors: model.outcomes.map(outcome => ({ id: `${state.id}.${outcome.key}`, kind: "probability-outcome",
        label: outcome.key, metadata: { jointOutcomeId: outcome.id, sourceRevision: revisionId } })),
      provenance: { kind: "derived", sourceIds: [model.sourceId], summary: "Domain-validated joint outcomes; appearance and tree order are projections." } }));
  }
  for (const operation of trace.operations) {
    builder.addTransformation(createKpSemanticTransformation({ id: operation.id, definitionId: `definition.probability.${operation.kind}.v1`,
      transformType: `probability.${operation.kind}`, title: operation.kind,
      sourceObjectIds: [operation.source.id], targetObjectIds: [operation.target.id], preserves: ["identity"],
      assumptions: ["Four disjoint exhaustive outcomes retain their exact joint masses.",
        ...(operation.changesReferencePopulation ? ["Reference population changes explicitly; joint source remains retained."] : [])],
      lawRefs: [{ id: operation.lawId, level: "strict", summary: "Evidence is computed by the issued domain trace, not supplied by an author request." }],
      correspondenceMap: { id: `${operation.id}.correspondence`, records: model.outcomes.map(outcome => ({
        id: `${operation.id}.${outcome.key}`, relation: "identity" as const,
        sourceSelectorIds: [`${operation.source.id}.${outcome.key}`], targetSelectorIds: [`${operation.target.id}.${outcome.key}`],
        summary: `Retain joint outcome ${outcome.id}; do not infer identity from branch position.`
      })) } }));
  }
  builder.withTimeline({ id: `${model.sourceId}.timeline`, durationMs: 10800, beatCount: trace.states.length });
  builder.addRenderTarget({ id: `${model.sourceId}.tree-surface`, kind: "diagram", objectIds: trace.states.map(state => state.id) });
  const result: KpGovernedConstructionSourceAuthority = deepFreeze({ sourceId: model.sourceId, revisionId,
    operationPacks: [{ packId: bayesOperationPack.id, version: bayesOperationPack.version }], animation: builder.build() });
  owners.set(result, trace);
  return result;
}

export function createBayesConstructionRequest(authority: KpGovernedConstructionSourceAuthority) {
  requireBayesAuthority(authority);
  return createKpGovernedCanonicalConstructionRequest({ schemaVersion: "kp.governed-semantic-authoring-request.v2",
    id: `request.${authority.sourceId}`, source: { kind: "verified-semantic-source", sourceId: authority.sourceId,
      revisionId: authority.revisionId, operationPacks: authority.operationPacks },
    approvedObjectIds: authority.animation.bundle.objects.map(object => object.id),
    approvedOperationIds: authority.animation.transformations.map(operation => operation.id),
    explanationPurpose: { kind: "compare", objectIds: authority.animation.bundle.objects.map(object => object.id), operationIds: [] },
    detailLevel: "complete", compositionIntent: { kind: "sequence", operationIds: authority.animation.transformations.map(operation => operation.id) } });
}

export function compileBayesConstruction(authority: KpGovernedConstructionSourceAuthority, request: unknown = createBayesConstructionRequest(authority)) {
  requireBayesAuthority(authority);
  // The shared compiler checks selected references; only this binder supplies
  // probability truth. Structurally similar serialized authority is not accepted.
  return compileKpGovernedCanonicalConstruction({ authority, request: createKpGovernedCanonicalConstructionRequest(request) });
}

export function bindBayesEvidence(source: unknown) {
  const model = BinaryJointModel.from(source), trace = compileBinaryProbabilityTrace(model);
  const authority = createBayesSourceAuthority(trace), construction = compileBayesConstruction(authority);
  return Object.freeze({ model, trace, authority, construction, revisionId: authority.revisionId });
}
function requireBayesAuthority(authority: KpGovernedConstructionSourceAuthority) {
  const trace = owners.get(authority);
  if (!trace) throw new ProbabilityRepairGap("probability.reference", "$.authority", "Use authority issued from a validated probability trace.");
  requireBinaryProbabilityTrace(trace);
}
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
