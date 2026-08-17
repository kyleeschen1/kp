import {
  kpAnimationDomains,
  type KpAnimationDomain
} from "../domain-ir/animation-domain.ts";

export const KP_ANIMATION_CAPABILITY_PLAN_SCHEMA =
  "kp.animation-capability-plan.v1" as const;

export type KpAnimationCapabilityDomain = KpAnimationDomain;

export type KpAnimationCapabilityScopeKind =
  | "operation"
  | "transformation-family"
  | "transform-series"
  | "domain-frontend";

export type KpAnimationCapabilityRequirementKind =
  | "semantic-operation"
  | "endpoint-normalizer"
  | "canonical-recipe"
  | "motion-motif"
  | "canonical-exemplar"
  | "authoring-surface"
  | "generation-corpus"
  | "series-runtime"
  | "domain-frontend"
  | "renderer-capability"
  | "human-review";

export interface KpAnimationCapabilityRequirement {
  readonly id: string;
  readonly kind: KpAnimationCapabilityRequirementKind;
  readonly authorityId: string;
  readonly summary: string;
}

export interface KpAnimationCapabilityPlanEntry {
  readonly id: string;
  readonly domain: KpAnimationCapabilityDomain;
  readonly order: number;
  readonly title: string;
  readonly scope: Readonly<{
    kind: KpAnimationCapabilityScopeKind;
    authorityId: string;
  }>;
  readonly requirements: readonly KpAnimationCapabilityRequirement[];
}

export interface KpAnimationCapabilityPlan {
  readonly schemaVersion: typeof KP_ANIMATION_CAPABILITY_PLAN_SCHEMA;
  readonly kind: "animation-capability-plan";
  readonly id: string;
  readonly title: string;
  readonly entries: readonly KpAnimationCapabilityPlanEntry[];
}

export interface KpAnimationCapabilityPlanDiagnostic {
  readonly path: string;
  readonly code:
    | "capability-plan.type"
    | "capability-plan.field.unknown"
    | "capability-plan.value.invalid"
    | "capability-plan.id.duplicate"
    | "capability-plan.order.duplicate"
    | "capability-plan.order.unsorted"
    | "capability-plan.requirement.duplicate";
  readonly message: string;
}

export class KpAnimationCapabilityPlanError extends Error {
  override readonly name = "KpAnimationCapabilityPlanError";
  readonly diagnostics: readonly KpAnimationCapabilityPlanDiagnostic[];

  constructor(diagnostics: readonly KpAnimationCapabilityPlanDiagnostic[]) {
    super(diagnostics.map(({ path, message }) => `${path}: ${message}`).join("\n"));
    this.diagnostics = Object.freeze([...diagnostics]);
  }
}

const domains = kpAnimationDomains;
const scopeKinds = Object.freeze([
  "operation",
  "transformation-family",
  "transform-series",
  "domain-frontend"
] as const);
const requirementKinds = Object.freeze([
  "semantic-operation",
  "endpoint-normalizer",
  "canonical-recipe",
  "motion-motif",
  "canonical-exemplar",
  "authoring-surface",
  "generation-corpus",
  "series-runtime",
  "domain-frontend",
  "renderer-capability",
  "human-review"
] as const);
const protocolId = /^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)+$/u;

/**
 * Capability plans author desired semantic coverage, not conclusions about
 * current readiness. Strict object shapes keep status and presentation knobs
 * out of the source data so later projections must earn every readiness label
 * from repository evidence.
 */
export function defineKpAnimationCapabilityPlan(
  value: unknown
): KpAnimationCapabilityPlan {
  const diagnostics: KpAnimationCapabilityPlanDiagnostic[] = [];
  const input = record(value, "$", diagnostics);
  if (input === undefined) throw new KpAnimationCapabilityPlanError(diagnostics);
  rejectUnknown(input, ["schemaVersion", "kind", "id", "title", "entries"], "$", diagnostics);
  literal(input["schemaVersion"], KP_ANIMATION_CAPABILITY_PLAN_SCHEMA, "$.schemaVersion", diagnostics);
  literal(input["kind"], "animation-capability-plan", "$.kind", diagnostics);
  const id = idValue(input["id"], "$.id", diagnostics);
  const title = nonBlank(input["title"], "$.title", diagnostics);
  const rawEntries = array(input["entries"], "$.entries", diagnostics);
  const entries = rawEntries.map((entry, index) =>
    parseEntry(entry, index, diagnostics)
  ).filter((entry): entry is KpAnimationCapabilityPlanEntry =>
    entry !== undefined
  );
  validateEntryOrder(entries, diagnostics);

  if (diagnostics.length > 0 || id === undefined || title === undefined) {
    throw new KpAnimationCapabilityPlanError(diagnostics);
  }
  return Object.freeze({
    schemaVersion: KP_ANIMATION_CAPABILITY_PLAN_SCHEMA,
    kind: "animation-capability-plan" as const,
    id,
    title,
    entries: Object.freeze(entries)
  });
}

function parseEntry(
  value: unknown,
  index: number,
  diagnostics: KpAnimationCapabilityPlanDiagnostic[]
): KpAnimationCapabilityPlanEntry | undefined {
  const path = `$.entries[${index}]`;
  const input = record(value, path, diagnostics);
  if (input === undefined) return undefined;
  rejectUnknown(input, ["id", "domain", "order", "title", "scope", "requirements"], path, diagnostics);
  const id = idValue(input["id"], `${path}.id`, diagnostics);
  const domain = enumeration(input["domain"], domains, `${path}.domain`, diagnostics);
  const order = positiveInteger(input["order"], `${path}.order`, diagnostics);
  const title = nonBlank(input["title"], `${path}.title`, diagnostics);
  const scope = parseScope(input["scope"], `${path}.scope`, diagnostics);
  const rawRequirements = array(input["requirements"], `${path}.requirements`, diagnostics);
  if (rawRequirements.length === 0) invalid(`${path}.requirements`, "Capability entries require at least one explicit requirement.", diagnostics);
  const requirements = rawRequirements.map((requirement, requirementIndex) =>
    parseRequirement(requirement, `${path}.requirements[${requirementIndex}]`, diagnostics)
  ).filter((requirement): requirement is KpAnimationCapabilityRequirement =>
    requirement !== undefined
  );
  const requirementIds = new Set<string>();
  for (const requirement of requirements) {
    if (requirementIds.has(requirement.id)) {
      diagnostics.push({
        path: `${path}.requirements`,
        code: "capability-plan.requirement.duplicate",
        message: `Duplicate requirement ID ${requirement.id}.`
      });
    }
    requirementIds.add(requirement.id);
  }
  if (
    id === undefined || domain === undefined || order === undefined ||
    title === undefined || scope === undefined || requirements.length === 0
  ) return undefined;
  return Object.freeze({
    id,
    domain,
    order,
    title,
    scope,
    requirements: Object.freeze(requirements)
  });
}

function parseScope(
  value: unknown,
  path: string,
  diagnostics: KpAnimationCapabilityPlanDiagnostic[]
): KpAnimationCapabilityPlanEntry["scope"] | undefined {
  const input = record(value, path, diagnostics);
  if (input === undefined) return undefined;
  rejectUnknown(input, ["kind", "authorityId"], path, diagnostics);
  const kind = enumeration(input["kind"], scopeKinds, `${path}.kind`, diagnostics);
  const authorityId = idValue(input["authorityId"], `${path}.authorityId`, diagnostics);
  return kind === undefined || authorityId === undefined
    ? undefined
    : Object.freeze({ kind, authorityId });
}

function parseRequirement(
  value: unknown,
  path: string,
  diagnostics: KpAnimationCapabilityPlanDiagnostic[]
): KpAnimationCapabilityRequirement | undefined {
  const input = record(value, path, diagnostics);
  if (input === undefined) return undefined;
  rejectUnknown(input, ["id", "kind", "authorityId", "summary"], path, diagnostics);
  const id = idValue(input["id"], `${path}.id`, diagnostics);
  const kind = enumeration(input["kind"], requirementKinds, `${path}.kind`, diagnostics);
  const authorityId = idValue(input["authorityId"], `${path}.authorityId`, diagnostics);
  const summary = nonBlank(input["summary"], `${path}.summary`, diagnostics);
  return id === undefined || kind === undefined || authorityId === undefined || summary === undefined
    ? undefined
    : Object.freeze({ id, kind, authorityId, summary });
}

function validateEntryOrder(
  entries: readonly KpAnimationCapabilityPlanEntry[],
  diagnostics: KpAnimationCapabilityPlanDiagnostic[]
): void {
  const ids = new Set<string>();
  const orders = new Set<number>();
  let previous = 0;
  entries.forEach((entry, index) => {
    if (ids.has(entry.id)) diagnostics.push({
      path: `$.entries[${index}].id`,
      code: "capability-plan.id.duplicate",
      message: `Duplicate capability ID ${entry.id}.`
    });
    if (orders.has(entry.order)) diagnostics.push({
      path: `$.entries[${index}].order`,
      code: "capability-plan.order.duplicate",
      message: `Duplicate capability order ${entry.order}.`
    });
    if (entry.order <= previous) diagnostics.push({
      path: `$.entries[${index}].order`,
      code: "capability-plan.order.unsorted",
      message: "Capability entries must be authored in strictly increasing order."
    });
    ids.add(entry.id);
    orders.add(entry.order);
    previous = entry.order;
  });
}

function record(
  value: unknown,
  path: string,
  diagnostics: KpAnimationCapabilityPlanDiagnostic[]
): Record<string, unknown> | undefined {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  diagnostics.push({ path, code: "capability-plan.type", message: "Expected an object." });
  return undefined;
}

function array(
  value: unknown,
  path: string,
  diagnostics: KpAnimationCapabilityPlanDiagnostic[]
): readonly unknown[] {
  if (Array.isArray(value)) return value;
  diagnostics.push({ path, code: "capability-plan.type", message: "Expected an array." });
  return [];
}

function rejectUnknown(
  input: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  diagnostics: KpAnimationCapabilityPlanDiagnostic[]
): void {
  const accepted = new Set(allowed);
  for (const key of Object.keys(input)) {
    if (!accepted.has(key)) diagnostics.push({
      path: `${path}.${key}`,
      code: "capability-plan.field.unknown",
      message: `Unknown capability-plan field ${key}.`
    });
  }
}

function idValue(
  value: unknown,
  path: string,
  diagnostics: KpAnimationCapabilityPlanDiagnostic[]
): string | undefined {
  if (typeof value === "string" && protocolId.test(value)) return value;
  invalid(path, "Expected a stable namespaced protocol ID.", diagnostics);
  return undefined;
}

function nonBlank(
  value: unknown,
  path: string,
  diagnostics: KpAnimationCapabilityPlanDiagnostic[]
): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  invalid(path, "Expected non-blank text.", diagnostics);
  return undefined;
}

function positiveInteger(
  value: unknown,
  path: string,
  diagnostics: KpAnimationCapabilityPlanDiagnostic[]
): number | undefined {
  if (Number.isInteger(value) && Number(value) > 0) return Number(value);
  invalid(path, "Expected a positive integer.", diagnostics);
  return undefined;
}

function literal<const Value extends string>(
  value: unknown,
  expected: Value,
  path: string,
  diagnostics: KpAnimationCapabilityPlanDiagnostic[]
): Value | undefined {
  if (value === expected) return expected;
  invalid(path, `Expected ${expected}.`, diagnostics);
  return undefined;
}

function enumeration<const Value extends string>(
  value: unknown,
  values: readonly Value[],
  path: string,
  diagnostics: KpAnimationCapabilityPlanDiagnostic[]
): Value | undefined {
  if (typeof value === "string" && values.includes(value as Value)) {
    return value as Value;
  }
  invalid(path, `Expected one of ${values.join(", ")}.`, diagnostics);
  return undefined;
}

function invalid(
  path: string,
  message: string,
  diagnostics: KpAnimationCapabilityPlanDiagnostic[]
): void {
  diagnostics.push({ path, code: "capability-plan.value.invalid", message });
}
