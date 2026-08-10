import type {
  KpEconomicsDemandShiftDeckScene
} from "./economics-demand-shift-deck.ts";

export type KpEconomicsDemandShiftAttentionFraming =
  | "reading"
  | "demonstration"
  | "inspect"
  | "quiet-reference";

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
