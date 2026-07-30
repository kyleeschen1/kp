import type { KpAnimationAsset } from "../asset.ts";
import {
  createKpFivePlusTwoEvaluationAnimationAsset,
  createKpOnePlusTwoEvaluationAnimationAsset,
  createKpThreeSixthsEvaluationAnimationAsset
} from "../operation-evaluation-adapter.ts";
// The canonical compositor adapter stays behind the arithmetic capability
// chunk so browsing unrelated animations does not create a second live stage.
import "../../editor/operation-evaluation-surface-register.ts";

export function createKpOperationEvaluationAnimationPack():
readonly KpAnimationAsset[] {
  return [
    createKpOnePlusTwoEvaluationAnimationAsset(),
    createKpFivePlusTwoEvaluationAnimationAsset(),
    createKpThreeSixthsEvaluationAnimationAsset()
  ];
}
