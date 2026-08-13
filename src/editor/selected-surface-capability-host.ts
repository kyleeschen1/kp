import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapterRegistry
} from "./animation-surface-adapter-registry.ts";
import {
  deriveKpEditorSelectedSurfaceCapabilities,
  kpEditorGraphSvgAnimationIds,
  type KpEditorSelectedSurfaceCapability
} from "./selected-surface-capability.ts";

export interface KpEditorSelectedSurfaceCapabilityHost {
  load(capability: KpEditorSelectedSurfaceCapability): Promise<void>;
  loadAll(
    capabilities: readonly KpEditorSelectedSurfaceCapability[]
  ): Promise<void>;
  loadSelected(input: Parameters<
    typeof deriveKpEditorSelectedSurfaceCapabilities
  >[0]): Promise<void>;
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
    const promise = loadCapability(capability, registry);
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
  if (capability === "equation-katex") {
    const client = await import("./equation-surface-capability.ts");
    await registerOnceAsync(
      registry,
      "editor-animation-surface.equation.katex",
      client.registerKpEditorEquationSurfaceCapability
    );
    return;
  }
  if (capability === "graph-webgl-3d") {
    const client = await import("./graph-3d-surface-capability.ts");
    registerOnce(
      registry,
      "editor-animation-surface.graph.webgl-3d",
      client.registerKpEditorGraph3DSurfaceCapability
    );
    return;
  }
  if (capability === "programming-trace") {
    const client = await import("./programming-surface-capability.ts");
    registerOnce(
      registry,
      "editor-animation-surface.programming.trace",
      client.registerKpEditorProgrammingSurfaceCapability
    );
    return;
  }
  if (capability === "graph-svg-economics") {
    const client = await import("./economics-graph-svg-surface-capability.ts");
    if (!registry.list().some(
      ({ id }) => id === "editor-animation-surface.graph.svg.economics"
    )) {
      registry.register(
        await client.createKpEconomicsGraphSvgSurfaceCapability()
      );
    }
    return;
  }
  const client = await import("./graph-svg-surface-capability.ts");
  await registerOnceAsync(
    registry,
    "editor-animation-surface.graph.svg",
    () => client.registerKpEditorGraphSvgSurfaceCapability(
      kpEditorGraphSvgAnimationIds
    )
  );
}

function registerOnce(
  registry: KpEditorAnimationSurfaceAdapterRegistry,
  adapterId: string,
  register: () => void
): void {
  if (!registry.list().some(({ id }) => id === adapterId)) register();
}

async function registerOnceAsync(
  registry: KpEditorAnimationSurfaceAdapterRegistry,
  adapterId: string,
  register: () => Promise<void | (() => void)>
): Promise<void> {
  if (!registry.list().some(({ id }) => id === adapterId)) await register();
}
