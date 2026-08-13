import type { KpAnimationAsset } from "../asset.ts";
import {
  createKpExactFractionQuantityAnimationAsset
} from "../exact-fraction-quantity-adapter.ts";
export function createKpExactQuantityAnimationPack():
readonly KpAnimationAsset[] {
  return [createKpExactFractionQuantityAnimationAsset()];
}
