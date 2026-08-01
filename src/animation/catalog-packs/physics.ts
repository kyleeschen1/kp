import type { KpAnimationAsset } from "../asset.ts";
import {
  createConstantForceWorkEnergyAnimationAsset
} from "../constant-force-work-energy-adapter.ts";

export function createKpPhysicsAnimationPack():
readonly KpAnimationAsset[] {
  return [createConstantForceWorkEnergyAnimationAsset()];
}
