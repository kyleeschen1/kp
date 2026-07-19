type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false;
type Expect<Value extends true> = Value;
type IsAny<Value> = 0 extends (1 & Value) ? true : false;
type Not<Value extends boolean> = Value extends true ? false : true;

interface FixtureCapabilityHandle<Id extends string, Major extends number> {
  readonly kind: "capability";
  readonly id: Id;
  readonly major: Major;
}

interface FixtureProviderHandle<Id extends string, Output> {
  readonly kind: "provider";
  readonly id: Id;
  readonly output: Output;
}

declare function defineFixtureCapability<const Id extends string, const Major extends number>(
  input: { readonly id: Id; readonly major: Major }
): FixtureCapabilityHandle<Id, Major>;

declare function defineFixtureProvider<const Id extends string, Output>(
  input: { readonly id: Id; readonly output: Output }
): FixtureProviderHandle<Id, Output>;

declare function beginFixtureConcept<
  const Available extends readonly FixtureCapabilityHandle<string, number>[]
>(input: { readonly capabilities: Available }): <
  const Used extends readonly Available[number][]
>(definition: { readonly uses: Used }) => {
  readonly capabilities: Available;
  readonly uses: Used;
};

export const equationCapability = defineFixtureCapability({
  id: "kp.equation",
  major: 1
});
export const balanceCapability = defineFixtureCapability({
  id: "kp.balance",
  major: 1
});
export const linearProvider = defineFixtureProvider({
  id: "linear-problems.exact-rational",
  output: { numerator: 5, denominator: 2 } as const
});
export const equationConcept = beginFixtureConcept({
  capabilities: [equationCapability] as const
})({
  uses: [equationCapability] as const
});

// @ts-expect-error balance is not in this concept's available capability tuple.
beginFixtureConcept({ capabilities: [equationCapability] as const })({ uses: [balanceCapability] });

export type LiteralCapabilityIdIsPreserved = Expect<
  Equal<typeof equationCapability.id, "kp.equation">
>;
export type LiteralCapabilityMajorIsPreserved = Expect<
  Equal<typeof equationCapability.major, 1>
>;
export type ProviderOutputIsPropagated = Expect<
  Equal<typeof linearProvider.output, { readonly numerator: 5; readonly denominator: 2 }>
>;
export type ConceptUseStaysNarrow = Expect<
  Equal<typeof equationConcept.uses[number]["id"], "kp.equation">
>;
export type PublicFixtureDoesNotLeakAny = Expect<
  Not<IsAny<typeof equationConcept | typeof linearProvider>>
>;

export type FixtureRoomCommand =
  | { readonly type: "seek"; readonly checkpointId: string }
  | { readonly type: "set-mode"; readonly mode: "watch" | "touch" | "review" };

export function fixtureCommandKey(command: FixtureRoomCommand): string {
  switch (command.type) {
    case "seek":
      return command.checkpointId;
    case "set-mode":
      return command.mode;
    default: {
      const exhaustive: never = command;
      return exhaustive;
    }
  }
}

