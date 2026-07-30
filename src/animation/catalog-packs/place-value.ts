import type { KpAnimationAsset } from "../asset.ts";
import {
  createKpPlaceValueAdditionAnimationAsset
} from "../place-value-addition-adapter.ts";
// Registration stays inside the lazy capability pack so browsing unrelated
// animations does not load the place-value DOM and KaTeX renderer graph.
import "../../editor/place-value-addition-surface-register.ts";

export function createKpPlaceValueAnimationPack():
readonly KpAnimationAsset[] {
  return [createKpPlaceValueAdditionAnimationAsset()];
}
