import {
  createKpCanonicalOperationProjectPins,
  type KpCanonicalOperationPackPin,
  type KpCanonicalOperationProjectPins
} from "../semantic/canonical-operation-pack.ts";
import {
  kpCanonicalOperationRegistry,
  resolveKpCanonicalOperation
} from "../semantic/canonical-operation-registry.ts";
import type { KpSemanticEntityProvenance } from "../semantic/semantic-entity-provenance.ts";
import type { KpEpistemicAnnotation } from "../semantic/epistemic-status.ts";
import type { KpAnimationSaliencePlan } from "./salience-plan.ts";
import type { SelectorCorrespondenceRelationId } from "../semantic/correspondence.ts";
import type { KpCanonicalOperationOwnershipMode } from "../semantic/canonical-operation-contract.ts";
import {
  validateKpLlmAnimationDraftSchema,
  type KpLlmAnimationDraft,
  type KpLlmAnimationDraftCorrespondenceRecord
} from "./llm-animation-draft.ts";

export const kpLlmAnimationDraftV2SchemaVersion = "kp.llm-animation-draft.v2" as const;
export const kpLlmAuthorCompilerBoundaryVersion =
  "kp.author-compiler-boundary.v2" as const;

export type KpLlmAnimationExplanationDepth =
  | "compact"
  | "standard"
  | "expanded";

export interface KpLlmAnimationDraftV2LineageBinding {
  readonly relation: SelectorCorrespondenceRelationId;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
}

export interface KpLlmAnimationDraftV2Entity {
  readonly id: string;
  readonly semanticKind: string;
  readonly label: string;
  readonly parentId?: string | undefined;
  readonly provenance: KpSemanticEntityProvenance;
}

export interface KpLlmAnimationDraftV2State {
  readonly id: string;
  readonly title: string;
  readonly surfaceKind: "equation" | "diagram";
  readonly content: { readonly latex: string } | { readonly sceneId: string };
  readonly entities: readonly KpLlmAnimationDraftV2Entity[];
  readonly epistemic: KpEpistemicAnnotation;
}

export interface KpLlmAnimationDraftV2Operation {
  readonly id: string;
  readonly operationId: string;
  readonly roleBindings: Readonly<Record<string, readonly string[]>>;
  readonly lineageBindings: readonly KpLlmAnimationDraftV2LineageBinding[];
  readonly ownershipMode: KpCanonicalOperationOwnershipMode;
  readonly explanationDepth: KpLlmAnimationExplanationDepth;
}

export interface KpLlmAnimationDraftV2Derivation {
  readonly id: string;
  readonly title: string;
  readonly sourceStateIds: readonly string[];
  readonly targetStateIds: readonly string[];
  readonly operations: readonly KpLlmAnimationDraftV2Operation[];
  readonly provenance: KpSemanticEntityProvenance;
  readonly epistemic: KpEpistemicAnnotation;
}

export interface KpLlmAnimationDraftV2 {
  readonly schemaVersion: typeof kpLlmAnimationDraftV2SchemaVersion;
  readonly authorCompilerBoundaryVersion: typeof kpLlmAuthorCompilerBoundaryVersion;
  readonly id: string;
  readonly title: string;
  readonly authoringContext: {
    readonly source: "student-prompt" | "uploaded-material";
    readonly targetMathAuthority: "requires-validation" | "trusted-source-evidence";
    readonly historicalReplayRequested: boolean;
  };
  readonly operationPacks: readonly KpCanonicalOperationPackPin[];
  readonly states: readonly KpLlmAnimationDraftV2State[];
  readonly derivations: readonly KpLlmAnimationDraftV2Derivation[];
  readonly saliencePlan: KpAnimationSaliencePlan;
}

export interface KpLlmAnimationDraftV2Issue {
  readonly path: string;
  readonly code: "draft-v2.type" | "draft-v2.required" | "draft-v2.reference" | "draft-v2.operation" | "draft-v2.unsafe" | "draft-v2.compatibility";
  readonly message: string;
}

export type KpVersionedLlmAnimationDraftReadResult =
  | { readonly status: "accepted-v2"; readonly sourceVersion: "v2"; readonly draft: KpLlmAnimationDraftV2; readonly issues: readonly [] }
  | { readonly status: "migrated-v1"; readonly sourceVersion: "v1"; readonly draft: KpLlmAnimationDraftV2; readonly issues: readonly [] }
  | { readonly status: "rejected"; readonly issues: readonly KpLlmAnimationDraftV2Issue[] };

export function readKpVersionedLlmAnimationDraft(value: unknown): KpVersionedLlmAnimationDraftReadResult {
  if (isRecord(value) && value["schemaVersion"] === kpLlmAnimationDraftV2SchemaVersion) {
    const issues = validateKpLlmAnimationDraftV2(value);
    return issues.length === 0
      ? { status: "accepted-v2", sourceVersion: "v2", draft: value as unknown as KpLlmAnimationDraftV2, issues: [] }
      : { status: "rejected", issues };
  }
  const v1Issues = validateKpLlmAnimationDraftSchema(value);
  if (v1Issues.length > 0) {
    return {
      status: "rejected",
      issues: v1Issues.map((issue) => ({
        path: issue.path,
        code: "draft-v2.type" as const,
        message: issue.message
      }))
    };
  }
  const draft = migrateKpLlmAnimationDraftV1(value as KpLlmAnimationDraft);
  const issues = validateKpLlmAnimationDraftV2(draft);
  return issues.length === 0
    ? { status: "migrated-v1", sourceVersion: "v1", draft, issues: [] }
    : { status: "rejected", issues };
}

export function validateKpLlmAnimationDraftV2(value: unknown): readonly KpLlmAnimationDraftV2Issue[] {
  const issues: KpLlmAnimationDraftV2Issue[] = [];
  if (!isRecord(value)) return [{ path: "$", code: "draft-v2.type", message: "Draft v2 must be an object." }];
  if (value["schemaVersion"] !== kpLlmAnimationDraftV2SchemaVersion) {
    issues.push({ path: "$.schemaVersion", code: "draft-v2.required", message: `Expected ${kpLlmAnimationDraftV2SchemaVersion}.` });
  }
  if (value["authorCompilerBoundaryVersion"] !== kpLlmAuthorCompilerBoundaryVersion) {
    issues.push({
      path: "$.authorCompilerBoundaryVersion",
      code: "draft-v2.compatibility",
      message:
        `Legacy V2 drafts must add ${kpLlmAuthorCompilerBoundaryVersion}, authoringContext, and explicit lineageBindings, ownershipMode, and explanationDepth for every operation.`
    });
  }
  const draft = value as unknown as KpLlmAnimationDraftV2;
  validateAuthoringContext(draft, issues);
  const pins = projectPins(draft.operationPacks, issues);
  const stateIds = uniqueIds(draft.states, "$.states", issues);
  const entityIds = new Set<string>();
  draft.states.forEach((state, stateIndex) => {
    requireText(state.id, `$.states[${stateIndex}].id`, issues);
    if (state.epistemic?.subject.id !== state.id || state.epistemic?.subject.kind !== "state") {
      issues.push({ path: `$.states[${stateIndex}].epistemic.subject`, code: "draft-v2.reference", message: `State ${state.id} epistemic subject must reference itself.` });
    }
    state.entities.forEach((entity, entityIndex) => {
      if (entityIds.has(entity.id)) issues.push({ path: `$.states[${stateIndex}].entities[${entityIndex}].id`, code: "draft-v2.reference", message: `Duplicate draft entity ${entity.id}.` });
      entityIds.add(entity.id);
      requireText(entity.semanticKind, `$.states[${stateIndex}].entities[${entityIndex}].semanticKind`, issues);
      validateProvenance(entity.provenance, `$.states[${stateIndex}].entities[${entityIndex}].provenance`, issues);
    });
  });
  uniqueIds(draft.derivations, "$.derivations", issues);
  draft.derivations.forEach((derivation, index) => {
    const path = `$.derivations[${index}]`;
    referenceIds(derivation.sourceStateIds, stateIds, `${path}.sourceStateIds`, issues);
    referenceIds(derivation.targetStateIds, stateIds, `${path}.targetStateIds`, issues);
    if (derivation.epistemic?.subject.id !== derivation.id || derivation.epistemic?.subject.kind !== "transition") {
      issues.push({ path: `${path}.epistemic.subject`, code: "draft-v2.reference", message: `Derivation ${derivation.id} epistemic subject must reference itself.` });
    }
    validateProvenance(derivation.provenance, `${path}.provenance`, issues);
    if (!Array.isArray(derivation.operations) || derivation.operations.length === 0) {
      issues.push({ path: `${path}.operations`, code: "draft-v2.required", message: `Derivation ${derivation.id} requires a registered operation.` });
      return;
    }
    derivation.operations.forEach((operation, operationIndex) =>
      validateOperation(operation, `${path}.operations[${operationIndex}]`, pins, entityIds, issues)
    );
  });
  validateTargetMathAuthority(draft, issues);
  salienceEntityRefs(draft.saliencePlan).forEach((id) => {
    if (!entityIds.has(id)) issues.push({ path: "$.saliencePlan", code: "draft-v2.reference", message: `Salience plan references missing entity ${id}.` });
  });
  rejectUnsafe(value, issues);
  return issues;
}

export function migrateKpLlmAnimationDraftV1(draft: KpLlmAnimationDraft): KpLlmAnimationDraftV2 {
  const states: KpLlmAnimationDraftV2State[] = draft.objects.map((object) => {
    const selectorData = "latex" in object
      ? object.selectors.map((selector) => ({ id: selector.id, semanticKind: selector.kind, label: selector.label ?? selector.id }))
      : [
          ...object.scene.nodes.map((item) => ({ id: item.selectorId, semanticKind: "diagram-node", label: item.label })),
          ...object.scene.edges.map((item) => ({ id: item.selectorId, semanticKind: "diagram-edge", label: item.id })),
          ...object.scene.groups.map((item) => ({ id: item.selectorId, semanticKind: "diagram-group", label: item.label })),
          ...object.scene.labels.map((item) => ({ id: item.selectorId, semanticKind: "diagram-label", label: item.text }))
        ];
    return {
      id: object.id,
      title: object.title,
      surfaceKind: "latex" in object ? "equation" : "diagram",
      content: "latex" in object ? { latex: object.latex } : { sceneId: object.id },
      entities: selectorData.map((selector) => ({
        ...selector,
        provenance: { kind: "authored" as const, sourceId: draft.id }
      })),
      epistemic: epistemic(object.id, "state", "valid", `Migrated from trusted ${draft.schemaVersion} input.`)
    };
  });
  return {
    schemaVersion: kpLlmAnimationDraftV2SchemaVersion,
    authorCompilerBoundaryVersion: kpLlmAuthorCompilerBoundaryVersion,
    id: draft.id,
    title: draft.title,
    authoringContext: {
      source: "uploaded-material",
      targetMathAuthority: "requires-validation",
      historicalReplayRequested: false
    },
    operationPacks: [{ packId: "kp.core", version: "1.0.0" }],
    states,
    derivations: draft.transformations.map((transformation) => ({
      id: transformation.id,
      title: transformation.title,
      sourceStateIds: [...transformation.sourceObjectIds],
      targetStateIds: [...transformation.targetObjectIds],
      operations: transformation.correspondenceMap.records.flatMap((record) => migrateRecord(record)),
      provenance: { kind: "authored", sourceId: draft.id },
      epistemic: epistemic(transformation.id, "transition", "unverified", "Migrated semantics retain the v1 correspondence evidence and require v2 verification.")
    })),
    saliencePlan: { id: `${draft.id}.salience`, kind: "animation-salience-plan", intents: [] }
  };
}

function migrateRecord(record: KpLlmAnimationDraftCorrespondenceRecord): readonly KpLlmAnimationDraftV2Operation[] {
  const operation = (
    suffix: string,
    operationId: string,
    roleBindings: Readonly<Record<string, readonly string[]>>,
    lineage: KpLlmAnimationDraftV2LineageBinding,
    ownershipMode: KpCanonicalOperationOwnershipMode = "continuant"
  ): KpLlmAnimationDraftV2Operation => ({
    id: `${record.id}.${suffix}`,
    operationId,
    roleBindings,
    lineageBindings: [lineage],
    ownershipMode,
    explanationDepth: "standard"
  });
  const lineage = (
    sourceEntityIds: readonly string[],
    targetEntityIds: readonly string[]
  ): KpLlmAnimationDraftV2LineageBinding => ({
    relation: record.relation,
    sourceEntityIds,
    targetEntityIds
  });
  switch (record.relation) {
    case "identity":
    case "role-change":
      return [operation("persist", "kp.core.persist", { before: [record.sourceSelectorIds[0]!], after: [record.targetSelectorIds[0]!] }, lineage(record.sourceSelectorIds, record.targetSelectorIds))];
    case "introduction":
      return record.targetSelectorIds.map((id, index) => operation(`introduce-${index}`, "kp.core.introduce", { introduced: [id] }, lineage([], [id])));
    case "removal":
    case "cancelation":
      return record.sourceSelectorIds.map((id, index) => operation(`eliminate-${index}`, "kp.core.eliminate", { eliminated: [id] }, lineage([id], [])));
    case "fan-in":
      return [operation("merge", "kp.core.merge", { sources: record.sourceSelectorIds, result: record.targetSelectorIds }, lineage(record.sourceSelectorIds, record.targetSelectorIds), "fission-fusion")];
    case "fan-out":
      return [operation("fan-out", "kp.core.fan-out", { source: record.sourceSelectorIds, destinations: record.targetSelectorIds }, lineage(record.sourceSelectorIds, record.targetSelectorIds), "fission-fusion")];
    case "artifact":
      return record.targetSelectorIds.length > 0
        ? record.targetSelectorIds.map((id, index) => operation(`introduce-artifact-${index}`, "kp.core.introduce", { introduced: [id] }, lineage([], [id])))
        : record.sourceSelectorIds.map((id, index) => operation(`eliminate-artifact-${index}`, "kp.core.eliminate", { eliminated: [id] }, lineage([id], [])));
    case "focus":
      return [];
  }
}

function validateOperation(operation: KpLlmAnimationDraftV2Operation, path: string, pins: KpCanonicalOperationProjectPins | undefined, entityIds: ReadonlySet<string>, issues: KpLlmAnimationDraftV2Issue[]): void {
  if (pins === undefined) return;
  const resolution = resolveKpCanonicalOperation({ registry: kpCanonicalOperationRegistry, pins, operationId: operation.operationId });
  if (resolution.status !== "resolved") {
    issues.push({ path: `${path}.operationId`, code: "draft-v2.operation", message: resolution.message });
    return;
  }
  Object.entries(operation.roleBindings).forEach(([roleId, ids]) => ids.forEach((id) => {
    if (!entityIds.has(id)) issues.push({ path: `${path}.roleBindings.${roleId}`, code: "draft-v2.reference", message: `Operation ${operation.id} references missing entity ${id}.` });
  }));
  const roles = resolution.entry.contract.roles;
  roles.forEach((role) => {
    const count = operation.roleBindings[role.id]?.length ?? 0;
    const valid = role.cardinality === "exactly-one"
      ? count === 1
      : role.cardinality === "zero-or-one"
        ? count <= 1
        : count >= 1;
    if (!valid) issues.push({ path: `${path}.roleBindings.${role.id}`, code: "draft-v2.operation", message: `Operation ${operation.id} role ${role.id} requires ${role.cardinality}; received ${count}.` });
  });
  Object.keys(operation.roleBindings)
    .filter((roleId) => !roles.some((role) => role.id === roleId))
    .forEach((roleId) => {
      issues.push({ path: `${path}.roleBindings.${roleId}`, code: "draft-v2.operation", message: `Operation ${operation.id} binds unknown role ${roleId}.` });
    });
  if (operation.ownershipMode !== resolution.entry.contract.ownershipMode) {
    issues.push({
      path: `${path}.ownershipMode`,
      code: "draft-v2.operation",
      message:
        `Operation ${operation.id} requires ${resolution.entry.contract.ownershipMode} ownership; received ${String(operation.ownershipMode)}.`
    });
  }
  if (!["compact", "standard", "expanded"].includes(operation.explanationDepth)) {
    issues.push({
      path: `${path}.explanationDepth`,
      code: "draft-v2.required",
      message: `Operation ${operation.id} requires compact, standard, or expanded explanation depth.`
    });
  }
  if (!Array.isArray(operation.lineageBindings) || operation.lineageBindings.length === 0) {
    issues.push({
      path: `${path}.lineageBindings`,
      code: "draft-v2.required",
      message: `Operation ${operation.id} requires explicit semantic lineage.`
    });
  } else {
    const boundEntityIds = new Set(Object.values(operation.roleBindings).flat());
    operation.lineageBindings.forEach((lineage, index) => {
      const lineagePath = `${path}.lineageBindings[${index}]`;
      if (!resolution.entry.contract.lineageRelationIds.includes(lineage.relation)) {
        issues.push({
          path: `${lineagePath}.relation`,
          code: "draft-v2.operation",
          message: `Operation ${operation.id} does not permit ${lineage.relation} lineage.`
        });
      }
      [...lineage.sourceEntityIds, ...lineage.targetEntityIds].forEach((id) => {
        if (!entityIds.has(id)) {
          issues.push({ path: lineagePath, code: "draft-v2.reference", message: `Operation ${operation.id} lineage references missing entity ${id}.` });
        } else if (!boundEntityIds.has(id)) {
          issues.push({ path: lineagePath, code: "draft-v2.operation", message: `Operation ${operation.id} lineage entity ${id} is not bound to an operation role.` });
        }
      });
    });
  }
}

function projectPins(value: readonly KpCanonicalOperationPackPin[] | undefined, issues: KpLlmAnimationDraftV2Issue[]): KpCanonicalOperationProjectPins | undefined {
  try {
    if (!Array.isArray(value) || value.length === 0) throw new Error("Draft v2 requires exact operation-pack pins.");
    return createKpCanonicalOperationProjectPins(value);
  } catch (error) {
    issues.push({ path: "$.operationPacks", code: "draft-v2.operation", message: error instanceof Error ? error.message : String(error) });
    return undefined;
  }
}

function epistemic(id: string, kind: "state" | "transition", status: KpEpistemicAnnotation["status"], rationale: string): KpEpistemicAnnotation {
  return { kind: "epistemic-annotation", subject: { kind, id }, status, rationale, evidenceIds: [], disclosure: { trigger: { kind: "immediate" }, announce: false } };
}

function validateProvenance(value: KpSemanticEntityProvenance | undefined, path: string, issues: KpLlmAnimationDraftV2Issue[]): void {
  if (value === undefined || !["parsed", "inferred", "authored", "pedagogical"].includes(value.kind)) issues.push({ path, code: "draft-v2.required", message: `${path} requires explicit provenance.` });
}

function validateAuthoringContext(
  draft: KpLlmAnimationDraftV2,
  issues: KpLlmAnimationDraftV2Issue[]
): void {
  const context = draft.authoringContext;
  if (context === undefined ||
      !["student-prompt", "uploaded-material"].includes(context.source) ||
      !["requires-validation", "trusted-source-evidence"].includes(
        context.targetMathAuthority
      ) ||
      typeof context.historicalReplayRequested !== "boolean") {
    issues.push({
      path: "$.authoringContext",
      code: "draft-v2.required",
      message:
        "Draft v2 requires an explicit source, target-math authority, and historical-replay choice."
    });
    return;
  }
  if (context.source === "student-prompt" &&
      context.targetMathAuthority !== "requires-validation") {
    issues.push({
      path: "$.authoringContext.targetMathAuthority",
      code: "draft-v2.unsafe",
      message: "Student prompts cannot self-authorize target mathematics."
    });
  }
  if (context.historicalReplayRequested && context.source !== "uploaded-material") {
    issues.push({
      path: "$.authoringContext.historicalReplayRequested",
      code: "draft-v2.unsafe",
      message: "Historical incorrect replay is available only for uploaded material."
    });
  }
}

function validateTargetMathAuthority(
  draft: KpLlmAnimationDraftV2,
  issues: KpLlmAnimationDraftV2Issue[]
): void {
  const context = draft.authoringContext;
  if (context === undefined) return;
  const targetIds = new Set(draft.derivations.flatMap((item) => item.targetStateIds));
  const targets = draft.states.filter((state) => targetIds.has(state.id));
  if (context.targetMathAuthority === "trusted-source-evidence") {
    targets.forEach((state) => {
      if (state.epistemic.status !== "valid" || state.epistemic.evidenceIds.length === 0) {
        issues.push({
          path: `$.states[${draft.states.indexOf(state)}].epistemic`,
          code: "draft-v2.unsafe",
          message: `Target state ${state.id} requires valid source evidence before trusted settlement.`
        });
      }
    });
  }
  if (context.historicalReplayRequested) {
    const hasIncorrectTarget = targets.some((state) =>
      ["invalid", "misconception", "counterexample"].includes(state.epistemic.status)
    );
    if (!hasIncorrectTarget) {
      issues.push({
        path: "$.authoringContext.historicalReplayRequested",
        code: "draft-v2.unsafe",
        message: "Historical replay requires an explicitly incorrect target state."
      });
    }
  }
}

function salienceEntityRefs(plan: KpAnimationSaliencePlan | undefined): readonly string[] {
  if (plan === undefined || !Array.isArray(plan.intents)) return [];
  return plan.intents.flatMap((intent) => {
    switch (intent.kind) {
      case "notice": case "predict": case "question": case "reveal": return intent.targetEntityIds;
      case "compare": return [...intent.leftEntityIds, ...intent.rightEntityIds];
      case "transmit": return [...intent.sourceEntityIds, ...intent.targetEntityIds];
      case "supporting-context": return intent.contextEntityIds;
    }
  });
}

function uniqueIds(values: readonly { readonly id: string }[] | undefined, path: string, issues: KpLlmAnimationDraftV2Issue[]): ReadonlySet<string> {
  const ids = new Set<string>();
  if (!Array.isArray(values) || values.length === 0) { issues.push({ path, code: "draft-v2.required", message: `${path} must not be empty.` }); return ids; }
  values.forEach((value, index) => { if (ids.has(value.id)) issues.push({ path: `${path}[${index}].id`, code: "draft-v2.reference", message: `Duplicate id ${value.id}.` }); ids.add(value.id); });
  return ids;
}

function referenceIds(ids: readonly string[], available: ReadonlySet<string>, path: string, issues: KpLlmAnimationDraftV2Issue[]): void { ids.forEach((id) => { if (!available.has(id)) issues.push({ path, code: "draft-v2.reference", message: `Unknown state ${id}.` }); }); }
function requireText(value: string, path: string, issues: KpLlmAnimationDraftV2Issue[]): void { if (typeof value !== "string" || value.trim().length === 0) issues.push({ path, code: "draft-v2.required", message: `${path} must not be empty.` }); }
function rejectUnsafe(value: unknown, issues: KpLlmAnimationDraftV2Issue[], path = "$"): void { if (Array.isArray(value)) return void value.forEach((item, index) => rejectUnsafe(item, issues, `${path}[${index}]`)); if (!isRecord(value)) return; Object.entries(value).forEach(([key, child]) => { if (/^(dom|svg|html|pixels?|coordinates?|x|y|z|path|motionPath|keyframes?|trajectory|timing|durationMs|delayMs|staggerMs|primitiveId|motionPrimitive|easing|bezier|spring|transform|translate|scale|rotate|opacity|shadow|zIndex)$/i.test(key)) issues.push({ path: `${path}.${key}`, code: "draft-v2.unsafe", message: `Renderer instruction ${key} is not allowed in draft v2.` }); rejectUnsafe(child, issues, `${path}.${key}`); }); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
