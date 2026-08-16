import {
  kpSemanticAnimationCompatibilityLedger
} from "./semantic-animation-compatibility-ledger.ts";
import {
  createKpEquationSurfaceDispositionLedger,
  kpEquationSurfaceDispositionValues
} from "./equation-surface-disposition-ledger.ts";
import {
  createKpEquationSurfaceInventory
} from "./equation-surface-inventory.ts";
import {
  createKpAnimationCatalogueProjection
} from "../editor/animation-catalogue-projection.ts";
import {
  createKpEditorAnimationLibrary
} from "../editor/animation-library.ts";
import {
  dispatchKpEditorAnimationSurface
} from "../editor/animation-surface-dispatch.ts";
import {
  deriveKpEditorSelectedSurfaceCapabilities
} from "../editor/selected-surface-capability.ts";

export interface KpPostConvergenceInfrastructureInventory {
  readonly schemaVersion: "kp.post-convergence-infrastructure-inventory.v1";
  readonly catalogue: {
    readonly loadableAssetCount: number;
    readonly renderTargetCounts: Readonly<Record<string, number>>;
  };
  readonly equationSurfaces: {
    readonly count: number;
    readonly dispositionCounts: Readonly<Record<string, number>>;
  };
  readonly selectedCapabilities: {
    readonly count: number;
    readonly ids: readonly string[];
    readonly callerCounts: Readonly<Record<string, number>>;
  };
  readonly compatibility: {
    readonly count: number;
    readonly statusCounts: Readonly<Record<string, number>>;
    readonly ids: readonly string[];
  };
  readonly sources: readonly string[];
}

// This is a projection of canonical declarations, never another membership
// registry. Its purpose is to keep prose and run baselines from becoming
// competing hand-maintained totals.
export function createKpPostConvergenceInfrastructureInventory():
KpPostConvergenceInfrastructureInventory {
  const catalogue = createKpAnimationCatalogueProjection();
  const equationInventory = createKpEquationSurfaceInventory();
  const dispositions = createKpEquationSurfaceDispositionLedger();
  const selectedCapabilityAssignments = uniqueBy(
    createKpEditorAnimationLibrary().flatMap((descriptor) => {
      const dispatch = dispatchKpEditorAnimationSurface(descriptor);
      return deriveKpEditorSelectedSurfaceCapabilities({
        animationId: descriptor.animationId,
        slotKinds: dispatch.slotKinds
      }).map((capabilityId) => Object.freeze({
        animationId: descriptor.animationId,
        capabilityId
      }));
    }),
    ({ animationId, capabilityId }) => `${animationId}\u0000${capabilityId}`
  );
  const selectedCapabilityIds = unique(selectedCapabilityAssignments.map(
    ({ capabilityId }) => capabilityId
  ));

  return Object.freeze({
    schemaVersion:
      "kp.post-convergence-infrastructure-inventory.v1" as const,
    catalogue: Object.freeze({
      loadableAssetCount: catalogue.entries.length,
      renderTargetCounts: countBy(catalogue.entries.flatMap(
        ({ renderTargetKinds }) => renderTargetKinds
      ))
    }),
    equationSurfaces: Object.freeze({
      count: equationInventory.entries.length,
      dispositionCounts: completeCounts(
        kpEquationSurfaceDispositionValues,
        dispositions.entries.map(({ disposition }) => disposition)
      )
    }),
    selectedCapabilities: Object.freeze({
      count: selectedCapabilityIds.length,
      ids: selectedCapabilityIds,
      callerCounts: countBy(selectedCapabilityAssignments.map(
        ({ capabilityId }) => capabilityId
      ))
    }),
    compatibility: Object.freeze({
      count: kpSemanticAnimationCompatibilityLedger.length,
      statusCounts: countBy(kpSemanticAnimationCompatibilityLedger.map(
        ({ status }) => status
      )),
      ids: Object.freeze(kpSemanticAnimationCompatibilityLedger
        .map(({ id }) => id)
        .sort())
    }),
    sources: Object.freeze([
      "src/editor/animation-catalogue-projection.ts",
      "src/architecture/equation-surface-inventory.ts",
      "src/architecture/equation-surface-disposition-ledger.ts",
      "src/editor/selected-surface-capability.ts",
      "src/architecture/semantic-animation-compatibility-ledger.ts"
    ])
  });
}

function completeCounts(
  values: readonly string[],
  observed: readonly string[]
): Readonly<Record<string, number>> {
  const counts = countBy(observed);
  return Object.freeze(Object.fromEntries(values.map((value) => [
    value,
    counts[value] ?? 0
  ])));
}

function countBy(values: readonly string[]): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return Object.freeze(Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) => left.localeCompare(right))
  ));
}

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort());
}

function uniqueBy<T>(
  values: readonly T[],
  key: (value: T) => string
): readonly T[] {
  const seen = new Set<string>();
  return Object.freeze(values.filter((value) => {
    const identity = key(value);
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  }));
}
