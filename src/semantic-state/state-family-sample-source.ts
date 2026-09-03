import type { KpAggregateSemanticSnapshot } from "./aggregate-snapshot.ts";
import { requireAndFreezeKpPersistentSemanticValue } from
  "./entity-version-store.ts";
import type {
  KpAppliedTransformationId,
  KpSemanticSlotId,
  KpTransformationDefinitionId
} from "./identity.ts";
import {
  isKpSemanticProgressOne,
  isKpSemanticProgressZero,
  type KpSemanticProgress
} from "./semantic-progress.ts";
import type {
  KpAppliedSemanticStateFamily
} from "./state-family-definition.ts";
import type {
  KpSemanticStateDiscreteTransitionDeclaration,
  KpSemanticStateInterpolationDeclaration
} from "./state-family-transition.ts";
import type {
  KpSemanticStateGroupDescriptor,
  KpSemanticStateMemberMap
} from "./authoring-schema.ts";

export interface KpPersistentSemanticStateReadSource {
  readonly schemaVersion: "kp.semantic-state-read-source.v1";
  readonly kind: "persistent-snapshot";
  readonly namespace: string;
  readonly snapshot: KpAggregateSemanticSnapshot;
}

export interface KpEphemeralSemanticStateApplicationReference {
  readonly schemaVersion:
    "kp.ephemeral-semantic-state-application-reference.v1";
  readonly kind: "ephemeral-semantic-state-application-reference";
  readonly definitionId: KpTransformationDefinitionId;
  readonly transformationId: KpAppliedTransformationId;
  readonly applicationId: string;
}

export interface KpEphemeralSemanticStateDriverOverlay<Value = unknown> {
  readonly schemaVersion: "kp.ephemeral-semantic-state-driver-overlay.v1";
  readonly kind: "ephemeral-semantic-state-driver-overlay";
  readonly declarationId: string;
  readonly transitionMode: "semantic-interpolation" | "discrete";
  readonly targetSlotId: KpSemanticSlotId;
  readonly targetPath: readonly string[];
  readonly value: Value;
}

export interface KpEphemeralSemanticStateReadSource {
  readonly schemaVersion: "kp.semantic-state-read-source.v1";
  readonly kind: "ephemeral-driver-overlay";
  readonly namespace: string;
  readonly application: KpEphemeralSemanticStateApplicationReference;
  readonly progress: KpSemanticProgress;
  readonly base: KpPersistentSemanticStateReadSource;
  readonly drivers: readonly KpEphemeralSemanticStateDriverOverlay[];
  readonly driverIndex: Readonly<Record<KpSemanticSlotId, number>>;
}

export type KpSemanticStateReadSource =
  | KpPersistentSemanticStateReadSource
  | KpEphemeralSemanticStateReadSource;

export interface KpEphemeralSemanticStateDriverInput<Value> {
  readonly declaration:
    | KpSemanticStateInterpolationDeclaration<Value>
    | KpSemanticStateDiscreteTransitionDeclaration<Value>;
  readonly value: Value;
}

export type KpSemanticStateSampleSourceErrorCode =
  | "duplicate-overlay-driver"
  | "endpoint-overlay-progress"
  | "foreign-overlay-driver"
  | "invalid-overlay-value"
  | "presentation-only-overlay-driver"
  | "undeclared-overlay-driver";

export class KpSemanticStateSampleSourceError extends Error {
  readonly code: KpSemanticStateSampleSourceErrorCode;
  readonly declarationId: string | undefined;
  readonly targetSlotId: KpSemanticSlotId | undefined;
  override readonly cause: unknown;

  constructor(input: {
    readonly code: KpSemanticStateSampleSourceErrorCode;
    readonly declarationId?: string;
    readonly targetSlotId?: KpSemanticSlotId;
    readonly cause?: unknown;
    readonly message: string;
  }) {
    super(input.message);
    this.name = "KpSemanticStateSampleSourceError";
    this.code = input.code;
    this.declarationId = input.declarationId;
    this.targetSlotId = input.targetSlotId;
    this.cause = input.cause;
  }
}

export function adaptKpSnapshotToSemanticStateReadSource(
  snapshot: KpAggregateSemanticSnapshot
): KpPersistentSemanticStateReadSource {
  return Object.freeze({
    schemaVersion: "kp.semantic-state-read-source.v1",
    kind: "persistent-snapshot",
    namespace: snapshot.namespace,
    snapshot
  });
}

export function createKpEphemeralSemanticStateReadSource<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  Parameters
>(input: {
  readonly application: KpAppliedSemanticStateFamily<Root, Parameters>;
  readonly progress: KpSemanticProgress;
  readonly drivers: readonly KpEphemeralSemanticStateDriverInput<unknown>[];
}): KpEphemeralSemanticStateReadSource {
  if (isKpSemanticProgressZero(input.progress) ||
    isKpSemanticProgressOne(input.progress)) {
    throw new KpSemanticStateSampleSourceError({
      code: "endpoint-overlay-progress",
      message: "Ephemeral semantic driver overlays require interior progress; exact endpoints retain their persistent snapshot source."
    });
  }
  const declarationById = new Map(
    input.application.transitionPlan.declarations.map((declaration) => [
      declaration.id,
      declaration
    ])
  );
  const driverIndex: Record<KpSemanticSlotId, number> = {};
  const drivers = input.drivers.map(({ declaration, value }, index) => {
    const canonical = declarationById.get(declaration.id);
    if (declaration.target.namespace !== input.application.commit.before.namespace) {
      throw new KpSemanticStateSampleSourceError({
        code: "foreign-overlay-driver",
        declarationId: declaration.id,
        targetSlotId: declaration.target.slotId,
        message: `Ephemeral driver ${JSON.stringify(declaration.id)} belongs to ${JSON.stringify(declaration.target.namespace)}, not ${JSON.stringify(input.application.commit.before.namespace)}.`
      });
    }
    if (canonical === undefined ||
      canonical.target.slotId !== declaration.target.slotId) {
      throw new KpSemanticStateSampleSourceError({
        code: "undeclared-overlay-driver",
        declarationId: declaration.id,
        targetSlotId: declaration.target.slotId,
        message: `Ephemeral driver ${JSON.stringify(declaration.id)} is not an exact semantic or discrete declaration of application ${JSON.stringify(input.application.applicationId)}.`
      });
    }
    if (canonical.transitionMode === "presentation-only") {
      throw new KpSemanticStateSampleSourceError({
        code: "presentation-only-overlay-driver",
        declarationId: declaration.id,
        targetSlotId: declaration.target.slotId,
        message: `Presentation-only transition ${JSON.stringify(declaration.id)} cannot contribute a semantic driver overlay.`
      });
    }
    if (canonical.transitionMode !== declaration.transitionMode) {
      throw new KpSemanticStateSampleSourceError({
        code: "undeclared-overlay-driver",
        declarationId: declaration.id,
        targetSlotId: declaration.target.slotId,
        message: `Ephemeral driver ${JSON.stringify(declaration.id)} does not match the declared transition mode.`
      });
    }
    if (driverIndex[declaration.target.slotId] !== undefined) {
      throw new KpSemanticStateSampleSourceError({
        code: "duplicate-overlay-driver",
        declarationId: declaration.id,
        targetSlotId: declaration.target.slotId,
        message: `Ephemeral semantic source repeats driver slot ${JSON.stringify(declaration.target.slotId)}.`
      });
    }
    let frozenValue: unknown;
    try {
      frozenValue = requireAndFreezeKpPersistentSemanticValue(value);
    } catch (cause) {
      throw new KpSemanticStateSampleSourceError({
        code: "invalid-overlay-value",
        declarationId: declaration.id,
        targetSlotId: declaration.target.slotId,
        cause,
        message: `Ephemeral driver ${JSON.stringify(declaration.id)} produced a non-structural value.`
      });
    }
    driverIndex[declaration.target.slotId] = index;
    return Object.freeze({
      schemaVersion:
        "kp.ephemeral-semantic-state-driver-overlay.v1" as const,
      kind: "ephemeral-semantic-state-driver-overlay" as const,
      declarationId: declaration.id,
      transitionMode: declaration.transitionMode,
      targetSlotId: declaration.target.slotId,
      targetPath: Object.freeze([...declaration.target.path]),
      value: frozenValue
    });
  });

  // This view deliberately has no snapshot or version identity of its own.
  // Its only durable authority is the already committed application and base.
  return Object.freeze({
    schemaVersion: "kp.semantic-state-read-source.v1",
    kind: "ephemeral-driver-overlay",
    namespace: input.application.commit.before.namespace,
    application: Object.freeze({
      schemaVersion:
        "kp.ephemeral-semantic-state-application-reference.v1",
      kind: "ephemeral-semantic-state-application-reference",
      definitionId: input.application.definitionId,
      transformationId: input.application.transformationId,
      applicationId: input.application.applicationId
    }),
    progress: input.progress,
    base: adaptKpSnapshotToSemanticStateReadSource(
      input.application.commit.before
    ),
    drivers: Object.freeze(drivers),
    driverIndex: Object.freeze(driverIndex)
  });
}
