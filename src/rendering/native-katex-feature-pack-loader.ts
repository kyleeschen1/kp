import type {
  KpNativeKatexFeaturePack,
  KpNativeKatexFeaturePackLoader,
  KpNativeKatexFeaturePackModule
} from "./native-katex-feature-pack-contract.ts";

export type KpNativeKatexFeaturePackModuleImporter =
  () => Promise<KpNativeKatexFeaturePackModule>;

export function createKpNativeKatexFeaturePackLoader(
  importModule: KpNativeKatexFeaturePackModuleImporter
): KpNativeKatexFeaturePackLoader {
  let resolved: KpNativeKatexFeaturePack | undefined;
  let pending: Promise<KpNativeKatexFeaturePack> | undefined;
  return Object.freeze({
    schemaVersion: "kp.native-katex-feature-pack-loader.v1" as const,
    packId: "feature-pack.native-katex.canonical" as const,
    load() {
      if (resolved !== undefined) return Promise.resolve(resolved);
      if (pending !== undefined) return pending;
      pending = importModule()
        .then(({ kpNativeKatexFeaturePack: candidate }) => {
          assertKpNativeKatexFeaturePack(candidate);
          resolved = candidate;
          return candidate;
        })
        .catch((error: unknown) => {
          // A transient chunk failure must not poison every later retry.
          pending = undefined;
          throw error;
        });
      return pending;
    }
  });
}

export const kpNativeKatexFeaturePackLoader =
  createKpNativeKatexFeaturePackLoader(
    () => import("./native-katex-feature-pack-implementation.ts")
  );

function assertKpNativeKatexFeaturePack(
  candidate: KpNativeKatexFeaturePack
): void {
  if (
    candidate.schemaVersion !== "kp.native-katex-feature-pack.v1" ||
    candidate.id !== "feature-pack.native-katex.canonical" ||
    typeof candidate.observe?.observe !== "function" ||
    typeof candidate.observe?.settleAndObserve !== "function" ||
    typeof candidate.compose?.compilePurePlan !== "function" ||
    typeof candidate.compose?.createSession !== "function" ||
    typeof candidate.compose?.projectRelations !== "function"
  ) {
    throw new Error("Native KaTeX feature-pack module violates its contract.");
  }
}
