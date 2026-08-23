import type {
  KpCanonicalOperationPackPin
} from "../semantic/canonical-operation-pack.ts";
import type { CorrespondenceMap } from "../semantic/correspondence.ts";

export const kpEquationGrammarV2SchemaVersion =
  "kp.equation-grammar.v2" as const;

export type KpEquationProjectionIntentV2 =
  | "replacement"
  | "equivalence"
  | "derivation";

export interface KpEquationGrammarStateV2 {
  readonly id: string;
  readonly objectIds: readonly string[];
  readonly entityIds: readonly string[];
}

export interface KpEquationGrammarOperationV2 {
  readonly operationId: string;
  readonly roleBindings: Readonly<Record<string, readonly string[]>>;
  readonly correspondenceMap: CorrespondenceMap;
  readonly semanticAuthorityIds: readonly string[];
}

export interface KpEquationGrammarTransitionV2 {
  readonly id: string;
  readonly transformationId: string;
  readonly sourceStateId: string;
  readonly targetStateId: string;
  readonly operation: KpEquationGrammarOperationV2;
  readonly projection: {
    readonly intent: KpEquationProjectionIntentV2;
  };
  readonly typographyPolicyId: `typography.equation.${string}`;
  readonly teachingIntent: {
    readonly kind: "notice" | "compare" | "transmit" | "cause";
    readonly primaryEntityIds: readonly string[];
    readonly secondaryEntityIds: readonly string[];
    readonly summary: string;
  };
}

export interface KpEquationGrammarV2Input {
  readonly schemaVersion: typeof kpEquationGrammarV2SchemaVersion;
  readonly id: string;
  readonly assetId: string;
  readonly policyEpochId: "policy.animation.governance-v2.preview.1";
  readonly semanticSource: {
    readonly sourceId: string;
    readonly revisionId: string;
    readonly operationPacks: readonly KpCanonicalOperationPackPin[];
  };
  readonly clock: {
    readonly authority: "kp.shared-normalized-clock.v1";
  };
  readonly states: readonly KpEquationGrammarStateV2[];
  readonly transitions: readonly KpEquationGrammarTransitionV2[];
}

export interface KpEquationGrammarV2Diagnostic {
  readonly code:
    | "grammar.field.unsupported"
    | "grammar.id"
    | "grammar.schema"
    | "grammar.policy"
    | "grammar.clock"
    | "grammar.source"
    | "grammar.state"
    | "grammar.transition"
    | "grammar.operation"
    | "grammar.correspondence"
    | "grammar.projection"
    | "grammar.typography"
    | "grammar.reference";
  readonly path: string;
  readonly message: string;
}

declare const kpEquationGrammarV2Authority: unique symbol;

export type KpCompiledEquationGrammarV2 = Readonly<
  KpEquationGrammarV2Input & {
    readonly kind: "compiled-equation-grammar-v2";
    readonly operationResolution: "per-transition";
    readonly presentationAuthority: "policy-and-registries";
    readonly [kpEquationGrammarV2Authority]: true;
  }
>;

export type KpEquationGrammarV2CompilationResult =
  | {
      readonly status: "compiled";
      readonly grammar: KpCompiledEquationGrammarV2;
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "invalid";
      readonly diagnostics: readonly KpEquationGrammarV2Diagnostic[];
    };

const compiledGrammars = new WeakSet<object>();

export function compileKpEquationGrammarV2(
  input: KpEquationGrammarV2Input
): KpEquationGrammarV2CompilationResult {
  const diagnostics = validateKpEquationGrammarV2(input);
  if (diagnostics.length > 0) {
    return Object.freeze({
      status: "invalid" as const,
      diagnostics: Object.freeze(diagnostics)
    });
  }
  const grammar = deepFreeze({
    schemaVersion: kpEquationGrammarV2SchemaVersion,
    kind: "compiled-equation-grammar-v2" as const,
    id: input.id,
    assetId: input.assetId,
    policyEpochId: input.policyEpochId,
    semanticSource: {
      sourceId: input.semanticSource.sourceId,
      revisionId: input.semanticSource.revisionId,
      operationPacks: input.semanticSource.operationPacks.map((pin) => ({
        packId: pin.packId,
        version: pin.version
      }))
    },
    clock: { authority: "kp.shared-normalized-clock.v1" as const },
    states: input.states.map((state) => ({
      id: state.id,
      objectIds: [...state.objectIds],
      entityIds: [...state.entityIds]
    })),
    transitions: input.transitions.map((transition) => ({
      id: transition.id,
      transformationId: transition.transformationId,
      sourceStateId: transition.sourceStateId,
      targetStateId: transition.targetStateId,
      operation: {
        operationId: transition.operation.operationId,
        roleBindings: Object.fromEntries(Object.entries(
          transition.operation.roleBindings
        ).map(([roleId, entityIds]) => [roleId, [...entityIds]])),
        correspondenceMap: {
          id: transition.operation.correspondenceMap.id,
          records: transition.operation.correspondenceMap.records.map(
            (record) => ({
              ...record,
              sourceSelectorIds: [...record.sourceSelectorIds],
              targetSelectorIds: [...record.targetSelectorIds]
            })
          )
        },
        semanticAuthorityIds: [
          ...transition.operation.semanticAuthorityIds
        ]
      },
      projection: { intent: transition.projection.intent },
      typographyPolicyId: transition.typographyPolicyId,
      teachingIntent: {
        ...transition.teachingIntent,
        primaryEntityIds: [...transition.teachingIntent.primaryEntityIds],
        secondaryEntityIds: [...transition.teachingIntent.secondaryEntityIds]
      }
    })),
    operationResolution: "per-transition" as const,
    presentationAuthority: "policy-and-registries" as const
  }) as unknown as KpCompiledEquationGrammarV2;
  compiledGrammars.add(grammar);
  return Object.freeze({
    status: "compiled" as const,
    grammar,
    diagnostics: Object.freeze([]) as readonly []
  });
}

export function isKpCompiledEquationGrammarV2(
  value: unknown
): value is KpCompiledEquationGrammarV2 {
  return typeof value === "object" && value !== null &&
    compiledGrammars.has(value);
}

export function validateKpEquationGrammarV2(
  input: KpEquationGrammarV2Input
): KpEquationGrammarV2Diagnostic[] {
  const diagnostics: KpEquationGrammarV2Diagnostic[] = [];
  rejectUnknown(input, [
    "schemaVersion", "id", "assetId", "policyEpochId", "semanticSource",
    "clock", "states", "transitions"
  ], "$", diagnostics);
  if (input.schemaVersion !== kpEquationGrammarV2SchemaVersion) {
    add(diagnostics, "grammar.schema", "$.schemaVersion",
      `Expected ${kpEquationGrammarV2SchemaVersion}.`);
  }
  nonempty(input.id, "$.id", "grammar.id", diagnostics);
  nonempty(input.assetId, "$.assetId", "grammar.id", diagnostics);
  if (input.policyEpochId !== "policy.animation.governance-v2.preview.1") {
    add(diagnostics, "grammar.policy", "$.policyEpochId",
      "Equation grammar v2 requires its pinned governance-v2 epoch.");
  }
  rejectUnknown(input.clock, ["authority"], "$.clock", diagnostics);
  if (input.clock.authority !== "kp.shared-normalized-clock.v1") {
    add(diagnostics, "grammar.clock", "$.clock.authority",
      "Equation grammar v2 uses one shared normalized clock.");
  }
  validateSource(input, diagnostics);
  validateStatesAndTransitions(input, diagnostics);
  return diagnostics;
}

function validateSource(
  input: KpEquationGrammarV2Input,
  diagnostics: KpEquationGrammarV2Diagnostic[]
): void {
  rejectUnknown(input.semanticSource,
    ["sourceId", "revisionId", "operationPacks"],
    "$.semanticSource", diagnostics);
  nonempty(input.semanticSource.sourceId, "$.semanticSource.sourceId",
    "grammar.source", diagnostics);
  nonempty(input.semanticSource.revisionId, "$.semanticSource.revisionId",
    "grammar.source", diagnostics);
  if (input.semanticSource.operationPacks.length === 0) {
    add(diagnostics, "grammar.source", "$.semanticSource.operationPacks",
      "Equation grammar v2 requires pinned operation packs.");
  }
}

function validateStatesAndTransitions(
  input: KpEquationGrammarV2Input,
  diagnostics: KpEquationGrammarV2Diagnostic[]
): void {
  const states = new Map<string, KpEquationGrammarStateV2>();
  input.states.forEach((state, index) => {
    const path = `$.states[${index}]`;
    rejectUnknown(state, ["id", "objectIds", "entityIds"], path, diagnostics);
    if (state.id.trim() === "" || states.has(state.id) ||
      state.objectIds.length === 0 || state.entityIds.length === 0) {
      add(diagnostics, "grammar.state", path,
        "States require a unique id plus nonempty object and entity IDs.");
    }
    states.set(state.id, state);
  });
  if (states.size === 0) {
    add(diagnostics, "grammar.state", "$.states",
      "Equation grammar v2 requires states.");
  }
  const transitionIds = new Set<string>();
  input.transitions.forEach((transition, index) => {
    const path = `$.transitions[${index}]`;
    rejectUnknown(transition, [
      "id", "transformationId", "sourceStateId", "targetStateId",
      "operation", "projection", "typographyPolicyId", "teachingIntent"
    ], path, diagnostics);
    if (transition.id.trim() === "" || transitionIds.has(transition.id)) {
      add(diagnostics, "grammar.transition", `${path}.id`,
        "Transitions require unique nonempty ids.");
    }
    transitionIds.add(transition.id);
    if (!states.has(transition.sourceStateId) ||
      !states.has(transition.targetStateId)) {
      add(diagnostics, "grammar.reference", path,
        "Transition state references must resolve inside the grammar.");
    }
    validateTransition(transition, path, states, diagnostics);
  });
  if (input.transitions.length === 0) {
    add(diagnostics, "grammar.transition", "$.transitions",
      "Equation grammar v2 requires transitions.");
  }
}

function validateTransition(
  transition: KpEquationGrammarTransitionV2,
  path: string,
  states: ReadonlyMap<string, KpEquationGrammarStateV2>,
  diagnostics: KpEquationGrammarV2Diagnostic[]
): void {
  rejectUnknown(transition.operation, [
    "operationId", "roleBindings", "correspondenceMap",
    "semanticAuthorityIds"
  ], `${path}.operation`, diagnostics);
  if (transition.operation.operationId.trim() === "" ||
    Object.keys(transition.operation.roleBindings).length === 0 ||
    transition.operation.semanticAuthorityIds.length === 0) {
    add(diagnostics, "grammar.operation", `${path}.operation`,
      "Each transition requires its own operation, roles, and semantic authority.");
  }
  if (transition.operation.correspondenceMap.records.length === 0) {
    add(diagnostics, "grammar.correspondence",
      `${path}.operation.correspondenceMap`,
      "Moving equation transitions require explicit semantic correspondence.");
  }
  rejectUnknown(transition.projection, ["intent"],
    `${path}.projection`, diagnostics);
  if (!["replacement", "equivalence", "derivation"].includes(
    transition.projection.intent
  )) {
    add(diagnostics, "grammar.projection", `${path}.projection.intent`,
      "Each transition requires a registered projection intent.");
  }
  if (!transition.typographyPolicyId.startsWith("typography.equation.")) {
    add(diagnostics, "grammar.typography", `${path}.typographyPolicyId`,
      "Each transition requires an equation typography policy reference.");
  }
  const source = states.get(transition.sourceStateId);
  const target = states.get(transition.targetStateId);
  const entities = new Set([
    ...(source?.entityIds ?? []),
    ...(target?.entityIds ?? [])
  ]);
  for (const entityId of Object.values(
    transition.operation.roleBindings
  ).flat()) {
    if (!entities.has(entityId)) {
      add(diagnostics, "grammar.reference", `${path}.operation.roleBindings`,
        `Operation role references foreign entity ${entityId}.`);
    }
  }
}

function rejectUnknown(
  value: object,
  allowed: readonly string[],
  path: string,
  diagnostics: KpEquationGrammarV2Diagnostic[]
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      add(diagnostics, "grammar.field.unsupported", `${path}.${key}`,
        `Equation grammar v2 does not permit ${key}.`);
    }
  }
}

function nonempty(
  value: string,
  path: string,
  code: KpEquationGrammarV2Diagnostic["code"],
  diagnostics: KpEquationGrammarV2Diagnostic[]
): void {
  if (value.trim() === "") add(diagnostics, code, path, "Value must not be empty.");
}

function add(
  diagnostics: KpEquationGrammarV2Diagnostic[],
  code: KpEquationGrammarV2Diagnostic["code"],
  path: string,
  message: string
): void {
  diagnostics.push({ code, path, message });
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}
