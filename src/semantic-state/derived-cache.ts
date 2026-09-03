import type { KpAggregateSemanticSnapshot } from "./aggregate-snapshot.ts";
import type { KpDerivedSemanticStateLeafHandle } from
  "./authoring-state-handles.ts";
import {
  evaluateKpSemanticDerivedValueWithMemo,
  type KpSemanticDerivedEvaluationMemo
} from "./derived-evaluator.ts";
import {
  createKpSemanticDerivationFingerprint,
  type KpSemanticDerivationFingerprint
} from "./derived-fingerprint.ts";
import type { KpSemanticDerivedGraph } from "./derived-graph.ts";
import type { KpPersistentSemanticValue } from "./entity-version-store.ts";
import type { KpSemanticSlotId } from "./identity.ts";

export interface KpSemanticDerivedCacheStats {
  readonly schemaVersion: "kp.semantic-derived-cache-stats.v1";
  readonly kind: "semantic-derived-cache-stats";
  readonly status: "active" | "disposed";
  readonly entries: number;
  readonly hits: number;
  readonly misses: number;
}

export type KpSemanticDerivedCacheErrorCode =
  | "derived-cache-disposed"
  | "derived-cache-fingerprint-missing";

export class KpSemanticDerivedCacheError extends Error {
  readonly code: KpSemanticDerivedCacheErrorCode;

  constructor(code: KpSemanticDerivedCacheErrorCode, message: string) {
    super(message);
    this.name = "KpSemanticDerivedCacheError";
    this.code = code;
  }
}

export interface KpSemanticDerivedValueCache {
  readonly schemaVersion: "kp.semantic-derived-value-cache.v1";
  readonly kind: "semantic-derived-value-cache";
  evaluate<const Result>(input: {
    readonly graph: KpSemanticDerivedGraph;
    readonly snapshot: KpAggregateSemanticSnapshot;
    readonly target: KpDerivedSemanticStateLeafHandle<Result>;
  }): Result;
  inspect(): KpSemanticDerivedCacheStats;
  reset(): void;
  dispose(): void;
}

class KpSemanticDerivedValueCacheState implements KpSemanticDerivedValueCache {
  readonly schemaVersion = "kp.semantic-derived-value-cache.v1";
  readonly kind = "semantic-derived-value-cache";
  readonly #values = new Map<string, KpPersistentSemanticValue>();
  #hits = 0;
  #misses = 0;
  #disposed = false;

  evaluate<const Result>(input: {
    readonly graph: KpSemanticDerivedGraph;
    readonly snapshot: KpAggregateSemanticSnapshot;
    readonly target: KpDerivedSemanticStateLeafHandle<Result>;
  }): Result;
  evaluate(input: {
    readonly graph: KpSemanticDerivedGraph;
    readonly snapshot: KpAggregateSemanticSnapshot;
    readonly target: KpDerivedSemanticStateLeafHandle<unknown>;
  }): unknown {
    this.#assertActive();
    const fingerprint = createKpSemanticDerivationFingerprint(input);
    const keys = indexFingerprintKeys(fingerprint);
    const memo: KpSemanticDerivedEvaluationMemo = Object.freeze({
      read: (slotId: KpSemanticSlotId) => {
        const key = requireFingerprintKey(keys, slotId);
        const cached = this.#values.get(key);
        if (cached === undefined) this.#misses += 1;
        else this.#hits += 1;
        return cached;
      },
      write: (slotId: KpSemanticSlotId, value: KpPersistentSemanticValue) => {
        this.#values.set(requireFingerprintKey(keys, slotId), value);
      }
    });
    return evaluateKpSemanticDerivedValueWithMemo({ ...input, memo });
  }

  inspect(): KpSemanticDerivedCacheStats {
    return Object.freeze({
      schemaVersion: "kp.semantic-derived-cache-stats.v1",
      kind: "semantic-derived-cache-stats",
      status: this.#disposed ? "disposed" : "active",
      entries: this.#values.size,
      hits: this.#hits,
      misses: this.#misses
    });
  }

  reset(): void {
    this.#assertActive();
    this.#values.clear();
    this.#hits = 0;
    this.#misses = 0;
  }

  dispose(): void {
    this.#values.clear();
    this.#disposed = true;
  }

  #assertActive(): void {
    if (this.#disposed) {
      throw new KpSemanticDerivedCacheError(
        "derived-cache-disposed",
        "A disposed semantic derived cache cannot evaluate or reset values."
      );
    }
  }
}

export function createKpSemanticDerivedValueCache():
KpSemanticDerivedValueCache {
  // Freezing the capability surface does not freeze its caller-owned storage.
  return Object.freeze(new KpSemanticDerivedValueCacheState());
}

function indexFingerprintKeys(
  root: KpSemanticDerivationFingerprint
): ReadonlyMap<KpSemanticSlotId, string> {
  const keys = new Map<KpSemanticSlotId, string>();
  const visit = (fingerprint: KpSemanticDerivationFingerprint): void => {
    keys.set(fingerprint.targetSlotId, fingerprint.key);
    for (const dependency of fingerprint.dependencies) {
      if (dependency.kind === "semantic-derived-dependency-token") {
        visit(dependency.fingerprint);
      }
    }
  };
  visit(root);
  return keys;
}

function requireFingerprintKey(
  keys: ReadonlyMap<KpSemanticSlotId, string>,
  slotId: KpSemanticSlotId
): string {
  const key = keys.get(slotId);
  if (key === undefined) {
    throw new KpSemanticDerivedCacheError(
      "derived-cache-fingerprint-missing",
      `Requested derived slot ${JSON.stringify(slotId)} has no fingerprint in the active closure.`
    );
  }
  return key;
}
