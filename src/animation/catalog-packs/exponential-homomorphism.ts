import type { KpAnimationAsset } from "../asset.ts";
import {
  createKpExponentialHomomorphismAnimationAsset
} from "../exponential-homomorphism-adapter.ts";
import {
  createKpExponentialQuotientPressureAnimationAsset
} from "../exponential-quotient-pressure-adapter.ts";

// One leaf pack keeps this pressure exemplar independently selectable while
// its choreography remains below the human-promotion boundary.
export function createKpExponentialHomomorphismAnimationPack():
readonly KpAnimationAsset[] {
  return Object.freeze([
    createKpExponentialHomomorphismAnimationAsset(),
    createKpExponentialQuotientPressureAnimationAsset()
  ]);
}
