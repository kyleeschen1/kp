import type { KpCompiledSemanticStateSchema } from "./authoring-schema-compiler.ts";
import type { KpSemanticStateGroupDescriptor, KpSemanticStateMemberMap } from "./authoring-schema.ts";

export type KpSemanticStateAuthoringGapCategory =
  | "missing" | "stale" | "foreign" | "invalid-operation"
  | "invalid-declaration" | "unsupported" | "unclassified";

export interface KpSemanticStateAuthoringDiagnostic {
  readonly category: KpSemanticStateAuthoringGapCategory;
  readonly code: string | null;
  readonly sourcePath: string;
  readonly sourceId: string | null;
  readonly declarationPath: readonly string[];
  readonly targetPath: readonly string[] | null;
  readonly dependencyPath: readonly string[] | null;
  readonly message: string;
}

export type KpSemanticStateAuthoringAttempt<Value> =
  | { readonly kind: "authored"; readonly value: Value }
  | {
      readonly kind: "repair-gap";
      readonly diagnostics: readonly KpSemanticStateAuthoringDiagnostic[];
      readonly cause: unknown;
    };

/** Explicit author/compiler boundary; never turns an error into usable output. */
export function captureKpSemanticStateAuthoring<Value>(
  input: {
    readonly sourcePath: string;
    readonly sourceId?: string;
    readonly declarationPath?: readonly string[];
    readonly compiled?: KpCompiledSemanticStateSchema<
      KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
    >;
  },
  author: () => Value
): KpSemanticStateAuthoringAttempt<Value> {
  try {
    return Object.freeze({ kind: "authored", value: author() });
  } catch (cause) {
    const error = asRecord(cause);
    const items = Array.isArray(error?.["diagnostics"]) && error["diagnostics"].length > 0
      ? error["diagnostics"] : [cause];
    const diagnostics = items.map((item: unknown): KpSemanticStateAuthoringDiagnostic => {
      const record = asRecord(item);
      const code = stringOrNull(record?.["code"]);
      const slotId = stringOrNull(record?.["targetSlotId"]) ?? stringOrNull(record?.["slotId"]);
      const leaf = slotId === null ? undefined : input.compiled?.leaves.find(
        candidate => candidate.identities.slotId === slotId
      );
      return Object.freeze({
        category: classify(code), code,
        sourcePath: input.sourcePath,
        sourceId: stringOrNull(record?.["sourceId"]) ?? input.sourceId ?? null,
        declarationPath: Object.freeze([...(pathOrNull(record?.["path"]) ??
          pathOrNull(record?.["declarationPath"]) ?? input.declarationPath ?? [])]),
        targetPath: pathOrNull(record?.["targetPath"]) ?? leaf?.path ?? null,
        dependencyPath: pathOrNull(record?.["dependencyPath"]),
        message: stringOrNull(record?.["message"]) ??
          (cause instanceof Error ? cause.message : "Authoring failed with an unclassified thrown value.")
      });
    });
    // The original exception stays local and intact. Serializable diagnostics
    // carry only observed metadata, never fabricated operation/certification data.
    return Object.freeze({ kind: "repair-gap", diagnostics: Object.freeze(diagnostics), cause });
  }
}

function classify(code: string | null): KpSemanticStateAuthoringGapCategory {
  if (code === null) return "unclassified";
  if (["missing-derived-definition", "missing-derived-dependency", "missing-derived-plan",
    "missing-endpoint-binding", "missing-member-evaluator-binding", "snapshot-not-found",
    "entity-not-found", "version-not-found", "derived-target-not-found"].includes(code)) return "missing";
  if (code === "stale-derived-definition") return "stale";
  if (["foreign-derived-target", "foreign-derived-snapshot", "foreign-prepared-application",
    "foreign-family-schema", "foreign-snapshot", "foreign-transition-address", "foreign-settled-address",
    "cross-schema-derived-dependency", "cross-schema-derived-target"].includes(code)) return "foreign";
  if (["undeclared-driver-write", "missing-driver-write", "presentation-only-write",
    "changed-derivation-authority", "unsupported-endpoint-write"].includes(code)) return "invalid-operation";
  if (["unsupported-independent-cohort-size", "unsupported-independent-write",
    "independent-alias-hazard"].includes(code)) return "unsupported";
  if (["cyclic-derived-dependency", "self-derived-dependency", "duplicate-derived-definition",
    "duplicate-derived-dependency", "invalid-derived-target", "independent-write-conflict",
    "invalid-family-parameters", "invalid-declaration-shape", "duplicate-scoped-name"].includes(code)) return "invalid-declaration";
  // Unknown engine codes stay visible but are not guessed into a repair class.
  return "unclassified";
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> | null {
  return value !== null && typeof value === "object"
    ? value as Readonly<Record<string, unknown>> : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function pathOrNull(value: unknown): readonly string[] | null {
  return Array.isArray(value) && value.every(segment => typeof segment === "string")
    ? Object.freeze([...value]) : null;
}
