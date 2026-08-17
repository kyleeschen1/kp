export const kpHomomorphicCausalPhaseIds = Object.freeze({
  orient: "phase.homomorphic.orient",
  releaseSourceSyntax: "phase.homomorphic.release-source-syntax",
  transferPayload: "phase.homomorphic.transfer-payload",
  receiveTargetApplications:
    "phase.homomorphic.receive-target-applications",
  resolveTargetConnector: "phase.homomorphic.resolve-target-connector",
  settleTarget: "phase.homomorphic.settle-target",
  yieldNativeTarget: "phase.homomorphic.yield-native-target"
} as const);

export type KpHomomorphicCausalPhaseId =
  typeof kpHomomorphicCausalPhaseIds[
    keyof typeof kpHomomorphicCausalPhaseIds
  ];

export type KpHomomorphicCausalResponsibility =
  | "establish-law-and-application-lineage"
  | "retire-source-operator-enclosures-and-connector"
  | "preserve-ordered-payload-identity"
  | "receive-derived-operator-applications"
  | "derive-target-connector-without-glyph-identity"
  | "settle-complete-target-structure"
  | "transfer-ownership-to-native-target";

export type KpHomomorphicCausalInvariant =
  | "payload-semantic-identity-persists"
  | "application-lineage-does-not-imply-occurrence-identity"
  | "connector-derivation-does-not-imply-glyph-identity"
  | "native-target-owns-settlement"
  | "presentation-policy-remains-caller-local";

export interface KpHomomorphicCausalPhase {
  readonly id: KpHomomorphicCausalPhaseId;
  readonly responsibility: KpHomomorphicCausalResponsibility;
  readonly summary: string;
}

export interface KpHomomorphicCausalPhaseEdge {
  readonly beforePhaseId: KpHomomorphicCausalPhaseId;
  readonly afterPhaseId: KpHomomorphicCausalPhaseId;
}

export interface KpHomomorphicCausalPhaseGrammar {
  readonly schemaVersion: "kp.homomorphic-causal-phase-grammar.v1";
  readonly kind: "homomorphic-causal-phase-grammar";
  readonly id: "grammar.equation.homomorphic-crossover.v1";
  readonly phases: readonly KpHomomorphicCausalPhase[];
  readonly edges: readonly KpHomomorphicCausalPhaseEdge[];
  readonly invariants: readonly KpHomomorphicCausalInvariant[];
}

const phases = Object.freeze([
  phase(
    kpHomomorphicCausalPhaseIds.orient,
    "establish-law-and-application-lineage",
    "Establish which operator applications and law govern the crossover."
  ),
  phase(
    kpHomomorphicCausalPhaseIds.releaseSourceSyntax,
    "retire-source-operator-enclosures-and-connector",
    "Release source-only syntax before continuants enter the crossover."
  ),
  phase(
    kpHomomorphicCausalPhaseIds.transferPayload,
    "preserve-ordered-payload-identity",
    "Transfer semantic payloads while preserving their authored order and identity."
  ),
  phase(
    kpHomomorphicCausalPhaseIds.receiveTargetApplications,
    "receive-derived-operator-applications",
    "Receive the target operator applications through their canonical motif."
  ),
  phase(
    kpHomomorphicCausalPhaseIds.resolveTargetConnector,
    "derive-target-connector-without-glyph-identity",
    "Resolve the target connector as a consequence of the law, not as a persistent glyph."
  ),
  phase(
    kpHomomorphicCausalPhaseIds.settleTarget,
    "settle-complete-target-structure",
    "Settle only after target applications and transformed connector are complete."
  ),
  phase(
    kpHomomorphicCausalPhaseIds.yieldNativeTarget,
    "transfer-ownership-to-native-target",
    "Yield paint ownership to the exact native target."
  )
] as const);

const edges = Object.freeze([
  edge(
    kpHomomorphicCausalPhaseIds.orient,
    kpHomomorphicCausalPhaseIds.releaseSourceSyntax
  ),
  edge(
    kpHomomorphicCausalPhaseIds.releaseSourceSyntax,
    kpHomomorphicCausalPhaseIds.transferPayload
  ),
  edge(
    kpHomomorphicCausalPhaseIds.transferPayload,
    kpHomomorphicCausalPhaseIds.receiveTargetApplications
  ),
  edge(
    kpHomomorphicCausalPhaseIds.transferPayload,
    kpHomomorphicCausalPhaseIds.resolveTargetConnector
  ),
  edge(
    kpHomomorphicCausalPhaseIds.receiveTargetApplications,
    kpHomomorphicCausalPhaseIds.settleTarget
  ),
  edge(
    kpHomomorphicCausalPhaseIds.resolveTargetConnector,
    kpHomomorphicCausalPhaseIds.settleTarget
  ),
  edge(
    kpHomomorphicCausalPhaseIds.settleTarget,
    kpHomomorphicCausalPhaseIds.yieldNativeTarget
  )
] as const);

/**
 * This grammar owns causal meaning only. Callers retain all sampling,
 * geometry, topology, cardinality, and perceptual policy so sharing the law
 * cannot silently retime an approved animation.
 */
export const kpCanonicalHomomorphicCausalPhaseGrammar =
  defineKpHomomorphicCausalPhaseGrammar({
    schemaVersion: "kp.homomorphic-causal-phase-grammar.v1",
    kind: "homomorphic-causal-phase-grammar",
    id: "grammar.equation.homomorphic-crossover.v1",
    phases,
    edges,
    invariants: [
      "payload-semantic-identity-persists",
      "application-lineage-does-not-imply-occurrence-identity",
      "connector-derivation-does-not-imply-glyph-identity",
      "native-target-owns-settlement",
      "presentation-policy-remains-caller-local"
    ]
  });

export function defineKpHomomorphicCausalPhaseGrammar(
  input: KpHomomorphicCausalPhaseGrammar
): KpHomomorphicCausalPhaseGrammar {
  const expectedIds = Object.values(kpHomomorphicCausalPhaseIds);
  const phaseIds = input.phases.map(({ id }) => id);
  if (
    phaseIds.length !== expectedIds.length ||
    new Set(phaseIds).size !== phaseIds.length ||
    expectedIds.some((id) => !phaseIds.includes(id))
  ) {
    throw new Error(
      "Homomorphic causal grammar requires every canonical phase exactly once."
    );
  }
  const responsibilityIds = input.phases.map(({ responsibility }) =>
    responsibility
  );
  if (new Set(responsibilityIds).size !== responsibilityIds.length) {
    throw new Error(
      "Homomorphic causal phases require distinct semantic responsibilities."
    );
  }
  const known = new Set(phaseIds);
  const edgeIds = new Set<string>();
  for (const value of input.edges) {
    if (
      !known.has(value.beforePhaseId) ||
      !known.has(value.afterPhaseId) ||
      value.beforePhaseId === value.afterPhaseId
    ) {
      throw new Error("Homomorphic causal precedence references invalid phases.");
    }
    const id = `${value.beforePhaseId}\u0000${value.afterPhaseId}`;
    if (edgeIds.has(id)) {
      throw new Error("Homomorphic causal precedence contains a duplicate edge.");
    }
    edgeIds.add(id);
  }
  assertAcyclic(phaseIds, input.edges);
  return Object.freeze({
    schemaVersion: input.schemaVersion,
    kind: input.kind,
    id: input.id,
    phases: Object.freeze(input.phases.map((value) =>
      Object.freeze({ ...value })
    )),
    edges: Object.freeze(input.edges.map((value) =>
      Object.freeze({ ...value })
    )),
    invariants: Object.freeze([...input.invariants])
  });
}

function phase(
  id: KpHomomorphicCausalPhaseId,
  responsibility: KpHomomorphicCausalResponsibility,
  summary: string
): KpHomomorphicCausalPhase {
  return Object.freeze({ id, responsibility, summary });
}

function edge(
  beforePhaseId: KpHomomorphicCausalPhaseId,
  afterPhaseId: KpHomomorphicCausalPhaseId
): KpHomomorphicCausalPhaseEdge {
  return Object.freeze({ beforePhaseId, afterPhaseId });
}

function assertAcyclic(
  phaseIds: readonly KpHomomorphicCausalPhaseId[],
  phaseEdges: readonly KpHomomorphicCausalPhaseEdge[]
): void {
  const incoming = new Map(phaseIds.map((id) => [id, 0]));
  const outgoing = new Map(phaseIds.map((id) => [
    id,
    [] as KpHomomorphicCausalPhaseId[]
  ]));
  phaseEdges.forEach(({ beforePhaseId, afterPhaseId }) => {
    incoming.set(afterPhaseId, incoming.get(afterPhaseId)! + 1);
    outgoing.get(beforePhaseId)!.push(afterPhaseId);
  });
  const ready = phaseIds.filter((id) => incoming.get(id) === 0);
  let visited = 0;
  while (ready.length > 0) {
    const id = ready.shift()!;
    visited += 1;
    outgoing.get(id)!.forEach((targetId) => {
      incoming.set(targetId, incoming.get(targetId)! - 1);
      if (incoming.get(targetId) === 0) ready.push(targetId);
    });
  }
  if (visited !== phaseIds.length) {
    throw new Error("Homomorphic causal precedence must be acyclic.");
  }
}
