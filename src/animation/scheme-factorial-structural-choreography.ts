import type {
  KpSchemeCheckpointProjection,
  KpSchemeSemanticCheckpoint
} from "../semantic/scheme-factorial-checkpoint-projector.ts";
import type {
  KpSchemeSourceDocument,
  KpSchemeSourceExpression
} from "../semantic/scheme-factorial-source-model.ts";

export type KpSchemeStructuralDirection = "fold" | "bloom";

export interface KpSchemeStructuralExpressionMotion {
  readonly expressionId: string;
  readonly depth: number;
  readonly direction: KpSchemeStructuralDirection;
  readonly contentInterval: readonly [number, number];
  readonly membraneInterval: readonly [number, number];
}

export interface KpSchemeWaitingShellMotion {
  readonly materialId: string;
  readonly sourceExpressionId: string;
  readonly runtimeIds: readonly string[];
  readonly state: "persistent" | "entering";
  readonly interval: readonly [number, number];
}

export interface KpSchemeStructuralTransition {
  readonly id: string;
  readonly fromCheckpointId: string;
  readonly toCheckpointId: string;
  readonly expressionMotions: readonly KpSchemeStructuralExpressionMotion[];
  readonly waitingShells: readonly KpSchemeWaitingShellMotion[];
}

export interface KpSchemeStructuralChoreography {
  readonly schemaVersion: "kp.scheme-factorial-structural-choreography.v1";
  readonly transitions: readonly KpSchemeStructuralTransition[];
}

export interface KpSchemeStructuralSample {
  readonly progress: number;
  readonly expressions: readonly {
    readonly expressionId: string;
    readonly depth: number;
    readonly direction: KpSchemeStructuralDirection;
    readonly contentProgress: number;
    readonly membraneProgress: number;
  }[];
  readonly waitingShells: readonly {
    readonly materialId: string;
    readonly sourceExpressionId: string;
    readonly runtimeIds: readonly string[];
    readonly state: "persistent" | "entering";
    readonly progress: number;
  }[];
}

export function compileKpSchemeFactorialStructuralChoreography(input: {
  readonly document: KpSchemeSourceDocument;
  readonly checkpoints: KpSchemeCheckpointProjection;
}): KpSchemeStructuralChoreography {
  const source = requiredCheckpoint(input.checkpoints, "source");
  const seed = requiredCheckpoint(input.checkpoints, "definition-seed");
  const first = requiredCheckpoint(input.checkpoints, "first-descent");
  const repeated = requiredCheckpoint(input.checkpoints, "repeated-descent");
  const definition = input.document.forms[0]!;
  const body = definition.kind === "list" ? definition.children[2] : undefined;
  if (body === undefined) throw new Error("Factorial definition has no body.");

  return Object.freeze({
    schemaVersion: "kp.scheme-factorial-structural-choreography.v1",
    transitions: Object.freeze([
      transition(
        "definition-to-seed",
        source,
        seed,
        compileExpressionMotions(definition, "fold"),
        shellMotions(source, seed)
      ),
      transition(
        "seed-to-first-descent",
        seed,
        first,
        compileExpressionMotions(body, "bloom"),
        shellMotions(seed, first)
      ),
      transition(
        "first-to-repeated-descent",
        first,
        repeated,
        [],
        shellMotions(first, repeated)
      )
    ])
  });
}

export function sampleKpSchemeStructuralTransition(
  transition: KpSchemeStructuralTransition,
  progress: number
): KpSchemeStructuralSample {
  const normalized = clamp(progress);
  return Object.freeze({
    progress: normalized,
    expressions: Object.freeze(transition.expressionMotions.map((motion) =>
      Object.freeze({
        expressionId: motion.expressionId,
        depth: motion.depth,
        direction: motion.direction,
        contentProgress: interval(normalized, motion.contentInterval),
        membraneProgress: interval(normalized, motion.membraneInterval)
      }))),
    waitingShells: Object.freeze(transition.waitingShells.map((shell) =>
      Object.freeze({
        materialId: shell.materialId,
        sourceExpressionId: shell.sourceExpressionId,
        runtimeIds: shell.runtimeIds,
        state: shell.state,
        progress: shell.state === "persistent"
          ? 1
          : interval(normalized, shell.interval)
      })))
  });
}

function compileExpressionMotions(
  root: KpSchemeSourceExpression,
  direction: KpSchemeStructuralDirection
): readonly KpSchemeStructuralExpressionMotion[] {
  const expressions = collectLists(root, 0);
  const depths = [...new Set(expressions.map(({ depth }) => depth))]
    .sort((left, right) => direction === "fold" ? right - left : left - right);
  return Object.freeze(expressions.map(({ expression, depth }) => {
    const order = depths.indexOf(depth);
    const groupStart = order / depths.length;
    const groupEnd = (order + 1) / depths.length;
    const span = groupEnd - groupStart;
    const contentInterval = direction === "fold"
      ? pair(groupStart, groupEnd - span * 0.18)
      : pair(groupStart + span * 0.18, groupEnd);
    const membraneInterval = direction === "fold"
      ? pair(groupStart + span * 0.18, groupEnd)
      : pair(groupStart, groupEnd - span * 0.18);
    return Object.freeze({
      expressionId: expression.id,
      depth,
      direction,
      contentInterval,
      membraneInterval
    });
  }));
}

function shellMotions(
  from: KpSchemeSemanticCheckpoint,
  to: KpSchemeSemanticCheckpoint
): readonly KpSchemeWaitingShellMotion[] {
  const prior = new Set(from.material.filter(({ kind }) =>
    kind === "waiting-shell").map(({ id }) => id));
  const shells = to.material.filter(({ kind }) => kind === "waiting-shell");
  const enteringCount = shells.filter(({ id }) => !prior.has(id)).length;
  let enteringIndex = 0;
  return Object.freeze(shells.map((shell) => {
    const persistent = prior.has(shell.id);
    const index = persistent ? 0 : enteringIndex++;
    return Object.freeze({
      materialId: shell.id,
      sourceExpressionId: shell.sourceExpressionIds[0]!,
      runtimeIds: shell.runtimeIds,
      state: persistent ? "persistent" as const : "entering" as const,
      interval: persistent
        ? pair(0, 0)
        : pair(index / enteringCount, (index + 1) / enteringCount)
    });
  }));
}

function collectLists(
  expression: KpSchemeSourceExpression,
  depth: number
): readonly {
  readonly expression: Extract<KpSchemeSourceExpression, { readonly kind: "list" }>;
  readonly depth: number;
}[] {
  if (expression.kind === "atom") return [];
  return [{ expression, depth }, ...expression.children.flatMap((child) =>
    collectLists(child, depth + 1))];
}

function transition(
  id: string,
  from: KpSchemeSemanticCheckpoint,
  to: KpSchemeSemanticCheckpoint,
  expressionMotions: readonly KpSchemeStructuralExpressionMotion[],
  waitingShells: readonly KpSchemeWaitingShellMotion[]
): KpSchemeStructuralTransition {
  return Object.freeze({
    id: `scheme-factorial.structural.${id}`,
    fromCheckpointId: from.id,
    toCheckpointId: to.id,
    expressionMotions: Object.freeze([...expressionMotions]),
    waitingShells: Object.freeze([...waitingShells])
  });
}

function requiredCheckpoint(
  projection: KpSchemeCheckpointProjection,
  suffix: string
): KpSchemeSemanticCheckpoint {
  const checkpoint = projection.checkpoints.find(({ id }) =>
    id.endsWith(suffix));
  if (checkpoint === undefined) throw new Error(`Missing checkpoint ${suffix}.`);
  return checkpoint;
}

function pair(start: number, end: number): readonly [number, number] {
  return Object.freeze([round(start), round(end)]);
}

function interval(progress: number, range: readonly [number, number]): number {
  if (range[0] === range[1]) return progress >= range[1] ? 1 : 0;
  return round(clamp((progress - range[0]) / (range[1] - range[0])));
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Scheme structural progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
