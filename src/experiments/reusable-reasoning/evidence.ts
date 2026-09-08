import { sha256 } from "../../kernel/sha256.ts";
import { createKpLawfulFractionSolveMacro } from "../../semantic/fraction-solve-macro.ts";
import { createKpStructuredEquationEndpointSpec } from "../../semantic/structured-equation-endpoint-spec.ts";
import type { KpExplanationVerifiedClaimAuthorityV1 } from "../../tutorial/explanation-spine-v1.ts";
import { readKpReasoningSource, KpReasoningRepairGap } from "./source.ts";

// Local capability membership prevents a serialized proof label or digest from
// becoming authority. This holds no semantic history and entries are collectible.
const issued = new WeakSet<object>();

export function bindKpReasoningEvidence(value: unknown) {
  const source = readKpReasoningSource(value);
  const trace = createKpLawfulFractionSolveMacro();
  const revisionId = `sha256:${sha256(JSON.stringify({ source, trace }))}`;
  const states = Object.freeze(trace.states.map(createKpStructuredEquationEndpointSpec));
  const stateIds = new Set(states.map(state => state.stateId));
  for (const key of ["sourceStateId", "targetStateId"] as const) {
    if (!stateIds.has(source.parent[key])) throw new KpReasoningRepairGap(
      "kp.reasoning.unknown-state", `$.parent.${key}`, "Select a state in the canonical verified fraction trace.");
  }
  const steps = Object.freeze(source.reason.operationIds.map((id, index) => {
    const step = trace.steps.find(candidate => candidate.id === id);
    if (!step) throw new KpReasoningRepairGap("kp.reasoning.unknown-operation",
      `$.reason.operationIds[${index}]`, "Select an existing verified operation; prose and identifiers do not mint evidence.");
    return step;
  }));
  const fanOut = trace.composition.normalization.fanOut.verification;
  if (fanOut.denominatorValue === 0) throw new KpReasoningRepairGap(
    "kp.reasoning.denominator", "$.reason", "The fraction verifier must supply a nonzero denominator.");
  const assumptions = Object.freeze([
    Object.freeze({ id: "assumption.real-scalar-x", kind: "domain-assumption" as const,
      statement: "This example interprets x as a real scalar.", subjectIds: Object.freeze([trace.states[0]!.id]) }),
    Object.freeze({ id: "assumption.nonzero-denominator", kind: "verified-condition" as const,
      statement: `The denominator ${fanOut.denominatorValue} is nonzero.`,
      subjectIds: Object.freeze([...fanOut.denominatorIds]) })
  ]);
  const definitions = Object.freeze([
    Object.freeze({ id: fanOut.commonFactorId, label: "Common factor",
      description: "The same scalar factor multiplies each addend.", evidenceId: fanOut.lawId }),
    Object.freeze({ id: trace.composition.id, label: "Normalized distributed sum",
      description: "Normalization preserves the order and identity of the two branches.",
      evidenceId: trace.composition.verification.schemaVersion })
  ]);
  // Reuse the claim record, not the closed subtract/divide explanation grammar.
  // Only this constructor binds provider-verified labels to the executed trace.
  const claimAuthority: KpExplanationVerifiedClaimAuthorityV1 = Object.freeze({
    schemaVersion: "kp.explanation-verified-claim-authority.v1",
    instanceId: revisionId,
    claims: Object.freeze([
      ...states.map(state => Object.freeze({
        id: `claim.${state.stateId}`, instanceId: revisionId, kind: "equation-frame" as const,
        sourceRefId: state.stateId, verification: "provider-verified" as const
      })),
      ...steps.map(step => Object.freeze({
        id: `claim.${step.id}`, instanceId: revisionId, kind: "equivalence-operation" as const,
        sourceRefId: step.id, verification: "provider-verified" as const
      }))
    ])
  });
  const evidence = Object.freeze({
    source, revisionId, traceId: trace.id, states, steps, assumptions, definitions, claimAuthority,
    distribution: trace.composition.normalization.fanOut,
    editorial: Object.freeze({
      status: "editorial" as const, parent: source.parent.statement,
      reason: source.reason.explanation, compact: source.compact
    })
  });
  freezeKpReasoningOwnedProjection(evidence);
  issued.add(evidence);
  return evidence;
}

export type KpReasoningEvidence = ReturnType<typeof bindKpReasoningEvidence>;

// Endpoint specs freeze their containers, not every segment. This constructor
// owns these projections; freeze descendants before issuing the capability.
export function freezeKpReasoningOwnedProjection(value: unknown): void {
  if (typeof value !== "object" || value === null) return;
  Object.values(value).forEach(freezeKpReasoningOwnedProjection);
  Object.freeze(value);
}

export function requireKpReasoningEvidence(evidence: KpReasoningEvidence): void {
  if (!issued.has(evidence)) throw new KpReasoningRepairGap(
    "kp.reasoning.evidence-capability", "$.evidence",
    "Bind the source through the trusted fraction constructor; copied proof records are not authority.");
}
