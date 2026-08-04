import type {
  KpLispList,
  KpLispSemanticModel
} from "../semantic/lisp-semantic-model.ts";

export interface KpLispMaterialInterval {
  readonly start: number;
  readonly end: number;
}

export interface KpLispExpressionFoldSchedule {
  readonly expressionId: string;
  readonly depth: number;
  readonly childExpressionIds: readonly string[];
  readonly fold: {
    readonly contents: KpLispMaterialInterval;
    readonly parentheses: KpLispMaterialInterval;
  };
  readonly unfold: {
    readonly parentheses: KpLispMaterialInterval;
    readonly contents: KpLispMaterialInterval;
  };
}

export interface KpLispFoldSchedule {
  readonly id: "fold-schedule.lisp.lambda-application";
  readonly duration: number;
  readonly expressions: readonly KpLispExpressionFoldSchedule[];
  readonly frontiers: readonly {
    readonly depth: number;
    readonly expressionIds: readonly string[];
  }[];
}

export interface KpLispFoldSample {
  readonly expressionId: string;
  readonly contentCompression: number;
  readonly parenthesisCompression: number;
}

const contentDuration = 2;
const parenthesisLag = 1;
const parenthesisDuration = 2;

export function compileKpLispFoldSchedule(
  semantic: KpLispSemanticModel
): KpLispFoldSchedule {
  const mutable: MutableSchedule[] = [];
  const duration = scheduleList(semantic.root, 0, mutable);
  const expressions = mutable.map((entry) => Object.freeze({
    expressionId: entry.expression.id,
    depth: entry.depth,
    childExpressionIds: Object.freeze(entry.childExpressionIds),
    fold: Object.freeze({
      contents: interval(entry.start, entry.start + contentDuration),
      parentheses: interval(
        entry.start + parenthesisLag,
        entry.start + parenthesisLag + parenthesisDuration
      )
    }),
    unfold: Object.freeze({
      parentheses: mirrorInterval(
        entry.start + parenthesisLag,
        entry.start + parenthesisLag + parenthesisDuration,
        duration
      ),
      contents: mirrorInterval(
        entry.start,
        entry.start + contentDuration,
        duration
      )
    })
  }));
  const depths = [...new Set(expressions.map(({ depth }) => depth))]
    .sort((left, right) => right - left);

  return Object.freeze({
    id: "fold-schedule.lisp.lambda-application",
    duration,
    expressions: Object.freeze(expressions),
    frontiers: Object.freeze(depths.map((depth) => Object.freeze({
      depth,
      expressionIds: Object.freeze(expressions.filter((entry) =>
        entry.depth === depth).map(({ expressionId }) => expressionId))
    })))
  });
}

export function sampleKpLispFoldSchedule(
  schedule: KpLispFoldSchedule,
  progress: number,
  direction: "fold" | "unfold"
): readonly KpLispFoldSample[] {
  const time = clamp01(progress) * schedule.duration;
  return Object.freeze(schedule.expressions.map((expression) => {
    if (direction === "fold") {
      return sample(
        expression.expressionId,
        intervalProgress(expression.fold.contents, time),
        intervalProgress(expression.fold.parentheses, time)
      );
    }
    return sample(
      expression.expressionId,
      stableUnit(1 - intervalProgress(expression.unfold.contents, time)),
      stableUnit(1 - intervalProgress(expression.unfold.parentheses, time))
    );
  }));
}

interface MutableSchedule {
  readonly expression: KpLispList;
  readonly depth: number;
  readonly start: number;
  readonly childExpressionIds: readonly string[];
}

function scheduleList(
  expression: KpLispSemanticModel["root"],
  depth: number,
  output: MutableSchedule[]
): number {
  if (expression.kind === "atom") return 0;
  const childLists = expression.children.filter(
    (child): child is KpLispList => child.kind === "list"
  );
  const childCompletion = childLists.map((child) =>
    scheduleList(child, depth + 1, output));
  const start = childCompletion.length === 0 ? 0 : Math.max(...childCompletion);
  const complete = start + parenthesisLag + parenthesisDuration;
  output.push({
    expression,
    depth,
    start,
    childExpressionIds: childLists.map(({ id }) => id)
  });
  return complete;
}

function interval(start: number, end: number): KpLispMaterialInterval {
  return Object.freeze({ start, end });
}

function mirrorInterval(
  start: number,
  end: number,
  duration: number
): KpLispMaterialInterval {
  return interval(duration - end, duration - start);
}

function intervalProgress(
  value: KpLispMaterialInterval,
  time: number
): number {
  return stableUnit((time - value.start) / (value.end - value.start));
}

function sample(
  expressionId: string,
  contentCompression: number,
  parenthesisCompression: number
): KpLispFoldSample {
  return Object.freeze({
    expressionId,
    contentCompression,
    parenthesisCompression
  });
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function stableUnit(value: number): number {
  // URL seeks and reverse playback must reconstruct identical material states.
  return Math.round(clamp01(value) * 1e12) / 1e12;
}
