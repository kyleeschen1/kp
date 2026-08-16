import type { KpAnimationAsset } from "../asset.ts";
import { createKpLogProductAnimationAsset } from "../log-product-adapter.ts";

// This leaf pack keeps one symbolic family independently loadable. The
// catalogue registry owns discovery; selecting log product must not import
// unrelated algebra motifs or their runtime capabilities.
export function createKpLogProductAnimationPack():
  readonly KpAnimationAsset[] {
  return Object.freeze([createKpLogProductAnimationAsset()]);
}
