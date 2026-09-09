/** Discovery metadata only. Domain checkers still own acceptance and evidence;
 * a host reference cannot certify that a draft is applied or published. */
export const supportedAuthorTasks = {
  "bayes.binary": {
    owner: "src/experiments/bayesian-reasoning/draft.ts",
    input: "Exact binary joint masses or prior and two likelihoods; existing teaching settings.",
    preview: { kind: "explicit-apply", url: "/experiments/bayesian-reasoning/" },
    extraction: { kind: "domain-owned", owner: "src/experiments/bayesian-reasoning/extraction.ts" },
    publication: { kind: "local-edition", command: "author:bayesian-publication", output: "immutable-content-addressed", input: "selected Bayes source JSON" }
  },
  "equation.logarithm-base": {
    owner: "src/authoring/equation-series-logarithm-base-draft.ts",
    input: "Two supported numeric change-of-base LaTeX states; verified by the existing binder.",
    preview: { kind: "explicit-apply", url: "/experiments/authoring-market/#equation-authoring" },
    extraction: { kind: "unsupported", reason: "This numeric editor does not expose reusable-reason extraction." },
    publication: { kind: "enclosing-source-edition", command: "author:market-publication", output: "rebuildable-named-directory", input: "selected market branch JSON with equationRequest; a bare equation request is not an edition source" }
  },
  "reasoning.equation": {
    owner: "src/experiments/reusable-reasoning/authoring.ts",
    input: "Editorial reasoning and exact existing distribution operation references, not arbitrary algebra.",
    preview: { kind: "explicit-apply", url: "/experiments/reusable-reasoning/" },
    extraction: { kind: "domain-owned", owner: "src/experiments/reusable-reasoning/extraction.ts" },
    publication: { kind: "local-edition", command: "author:reasoning-publication", output: "immutable-content-addressed", input: "selected equation reasoning JSON" }
  },
  "reasoning.code": {
    owner: "src/experiments/reusable-reasoning/code-evidence.ts",
    input: "Editorial prose with exact TypeScript free-shipping source revisions and pedagogical stage pins.",
    preview: { kind: "reference-only", url: "/experiments/reusable-reasoning-code/", reason: "No selected-source JSON editor; the route shows the reference caller." },
    extraction: { kind: "domain-owned", owner: "src/experiments/reusable-reasoning/code-evidence.ts", scope: "Bounded language context and exact return; not equation procedure or flashcard parity." },
    publication: { kind: "unsupported", reason: "No selected-source code reasoning edition builder." }
  },
  "graph3d.saddle": {
    owner: "scripts/gallery-graph-3d-saddle-parameter-frontend.ts",
    input: "Pinned fixed-camera saddle denominator change from four to eight through the gallery router.",
    preview: { kind: "owner-routed", owner: "scripts/gallery-graph-3d-saddle-parameter-frontend.ts", reason: "The accepted domain result supplies the exact Catalogue route; not an applied draft claim." },
    extraction: { kind: "unsupported", reason: "No reusable-reason extraction for this scene." },
    publication: { kind: "unsupported", reason: "A compiled Catalogue artifact is not a local publication edition." }
  },
  "graph2d.supply-tax": {
    owner: "src/experiments/authoring-market/authoring-market-preview-prepare.ts",
    input: "Existing market source branch with bounded parameters and Article fact bindings.",
    preview: { kind: "local-source-build", url: "/experiments/authoring-market/", reason: "The graph follows trusted local source builds and explicit retained-revision inspection; checking branch JSON does not apply it to this host." },
    extraction: { kind: "unsupported", reason: "No reusable-reason extraction from the market editor." },
    publication: { kind: "local-edition", command: "author:market-publication", output: "rebuildable-named-directory", input: "selected market branch JSON; text and exact facts only" }
  }
} as const;

export type SupportedAuthorTask = keyof typeof supportedAuthorTasks;

export function isSupportedAuthorTask(value: unknown): value is SupportedAuthorTask {
  return typeof value === "string" && Object.hasOwn(supportedAuthorTasks, value);
}
