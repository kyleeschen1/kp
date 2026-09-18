/** Discovery metadata only. Domain checkers still own acceptance and evidence;
 * a host reference cannot certify that a draft is applied or published. */
export const supportedAuthorTasks = {
  "mechanics.momentum-energy": {
    owner: "src/authoring/mechanics-derivation-author-check.ts",
    input: "Existing momentum-energy derivation assumptions: positive-real mass, Euclidean-vector velocity, momentum equals mass times velocity. No arbitrary equations, physical inference or editable notation.",
    preview: { kind: "reference-only", url: "/experiments/mechanics-relations/#energy-from-momentum", reason: "Checks the existing mechanics authority; does not apply a selected draft." },
    extraction: { kind: "domain-owned", owner: "src/tutorial/mechanics-relations/momentum-energy-derivation-publication.ts", scope: "Existing checked norm-scaling and mass-cancellation detail only." },
    publication: { kind: "unsupported", reason: "No selected-source mechanics edition command." }
  },
  "equation.fraction-chain": {
    owner: "src/authoring/fraction-chain-author-check.ts",
    input: "Two to eight explicit integer-fraction states; positive denominators. Checked ordered alignment, raw addition/subtraction and common-divisor reduction. Optional hints select verified moves; prose is editorial. No arbitrary solver or automatic visual certification.",
    preview: { kind: "local-source-build", url: "/experiments/fraction-chain/", reason: "Inspect result.hostEligibility separately from semantic acceptance. Edit the retained source and adjacent Article; checking another file does not apply it to this host." },
    extraction: { kind: "domain-owned", owner: "src/tutorial/fraction-chain/publication.ts", scope: "Raw numerator combination detail and exact held return in the retained passage; no general extraction." },
    publication: { kind: "unsupported", reason: "Local source/Article host exists; no selected-source immutable edition command." }
  },
  "equation.algebra-intuition": {
    owner: "src/authoring/composed-algebra-author-check-v2.ts",
    input: "Four or five checked states: factor a repeated binary group, evaluate its integer count, distribute, optionally evaluate the final nonnegative integer product. Declared real scalars; ordered contributions; no arbitrary solver. Prose is editorial.",
    preview: { kind: "explicit-apply", url: "/experiments/reusable-reasoning/?example=algebra-intuition" },
    extraction: { kind: "domain-owned", owner: "src/experiments/composed-algebra/subexplanations.ts", scope: "Two contextual questions, whole/scoped self-checks and revision-pinned exact return; no automatic grading or custom-source link persistence." },
    publication: { kind: "local-edition", command: "author:composed-algebra-publication", output: "immutable-content-addressed", input: "selected v2 source JSON; static readings questions and self-checks, not interactive animation" }
  },
  "equation.composed-algebra": {
    owner: "src/authoring/composed-algebra-author-check.ts",
    input: "Exactly three states: two nonnegative integer multiples of one unchanged compound scalar sum/product, ordered left/right factoring, then exact coefficient addition. Declared real scalars; no division, commutation or arbitrary solver. Editorial prose is not proof.",
    preview: { kind: "explicit-apply", url: "/experiments/reusable-reasoning/?example=composed-algebra" },
    extraction: { kind: "domain-owned", owner: "src/experiments/composed-algebra/practice.ts", scope: "Prediction/reconstruction with revision-pinned exact return; no automatic grading." },
    publication: { kind: "local-edition", command: "author:composed-algebra-publication", output: "immutable-content-addressed", input: "selected composed source JSON; static reading/self-check edition, not interactive animation" }
  },
  "equation.common-factor": {
    owner: "src/authoring/common-factor-author-check.ts",
    input: "One ordered two-product rewrite over declared single-letter real scalars; single-letter or single-digit nonnegative common factor and symbolic addends. Multi-digit factors return unsupported-presentation. Editorial prose is not proof.",
    preview: { kind: "explicit-apply", url: "/experiments/reusable-reasoning/?example=common-factor" },
    extraction: { kind: "domain-owned", owner: "src/experiments/common-factor/practice.ts", scope: "Two bounded self-checks and revision-pinned exact return; no automatic grading." },
    publication: { kind: "local-edition", command: "author:common-factor-publication", output: "immutable-content-addressed", input: "selected common-factor source JSON; static reading and self-checks, not interactive animation" }
  },
  "bayes.binary": {
    owner: "src/experiments/bayesian-reasoning/draft.ts",
    input: "Exact binary joint masses or prior and two likelihoods; v1 default teaching or v2 bounded editorial passages, readings and prompts. Prose is editorial, not proof.",
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
