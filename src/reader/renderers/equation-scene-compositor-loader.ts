export type KpReaderEquationSceneCompositorFactory =
  typeof import("./equation-scene-compositor-adapter.ts")[
    "createKpReaderEquationSceneCompositorSession"
  ];
export type KpReaderEquationPureScenePlanCompiler =
  typeof import("./equation-scene-compositor-adapter.ts")[
    "compileKpReaderEquationPureScenePlan"
  ];

export async function loadKpReaderEquationSceneCompositorAdapter() {
  return import("./equation-scene-compositor-adapter.ts");
}
