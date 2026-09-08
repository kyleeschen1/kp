import { requireKpReasoningEvidence, type KpReasoningEvidence } from "./evidence.ts";
import { KpReasoningRepairGap } from "./source.ts";

export type KpReasoningReferenceKind = "state" | "operation" | "definition" | "assumption";

/** A local source-selection envelope around existing IDs, not new entity identity. */
export interface KpReasoningReference {
  readonly sourceId: string;
  readonly revisionId: string;
  readonly kind: KpReasoningReferenceKind;
  readonly id: string;
  readonly timelineAuthority: "none";
}

export function pinKpReasoningReference(
  evidence: KpReasoningEvidence, kind: KpReasoningReferenceKind, id: string
): KpReasoningReference {
  requireKpReasoningEvidence(evidence);
  const reference = Object.freeze({
    sourceId: evidence.source.id, revisionId: evidence.revisionId, kind, id,
    // Like Article semantic links, a reference does not control playback.
    timelineAuthority: "none" as const
  });
  resolveKpReasoningReference(evidence, reference);
  return reference;
}

export function resolveKpReasoningReference(
  evidence: KpReasoningEvidence, reference: KpReasoningReference
) {
  requireKpReasoningEvidence(evidence);
  if (typeof reference !== "object" || reference === null
    || reference.sourceId !== evidence.source.id || reference.revisionId !== evidence.revisionId) {
    throw new KpReasoningRepairGap("kp.reasoning.stale-reference", "$.reference",
      "Resolve against the exact source revision or explicitly rebuild the extraction.");
  }
  if (reference.timelineAuthority !== "none") throw new KpReasoningRepairGap(
    "kp.reasoning.reference-authority", "$.reference.timelineAuthority", "References cannot own playback.");
  const candidates = [
    ...evidence.states.map(value => ({ kind: "state" as const, id: value.stateId, value })),
    ...evidence.steps.map(value => ({ kind: "operation" as const, id: value.id, value })),
    ...evidence.definitions.map(value => ({ kind: "definition" as const, id: value.id, value })),
    ...evidence.assumptions.map(value => ({ kind: "assumption" as const, id: value.id, value }))
  ].filter(candidate => candidate.kind === reference.kind && candidate.id === reference.id);
  if (candidates.length !== 1) throw new KpReasoningRepairGap(
    "kp.reasoning.reference-gap", "$.reference.id",
    "Select one exact semantic ID of the declared kind; labels and partial names are not bindings.");
  return Object.freeze(candidates[0]!);
}

export function bindKpReasoningLocalReferences(evidence: KpReasoningEvidence) {
  requireKpReasoningEvidence(evidence);
  return Object.freeze({
    parentSource: pinKpReasoningReference(evidence, "state", evidence.source.parent.sourceStateId),
    parentTarget: pinKpReasoningReference(evidence, "state", evidence.source.parent.targetStateId),
    operations: Object.freeze(evidence.steps.map(step => pinKpReasoningReference(evidence, "operation", step.id))),
    definitions: Object.freeze(evidence.definitions.map(item => pinKpReasoningReference(evidence, "definition", item.id))),
    assumptions: Object.freeze(evidence.assumptions.map(item => pinKpReasoningReference(evidence, "assumption", item.id)))
  });
}
