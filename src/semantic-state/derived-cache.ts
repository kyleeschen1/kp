import type { KpAggregateSemanticSnapshot } from "./aggregate-snapshot.ts";
import type { KpDerivedSemanticStateLeafHandle } from
  "./authoring-state-handles.ts";
import { evaluateKpSemanticDerivedValue } from "./derived-evaluator.ts";
import { createKpSemanticDerivationFingerprint } from
  "./derived-fingerprint.ts";
import type { KpSemanticDerivedGraph } from "./derived-graph.ts";
import {
  requireAndFreezeKpPersistentSemanticValue,
  type KpPersistentSemanticValue
} from "./entity-version-store.ts";

export interface KpSemanticDerivedCacheStats {
  readonly schemaVersion: "kp.semantic-derived-cache-stats.v1";
  readonly kind: "semantic-derived-cache-stats";
  readonly status: "active" | "disposed";
  readonly entries: number;
  readonly hits: number;
  readonly misses: number;
}

export type KpSemanticDerivedCacheErrorCode = "derived-cache-disposed";

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
    const cached = this.#values.get(fingerprint.key);
    if (cached !== undefined) {
      this.#hits += 1;
      return cached;
    }

    this.#misses += 1;
    const value = requireAndFreezeKpPersistentSemanticValue(
      evaluateKpSemanticDerivedValue(input)
    );
    this.#values.set(fingerprint.key, value);
    return value;
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
