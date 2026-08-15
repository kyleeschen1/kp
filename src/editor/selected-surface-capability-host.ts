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
  if (capability === "equation-katex") {
    const client = await import("./equation-surface-capability.ts");
    await registerOnceAsync(
      registry,
      "editor-animation-surface.equation.katex",
      client.registerKpEditorEquationSurfaceCapability
    );
    return;
  }
  if (capability === "log-exponent") {
    const client = await import("./log-exponent-surface-capability.ts");
    registerOnce(
      registry,
      "editor-animation-surface.log-exponent.canonical-native-katex",
      () => client.registerKpEditorLogExponentSurfaceCapability(registry)
    );
    return;
  }
  if (capability === "log-quotient") {
    const client = await import("./log-quotient-surface-capability.ts");
    registerOnce(
      registry,
      "editor-animation-surface.log-quotient.canonical-native-katex",
      () => client.registerKpEditorLogQuotientSurfaceCapability(registry)
    );
    return;
  }
  if (capability === "exact-fraction-quantity") {
    const client = await import("./exact-fraction-quantity-surface-capability.ts");
    registerOnce(
      registry,
      "editor-animation-surface.exact-fraction-quantity.synchronized",
      () => client.registerKpEditorExactFractionQuantitySurfaceCapability(registry)
    );
    return;
  }
  if (capability === "operation-evaluation") {
    const client = await import("./operation-evaluation-surface-capability.ts");
    registerOnce(
      registry,
      "editor-animation-surface.operation-evaluation.canonical-native-katex",
      () => client.registerKpEditorOperationEvaluationSurfaceCapability(registry)
    );
    return;
  }
  if (capability === "place-value-addition") {
    const client = await import("./place-value-addition-surface-capability.ts");
    registerOnce(
      registry,
      "editor-animation-surface.place-value-addition.synchronized",
      () => client.registerKpEditorPlaceValueAdditionSurfaceCapability(registry)
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
