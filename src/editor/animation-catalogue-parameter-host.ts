import {
  constantForceWorkEnergyAnimationId
} from "../animation/constant-force-work-energy-adapter.ts";
import {
  economicsEquilibriumAnimationId
} from "../animation/economics-equilibrium-adapter.ts";
import {
  replaceKpEditorAnimationPlaybackAsset
} from "./animation-player-controller.ts";
import {
  createKpConstantForceWorkEnergyParameterState,
  createParameterizedConstantForceWorkEnergyAnimation,
  writeKpConstantForceWorkEnergyParameters
} from "./constant-force-work-energy-parameters.ts";
import {
  createKpEconomicsEquilibriumParameterState,
  createParameterizedEconomicsEquilibriumAnimation,
  writeKpEconomicsEquilibriumParameters
} from "./economics-equilibrium-parameters.ts";
import type {
  KpAnimationCatalogueParameterUpdate
} from "./animation-catalogue-host-view-model.ts";

export function applyKpAnimationCatalogueParameterInput(
  input: HTMLInputElement
): KpAnimationCatalogueParameterUpdate | undefined {
  // Both shell compositions enter the existing model, player, and URL
  // authorities here so bespoke controls do not create parallel state.
  switch (input.dataset["action"]) {
    case "set-economics-demand-intercept":
      return updateEconomics(input);
    case "set-physics-net-force":
      return updatePhysics(input);
    default:
      return undefined;
  }
}

function updateEconomics(
  input: HTMLInputElement
): KpAnimationCatalogueParameterUpdate | undefined {
  const shell = selectedShell(input, economicsEquilibriumAnimationId);
  const player = shell?.querySelector<HTMLElement>(
    "[data-kp-editor-animation-player]"
  );
  const ownerWindow = input.ownerDocument.defaultView;
  if (
    shell === undefined ||
    player === undefined ||
    player === null ||
    ownerWindow === null
  ) {
    return undefined;
  }

  const state = createKpEconomicsEquilibriumParameterState(input.value);
  const parameterized = createParameterizedEconomicsEquilibriumAnimation(state);
  // The player session keeps its playhead and direction while only its authored
  // asset changes; DOM and URL mirrors follow that authoritative replacement.
  replaceKpEditorAnimationPlaybackAsset(player, parameterized.animation);
  input.value = String(state.demandInterceptAfter);
  shell.dataset["kpEconomicsDemandIntercept"] =
    String(state.demandInterceptAfter);
  input.closest("[data-kp-economics-parameters]")
    ?.querySelector<HTMLOutputElement>(
      "[data-kp-economics-demand-intercept-output]"
    )?.replaceChildren(input.ownerDocument.createTextNode(
      String(state.demandInterceptAfter)
    ));
  replaceSearch(ownerWindow, writeKpEconomicsEquilibriumParameters({
    search: ownerWindow.location.search,
    state
  }));
  return Object.freeze({
    kind: "economics" as const,
    animationId: economicsEquilibriumAnimationId,
    state
  });
}

function updatePhysics(
  input: HTMLInputElement
): KpAnimationCatalogueParameterUpdate | undefined {
  const shell = selectedShell(input, constantForceWorkEnergyAnimationId);
  const player = shell?.querySelector<HTMLElement>(
    "[data-kp-editor-animation-player]"
  );
  const ownerWindow = input.ownerDocument.defaultView;
  if (
    shell === undefined ||
    player === undefined ||
    player === null ||
    ownerWindow === null
  ) {
    return undefined;
  }

  const state = createKpConstantForceWorkEnergyParameterState(input.value);
  const parameterized = createParameterizedConstantForceWorkEnergyAnimation(
    state
  );
  replaceKpEditorAnimationPlaybackAsset(player, parameterized.animation);
  input.value = String(state.netForceNewtons);
  shell.dataset["kpPhysicsNetForceNewtons"] = String(state.netForceNewtons);
  input.closest("[data-kp-physics-work-energy-parameters]")
    ?.querySelector<HTMLOutputElement>("[data-kp-physics-net-force-output]")
    ?.replaceChildren(input.ownerDocument.createTextNode(
      `${state.netForceNewtons} N`
    ));
  replaceSearch(ownerWindow, writeKpConstantForceWorkEnergyParameters({
    search: ownerWindow.location.search,
    state
  }));
  return Object.freeze({
    kind: "physics" as const,
    animationId: constantForceWorkEnergyAnimationId,
    state
  });
}

function selectedShell(
  input: HTMLInputElement,
  animationId: string
): HTMLElement | undefined {
  const shell = input.closest<HTMLElement>("[data-kp-animation-catalogue]");
  return shell?.dataset["kpAnimationCatalogueSelection"] === animationId
    ? shell
    : undefined;
}

function replaceSearch(ownerWindow: Window, search: string): void {
  ownerWindow.history.replaceState(
    ownerWindow.history.state,
    "",
    `${ownerWindow.location.pathname}${search}${ownerWindow.location.hash}`
  );
}
