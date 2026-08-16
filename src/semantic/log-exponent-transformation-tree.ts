import {
  kpCanonicalLogExponentAuthoredProgram,
  type KpLogExponentAuthoredProgram
} from "./log-exponent-authored-operations.ts";
import {
  kpCanonicalLogExponentSolveStates,
  type KpLogExponentSolveState,
  type KpLogExponentSolveStateId
} from "./log-exponent-solve-states.ts";
import {
  isKpCompiledLogExponentOperation,
  type KpCompiledLogExponentOperation
} from "./log-exponent-transformation-compiler.ts";
import {
  compileKpRegisteredLogExponentOperation
} from "./log-exponent-operation-dispatch.ts";

declare const kpLogExponentTransformationTreeAuthority: unique symbol;
const compiledTrees = new WeakSet<object>();

export interface KpCompiledLogExponentTransformationTree {
  readonly schemaVersion: "kp.compiled-log-exponent-transformation-tree.v1";
  readonly id: "tree.log-exponent.solve-two-power-x";
  readonly rootStateId: "log-exponent.state.source";
  readonly terminalStateId: "log-exponent.state.solved";
  readonly stateIds: readonly KpLogExponentSolveStateId[];
  readonly operations: readonly KpCompiledLogExponentOperation[];
  readonly [kpLogExponentTransformationTreeAuthority]: true;
}

export function compileKpCanonicalLogExponentTransformationTree(input: {
  readonly program?: KpLogExponentAuthoredProgram | undefined;
  readonly states?: readonly KpLogExponentSolveState[] | undefined;
} = {}): KpCompiledLogExponentTransformationTree {
  const program = input.program ?? kpCanonicalLogExponentAuthoredProgram;
  const states = input.states ?? kpCanonicalLogExponentSolveStates;
  const byId = new Map(states.map((state) => [state.id, state]));
  if (
    states[0]?.id !== "log-exponent.state.source" ||
    states.at(-1)?.id !== "log-exponent.state.solved" ||
    program.operations.length !== states.length - 1
  ) {
    throw new Error("The canonical log-exponent transformation tree requires one complete ordered path.");
  }
  const operations = Object.freeze(program.operations.map((operation) => {
    const source = byId.get(operation.sourceStateId);
    const target = byId.get(operation.targetStateId);
    if (source === undefined || target === undefined) {
      throw new Error(`Operation ${operation.id} references a missing tree state.`);
    }
    return compileKpRegisteredLogExponentOperation({
      operation,
      source,
      target
    });
  }));
  if (!operations.every(isKpCompiledLogExponentOperation)) {
    throw new Error("Every canonical tree edge requires nominal compiler authority.");
  }
  operations.forEach((edge, index) => {
    if (
      edge.operation.sourceStateId !== states[index]?.id ||
      edge.operation.targetStateId !== states[index + 1]?.id
    ) {
      throw new Error(`Compiled tree edge ${edge.operation.id} breaks canonical adjacency.`);
    }
  });
  const tree = Object.freeze({
    schemaVersion: "kp.compiled-log-exponent-transformation-tree.v1" as const,
    id: "tree.log-exponent.solve-two-power-x" as const,
    rootStateId: "log-exponent.state.source" as const,
    terminalStateId: "log-exponent.state.solved" as const,
    stateIds: Object.freeze(states.map(({ id }) => id)),
    operations
  }) as KpCompiledLogExponentTransformationTree;
  compiledTrees.add(tree);
  return tree;
}

export function isKpCompiledLogExponentTransformationTree(
  value: unknown
): value is KpCompiledLogExponentTransformationTree {
  return typeof value === "object" && value !== null && compiledTrees.has(value);
}

export const kpCanonicalLogExponentTransformationTree =
  compileKpCanonicalLogExponentTransformationTree();
