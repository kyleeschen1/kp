import type {
  KpEquationSurfaceAuthorityGraph,
  KpEquationSurfaceAuthorityNode
} from "./equation-surface-authority-graph.ts";
import type {
  KpExactEquationReachabilityGraph
} from "./exact-equation-reachability-graph.ts";

export type KpGenericEquationPathStatus =
  | "live-canonical"
  | "live-compatibility"
  | "diagnostic-only"
  | "unreachable";

export interface KpGenericEquationFallbackAuditEntry {
  readonly nodeId: string;
  readonly sourcePath: `src/${string}.ts`;
  readonly status: KpGenericEquationPathStatus;
  readonly surfaceAnimationIds: readonly string[];
  readonly sourceCallers: readonly string[];
  readonly testCallers: readonly string[];
  readonly scriptCallers: readonly string[];
  readonly replacementOwnerNodeIds: readonly string[];
  readonly retirementDecision: "retain-live" | "candidate-after-replacement";
  readonly retirementCondition: string;
}

export interface KpGenericEquationFallbackAudit {
  readonly schemaVersion: "kp.generic-equation-fallback-audit.v1";
  readonly kind: "generic-equation-fallback-audit";
  readonly entries: readonly KpGenericEquationFallbackAuditEntry[];
}

export class KpGenericEquationFallbackAuditError extends Error {
  override readonly name = "KpGenericEquationFallbackAuditError";
  readonly diagnostics: readonly string[];

  constructor(diagnostics: readonly string[]) {
    super(diagnostics.join("\n"));
    this.diagnostics = diagnostics;
  }
}

const auditedNodeIds = Object.freeze([
  "motif.generic-transition",
  "timing.generic-phase-easing",
  "renderer.generic-dom-measurement",
  "fallback.generic-whole-equation",
  "sampler.generic-semantic-token",
  "fallback.operation-failed-stage",
  "fallback.log-exponent-failed-stage",
  "fallback.log-quotient-failed-stage",
  "fallback.log-product-failed-stage"
]);

const replacementOwners: Readonly<Record<string, readonly string[]>> =
Object.freeze({
  "motif.generic-transition": Object.freeze([
    "motif.operation-evaluation-material",
    "motif.log-exponent-symbol-motion",
    "motif.log-quotient-homomorphic-fusion",
    "motif.log-product-semantic-projection"
  ]),
  "timing.generic-phase-easing": Object.freeze([
    "timing.operation-endpoint-dwell",
    "timing.copy-fan-out-presentation-profile",
    "timing.cancellation-counter-orbit",
    "timing.semantic-motion-recipe-schedule"
  ]),
  "renderer.generic-dom-measurement": Object.freeze([
    "renderer.operation-measured-compositor",
    "renderer.log-exponent-transit",
    "renderer.log-quotient-transit",
    "renderer.log-product-transit"
  ]),
  "fallback.generic-whole-equation": Object.freeze([
    "fallback.operation-failed-stage",
    "fallback.log-exponent-failed-stage",
    "fallback.log-quotient-failed-stage",
    "fallback.log-product-failed-stage"
  ]),
  "sampler.generic-semantic-token": Object.freeze([
    "sampler.operation-native-scene",
    "sampler.semantic-motion-choreography"
  ])
});

export function compileKpGenericEquationFallbackAudit(input: {
  readonly authority: KpEquationSurfaceAuthorityGraph;
  readonly reachability: KpExactEquationReachabilityGraph;
}): KpGenericEquationFallbackAudit {
  const diagnostics: string[] = [];
  const nodeById = new Map(input.authority.nodes.map((node) => [node.id, node]));
  const entries = auditedNodeIds.flatMap((nodeId) => {
    const node = nodeById.get(nodeId);
    if (node === undefined) {
      diagnostics.push(`Missing audited equation path ${nodeId}.`);
      return [];
    }
    const roots = input.reachability.roots.filter((root) =>
      root.authorityId === node.id && root.sourcePath === node.sourcePath
    );
    if (roots.length !== 1) {
      diagnostics.push(
        `Audited equation path ${nodeId} requires exactly one reachability root; received ${roots.length}.`
      );
      return [];
    }
    const reachability = roots[0]!;
    const surfaceAnimationIds = input.authority.rows
      .filter((row) => rowReferencesNode(row, nodeId))
      .map(({ animationId }) => animationId)
      .sort();
    if (surfaceAnimationIds.length === 0) {
      diagnostics.push(`Audited equation path ${nodeId} owns no equation surface.`);
    }
    const status = classify(node, reachability.reachability);
    return [Object.freeze({
      nodeId,
      sourcePath: node.sourcePath,
      status,
      surfaceAnimationIds: Object.freeze(surfaceAnimationIds),
      sourceCallers: reachability.sourceCallers,
      testCallers: reachability.testCallers,
      scriptCallers: reachability.scriptCallers,
      replacementOwnerNodeIds: replacementOwners[nodeId] ?? Object.freeze([nodeId]),
      retirementDecision: status === "unreachable"
        ? "candidate-after-replacement" as const
        : "retain-live" as const,
      retirementCondition: status === "live-compatibility"
        ? "All named surfaces must migrate to a listed canonical owner, then exact source, route, conformance, endpoint, and bundle callers must reach zero."
        : "Retain as explicit fail-closed behavior while its named specialized surfaces remain live."
    })];
  });
  const unknownReplacementIds = entries.flatMap(({ replacementOwnerNodeIds }) =>
    replacementOwnerNodeIds.filter((id) => !nodeById.has(id))
  );
  unknownReplacementIds.forEach((id) => diagnostics.push(
    `Unknown fallback replacement owner ${id}.`
  ));
  if (diagnostics.length > 0) {
    throw new KpGenericEquationFallbackAuditError(Object.freeze(diagnostics));
  }
  return Object.freeze({
    schemaVersion: "kp.generic-equation-fallback-audit.v1" as const,
    kind: "generic-equation-fallback-audit" as const,
    entries: Object.freeze(entries)
  });
}

function classify(
  node: KpEquationSurfaceAuthorityNode,
  reachability: "live-callers" | "no-observed-caller"
): KpGenericEquationPathStatus {
  if (reachability === "no-observed-caller") return "unreachable";
  if (node.authority === "canonical") return "live-canonical";
  return "live-compatibility";
}

function rowReferencesNode(
  row: KpEquationSurfaceAuthorityGraph["rows"][number],
  nodeId: string
): boolean {
  return [
    ...row.motifNodeIds,
    ...row.localTimingNodeIds,
    ...row.rendererInferenceNodeIds,
    ...row.fallbackNodeIds,
    ...row.directSamplerNodeIds
  ].includes(nodeId);
}
