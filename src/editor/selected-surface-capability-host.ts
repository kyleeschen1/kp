import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapterRegistry
} from "./animation-surface-adapter-registry.ts";
import {
  deriveKpEditorSelectedSurfaceCapabilities,
  type KpEditorSelectedSurfaceCapability
} from "./selected-surface-capability.ts";
import {
  kpEditorSelectedSurfaceCapabilityDeclarationSet
} from "./selected-surface-capability-declarations.ts";

export interface KpEditorSelectedSurfaceCapabilityHost {
  load(capability: KpEditorSelectedSurfaceCapability): Promise<void>;
  loadAll(
    capabilities: readonly KpEditorSelectedSurfaceCapability[]
  ): Promise<void>;
  loadSelected(input: Parameters<
    typeof deriveKpEditorSelectedSurfaceCapabilities
  >[0]): Promise<void>;
}

export class KpEditorSelectedSurfaceCapabilityLoadError extends Error {
  override readonly name = "KpEditorSelectedSurfaceCapabilityLoadError";
  readonly code = "capability-load-failed" as const;
  readonly capability: KpEditorSelectedSurfaceCapability;

  constructor(
    capability: KpEditorSelectedSurfaceCapability,
    options: ErrorOptions = {}
  ) {
    super(`Editor surface capability ${capability} failed to load.`, options);
    this.capability = capability;
  }
}

export function createKpEditorSelectedSurfaceCapabilityHost(input: {
  readonly registry?: KpEditorAnimationSurfaceAdapterRegistry | undefined;
} = {}): KpEditorSelectedSurfaceCapabilityHost {
  const registry = input.registry ?? kpEditorAnimationSurfaceAdapterRegistry;
  const pending = new Map<
    KpEditorSelectedSurfaceCapability,
    Promise<void>
  >();

  const load = (
    capability: KpEditorSelectedSurfaceCapability
  ): Promise<void> => {
    const existing = pending.get(capability);
    if (existing !== undefined) return existing;
    // Cache only the optional module registration already owned by both old
    // hosts. Animation pack data remains solely in catalog-loader's cache.
    let promise: Promise<void>;
    promise = loadCapability(capability, registry).catch((cause: unknown) => {
      // Failed imports or registration are retryable; only fulfilled
      // capabilities become durable host state.
      if (pending.get(capability) === promise) pending.delete(capability);
      if (cause instanceof KpEditorSelectedSurfaceCapabilityLoadError) {
        throw cause;
      }
      throw new KpEditorSelectedSurfaceCapabilityLoadError(
        capability,
        { cause }
      );
    });
    pending.set(capability, promise);
    return promise;
  };

  return Object.freeze({
    load,
    async loadAll(
      capabilities: readonly KpEditorSelectedSurfaceCapability[]
    ) {
      await Promise.all([...new Set(capabilities)].map(load));
    },
    async loadSelected(selection: Parameters<
      typeof deriveKpEditorSelectedSurfaceCapabilities
    >[0]) {
      await Promise.all(
        deriveKpEditorSelectedSurfaceCapabilities(selection).map(load)
      );
    }
  });
}

export const kpEditorSelectedSurfaceCapabilityHost =
  createKpEditorSelectedSurfaceCapabilityHost();

async function loadCapability(
  capability: KpEditorSelectedSurfaceCapability,
  registry: KpEditorAnimationSurfaceAdapterRegistry
): Promise<void> {
  const declaration = kpEditorSelectedSurfaceCapabilityDeclarationSet.find(
    capability
  );
  await declaration.loadAndRegister(registry);
}
