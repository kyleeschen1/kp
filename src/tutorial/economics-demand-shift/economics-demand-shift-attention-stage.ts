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

/**
 * Projects semantic lesson beats into responsive framing instructions. The
 * presenter owns geometry; the deck and animation remain semantic authority.
 */
export function projectKpEconomicsDemandShiftAttentionFraming(
  scene: KpEconomicsDemandShiftDeckScene
): KpEconomicsDemandShiftAttentionFraming {
  return framingBySceneId[scene.id] ?? "reading";
}
