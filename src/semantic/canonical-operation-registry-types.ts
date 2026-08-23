import type { KpCanonicalOperationId } from "./canonical-operation.ts";
import type {
  KpCanonicalOperationPack
} from "./canonical-operation-pack.ts";
import type {
  KpCanonicalOperationContract
} from "./canonical-operation-contract.ts";

/**
 * Keep registry contracts separate from the populated runtime registry so
 * type-only consumers do not instantiate every operation pack and exemplar.
 */
export interface KpCanonicalOperationRegistryEntry {
  readonly id: string;
  readonly packId: string;
  readonly canonicalComposition: readonly KpCanonicalOperationId[];
  readonly operationSpecId?: string | undefined;
  readonly sourceDefinitionId?: string | undefined;
  readonly sourceTransformType?: string | undefined;
  readonly authoringSummary?: string | undefined;
  readonly contract: KpCanonicalOperationContract;
}

export interface KpCanonicalOperationRegistry {
  readonly kind: "canonical-operation-registry";
  readonly packs: readonly KpCanonicalOperationPack[];
  readonly entries: readonly KpCanonicalOperationRegistryEntry[];
}

export type KpCanonicalOperationResolution =
  | {
      readonly status: "resolved";
      readonly pack: KpCanonicalOperationPack;
      readonly entry: KpCanonicalOperationRegistryEntry;
    }
  | {
      readonly status: "unknown-operation" | "missing-pin" | "version-mismatch";
      readonly operationId: string;
      readonly message: string;
    };
