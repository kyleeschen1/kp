import type {
  KpEconomicsDemandShiftDeckScene
} from "./economics-demand-shift-deck.ts";

export type KpEconomicsDemandShiftAttentionFraming =
  | "reading"
  | "demonstration"
  | "inspect"
  | "quiet-reference";

export const kpEconomicsDemandShiftAttentionVisualRoles = Object.freeze([
  "axes",
  "axis-labels",
  "supply",
  "supply-label",
  "demand-current",
  "demand-labels",
  "equilibrium-current",
  "equilibrium-reference",
  "guides-current",
  "guides-reference",
  "supply-trace"
] as const);

export type KpEconomicsDemandShiftAttentionVisualRole =
  typeof kpEconomicsDemandShiftAttentionVisualRoles[number];

const framingBySceneId: Readonly<Record<
  string,
  KpEconomicsDemandShiftAttentionFraming
>> = Object.freeze({
  orient: "reading",
  equilibrium: "reading",
  "shift-demand": "demonstration",
  "interpret-equilibrium": "inspect",
  "trace-supply": "inspect",
  conclude: "quiet-reference"
});

const cueBySceneId: Readonly<Record<string, string>> = Object.freeze({
  orient: "Price rises vertically, quantity rises horizontally, and the curves meet at equilibrium.",
  equilibrium: "At the initial intersection, quantity demanded equals quantity supplied.",
  "shift-demand": "Hold supply fixed and watch the demand curve shift outward.",
  "interpret-equilibrium": "The new intersection has a higher price and a greater quantity.",
  "trace-supply": "Both equilibria lie on the same supply curve: the market moved along supply.",
  conclude: "Demand shifted; quantity supplied changed along the unchanged supply curve."
});

const visualRolesBySceneId: Readonly<Record<
  string,
  readonly KpEconomicsDemandShiftAttentionVisualRole[]
>> = Object.freeze({
  orient: roles(
    "axes", "axis-labels", "supply", "supply-label", "demand-current",
    "demand-labels", "equilibrium-current"
  ),
  equilibrium: roles(
    "axes", "axis-labels", "supply", "supply-label", "demand-current",
    "demand-labels", "equilibrium-current"
  ),
  "shift-demand": roles(
    "axes", "axis-labels", "supply", "supply-label", "demand-current"
  ),
  "interpret-equilibrium": roles(
    "axes", "axis-labels", "supply", "demand-current",
    "equilibrium-current", "equilibrium-reference", "guides-current",
    "guides-reference"
  ),
  "trace-supply": roles(
    "axes", "axis-labels", "supply", "supply-label", "equilibrium-current",
    "equilibrium-reference", "supply-trace"
  ),
  conclude: roles(
    "axes", "axis-labels", "supply", "supply-label", "demand-current",
    "equilibrium-current", "equilibrium-reference", "supply-trace"
  )
});

/**
 * Projects semantic lesson beats into responsive framing instructions. The
 * presenter owns geometry; the deck and animation remain semantic authority.
 */
export function projectKpEconomicsDemandShiftAttentionFraming(
  scene: KpEconomicsDemandShiftDeckScene
): KpEconomicsDemandShiftAttentionFraming {
  return framingBySceneId[scene.id] ?? "reading";
}

/** Keeps the bounded stage complete without replacing the searchable article. */
export function projectKpEconomicsDemandShiftAttentionCue(
  scene: KpEconomicsDemandShiftDeckScene
): string {
  return cueBySceneId[scene.id] ?? scene.label;
}

/** Projects instructional necessity; CSS only translates these roles to paint. */
export function projectKpEconomicsDemandShiftAttentionVisualRoles(
  scene: KpEconomicsDemandShiftDeckScene
): readonly KpEconomicsDemandShiftAttentionVisualRole[] {
  return visualRolesBySceneId[scene.id] ?? visualRolesBySceneId["orient"]!;
}

function roles(
  ...values: readonly KpEconomicsDemandShiftAttentionVisualRole[]
): readonly KpEconomicsDemandShiftAttentionVisualRole[] {
  return Object.freeze(values);
}
