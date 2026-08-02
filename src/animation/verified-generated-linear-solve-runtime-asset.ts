import generatedAsset from
  "./verified-generated-linear-solve-asset.generated.json" with {
    type: "json"
  };
import type { KpAnimationAsset } from "./asset.ts";

const asset = deepFreeze(
  generatedAsset as unknown as KpAnimationAsset
);

/**
 * Browser hosts consume the verified build artifact, not its provider bridge
 * or compilers. Generation tests keep this data equal to the trusted session.
 */
export function createKpVerifiedGeneratedLinearSolveRuntimeAsset():
KpAnimationAsset {
  return asset;
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}
