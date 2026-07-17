import type { KpAnimationAsset } from "../asset.ts";
import { createProgrammingAnimationAssets } from "../programming-adapter.ts";

export function createKpProgrammingAnimationPack(): readonly KpAnimationAsset[] {
  return createProgrammingAnimationAssets();
}
