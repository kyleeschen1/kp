import type { KpSchemeSourceDocument, KpSchemeSourceExpression } from
  "../semantic/scheme-factorial-source-model.ts";
import type { KpSchemeTrace, KpSchemeTraceEvent } from
  "../semantic/scheme-factorial-trace.ts";

export type KpSchemeFirstExpansionAction =
  | {
      readonly id: string;
      readonly kind: "OpenCall";
      readonly eventIds: readonly string[];
      readonly callExpressionId: string;
      readonly bodyExpressionId: string;
    }
  | {
      readonly id: string;
      readonly kind: "BindValue";
      readonly eventIds: readonly string[];
      readonly argumentMaterialId: string;
      readonly parameterOccurrenceId: string;
      readonly bindingId: string;
      readonly valueId: string;
    }
  | {
      readonly id: string;
      readonly kind: "ChooseBranch";
      readonly eventIds: readonly string[];
      readonly conditionalExpressionId: string;
      readonly selectedExpressionId: string;
      readonly dormantExpressionId: string;
    }
  | {
      readonly id: string;
      readonly kind: "SuspendExpression";
      readonly eventIds: readonly string[];
      readonly expressionId: string;
      readonly continuationId: string;
      readonly retainedMaterialIds: readonly string[];
    }
  | {
      readonly id: string;
      readonly kind: "ResolveExpression";
      readonly eventIds: readonly string[];
      readonly expressionId: string;
      readonly resultValueId: string;
      readonly targetMaterialId: string;
    };

export interface KpSchemeCodeMaterialToken {
  readonly id: string;
  readonly lexeme: string;
  readonly span: { readonly start: number; readonly end: number };
  readonly originExpressionIds: readonly string[];
  readonly runtimeIds: readonly string[];
  readonly introducedByActionId: string | null;
}

export interface KpSchemeCodeMaterialState {
  readonly id: "call" | "suspended-product";
  readonly nativeCode: string;
  readonly tokens: readonly KpSchemeCodeMaterialToken[];
}

export interface KpSchemeMaterialDisposition {
  readonly sourceMaterialId: string;
  readonly kind: "transform" | "continue" | "withdraw";
  readonly targetMaterialId: string | null;
  readonly actionIds: readonly string[];
  readonly rationale: string;
}

export interface KpSchemeFirstExpansion {
  readonly schemaVersion: "kp.scheme-factorial-first-expansion.v1";
  readonly id: "scheme-factorial.first-expansion";
  readonly source: KpSchemeCodeMaterialState;
  readonly target: KpSchemeCodeMaterialState;
  readonly actions: readonly KpSchemeFirstExpansionAction[];
  readonly dispositions: readonly KpSchemeMaterialDisposition[];
  readonly accessibleDescription: string;
}

export interface KpSchemeFirstExpansionSample {
  readonly progress: number;
  readonly phase: "orient" | "open" | "bind" | "resolve" | "settle";
  readonly nativeCode: string;
  readonly tokens: readonly {
    readonly motionId: string;
    readonly sourceMaterialId: string | null;
    readonly targetMaterialId: string;
    readonly lexeme: string;
    readonly xCh: number;
    readonly yEm: number;
    readonly opacity: number;
    readonly scale: number;
    readonly originExpressionIds: readonly string[];
    readonly runtimeIds: readonly string[];
  }[];
}

/**
 * Compiles one visual claim from trace facts. It deliberately does not expose
 * checkpoint rows: the transformed S-expression is the only material owner.
 */
export function compileKpSchemeFactorialFirstExpansion(input: {
  readonly document: KpSchemeSourceDocument;
  readonly trace: KpSchemeTrace;
}): KpSchemeFirstExpansion {
  const invocation = listAt(input.document, [1]);
  const invocationOperator = atomAt(input.document, [1, 0]);
  const invocationArgument = atomAt(input.document, [1, 1]);
  const body = listAt(input.document, [0, 2]);
  const alternative = listAt(input.document, [0, 2, 3]);
  const alternativeOperator = atomAt(input.document, [0, 2, 3, 0]);
  const recursiveCall = listAt(input.document, [0, 2, 3, 2]);
  const recursiveOperator = atomAt(input.document, [0, 2, 3, 2, 0]);
  const decrement = listAt(input.document, [0, 2, 3, 2, 1]);
  const parameter = atomAt(input.document, [0, 1, 1]);
  const base = atomAt(input.document, [0, 2, 2]);
  const bound = requiredEvent(input.trace, (event) =>
    event.kind === "parameter-bound" &&
    event.applicationExpressionId === invocation.id);
  if (bound.kind !== "parameter-bound") throw new Error("Unreachable binding kind.");
  const branch = requiredEvent(input.trace, (event) =>
    event.kind === "branch-selected" &&
    event.conditionalExpressionId === body.id && event.branch === "alternative");
  if (branch.kind !== "branch-selected") throw new Error("Unreachable branch kind.");
  const suspended = requiredEvent(input.trace, (event) =>
    event.kind === "call-suspended" &&
    event.applicationExpressionId === alternative.id);
  if (suspended.kind !== "call-suspended") throw new Error("Unreachable suspension kind.");
  const resolved = requiredEvent(input.trace, (event) =>
    event.kind === "primitive-applied" && event.primitive === "-" &&
    event.applicationExpressionId === decrement.id);
  if (resolved.kind !== "primitive-applied") throw new Error("Unreachable resolution kind.");

  const actionIds = {
    open: "scheme-factorial.action.open-call",
    bind: "scheme-factorial.action.bind-three",
    choose: "scheme-factorial.action.choose-recursive-branch",
    suspend: "scheme-factorial.action.suspend-product",
    resolve: "scheme-factorial.action.resolve-decrement"
  } as const;
  const materialIds = {
    sourceOpen: "scheme-factorial.material.source.open",
    sourceOperator: "scheme-factorial.material.source.operator",
    sourceArgument: "scheme-factorial.material.source.argument-three",
    sourceClose: "scheme-factorial.material.source.close",
    targetOpen: "scheme-factorial.material.target.product-open",
    targetMultiply: "scheme-factorial.material.target.multiply",
    targetFactor: "scheme-factorial.material.target.retained-three",
    targetRecursiveOpen: "scheme-factorial.material.target.recursive-open",
    targetRecursiveOperator: "scheme-factorial.material.target.recursive-operator",
    targetNextArgument: "scheme-factorial.material.target.next-argument-two",
    targetRecursiveClose: "scheme-factorial.material.target.recursive-close",
    targetClose: "scheme-factorial.material.target.product-close"
  } as const;

  const source = state("call", "(factorial 3)", [
    token(materialIds.sourceOpen, "(", 0, [invocation.id], [], null),
    token(materialIds.sourceOperator, "factorial", 1,
      [invocationOperator.id], [], null),
    token(materialIds.sourceArgument, "3", 11,
      [invocationArgument.id], [bound.argumentValueId], null),
    token(materialIds.sourceClose, ")", 12, [invocation.id], [], null)
  ]);
  const target = state("suspended-product", "(* 3 (factorial 2))", [
    token(materialIds.targetOpen, "(", 0, [alternative.id], [], null),
    token(materialIds.targetMultiply, "*", 1, [alternativeOperator.id],
      [], actionIds.choose),
    token(materialIds.targetFactor, "3", 3,
      [alternative.children[1]!.id, invocationArgument.id],
      [bound.bindingId, bound.argumentValueId], null),
    token(materialIds.targetRecursiveOpen, "(", 5, [recursiveCall.id],
      [suspended.continuationId], actionIds.choose),
    token(materialIds.targetRecursiveOperator, "factorial", 6,
      [recursiveOperator.id, invocationOperator.id], [], null),
    token(materialIds.targetNextArgument, "2", 16,
      [decrement.id], [resolved.resultValueId], actionIds.resolve),
    token(materialIds.targetRecursiveClose, ")", 17, [recursiveCall.id],
      [suspended.continuationId], actionIds.choose),
    token(materialIds.targetClose, ")", 18, [alternative.id], [], null)
  ]);
  const actions: readonly KpSchemeFirstExpansionAction[] = [
    Object.freeze({
      id: actionIds.open,
      kind: "OpenCall",
      eventIds: Object.freeze([bound.id]),
      callExpressionId: invocation.id,
      bodyExpressionId: body.id
    }),
    Object.freeze({
      id: actionIds.bind,
      kind: "BindValue",
      eventIds: Object.freeze([bound.id]),
      argumentMaterialId: materialIds.sourceArgument,
      parameterOccurrenceId: parameter.id,
      bindingId: bound.bindingId,
      valueId: bound.argumentValueId
    }),
    Object.freeze({
      id: actionIds.choose,
      kind: "ChooseBranch",
      eventIds: Object.freeze([branch.id]),
      conditionalExpressionId: body.id,
      selectedExpressionId: alternative.id,
      dormantExpressionId: base.id
    }),
    Object.freeze({
      id: actionIds.suspend,
      kind: "SuspendExpression",
      eventIds: Object.freeze([suspended.id]),
      expressionId: alternative.id,
      continuationId: suspended.continuationId,
      retainedMaterialIds: Object.freeze([materialIds.targetFactor])
    }),
    Object.freeze({
      id: actionIds.resolve,
      kind: "ResolveExpression",
      eventIds: Object.freeze([resolved.id]),
      expressionId: decrement.id,
      resultValueId: resolved.resultValueId,
      targetMaterialId: materialIds.targetNextArgument
    })
  ];
  const dispositions: readonly KpSchemeMaterialDisposition[] = [
    disposition(materialIds.sourceOpen, materialIds.targetOpen,
      [actionIds.open], "The call membrane becomes the product membrane."),
    disposition(materialIds.sourceOperator, materialIds.targetRecursiveOperator,
      [actionIds.open, actionIds.choose],
      "The callable name remains visible as the recursive call."),
    disposition(materialIds.sourceArgument, materialIds.targetFactor,
      [actionIds.bind, actionIds.suspend],
      "The argument survives as the factor waiting on recursion."),
    disposition(materialIds.sourceClose, materialIds.targetClose,
      [actionIds.open], "The call membrane widens around the selected body.")
  ];
  return defineKpSchemeFactorialFirstExpansion({
    schemaVersion: "kp.scheme-factorial-first-expansion.v1",
    id: "scheme-factorial.first-expansion",
    source,
    target,
    actions,
    dispositions,
    accessibleDescription:
      "The call factorial of 3 opens into 3 times factorial of 2. The 3 remains visible as unfinished multiplication while the recursive call continues."
  });
}

export function defineKpSchemeFactorialFirstExpansion(
  input: KpSchemeFirstExpansion
): KpSchemeFirstExpansion {
  const expansion = deepFreeze(input);
  const actionIds = new Set(expansion.actions.map(({ id }) => id));
  requireUnique([...actionIds], expansion.actions.length, "action");
  validateState(expansion.source);
  validateState(expansion.target);
  const sourceIds = new Set(expansion.source.tokens.map(({ id }) => id));
  const targetIds = new Set(expansion.target.tokens.map(({ id }) => id));
  const dispositionSources = expansion.dispositions.map(
    ({ sourceMaterialId }) => sourceMaterialId);
  requireUnique(dispositionSources, expansion.dispositions.length, "source disposition");
  if (dispositionSources.length !== sourceIds.size ||
      dispositionSources.some((id) => !sourceIds.has(id))) {
    throw new Error("Every source material needs exactly one disposition.");
  }
  const claimedTargets = new Set<string>();
  for (const disposition of expansion.dispositions) {
    if (disposition.targetMaterialId === null ||
        !targetIds.has(disposition.targetMaterialId)) {
      throw new Error(`Disposition ${disposition.sourceMaterialId} has no target material.`);
    }
    if (claimedTargets.has(disposition.targetMaterialId)) {
      throw new Error(`Target material ${disposition.targetMaterialId} has two owners.`);
    }
    claimedTargets.add(disposition.targetMaterialId);
    if (disposition.actionIds.length === 0 || disposition.actionIds.some((id) =>
      !actionIds.has(id))) {
      throw new Error(`Disposition ${disposition.sourceMaterialId} has invalid actions.`);
    }
  }
  for (const target of expansion.target.tokens) {
    if (claimedTargets.has(target.id)) {
      if (target.introducedByActionId !== null) {
        throw new Error(`Continued material ${target.id} cannot also be introduced.`);
      }
      continue;
    }
    if (target.introducedByActionId === null ||
        !actionIds.has(target.introducedByActionId)) {
      throw new Error(`Target material ${target.id} has no certified origin.`);
    }
  }
  if (expansion.accessibleDescription.trim().length === 0) {
    throw new Error("The first expansion requires an accessible description.");
  }
  return expansion;
}

export function sampleKpSchemeFactorialFirstExpansion(
  expansion: KpSchemeFirstExpansion,
  progress: number
): KpSchemeFirstExpansionSample {
  const normalized = clamp(progress);
  const sourceOffset = (expansion.target.nativeCode.length -
    expansion.source.nativeCode.length) / 2;
  const sourceByTarget = new Map(expansion.dispositions.map((entry) =>
    [entry.targetMaterialId!, expansion.source.tokens.find(({ id }) =>
      id === entry.sourceMaterialId)!]));
  const open = smoothInterval(normalized, 0.04, 0.48);
  const bind = smoothInterval(normalized, 0.18, 0.68);
  const resolve = smoothInterval(normalized, 0.54, 0.86);
  const tokens = expansion.target.tokens.map((target) => {
    const source = sourceByTarget.get(target.id);
    const incoming = source === undefined;
    const movement = target.id.includes("retained-three") ? bind : open;
    const introduction = target.id.includes("next-argument")
      ? resolve
      : target.id.includes("recursive-open") ||
          target.id.includes("recursive-close")
        ? smoothInterval(normalized, 0.14, 0.5)
        : smoothInterval(normalized, 0.28, 0.54);
    const startX = source === undefined
      ? introductionOrigin(target.id, target.span.start)
      : source.span.start + sourceOffset;
    const xCh = mix(startX, target.span.start,
      source === undefined ? introduction : movement);
    const arc = source?.id.includes("operator") === true
      ? -0.75 * Math.sin(Math.PI * open)
      : source?.id.includes("argument-three") === true
        ? -1.05 * Math.sin(Math.PI * bind) : 0;
    return Object.freeze({
      motionId: source === undefined
        ? `introduced:${target.id}`
        : `${source.id}->${target.id}`,
      sourceMaterialId: source?.id ?? null,
      targetMaterialId: target.id,
      lexeme: target.lexeme,
      xCh: round(xCh),
      yEm: round(arc),
      opacity: incoming ? round(introduction) : 1,
      scale: incoming ? round(0.72 + introduction * 0.28) : 1,
      originExpressionIds: target.originExpressionIds,
      runtimeIds: target.runtimeIds
    });
  });
  return Object.freeze({
    progress: normalized,
    phase: normalized < 0.04 ? "orient"
      : normalized < 0.48 ? "open"
        : normalized < 0.68 ? "bind"
          : normalized < 0.9 ? "resolve" : "settle",
    nativeCode: normalized === 0
      ? expansion.source.nativeCode
      : normalized === 1
        ? expansion.target.nativeCode
        : `${expansion.source.nativeCode} -> ${expansion.target.nativeCode}`,
    tokens: Object.freeze(tokens)
  });
}

function state(
  id: KpSchemeCodeMaterialState["id"],
  nativeCode: string,
  tokens: readonly KpSchemeCodeMaterialToken[]
): KpSchemeCodeMaterialState {
  return Object.freeze({ id, nativeCode, tokens: Object.freeze([...tokens]) });
}

function token(
  id: string,
  lexeme: string,
  start: number,
  originExpressionIds: readonly string[],
  runtimeIds: readonly string[],
  introducedByActionId: string | null
): KpSchemeCodeMaterialToken {
  return Object.freeze({
    id,
    lexeme,
    span: Object.freeze({ start, end: start + lexeme.length }),
    originExpressionIds: Object.freeze([...originExpressionIds]),
    runtimeIds: Object.freeze([...runtimeIds]),
    introducedByActionId
  });
}

function disposition(
  sourceMaterialId: string,
  targetMaterialId: string,
  actionIds: readonly string[],
  rationale: string
): KpSchemeMaterialDisposition {
  return Object.freeze({
    sourceMaterialId,
    kind: "transform",
    targetMaterialId,
    actionIds: Object.freeze([...actionIds]),
    rationale
  });
}

function validateState(state: KpSchemeCodeMaterialState): void {
  const ids = state.tokens.map(({ id }) => id);
  requireUnique(ids, state.tokens.length, `${state.id} material`);
  let priorEnd = 0;
  for (const material of state.tokens) {
    if (material.span.start < priorEnd || material.span.end <= material.span.start ||
        state.nativeCode.slice(material.span.start, material.span.end) !==
          material.lexeme || material.originExpressionIds.length === 0) {
      throw new Error(`Material ${material.id} does not reconstruct ${state.id}.`);
    }
    priorEnd = material.span.end;
  }
}

function requireUnique(
  values: readonly string[],
  expectedSize: number,
  label: string
): void {
  if (values.length !== expectedSize || new Set(values).size !== expectedSize) {
    throw new Error(`Every ${label} id must be unique.`);
  }
}

function listAt(
  document: KpSchemeSourceDocument,
  address: readonly number[]
): Extract<KpSchemeSourceExpression, { readonly kind: "list" }> {
  const expression = expressionAt(document, address);
  if (expression.kind !== "list") {
    throw new Error(`Scheme expression ${address.join(".")} must be a list.`);
  }
  return expression;
}

function atomAt(
  document: KpSchemeSourceDocument,
  address: readonly number[]
): Extract<KpSchemeSourceExpression, { readonly kind: "atom" }> {
  const expression = expressionAt(document, address);
  if (expression.kind !== "atom") {
    throw new Error(`Scheme expression ${address.join(".")} must be an atom.`);
  }
  return expression;
}

function expressionAt(
  document: KpSchemeSourceDocument,
  address: readonly number[]
): KpSchemeSourceExpression {
  let expression = document.forms[address[0] ?? -1];
  for (const index of address.slice(1)) {
    if (expression?.kind !== "list") break;
    expression = expression.children[index];
  }
  if (expression === undefined ||
      expression.address.join(".") !== address.join(".")) {
    throw new Error(`Missing Scheme expression ${address.join(".")}.`);
  }
  return expression;
}

function requiredEvent(
  trace: KpSchemeTrace,
  predicate: (event: KpSchemeTraceEvent) => boolean
): KpSchemeTraceEvent {
  const event = trace.events.find(predicate);
  if (event === undefined) throw new Error("The first expansion lacks trace authority.");
  return event;
}

function introductionOrigin(id: string, targetX: number): number {
  if (id.includes("recursive-open") || id.includes("recursive-close")) return 10;
  return targetX;
}

function smoothInterval(value: number, start: number, end: number): number {
  const normalized = clamp((value - start) / (end - start));
  return normalized * normalized * (3 - 2 * normalized);
}

function mix(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Scheme first-expansion progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

function deepFreeze<Value>(value: Value): Value {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}
