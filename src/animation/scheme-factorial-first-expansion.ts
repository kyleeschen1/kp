import type { KpSchemeSourceDocument, KpSchemeSourceExpression } from
  "../semantic/scheme-factorial-source-model.ts";
import type { KpSchemeTrace, KpSchemeTraceEvent } from
  "../semantic/scheme-factorial-trace.ts";

export type KpSchemeFirstExpansionAction =
  | {
      readonly id: string;
      readonly kind: "ExpandProcedure";
      readonly eventIds: readonly string[];
      readonly operatorMaterialId: string;
      readonly closureValueId: string;
      readonly definitionBindingId: string;
      readonly definitionExpressionId: string;
      readonly bodyExpressionId: string;
      readonly activationId: string;
      readonly introducedMaterialIds: readonly string[];
      readonly withdrawnMaterialIds: readonly string[];
    }
  | {
      readonly id: string;
      readonly kind: "BindArgument";
      readonly eventIds: readonly string[];
      readonly argumentMaterialId: string;
      readonly parameterOccurrenceId: string;
      readonly bindingId: string;
      readonly valueId: string;
      readonly activationId: string;
      readonly withdrawnMaterialIds: readonly string[];
    }
  | {
      readonly id: string;
      readonly kind: "ProjectBinding";
      readonly eventIds: readonly string[];
      readonly bindingId: string;
      readonly valueId: string;
      readonly destinationOccurrenceIds: readonly string[];
      readonly introducedMaterialIds: readonly string[];
      readonly withdrawnMaterialIds: readonly string[];
    }
  | {
      readonly id: string;
      readonly kind: "ChooseBranch";
      readonly eventIds: readonly string[];
      readonly conditionalExpressionId: string;
      readonly selectedExpressionId: string;
      readonly dormantExpressionId: string;
      readonly withdrawnMaterialIds: readonly string[];
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
      readonly kind: "ReducePrimitive";
      readonly eventIds: readonly string[];
      readonly expressionId: string;
      readonly resultValueId: string;
      readonly withdrawnMaterialIds: readonly string[];
      readonly introducedMaterialIds: readonly string[];
    };

export type KpSchemeCodeMaterialProvenance =
  | {
      readonly kind: "source";
      readonly sourceOccurrenceId: string;
    }
  | {
      readonly kind: "activation";
      readonly sourceOccurrenceId: string;
      readonly activationId: string;
      readonly introducedByActionId: string;
    }
  | {
      readonly kind: "binding-projection";
      readonly sourceOccurrenceId: string;
      readonly activationId: string;
      readonly bindingId: string;
      readonly valueId: string;
      readonly introducedByActionId: string;
    }
  | {
      readonly kind: "primitive-result";
      readonly sourceOccurrenceId: string;
      readonly valueId: string;
      readonly introducedByActionId: string;
    };

export interface KpSchemeCodeMaterialToken {
  readonly id: string;
  readonly lexeme: string;
  readonly span: { readonly start: number; readonly end: number };
  readonly provenance: KpSchemeCodeMaterialProvenance;
}

export interface KpSchemeCodeMaterialState {
  readonly id:
    | "call"
    | "expanded-application"
    | "bound-body"
    | "selected-branch"
    | "suspended-product";
  readonly nativeCode: string;
  readonly tokens: readonly KpSchemeCodeMaterialToken[];
}

export interface KpSchemeSourceMaterialDisposition {
  readonly sourceMaterialId: string;
  readonly kind: "expand" | "bind" | "withdraw";
  readonly terminalActionId: string;
  readonly rationale: string;
}

export interface KpSchemeFirstExpansion {
  readonly schemaVersion: "kp.scheme-factorial-first-expansion.v2";
  readonly id: "scheme-factorial.first-expansion";
  readonly states: readonly KpSchemeCodeMaterialState[];
  readonly source: KpSchemeCodeMaterialState;
  readonly target: KpSchemeCodeMaterialState;
  readonly actions: readonly KpSchemeFirstExpansionAction[];
  readonly sourceDispositions: readonly KpSchemeSourceMaterialDisposition[];
  readonly accessibleDescription: string;
}

export interface KpSchemeFirstExpansionSample {
  readonly progress: number;
  readonly phase: "orient" | "expand" | "bind" | "choose" | "reduce" | "settle";
  readonly nativeCode: string;
  readonly tokens: readonly {
    readonly motionId: string;
    readonly materialId: string;
    readonly lexeme: string;
    readonly xCh: number;
    readonly yEm: number;
    readonly opacity: number;
    readonly scale: number;
    readonly provenance: KpSchemeCodeMaterialProvenance;
  }[];
}

interface MaterialDefinition {
  readonly id: string;
  readonly lexeme: string;
  readonly provenance: KpSchemeCodeMaterialProvenance;
}

interface StateLine {
  readonly indent: number;
  readonly materials: readonly {
    readonly id: string;
    readonly gap?: number;
  }[];
}

interface FirstExpansionSourceExpressions {
  readonly definition: KpSchemeSourceExpression;
  readonly invocation: KpSchemeSourceExpression;
  readonly invocationOperator: KpSchemeSourceExpression;
  readonly invocationArgument: KpSchemeSourceExpression;
  readonly parameter: KpSchemeSourceExpression;
  readonly body: KpSchemeSourceExpression;
  readonly predicate: KpSchemeSourceExpression;
  readonly predicateN: KpSchemeSourceExpression;
  readonly base: KpSchemeSourceExpression;
  readonly alternative: KpSchemeSourceExpression;
  readonly productN: KpSchemeSourceExpression;
  readonly recursiveCall: KpSchemeSourceExpression;
  readonly recursiveOperator: KpSchemeSourceExpression;
  readonly decrement: KpSchemeSourceExpression;
  readonly decrementN: KpSchemeSourceExpression;
}

/**
 * Compiles the first pedagogical expansion from interpreter facts. Source
 * spelling, runtime activation, binding value, and paint material stay
 * separate so equal glyphs can never manufacture false object continuity.
 */
export function compileKpSchemeFactorialFirstExpansion(input: {
  readonly document: KpSchemeSourceDocument;
  readonly trace: KpSchemeTrace;
}): KpSchemeFirstExpansion {
  const definition = listAt(input.document, [0]);
  const invocation = listAt(input.document, [1]);
  const invocationOperator = atomAt(input.document, [1, 0]);
  const invocationArgument = atomAt(input.document, [1, 1]);
  const parameter = atomAt(input.document, [0, 1, 1]);
  const body = listAt(input.document, [0, 2]);
  const predicate = listAt(input.document, [0, 2, 1]);
  const predicateN = atomAt(input.document, [0, 2, 1, 1]);
  const base = atomAt(input.document, [0, 2, 2]);
  const alternative = listAt(input.document, [0, 2, 3]);
  const productN = atomAt(input.document, [0, 2, 3, 1]);
  const recursiveCall = listAt(input.document, [0, 2, 3, 2]);
  const recursiveOperator = atomAt(input.document, [0, 2, 3, 2, 0]);
  const decrement = listAt(input.document, [0, 2, 3, 2, 1]);
  const decrementN = atomAt(input.document, [0, 2, 3, 2, 1, 1]);

  const closure = requiredEvent(input.trace, (event) =>
    event.kind === "closure-created" &&
    event.definitionExpressionId === definition.id);
  if (closure.kind !== "closure-created") throw new Error("Unreachable closure kind.");
  const definitionBound = requiredEvent(input.trace, (event) =>
    event.kind === "definition-bound" &&
    event.definitionExpressionId === definition.id);
  if (definitionBound.kind !== "definition-bound") {
    throw new Error("Unreachable definition binding kind.");
  }
  const operatorResolved = requiredEvent(input.trace, (event) =>
    event.kind === "symbol-resolved" &&
    event.occurrenceId === invocationOperator.id);
  if (operatorResolved.kind !== "symbol-resolved") {
    throw new Error("Unreachable operator resolution kind.");
  }
  const bound = requiredEvent(input.trace, (event) =>
    event.kind === "parameter-bound" &&
    event.applicationExpressionId === invocation.id);
  if (bound.kind !== "parameter-bound") throw new Error("Unreachable binding kind.");
  const projections = [predicateN, productN, decrementN].map((occurrence) => {
    const event = requiredEvent(input.trace, (candidate) =>
      candidate.kind === "symbol-resolved" &&
      candidate.occurrenceId === occurrence.id &&
      candidate.bindingId === bound.bindingId);
    if (event.kind !== "symbol-resolved") {
      throw new Error("Unreachable binding projection kind.");
    }
    return event;
  });
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
  if (resolved.kind !== "primitive-applied") throw new Error("Unreachable reduction kind.");

  const actionIds = {
    expand: "scheme-factorial.action.expand-procedure",
    bind: "scheme-factorial.action.bind-argument",
    project: "scheme-factorial.action.project-binding",
    choose: "scheme-factorial.action.choose-recursive-branch",
    suspend: "scheme-factorial.action.suspend-product",
    reduce: "scheme-factorial.action.reduce-decrement"
  } as const;
  const activationId = bound.calleeEnvironmentId;
  const ids = materialIds();
  const definitions = materialDefinitions({
    ids,
    actionIds,
    activationId,
    source: {
      definition,
      invocation,
      invocationOperator,
      invocationArgument,
      parameter,
      body,
      predicate,
      predicateN,
      base,
      alternative,
      productN,
      recursiveCall,
      recursiveOperator,
      decrement,
      decrementN
    },
    runtime: {
      bindingId: bound.bindingId,
      argumentValueId: bound.argumentValueId,
      resultValueId: resolved.resultValueId
    }
  });

  const source = materialState("call", definitions, [{
    indent: 0,
    materials: [
      { id: ids.sourceOpen },
      { id: ids.sourceOperator },
      { id: ids.sourceArgument, gap: 1 },
      { id: ids.sourceClose }
    ]
  }]);
  const expanded = materialState("expanded-application", definitions, [
    { indent: 0, materials: [
      { id: ids.sourceOpen }, { id: ids.lambdaOpen },
      { id: ids.lambdaKeyword }, { id: ids.parameterOpen, gap: 1 },
      { id: ids.parameterN }, { id: ids.parameterClose }
    ] },
    { indent: 3, materials: [
      { id: ids.ifOpen }, { id: ids.ifKeyword },
      { id: ids.predicateOpen, gap: 1 }, { id: ids.equals },
      { id: ids.predicateN, gap: 1 }, { id: ids.zero, gap: 1 },
      { id: ids.predicateClose }
    ] },
    { indent: 7, materials: [{ id: ids.baseOne }] },
    { indent: 7, materials: [
      { id: ids.productOpen }, { id: ids.multiply },
      { id: ids.productN, gap: 1 }, { id: ids.recursiveOpen, gap: 1 },
      { id: ids.recursiveFactorial }, { id: ids.decrementOpen, gap: 1 },
      { id: ids.subtract }, { id: ids.decrementN, gap: 1 },
      { id: ids.decrementOne, gap: 1 }, { id: ids.decrementClose },
      { id: ids.recursiveClose }, { id: ids.productClose },
      { id: ids.ifClose }, { id: ids.lambdaClose },
      { id: ids.sourceArgument, gap: 1 }, { id: ids.sourceClose }
    ] }
  ]);
  const boundBody = materialState("bound-body", definitions, [
    { indent: 0, materials: [
      { id: ids.ifOpen }, { id: ids.ifKeyword },
      { id: ids.predicateOpen, gap: 1 }, { id: ids.equals },
      { id: ids.predicateThree, gap: 1 }, { id: ids.zero, gap: 1 },
      { id: ids.predicateClose }
    ] },
    { indent: 4, materials: [{ id: ids.baseOne }] },
    { indent: 4, materials: [
      { id: ids.productOpen }, { id: ids.multiply },
      { id: ids.productThree, gap: 1 }, { id: ids.recursiveOpen, gap: 1 },
      { id: ids.recursiveFactorial }, { id: ids.decrementOpen, gap: 1 },
      { id: ids.subtract }, { id: ids.decrementThree, gap: 1 },
      { id: ids.decrementOne, gap: 1 }, { id: ids.decrementClose },
      { id: ids.recursiveClose }, { id: ids.productClose }, { id: ids.ifClose }
    ] }
  ]);
  const selected = materialState("selected-branch", definitions, [{
    indent: 0,
    materials: [
      { id: ids.productOpen }, { id: ids.multiply },
      { id: ids.productThree, gap: 1 }, { id: ids.recursiveOpen, gap: 1 },
      { id: ids.recursiveFactorial }, { id: ids.decrementOpen, gap: 1 },
      { id: ids.subtract }, { id: ids.decrementThree, gap: 1 },
      { id: ids.decrementOne, gap: 1 }, { id: ids.decrementClose },
      { id: ids.recursiveClose }, { id: ids.productClose }
    ]
  }]);
  const target = materialState("suspended-product", definitions, [{
    indent: 0,
    materials: [
      { id: ids.productOpen }, { id: ids.multiply },
      { id: ids.productThree, gap: 1 }, { id: ids.recursiveOpen, gap: 1 },
      { id: ids.recursiveFactorial }, { id: ids.nextArgument, gap: 1 },
      { id: ids.recursiveClose }, { id: ids.productClose }
    ]
  }]);

  const expandedOnly = definitions.filter(({ provenance }) =>
    provenance.kind === "activation").map(({ id }) => id);
  const projected = [ids.predicateThree, ids.productThree, ids.decrementThree];
  const actions: readonly KpSchemeFirstExpansionAction[] = [
    Object.freeze({
      id: actionIds.expand,
      kind: "ExpandProcedure",
      eventIds: Object.freeze([closure.id, definitionBound.id, operatorResolved.id]),
      operatorMaterialId: ids.sourceOperator,
      closureValueId: closure.closureValueId,
      definitionBindingId: definitionBound.bindingId,
      definitionExpressionId: definition.id,
      bodyExpressionId: body.id,
      activationId,
      introducedMaterialIds: Object.freeze(expandedOnly),
      withdrawnMaterialIds: Object.freeze([ids.sourceOperator])
    }),
    Object.freeze({
      id: actionIds.bind,
      kind: "BindArgument",
      eventIds: Object.freeze([bound.id]),
      argumentMaterialId: ids.sourceArgument,
      parameterOccurrenceId: parameter.id,
      bindingId: bound.bindingId,
      valueId: bound.argumentValueId,
      activationId,
      withdrawnMaterialIds: Object.freeze([
        ids.sourceOpen, ids.sourceArgument, ids.sourceClose,
        ids.lambdaOpen, ids.lambdaKeyword, ids.parameterOpen,
        ids.parameterN, ids.parameterClose, ids.lambdaClose
      ])
    }),
    Object.freeze({
      id: actionIds.project,
      kind: "ProjectBinding",
      eventIds: Object.freeze(projections.map(({ id }) => id)),
      bindingId: bound.bindingId,
      valueId: bound.argumentValueId,
      destinationOccurrenceIds: Object.freeze([predicateN.id, productN.id, decrementN.id]),
      introducedMaterialIds: Object.freeze(projected),
      withdrawnMaterialIds: Object.freeze([
        ids.predicateN, ids.productN, ids.decrementN
      ])
    }),
    Object.freeze({
      id: actionIds.choose,
      kind: "ChooseBranch",
      eventIds: Object.freeze([branch.id]),
      conditionalExpressionId: body.id,
      selectedExpressionId: alternative.id,
      dormantExpressionId: base.id,
      withdrawnMaterialIds: Object.freeze([
        ids.ifOpen, ids.ifKeyword, ids.predicateOpen, ids.equals,
        ids.predicateThree, ids.zero, ids.predicateClose, ids.baseOne, ids.ifClose
      ])
    }),
    Object.freeze({
      id: actionIds.suspend,
      kind: "SuspendExpression",
      eventIds: Object.freeze([suspended.id]),
      expressionId: alternative.id,
      continuationId: suspended.continuationId,
      retainedMaterialIds: Object.freeze([ids.productThree])
    }),
    Object.freeze({
      id: actionIds.reduce,
      kind: "ReducePrimitive",
      eventIds: Object.freeze([resolved.id]),
      expressionId: decrement.id,
      resultValueId: resolved.resultValueId,
      withdrawnMaterialIds: Object.freeze([
        ids.decrementOpen, ids.subtract, ids.decrementThree,
        ids.decrementOne, ids.decrementClose
      ]),
      introducedMaterialIds: Object.freeze([ids.nextArgument])
    })
  ];
  const sourceDispositions: readonly KpSchemeSourceMaterialDisposition[] = [
    sourceDisposition(ids.sourceOpen, "withdraw", actionIds.bind,
      "The outer application membrane ends after its argument is bound."),
    sourceDisposition(ids.sourceOperator, "expand", actionIds.expand,
      "The operator resolves to the closure and opens a fresh procedure activation."),
    sourceDisposition(ids.sourceArgument, "bind", actionIds.bind,
      "The argument glyph is consumed by parameter binding; it does not become a body glyph."),
    sourceDisposition(ids.sourceClose, "withdraw", actionIds.bind,
      "The outer application membrane ends after its argument is bound.")
  ];

  return defineKpSchemeFactorialFirstExpansion({
    schemaVersion: "kp.scheme-factorial-first-expansion.v2",
    id: "scheme-factorial.first-expansion",
    states: Object.freeze([source, expanded, boundBody, selected, target]),
    source,
    target,
    actions,
    sourceDispositions,
    accessibleDescription:
      "Factorial resolves to its procedure and opens into a fresh body. The argument 3 enters the parameter n and is consumed by binding. Fresh 3 values appear where that binding is used. The false branch folds away and subtraction resolves to 2, leaving 3 times factorial of 2."
  });
}

export function defineKpSchemeFactorialFirstExpansion(
  input: KpSchemeFirstExpansion
): KpSchemeFirstExpansion {
  const expansion = deepFreeze(input);
  if (expansion.schemaVersion !== "kp.scheme-factorial-first-expansion.v2" ||
      expansion.id !== "scheme-factorial.first-expansion") {
    throw new Error("The first expansion has an unsupported identity or schema.");
  }
  const actionIds = new Set(expansion.actions.map(({ id }) => id));
  requireUnique([...actionIds], expansion.actions.length, "action");
  const stateIds = expansion.states.map(({ id }) => id);
  requireUnique(stateIds, expansion.states.length, "state");
  if (expansion.states[0]?.id !== "call" ||
      expansion.states.at(-1)?.id !== "suspended-product" ||
      expansion.source.id !== "call" || expansion.target.id !== "suspended-product") {
    throw new Error("The first expansion requires ordered native endpoints.");
  }

  const materialById = new Map<string, KpSchemeCodeMaterialToken>();
  for (const state of expansion.states) {
    validateState(state);
    for (const material of state.tokens) {
      const existing = materialById.get(material.id);
      if (existing !== undefined &&
          (existing.lexeme !== material.lexeme ||
            JSON.stringify(existing.provenance) !== JSON.stringify(material.provenance))) {
        throw new Error(`Material ${material.id} changes identity between states.`);
      }
      materialById.set(material.id, material);
    }
  }

  const sourceIds = new Set(expansion.source.tokens.map(({ id }) => id));
  const dispositionSources = expansion.sourceDispositions.map(
    ({ sourceMaterialId }) => sourceMaterialId);
  requireUnique(dispositionSources, expansion.sourceDispositions.length,
    "source disposition");
  if (dispositionSources.length !== sourceIds.size ||
      dispositionSources.some((id) => !sourceIds.has(id))) {
    throw new Error("Every source material needs exactly one terminal disposition.");
  }
  for (const disposition of expansion.sourceDispositions) {
    if (!actionIds.has(disposition.terminalActionId)) {
      throw new Error(`Source disposition ${disposition.sourceMaterialId} has no action.`);
    }
  }

  const introducedByAction = new Map<string, string>();
  const withdrawnByAction = new Map<string, string>();
  for (const action of expansion.actions) {
    for (const id of introducedIds(action)) {
      if (introducedByAction.has(id)) {
        throw new Error(`Material ${id} has two introducing actions.`);
      }
      introducedByAction.set(id, action.id);
    }
    for (const id of withdrawnIds(action)) {
      if (withdrawnByAction.has(id)) {
        throw new Error(`Material ${id} has two terminating actions.`);
      }
      withdrawnByAction.set(id, action.id);
    }
  }
  const targetIds = new Set(expansion.target.tokens.map(({ id }) => id));
  for (const [id, material] of materialById) {
    if (material.provenance.kind === "source") {
      if (!sourceIds.has(id) || introducedByAction.has(id)) {
        throw new Error(`Source material ${id} has invalid provenance.`);
      }
    } else if (material.provenance.introducedByActionId !==
        introducedByAction.get(id)) {
      throw new Error(`Material ${id} has no certified introducing action.`);
    }
    if (targetIds.has(id) && withdrawnByAction.has(id)) {
      throw new Error(`Settled material ${id} cannot also terminate.`);
    }
    if (!targetIds.has(id) && withdrawnByAction.get(id) === undefined) {
      throw new Error(`Transient material ${id} has no certified termination.`);
    }
  }
  for (const [id] of withdrawnByAction) {
    if (!materialById.has(id)) {
      throw new Error(`Terminated material ${id} does not exist.`);
    }
  }
  for (const disposition of expansion.sourceDispositions) {
    if (withdrawnByAction.get(disposition.sourceMaterialId) !==
        disposition.terminalActionId) {
      throw new Error(
        `Source disposition ${disposition.sourceMaterialId} disagrees with termination.`
      );
    }
  }

  const outerOperator = expansion.source.tokens.find(({ id }) =>
    id.endsWith("source.operator"));
  const recursiveOperator = expansion.target.tokens.find(({ lexeme }) =>
    lexeme === "factorial");
  if (outerOperator === undefined || recursiveOperator === undefined ||
      recursiveOperator.id === outerOperator.id ||
      recursiveOperator.provenance.kind !== "activation" ||
      recursiveOperator.provenance.sourceOccurrenceId ===
        outerOperator.provenance.sourceOccurrenceId) {
    throw new Error("The recursive operator must be fresh activated body syntax.");
  }
  const sourceArgument = expansion.source.tokens.find(({ id }) =>
    id.endsWith("source.argument"));
  const targetFactor = expansion.target.tokens.find(({ id }) =>
    id.endsWith("binding.product-three"));
  if (sourceArgument === undefined || targetFactor === undefined ||
      sourceArgument.id === targetFactor.id ||
      targetFactor.provenance.kind !== "binding-projection") {
    throw new Error("Body values must project from binding, not continue argument glyphs.");
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
  const [source, expanded, bound, selected, target] = expansion.states;
  if (source === undefined || expanded === undefined || bound === undefined ||
      selected === undefined || target === undefined) {
    throw new Error("The first expansion requires five material states.");
  }
  if (normalized < 0.08) return settledSample(expansion, source, normalized, "orient");
  if (normalized < 0.34) {
    return transitionSample(expansion, source, expanded,
      interval(normalized, 0.08, 0.34), normalized, "expand");
  }
  if (normalized < 0.54) {
    return transitionSample(expansion, expanded, bound,
      interval(normalized, 0.34, 0.54), normalized, "bind");
  }
  if (normalized < 0.72) {
    return transitionSample(expansion, bound, selected,
      interval(normalized, 0.54, 0.72), normalized, "choose");
  }
  if (normalized < 0.9) {
    return transitionSample(expansion, selected, target,
      interval(normalized, 0.72, 0.9), normalized, "reduce");
  }
  return settledSample(expansion, target, normalized, "settle");
}

function transitionSample(
  expansion: KpSchemeFirstExpansion,
  from: KpSchemeCodeMaterialState,
  to: KpSchemeCodeMaterialState,
  rawProgress: number,
  globalProgress: number,
  phase: KpSchemeFirstExpansionSample["phase"]
): KpSchemeFirstExpansionSample {
  const progress = smooth(rawProgress);
  const metrics = stateMetrics(expansion.states);
  const fromOffset = stateOffset(from, metrics);
  const toOffset = stateOffset(to, metrics);
  const fromById = new Map(from.tokens.map((token) => [token.id, token]));
  const toById = new Map(to.tokens.map((token) => [token.id, token]));
  const ids = [...new Set([...fromById.keys(), ...toById.keys()])];
  const center = { x: metrics.widthCh / 2, y: metrics.lines * 0.75 };
  const expansionOrigin = phase === "expand"
    ? pointForMaterial(from, findMaterialId(from, "source.operator"), metrics)
    : center;
  const bindOrigin = phase === "bind"
    ? pointForMaterial(from, findMaterialId(from, "activation.parameter-n"), metrics)
    : center;
  const chooseOrigin = phase === "choose"
    ? pointForMaterial(to, findMaterialId(to, "activation.product-open"), metrics)
    : center;
  const reductionOrigin = phase === "reduce"
    ? pointForMaterial(to, findMaterialId(to, "result.next-argument"), metrics)
    : center;

  const tokens = ids.map((id) => {
    const before = fromById.get(id);
    const after = toById.get(id);
    const material = after ?? before!;
    if (before !== undefined && after !== undefined) {
      const start = pointForToken(from, before, metrics);
      const end = pointForToken(to, after, metrics);
      return sampledToken(material, id, mixPoint(start, end, progress), 1, 1,
        mixPoint(fromOffset, toOffset, progress));
    }
    if (after !== undefined) {
      const end = pointForToken(to, after, metrics);
      const entering = entryProgress(phase, id, rawProgress);
      const origin = phase === "expand" ? expansionOrigin
        : phase === "bind" ? bindingProjectionOrigin(id, from, metrics, bindOrigin)
          : reductionOrigin;
      const arc = phase === "expand" ? -0.55 * Math.sin(Math.PI * entering) : 0;
      const point = mixPoint(origin, end, smooth(entering));
      return sampledToken(material, id, { x: point.x, y: point.y + arc },
        smooth(entering), 0.68 + smooth(entering) * 0.32,
        mixPoint(fromOffset, toOffset, progress));
    }
    const start = pointForToken(from, before!, metrics);
    const leaving = exitProgress(phase, id, rawProgress);
    const destination = phase === "bind" && id.endsWith("source.argument")
      ? bindOrigin
      : phase === "choose" ? chooseOrigin
        : phase === "reduce" ? reductionOrigin : start;
    const point = mixPoint(start, destination, smooth(leaving));
    const arc = phase === "bind" && id.endsWith("source.argument")
      ? -0.9 * Math.sin(Math.PI * leaving) : 0;
    return sampledToken(material, id, { x: point.x, y: point.y + arc },
      round(1 - smooth(leaving)), round(1 - smooth(leaving) * 0.42),
      mixPoint(fromOffset, toOffset, progress));
  }).filter(({ opacity }) => opacity > 0.0001);

  return Object.freeze({
    progress: globalProgress,
    phase,
    nativeCode: rawProgress >= 1 ? to.nativeCode : from.nativeCode,
    tokens: Object.freeze(tokens)
  });
}

function settledSample(
  expansion: KpSchemeFirstExpansion,
  state: KpSchemeCodeMaterialState,
  progress: number,
  phase: KpSchemeFirstExpansionSample["phase"]
): KpSchemeFirstExpansionSample {
  const metrics = stateMetrics(expansion.states);
  return Object.freeze({
    progress,
    phase,
    nativeCode: state.nativeCode,
    tokens: Object.freeze(state.tokens.map((material) =>
      sampledToken(material, material.id, pointForToken(state, material, metrics),
        1, 1, stateOffset(state, metrics))))
  });
}

function sampledToken(
  material: KpSchemeCodeMaterialToken,
  motionId: string,
  point: { readonly x: number; readonly y: number },
  opacity: number,
  scale: number,
  offset: { readonly x: number; readonly y: number }
): KpSchemeFirstExpansionSample["tokens"][number] {
  return Object.freeze({
    motionId,
    materialId: material.id,
    lexeme: material.lexeme,
    xCh: round(point.x + offset.x),
    yEm: round(point.y + offset.y),
    opacity: round(opacity),
    scale: round(scale),
    provenance: material.provenance
  });
}

function materialIds() {
  return {
    sourceOpen: "scheme-factorial.material.source.open",
    sourceOperator: "scheme-factorial.material.source.operator",
    sourceArgument: "scheme-factorial.material.source.argument",
    sourceClose: "scheme-factorial.material.source.close",
    lambdaOpen: "scheme-factorial.material.activation.lambda-open",
    lambdaKeyword: "scheme-factorial.material.activation.lambda-keyword",
    parameterOpen: "scheme-factorial.material.activation.parameter-open",
    parameterN: "scheme-factorial.material.activation.parameter-n",
    parameterClose: "scheme-factorial.material.activation.parameter-close",
    lambdaClose: "scheme-factorial.material.activation.lambda-close",
    ifOpen: "scheme-factorial.material.activation.if-open",
    ifKeyword: "scheme-factorial.material.activation.if-keyword",
    predicateOpen: "scheme-factorial.material.activation.predicate-open",
    equals: "scheme-factorial.material.activation.equals",
    predicateN: "scheme-factorial.material.activation.predicate-n",
    zero: "scheme-factorial.material.activation.zero",
    predicateClose: "scheme-factorial.material.activation.predicate-close",
    baseOne: "scheme-factorial.material.activation.base-one",
    productOpen: "scheme-factorial.material.activation.product-open",
    multiply: "scheme-factorial.material.activation.multiply",
    productN: "scheme-factorial.material.activation.product-n",
    recursiveOpen: "scheme-factorial.material.activation.recursive-open",
    recursiveFactorial: "scheme-factorial.material.activation.recursive-factorial",
    decrementOpen: "scheme-factorial.material.activation.decrement-open",
    subtract: "scheme-factorial.material.activation.subtract",
    decrementN: "scheme-factorial.material.activation.decrement-n",
    decrementOne: "scheme-factorial.material.activation.decrement-one",
    decrementClose: "scheme-factorial.material.activation.decrement-close",
    recursiveClose: "scheme-factorial.material.activation.recursive-close",
    productClose: "scheme-factorial.material.activation.product-close",
    ifClose: "scheme-factorial.material.activation.if-close",
    predicateThree: "scheme-factorial.material.binding.predicate-three",
    productThree: "scheme-factorial.material.binding.product-three",
    decrementThree: "scheme-factorial.material.binding.decrement-three",
    nextArgument: "scheme-factorial.material.result.next-argument"
  } as const;
}

function materialDefinitions(input: {
  readonly ids: ReturnType<typeof materialIds>;
  readonly actionIds: {
    readonly expand: string;
    readonly project: string;
    readonly reduce: string;
  };
  readonly activationId: string;
  readonly source: FirstExpansionSourceExpressions;
  readonly runtime: {
    readonly bindingId: string;
    readonly argumentValueId: string;
    readonly resultValueId: string;
  };
}): readonly MaterialDefinition[] {
  const { ids, actionIds, activationId, source, runtime } = input;
  const activation = (
    id: string,
    lexeme: string,
    occurrence: KpSchemeSourceExpression | { readonly id: string }
  ): MaterialDefinition => ({
    id,
    lexeme,
    provenance: {
      kind: "activation",
      sourceOccurrenceId: occurrence.id,
      activationId,
      introducedByActionId: actionIds.expand
    }
  });
  const projection = (
    id: string,
    occurrence: KpSchemeSourceExpression
  ): MaterialDefinition => ({
    id,
    lexeme: "3",
    provenance: {
      kind: "binding-projection",
      sourceOccurrenceId: occurrence.id,
      activationId,
      bindingId: runtime.bindingId,
      valueId: runtime.argumentValueId,
      introducedByActionId: actionIds.project
    }
  });
  const list = (key: keyof FirstExpansionSourceExpressions) => source[key] as Extract<
    KpSchemeSourceExpression, { readonly kind: "list" }>;
  const atom = (key: keyof FirstExpansionSourceExpressions) => source[key] as Extract<
    KpSchemeSourceExpression, { readonly kind: "atom" }>;
  const invocation = list("invocation");
  const body = list("body");
  const predicate = list("predicate");
  const alternative = list("alternative");
  const recursiveCall = list("recursiveCall");
  const decrement = list("decrement");
  const sourceMaterial = (id: string, lexeme: string, occurrenceId: string):
  MaterialDefinition => ({
    id,
    lexeme,
    provenance: { kind: "source", sourceOccurrenceId: occurrenceId }
  });
  return Object.freeze([
    sourceMaterial(ids.sourceOpen, "(", invocation.delimiters.open.id),
    sourceMaterial(ids.sourceOperator, atom("invocationOperator").lexeme,
      atom("invocationOperator").id),
    sourceMaterial(ids.sourceArgument, atom("invocationArgument").lexeme,
      atom("invocationArgument").id),
    sourceMaterial(ids.sourceClose, ")", invocation.delimiters.close.id),
    activation(ids.lambdaOpen, "(", source.definition),
    activation(ids.lambdaKeyword, "lambda", source.definition),
    activation(ids.parameterOpen, "(", list("definition").children[1]!),
    activation(ids.parameterN, "n", source.parameter),
    activation(ids.parameterClose, ")", list("definition").children[1]!),
    activation(ids.lambdaClose, ")", source.definition),
    activation(ids.ifOpen, "(", body.delimiters.open),
    activation(ids.ifKeyword, "if", body.children[0]!),
    activation(ids.predicateOpen, "(", predicate.delimiters.open),
    activation(ids.equals, "=", predicate.children[0]!),
    activation(ids.predicateN, "n", source.predicateN),
    activation(ids.zero, "0", predicate.children[2]!),
    activation(ids.predicateClose, ")", predicate.delimiters.close),
    activation(ids.baseOne, "1", source.base),
    activation(ids.productOpen, "(", alternative.delimiters.open),
    activation(ids.multiply, "*", alternative.children[0]!),
    activation(ids.productN, "n", source.productN),
    activation(ids.recursiveOpen, "(", recursiveCall.delimiters.open),
    activation(ids.recursiveFactorial, "factorial", source.recursiveOperator),
    activation(ids.decrementOpen, "(", decrement.delimiters.open),
    activation(ids.subtract, "-", decrement.children[0]!),
    activation(ids.decrementN, "n", source.decrementN),
    activation(ids.decrementOne, "1", decrement.children[2]!),
    activation(ids.decrementClose, ")", decrement.delimiters.close),
    activation(ids.recursiveClose, ")", recursiveCall.delimiters.close),
    activation(ids.productClose, ")", alternative.delimiters.close),
    activation(ids.ifClose, ")", body.delimiters.close),
    projection(ids.predicateThree, atom("predicateN")),
    projection(ids.productThree, atom("productN")),
    projection(ids.decrementThree, atom("decrementN")),
    {
      id: ids.nextArgument,
      lexeme: "2",
      provenance: {
        kind: "primitive-result",
        sourceOccurrenceId: decrement.id,
        valueId: runtime.resultValueId,
        introducedByActionId: actionIds.reduce
      }
    }
  ]);
}

function materialState(
  id: KpSchemeCodeMaterialState["id"],
  definitions: readonly MaterialDefinition[],
  lines: readonly StateLine[]
): KpSchemeCodeMaterialState {
  const byId = new Map(definitions.map((definition) => [definition.id, definition]));
  let nativeCode = "";
  const tokens: KpSchemeCodeMaterialToken[] = [];
  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) nativeCode += "\n";
    nativeCode += " ".repeat(line.indent);
    for (const placement of line.materials) {
      nativeCode += " ".repeat(placement.gap ?? 0);
      const definition = byId.get(placement.id);
      if (definition === undefined) throw new Error(`Unknown material ${placement.id}.`);
      const start = nativeCode.length;
      nativeCode += definition.lexeme;
      tokens.push(Object.freeze({
        ...definition,
        span: Object.freeze({ start, end: nativeCode.length })
      }));
    }
  });
  return Object.freeze({ id, nativeCode, tokens: Object.freeze(tokens) });
}

function sourceDisposition(
  sourceMaterialId: string,
  kind: KpSchemeSourceMaterialDisposition["kind"],
  terminalActionId: string,
  rationale: string
): KpSchemeSourceMaterialDisposition {
  return Object.freeze({ sourceMaterialId, kind, terminalActionId, rationale });
}

function introducedIds(action: KpSchemeFirstExpansionAction): readonly string[] {
  return "introducedMaterialIds" in action ? action.introducedMaterialIds : [];
}

function withdrawnIds(action: KpSchemeFirstExpansionAction): readonly string[] {
  return "withdrawnMaterialIds" in action ? action.withdrawnMaterialIds : [];
}

function validateState(state: KpSchemeCodeMaterialState): void {
  const ids = state.tokens.map(({ id }) => id);
  requireUnique(ids, state.tokens.length, `${state.id} material`);
  let priorEnd = 0;
  for (const material of state.tokens) {
    if (material.span.start < priorEnd || material.span.end <= material.span.start ||
        state.nativeCode.slice(material.span.start, material.span.end) !== material.lexeme) {
      throw new Error(`Material ${material.id} does not reconstruct ${state.id}.`);
    }
    priorEnd = material.span.end;
  }
}

function stateMetrics(states: readonly KpSchemeCodeMaterialState[]): {
  readonly widthCh: number;
  readonly lines: number;
} {
  return {
    widthCh: Math.max(...states.flatMap(({ nativeCode }) =>
      nativeCode.split("\n").map((line) => line.length))),
    lines: Math.max(...states.map(({ nativeCode }) => nativeCode.split("\n").length))
  };
}

function stateOffset(
  state: KpSchemeCodeMaterialState,
  metrics: { readonly widthCh: number; readonly lines: number }
): { readonly x: number; readonly y: number } {
  const lines = state.nativeCode.split("\n");
  const first = lines[0]?.length ?? 0;
  // Center the initial call and compact endpoint; left-align readable bodies.
  return {
    x: lines.length === 1 ? (metrics.widthCh - first) / 2 : 0,
    y: 0
  };
}

function pointForToken(
  state: KpSchemeCodeMaterialState,
  token: KpSchemeCodeMaterialToken,
  metrics: { readonly widthCh: number; readonly lines: number }
): { readonly x: number; readonly y: number } {
  const before = state.nativeCode.slice(0, token.span.start);
  const lineIndex = before.split("\n").length - 1;
  const column = token.span.start - (before.lastIndexOf("\n") + 1);
  const lines = state.nativeCode.split("\n");
  return {
    x: column,
    y: (metrics.lines - lines.length) * 0.75 + lineIndex * 1.5
  };
}

function pointForMaterial(
  state: KpSchemeCodeMaterialState,
  materialId: string,
  metrics: { readonly widthCh: number; readonly lines: number }
): { readonly x: number; readonly y: number } {
  const token = state.tokens.find(({ id }) => id === materialId);
  if (token === undefined) throw new Error(`State ${state.id} lacks ${materialId}.`);
  return pointForToken(state, token, metrics);
}

function findMaterialId(state: KpSchemeCodeMaterialState, suffix: string): string {
  const material = state.tokens.find(({ id }) => id.endsWith(suffix));
  if (material === undefined) throw new Error(`State ${state.id} lacks ${suffix}.`);
  return material.id;
}

function bindingProjectionOrigin(
  id: string,
  state: KpSchemeCodeMaterialState,
  metrics: { readonly widthCh: number; readonly lines: number },
  fallback: { readonly x: number; readonly y: number }
): { readonly x: number; readonly y: number } {
  const sourceSuffix = id.endsWith("predicate-three") ? "activation.predicate-n"
    : id.endsWith("product-three") ? "activation.product-n"
      : id.endsWith("decrement-three") ? "activation.decrement-n" : null;
  return sourceSuffix === null ? fallback
    : pointForMaterial(state, findMaterialId(state, sourceSuffix), metrics);
}

function entryProgress(
  phase: KpSchemeFirstExpansionSample["phase"],
  id: string,
  progress: number
): number {
  if (phase === "expand") {
    const delay = id.includes("lambda") || id.includes("parameter") ? 0 : 0.16;
    return clampUnit((progress - delay) / (1 - delay));
  }
  if (phase === "bind") return clampUnit((progress - 0.48) / 0.52);
  if (phase === "reduce") return clampUnit((progress - 0.46) / 0.54);
  return progress;
}

function exitProgress(
  phase: KpSchemeFirstExpansionSample["phase"],
  id: string,
  progress: number
): number {
  if (phase === "bind") {
    if (id.endsWith("source.argument")) return clampUnit(progress / 0.72);
    if (id.includes("activation.predicate-n") || id.includes("activation.product-n") ||
        id.includes("activation.decrement-n")) {
      return clampUnit((progress - 0.42) / 0.45);
    }
    return clampUnit((progress - 0.5) / 0.5);
  }
  if (phase === "choose") return clampUnit((progress - 0.18) / 0.72);
  if (phase === "reduce") return clampUnit(progress / 0.72);
  return progress;
}

function mixPoint(
  start: { readonly x: number; readonly y: number },
  end: { readonly x: number; readonly y: number },
  progress: number
): { readonly x: number; readonly y: number } {
  return {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress
  };
}

function interval(value: number, start: number, end: number): number {
  return clampUnit((value - start) / (end - start));
}

function smooth(value: number): number {
  const normalized = clampUnit(value);
  return normalized * normalized * (3 - 2 * normalized);
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Scheme first-expansion progress must be finite.");
  }
  return clampUnit(value);
}

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
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
  if (expression === undefined || expression.address.join(".") !== address.join(".")) {
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

function deepFreeze<Value>(value: Value): Value {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}
