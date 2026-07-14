import type {
  KpLawCheckResult,
  KpLawFailure
} from "../semantic/asset-laws.ts";

export type KpAnimationCombinatorEffectKind =
  | "annotation"
  | "diagnostic"
  | "external-port"
  | "focus"
  | "layout"
  | "projection"
  | "representation"
  | "runtime"
  | "custom";

export interface KpAnimationCombinatorEffect {
  readonly id: string;
  readonly kind: KpAnimationCombinatorEffectKind;
  readonly summary: string;
  readonly targetId?: string | undefined;
}

export interface CreateKpAnimationCombinatorEffectInput {
  readonly id: string;
  readonly kind: KpAnimationCombinatorEffectKind;
  readonly summary: string;
  readonly targetId?: string | undefined;
}

export interface KpAnimationCombinatorResult<TValue> {
  readonly value: TValue;
  readonly effects: readonly KpAnimationCombinatorEffect[];
}

export interface CreateKpAnimationCombinatorResultInput<TValue> {
  readonly value: TValue;
  readonly effects?: readonly KpAnimationCombinatorEffect[] | undefined;
}

export function createKpAnimationCombinatorEffect(
  input: CreateKpAnimationCombinatorEffectInput
): KpAnimationCombinatorEffect {
  assertNonEmpty(input.id, "Animation combinator effect id");
  assertNonEmpty(input.kind, `Animation combinator effect ${input.id} kind`);
  assertNonEmpty(
    input.summary,
    `Animation combinator effect ${input.id} summary`
  );

  return {
    id: input.id,
    kind: input.kind,
    summary: input.summary,
    ...(input.targetId === undefined ? {} : { targetId: input.targetId })
  };
}

export function createKpAnimationCombinatorResult<TValue>(
  input: CreateKpAnimationCombinatorResultInput<TValue>
): KpAnimationCombinatorResult<TValue> {
  return {
    value: input.value,
    effects: (input.effects ?? []).map(cloneEffect)
  };
}

export function mapKpAnimationCombinatorResult<TValue, TNext>(
  result: KpAnimationCombinatorResult<TValue>,
  map: (value: TValue) => TNext
): KpAnimationCombinatorResult<TNext> {
  return {
    value: map(result.value),
    effects: result.effects.map(cloneEffect)
  };
}

export function chainKpAnimationCombinatorResult<TValue, TNext>(
  result: KpAnimationCombinatorResult<TValue>,
  chain: (value: TValue) => KpAnimationCombinatorResult<TNext>
): KpAnimationCombinatorResult<TNext> {
  const next = chain(result.value);

  return {
    value: next.value,
    effects: [
      ...result.effects.map(cloneEffect),
      ...next.effects.map(cloneEffect)
    ]
  };
}

export function checkKpAnimationCombinatorEffectOrder(
  result: KpAnimationCombinatorResult<unknown>,
  expectedEffectIds: readonly string[]
): KpLawCheckResult {
  const actualEffectIds = result.effects.map((effect) => effect.id);
  const failures: KpLawFailure[] = [];

  if (!stringListsEqual(actualEffectIds, expectedEffectIds)) {
    failures.push({
      path: "effects",
      message:
        `Animation combinator result must preserve effect order ${expectedEffectIds.join(" -> ")}.`
    });
  }

  return {
    lawId: "animation-combinator.effect-order",
    passed: failures.length === 0,
    failures
  };
}

function cloneEffect(
  effect: KpAnimationCombinatorEffect
): KpAnimationCombinatorEffect {
  return {
    id: effect.id,
    kind: effect.kind,
    summary: effect.summary,
    ...(effect.targetId === undefined ? {} : { targetId: effect.targetId })
  };
}

function stringListsEqual(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}

