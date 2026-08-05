import type { KpAnimationAsset } from "../animation/asset.ts";
import {
  deriveKpAnimationCatalogueHealth,
  type KpAnimationCatalogueHealth
} from "./animation-catalogue-health.ts";
import {
  observeKpAnimationCatalogueHost
} from "./animation-catalogue-host-observation.ts";
import {
  deriveKpAnimationCatalogueHostOutcome,
  type KpAnimationCatalogueHostOutcome
} from "./animation-catalogue-host-outcome.ts";
import type {
  KpAnimationCatalogueEntry
} from "./animation-catalogue-projection.ts";
import type {
  KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";
import type {
  KpAnimationCatalogueSurfaceHostability
} from "./animation-catalogue-surface-hostability.ts";
import {
  KP_EDITOR_ANIMATION_FRAME_EVENT,
  disposeKpEditorAnimationPlayer,
  hydrateKpEditorAnimationPlayers
} from "./animation-player-controller.ts";
import {
  hydrateKpEditorAnimationSurfaces,
  kpEditorAnimationSurfaceAdapterRegistry
} from "./animation-surface-adapter-registry.ts";
import {
  kpEditorDiagramSvgAdapter,
  registerKpEditorDiagramSvgAdapter
} from "./diagram-svg-adapter.ts";

export interface KpAnimationCataloguePlayerHostObservation {
  readonly health: KpAnimationCatalogueHealth;
  readonly outcome: KpAnimationCatalogueHostOutcome;
}

export function mountKpAnimationCataloguePlayerHost(input: {
  readonly shell: HTMLElement;
  readonly entry: KpAnimationCatalogueEntry;
  readonly descriptor: KpEditorAnimationDescriptor;
  readonly hostability: KpAnimationCatalogueSurfaceHostability;
  readonly animation: KpAnimationAsset;
  readonly onObserved?:
    | ((observation: KpAnimationCataloguePlayerHostObservation) => void)
    | undefined;
}): () => void {
  ensureDiagramAdapter();
  hydrateKpEditorAnimationSurfaces(input.shell);
  const player = input.shell.querySelector<HTMLElement>(
    "[data-kp-animation-catalogue-stage] [data-kp-editor-animation-player]"
  );
  const stage = input.shell.querySelector<HTMLElement>(
    "[data-kp-animation-catalogue-stage]"
  );
  if (player === null || stage === null) {
    throw new Error("Catalogue player host requires one persistent stage player.");
  }

  let disposed = false;
  let observationComplete = false;
  const observer = new MutationObserver(publishObservation);
  const stopObservation = () => {
    if (observationComplete) return;
    observationComplete = true;
    observer.disconnect();
    player.removeEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, publishObservation);
  };
  function publishObservation(): void {
    if (disposed || observationComplete ||
      input.shell.dataset["kpAnimationCatalogueSelection"] !==
        input.entry.animationId) return;
    const hostObservation = observeKpAnimationCatalogueHost(input.shell);
    const outcome = deriveKpAnimationCatalogueHostOutcome({
      entry: input.entry,
      hostability: input.hostability,
      hostObservation
    });
    if (outcome === undefined) return;
    const health = deriveKpAnimationCatalogueHealth({
      hostability: input.hostability,
      hostObservation
    });
    stopObservation();
    input.onObserved?.(Object.freeze({ health, outcome }));
  }

  observer.observe(stage, { attributes: true, childList: true, subtree: true });
  player.addEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, publishObservation, {
    once: true
  });
  hydrateKpEditorAnimationPlayers(input.shell, {
    animationOverrides: [input.animation],
    descriptorOverrides: [input.descriptor]
  });

  return () => {
    if (disposed) return;
    disposed = true;
    stopObservation();
    // Svelte can detach the old player before effect cleanup runs. Dispose the
    // captured owner directly so GPU leases and adapter observers still close.
    disposeKpEditorAnimationPlayer(player);
  };
}

function ensureDiagramAdapter(): void {
  // Diagram SVG is the one eager base adapter. All richer selected
  // capabilities are still registered by the shared lazy capability host.
  if (kpEditorAnimationSurfaceAdapterRegistry.list().some(
    ({ id }) => id === kpEditorDiagramSvgAdapter.id
  )) return;
  registerKpEditorDiagramSvgAdapter();
}
