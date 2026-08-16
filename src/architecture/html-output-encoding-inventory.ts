export type KpHtmlOutputContext =
  | "html-text"
  | "html-attribute"
  | "svg-text"
  | "svg-attribute";

export type KpHtmlEncodingOwnerDisposition =
  {
    readonly kind: "retain-local";
    readonly boundary: "application" | "compiler" | "editor" | "rendering" | "review-tool" | "tutorial";
  };

export interface KpHtmlEncodingOwner {
  readonly sourceFile: string;
  readonly outputContexts: readonly KpHtmlOutputContext[];
  readonly disposition: KpHtmlEncodingOwnerDisposition;
}

export interface KpHtmlEncodingConsolidation {
  readonly sourceFile: string;
  readonly outputContexts: readonly KpHtmlOutputContext[];
  readonly boundary: "src/editor/html-output-encoding.ts";
}

const retain = (
  sourceFile: string,
  boundary: Extract<KpHtmlEncodingOwnerDisposition, { readonly kind: "retain-local" }>[
    "boundary"
  ],
  outputContexts: readonly KpHtmlOutputContext[]
): KpHtmlEncodingOwner => ({
  sourceFile,
  outputContexts,
  disposition: { kind: "retain-local", boundary }
});

/**
 * This inventory classifies sinks, not escaping algorithms. Identical-looking
 * replacement chains are not interchangeable when their HTML parser contexts
 * differ; each consolidation candidate is therefore explicit and typed.
 */
export const kpHtmlEncodingOwners = [
  retain("scripts/capture-animation-workbench.ts", "review-tool", [
    "html-text",
    "html-attribute"
  ]),
  retain("scripts/capture-visual-contact-sheet.ts", "review-tool", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/app-adapters/concept-review-html.ts", "application", [
    "html-text",
    "svg-text"
  ]),
  retain("src/article/kp-article-static-html.ts", "compiler", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/compiler/html-asset.ts", "compiler", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/editor/animation-catalogue-bootstrap.ts", "editor", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/editor/animation-catalogue-shell.ts", "editor", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/editor/animation-diagnostics.ts", "editor", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/editor/animation-picker.ts", "editor", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/editor/animation-player-shell.ts", "editor", [
    "html-attribute"
  ]),
  retain("src/editor/api-catalog.ts", "editor", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/editor/diagram-svg-adapter.ts", "editor", [
    "svg-text",
    "svg-attribute"
  ]),
  retain("src/editor/equation-stage-markup.ts", "editor", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/editor/graph-svg-domain-renderers.ts", "editor", [
    "html-attribute"
  ]),
  retain("src/editor/graph-svg-viewport-lifecycle.ts", "editor", [
    "svg-attribute"
  ]),
  retain("src/editor/hermeneutic-tutorial-inspector.ts", "editor", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/editor/semantic-animation-workbench-acceptance.ts", "editor", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/editor/semantic-animation-workbench-review.ts", "editor", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/editor/semantic-animation-workbench-shell.ts", "editor", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/editor/editor.ts", "editor", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/project-dashboard/render.ts", "application", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/rendering/constant-force-work-energy-svg.ts", "rendering", [
    "html-text",
    "html-attribute",
    "svg-text"
  ]),
  retain("src/rendering/economics-equilibrium-svg.ts", "rendering", [
    "html-text",
    "html-attribute",
    "svg-text"
  ]),
  retain("src/rendering/graph-svg.ts", "rendering", [
    "svg-text",
    "svg-attribute"
  ]),
  retain("src/rendering/graph-webgl.ts", "rendering", [
    "html-attribute"
  ]),
  retain("src/rendering/lisp-application-motion-html.ts", "rendering", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/rendering/lisp-evaluation-motion-html.ts", "rendering", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/rendering/lisp-lambda-application-html.ts", "rendering", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/rendering/lisp-s-expression-bead-html.ts", "rendering", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/rendering/lisp-s-expression-material-dom.ts", "rendering", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/rendering/lisp-structural-motion-html.ts", "rendering", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/rendering/matrix-linear-map-svg.ts", "rendering", [
    "html-attribute",
    "svg-text"
  ]),
  retain("src/rendering/programming-addition-trace-html.ts", "rendering", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/rendering/vector-dot-projection-svg.ts", "rendering", [
    "html-attribute",
    "svg-text",
    "svg-attribute"
  ]),
  retain(
    "src/tutorial/algebra-fraction-composition/fraction-composition-static-publication.ts",
    "tutorial",
    ["html-text", "html-attribute"]
  ),
  retain(
    "src/tutorial/economics-demand-shift/economics-demand-shift-inline-markdown.ts",
    "tutorial",
    ["html-text", "html-attribute"]
  ),
  retain(
    "src/tutorial/economics-demand-shift/economics-demand-shift-static-publication.ts",
    "tutorial",
    ["html-text", "html-attribute"]
  ),
  retain(
    "src/tutorial/economics-demand-shift/economics-demand-shift-verification-surface.ts",
    "tutorial",
    ["html-attribute"]
  ),
  retain("src/tutorial/ftc-surface.ts", "tutorial", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/tutorial/hermeneutic-learner-shell.ts", "tutorial", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/tutorial/kp-tutorial-progress-rail-renderer.ts", "tutorial", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/tutorial/kp-tutorial-scrub-bar-renderer.ts", "tutorial", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/tutorial/kp-tutorial-toc.ts", "tutorial", [
    "html-text",
    "html-attribute"
  ]),
  retain(
    "src/tutorial/lisp-function-application/lisp-function-application-lesson-compiler.ts",
    "tutorial",
    ["html-text"]
  ),
  retain(
    "src/tutorial/lisp-function-application/lisp-function-application-stage-projector.ts",
    "tutorial",
    ["html-text"]
  ),
  retain(
    "src/tutorial/lisp-function-application/lisp-function-application-static-publication.ts",
    "tutorial",
    ["html-text", "html-attribute"]
  ),
] as const satisfies readonly KpHtmlEncodingOwner[];

export const kpHtmlEncodingConsolidations = [
  {
    sourceFile: "src/editor/exact-fraction-quantity-surface-adapter.ts",
    outputContexts: ["html-text", "html-attribute"],
    boundary: "src/editor/html-output-encoding.ts"
  },
  {
    sourceFile: "src/rendering/python-refactor-code-html.ts",
    outputContexts: ["html-text", "html-attribute"],
    boundary: "src/editor/html-output-encoding.ts"
  },
  {
    sourceFile: "src/rendering/scheme-factorial-first-expansion-html.ts",
    outputContexts: ["html-text", "html-attribute"],
    boundary: "src/editor/html-output-encoding.ts"
  },
  {
    sourceFile: "src/rendering/scheme-factorial-html.ts",
    outputContexts: ["html-text", "html-attribute"],
    boundary: "src/editor/html-output-encoding.ts"
  },
  {
    sourceFile: "src/rendering/typescript-refactor-code-html.ts",
    outputContexts: ["html-text", "html-attribute"],
    boundary: "src/editor/html-output-encoding.ts"
  }
] as const satisfies readonly KpHtmlEncodingConsolidation[];
