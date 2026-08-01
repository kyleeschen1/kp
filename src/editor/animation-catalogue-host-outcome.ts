import type {
  KpAnimationCatalogueHostObservation
} from "./animation-catalogue-health.ts";
import type {
  KpAnimationCatalogueEntry
} from "./animation-catalogue-projection.ts";
import type {
  KpAnimationCatalogueSurfaceHostability
} from "./animation-catalogue-surface-hostability.ts";

interface KpAnimationCatalogueHostOutcomeIdentity {
  readonly schemaVersion: "kp.animation-catalogue-host-outcome.v1";
  readonly kind: "animation-catalogue-host-outcome";
  readonly animationId: string;
  readonly descriptorId: string;
  readonly packId: KpAnimationCatalogueEntry["packId"];
}

export type KpAnimationCatalogueHostOutcome =
  | Readonly<KpAnimationCatalogueHostOutcomeIdentity & {
      readonly status: "painted";
      readonly surfaceKind:
        KpAnimationCatalogueSurfaceHostability["surfaceKind"];
      readonly adapterIds: readonly string[];
    }>
  | Readonly<KpAnimationCatalogueHostOutcomeIdentity & {
      readonly status: "capability-gap";
      readonly gapKind:
        | "missing-adapter"
        | "unsupported-surface"
        | "paint-failed";
      readonly message: string;
    }>
  | Readonly<KpAnimationCatalogueHostOutcomeIdentity & {
      readonly status: "load-failure";
      readonly message: string;
    }>;

export function deriveKpAnimationCatalogueHostOutcome(input: {
  readonly entry: KpAnimationCatalogueEntry;
  readonly hostability: KpAnimationCatalogueSurfaceHostability;
  readonly hostObservation: KpAnimationCatalogueHostObservation;
}): KpAnimationCatalogueHostOutcome | undefined {
  assertIdentity(input.entry, input.hostability);
  const identity = outcomeIdentity(input.entry);

  if (input.hostability.status === "missing-adapter") {
    const missingSlots = input.hostability.slots
      .filter(({ status }) => status === "missing-adapter")
      .map(({ slotKind }) => slotKind);
    return Object.freeze({
      ...identity,
      status: "capability-gap" as const,
      gapKind: "missing-adapter" as const,
      message: missingSlots.length === 0
        ? "The catalogue host is missing a required surface adapter."
        : `Missing catalogue surface adapters: ${missingSlots.join(", ")}.`
    });
  }

  if (input.hostability.status === "unsupported-surface") {
    const unsupported = input.hostability.unsupportedTargetKinds;
    return Object.freeze({
      ...identity,
      status: "capability-gap" as const,
      gapKind: "unsupported-surface" as const,
      message: unsupported.length === 0
        ? "The asset does not resolve to a supported catalogue surface."
        : `Unsupported catalogue render targets: ${unsupported.join(", ")}.`
    });
  }

  if (input.hostObservation.status === "failed") {
    return Object.freeze({
      ...identity,
      status: "capability-gap" as const,
      gapKind: "paint-failed" as const,
      message: input.hostObservation.message
    });
  }

  // Hostability alone cannot prove paint. Callers retain an explicit pending
  // state until a real host observation exists.
  if (input.hostObservation.status === "not-observed") return undefined;

  return Object.freeze({
    ...identity,
    status: "painted" as const,
    surfaceKind: input.hostability.surfaceKind,
    adapterIds: Object.freeze(input.hostability.slots.flatMap((slot) =>
      slot.adapterId === undefined ? [] : [slot.adapterId]
    ))
  });
}

export function createKpAnimationCatalogueLoadFailure(input: {
  readonly entry: KpAnimationCatalogueEntry;
  readonly error: unknown;
}): KpAnimationCatalogueHostOutcome {
  return Object.freeze({
    ...outcomeIdentity(input.entry),
    status: "load-failure" as const,
    message: input.error instanceof Error
      ? input.error.message
      : String(input.error)
  });
}

function assertIdentity(
  entry: KpAnimationCatalogueEntry,
  hostability: KpAnimationCatalogueSurfaceHostability
): void {
  if (
    hostability.animationId !== entry.animationId ||
    hostability.descriptorId !== entry.primaryDescriptorId
  ) {
    throw new Error(
      `Catalogue host outcome identity mismatch for ${entry.animationId}.`
    );
  }
}

function outcomeIdentity(
  entry: KpAnimationCatalogueEntry
): KpAnimationCatalogueHostOutcomeIdentity {
  return {
    schemaVersion: "kp.animation-catalogue-host-outcome.v1",
    kind: "animation-catalogue-host-outcome",
    animationId: entry.animationId,
    descriptorId: entry.primaryDescriptorId,
    packId: entry.packId
  };
}
