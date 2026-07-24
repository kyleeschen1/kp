import type { KpCanonicalOperationId } from "../../semantic/canonical-operation.ts";

export const kpExecutableMotifGrammarVersion = "1.0.0" as const;

export type KpTrustedMotifId =
  | "persist"
  | "introduce"
  | "eliminate"
  | "substitute"
  | "copy"
  | "fan-out"
  | "merge"
  | "reorder"
  | "wrap"
  | "unwrap"
  | "group"
  | "ungroup"
  | "focus";

export type KpTrustedMotionPrimitiveId =
  | "preserve-identity"
  | "introduce-entity"
  | "eliminate-entity"
  | "transmit-value"
  | "preserve-source"
  | "branch-lineage"
  | "coalesce-lineage"
  | "reflow-order"
  | "enclose"
  | "release-enclosure"
  | "establish-group"
  | "release-group"
  | "shift-attention";

export interface KpExecutableMotifGrammarEntry {
  readonly operationId: KpCanonicalOperationId;
  readonly motifId: KpTrustedMotifId;
  readonly primitiveIds: readonly KpTrustedMotionPrimitiveId[];
  readonly summary: string;
}

export interface KpExecutableMotifComposition {
  readonly kind: "executable-motif-composition";
  readonly grammarVersion: typeof kpExecutableMotifGrammarVersion;
  readonly operationIds: readonly KpCanonicalOperationId[];
  readonly steps: readonly KpExecutableMotifGrammarEntry[];
}

export const kpExecutableMotifGrammar: readonly KpExecutableMotifGrammarEntry[] = [
  entry("kp.core.persist", "persist", ["preserve-identity"], "Keep a semantic entity continuous."),
  entry("kp.core.introduce", "introduce", ["introduce-entity"], "Introduce an entity from an explicit semantic cause."),
  entry("kp.core.eliminate", "eliminate", ["eliminate-entity"], "Remove an entity through an explicit lifecycle."),
  entry("kp.core.substitute", "substitute", ["transmit-value", "eliminate-entity", "introduce-entity"], "Transmit a value while replacing the destination occupant."),
  entry("kp.core.copy", "copy", ["preserve-source", "branch-lineage"], "Preserve the source and derive a lineage-bearing copy."),
  entry("kp.core.fan-out", "fan-out", ["branch-lineage"], "Branch one source into multiple lineage-bearing destinations."),
  entry("kp.core.merge", "merge", ["coalesce-lineage"], "Coalesce several sources into one result."),
  entry("kp.core.reorder", "reorder", ["preserve-identity", "reflow-order"], "Reflow presentation while identity persists."),
  entry("kp.core.wrap", "wrap", ["preserve-identity", "enclose"], "Preserve content while introducing enclosure."),
  entry("kp.core.unwrap", "unwrap", ["release-enclosure", "preserve-identity"], "Remove enclosure while content persists."),
  entry("kp.core.group", "group", ["preserve-identity", "establish-group"], "Preserve members while establishing a group."),
  entry("kp.core.ungroup", "ungroup", ["release-group", "preserve-identity"], "Release a group while members persist."),
  entry("kp.core.focus", "focus", ["preserve-identity", "shift-attention"], "Change attention without changing semantic identity.")
];

export function compileKpExecutableMotifComposition(
  operationIds: readonly KpCanonicalOperationId[]
): KpExecutableMotifComposition {
  return {
    kind: "executable-motif-composition",
    grammarVersion: kpExecutableMotifGrammarVersion,
    operationIds: [...operationIds],
    steps: operationIds.map((operationId) => {
      const grammarEntry = kpExecutableMotifGrammar.find((candidate) => candidate.operationId === operationId);
      if (grammarEntry === undefined) throw new Error(`Canonical operation ${operationId} has no trusted motif grammar entry.`);
      return { ...grammarEntry, primitiveIds: [...grammarEntry.primitiveIds] };
    })
  };
}

function entry(
  operationId: KpCanonicalOperationId,
  motifId: KpTrustedMotifId,
  primitiveIds: readonly KpTrustedMotionPrimitiveId[],
  summary: string
): KpExecutableMotifGrammarEntry {
  return { operationId, motifId, primitiveIds, summary };
}
