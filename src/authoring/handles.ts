export type PositiveInteger<Value extends number> =
  `${Value}` extends "0" | `-${string}` | `${string}.${string}` ? never : Value;
export type SemanticVersion<Value extends string> =
  Value extends `${number}.${number}.${number}` ? Value : never;
export type ProtocolVersion<Value extends string> =
  Value extends `${string}.v${number}` ? Value : never;

export interface KpCapabilityHandle<Id extends string, Major extends number> {
  readonly kind: "capability-handle";
  readonly id: Id;
  readonly major: Major;
}

export interface KpProviderHandle<
  Id extends string,
  Protocol extends string,
  Version extends string
> {
  readonly kind: "provider-handle";
  readonly id: Id;
  readonly protocol: Protocol;
  readonly version: Version;
}

export interface KpCapabilityRef<Id extends string, Major extends number> {
  readonly id: Id;
  readonly major: Major;
}

export interface KpProviderRef<
  Id extends string,
  Protocol extends string,
  Version extends string
> {
  readonly id: Id;
  readonly protocol: Protocol;
  readonly version: Version;
}

type AnyCapabilityHandle = KpCapabilityHandle<string, number>;
type AnyProviderHandle = KpProviderHandle<string, string, string>;

export interface KpConceptAuthoringScope<
  Capabilities extends readonly AnyCapabilityHandle[],
  Providers extends readonly AnyProviderHandle[]
> {
  capability<const Handle extends Capabilities[number]>(
    handle: Handle
  ): KpCapabilityRef<Handle["id"], Handle["major"]>;
  provider<const Handle extends Providers[number]>(
    handle: Handle
  ): KpProviderRef<Handle["id"], Handle["protocol"], Handle["version"]>;
}

export function defineCapability<const Id extends `${string}.${string}`, const Major extends number>(
  input: { readonly id: Id; readonly major: Major & PositiveInteger<Major> }
): KpCapabilityHandle<Id, Major> {
  if (!Number.isInteger(input.major) || input.major <= 0) {
    throw new RangeError("Capability major must be a positive integer.");
  }
  return Object.freeze({
    kind: "capability-handle",
    id: input.id,
    major: input.major
  });
}

export function defineProviderRef<
  const Id extends `${string}.${string}`,
  const Protocol extends string,
  const Version extends string
>(input: {
  readonly id: Id;
  readonly protocol: Protocol & ProtocolVersion<Protocol>;
  readonly version: Version & SemanticVersion<Version>;
}): KpProviderHandle<Id, Protocol, Version> {
  return Object.freeze({
    kind: "provider-handle",
    id: input.id,
    protocol: input.protocol,
    version: input.version
  });
}

export function defineConceptScope<
  const Capabilities extends readonly AnyCapabilityHandle[],
  const Providers extends readonly AnyProviderHandle[]
>(input: {
  readonly capabilities: Capabilities;
  readonly providers: Providers;
}): KpConceptAuthoringScope<Capabilities, Providers> {
  const capabilityKeys = new Set(input.capabilities.map((item) => `${item.id}@${item.major}`));
  const providerKeys = new Set(input.providers.map((item) =>
    `${item.id}@${item.version}:${item.protocol}`
  ));
  return Object.freeze({
    capability<const Handle extends Capabilities[number]>(
      handle: Handle
    ): KpCapabilityRef<Handle["id"], Handle["major"]> {
      if (!capabilityKeys.has(`${handle.id}@${handle.major}`)) {
        throw new Error(`Capability ${handle.id}@${handle.major} is not available in this scope.`);
      }
      return Object.freeze({ id: handle.id, major: handle.major });
    },
    provider<const Handle extends Providers[number]>(
      handle: Handle
    ): KpProviderRef<Handle["id"], Handle["protocol"], Handle["version"]> {
      if (!providerKeys.has(`${handle.id}@${handle.version}:${handle.protocol}`)) {
        throw new Error(`Provider ${handle.id}@${handle.version} is not available in this scope.`);
      }
      return Object.freeze({
        id: handle.id,
        protocol: handle.protocol,
        version: handle.version
      });
    }
  });
}
