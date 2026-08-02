import {
  loadKpAnimationAsset,
  type KpLoadedAnimationAsset
} from "../animation/catalog-loader.ts";
import {
  economicsEquilibriumAnimationId
} from "../animation/economics-equilibrium-adapter.ts";
import {
  constantForceWorkEnergyAnimationId
} from "../animation/constant-force-work-energy-adapter.ts";
import {
  deriveKpAnimationCatalogueHealth,
  type KpAnimationCatalogueHealth
} from "./animation-catalogue-health.ts";
import type {
  KpAnimationCatalogueEntry
} from "./animation-catalogue-projection.ts";
import type {
  KpAnimationCatalogueReaderCompanion
} from "./animation-catalogue-reader-companion.ts";
import {
  inspectKpAnimationCatalogueSurfaceHostability,
  type KpAnimationCatalogueSurfaceHostability
} from "./animation-catalogue-surface-hostability.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapterRegistry
} from "./animation-surface-adapter-registry.ts";
import type {
  KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";
import {
  createKpEditorAnimationPlayerState,
  type KpEditorAnimationPlayerState
} from "./animation-player-state.ts";
import {
  dispatchKpEditorAnimationSurface
} from "./animation-surface-dispatch.ts";
import {
  createParameterizedConstantForceWorkEnergyAnimation,
  readKpConstantForceWorkEnergyParameters,
  type KpConstantForceWorkEnergyParameterState
} from "./constant-force-work-energy-parameters.ts";
import {
  createParameterizedEconomicsEquilibriumAnimation,
  readKpEconomicsEquilibriumParameters,
  type KpEconomicsEquilibriumParameterState
} from "./economics-equilibrium-parameters.ts";
import {
  kpEditorSelectedSurfaceCapabilityHost,
  type KpEditorSelectedSurfaceCapabilityHost
} from "./selected-surface-capability-host.ts";
import {
  kpVerifiedGeneratedLinearSolveAnimationId
} from "../tutorial/verified-generated-linear-solve-identity.ts";

type GeneratedLinearSolveReaderClient = typeof import(
  "./verified-generated-linear-solve-reader.ts"
);

export interface KpAnimationCataloguePreparedSelection {
  readonly animation: KpLoadedAnimationAsset["animation"];
  readonly descriptor: KpEditorAnimationDescriptor;
  readonly player: KpEditorAnimationPlayerState;
  readonly economicsParameters?:
    | KpEconomicsEquilibriumParameterState
    | undefined;
  readonly physicsParameters?:
    | KpConstantForceWorkEnergyParameterState
    | undefined;
  readonly readerCompanion?:
    | KpAnimationCatalogueReaderCompanion
    | undefined;
  readonly hostability: KpAnimationCatalogueSurfaceHostability;
  readonly health: KpAnimationCatalogueHealth;
}

export interface KpAnimationCatalogueSelectionPreparationService {
  prepare(input: {
    readonly entry: KpAnimationCatalogueEntry;
    readonly search: string;
    readonly playhead?: number | undefined;
  }): Promise<KpAnimationCataloguePreparedSelection>;
}

export function createKpAnimationCatalogueSelectionPreparationService(input: {
  readonly descriptors: readonly KpEditorAnimationDescriptor[];
  readonly capabilityHost?:
    | KpEditorSelectedSurfaceCapabilityHost
    | undefined;
  readonly registry?: KpEditorAnimationSurfaceAdapterRegistry | undefined;
  readonly loadAsset?: typeof loadKpAnimationAsset | undefined;
  readonly loadReaderCompanion?:
    | (() => Promise<KpAnimationCatalogueReaderCompanion>)
    | undefined;
}): KpAnimationCatalogueSelectionPreparationService {
  const capabilityHost = input.capabilityHost ??
    kpEditorSelectedSurfaceCapabilityHost;
  const registry = input.registry ?? kpEditorAnimationSurfaceAdapterRegistry;
  const loadAsset = input.loadAsset ?? loadKpAnimationAsset;
  const loadReaderCompanion = input.loadReaderCompanion ??
    loadGeneratedReaderCompanion;

  return Object.freeze({
    async prepare(selection: Parameters<
      KpAnimationCatalogueSelectionPreparationService["prepare"]
    >[0]) {
      const descriptor = input.descriptors.find(
        ({ id }) => id === selection.entry.primaryDescriptorId
      );
      if (descriptor === undefined) {
        throw new Error(
          `Catalogue entry ${selection.entry.animationId} is missing ` +
          `descriptor ${selection.entry.primaryDescriptorId}.`
        );
      }
      // Pack data and paint code stay independent until sampling. Starting
      // both here preserves the current direct-route latency without merging
      // either loader or its cache into this coordination service.
      const [loaded] = await Promise.all([
        loadAsset(selection.entry.animationId),
        capabilityHost.loadSelected({
          animationId: selection.entry.animationId,
          slotKinds: dispatchKpEditorAnimationSurface(descriptor).slotKinds
        })
      ]);
      assertLoadedIdentity(selection.entry, loaded);

      const economicsParameters = selection.entry.animationId ===
          economicsEquilibriumAnimationId
        ? readKpEconomicsEquilibriumParameters(selection.search)
        : undefined;
      const physicsParameters = selection.entry.animationId ===
          constantForceWorkEnergyAnimationId
        ? readKpConstantForceWorkEnergyParameters(selection.search)
        : undefined;
      const animation = economicsParameters !== undefined
        ? createParameterizedEconomicsEquilibriumAnimation(economicsParameters)
            .animation
        : physicsParameters !== undefined
          ? createParameterizedConstantForceWorkEnergyAnimation(
              physicsParameters
            ).animation
          : loaded.animation;
      const readerCompanion = selection.entry.animationId ===
          kpVerifiedGeneratedLinearSolveAnimationId
        ? await loadReaderCompanion()
        : undefined;
      const catalog = loaded.catalog.some(({ id }) => id === animation.id)
        ? loaded.catalog.map((candidate) =>
            candidate.id === animation.id ? animation : candidate
          )
        : [...loaded.catalog, animation];
      const player = createKpEditorAnimationPlayerState({
        descriptor,
        animation,
        catalog,
        progress: selection.playhead ?? 0
      });
      const hostability = inspectKpAnimationCatalogueSurfaceHostability({
        state: player,
        registry
      });

      return Object.freeze({
        animation,
        descriptor,
        player,
        ...(economicsParameters === undefined
          ? {}
          : { economicsParameters }),
        ...(physicsParameters === undefined ? {} : { physicsParameters }),
        ...(readerCompanion === undefined ? {} : { readerCompanion }),
        hostability,
        health: deriveKpAnimationCatalogueHealth({
          hostability,
          hostObservation: { status: "not-observed" }
        })
      });
    }
  });
}

let generatedReaderClientPromise:
  | Promise<GeneratedLinearSolveReaderClient>
  | undefined;

async function loadGeneratedReaderCompanion():
Promise<KpAnimationCatalogueReaderCompanion> {
  // This is one optional module promise shared by both catalogue hosts. It
  // replaces their duplicate caches without retaining reader state or output.
  const client = await (generatedReaderClientPromise ??= import(
    "./verified-generated-linear-solve-reader.ts"
  ));
  return client.createKpVerifiedGeneratedLinearSolveReaderCompanion();
}

function assertLoadedIdentity(
  entry: KpAnimationCatalogueEntry,
  loaded: KpLoadedAnimationAsset
): void {
  if (
    loaded.animation.id !== entry.animationId ||
    loaded.packId !== entry.packId
  ) {
    throw new Error(
      `Loaded catalogue asset ${loaded.animation.id} from ${loaded.packId}; ` +
      `expected ${entry.animationId} from ${entry.packId}.`
    );
  }
}
