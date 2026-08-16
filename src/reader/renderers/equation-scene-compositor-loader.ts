import type {
  KpObserveNativeKatexScene
} from "../../rendering/native-katex-feature-pack-contract.ts";

type KpInternalReaderEquationSceneCompositorFactory =
  typeof import("./equation-scene-compositor-adapter.ts")[
    "createKpReaderEquationSceneCompositorSession"
  ];
type KpInternalReaderEquationPureScenePlanCompiler =
  typeof import("./equation-scene-compositor-adapter.ts")[
    "compileKpReaderEquationPureScenePlan"
  ];
type KpReaderEquationSceneCompositorFactoryInput = Omit<
  Parameters<KpInternalReaderEquationSceneCompositorFactory>[0],
  "nativeKatex"
>;
type KpReaderEquationPureScenePlanCompilerInput = Omit<
  Parameters<KpInternalReaderEquationPureScenePlanCompiler>[0],
  "nativeKatex"
>;

export type KpReaderEquationSceneCompositorFactory = (
  input: KpReaderEquationSceneCompositorFactoryInput
) => ReturnType<KpInternalReaderEquationSceneCompositorFactory>;
export type KpReaderEquationPureScenePlanCompiler = (
  input: KpReaderEquationPureScenePlanCompilerInput
) => ReturnType<KpInternalReaderEquationPureScenePlanCompiler>;

export interface KpReaderEquationSceneCompositorAdapter {
  readonly createKpReaderEquationSceneCompositorSession:
    KpReaderEquationSceneCompositorFactory;
  readonly compileKpReaderEquationPureScenePlan:
    KpReaderEquationPureScenePlanCompiler;
  readonly observeKpNativeKatexRenderedScene: KpObserveNativeKatexScene;
}

export async function loadKpReaderEquationSceneCompositorAdapter():
Promise<KpReaderEquationSceneCompositorAdapter> {
  const adapter = await import("./equation-scene-compositor-adapter.ts");
  return adapter.loadKpReaderEquationSceneCompositorClient();
}
