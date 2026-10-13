import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { compileKpFoldableDistributionLessonModel } from "../src/reader/compiler/foldable-distribution-lesson-model.ts";
import { compileKpFoldableDistributionEquationLesson } from "../src/reader/compiler/foldable-distribution-equation-lesson.ts";
import { foldableDistributionDescriptor } from "../src/reader/app/equation-lesson-descriptors/foldable-distribution.ts";
import { compileKpAnimationTransformationPhaseCohorts } from "../src/animation/transformation-phase-cohorts.ts";

// These are evaluation requests, not a new authoring API. The actual compiler
// still receives only Markdown referencing the existing pinned animation.
export interface RichAlgebraTrialRequest {
  readonly id: string;
  readonly expression: string;
  readonly result: string;
  readonly checkpoints: readonly string[];
  readonly narration: string;
  readonly changeOperationOrder?: boolean;
}
const full = ["factored", "distributed", "products-evaluated", "grouped", "coefficient-factored", "collected"];
export const richAlgebraTrialRequests: readonly RichAlgebraTrialRequest[] = [
  { id: "baseline", expression: "3(x+2)+2(x-1)", result: "5x+4", checkpoints: full,
    narration: "Track both outside factors, then gather the like terms." },
  { id: "short-explanation", expression: "3(x+2)+2(x-1)", result: "5x+4",
    checkpoints: ["factored", "products-evaluated", "collected"],
    narration: "First multiply each group; then add the variable terms and signed constants." },
  { id: "changed-mathematics", expression: "4(y+1)+3(y-2)", result: "7y-2", checkpoints: full,
    narration: "Four plus negative six leaves a negative constant. Keep the sign with its term." },
  { id: "group-before-evaluation", expression: "3(x+2)+2(x-1)", result: "5x+4",
    checkpoints: ["factored", "distributed", "grouped", "products-evaluated", "coefficient-factored", "collected"],
    narration: "Group the unevaluated products before doing their arithmetic.", changeOperationOrder: true }
];

type Gap = {
  readonly code: "fixture-bound-mathematics" | "fixture-bound-operation-order" | "compiler-rejected" | "host-divergence";
  readonly path: string;
  readonly expected: string;
  readonly actual: string;
  readonly owner: string;
};

export function probeRichAlgebraAuthoring(markdown: string, request: RichAlgebraTrialRequest) {
  const baseline = compileKpFoldableDistributionLessonModel(markdown);
  const beats = request.checkpoints.map((checkpointId, index) => {
    const beat = baseline.story.beats.find(beat => beat.checkpoint.id === checkpointId);
    if (!beat) throw new Error(`Unknown trial checkpoint: ${checkpointId}`);
    return { id: beat.id, title: beat.title, content: request.narration,
      checkpointId, focusRefs: beat.focusRefs,
      progressPermille: request.changeOperationOrder ? Math.round(index * 1000 / (request.checkpoints.length - 1)) : beat.checkpoint.progressPermille };
  });
  // Writing the intended equation into prose is deliberately insufficient.
  // The probe compares actual semantic/native endpoints, never prose claims.
  const authored = `# Algebra authoring trial\n\nExplain $${request.expression}$ and obtain $${request.result}$.\n\n` +
    "```kp-animation-story\n" + JSON.stringify({ id: baseline.story.id, asset: baseline.story.asset,
      presentation: "scroll-scrub", beats }, null, 2) + "\n```\n";
  const compiled = compileRequested(authored);
  if (!compiled.ok) return { id: request.id, status: "repair-gap" as const, compiled: false as const,
    gaps: [{ code: "compiler-rejected" as const, path: "$.checkpoints", expected: "Compile the requested explanation",
      actual: compiled.error, owner: "src/reader/compiler/foldable-distribution-lesson-model.ts" }], authoredMarkdown: authored };
  const { model, artifact } = compiled;
  const first = model.expressionChain[0]!.latex, last = model.expressionChain.at(-1)!.latex;
  const gaps: Gap[] = [];
  for (const [path, expected, actual] of [["$.expression", request.expression, first], ["$.result", request.result, last]]) {
    if (!sameExpression(expected!, actual!)) gaps.push({ code: "fixture-bound-mathematics", path: path!, expected: expected!, actual: actual!,
      owner: "src/semantic/foldable-distribution-expression-chain.ts" });
  }
  const phases = compileKpAnimationTransformationPhaseCohorts(model.animation);
  const actualStateOrder = [phases[0]!.sourceObjectIds[0]!, ...phases.map(phase => phase.targetObjectIds[0]!)];
  const baselineStates = ["factored", "distributed-raw", "distributed", "grouped", "coefficient-factored", "collected"];
  const requestedStateOrder = request.checkpoints.map(checkpoint => {
    const index = full.indexOf(checkpoint);
    if (index < 0) throw new Error("Trial has no semantic checkpoint mapping.");
    return `expression.foldable-distribution.${baselineStates[index]}`;
  });
  if (request.changeOperationOrder && JSON.stringify(actualStateOrder) !== JSON.stringify(requestedStateOrder))
    gaps.push({ code: "fixture-bound-operation-order", path: "$.checkpoints", expected: requestedStateOrder.join(" → "), actual: actualStateOrder.join(" → "),
      owner: "src/semantic/foldable-distribution-evaluation-tree.ts" });
  const hostAgrees = JSON.stringify(model.animation) === JSON.stringify(foldableDistributionDescriptor.createAnimation());
  if (!hostAgrees) gaps.push({ code: "host-divergence", path: "$.animation", expected: "Compiler and browser reconstruct the same animation", actual: "Animations differ",
    owner: "src/reader/app/equation-lesson-descriptors/foldable-distribution.ts" });
  return { id: request.id, status: gaps.length ? "repair-gap" as const : "matched-intent" as const,
    compiled: true as const, gaps, requested: { expression: request.expression, result: request.result },
    observed: { expression: first, result: last, readerCheckpoints: model.transcript.map(beat => beat.checkpointId),
      nativeExpression: nativeLatex(model.animation.bundle.objects[0]!.value),
      nativeResult: nativeLatex(model.animation.bundle.objects.at(-1)!.value),
      narrationApplied: model.transcript.every(beat => beat.narration === request.narration),
      operationCount: model.animation.transformations.length, phaseCount: phases.length,
      animationUnchanged: JSON.stringify(model.animation) === JSON.stringify(baseline.animation), hostAgrees,
      nativeSceneCount: [...artifact.html.matchAll(/data-kp-reader-transition="/g)].length },
    authoredMarkdown: authored };
}

function nativeLatex(value: unknown): string {
  if (!value || typeof value !== "object" || !("latex" in value) || typeof value.latex !== "string")
    throw new Error("The trial expected a native equation endpoint.");
  return value.latex;
}

function sameExpression(left: string, right: string): boolean {
  // These fixed requests use the same notation vocabulary as the fixture.
  // Compare notation modulo whitespace, not sampled values or algebraic
  // equivalence: equal results must not conceal a different starting problem.
  return left.replace(/\s/g, "") === right.replace(/\s/g, "");
}
function compileRequested(markdown: string) {
  try {
    return { ok: true as const, model: compileKpFoldableDistributionLessonModel(markdown),
      artifact: compileKpFoldableDistributionEquationLesson(markdown) };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : String(error) };
  }
}

export function runRichAlgebraAuthoringTrial() {
  const markdown = readFileSync(new URL("../content/lessons/foldable-distribution.md", import.meta.url), "utf8");
  const results = richAlgebraTrialRequests.map(request => probeRichAlgebraAuthoring(markdown, request));
  return { kind: "rich-algebra-authoring-trial", provenance: "deterministic-fixed-input-test-not-live-LLM",
    canonicalHost: "/reader/foldable-distribution/", engineEdits: 0,
    sourceOnlyThresholdMet: results.every(result => result.status === "matched-intent"),
    // Keep routine output small; the exact authored Markdown is reproducible
    // through the exported probe and is asserted in the regression test.
    results: results.map(({ authoredMarkdown: _markdown, ...result }) => result) };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(JSON.stringify(runRichAlgebraAuthoringTrial(), null, 2));
