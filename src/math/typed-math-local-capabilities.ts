export type KpTypedMathLocalCapabilityKind =
  | "linear-map" | "differentiable-map" | "second-derivative-map" | "finite-basis";

export interface KpTypedMathLocalCapability {
  readonly kind: KpTypedMathLocalCapabilityKind;
  readonly id: string;
}

/** Pure data: no callable phantom field or function source enters a snapshot. */
export interface KpTypedMathCapabilityReference {
  readonly schemaVersion: "kp.typed-math-capability-reference.v1";
  readonly kind: "local-math-capability-reference";
  readonly scope: string;
  readonly id: string;
  readonly version: string;
  readonly capabilityKind: KpTypedMathLocalCapabilityKind;
}

export interface KpTypedMathCapabilityBinding<Capability extends KpTypedMathLocalCapability> {
  readonly reference: KpTypedMathCapabilityReference;
  resolve(reference: KpTypedMathCapabilityReference): Capability;
}

export type KpTypedMathCapabilityErrorCode =
  | "kp.math.missing-capability" | "kp.math.stale-capability-version"
  | "kp.math.foreign-capability" | "kp.math.duplicate-capability-version"
  | "kp.math.invalid-capability" | "kp.math.capabilities-disposed";

export class KpTypedMathCapabilityError extends Error {
  readonly code: KpTypedMathCapabilityErrorCode;
  readonly capabilityId: string;
  constructor(code: KpTypedMathCapabilityErrorCode, capabilityId: string, message: string) {
    super(message);
    this.name = "KpTypedMathCapabilityError";
    this.code = code;
    this.capabilityId = capabilityId;
  }
}

/** Caller-owned executable bindings only, not another semantic object store. */
export function createKpTypedMathLocalCapabilities(scope: string) {
  requireText(scope, "scope");
  const registrations = new Map<string, KpTypedMathLocalCapability>();
  let disposed = false;
  const active = () => {
    if (disposed) throw new KpTypedMathCapabilityError(
      "kp.math.capabilities-disposed", scope, "Local math capabilities have been disposed."
    );
  };
  return Object.freeze({
    register<const Capability extends KpTypedMathLocalCapability>(input: {
      readonly version: string;
      readonly capability: Capability;
    }): KpTypedMathCapabilityBinding<Capability> {
      active();
      const capability = input.capability;
      requireText(capability.id, "capability id");
      requireText(input.version, "capability version");
      if (!Object.isFrozen(capability) || !["linear-map", "differentiable-map",
        "second-derivative-map", "finite-basis"].includes(capability.kind) ||
        !hasRequiredCallables(capability)) {
        throw new KpTypedMathCapabilityError("kp.math.invalid-capability", capability.id,
          "Register an immutable capability created by the owning math subsystem.");
      }
      const key = JSON.stringify([capability.id, input.version]);
      if (registrations.has(key)) throw new KpTypedMathCapabilityError(
        "kp.math.duplicate-capability-version", capability.id,
        "An existing capability version cannot be replaced; register a new explicit version."
      );
      registrations.set(key, capability);
      const reference: KpTypedMathCapabilityReference = Object.freeze({
        schemaVersion: "kp.typed-math-capability-reference.v1", kind: "local-math-capability-reference",
        scope, id: capability.id, version: input.version, capabilityKind: capability.kind
      });
      return Object.freeze({
        reference,
        resolve(candidate: KpTypedMathCapabilityReference): Capability {
          active();
          if (candidate.schemaVersion !== reference.schemaVersion || candidate.kind !== reference.kind ||
            candidate.scope !== scope || candidate.id !== reference.id ||
            candidate.capabilityKind !== reference.capabilityKind) {
            throw new KpTypedMathCapabilityError("kp.math.foreign-capability", candidate.id,
              "The stored capability reference does not belong to this local typed binding.");
          }
          if (candidate.version !== reference.version) throw new KpTypedMathCapabilityError(
            "kp.math.stale-capability-version", candidate.id,
            "The exact stored capability version is required; no latest-version substitution is allowed."
          );
          const resolved = registrations.get(key);
          if (resolved === undefined) throw new KpTypedMathCapabilityError(
            "kp.math.missing-capability", reference.id, "The exact registered capability is unavailable."
          );
          // This key is registered once by this typed binding and cannot be
          // overwritten. Resolve through the owner so disposal releases storage.
          return resolved as Capability;
        }
      });
    },
    inspect() { return Object.freeze({ scope, entries: registrations.size, status: disposed ? "disposed" : "active" }); },
    dispose() { registrations.clear(); disposed = true; }
  });
}

export function recoverKpTypedMathCapability<Capability extends KpTypedMathLocalCapability>(
  reference: KpTypedMathCapabilityReference,
  binding: KpTypedMathCapabilityBinding<Capability> | undefined
): Capability {
  if (binding === undefined) throw new KpTypedMathCapabilityError(
    "kp.math.missing-capability", reference.id,
    "Stored math data has no matching local executable capability; supply its exact version."
  );
  return binding.resolve(reference);
}

function hasRequiredCallables(capability: KpTypedMathLocalCapability): boolean {
  const record = capability as unknown as Readonly<Record<string, unknown>>;
  const required = capability.kind === "differentiable-map" ? ["evaluate", "derivativeAt"]
    : capability.kind === "finite-basis" ? ["coordinates", "fromCoordinates"] : ["apply"];
  return required.every(name => typeof record[name] === "function");
}

function requireText(value: string, label: string): void {
  if (typeof value !== "string" || value.trim().length === 0 || value.trim() !== value) {
    throw new KpTypedMathCapabilityError("kp.math.invalid-capability", String(value),
      `Math ${label} must be a nonempty trimmed identifier.`);
  }
}
