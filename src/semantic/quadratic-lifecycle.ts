import type { KpQuadraticMethodConvergence } from "./quadratic-method-convergence.ts";
import type { KpQuadraticPlusMinusBranchSet } from "./quadratic-plus-minus-branches.ts";
import type {
  KpQuadraticMethodId,
  KpQuadraticSolutionMethodGraph
} from "./quadratic-solution-method-graph.ts";

export interface KpQuadraticEntityLifecycle {
  readonly entityId: string;
  readonly authorityRef: string;
  readonly scope: "shared" | KpQuadraticMethodId;
  readonly introducedAt: readonly string[];
  readonly removedAt: readonly string[];
}

export interface KpQuadraticSemanticFrame {
  readonly checkpointId: string;
  readonly visibleEntityIds: readonly string[];
}

export interface KpQuadraticLifecyclePath {
  readonly methodId: KpQuadraticMethodId;
  readonly frames: readonly KpQuadraticSemanticFrame[];
}

export interface KpQuadraticLifecycleContract {
  readonly schemaVersion: "kp.quadratic-lifecycle.v1";
  readonly id: "lifecycle.quadratic.canonical";
  readonly lifecycles: readonly KpQuadraticEntityLifecycle[];
  readonly paths: readonly KpQuadraticLifecyclePath[];
}

export interface KpQuadraticLifecycleSample {
  readonly methodId: KpQuadraticMethodId;
  readonly semanticProgress: number;
  readonly frameIndex: number;
  readonly checkpointId: string;
  readonly visibleEntityIds: readonly string[];
}

export interface KpQuadraticLifecycleDiagnostic {
  readonly code:
    | "duplicate-lifecycle"
    | "missing-lifecycle"
    | "missing-correspondence"
    | "path-endpoint"
    | "branch-closure"
    | "reconstruction";
  readonly path: string;
  readonly message: string;
}

export function createCanonicalKpQuadraticLifecycle(input: {
  readonly graph: KpQuadraticSolutionMethodGraph;
  readonly branchSets: readonly KpQuadraticPlusMinusBranchSet[];
  readonly convergence: KpQuadraticMethodConvergence;
}): KpQuadraticLifecycleContract {
  const source = input.graph.nodes.find(({ id }) => id === input.graph.sourceNodeId)!;
  const target = input.graph.nodes.find(({ id }) => id === input.graph.targetNodeId)!;
  const lifecycles: KpQuadraticEntityLifecycle[] = [
    lifecycle(source.id, source.authorityRef, "shared", ["initial"], ["method-start"]),
    lifecycle(target.id, target.authorityRef, "shared", ["reunion"], [])
  ];
  input.graph.nodes
    .filter(({ kind }) => kind === "method-state")
    .forEach((node) => lifecycles.push(
      lifecycle(node.id, node.authorityRef, node.ownerMethodId!, ["incoming-edge"], ["outgoing-edge"])
    ));
  input.branchSets.forEach((branchSet) => {
    branchSet.branches.forEach((branch) => lifecycles.push(
      lifecycle(branch.id, branch.rootMemberId, branchSet.methodId, [branchSet.split.id], [`reunion.${branchSet.methodId}`])
    ));
  });
  input.convergence.reunions.forEach((reunion) => lifecycles.push(
    lifecycle(
      `entity.${reunion.rootMemberId}`,
      reunion.rootMemberId,
      "shared",
      reunion.contributions.map(({ branchId }) => branchId),
      []
    )
  ));
  const paths = Object.freeze(input.graph.paths.map((path) => {
    const branchSet = input.branchSets.find(({ methodId }) => methodId === path.id)!;
    const intermediateNodeIds = path.edgeIds.slice(0, -1).map((edgeId) =>
      input.graph.edges.find(({ id }) => id === edgeId)!.targetNodeId
    );
    const rootEntityIds = input.convergence.reunions.map(
      ({ rootMemberId }) => `entity.${rootMemberId}`
    );
    return Object.freeze({
      methodId: path.id,
      frames: Object.freeze([
        frame("initial", [input.graph.sourceNodeId]),
        ...intermediateNodeIds.map((nodeId, index) =>
          frame(`method.${path.id}.${index + 1}`, [nodeId])
        ),
        frame(branchSet.split.id, branchSet.branches.map(({ id }) => id)),
        frame(`reunion.${path.id}`, [...rootEntityIds, input.graph.targetNodeId])
      ])
    });
  }));
  const contract = Object.freeze({
    schemaVersion: "kp.quadratic-lifecycle.v1" as const,
    id: "lifecycle.quadratic.canonical" as const,
    lifecycles: Object.freeze(lifecycles),
    paths
  });
  const diagnostics = validateKpQuadraticLifecycle(contract);
  if (diagnostics.length > 0) {
    throw new Error(diagnostics.map((issue) => issue.message).join(" "));
  }
  return contract;
}

export function sampleKpQuadraticLifecycle(input: {
  readonly contract: KpQuadraticLifecycleContract;
  readonly methodId: KpQuadraticMethodId;
  readonly progress: number;
  readonly direction?: "forward" | "rewind";
}): KpQuadraticLifecycleSample {
  if (!Number.isFinite(input.progress) || input.progress < 0 || input.progress > 1) {
    throw new Error("Quadratic lifecycle progress must be between zero and one.");
  }
  const path = input.contract.paths.find(({ methodId }) => methodId === input.methodId);
  if (path === undefined) throw new Error(`Unknown quadratic lifecycle method ${input.methodId}.`);
  const semanticProgress = normalizeProgress(
    input.direction === "rewind" ? 1 - input.progress : input.progress
  );
  const frameIndex = Math.min(
    path.frames.length - 1,
    Math.floor(semanticProgress * path.frames.length)
  );
  const selected = path.frames[frameIndex]!;
  return Object.freeze({
    methodId: input.methodId,
    semanticProgress,
    frameIndex,
    checkpointId: selected.checkpointId,
    visibleEntityIds: selected.visibleEntityIds
  });
}

export function validateKpQuadraticLifecycle(
  contract: KpQuadraticLifecycleContract
): readonly KpQuadraticLifecycleDiagnostic[] {
  const diagnostics: KpQuadraticLifecycleDiagnostic[] = [];
  const lifecycleIds = contract.lifecycles.map(({ entityId }) => entityId);
  const uniqueLifecycleIds = new Set(lifecycleIds);
  if (uniqueLifecycleIds.size !== lifecycleIds.length) {
    diagnostics.push(issue("duplicate-lifecycle", "lifecycles", "Each visible semantic entity must have exactly one lifecycle."));
  }
  contract.lifecycles.forEach((lifecycle, index) => {
    if (lifecycle.authorityRef.trim().length === 0) {
      diagnostics.push(issue("missing-correspondence", `lifecycles[${index}].authorityRef`, `Lifecycle ${lifecycle.entityId} lacks semantic correspondence.`));
    }
  });
  const visibleIds = new Set(contract.paths.flatMap(({ frames }) =>
    frames.flatMap(({ visibleEntityIds }) => visibleEntityIds)
  ));
  visibleIds.forEach((entityId) => {
    if (!uniqueLifecycleIds.has(entityId)) {
      diagnostics.push(issue("missing-lifecycle", "paths.frames", `Visible entity ${entityId} has no lifecycle.`));
    }
  });
  uniqueLifecycleIds.forEach((entityId) => {
    if (!visibleIds.has(entityId)) {
      diagnostics.push(issue("missing-lifecycle", "lifecycles", `Lifecycle entity ${entityId} is never visible.`));
    }
  });
  contract.paths.forEach((path, index) => {
    const first = path.frames[0];
    const last = path.frames.at(-1);
    if (
      first?.checkpointId !== "initial" ||
      last === undefined ||
      !last.checkpointId.startsWith("reunion.") ||
      last.visibleEntityIds.length < 3
    ) {
      diagnostics.push(issue("path-endpoint", `paths[${index}]`, `Lifecycle path ${path.methodId} lacks exact source or reunion settlement.`));
    }
    const branchFrame = path.frames.find(({ checkpointId }) => checkpointId.startsWith("split."));
    if (branchFrame?.visibleEntityIds.length !== 2) {
      diagnostics.push(issue("branch-closure", `paths[${index}]`, `Lifecycle path ${path.methodId} must expose exactly two branches before reunion.`));
    }
    if (new Set(path.frames.map(({ checkpointId }) => checkpointId)).size !== path.frames.length) {
      diagnostics.push(issue("reconstruction", `paths[${index}].frames`, `Lifecycle path ${path.methodId} cannot be reconstructed from unique checkpoints.`));
    }
  });
  return Object.freeze(diagnostics);
}

function normalizeProgress(value: number): number {
  return Math.round(value * 1_000_000_000_000) / 1_000_000_000_000;
}

function lifecycle(
  entityId: string,
  authorityRef: string,
  scope: KpQuadraticEntityLifecycle["scope"],
  introducedAt: readonly string[],
  removedAt: readonly string[]
): KpQuadraticEntityLifecycle {
  return Object.freeze({
    entityId,
    authorityRef,
    scope,
    introducedAt: Object.freeze([...introducedAt]),
    removedAt: Object.freeze([...removedAt])
  });
}

function frame(
  checkpointId: string,
  visibleEntityIds: readonly string[]
): KpQuadraticSemanticFrame {
  return Object.freeze({
    checkpointId,
    visibleEntityIds: Object.freeze([...visibleEntityIds])
  });
}

function issue(
  code: KpQuadraticLifecycleDiagnostic["code"],
  path: string,
  message: string
): KpQuadraticLifecycleDiagnostic {
  return Object.freeze({ code, path, message });
}
