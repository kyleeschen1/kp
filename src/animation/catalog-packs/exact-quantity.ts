import type { KpAnimationAsset } from "../asset.ts";
import {
  createKpExactFractionQuantityAnimationAsset
} from "../exact-fraction-quantity-adapter.ts";
// Registration lives in the lazy capability pack so ordinary catalog browsing
// never loads the exact-quantity DOM renderer or native KaTeX compositor.
import "../../editor/exact-fraction-quantity-surface-register.ts";

export function createKpExactQuantityAnimationPack():
readonly KpAnimationAsset[] {
  return [createKpExactFractionQuantityAnimationAsset()];
}
