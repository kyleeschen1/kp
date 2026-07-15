import {
  KP_EDITOR_ANIMATION_FRAME_EVENT
} from "./animation-player-controller.ts";
import type {
  KpEditorAnimationPlayerState
} from "./animation-player-state.ts";
import type {
  KpEditorAnimationSurfaceSlotKind
} from "./animation-surface-dispatch.ts";

export interface KpEditorAnimationSurfaceAdapterRenderInput {
  readonly player: HTMLElement;
  readonly slot: HTMLElement;
  readonly state: KpEditorAnimationPlayerState;
}

export interface KpEditorAnimationSurfaceAdapter {
  readonly id: string;
  readonly slotKind: KpEditorAnimationSurfaceSlotKind;
  readonly priority?: number | undefined;
  supports(state: KpEditorAnimationPlayerState): boolean;
  render(input: KpEditorAnimationSurfaceAdapterRenderInput): void;
}

export interface KpEditorAnimationSurfaceAdapterRegistry {
  register(adapter: KpEditorAnimationSurfaceAdapter): () => void;
  resolve(
    slotKind: KpEditorAnimationSurfaceSlotKind,
    state: KpEditorAnimationPlayerState
  ): KpEditorAnimationSurfaceAdapter | undefined;
  list(): readonly KpEditorAnimationSurfaceAdapter[];
}

export function createKpEditorAnimationSurfaceAdapterRegistry(
  initialAdapters: readonly KpEditorAnimationSurfaceAdapter[] = []
): KpEditorAnimationSurfaceAdapterRegistry {
  const adapters: KpEditorAnimationSurfaceAdapter[] = [];

  const registry: KpEditorAnimationSurfaceAdapterRegistry = {
    register(adapter) {
      if (adapters.some((candidate) => candidate.id === adapter.id)) {
        throw new Error(`Duplicate editor animation surface adapter id: ${adapter.id}`);
      }

      adapters.push(adapter);
      adapters.sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0));

      return () => {
        const index = adapters.indexOf(adapter);
        if (index >= 0) adapters.splice(index, 1);
      };
    },
    resolve(slotKind, state) {
      return adapters.find(
        (adapter) => adapter.slotKind === slotKind && adapter.supports(state)
      );
    },
    list() {
      return [...adapters];
    }
  };

  initialAdapters.forEach((adapter) => registry.register(adapter));
  return registry;
}

export const kpEditorAnimationSurfaceAdapterRegistry =
  createKpEditorAnimationSurfaceAdapterRegistry();

export function hydrateKpEditorAnimationSurfaces(
  root: ParentNode,
  registry: KpEditorAnimationSurfaceAdapterRegistry =
    kpEditorAnimationSurfaceAdapterRegistry
): void {
  root.querySelectorAll<HTMLElement>("[data-kp-editor-animation-player]")
    .forEach((player) => {
      if (player.dataset["kpEditorAnimationSurfaceHydrated"] === "true") return;

      player.dataset["kpEditorAnimationSurfaceHydrated"] = "true";
      player.addEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, (event) => {
        if (!(event instanceof CustomEvent)) return;
        renderKpEditorAnimationSurfaceFrame(player, event.detail, registry);
      });
    });
}

export function renderKpEditorAnimationSurfaceFrame(
  player: HTMLElement,
  state: KpEditorAnimationPlayerState,
  registry: KpEditorAnimationSurfaceAdapterRegistry =
    kpEditorAnimationSurfaceAdapterRegistry
): void {
  player.querySelectorAll<HTMLElement>("[data-kp-editor-animation-surface-slot]")
    .forEach((slot) => {
      const slotKind = slot.dataset["kpEditorAnimationSurfaceSlot"];
      if (!isSurfaceSlotKind(slotKind)) return;

      const adapter = registry.resolve(slotKind, state);
      if (adapter === undefined) {
        slot.dataset["kpEditorAnimationAdapterStatus"] = "missing";
        delete slot.dataset["kpEditorAnimationAdapterId"];
        return;
      }

      slot.dataset["kpEditorAnimationAdapterStatus"] = "ready";
      slot.dataset["kpEditorAnimationAdapterId"] = adapter.id;
      adapter.render({ player, slot, state });
    });
}

function isSurfaceSlotKind(
  value: string | undefined
): value is KpEditorAnimationSurfaceSlotKind {
  return value === "equation" || value === "diagram" || value === "graph" || value === "programming";
}
