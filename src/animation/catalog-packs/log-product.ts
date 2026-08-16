import type { KpAnimationAsset } from "../asset.ts";
import { createKpLogProductAnimationAssets } from "../log-product-adapter.ts";

// This leaf pack keeps one symbolic family independently loadable. The
// catalogue registry owns discovery; selecting log product must not import
// unrelated algebra motifs or their runtime capabilities.
export function createKpLogProductAnimationPack():
  readonly KpAnimationAsset[] {
  return createKpLogProductAnimationAssets();
}
