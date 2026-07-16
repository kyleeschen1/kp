import type { SelectorCorrespondenceRelationId } from "./correspondence.ts";
import type {
  KpCanonicalOperationId,
  KpCanonicalOperationRole
} from "./canonical-operation.ts";
import type { KpCanonicalOperationPackPin } from "./canonical-operation-pack.ts";

export type KpCanonicalOperationInvariantKind =
  | "precondition"
  | "preservation"
  | "postcondition";

export interface KpCanonicalOperationInvariant {
  readonly id: string;
  readonly kind: KpCanonicalOperationInvariantKind;
  readonly roleIds: readonly string[];
  readonly summary: string;
}

export interface KpCanonicalOperationPattern {
  readonly id: string;
  readonly rootRoleId: string;
  readonly requiredRoleIds: readonly string[];
  readonly summary: string;
}

export interface KpCanonicalOperationLineageTemplate {
  readonly id: string;
  readonly relation: SelectorCorrespondenceRelationId;
  readonly sourceRoleIds: readonly string[];
  readonly targetRoleIds: readonly string[];
  readonly summary: string;
}

export interface KpCanonicalOperationMotifStep {
  readonly id: string;
  readonly primitiveId: string;
  readonly phaseId: string;
  readonly sourceRoleIds: readonly string[];
  readonly targetRoleIds: readonly string[];
  readonly summary: string;
}

export interface KpCanonicalOperationExample {
  readonly id: string;
  readonly kind: "positive" | "counterexample" | "ambiguous";
  readonly roleBindings: Readonly<Record<string, string>>;
  readonly expected: "accepted" | "rejected" | "needs-review";
  readonly summary: string;
}

export interface KpCanonicalOperationAccessibilityVariant {
  readonly mode: "full-motion" | "reduced-motion" | "static" | "narrated";
  readonly preservesPhaseIds: readonly string[];
  readonly summary: string;
}

export interface KpCanonicalOperationSpec {
  readonly id: string;
  readonly kind: "canonical-operation-spec";
  readonly schemaVersion: "kp.canonical-operation-spec.v1";
  readonly pack: KpCanonicalOperationPackPin;
  readonly canonicalOperationId: KpCanonicalOperationId | string;
  readonly title: string;
  readonly summary: string;
  readonly roles: readonly KpCanonicalOperationRole[];
  readonly sourcePattern: KpCanonicalOperationPattern;
  readonly targetPattern: KpCanonicalOperationPattern;
  readonly invariants: readonly KpCanonicalOperationInvariant[];
  readonly lineage: readonly KpCanonicalOperationLineageTemplate[];
  readonly motif: readonly KpCanonicalOperationMotifStep[];
  readonly examples: readonly KpCanonicalOperationExample[];
  readonly rewind: {
    readonly operationId: KpCanonicalOperationId | string;
    readonly preservesPhaseIds: readonly string[];
  };
  readonly accessibility: readonly KpCanonicalOperationAccessibilityVariant[];
}

export interface KpCanonicalOperationSpecIssue {
  readonly path: string;
  readonly message: string;
}

export function createKpCanonicalOperationSpec(
  input: Omit<KpCanonicalOperationSpec, "kind" | "schemaVersion">
): KpCanonicalOperationSpec {
  const spec: KpCanonicalOperationSpec = {
    ...input,
    kind: "canonical-operation-spec",
    schemaVersion: "kp.canonical-operation-spec.v1",
    pack: { ...input.pack },
    roles: input.roles.map((role) => ({ ...role })),
    sourcePattern: clonePattern(input.sourcePattern),
    targetPattern: clonePattern(input.targetPattern),
    invariants: input.invariants.map((invariant) => ({
      ...invariant,
      roleIds: [...invariant.roleIds]
    })),
    lineage: input.lineage.map((lineage) => ({
      ...lineage,
      sourceRoleIds: [...lineage.sourceRoleIds],
      targetRoleIds: [...lineage.targetRoleIds]
    })),
    motif: input.motif.map((step) => ({
      ...step,
      sourceRoleIds: [...step.sourceRoleIds],
      targetRoleIds: [...step.targetRoleIds]
    })),
    examples: input.examples.map((example) => ({
      ...example,
      roleBindings: { ...example.roleBindings }
    })),
    rewind: {
      ...input.rewind,
      preservesPhaseIds: [...input.rewind.preservesPhaseIds]
    },
    accessibility: input.accessibility.map((variant) => ({
      ...variant,
      preservesPhaseIds: [...variant.preservesPhaseIds]
    }))
  };
  const issues = validateKpCanonicalOperationSpec(spec);
  if (issues.length > 0) {
    throw new Error(issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"));
  }
  return spec;
}

export function validateKpCanonicalOperationSpec(
  spec: KpCanonicalOperationSpec
): readonly KpCanonicalOperationSpecIssue[] {
  const issues: KpCanonicalOperationSpecIssue[] = [];
  const roleIds = new Set<string>();
  spec.roles.forEach((role, index) => {
    requireNonEmpty(role.id, `roles[${index}].id`, issues);
    if (roleIds.has(role.id)) {
      issues.push({ path: `roles[${index}].id`, message: `Duplicate role ${role.id}.` });
    }
    roleIds.add(role.id);
  });
  requireNonEmpty(spec.id, "id", issues);
  requireNonEmpty(spec.title, "title", issues);
  requireNonEmpty(spec.summary, "summary", issues);
  validatePattern(spec.sourcePattern, "sourcePattern", "source", roleIds, issues);
  validatePattern(spec.targetPattern, "targetPattern", "target", roleIds, issues);
  if (spec.invariants.length === 0) {
    issues.push({ path: "invariants", message: "Operation spec must declare an invariant." });
  }
  spec.invariants.forEach((invariant, index) =>
    validateRoleRefs(invariant.roleIds, `invariants[${index}].roleIds`, roleIds, issues)
  );
  if (spec.lineage.length === 0) {
    issues.push({ path: "lineage", message: "Operation spec must declare lineage." });
  }
  spec.lineage.forEach((lineage, index) => {
    validateRoleRefs(lineage.sourceRoleIds, `lineage[${index}].sourceRoleIds`, roleIds, issues);
    validateRoleRefs(lineage.targetRoleIds, `lineage[${index}].targetRoleIds`, roleIds, issues);
  });
  if (spec.motif.length === 0) {
    issues.push({ path: "motif", message: "Operation spec must compose a trusted motif." });
  }
  const phaseIds = new Set(spec.motif.map((step) => step.phaseId));
  spec.motif.forEach((step, index) => {
    requireNonEmpty(step.primitiveId, `motif[${index}].primitiveId`, issues);
    requireNonEmpty(step.phaseId, `motif[${index}].phaseId`, issues);
    validateRoleRefs(step.sourceRoleIds, `motif[${index}].sourceRoleIds`, roleIds, issues);
    validateRoleRefs(step.targetRoleIds, `motif[${index}].targetRoleIds`, roleIds, issues);
  });
  if (!spec.examples.some((example) => example.kind === "positive")) {
    issues.push({ path: "examples", message: "Operation spec must include a positive example." });
  }
  if (!spec.examples.some((example) => example.kind === "counterexample")) {
    issues.push({ path: "examples", message: "Operation spec must include a counterexample." });
  }
  spec.examples.forEach((example, index) => {
    validateRoleRefs(
      Object.keys(example.roleBindings),
      `examples[${index}].roleBindings`,
      roleIds,
      issues
    );
  });
  validatePhaseRefs(spec.rewind.preservesPhaseIds, "rewind.preservesPhaseIds", phaseIds, issues);
  const accessibilityModes = new Set(spec.accessibility.map((variant) => variant.mode));
  for (const mode of ["full-motion", "reduced-motion", "static", "narrated"] as const) {
    if (!accessibilityModes.has(mode)) {
      issues.push({ path: "accessibility", message: `Operation spec is missing ${mode}.` });
    }
  }
  spec.accessibility.forEach((variant, index) =>
    validatePhaseRefs(
      variant.preservesPhaseIds,
      `accessibility[${index}].preservesPhaseIds`,
      phaseIds,
      issues
    )
  );
  rejectRendererInstructions(spec, issues);
  return issues;
}

function clonePattern(pattern: KpCanonicalOperationPattern): KpCanonicalOperationPattern {
  return { ...pattern, requiredRoleIds: [...pattern.requiredRoleIds] };
}

function validatePattern(
  pattern: KpCanonicalOperationPattern,
  path: string,
  endpoint: "source" | "target",
  roleIds: ReadonlySet<string>,
  issues: KpCanonicalOperationSpecIssue[]
): void {
  validateRoleRefs([pattern.rootRoleId, ...pattern.requiredRoleIds], path, roleIds, issues);
  const endpointRoles = new Set(
    [...roleIds].filter((roleId) => roleId.length > 0)
  );
  if (!endpointRoles.has(pattern.rootRoleId)) {
    issues.push({ path: `${path}.rootRoleId`, message: `Missing ${endpoint} root role.` });
  }
}

function validateRoleRefs(
  references: readonly string[],
  path: string,
  roleIds: ReadonlySet<string>,
  issues: KpCanonicalOperationSpecIssue[]
): void {
  references.forEach((roleId, index) => {
    if (!roleIds.has(roleId)) {
      issues.push({ path: `${path}[${index}]`, message: `Unknown operation role ${roleId}.` });
    }
  });
}

function validatePhaseRefs(
  references: readonly string[],
  path: string,
  phaseIds: ReadonlySet<string>,
  issues: KpCanonicalOperationSpecIssue[]
): void {
  references.forEach((phaseId, index) => {
    if (!phaseIds.has(phaseId)) {
      issues.push({ path: `${path}[${index}]`, message: `Unknown motif phase ${phaseId}.` });
    }
  });
}

function rejectRendererInstructions(
  value: unknown,
  issues: KpCanonicalOperationSpecIssue[],
  path = "$"
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectRendererInstructions(item, issues, `${path}[${index}]`));
    return;
  }
  if (typeof value !== "object" || value === null) return;
  for (const [key, child] of Object.entries(value)) {
    if (/^(dom|svg|html|pixels?|coordinates?|keyframes?|rawTimeline)$/i.test(key)) {
      issues.push({ path: `${path}.${key}`, message: `Renderer instruction ${key} is not allowed.` });
    }
    rejectRendererInstructions(child, issues, `${path}.${key}`);
  }
}

function requireNonEmpty(
  value: string,
  path: string,
  issues: KpCanonicalOperationSpecIssue[]
): void {
  if (value.trim().length === 0) issues.push({ path, message: `${path} must not be empty.` });
}

