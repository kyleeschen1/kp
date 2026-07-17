import type { KpAnimationAsset } from "../asset.ts";
import {
  createComparisonLayoutAnimationAssets
} from "../comparison-layout-adapter.ts";
import { createLinearSolveAnimationAsset } from "../linear-solve-adapter.ts";
import { createProgramTraceAnimationAsset } from "../programming-adapter.ts";

export function createKpComparisonAnimationPack(): readonly KpAnimationAsset[] {
  // The synchronized comparison samples both child clocks. Co-locate those
  // dependencies with their parent so playback never needs a second pack race.
  return [
    ...createComparisonLayoutAnimationAssets(),
    createLinearSolveAnimationAsset(),
    createProgramTraceAnimationAsset()
  ];
}
