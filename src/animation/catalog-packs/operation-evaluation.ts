import type { KpAnimationAsset } from "../asset.ts";
import {
  createKpFivePlusTwoEvaluationAnimationAsset,
  createKpOnePlusTwoEvaluationAnimationAsset,
  createKpThreeSixthsEvaluationAnimationAsset,
  createKpTwoTimesOneCarrierAnimationAsset,
  createKpTwoTimesThreeEvaluationAnimationAsset
} from "../operation-evaluation-adapter.ts";
export function createKpOperationEvaluationAnimationPack():
readonly KpAnimationAsset[] {
  return [
    createKpOnePlusTwoEvaluationAnimationAsset(),
    createKpFivePlusTwoEvaluationAnimationAsset(),
    createKpThreeSixthsEvaluationAnimationAsset(),
    createKpTwoTimesOneCarrierAnimationAsset(),
    createKpTwoTimesThreeEvaluationAnimationAsset()
  ];
}
