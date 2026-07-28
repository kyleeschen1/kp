import type {
  KpReaderCompositorGeometryCacheIdentity
} from "./equation-compositor-geometry-cache-identity.ts";

export interface KpReaderCompositorPurePlanCache<TPlan> {
  readonly get: (
    identity: KpReaderCompositorGeometryCacheIdentity
  ) => TPlan | undefined;
  readonly set: (
    identity: KpReaderCompositorGeometryCacheIdentity,
    plan: TPlan
  ) => void;
  readonly clear: () => void;
  readonly size: number;
}

export function createKpReaderCompositorPurePlanCache<TPlan>(
  maximumEntries = 24
): KpReaderCompositorPurePlanCache<TPlan> {
  if (!Number.isSafeInteger(maximumEntries) || maximumEntries <= 0) {
    throw new Error("Reader pure-plan cache requires a positive entry bound.");
  }
  const entries = new Map<string, TPlan>();
  return {
    get(identity) {
      const plan = entries.get(identity.key);
      if (plan === undefined) return undefined;
      entries.delete(identity.key);
      entries.set(identity.key, plan);
      return plan;
    },
    set(identity, plan) {
      entries.delete(identity.key);
      entries.set(identity.key, plan);
      while (entries.size > maximumEntries) {
        const oldest = entries.keys().next().value;
        if (oldest === undefined) break;
        entries.delete(oldest);
      }
    },
    clear() {
      entries.clear();
    },
    get size() {
      return entries.size;
    }
  };
}
