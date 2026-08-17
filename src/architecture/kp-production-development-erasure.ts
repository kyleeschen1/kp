export const kpProductionDevelopmentPathPrefixes = Object.freeze([
  "src/dev-review/",
  "src/dev-toolbar/",
  "src/experiments/"
] as const);

export const kpProductionDevelopmentExactModules = Object.freeze([
  "src/article/kp-article-codemirror-runtime.ts",
  "src/article/kp-article-source-authoring.ts",
  "src/article/kp-article-source-client.ts",
  "src/article/kp-article-source-editor.ts",
  "src/article/kp-article-source-save.ts",
  "src/editor/animation-catalogue-review-capture-loader.ts",
  "src/editor/animation-catalogue-review-host.ts",
  "src/editor/editor-animation-library-review-capture-loader.ts",
  "src/editor/semantic-animation-workbench-review-adapter.ts",
  "src/editor/semantic-animation-workbench-review-capture-loader.ts",
  "src/editor/semantic-animation-workbench-review-loader.ts",
  "src/editor/semantic-animation-workbench-review.ts",
  "src/public-web/fraction-composition-public-development.ts",
  "src/public-web/typescript-free-shipping-dev-review.ts",
  "src/reader/app/development-review-loader.ts",
  "src/tutorial/algebra-fraction-composition/fraction-composition-article-authoring.ts",
  "src/tutorial/algebra-fraction-composition/fraction-composition-dev-toolbar-contribution.ts",
  "src/tutorial/economics-demand-shift/economics-demand-shift-article-authoring.ts",
  "src/tutorial/economics-demand-shift/economics-demand-shift-article-source-client.ts",
  "src/tutorial/economics-demand-shift/economics-demand-shift-codemirror-runtime.ts",
  "src/tutorial/economics-demand-shift/economics-demand-shift-dev-toolbar-contribution.ts",
  "src/tutorial/economics-demand-shift/economics-demand-shift-dev-toolbar.ts",
  "src/tutorial/kp-tutorial-review-host.ts",
  "src/tutorial/lisp-function-application/lisp-function-application-review-adapter.ts"
] as const);

const kpProductionDevelopmentExactModuleSet = new Set<string>(
  kpProductionDevelopmentExactModules
);

/** Production erasure is path-owned so minification and chunk merging cannot hide a leak. */
export function isKpProductionDevelopmentModule(path: string): boolean {
  return kpProductionDevelopmentExactModuleSet.has(path) ||
    kpProductionDevelopmentPathPrefixes.some((prefix) =>
      path.startsWith(prefix)
    );
}
