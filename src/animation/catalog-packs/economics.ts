import type { KpAnimationAsset } from "../asset.ts";
import {
  createEconomicsEquilibriumAnimationAsset
} from "../economics-equilibrium-adapter.ts";

export function createKpEconomicsAnimationPack():
readonly KpAnimationAsset[] {
  return [createEconomicsEquilibriumAnimationAsset()];
}
