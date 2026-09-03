import type {
  KpSemanticDerivationId,
  KpSemanticSlotId,
  KpSemanticStateIdentityScope
} from "./identity.ts";

export interface KpSemanticDerivedDependencyReference {
  readonly schemaVersion: "kp.semantic-derived-dependency.v1";
  readonly kind: "semantic-derived-dependency";
  readonly slotId: KpSemanticSlotId;
}

export interface KpSemanticDerivedBindingDeclaration {
  readonly schemaVersion: "kp.semantic-derived-binding.v1";
  readonly kind: "semantic-derived-binding";
  readonly derivationId: KpSemanticDerivationId;
  readonly slotId: KpSemanticSlotId;
  readonly dependencies: readonly KpSemanticDerivedDependencyReference[];
  readonly sourceId: string;
}

export type KpSemanticDerivedBindingErrorCode =
  | "derived-read-unsupported"
  | "derived-write-unsupported";

export class KpSemanticDerivedBindingError extends Error {
  readonly code: KpSemanticDerivedBindingErrorCode;
  readonly declaration: KpSemanticDerivedBindingDeclaration;

  constructor(input: {
    readonly code: KpSemanticDerivedBindingErrorCode;
    readonly declaration: KpSemanticDerivedBindingDeclaration;
    readonly message: string;
  }) {
    super(input.message);
    this.name = "KpSemanticDerivedBindingError";
    this.code = input.code;
    this.declaration = input.declaration;
  }
}

export function createKpSemanticDerivedBindingDeclaration(input: {
  readonly identities: KpSemanticStateIdentityScope;
  readonly derivationId: KpSemanticDerivationId;
  readonly slotId: KpSemanticSlotId;
  readonly dependencySlotIds: readonly KpSemanticSlotId[];
  readonly sourceId: string;
}): KpSemanticDerivedBindingDeclaration {
  const derivationPrefix = `kp-state/${input.identities.namespace}/derivation/`;
  const slotPrefix = `kp-state/${input.identities.namespace}/slot/`;
  assertPrefix(input.derivationId, derivationPrefix, "Derived binding identity");
  assertPrefix(input.slotId, slotPrefix, "Derived binding slot");
  if (input.sourceId.trim().length === 0) {
    throw new Error("A semantic derived binding requires a source id.");
  }
  if (input.dependencySlotIds.length === 0) {
    throw new Error("A semantic derived binding requires at least one dependency.");
  }
  const seen = new Set<KpSemanticSlotId>();
  const dependencies = input.dependencySlotIds.map((slotId) => {
    assertPrefix(slotId, slotPrefix, "Derived dependency slot");
    if (slotId === input.slotId) {
      throw new Error("A semantic derived binding cannot depend on its own slot.");
    }
    if (seen.has(slotId)) {
      throw new Error(
        `Semantic derived binding repeats dependency ${JSON.stringify(slotId)}.`
      );
    }
    seen.add(slotId);
    return Object.freeze({
      schemaVersion: "kp.semantic-derived-dependency.v1" as const,
      kind: "semantic-derived-dependency" as const,
      slotId
    });
  });
  return Object.freeze({
    schemaVersion: "kp.semantic-derived-binding.v1",
    kind: "semantic-derived-binding",
    derivationId: input.derivationId,
    slotId: input.slotId,
    dependencies: Object.freeze(dependencies),
    sourceId: input.sourceId
  });
}

export function unsupportedKpSemanticDerivedRead(
  declaration: KpSemanticDerivedBindingDeclaration
): never {
  throw new KpSemanticDerivedBindingError({
    code: "derived-read-unsupported",
    declaration,
    message: `Derived semantic slot ${JSON.stringify(declaration.slotId)} cannot be read: evaluation is deliberately deferred.`
  });
}

export function unsupportedKpSemanticDerivedWrite(
  declaration: KpSemanticDerivedBindingDeclaration
): never {
  throw new KpSemanticDerivedBindingError({
    code: "derived-write-unsupported",
    declaration,
    message: `Derived semantic slot ${JSON.stringify(declaration.slotId)} is read-only and cannot be written.`
  });
}

export function areKpSemanticDerivedBindingsEqual(
  left: KpSemanticDerivedBindingDeclaration,
  right: KpSemanticDerivedBindingDeclaration
): boolean {
  return left.derivationId === right.derivationId &&
    left.slotId === right.slotId &&
    left.sourceId === right.sourceId &&
    left.dependencies.length === right.dependencies.length &&
    left.dependencies.every((dependency, index) =>
      dependency.slotId === right.dependencies[index]?.slotId
    );
}

function assertPrefix(value: string, prefix: string, label: string): void {
  if (!value.startsWith(prefix)) {
    throw new Error(
      `${label} ${JSON.stringify(value)} does not belong to semantic state scope ${JSON.stringify(prefix.slice(0, -1))}.`
    );
  }
}
