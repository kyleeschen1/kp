import type {
  KpAnimationCatalogueHealth
} from "./animation-catalogue-health.ts";
import type {
  KpAnimationCatalogueEntry
} from "./animation-catalogue-projection.ts";
import type {
  KpConstantForceWorkEnergyParameterState
} from "./constant-force-work-energy-parameters.ts";
import type {
  KpEconomicsEquilibriumParameterState
} from "./economics-equilibrium-parameters.ts";
import type {
  KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";
import type {
  KpEditorAnimationPlayerState
} from "./animation-player-state.ts";
import type {
  KpAnimationCatalogueReaderCompanion
} from "./animation-catalogue-reader-companion.ts";

export type KpAnimationCatalogueInspectorView =
  | "details"
  | "parameters"
  | "tuning"
  | "explanation";

export type KpAnimationCatalogueOverlay = "rail" | "inspector";

export interface KpAnimationCatalogueHostChromeState {
  readonly query: string;
  readonly inspectorView: KpAnimationCatalogueInspectorView;
  readonly overlay?: KpAnimationCatalogueOverlay | undefined;
}

export interface KpAnimationCatalogueSelectedHostContent {
  readonly entry: KpAnimationCatalogueEntry;
  readonly health: KpAnimationCatalogueHealth;
  readonly entries: readonly KpAnimationCatalogueEntry[];
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
}

export interface KpAnimationCatalogueSelectedHostViewModel extends
  KpAnimationCatalogueSelectedHostContent {
  readonly schemaVersion: "kp.animation-catalogue-host-view.v1";
  readonly kind: "animation-catalogue-selected-host-view";
  readonly chrome: KpAnimationCatalogueHostChromeState;
}

export type KpAnimationCatalogueHostViewIntent =
  | Readonly<{ readonly kind: "filter"; readonly query: string }>
  | Readonly<{
      readonly kind: "select-inspector";
      readonly view: KpAnimationCatalogueInspectorView;
    }>
  | Readonly<{
      readonly kind: "toggle-overlay";
      readonly target: KpAnimationCatalogueOverlay;
    }>
  | Readonly<{ readonly kind: "close-overlay" }>;

export type KpAnimationCatalogueHostCommand =
  | Readonly<{
      readonly kind: "select-artifact";
      readonly animationId: string;
      readonly playhead?: number | undefined;
    }>
  | Readonly<{ readonly kind: "replace-playhead"; readonly progress: number }>
  | Readonly<{
      readonly kind: "tune-presentation";
      readonly tuning: "gestalt-style" | "focus-experiment";
      readonly value: string;
    }>
  | Readonly<{
      readonly kind: "set-economics-demand-intercept";
      readonly value: number;
    }>
  | Readonly<{
      readonly kind: "set-physics-net-force";
      readonly value: number;
    }>;

export type KpAnimationCatalogueHostIntent =
  | KpAnimationCatalogueHostViewIntent
  | KpAnimationCatalogueHostCommand;

export function createKpAnimationCatalogueSelectedHostViewModel(
  input: KpAnimationCatalogueSelectedHostContent & Readonly<{
    readonly chrome?: Partial<KpAnimationCatalogueHostChromeState> | undefined;
  }>
): KpAnimationCatalogueSelectedHostViewModel {
  assertKpAnimationCatalogueSelectedHostContent(input);
  const inspectorView = input.chrome?.inspectorView ?? "details";
  if (inspectorView === "explanation" && input.readerCompanion === undefined) {
    throw new Error(
      "Catalogue host cannot select an explanation without a reader companion."
    );
  }
  const chrome = Object.freeze({
    query: input.chrome?.query ?? "",
    inspectorView,
    ...(input.chrome?.overlay === undefined
      ? {}
      : { overlay: input.chrome.overlay })
  });

  return Object.freeze({
    schemaVersion: "kp.animation-catalogue-host-view.v1" as const,
    kind: "animation-catalogue-selected-host-view" as const,
    entry: input.entry,
    health: input.health,
    entries: input.entries,
    descriptor: input.descriptor,
    player: input.player,
    ...(input.economicsParameters === undefined
      ? {}
      : { economicsParameters: input.economicsParameters }),
    ...(input.physicsParameters === undefined
      ? {}
      : { physicsParameters: input.physicsParameters }),
    ...(input.readerCompanion === undefined
      ? {}
      : { readerCompanion: input.readerCompanion }),
    chrome
  });
}

export function reduceKpAnimationCatalogueHostView(
  view: KpAnimationCatalogueSelectedHostViewModel,
  intent: KpAnimationCatalogueHostViewIntent
): KpAnimationCatalogueSelectedHostViewModel {
  switch (intent.kind) {
    case "filter":
      return withChrome(view, { ...view.chrome, query: intent.query });
    case "select-inspector":
      return withChrome(view, {
        ...view.chrome,
        inspectorView: intent.view
      });
    case "toggle-overlay":
      return withChrome(view, {
        ...view.chrome,
        overlay: view.chrome.overlay === intent.target
          ? undefined
          : intent.target
      });
    case "close-overlay":
      return withChrome(view, { ...view.chrome, overlay: undefined });
  }
}

export function replaceKpAnimationCatalogueHostHealth(
  view: KpAnimationCatalogueSelectedHostViewModel,
  health: KpAnimationCatalogueHealth
): KpAnimationCatalogueSelectedHostViewModel {
  return createKpAnimationCatalogueSelectedHostViewModel({
    entry: view.entry,
    health,
    entries: view.entries,
    descriptor: view.descriptor,
    player: view.player,
    economicsParameters: view.economicsParameters,
    physicsParameters: view.physicsParameters,
    readerCompanion: view.readerCompanion,
    chrome: view.chrome
  });
}

export function assertKpAnimationCatalogueSelectedHostContent(
  input: KpAnimationCatalogueSelectedHostContent
): void {
  if (input.entry.animationId !== input.health.animationId) {
    throw new Error(
      `Catalogue host entry ${input.entry.animationId} does not match ` +
      `health ${input.health.animationId}.`
    );
  }
  if (
    input.descriptor.id !== input.entry.primaryDescriptorId ||
    input.descriptor.animationId !== input.entry.animationId ||
    input.player.descriptorId !== input.descriptor.id ||
    input.player.animationId !== input.entry.animationId
  ) {
    throw new Error(
      `Catalogue host player does not match entry ${input.entry.animationId}.`
    );
  }
  const selectedEntries = input.entries.filter(
    ({ animationId }) => animationId === input.entry.animationId
  );
  if (
    selectedEntries.length !== 1 ||
    selectedEntries[0]?.primaryDescriptorId !== input.entry.primaryDescriptorId
  ) {
    throw new Error(
      `Catalogue host entries do not contain one selected ${input.entry.animationId}.`
    );
  }
  if (
    input.economicsParameters !== undefined &&
    input.physicsParameters !== undefined
  ) {
    throw new Error(
      "Catalogue host cannot expose economics and physics parameters together."
    );
  }
}

function withChrome(
  view: KpAnimationCatalogueSelectedHostViewModel,
  chrome: KpAnimationCatalogueHostChromeState
): KpAnimationCatalogueSelectedHostViewModel {
  return createKpAnimationCatalogueSelectedHostViewModel({
    entry: view.entry,
    health: view.health,
    entries: view.entries,
    descriptor: view.descriptor,
    player: view.player,
    economicsParameters: view.economicsParameters,
    physicsParameters: view.physicsParameters,
    readerCompanion: view.readerCompanion,
    chrome
  });
}
