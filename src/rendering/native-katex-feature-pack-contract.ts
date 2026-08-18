export type KpSettleAndObserveNativeKatexScene = typeof import(
  "./native-katex-rendered-scene.ts"
)["settleAndObserveKpNativeKatexRenderedScene"];

export type KpObserveNativeKatexScene = typeof import(
  "./native-katex-rendered-scene.ts"
)["observeKpNativeKatexRenderedScene"];

export type KpCreateCanonicalNativeKatexSceneSession = typeof import(
  "./native-katex-scene-compositor.ts"
)["createKpCanonicalNativeKatexSceneSession"];

export type KpProjectNativeKatexSemanticPaintRelations = typeof import(
  "./native-katex-base-scene-plan.ts"
)["projectKpNativeKatexSemanticPaintRelations"];

export type KpCompileCanonicalNativeKatexPureScenePlan = typeof import(
  "./native-katex-scene-compositor.ts"
)["compileKpCanonicalNativeKatexPureScenePlan"];

export type KpCompileCanonicalNativeKatexScenePlan = typeof import(
  "./native-katex-scene-compositor.ts"
)["compileKpCanonicalNativeKatexScenePlan"];

export interface KpNativeKatexFeaturePack {
  readonly schemaVersion: "kp.native-katex-feature-pack.v1";
  readonly id: "feature-pack.native-katex.canonical";
  readonly observe: Readonly<{
    observe: KpObserveNativeKatexScene;
    settleAndObserve: KpSettleAndObserveNativeKatexScene;
  }>;
  readonly compose: Readonly<{
    compilePurePlan: KpCompileCanonicalNativeKatexPureScenePlan;
    compileScenePlan: KpCompileCanonicalNativeKatexScenePlan;
    createSession: KpCreateCanonicalNativeKatexSceneSession;
    projectRelations: KpProjectNativeKatexSemanticPaintRelations;
  }>;
}

export interface KpNativeKatexFeaturePackModule {
  readonly kpNativeKatexFeaturePack: KpNativeKatexFeaturePack;
}

export interface KpNativeKatexFeaturePackLoader {
  readonly schemaVersion: "kp.native-katex-feature-pack-loader.v1";
  readonly packId: KpNativeKatexFeaturePack["id"];
  load(): Promise<KpNativeKatexFeaturePack>;
}
