import type {
  KpSemanticStateGroupDescriptor,
  KpSemanticStateMemberMap
} from "./authoring-schema.ts";
import type { KpSemanticStateHandleSet } from
  "./authoring-state-handles.ts";
import {
  encodeKpSemanticStateCompositionLogicalAddress,
  type KpInTransitionSemanticStateCompositionAddress,
  type KpSemanticStateCompositionLogicalAddress
} from "./state-family-composition-address.ts";
import {
  createKpSemanticStateCompositionCohortResolver,
  type KpSemanticStateCompositionCohortResolution
} from "./state-family-composition-cohort-resolver.ts";
import type {
  KpSemanticStateCompositionNodeDeclaration
} from "./state-family-composition-declaration.ts";
import type {
  KpSemanticStateCompositionEndpointChain
} from "./state-family-composition-endpoints.ts";
import type {
  KpSemanticStateCompositionHandleSet
} from "./state-family-composition-handles.ts";
import {
  createKpSemanticStateCompositionMemberTransitionResolver,
  type KpSemanticStateCompositionMemberEvaluatorBinding,
  type KpSemanticStateCompositionMemberTransitionResolution
} from "./state-family-composition-member-resolver.ts";
import {
  createKpSettledSemanticStateCompositionResolver,
  type KpSettledSemanticStateCompositionResolution
} from "./state-family-composition-settled-resolver.ts";

export type KpSemanticStateCompositionEvaluation<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> = KpSettledSemanticStateCompositionResolution<Root> |
  KpSemanticStateCompositionMemberTransitionResolution<Root> |
  KpSemanticStateCompositionCohortResolution<Root>;

export interface KpSemanticStateCompositionEvaluator<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion: "kp.semantic-state-composition-evaluator.v1";
  readonly kind: "semantic-state-composition-evaluator";
  readonly compositionId:
    KpSemanticStateCompositionEndpointChain<Root>["composition"]["id"];
  resolveAddress(
    address: KpSemanticStateCompositionLogicalAddress
  ): KpSemanticStateCompositionEvaluation<Root>;
  inspect(): KpSemanticStateCompositionEvaluatorStats;
  reset(): void;
  dispose(): void;
}

export interface KpSemanticStateCompositionEvaluatorStats {
  readonly schemaVersion:
    "kp.semantic-state-composition-evaluator-stats.v1";
  readonly kind: "semantic-state-composition-evaluator-stats";
  readonly status: "active" | "disposed";
  readonly capacity: number;
  readonly entries: number;
  readonly hits: number;
  readonly misses: number;
}

export type KpSemanticStateCompositionEvaluatorErrorCode =
  | "composition-evaluator-disposed"
  | "invalid-composition-evaluator-cache-capacity"
  | "unexpected-composition-evaluator-binding";

export class KpSemanticStateCompositionEvaluatorError extends Error {
  readonly code: KpSemanticStateCompositionEvaluatorErrorCode;

  constructor(
    code: KpSemanticStateCompositionEvaluatorErrorCode,
    message: string
  ) {
    super(message);
    this.name = "KpSemanticStateCompositionEvaluatorError";
    this.code = code;
  }
}

/**
 * The aggregate cache is caller-owned acceleration over canonical address
 * resolution. It never becomes snapshot history or changes the isolated
 * zero-capacity evaluators that supply member samples.
 */
export function createKpSemanticStateCompositionEvaluator<
  const Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  const DeclarationRoot extends KpSemanticStateCompositionNodeDeclaration
>(input: {
  readonly chain: KpSemanticStateCompositionEndpointChain<Root>;
  readonly compositionHandles:
    KpSemanticStateCompositionHandleSet<DeclarationRoot>;
  readonly stateHandles: KpSemanticStateHandleSet<Root>;
  readonly bindings:
    readonly KpSemanticStateCompositionMemberEvaluatorBinding<Root>[];
  readonly cacheCapacity?: number;
}): KpSemanticStateCompositionEvaluator<Root> {
  const capacity = requireCacheCapacity(input.cacheCapacity ?? 0);
  const memberKinds = indexMemberKinds(input.chain);
  const orderedBindings: KpSemanticStateCompositionMemberEvaluatorBinding<Root>[] = [];
  const cohortBindings: KpSemanticStateCompositionMemberEvaluatorBinding<Root>[] = [];
  for (const binding of input.bindings) {
    const memberKind = memberKinds.get(binding.memberId);
    if (memberKind === "ordered") orderedBindings.push(binding);
    else if (memberKind === "independent") cohortBindings.push(binding);
    else {
      fail(
        "unexpected-composition-evaluator-binding",
        `Evaluator binding ${JSON.stringify(binding.memberId)} does not belong to composition ${JSON.stringify(input.chain.composition.id)}.`
      );
    }
  }

  const settledResolver = createKpSettledSemanticStateCompositionResolver({
    chain: input.chain,
    compositionHandles: input.compositionHandles,
    stateHandles: input.stateHandles
  });
  const memberResolver =
    createKpSemanticStateCompositionMemberTransitionResolver({
      chain: input.chain,
      handles: input.compositionHandles,
      bindings: orderedBindings
    });
  const cohortResolver = createKpSemanticStateCompositionCohortResolver({
    chain: input.chain,
    handles: input.compositionHandles,
    bindings: cohortBindings
  });
  const endpointFingerprints = indexTransitionEndpointFingerprints(
    input.chain,
    input.compositionHandles
  );
  const cache = new Map<
    string,
    KpSemanticStateCompositionMemberTransitionResolution<Root> |
      KpSemanticStateCompositionCohortResolution<Root>
  >();
  let hits = 0;
  let misses = 0;
  let disposed = false;

  return Object.freeze({
    schemaVersion: "kp.semantic-state-composition-evaluator.v1",
    kind: "semantic-state-composition-evaluator",
    compositionId: input.chain.composition.id,
    resolveAddress(address: KpSemanticStateCompositionLogicalAddress) {
      assertActive(disposed);
      // Persistent endpoints already have retained identity and do not need a
      // cache entry to remain directly recoverable.
      if (address.kind === "settled") {
        return settledResolver.resolveAddress(address);
      }
      const key = createCacheKey(address, endpointFingerprints);
      const cached = cache.get(key);
      if (cached !== undefined) {
        hits += 1;
        cache.delete(key);
        cache.set(key, cached);
        return cached;
      }
      misses += 1;
      const resolution = address.target.kind ===
        "semantic-state-composition-member-handle"
        ? memberResolver.resolveAddress(address)
        : cohortResolver.resolveAddress(address);
      retainResolution(cache, key, resolution, capacity);
      return resolution;
    },
    inspect() {
      return Object.freeze({
        schemaVersion:
          "kp.semantic-state-composition-evaluator-stats.v1" as const,
        kind: "semantic-state-composition-evaluator-stats" as const,
        status: disposed ? "disposed" as const : "active" as const,
        capacity,
        entries: cache.size,
        hits,
        misses
      });
    },
    reset() {
      assertActive(disposed);
      cache.clear();
      hits = 0;
      misses = 0;
    },
    dispose() {
      if (disposed) return;
      cache.clear();
      disposed = true;
    }
  });
}

type KpCompositionMemberKind = "independent" | "ordered";

function indexMemberKinds<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(
  chain: KpSemanticStateCompositionEndpointChain<Root>
): ReadonlyMap<string, KpCompositionMemberKind> {
  const index = new Map<string, KpCompositionMemberKind>();
  for (const step of chain.composition.steps) {
    const kind = step.kind === "independent-step" ? "independent" : "ordered";
    for (const member of step.members) index.set(member.id, kind);
  }
  return index;
}

function indexTransitionEndpointFingerprints<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(
  chain: KpSemanticStateCompositionEndpointChain<Root>,
  handles: KpSemanticStateCompositionHandleSet
): ReadonlyMap<string, string> {
  const index = new Map<string, string>();
  for (const step of chain.composition.steps) {
    const members = step.members.map(member => {
      const applied = chain.applications.find(candidate =>
        candidate.stepIndex === step.stepIndex &&
        candidate.memberId === member.id
      );
      if (applied === undefined) {
        fail(
          "unexpected-composition-evaluator-binding",
          `Composition member ${JSON.stringify(member.id)} has no retained endpoint application.`
        );
      }
      return [
        member.id,
        applied.application.commit.before.id,
        applied.application.commit.after.id
      ] as const;
    });
    const fingerprint = JSON.stringify(members);
    for (const member of step.members) index.set(member.id, fingerprint);
    if (step.kind === "independent-step") {
      const handle = handles.groups.find(candidate =>
        candidate.nodeKind === "independent" &&
        candidate.path.length === step.path.length &&
        candidate.path.every((segment, ordinal) =>
          segment === step.path[ordinal]
        )
      );
      if (handle === undefined) {
        fail(
          "unexpected-composition-evaluator-binding",
          `Independent step ${step.stepIndex} has no generated evaluator handle.`
        );
      }
      index.set(handle.id, fingerprint);
    }
  }
  return index;
}

function createCacheKey(
  address: KpInTransitionSemanticStateCompositionAddress,
  endpointFingerprints: ReadonlyMap<string, string>
): string {
  const endpointFingerprint = endpointFingerprints.get(address.target.id) ??
    "unknown";
  return JSON.stringify([
    "kp.semantic-state-composition-evaluator-cache-key.v1",
    address.compositionId,
    encodeKpSemanticStateCompositionLogicalAddress(address),
    endpointFingerprint,
    address.progress
  ]);
}

function requireCacheCapacity(capacity: number): number {
  if (!Number.isSafeInteger(capacity) || capacity < 0) {
    fail(
      "invalid-composition-evaluator-cache-capacity",
      "Semantic state composition evaluator cache capacity must be a non-negative safe integer."
    );
  }
  return capacity;
}

function assertActive(disposed: boolean): void {
  if (disposed) {
    fail(
      "composition-evaluator-disposed",
      "A disposed semantic state composition evaluator cannot resolve or reset."
    );
  }
}

function retainResolution<Resolution>(
  cache: Map<string, Resolution>,
  key: string,
  resolution: Resolution,
  capacity: number
): void {
  if (capacity === 0) return;
  if (cache.size >= capacity) {
    const leastRecentlyUsed = cache.keys().next().value;
    if (leastRecentlyUsed !== undefined) cache.delete(leastRecentlyUsed);
  }
  cache.set(key, resolution);
}

function fail(
  code: KpSemanticStateCompositionEvaluatorErrorCode,
  message: string
): never {
  throw new KpSemanticStateCompositionEvaluatorError(code, message);
}
