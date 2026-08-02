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
 * differ; the one consolidation candidate is therefore explicit and typed.
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
  retain("src/editor/equation-surface-adapter.ts", "editor", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/editor/graph-svg-viewport.ts", "editor", [
    "html-attribute",
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
  retain("src/rendering/vector-dot-projection-svg.ts", "rendering", [
    "html-attribute",
    "svg-text",
    "svg-attribute"
  ]),
  retain("src/tutorial/ftc-surface.ts", "tutorial", [
    "html-text",
    "html-attribute"
  ]),
  retain("src/tutorial/hermeneutic-learner-shell.ts", "tutorial", [
    "html-text",
    "html-attribute"
  ])
] as const satisfies readonly KpHtmlEncodingOwner[];

export const kpHtmlEncodingConsolidations = [
  {
    sourceFile: "src/editor/exact-fraction-quantity-surface-adapter.ts",
    outputContexts: ["html-text", "html-attribute"],
    boundary: "src/editor/html-output-encoding.ts"
  }
] as const satisfies readonly KpHtmlEncodingConsolidation[];
