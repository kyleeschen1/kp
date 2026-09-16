import type { KpTypeScriptSourceToken } from "./typescript-source-tokens.ts";
import type { KpExtractHelperCausalContract } from "../domain-ir/extract-helper-causal-contract.ts";

/** Bounded source evidence, not a general statement-extraction protocol. */
export interface KpCentroidExtractionState {
  readonly id: "original" | "extracted" | "generalized";
  readonly source: string;
  readonly tokens: readonly (KpTypeScriptSourceToken & { readonly id: string; readonly entityId: string })[];
}

export interface KpCentroidExtractionArtifact {
  readonly schemaVersion: "kp.centroid-extraction.v1";
  readonly sourcePin: string;
  readonly causalContract: KpExtractHelperCausalContract;
  readonly evidence: {
    readonly sourceRevisionId: string;
    readonly targetRevisionId: string;
    readonly syntaxRecordIds: readonly string[];
    readonly assumptions: readonly string[];
  };
  readonly states: readonly [KpCentroidExtractionState, KpCentroidExtractionState, KpCentroidExtractionState];
}
