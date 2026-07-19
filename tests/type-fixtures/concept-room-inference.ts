import {
  defineCapability,
  defineConceptScope,
  defineProviderRef
} from "../../src/authoring/public-api.ts";

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false;
type Expect<Value extends true> = Value;
type IsAny<Value> = 0 extends (1 & Value) ? true : false;
type Not<Value extends boolean> = Value extends true ? false : true;

export const equationCapability = defineCapability({ id: "kp.equation", major: 1 });
export const balanceCapability = defineCapability({ id: "kp.balance", major: 1 });
export const linearProvider = defineProviderRef({
  id: "linear-problems.exact-rational",
  protocol: "linear-problem.v1",
  version: "1.0.0"
});
export const scope = defineConceptScope({
  capabilities: [equationCapability] as const,
  providers: [linearProvider] as const
});
export const equationRef = scope.capability(equationCapability);
export const providerRef = scope.provider(linearProvider);

// @ts-expect-error balance is not in this concept's available capability tuple.
scope.capability(balanceCapability);
// @ts-expect-error capability majors must be positive integers.
defineCapability({ id: "kp.invalid", major: 0 });
// @ts-expect-error provider versions are exact semantic versions.
defineProviderRef({ id: "provider.invalid", protocol: "linear-problem.v1", version: "latest" });
// @ts-expect-error protocol versions are explicitly versioned.
defineProviderRef({ id: "provider.invalid", protocol: "linear-problem", version: "1.0.0" });

export type LiteralCapabilityIdIsPreserved = Expect<
  Equal<typeof equationCapability.id, "kp.equation">
>;
export type LiteralCapabilityMajorIsPreserved = Expect<
  Equal<typeof equationCapability.major, 1>
>;
export type ProviderProtocolIsPreserved = Expect<
  Equal<typeof providerRef.protocol, "linear-problem.v1">
>;
export type DeclarativeCapabilityRefIsNarrow = Expect<
  Equal<typeof equationRef, { readonly id: "kp.equation"; readonly major: 1 }>
>;
export type PublicAuthoringSurfaceDoesNotLeakAny = Expect<
  Not<IsAny<typeof scope | typeof equationRef | typeof providerRef>>
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

