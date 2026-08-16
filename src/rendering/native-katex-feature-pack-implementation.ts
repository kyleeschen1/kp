import {
  observeKpNativeKatexRenderedScene,
  settleAndObserveKpNativeKatexRenderedScene
} from "./native-katex-rendered-scene.ts";
import {
  compileKpCanonicalNativeKatexPureScenePlan,
  createKpCanonicalNativeKatexSceneSession,
  projectKpNativeKatexSemanticPaintRelations
} from "./native-katex-scene-compositor.ts";
import type {
  KpNativeKatexFeaturePack
} from "./native-katex-feature-pack-contract.ts";

/**
 * The pack is an ownership boundary, not a second renderer. These references
 * point at the promoted compositor so callers cannot accidentally fork paint.
 */
export const kpNativeKatexFeaturePack: KpNativeKatexFeaturePack =
  Object.freeze({
    schemaVersion: "kp.native-katex-feature-pack.v1" as const,
    id: "feature-pack.native-katex.canonical" as const,
    observe: Object.freeze({
      observe: observeKpNativeKatexRenderedScene,
      settleAndObserve: settleAndObserveKpNativeKatexRenderedScene
    }),
    compose: Object.freeze({
      compilePurePlan: compileKpCanonicalNativeKatexPureScenePlan,
      createSession: createKpCanonicalNativeKatexSceneSession,
      projectRelations: projectKpNativeKatexSemanticPaintRelations
    })
  });
