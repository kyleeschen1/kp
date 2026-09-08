import { freezeKpReasoningOwnedProjection, type KpReasoningEvidence } from "./evidence.ts";
import { bindKpReasoningSupport } from "./support.ts";
import { pinKpReasoningReference, resolveKpReasoningReference, type KpReasoningReference } from "./references.ts";
import { KpReasoningRepairGap } from "./source.ts";

export function extractKpReasoningContext(
  evidence: KpReasoningEvidence,
  returnCheckpoint = pinKpReasoningReference(evidence, "state", evidence.source.parent.targetStateId)
) {
  const support = bindKpReasoningSupport(evidence);
  const returnState = resolveKpReasoningReference(evidence, returnCheckpoint);
  if (returnState.kind !== "state" || !support.procedure.checkpoints.some(ref => ref.id === returnState.id)) {
    throw new KpReasoningRepairGap("kp.reasoning.return-context", "$.returnCheckpoint",
      "Return to a checkpoint in this parent argument, not an unrelated state or operation.");
  }
  const selected = new Set(support.procedure.checkpoints.map(ref => ref.id));
  const claims = evidence.claimAuthority.claims.filter(claim =>
    selected.has(claim.sourceRefId) || support.procedure.operations.some(item => item.reference.id === claim.sourceRefId));
  // Serialize a projection of the checked source. Its fields are useful context,
  // not transferable verifier capabilities; restoration must rebind the source.
  const extraction = {
    schemaVersion: "kp.reasoning-extraction.v1" as const,
    sourceId: evidence.source.id, revisionId: evidence.revisionId,
    parent: { id: support.parentId, source: support.source, target: support.target,
      editorialStatement: evidence.editorial.parent },
    reason: { id: support.reasonId, title: evidence.source.reason.title,
      editorialExplanation: evidence.editorial.reason },
    returnTo: { parentId: support.parentId,
      checkpoint: pinKpReasoningReference(evidence, "state", returnCheckpoint.id) },
    relation: support.relation,
    assumptions: evidence.assumptions,
    definitions: evidence.definitions,
    formula: support.procedure.formula,
    states: evidence.states.filter(state => selected.has(state.stateId)),
    operations: support.procedure.operations,
    claimReferences: claims,
    source: evidence.source
  };
  freezeKpReasoningOwnedProjection(extraction);
  return extraction;
}

export type KpReasoningExtraction = ReturnType<typeof extractKpReasoningContext>;

export function resolveKpReasoningReturnCheckpoint(
  evidence: KpReasoningEvidence, extraction: KpReasoningExtraction
): KpReasoningReference {
  if (extraction.sourceId !== evidence.source.id || extraction.revisionId !== evidence.revisionId
    || extraction.parent.id !== evidence.source.parent.id
    || extraction.returnTo.parentId !== evidence.source.parent.id) {
    throw new KpReasoningRepairGap("kp.reasoning.return-revision", "$.returnTo",
      "Return to the exact source revision and parent; do not attach historical context to a new revision.");
  }
  // Recompute support and return scope rather than trusting serialized labels.
  return extractKpReasoningContext(evidence, extraction.returnTo.checkpoint).returnTo.checkpoint;
}
