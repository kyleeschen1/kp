import type { KpSchemeCodeMaterialProvenance } from
  "./scheme-factorial-first-expansion.ts";
import type { KpSchemeSourceDocument, KpSchemeSourceExpression } from
  "../semantic/scheme-factorial-source-model.ts";
import type { KpSchemeIntegerValue } from
  "../semantic/scheme-factorial-machine-state.ts";
import type { KpSchemeTrace, KpSchemeTraceEvent } from
  "../semantic/scheme-factorial-trace.ts";
import {
  mintKpSchemeReducedMotionSettlementException,
  sampleKpSchemeFactorialSettlement,
  type KpSchemeFactorialSettlementEvidence,
  type KpSchemeFactorialSettlementMotif
} from "./scheme-factorial-settlement.ts";

export type KpSchemeFullEvaluationAction =
  | KpSchemeFullMaterialAction<"ExpandProcedure"> & {
      readonly activationId: string;
      readonly closureValueId: string;
      readonly operatorMaterialId: string;
    }
  | KpSchemeFullMaterialAction<"BindArgument"> & {
      readonly activationId: string;
      readonly bindingId: string;
      readonly valueId: string;
      readonly argumentMaterialId: string;
      readonly parameterMaterialId: string;
    }
  | KpSchemeFullMaterialAction<"ProjectBinding"> & {
      readonly activationId: string;
      readonly bindingId: string;
      readonly valueId: string;
    }
  | KpSchemeFullMaterialAction<"ChooseBranch"> & {
      readonly activationId: string;
      readonly branch: "consequent" | "alternative";
    }
  | KpSchemeFullMaterialAction<"ReducePrimitive"> & {
      readonly activationId: string;
      readonly primitive: "-";
      readonly resultValueId: string;
    }
  | KpSchemeFullMaterialAction<"ResolveBase"> & {
      readonly activationId: string;
      readonly resultValueId: string;
    }
  | KpSchemeFullMaterialAction<"ApplyPrimitive"> & {
      readonly primitive: "*";
      readonly resultValueId: string;
      readonly continuationId: string | null;
    };

interface KpSchemeFullMaterialAction<Kind extends string> {
  readonly id: string;
  readonly kind: Kind;
  readonly eventIds: readonly string[];
  readonly introducedMaterialIds: readonly string[];
  readonly withdrawnMaterialIds: readonly string[];
}

type KpSchemeFullEvaluationActionSeed =
  KpSchemeFullEvaluationAction extends infer Action
    ? Action extends KpSchemeFullEvaluationAction
      ? Omit<Action, "introducedMaterialIds" | "withdrawnMaterialIds">
      : never
    : never;

export interface KpSchemeFullEvaluationMaterial {
  readonly id: string;
  readonly lexeme: string;
  readonly span: { readonly start: number; readonly end: number };
  readonly provenance: KpSchemeCodeMaterialProvenance;
}

export interface KpSchemeFullEvaluationState {
  readonly id: string;
  readonly kind: "call" | "expanded" | "bound" | "branch" | "base" | "return";
  readonly nativeCode: string;
  readonly tokens: readonly KpSchemeFullEvaluationMaterial[];
}

export interface KpSchemeFullEvaluationTransition {
  readonly id: string;
  readonly fromStateId: string;
  readonly toStateId: string;
  readonly actionIds: readonly string[];
  readonly caption: string;
  readonly weight: number;
  readonly motionFraction: number;
}

export interface KpSchemeFactorialFullEvaluation {
  readonly schemaVersion: "kp.scheme-factorial-full-evaluation.v1";
  readonly id: "scheme-factorial.full-evaluation";
  readonly states: readonly KpSchemeFullEvaluationState[];
  readonly actions: readonly KpSchemeFullEvaluationAction[];
  readonly transitions: readonly KpSchemeFullEvaluationTransition[];
  readonly sourceStateId: string;
  readonly targetStateId: string;
  readonly accessibleDescription: string;
}

export interface KpSchemeFactorialFullEvaluationSample {
  readonly progress: number;
  readonly phase: KpSchemeFullEvaluationAction["kind"] | "orient" | "settle";
  readonly transitionId: string | null;
  readonly settledStateId: string;
  readonly nativeCode: string;
  readonly caption: string;
  readonly settlement: KpSchemeFactorialSettlementEvidence | null;
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

interface Placement {
  readonly id: string;
  readonly gap?: number;
}

interface Line {
  readonly indent: number;
  readonly materials: readonly Placement[];
}

interface ActivationTrace {
  readonly depth: number;
  readonly argument: number;
  readonly activationId: string;
  readonly bindingId: string;
  readonly argumentValueId: string;
  readonly boundEventId: string;
  readonly operatorEventId: string;
  readonly branchEventId: string;
  readonly branch: "consequent" | "alternative";
  readonly suspendedEventId: string | null;
  readonly continuationId: string | null;
  readonly decrementEventId: string | null;
  readonly decrementValueId: string | null;
}

interface ActivationMaterials {
  readonly depth: number;
  readonly argument: number;
  readonly activationId: string;
  readonly call: {
    readonly open: string;
    readonly operator: string;
    readonly argument: string;
    readonly close: string;
  };
  readonly lambda: {
    readonly open: string;
    readonly keyword: string;
    readonly parameterOpen: string;
    readonly parameter: string;
    readonly parameterClose: string;
    readonly close: string;
  };
  readonly body: {
    readonly ifOpen: string;
    readonly ifKeyword: string;
    readonly predicateOpen: string;
    readonly equals: string;
    readonly predicateN: string;
    readonly predicateValue: string;
    readonly zero: string;
    readonly predicateClose: string;
    readonly baseLiteral: string;
    readonly productOpen: string;
    readonly multiply: string;
    readonly productN: string;
    readonly productValue: string;
    readonly recursiveOpen: string;
    readonly recursiveOperator: string;
    readonly decrementOpen: string;
    readonly subtract: string;
    readonly decrementN: string;
    readonly decrementValue: string;
    readonly decrementOne: string;
    readonly decrementClose: string;
    readonly recursiveClose: string;
    readonly productClose: string;
    readonly ifClose: string;
  };
  readonly baseResult: string | null;
  readonly nextArgument: string | null;
}

/** Compiles four pedagogical activations from the frozen evaluator trace. */
export function compileKpSchemeFactorialFullEvaluation(input: {
  readonly document: KpSchemeSourceDocument;
  readonly trace: KpSchemeTrace;
}): KpSchemeFactorialFullEvaluation {
  const nodes = sourceNodes(input.document);
  const closure = requiredEvent(input.trace, (event) =>
    event.kind === "closure-created" &&
    event.definitionExpressionId === nodes.definition.id);
  if (closure.kind !== "closure-created") throw new Error("Unreachable closure event.");
  const boundEvents = input.trace.events.filter((event) =>
    event.kind === "parameter-bound");
  const branches = input.trace.events.filter((event) =>
    event.kind === "branch-selected");
  const suspensions = input.trace.events.filter((event) =>
    event.kind === "call-suspended");
  const decrements = input.trace.events.filter((event) =>
    event.kind === "primitive-applied" && event.primitive === "-");
  const operatorResolutions = input.trace.events.filter((event) =>
    event.kind === "symbol-resolved" &&
    (event.occurrenceId === nodes.invocationOperator.id ||
      event.occurrenceId === nodes.recursiveOperator.id));
  if (boundEvents.length !== 4 || branches.length !== 4 ||
      suspensions.length !== 3 || decrements.length !== 3 ||
      operatorResolutions.length !== 4) {
    throw new Error("Factorial full evaluation requires four certified activations.");
  }

  const activations: readonly ActivationTrace[] = boundEvents.map((candidate, depth) => {
    if (candidate.kind !== "parameter-bound") throw new Error("Unreachable binding.");
    const branch = branches[depth];
    const operator = operatorResolutions[depth];
    const suspension = suspensions[depth];
    const decrement = decrements[depth];
    if (branch?.kind !== "branch-selected" || operator?.kind !== "symbol-resolved") {
      throw new Error("Activation trace correspondence is incomplete.");
    }
    if (depth < 3 &&
        (branch.branch !== "alternative" || suspension?.kind !== "call-suspended" ||
          decrement?.kind !== "primitive-applied" || decrement.primitive !== "-")) {
      throw new Error("Recursive activation lacks its branch, suspension, or decrement.");
    }
    if (depth === 3 && branch.branch !== "consequent") {
      throw new Error("Final activation must select the base branch.");
    }
    return Object.freeze({
      depth,
      argument: integerValue(input.trace, candidate.argumentValueId),
      activationId: candidate.calleeEnvironmentId,
      bindingId: candidate.bindingId,
      argumentValueId: candidate.argumentValueId,
      boundEventId: candidate.id,
      operatorEventId: operator.id,
      branchEventId: branch.id,
      branch: branch.branch,
      suspendedEventId: suspension?.kind === "call-suspended" ? suspension.id : null,
      continuationId: suspension?.kind === "call-suspended"
        ? suspension.continuationId : null,
      decrementEventId: decrement?.kind === "primitive-applied" ? decrement.id : null,
      decrementValueId: decrement?.kind === "primitive-applied"
        ? decrement.resultValueId : null
    });
  });
  if (activations.map(({ argument }) => argument).join(",") !== "3,2,1,0") {
    throw new Error("Factorial activation arguments must descend from three to zero.");
  }

  const registry = new Map<string, MaterialDefinition>();
  const activationMaterials: ActivationMaterials[] = [];
  activations.forEach((activation) => {
    const prior = activationMaterials.at(-1) ?? null;
    activationMaterials.push(registerActivationMaterials({
      registry,
      activation,
      prior,
      nodes
    }));
  });
  const baseLiteral = requiredEvent(input.trace, (event) =>
    event.kind === "literal-evaluated" && event.expressionId === nodes.base.id &&
    event.index > activations[3]!.depth);
  if (baseLiteral.kind !== "literal-evaluated") throw new Error("Missing base value.");
  const callReturns = input.trace.events.filter((event) =>
    event.kind === "call-returned");
  const products = input.trace.events.filter((event) =>
    event.kind === "primitive-applied" && event.primitive === "*");
  const completed = requiredEvent(input.trace, (event) =>
    event.kind === "evaluation-completed");
  if (callReturns.length !== 4 || products.length !== 3 ||
      completed.kind !== "evaluation-completed") {
    throw new Error("Factorial return trace is incomplete.");
  }

  const states: KpSchemeFullEvaluationState[] = [];
  const actions: KpSchemeFullEvaluationAction[] = [];
  const transitions: KpSchemeFullEvaluationTransition[] = [];
  const addState = (state: KpSchemeFullEvaluationState): void => {
    states.push(state);
  };
  const addTransition = (input_: {
    readonly id: string;
    readonly from: KpSchemeFullEvaluationState;
    readonly to: KpSchemeFullEvaluationState;
    readonly actions: readonly KpSchemeFullEvaluationAction[];
    readonly caption: string;
    readonly weight: number;
  }): void => {
    actions.push(...input_.actions);
    transitions.push(Object.freeze({
      id: input_.id,
      fromStateId: input_.from.id,
      toStateId: input_.to.id,
      actionIds: Object.freeze(input_.actions.map(({ id }) => id)),
      caption: input_.caption,
      weight: input_.weight,
      motionFraction: 0.78
    }));
  };

  activationMaterials.forEach((materials, depth) => {
    const activation = activations[depth]!;
    const call = buildCallState(registry, activationMaterials, depth);
    const expanded = buildExpandedState(registry, activationMaterials, depth);
    const bound = buildBoundState(registry, activationMaterials, depth);
    const branch = activation.branch === "alternative"
      ? buildRecursiveBranchState(registry, activationMaterials, depth)
      : buildBaseState(registry, activationMaterials, depth);
    if (depth === 0) addState(call);
    addState(expanded);
    addState(bound);
    addState(branch);

    const expandId = actionId(depth, "expand");
    addTransition({
      id: transitionId(depth, "expand"),
      from: call,
      to: expanded,
      actions: [actionFromDiff({
        id: expandId,
        kind: "ExpandProcedure",
        eventIds: [activation.operatorEventId],
        from: call,
        to: expanded,
        activationId: activation.activationId,
        closureValueId: closure.closureValueId,
        operatorMaterialId: materials.call.operator
      })],
      caption: `Factorial opens into a fresh procedure for ${activation.argument}.`,
      weight: 1.35
    });
    const bindId = actionId(depth, "bind");
    const projectId = actionId(depth, "project");
    const bindIntroduced = new Set([
      materials.body.predicateValue,
      materials.body.productValue,
      materials.body.decrementValue
    ]);
    const bindWithdrawn = new Set([
      materials.call.open, materials.call.argument, materials.call.close,
      materials.lambda.open, materials.lambda.keyword,
      materials.lambda.parameterOpen, materials.lambda.parameter,
      materials.lambda.parameterClose, materials.lambda.close
    ]);
    const projectWithdrawn = new Set([
      materials.body.predicateN,
      materials.body.productN,
      materials.body.decrementN
    ]);
    addTransition({
      id: transitionId(depth, "bind"),
      from: expanded,
      to: bound,
      actions: [
        Object.freeze({
          id: bindId,
          kind: "BindArgument",
          eventIds: Object.freeze([activation.boundEventId]),
          introducedMaterialIds: Object.freeze([]),
          withdrawnMaterialIds: Object.freeze([...bindWithdrawn]),
          activationId: activation.activationId,
          bindingId: activation.bindingId,
          valueId: activation.argumentValueId,
          argumentMaterialId: materials.call.argument,
          parameterMaterialId: materials.lambda.parameter
        }),
        Object.freeze({
          id: projectId,
          kind: "ProjectBinding",
          eventIds: Object.freeze([activation.boundEventId]),
          introducedMaterialIds: Object.freeze([...bindIntroduced]),
          withdrawnMaterialIds: Object.freeze([...projectWithdrawn]),
          activationId: activation.activationId,
          bindingId: activation.bindingId,
          valueId: activation.argumentValueId
        })
      ],
      caption: `${activation.argument} enters n; fresh ${activation.argument}s appear where the binding is used.`,
      weight: 1.2
    });

    const chooseAction = actionFromDiff({
      id: actionId(depth, "choose"),
      kind: "ChooseBranch",
      eventIds: [activation.branchEventId],
      from: bound,
      to: branch,
      activationId: activation.activationId,
      branch: activation.branch
    });
    if (activation.branch === "alternative") {
      addTransition({
        id: transitionId(depth, "choose"),
        from: bound,
        to: branch,
        actions: [chooseAction],
        caption: `${activation.argument} is not zero, so the base branch closes.`,
        weight: 0.95
      });
      const nextCall = buildCallState(registry, activationMaterials, depth + 1);
      addState(nextCall);
      const reduceEventId = activation.decrementEventId;
      const reduceValueId = activation.decrementValueId;
      if (reduceEventId === null || reduceValueId === null) {
        throw new Error("Recursive activation lacks a decrement result.");
      }
      addTransition({
        id: transitionId(depth, "reduce"),
        from: branch,
        to: nextCall,
        actions: [actionFromDiff({
          id: actionId(depth, "reduce"),
          kind: "ReducePrimitive",
          eventIds: [activation.suspendedEventId!, reduceEventId],
          from: branch,
          to: nextCall,
          activationId: activation.activationId,
          primitive: "-",
          resultValueId: reduceValueId
        })],
        caption: `${activation.argument} − 1 becomes ${activation.argument - 1}; multiplication waits.`,
        weight: 0.95
      });
    } else {
      const resolvedBase = replaceBaseLiteralWithResult({
        registry,
        state: branch,
        material: materials,
        valueId: baseLiteral.valueId,
        sourceOccurrenceId: nodes.base.id,
        actionId: actionId(depth, "base")
      });
      addTransition({
        id: transitionId(depth, "choose"),
        from: bound,
        to: branch,
        actions: [chooseAction],
        caption: "At zero, the recursive branch closes.",
        weight: 0.85
      });
      addState(resolvedBase);
      addTransition({
        id: transitionId(depth, "base"),
        from: branch,
        to: resolvedBase,
        actions: [actionFromDiff({
          id: actionId(depth, "base"),
          kind: "ResolveBase",
          eventIds: [baseLiteral.id, callReturns[0]!.id],
          from: branch,
          to: resolvedBase,
          activationId: activation.activationId,
          resultValueId: baseLiteral.valueId
        })],
        caption: "The base value 1 returns into the waiting multiplications.",
        weight: 0.95
      });
    }
  });

  let returnState = states.at(-1)!;
  const returnValues = products.map((event, index) => {
    if (event.kind !== "primitive-applied" || event.primitive !== "*") {
      throw new Error("Unreachable multiplication event.");
    }
    return {
      event,
      value: integerValue(input.trace, event.resultValueId),
      callReturn: callReturns[index + 1]!
    };
  });
  for (let index = 0; index < returnValues.length; index += 1) {
    const shellDepth = 2 - index;
    const result = returnValues[index]!;
    const action = actionId(shellDepth, "multiply");
    const next = collapseInnermostProduct({
      registry,
      prior: returnState,
      activationMaterials,
      shellDepth,
      actionId: action,
      resultValueId: result.event.resultValueId,
      resultLexeme: String(result.value)
    });
    addState(next);
    addTransition({
      id: transitionId(shellDepth, "return"),
      from: returnState,
      to: next,
      actions: [actionFromDiff({
        id: action,
        kind: "ApplyPrimitive",
        eventIds: [result.event.id, result.callReturn.id,
          ...(index === returnValues.length - 1 ? [completed.id] : [])],
        from: returnState,
        to: next,
        primitive: "*",
        resultValueId: result.event.resultValueId,
        continuationId: result.callReturn.kind === "call-returned"
          ? result.callReturn.continuationId : null
      })],
      caption: multiplicationCaption(result.event.argumentValueIds.map((id) =>
        integerValue(input.trace, id)), result.value),
      weight: 1.15
    });
    returnState = next;
  }

  return defineKpSchemeFactorialFullEvaluation({
    schemaVersion: "kp.scheme-factorial-full-evaluation.v1",
    id: "scheme-factorial.full-evaluation",
    states,
    actions,
    transitions,
    sourceStateId: states[0]!.id,
    targetStateId: states.at(-1)!.id,
    accessibleDescription:
      "Factorial of three repeatedly opens its procedure and leaves multiplication waiting until factorial of zero reaches the base value one. The results then return through one times one, two times one, and three times two, producing six."
  });
}

export function defineKpSchemeFactorialFullEvaluation(
  input: KpSchemeFactorialFullEvaluation
): KpSchemeFactorialFullEvaluation {
  const evaluation = deepFreeze(input);
  if (evaluation.schemaVersion !== "kp.scheme-factorial-full-evaluation.v1" ||
      evaluation.id !== "scheme-factorial.full-evaluation") {
    throw new Error("Unsupported factorial full-evaluation schema.");
  }
  const states = new Map(evaluation.states.map((state) => [state.id, state]));
  const actions = new Map(evaluation.actions.map((action) => [action.id, action]));
  requireUnique([...states.keys()], evaluation.states.length, "state");
  requireUnique([...actions.keys()], evaluation.actions.length, "action");
  requireUnique(evaluation.transitions.map(({ id }) => id),
    evaluation.transitions.length, "transition");
  if (!states.has(evaluation.sourceStateId) || !states.has(evaluation.targetStateId) ||
      states.get(evaluation.sourceStateId)?.nativeCode !== "(factorial 3)" ||
      states.get(evaluation.targetStateId)?.nativeCode !== "6") {
    throw new Error("Factorial full evaluation requires exact native endpoints.");
  }
  for (const state of evaluation.states) validateState(state);
  evaluation.transitions.forEach((transition, index) => {
    const from = states.get(transition.fromStateId);
    const to = states.get(transition.toStateId);
    if (from === undefined || to === undefined ||
        transition.weight <= 0 || transition.motionFraction <= 0 ||
        transition.motionFraction > 1 || transition.caption.trim().length === 0) {
      throw new Error(`Transition ${transition.id} is invalid.`);
    }
    if (index > 0 && evaluation.transitions[index - 1]!.toStateId !==
        transition.fromStateId) {
      throw new Error("Factorial full-evaluation transitions must form one chain.");
    }
    const transitionActions = transition.actionIds.map((id) => actions.get(id));
    if (transitionActions.some((action) => action === undefined)) {
      throw new Error(`Transition ${transition.id} references an unknown action.`);
    }
    validateMaterialDiff(from, to,
      transitionActions as readonly KpSchemeFullEvaluationAction[]);
  });
  if (evaluation.transitions[0]?.fromStateId !== evaluation.sourceStateId ||
      evaluation.transitions.at(-1)?.toStateId !== evaluation.targetStateId) {
    throw new Error("Factorial transition chain does not reach its endpoints.");
  }
  if (evaluation.accessibleDescription.trim().length === 0) {
    throw new Error("Factorial full evaluation requires an accessible description.");
  }
  return evaluation;
}

export function sampleKpSchemeFactorialFullEvaluation(
  evaluation: KpSchemeFactorialFullEvaluation,
  progress: number,
  options: { readonly reducedMotion?: boolean } = {}
): KpSchemeFactorialFullEvaluationSample {
  const normalized = finiteProgress(progress);
  const stateById = new Map(evaluation.states.map((state) => [state.id, state]));
  const actionById = new Map(evaluation.actions.map((action) => [action.id, action]));
  const total = evaluation.transitions.reduce((sum, transition) =>
    sum + transition.weight, 0);
  if (normalized === 0) {
    return settledSample(evaluation, stateById.get(evaluation.sourceStateId)!,
      0, "orient", null, "Factorial begins with one call.", null);
  }
  if (normalized === 1) {
    return settledSample(evaluation, stateById.get(evaluation.targetStateId)!,
      1, "settle", null, "Factorial of three is six.", null);
  }
  const position = normalized * total;
  let cursor = 0;
  for (const transition of evaluation.transitions) {
    const end = cursor + transition.weight;
    if (position <= end) {
      const local = (position - cursor) / transition.weight;
      const from = stateById.get(transition.fromStateId)!;
      const to = stateById.get(transition.toStateId)!;
      const actions = transition.actionIds.map((id) => actionById.get(id)!);
      if (options.reducedMotion === true || local >= transition.motionFraction) {
        const settlement = fullEvaluationSettlement({
          actions,
          transition,
          progress: 1,
          reducedMotion: options.reducedMotion === true
        });
        return settledSample(evaluation, to, normalized, "settle",
          transition.id, transition.caption, settlement);
      }
      return transitionSample({
        evaluation,
        from,
        to,
        actions,
        progress: smooth(local / transition.motionFraction),
        globalProgress: normalized,
        transition,
        phase: actions.at(-1)!.kind
      });
    }
    cursor = end;
  }
  throw new Error("Factorial full-evaluation sampling escaped its timeline.");
}

function transitionSample(input: {
  readonly evaluation: KpSchemeFactorialFullEvaluation;
  readonly from: KpSchemeFullEvaluationState;
  readonly to: KpSchemeFullEvaluationState;
  readonly actions: readonly KpSchemeFullEvaluationAction[];
  readonly progress: number;
  readonly globalProgress: number;
  readonly transition: KpSchemeFullEvaluationTransition;
  readonly phase: KpSchemeFactorialFullEvaluationSample["phase"];
}): KpSchemeFactorialFullEvaluationSample {
  const metrics = stateMetrics(input.evaluation.states);
  const fromById = new Map(input.from.tokens.map((token) => [token.id, token]));
  const toById = new Map(input.to.tokens.map((token) => [token.id, token]));
  const introducedById = new Map(input.actions.flatMap((action) =>
    action.introducedMaterialIds.map((id) => [id, action] as const)));
  const withdrawnById = new Map(input.actions.flatMap((action) =>
    action.withdrawnMaterialIds.map((id) => [id, action] as const)));
  const ids = [...new Set([...fromById.keys(), ...toById.keys()])];
  const tokens = ids.map((id) => {
    const before = fromById.get(id);
    const after = toById.get(id);
    const material = after ?? before!;
    if (before !== undefined && after !== undefined) {
      return sampledToken(material, id, mixPoint(
        pointForToken(input.from, before, metrics),
        pointForToken(input.to, after, metrics),
        input.progress
      ), 1, 1);
    }
    if (after !== undefined) {
      const action = introducedById.get(id)!;
      const end = pointForToken(input.to, after, metrics);
      const entry = introducedProgress(action, id, input.progress);
      const origin = introductionOrigin(action, id, input.from, input.to, metrics);
      return sampledToken(material, id, mixPoint(origin, end, smooth(entry)),
        smooth(entry), 0.7 + smooth(entry) * 0.3);
    }
    const action = withdrawnById.get(id)!;
    const start = pointForToken(input.from, before!, metrics);
    const exit = withdrawnProgress(action, id, input.progress);
    const destination = withdrawalDestination(action, id, input.from, input.to, metrics);
    const arc = action.kind === "BindArgument" &&
      id === action.argumentMaterialId ? -0.85 * Math.sin(Math.PI * exit) : 0;
    const point = mixPoint(start, destination, smooth(exit));
    return sampledToken(material, id, { x: point.x, y: point.y + arc },
      1 - smooth(exit), 1 - smooth(exit) * 0.45);
  }).filter(({ opacity }) => opacity > 0.0001);
  return Object.freeze({
    progress: input.globalProgress,
    phase: input.phase,
    transitionId: input.transition.id,
    settledStateId: input.from.id,
    nativeCode: input.from.nativeCode,
    caption: input.transition.caption,
    settlement: fullEvaluationSettlement({
      actions: input.actions,
      transition: input.transition,
      progress: input.progress,
      reducedMotion: false
    }),
    tokens: Object.freeze(tokens)
  });
}

function settledSample(
  evaluation: KpSchemeFactorialFullEvaluation,
  state: KpSchemeFullEvaluationState,
  progress: number,
  phase: "orient" | "settle",
  transitionId: string | null,
  caption: string,
  settlement: KpSchemeFactorialSettlementEvidence | null
): KpSchemeFactorialFullEvaluationSample {
  const metrics = stateMetrics(evaluation.states);
  return Object.freeze({
    progress,
    phase,
    transitionId,
    settledStateId: state.id,
    nativeCode: state.nativeCode,
    caption,
    settlement,
    tokens: Object.freeze(state.tokens.map((token) =>
      sampledToken(token, token.id, pointForToken(state, token, metrics), 1, 1)))
  });
}

function fullEvaluationSettlement(input: {
  readonly actions: readonly KpSchemeFullEvaluationAction[];
  readonly transition: KpSchemeFullEvaluationTransition;
  readonly progress: number;
  readonly reducedMotion: boolean;
}): KpSchemeFactorialSettlementEvidence {
  const materialIds = [...new Set(input.actions.flatMap((action) => [
    ...action.introducedMaterialIds,
    ...action.withdrawnMaterialIds
  ]))];
  const primary = input.actions.at(-1)!;
  const motif = settlementMotif(primary.kind);
  const branch = input.actions.find((action) => action.kind === "ChooseBranch");
  const evidence = sampleKpSchemeFactorialSettlement({
    motif,
    transitionId: input.transition.id,
    materialIds,
    progress: input.progress,
    ...(branch === undefined ? {} : {
      semanticDeletion: {
        operationId: branch.id,
        materialIds: branch.withdrawnMaterialIds
      }
    })
  });
  if (!input.reducedMotion) return evidence;
  return Object.freeze({
    ...evidence,
    exception: mintKpSchemeReducedMotionSettlementException({
      transitionId: input.transition.id,
      materialIds
    })
  });
}

function settlementMotif(
  kind: KpSchemeFullEvaluationAction["kind"]
): KpSchemeFactorialSettlementMotif {
  switch (kind) {
    case "ExpandProcedure": return "structural";
    case "BindArgument":
    case "ProjectBinding": return "binding";
    case "ChooseBranch": return "branch";
    case "ApplyPrimitive": return "return";
    case "ReducePrimitive":
    case "ResolveBase": return "primitive";
  }
}

function registerActivationMaterials(input: {
  readonly registry: Map<string, MaterialDefinition>;
  readonly activation: ActivationTrace;
  readonly prior: ActivationMaterials | null;
  readonly nodes: ReturnType<typeof sourceNodes>;
}): ActivationMaterials {
  const { registry, activation, prior, nodes } = input;
  const prefix = `scheme-factorial.full.material.activation-${activation.depth}`;
  const expand = actionId(activation.depth, "expand");
  const project = actionId(activation.depth, "project");
  const reduce = actionId(activation.depth, "reduce");
  const call = activation.depth === 0 ? {
    open: `${prefix}.call.open`,
    operator: `${prefix}.call.operator`,
    argument: `${prefix}.call.argument`,
    close: `${prefix}.call.close`
  } : {
    open: prior!.body.recursiveOpen,
    operator: prior!.body.recursiveOperator,
    argument: prior!.nextArgument!,
    close: prior!.body.recursiveClose
  };
  if (activation.depth === 0) {
    register(registry, call.open, "(", sourceProvenance(nodes.invocation.delimiters.open.id));
    register(registry, call.operator, "factorial",
      sourceProvenance(nodes.invocationOperator.id));
    register(registry, call.argument, String(activation.argument),
      sourceProvenance(nodes.invocationArgument.id));
    register(registry, call.close, ")", sourceProvenance(nodes.invocation.delimiters.close.id));
  }
  const lambda = {
    open: `${prefix}.lambda.open`,
    keyword: `${prefix}.lambda.keyword`,
    parameterOpen: `${prefix}.lambda.parameter-open`,
    parameter: `${prefix}.lambda.parameter`,
    parameterClose: `${prefix}.lambda.parameter-close`,
    close: `${prefix}.lambda.close`
  };
  const body = {
    ifOpen: `${prefix}.body.if-open`,
    ifKeyword: `${prefix}.body.if-keyword`,
    predicateOpen: `${prefix}.body.predicate-open`,
    equals: `${prefix}.body.equals`,
    predicateN: `${prefix}.body.predicate-n`,
    predicateValue: `${prefix}.binding.predicate-value`,
    zero: `${prefix}.body.zero`,
    predicateClose: `${prefix}.body.predicate-close`,
    baseLiteral: `${prefix}.body.base-literal`,
    productOpen: `${prefix}.body.product-open`,
    multiply: `${prefix}.body.multiply`,
    productN: `${prefix}.body.product-n`,
    productValue: `${prefix}.binding.product-value`,
    recursiveOpen: `${prefix}.body.recursive-open`,
    recursiveOperator: `${prefix}.body.recursive-operator`,
    decrementOpen: `${prefix}.body.decrement-open`,
    subtract: `${prefix}.body.subtract`,
    decrementN: `${prefix}.body.decrement-n`,
    decrementValue: `${prefix}.binding.decrement-value`,
    decrementOne: `${prefix}.body.decrement-one`,
    decrementClose: `${prefix}.body.decrement-close`,
    recursiveClose: `${prefix}.body.recursive-close`,
    productClose: `${prefix}.body.product-close`,
    ifClose: `${prefix}.body.if-close`
  };
  const activationItems: readonly [string, string, string][] = [
    [lambda.open, "(", nodes.definition.id],
    [lambda.keyword, "lambda", nodes.definition.id],
    [lambda.parameterOpen, "(", nodes.signature.delimiters.open.id],
    [lambda.parameter, "n", nodes.parameter.id],
    [lambda.parameterClose, ")", nodes.signature.delimiters.close.id],
    [lambda.close, ")", nodes.definition.id],
    [body.ifOpen, "(", nodes.body.delimiters.open.id],
    [body.ifKeyword, "if", nodes.ifKeyword.id],
    [body.predicateOpen, "(", nodes.predicate.delimiters.open.id],
    [body.equals, "=", nodes.equals.id],
    [body.predicateN, "n", nodes.predicateN.id],
    [body.zero, "0", nodes.zero.id],
    [body.predicateClose, ")", nodes.predicate.delimiters.close.id],
    [body.baseLiteral, "1", nodes.base.id],
    [body.productOpen, "(", nodes.product.delimiters.open.id],
    [body.multiply, "*", nodes.multiply.id],
    [body.productN, "n", nodes.productN.id],
    [body.recursiveOpen, "(", nodes.recursiveCall.delimiters.open.id],
    [body.recursiveOperator, "factorial", nodes.recursiveOperator.id],
    [body.decrementOpen, "(", nodes.decrement.delimiters.open.id],
    [body.subtract, "-", nodes.subtract.id],
    [body.decrementN, "n", nodes.decrementN.id],
    [body.decrementOne, "1", nodes.decrementOne.id],
    [body.decrementClose, ")", nodes.decrement.delimiters.close.id],
    [body.recursiveClose, ")", nodes.recursiveCall.delimiters.close.id],
    [body.productClose, ")", nodes.product.delimiters.close.id],
    [body.ifClose, ")", nodes.body.delimiters.close.id]
  ];
  activationItems.forEach(([id, lexeme, occurrenceId]) => register(
    registry, id, lexeme,
    activationProvenance(occurrenceId, activation.activationId, expand)));
  const projection = (id: string, occurrenceId: string): void => register(
    registry, id, String(activation.argument), {
      kind: "binding-projection",
      sourceOccurrenceId: occurrenceId,
      activationId: activation.activationId,
      bindingId: activation.bindingId,
      valueId: activation.argumentValueId,
      introducedByActionId: project
    });
  projection(body.predicateValue, nodes.predicateN.id);
  projection(body.productValue, nodes.productN.id);
  projection(body.decrementValue, nodes.decrementN.id);
  const nextArgument = activation.decrementValueId === null ? null
    : `${prefix}.result.next-argument`;
  const decrementValueId = activation.decrementValueId;
  if (nextArgument !== null && decrementValueId !== null) register(registry, nextArgument,
    String(activation.argument - 1), {
      kind: "primitive-result",
      sourceOccurrenceId: nodes.decrement.id,
      valueId: decrementValueId,
      introducedByActionId: reduce
    });
  return Object.freeze({
    depth: activation.depth,
    argument: activation.argument,
    activationId: activation.activationId,
    call: Object.freeze(call),
    lambda: Object.freeze(lambda),
    body: Object.freeze(body),
    baseResult: activation.depth === 3 ? `${prefix}.result.base` : null,
    nextArgument
  });
}

function buildCallState(
  registry: Map<string, MaterialDefinition>,
  activations: readonly ActivationMaterials[],
  depth: number
): KpSchemeFullEvaluationState {
  const active = activations[depth]!;
  return buildState(registry, `scheme-factorial.full.state.call-${depth}`, "call", [
    ...waitingPrefixLines(activations, depth),
    line(depth * 2, [
      p(active.call.open, depth === 0 ? undefined : 1),
      p(active.call.operator), p(active.call.argument, 1),
      p(active.call.close), ...compactCloses(activations, depth)
    ])
  ]);
}

function buildExpandedState(
  registry: Map<string, MaterialDefinition>,
  activations: readonly ActivationMaterials[],
  depth: number
): KpSchemeFullEvaluationState {
  const active = activations[depth]!;
  const closes = compactCloses(activations, depth);
  return buildState(registry,
    `scheme-factorial.full.state.expanded-${depth}`, "expanded", [
      ...waitingPrefixLines(activations, depth),
      line(depth * 2, [
        p(active.call.open, depth === 0 ? undefined : 1),
        p(active.lambda.open), p(active.lambda.keyword),
        p(active.lambda.parameterOpen, 1), p(active.lambda.parameter),
        p(active.lambda.parameterClose)
      ]),
      line(depth * 2 + 3, [
        p(active.body.ifOpen), p(active.body.ifKeyword),
        p(active.body.predicateOpen, 1), p(active.body.equals),
        p(active.body.predicateN, 1), p(active.body.zero, 1),
        p(active.body.predicateClose)
      ]),
      line(depth * 2 + 7, [p(active.body.baseLiteral)]),
      line(depth * 2 + 7, [
        p(active.body.productOpen), p(active.body.multiply),
        p(active.body.productN, 1)
      ]),
      line(depth * 2 + 9, [
        p(active.body.recursiveOpen), p(active.body.recursiveOperator)
      ]),
      line(depth * 2 + 11, [
        p(active.body.decrementOpen),
        p(active.body.subtract), p(active.body.decrementN, 1),
        p(active.body.decrementOne, 1), p(active.body.decrementClose),
        p(active.body.recursiveClose), p(active.body.productClose)
      ]),
      line(depth * 2 + 7, [
        p(active.body.ifClose), p(active.lambda.close),
        p(active.call.argument, 1), p(active.call.close), ...closes
      ])
    ]);
}

function buildBoundState(
  registry: Map<string, MaterialDefinition>,
  activations: readonly ActivationMaterials[],
  depth: number
): KpSchemeFullEvaluationState {
  const active = activations[depth]!;
  const closes = compactCloses(activations, depth);
  return buildState(registry,
    `scheme-factorial.full.state.bound-${depth}`, "bound", [
      ...waitingPrefixLines(activations, depth),
      line(depth * 2, [
        p(active.body.ifOpen, depth === 0 ? undefined : 1), p(active.body.ifKeyword),
        p(active.body.predicateOpen, 1), p(active.body.equals),
        p(active.body.predicateValue, 1), p(active.body.zero, 1),
        p(active.body.predicateClose)
      ]),
      line(depth * 2 + 4, [p(active.body.baseLiteral)]),
      line(depth * 2 + 4, [
        p(active.body.productOpen), p(active.body.multiply),
        p(active.body.productValue, 1)
      ]),
      line(depth * 2 + 6, [
        p(active.body.recursiveOpen), p(active.body.recursiveOperator)
      ]),
      line(depth * 2 + 8, [
        p(active.body.decrementOpen),
        p(active.body.subtract), p(active.body.decrementValue, 1),
        p(active.body.decrementOne, 1), p(active.body.decrementClose),
        p(active.body.recursiveClose), p(active.body.productClose)
      ]),
      line(depth * 2 + 4, [
        p(active.body.ifClose), ...closes
      ])
    ]);
}

function buildRecursiveBranchState(
  registry: Map<string, MaterialDefinition>,
  activations: readonly ActivationMaterials[],
  depth: number
): KpSchemeFullEvaluationState {
  const active = activations[depth]!;
  return buildState(registry,
    `scheme-factorial.full.state.branch-${depth}`, "branch", [
      ...waitingPrefixLines(activations, depth),
      line(depth * 2, [
        p(active.body.productOpen, depth === 0 ? undefined : 1),
        p(active.body.multiply),
        p(active.body.productValue, 1)
      ]),
      line(depth * 2 + 2, [
        p(active.body.recursiveOpen), p(active.body.recursiveOperator)
      ]),
      line(depth * 2 + 4, [
        p(active.body.decrementOpen),
        p(active.body.subtract), p(active.body.decrementValue, 1),
        p(active.body.decrementOne, 1), p(active.body.decrementClose),
        p(active.body.recursiveClose), p(active.body.productClose),
        ...compactCloses(activations, depth)
      ])
    ]);
}

function buildBaseState(
  registry: Map<string, MaterialDefinition>,
  activations: readonly ActivationMaterials[],
  depth: number
): KpSchemeFullEvaluationState {
  return buildState(registry,
    `scheme-factorial.full.state.base-${depth}`, "base", [
      ...waitingPrefixLines(activations, depth),
      line(depth * 2, [
        p(activations[depth]!.body.baseLiteral, depth === 0 ? undefined : 1)
      , ...compactCloses(activations, depth)])
    ]);
}

function replaceBaseLiteralWithResult(input: {
  readonly registry: Map<string, MaterialDefinition>;
  readonly state: KpSchemeFullEvaluationState;
  readonly material: ActivationMaterials;
  readonly valueId: string;
  readonly sourceOccurrenceId: string;
  readonly actionId: string;
}): KpSchemeFullEvaluationState {
  const id = input.material.baseResult!;
  register(input.registry, id, "1", {
    kind: "primitive-result",
    sourceOccurrenceId: input.sourceOccurrenceId,
    valueId: input.valueId,
    introducedByActionId: input.actionId
  });
  return replaceMaterial(input.registry, input.state,
    input.material.body.baseLiteral, id,
    `scheme-factorial.full.state.base-resolved-${input.material.depth}`, "base");
}

function collapseInnermostProduct(input: {
  readonly registry: Map<string, MaterialDefinition>;
  readonly prior: KpSchemeFullEvaluationState;
  readonly activationMaterials: readonly ActivationMaterials[];
  readonly shellDepth: number;
  readonly actionId: string;
  readonly resultValueId: string;
  readonly resultLexeme: string;
}): KpSchemeFullEvaluationState {
  const resultId = `scheme-factorial.full.material.return-${input.shellDepth}.value`;
  register(input.registry, resultId, input.resultLexeme, {
    kind: "primitive-result",
    sourceOccurrenceId: "scheme-source.factorial-3.occurrence.0.2.3",
    valueId: input.resultValueId,
    introducedByActionId: input.actionId
  });
  const closes = compactCloses(input.activationMaterials, input.shellDepth);
  return buildState(input.registry,
    `scheme-factorial.full.state.return-${input.shellDepth}`, "return", [
      ...waitingPrefixLines(input.activationMaterials, input.shellDepth),
      line(input.shellDepth * 2, [
        p(resultId, input.shellDepth === 0 ? undefined : 1), ...closes])
    ]);
}

function actionFromDiff(
  input: KpSchemeFullEvaluationActionSeed & {
    readonly from: KpSchemeFullEvaluationState;
    readonly to: KpSchemeFullEvaluationState;
  }
): KpSchemeFullEvaluationAction {
  const fromIds = new Set(input.from.tokens.map(({ id }) => id));
  const toIds = new Set(input.to.tokens.map(({ id }) => id));
  const { from: _from, to: _to, ...action } = input;
  return Object.freeze({
    ...action,
    eventIds: Object.freeze([...input.eventIds]),
    introducedMaterialIds: Object.freeze([...toIds].filter((id) => !fromIds.has(id))),
    withdrawnMaterialIds: Object.freeze([...fromIds].filter((id) => !toIds.has(id)))
  }) as unknown as KpSchemeFullEvaluationAction;
}

function validateMaterialDiff(
  from: KpSchemeFullEvaluationState,
  to: KpSchemeFullEvaluationState,
  actions: readonly KpSchemeFullEvaluationAction[]
): void {
  const fromIds = new Set(from.tokens.map(({ id }) => id));
  const toIds = new Set(to.tokens.map(({ id }) => id));
  const introduced = actions.flatMap((action) => action.introducedMaterialIds);
  const withdrawn = actions.flatMap((action) => action.withdrawnMaterialIds);
  requireUnique(introduced, introduced.length, "introduced material");
  requireUnique(withdrawn, withdrawn.length, "withdrawn material");
  const expectedIntroduced = [...toIds].filter((id) => !fromIds.has(id));
  const expectedWithdrawn = [...fromIds].filter((id) => !toIds.has(id));
  if (!sameSet(introduced, expectedIntroduced) ||
      !sameSet(withdrawn, expectedWithdrawn)) {
    throw new Error(`Material ledger does not account for ${from.id} -> ${to.id}.`);
  }
  const fromById = new Map(from.tokens.map((token) => [token.id, token]));
  for (const token of to.tokens) {
    const prior = fromById.get(token.id);
    if (prior !== undefined &&
        (prior.lexeme !== token.lexeme ||
          JSON.stringify(prior.provenance) !== JSON.stringify(token.provenance))) {
      throw new Error(`Persistent material ${token.id} changes identity.`);
    }
  }
}

function buildState(
  registry: Map<string, MaterialDefinition>,
  id: string,
  kind: KpSchemeFullEvaluationState["kind"],
  lines: readonly Line[]
): KpSchemeFullEvaluationState {
  let nativeCode = "";
  const tokens: KpSchemeFullEvaluationMaterial[] = [];
  lines.forEach((entry, lineIndex) => {
    if (lineIndex > 0) nativeCode += "\n";
    nativeCode += " ".repeat(entry.indent);
    for (const placement of entry.materials) {
      nativeCode += " ".repeat(placement.gap ?? 0);
      const definition = registry.get(placement.id);
      if (definition === undefined) throw new Error(`Unknown material ${placement.id}.`);
      const start = nativeCode.length;
      nativeCode += definition.lexeme;
      tokens.push(Object.freeze({
        ...definition,
        span: Object.freeze({ start, end: nativeCode.length })
      }));
    }
  });
  return Object.freeze({ id, kind, nativeCode, tokens: Object.freeze(tokens) });
}

function replaceMaterial(
  registry: Map<string, MaterialDefinition>,
  state: KpSchemeFullEvaluationState,
  fromId: string,
  toId: string,
  id: string,
  kind: KpSchemeFullEvaluationState["kind"]
): KpSchemeFullEvaluationState {
  const lines = state.nativeCode.split("\n");
  const placementsByLine = lines.map(() => [] as Placement[]);
  for (const token of state.tokens) {
    const before = state.nativeCode.slice(0, token.span.start);
    const lineIndex = before.split("\n").length - 1;
    const lineStart = before.lastIndexOf("\n") + 1;
    const column = token.span.start - lineStart;
    const placements = placementsByLine[lineIndex]!;
    const occupied = placements.reduce((sum, placement) =>
      sum + (placement.gap ?? 0) + registry.get(placement.id)!.lexeme.length, 0);
    placements.push(p(token.id === fromId ? toId : token.id,
      Math.max(0, column - occupied)));
  }
  const rebuilt = placementsByLine.map((materials, index) => {
    const first = state.tokens.find((token) => {
      const before = state.nativeCode.slice(0, token.span.start);
      return before.split("\n").length - 1 === index;
    });
    const indent = first === undefined ? 0
      : first.span.start - (state.nativeCode.slice(0, first.span.start)
        .lastIndexOf("\n") + 1);
    const firstPlacement = materials[0];
    if (firstPlacement !== undefined) {
      materials[0] = { ...firstPlacement, gap: Math.max(0,
        (firstPlacement.gap ?? 0) - indent) };
    }
    return line(indent, materials);
  });
  return buildState(registry, id, kind, rebuilt);
}

function waitingPrefixLines(
  activations: readonly ActivationMaterials[],
  depth: number
): Line[] {
  const result: Line[] = [];
  for (let index = 0; index < depth; index += 1) {
    const body = activations[index]!.body;
    result.push(line(index * 2, [
      p(body.productOpen), p(body.multiply), p(body.productValue, 1)
    ]));
  }
  return result;
}

function compactCloses(
  activations: readonly ActivationMaterials[],
  depth: number
): Placement[] {
  return Array.from({ length: depth }, (_, offset) =>
    p(activations[depth - 1 - offset]!.body.productClose));
}

function register(
  registry: Map<string, MaterialDefinition>,
  id: string,
  lexeme: string,
  provenance: KpSchemeCodeMaterialProvenance
): void {
  const existing = registry.get(id);
  const material = Object.freeze({ id, lexeme, provenance: deepFreeze(provenance) });
  if (existing !== undefined && JSON.stringify(existing) !== JSON.stringify(material)) {
    throw new Error(`Material ${id} has conflicting definitions.`);
  }
  registry.set(id, material);
}

function sourceProvenance(sourceOccurrenceId: string): KpSchemeCodeMaterialProvenance {
  return Object.freeze({ kind: "source", sourceOccurrenceId });
}

function activationProvenance(
  sourceOccurrenceId: string,
  activationId: string,
  introducedByActionId: string
): KpSchemeCodeMaterialProvenance {
  return Object.freeze({
    kind: "activation",
    sourceOccurrenceId,
    activationId,
    introducedByActionId
  });
}

function validateState(state: KpSchemeFullEvaluationState): void {
  requireUnique(state.tokens.map(({ id }) => id), state.tokens.length,
    `${state.id} material`);
  let priorEnd = 0;
  for (const token of state.tokens) {
    if (token.span.start < priorEnd || token.span.end <= token.span.start ||
        state.nativeCode.slice(token.span.start, token.span.end) !== token.lexeme) {
      throw new Error(`Material ${token.id} does not reconstruct ${state.id}.`);
    }
    priorEnd = token.span.end;
  }
}

function sourceNodes(document: KpSchemeSourceDocument) {
  return {
    definition: listAt(document, [0]),
    signature: listAt(document, [0, 1]),
    parameter: atomAt(document, [0, 1, 1]),
    body: listAt(document, [0, 2]),
    ifKeyword: atomAt(document, [0, 2, 0]),
    predicate: listAt(document, [0, 2, 1]),
    equals: atomAt(document, [0, 2, 1, 0]),
    predicateN: atomAt(document, [0, 2, 1, 1]),
    zero: atomAt(document, [0, 2, 1, 2]),
    base: atomAt(document, [0, 2, 2]),
    product: listAt(document, [0, 2, 3]),
    multiply: atomAt(document, [0, 2, 3, 0]),
    productN: atomAt(document, [0, 2, 3, 1]),
    recursiveCall: listAt(document, [0, 2, 3, 2]),
    recursiveOperator: atomAt(document, [0, 2, 3, 2, 0]),
    decrement: listAt(document, [0, 2, 3, 2, 1]),
    subtract: atomAt(document, [0, 2, 3, 2, 1, 0]),
    decrementN: atomAt(document, [0, 2, 3, 2, 1, 1]),
    decrementOne: atomAt(document, [0, 2, 3, 2, 1, 2]),
    invocation: listAt(document, [1]),
    invocationOperator: atomAt(document, [1, 0]),
    invocationArgument: atomAt(document, [1, 1])
  } as const;
}

function integerValue(trace: KpSchemeTrace, valueId: string): number {
  for (const snapshot of trace.snapshots) {
    const value = snapshot.state.values.find(({ id }) => id === valueId);
    if (value?.kind === "integer") return (value as KpSchemeIntegerValue).exactInteger;
  }
  throw new Error(`Trace lacks integer value ${valueId}.`);
}

function requiredEvent(
  trace: KpSchemeTrace,
  predicate: (event: KpSchemeTraceEvent) => boolean
): KpSchemeTraceEvent {
  const event = trace.events.find(predicate);
  if (event === undefined) throw new Error("Factorial full evaluation lacks trace authority.");
  return event;
}

function stateMetrics(states: readonly KpSchemeFullEvaluationState[]): {
  readonly widthCh: number;
  readonly lines: number;
} {
  return {
    widthCh: Math.max(...states.flatMap(({ nativeCode }) =>
      nativeCode.split("\n").map((line_) => line_.length))),
    lines: Math.max(...states.map(({ nativeCode }) => nativeCode.split("\n").length))
  };
}

function pointForToken(
  state: KpSchemeFullEvaluationState,
  token: KpSchemeFullEvaluationMaterial,
  metrics: { readonly widthCh: number; readonly lines: number }
): { readonly x: number; readonly y: number } {
  const before = state.nativeCode.slice(0, token.span.start);
  const lineIndex = before.split("\n").length - 1;
  const column = token.span.start - (before.lastIndexOf("\n") + 1);
  const lines = state.nativeCode.split("\n");
  const offset = lines.length === 1
    ? (metrics.widthCh - (lines[0]?.length ?? 0)) / 2 : 0;
  return {
    x: column + offset,
    y: (metrics.lines - lines.length) * 0.75 + lineIndex * 1.5
  };
}

function introductionOrigin(
  action: KpSchemeFullEvaluationAction,
  id: string,
  from: KpSchemeFullEvaluationState,
  to: KpSchemeFullEvaluationState,
  metrics: { readonly widthCh: number; readonly lines: number }
): { readonly x: number; readonly y: number } {
  if (action.kind === "ExpandProcedure") {
    return pointForId(from, action.operatorMaterialId, metrics);
  }
  if (action.kind === "ProjectBinding") {
    const suffix = id.endsWith("predicate-value") ? ".body.predicate-n"
      : id.endsWith("product-value") ? ".body.product-n"
        : ".body.decrement-n";
    return pointForId(from, findId(from, suffix), metrics);
  }
  return pointForId(to, id, metrics);
}

function withdrawalDestination(
  action: KpSchemeFullEvaluationAction,
  id: string,
  from: KpSchemeFullEvaluationState,
  to: KpSchemeFullEvaluationState,
  metrics: { readonly widthCh: number; readonly lines: number }
): { readonly x: number; readonly y: number } {
  if (action.kind === "BindArgument") {
    // Only the argument demonstrates binding; wrapper syntax closes in place so
    // the body remains readable instead of becoming a stream of crossing glyphs.
    return id === action.argumentMaterialId
      ? pointForId(from, action.parameterMaterialId, metrics)
      : pointForId(from, id, metrics);
  }
  if (action.kind === "ProjectBinding") {
    return pointForId(from, id, metrics);
  }
  const introduced = action.introducedMaterialIds[0];
  if (introduced !== undefined && to.tokens.some(({ id: candidate }) =>
    candidate === introduced)) {
    return pointForId(to, introduced, metrics);
  }
  const retained = to.tokens[0];
  return retained === undefined
    ? pointForId(from, id, metrics)
    : pointForToken(to, retained, metrics);
}

function introducedProgress(
  action: KpSchemeFullEvaluationAction,
  id: string,
  progress: number
): number {
  if (action.kind === "ExpandProcedure") {
    const delay = id.includes("lambda") ? 0 : 0.14;
    return unit((progress - delay) / (1 - delay));
  }
  if (action.kind === "ProjectBinding") return unit((progress - 0.52) / 0.48);
  return unit((progress - 0.42) / 0.58);
}

function withdrawnProgress(
  action: KpSchemeFullEvaluationAction,
  id: string,
  progress: number
): number {
  if (action.kind === "BindArgument" && id === action.argumentMaterialId) {
    return unit(progress / 0.7);
  }
  if (action.kind === "ProjectBinding") return unit((progress - 0.42) / 0.42);
  if (action.kind === "ChooseBranch") return unit((progress - 0.12) / 0.76);
  return unit(progress / 0.78);
}

function pointForId(
  state: KpSchemeFullEvaluationState,
  id: string,
  metrics: { readonly widthCh: number; readonly lines: number }
): { readonly x: number; readonly y: number } {
  const material = state.tokens.find((token) => token.id === id);
  if (material === undefined) throw new Error(`State ${state.id} lacks ${id}.`);
  return pointForToken(state, material, metrics);
}

function findId(state: KpSchemeFullEvaluationState, suffix: string): string {
  const material = state.tokens.find(({ id }) => id.endsWith(suffix));
  if (material === undefined) throw new Error(`State ${state.id} lacks ${suffix}.`);
  return material.id;
}

function sampledToken(
  material: KpSchemeFullEvaluationMaterial,
  motionId: string,
  point: { readonly x: number; readonly y: number },
  opacity: number,
  scale: number
): KpSchemeFactorialFullEvaluationSample["tokens"][number] {
  return Object.freeze({
    motionId,
    materialId: material.id,
    lexeme: material.lexeme,
    xCh: round(point.x),
    yEm: round(point.y),
    opacity: round(opacity),
    scale: round(scale),
    provenance: material.provenance
  });
}

function multiplicationCaption(arguments_: readonly number[], result: number): string {
  return `${arguments_[0]} × ${arguments_[1]} becomes ${result}; the value returns outward.`;
}

function transitionId(depth: number, phase: string): string {
  return `scheme-factorial.full.transition.${depth}.${phase}`;
}

function actionId(depth: number, phase: string): string {
  return `scheme-factorial.full.action.${depth}.${phase}`;
}

function p(id: string, gap?: number): Placement {
  return gap === undefined ? { id } : { id, gap };
}

function line(indent: number, materials: readonly Placement[]): Line {
  return { indent, materials };
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

function smooth(value: number): number {
  const normalized = unit(value);
  return normalized * normalized * (3 - 2 * normalized);
}

function finiteProgress(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Factorial full-evaluation progress must be finite.");
  }
  return unit(value);
}

function unit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value) => new Set(right).has(value));
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
  if (expression.kind !== "list") throw new Error("Expected Scheme list.");
  return expression;
}

function atomAt(
  document: KpSchemeSourceDocument,
  address: readonly number[]
): Extract<KpSchemeSourceExpression, { readonly kind: "atom" }> {
  const expression = expressionAt(document, address);
  if (expression.kind !== "atom") throw new Error("Expected Scheme atom.");
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

function deepFreeze<Value>(value: Value): Value {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}
