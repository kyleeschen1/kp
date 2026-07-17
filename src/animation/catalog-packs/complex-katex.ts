import type { KpAnimationAsset } from "../asset.ts";
import {
  createComplexKatexSampleAnimationAssets
} from "../complex-katex-sample-adapter.ts";

export function createKpComplexKatexAnimationPack(): readonly KpAnimationAsset[] {
  return createComplexKatexSampleAnimationAssets();
}
