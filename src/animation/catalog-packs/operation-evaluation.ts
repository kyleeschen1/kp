import type { KpAnimationAsset } from "../asset.ts";
import {
  createKpFivePlusTwoEvaluationAnimationAsset,
  createKpOnePlusTwoEvaluationAnimationAsset,
  createKpThreeSixthsEvaluationAnimationAsset
} from "../operation-evaluation-adapter.ts";
export function createKpOperationEvaluationAnimationPack():
readonly KpAnimationAsset[] {
  return [
    createKpOnePlusTwoEvaluationAnimationAsset(),
    createKpFivePlusTwoEvaluationAnimationAsset(),
    createKpThreeSixthsEvaluationAnimationAsset()
  ];
}
