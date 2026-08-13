import type { KpAnimationAsset } from "../asset.ts";
import {
  createKpPlaceValueAdditionAnimationAsset
} from "../place-value-addition-adapter.ts";
export function createKpPlaceValueAnimationPack():
readonly KpAnimationAsset[] {
  return [createKpPlaceValueAdditionAnimationAsset()];
}
