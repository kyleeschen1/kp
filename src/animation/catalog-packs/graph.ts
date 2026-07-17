import type { KpAnimationAsset } from "../asset.ts";
import { createGraphAnimationAssets } from "../graph-adapter.ts";

export function createKpGraphAnimationPack(): readonly KpAnimationAsset[] {
  return createGraphAnimationAssets();
}
