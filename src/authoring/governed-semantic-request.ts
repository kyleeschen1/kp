import type { KpCanonicalOperationPackPin } from "../semantic/canonical-operation-pack.ts";
import type { SelectorCorrespondenceRelationId } from "../semantic/correspondence.ts";
import {
  findKpForbiddenPresentationAuthority
} from "./presentation-authority-firewall.ts";

export const kpGovernedSemanticAuthoringSchemaVersion =
  "kp.governed-semantic-authoring-request.v1" as const;

export const kpGovernedNormalFormIds = [
  "distributed-sum",
  "factored-product",
  "isolated-variable",
  "evaluated-constant",
  "lowered-exponent-product",
  "expanded-product",
  "radical-expression"
] as const;

export type KpGovernedNormalFormId = typeof kpGovernedNormalFormIds[number];

export type KpGovernedFocusIntent =
  | {
      readonly kind: "notice";
      readonly targetEntityIds: readonly string[];
    }
  | {
      readonly kind: "compare";
      readonly leftEntityIds: readonly string[];
      readonly rightEntityIds: readonly string[];
    }
  | {
      readonly kind: "transmit";
      readonly sourceEntityIds: readonly string[];
      readonly targetEntityIds: readonly string[];
    };

export interface KpGovernedSemanticAuthoringRequest {
  readonly schemaVersion: typeof kpGovernedSemanticAuthoringSchemaVersion;
  readonly id: string;
  readonly title: string;
  readonly source: {
    readonly kind: "verified-semantic-source";
    readonly sourceId: string;
    readonly revisionId: string;
    readonly entityIds: readonly string[];
    readonly expressionIds: readonly string[];
    readonly operationPacks: readonly KpCanonicalOperationPackPin[];
  };
  readonly operationIntent: {
    readonly operationId: string;
    readonly roleBindings: Readonly<Record<string, readonly string[]>>;
    readonly correspondence: readonly {
      readonly relation: SelectorCorrespondenceRelationId;
      readonly sourceEntityIds: readonly string[];
      readonly targetEntityIds: readonly string[];
    }[];
  };
  readonly focusIntent: KpGovernedFocusIntent;
  readonly cadenceIntent: {
    readonly kind: "together" | "one-at-a-time" | "staggered" | "stepped";
    readonly branchEntityIds: readonly string[];
  };
  readonly normalFormIntent: {
    readonly normalFormId: KpGovernedNormalFormId;
    readonly sourceExpressionId: string;
    readonly targetExpressionId: string;
  };
  readonly compressionIntent: {
    readonly level: "complete" | "key-steps" | "summary";
    readonly preserve: readonly ("law" | "lineage" | "witness" | "assumption")[];
  };
}

export interface KpGovernedSemanticAuthoringSchemaIssue {
  readonly code:
    | "governed-schema.type"
    | "governed-schema.required"
    | "governed-schema.duplicate"
    | "governed-schema.enum"
    | "governed-schema.unsafe-authority";
  readonly path: string;
  readonly message: string;
}

const correspondenceRelations = new Set<SelectorCorrespondenceRelationId>([
  "identity",
  "role-change",
  "introduction",
  "removal",
  "fan-in",
  "fan-out",
  "cancelation",
  "focus",
  "artifact"
]);

export function validateKpGovernedSemanticAuthoringRequest(
  value: unknown
): readonly KpGovernedSemanticAuthoringSchemaIssue[] {
  const issues: KpGovernedSemanticAuthoringSchemaIssue[] = [];
  if (!isRecord(value)) {
    return [issue("governed-schema.type", "$", "Governed semantic authoring request must be an object.")];
  }
  findKpForbiddenPresentationAuthority(value).forEach((firewallIssue) => {
    issues.push(issue(
      "governed-schema.unsafe-authority",
      firewallIssue.path,
      `Provider-authored ${firewallIssue.key} is outside the semantic authoring boundary.`
    ));
  });
  if (value["schemaVersion"] !== kpGovernedSemanticAuthoringSchemaVersion) {
    issues.push(issue(
      "governed-schema.required",
      "$.schemaVersion",
      `Expected ${kpGovernedSemanticAuthoringSchemaVersion}.`
    ));
  }
  requireText(value["id"], "$.id", issues);
  requireText(value["title"], "$.title", issues);

  const source = requireRecord(value["source"], "$.source", issues);
  if (source !== undefined) {
    if (source["kind"] !== "verified-semantic-source") {
      issues.push(issue(
        "governed-schema.enum",
        "$.source.kind",
        "Governed authoring requires a verified-semantic-source."
      ));
    }
    requireText(source["sourceId"], "$.source.sourceId", issues);
    requireText(source["revisionId"], "$.source.revisionId", issues);
    requireStringList(source["entityIds"], "$.source.entityIds", issues);
    requireStringList(source["expressionIds"], "$.source.expressionIds", issues);
    validateOperationPacks(source["operationPacks"], issues);
  }

  const operation = requireRecord(value["operationIntent"], "$.operationIntent", issues);
  if (operation !== undefined) {
    requireText(operation["operationId"], "$.operationIntent.operationId", issues);
    validateRoleBindings(operation["roleBindings"], issues);
    validateCorrespondence(operation["correspondence"], issues);
  }
  validateFocusIntent(value["focusIntent"], issues);
  validateCadenceIntent(value["cadenceIntent"], issues);
  validateNormalFormIntent(value["normalFormIntent"], issues);
  validateCompressionIntent(value["compressionIntent"], issues);
  return Object.freeze(issues);
}

export function createKpGovernedSemanticAuthoringRequest(
  value: unknown
): KpGovernedSemanticAuthoringRequest {
  const issues = validateKpGovernedSemanticAuthoringRequest(value);
  if (issues.length > 0) {
    throw new Error(issues.map(({ path, message }) => `${path}: ${message}`).join("\n"));
  }
  const input = value as KpGovernedSemanticAuthoringRequest;
  // Only the registered semantic vocabulary crosses the author/compiler
  // boundary; runtime extras on an untrusted provider response are discarded.
  return deepFreeze({
    schemaVersion: kpGovernedSemanticAuthoringSchemaVersion,
    id: input.id,
    title: input.title,
    source: {
      kind: "verified-semantic-source" as const,
      sourceId: input.source.sourceId,
      revisionId: input.source.revisionId,
      entityIds: [...input.source.entityIds],
      expressionIds: [...input.source.expressionIds],
      operationPacks: input.source.operationPacks.map((pin) => ({ ...pin }))
    },
    operationIntent: {
      operationId: input.operationIntent.operationId,
      roleBindings: Object.fromEntries(Object.entries(input.operationIntent.roleBindings)
        .map(([roleId, ids]) => [roleId, [...ids]])),
      correspondence: input.operationIntent.correspondence.map((entry) => ({
        relation: entry.relation,
        sourceEntityIds: [...entry.sourceEntityIds],
        targetEntityIds: [...entry.targetEntityIds]
      }))
    },
    focusIntent: cloneFocus(input.focusIntent),
    cadenceIntent: {
      kind: input.cadenceIntent.kind,
      branchEntityIds: [...input.cadenceIntent.branchEntityIds]
    },
    normalFormIntent: { ...input.normalFormIntent },
    compressionIntent: {
      level: input.compressionIntent.level,
      preserve: [...input.compressionIntent.preserve]
    }
  });
}

function validateOperationPacks(
  value: unknown,
  issues: KpGovernedSemanticAuthoringSchemaIssue[]
): void {
  if (!Array.isArray(value) || value.length === 0) {
    issues.push(issue("governed-schema.required", "$.source.operationPacks", "At least one exact operation-pack pin is required."));
    return;
  }
  const ids: string[] = [];
  value.forEach((candidate, index) => {
    const path = `$.source.operationPacks[${index}]`;
    const pin = requireRecord(candidate, path, issues);
    if (pin === undefined) return;
    requireText(pin["packId"], `${path}.packId`, issues);
    requireText(pin["version"], `${path}.version`, issues);
    if (typeof pin["packId"] === "string") ids.push(pin["packId"]);
  });
  rejectDuplicates(ids, "$.source.operationPacks", issues);
}

function validateRoleBindings(
  value: unknown,
  issues: KpGovernedSemanticAuthoringSchemaIssue[]
): void {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    issues.push(issue("governed-schema.required", "$.operationIntent.roleBindings", "At least one semantic role binding is required."));
    return;
  }
  Object.entries(value).forEach(([roleId, ids]) => {
    requireText(roleId, `$.operationIntent.roleBindings.${roleId}`, issues);
    requireStringList(ids, `$.operationIntent.roleBindings.${roleId}`, issues);
  });
}

function validateCorrespondence(
  value: unknown,
  issues: KpGovernedSemanticAuthoringSchemaIssue[]
): void {
  if (!Array.isArray(value) || value.length === 0) {
    issues.push(issue("governed-schema.required", "$.operationIntent.correspondence", "At least one semantic correspondence is required."));
    return;
  }
  value.forEach((candidate, index) => {
    const path = `$.operationIntent.correspondence[${index}]`;
    const entry = requireRecord(candidate, path, issues);
    if (entry === undefined) return;
    if (!correspondenceRelations.has(entry["relation"] as SelectorCorrespondenceRelationId)) {
      issues.push(issue("governed-schema.enum", `${path}.relation`, `Unknown semantic correspondence ${String(entry["relation"])}.`));
    }
    const source = requireStringList(entry["sourceEntityIds"], `${path}.sourceEntityIds`, issues, true);
    const target = requireStringList(entry["targetEntityIds"], `${path}.targetEntityIds`, issues, true);
    if ((source?.length ?? 0) + (target?.length ?? 0) === 0) {
      issues.push(issue("governed-schema.required", path, "Semantic correspondence must reference at least one endpoint."));
    }
  });
}

function validateFocusIntent(
  value: unknown,
  issues: KpGovernedSemanticAuthoringSchemaIssue[]
): void {
  const focus = requireRecord(value, "$.focusIntent", issues);
  if (focus === undefined) return;
  switch (focus["kind"]) {
    case "notice":
      requireStringList(focus["targetEntityIds"], "$.focusIntent.targetEntityIds", issues);
      return;
    case "compare":
      requireStringList(focus["leftEntityIds"], "$.focusIntent.leftEntityIds", issues);
      requireStringList(focus["rightEntityIds"], "$.focusIntent.rightEntityIds", issues);
      return;
    case "transmit":
      requireStringList(focus["sourceEntityIds"], "$.focusIntent.sourceEntityIds", issues);
      requireStringList(focus["targetEntityIds"], "$.focusIntent.targetEntityIds", issues);
      return;
    default:
      issues.push(issue("governed-schema.enum", "$.focusIntent.kind", `Unknown focus intent ${String(focus["kind"])}.`));
  }
}

function validateCadenceIntent(
  value: unknown,
  issues: KpGovernedSemanticAuthoringSchemaIssue[]
): void {
  const cadence = requireRecord(value, "$.cadenceIntent", issues);
  if (cadence === undefined) return;
  if (!["together", "one-at-a-time", "staggered", "stepped"].includes(String(cadence["kind"]))) {
    issues.push(issue("governed-schema.enum", "$.cadenceIntent.kind", `Unknown cadence intent ${String(cadence["kind"])}.`));
  }
  requireStringList(cadence["branchEntityIds"], "$.cadenceIntent.branchEntityIds", issues);
}

function validateNormalFormIntent(
  value: unknown,
  issues: KpGovernedSemanticAuthoringSchemaIssue[]
): void {
  const normalForm = requireRecord(value, "$.normalFormIntent", issues);
  if (normalForm === undefined) return;
  if (!kpGovernedNormalFormIds.includes(normalForm["normalFormId"] as KpGovernedNormalFormId)) {
    issues.push(issue("governed-schema.enum", "$.normalFormIntent.normalFormId", `Unknown registered normal form ${String(normalForm["normalFormId"])}.`));
  }
  requireText(normalForm["sourceExpressionId"], "$.normalFormIntent.sourceExpressionId", issues);
  requireText(normalForm["targetExpressionId"], "$.normalFormIntent.targetExpressionId", issues);
}

function validateCompressionIntent(
  value: unknown,
  issues: KpGovernedSemanticAuthoringSchemaIssue[]
): void {
  const compression = requireRecord(value, "$.compressionIntent", issues);
  if (compression === undefined) return;
  if (!["complete", "key-steps", "summary"].includes(String(compression["level"]))) {
    issues.push(issue("governed-schema.enum", "$.compressionIntent.level", `Unknown compression level ${String(compression["level"])}.`));
  }
  const preserve = requireStringList(compression["preserve"], "$.compressionIntent.preserve", issues);
  preserve?.forEach((value, index) => {
    if (!["law", "lineage", "witness", "assumption"].includes(value)) {
      issues.push(issue("governed-schema.enum", `$.compressionIntent.preserve[${index}]`, `Unknown preserved evidence ${value}.`));
    }
  });
  if (preserve !== undefined && (!preserve.includes("law") || !preserve.includes("lineage"))) {
    issues.push(issue("governed-schema.required", "$.compressionIntent.preserve", "Every compression level must preserve law and lineage evidence."));
  }
}

function cloneFocus(focus: KpGovernedFocusIntent): KpGovernedFocusIntent {
  switch (focus.kind) {
    case "notice":
      return { kind: focus.kind, targetEntityIds: [...focus.targetEntityIds] };
    case "compare":
      return {
        kind: focus.kind,
        leftEntityIds: [...focus.leftEntityIds],
        rightEntityIds: [...focus.rightEntityIds]
      };
    case "transmit":
      return {
        kind: focus.kind,
        sourceEntityIds: [...focus.sourceEntityIds],
        targetEntityIds: [...focus.targetEntityIds]
      };
  }
}

function requireRecord(
  value: unknown,
  path: string,
  issues: KpGovernedSemanticAuthoringSchemaIssue[]
): Readonly<Record<string, unknown>> | undefined {
  if (isRecord(value)) return value;
  issues.push(issue("governed-schema.type", path, `${path} must be an object.`));
  return undefined;
}

function requireText(
  value: unknown,
  path: string,
  issues: KpGovernedSemanticAuthoringSchemaIssue[]
): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(issue("governed-schema.required", path, `${path} must be a non-empty string.`));
  }
}

function requireStringList(
  value: unknown,
  path: string,
  issues: KpGovernedSemanticAuthoringSchemaIssue[],
  allowEmpty = false
): readonly string[] | undefined {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    issues.push(issue("governed-schema.required", path, `${path} must be ${allowEmpty ? "a" : "a non-empty"} string list.`));
    return undefined;
  }
  const strings: string[] = [];
  value.forEach((entry, index) => {
    requireText(entry, `${path}[${index}]`, issues);
    if (typeof entry === "string") strings.push(entry);
  });
  rejectDuplicates(strings, path, issues);
  return strings;
}

function rejectDuplicates(
  values: readonly string[],
  path: string,
  issues: KpGovernedSemanticAuthoringSchemaIssue[]
): void {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (seen.has(value)) {
      issues.push(issue("governed-schema.duplicate", `${path}[${index}]`, `${path} repeats ${value}.`));
    }
    seen.add(value);
  });
}

function issue(
  code: KpGovernedSemanticAuthoringSchemaIssue["code"],
  path: string,
  message: string
): KpGovernedSemanticAuthoringSchemaIssue {
  return Object.freeze({ code, path, message });
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}
