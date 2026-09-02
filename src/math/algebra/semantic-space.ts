declare const kpSemanticSpaceValue: unique symbol;

export interface KpSemanticSpace<
  Value,
  Id extends string = string
> {
  readonly kind: "semantic-space";
  readonly id: Id;
  readonly label: string;
  readonly dimension: number;
  /** Keeps equal-dimensional domains nominally distinct at composition sites. */
  readonly [kpSemanticSpaceValue]: (value: Value) => Value;
}

export type KpSemanticSpaceValue<Space> =
  Space extends KpSemanticSpace<infer Value, string> ? Value : never;

export interface KpSemanticSpaceInput<Id extends string> {
  readonly id: Id;
  readonly label?: string | undefined;
  readonly dimension: number;
}

export function createKpSemanticSpace<const Id extends string>(
  input: KpSemanticSpaceInput<Id>
): KpSemanticSpace<readonly number[], Id> {
  return createSpace(input);
}

export function defineKpSemanticSpace<Value>():
<const Id extends string>(
  input: KpSemanticSpaceInput<Id>
) => KpSemanticSpace<Value, Id> {
  return (input) => createSpace(input);
}

export function sameKpSemanticSpace(
  left: KpSemanticSpace<unknown>,
  right: KpSemanticSpace<unknown>
): boolean {
  return left.id === right.id && left.dimension === right.dimension;
}

function createSpace<Value, const Id extends string>(
  input: KpSemanticSpaceInput<Id>
): KpSemanticSpace<Value, Id> {
  requireText(input.id, "Semantic space id");
  if (!Number.isSafeInteger(input.dimension) || input.dimension < 1) {
    throw new Error(
      `Semantic space ${input.id} requires a positive integer dimension.`
    );
  }
  const label = input.label ?? input.id;
  requireText(label, `Semantic space ${input.id} label`);
  return Object.freeze({
    kind: "semantic-space" as const,
    id: input.id,
    label,
    dimension: input.dimension
  }) as KpSemanticSpace<Value, Id>;
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
