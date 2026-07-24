import {
  createCanonicalKpQuadraticAnimation
} from "../../animation/quadratic-branching-asset.ts";
import {
  createKpCompletingSquareKatexProjection,
  type KpQuadraticKatexState
} from "../../projections/quadratic-completing-square-katex.ts";
import {
  createKpQuadraticFormulaKatexProjection
} from "../../projections/quadratic-formula-katex.ts";
import {
  renderLatexToHtml,
  renderSelectorAnnotatedLatexToHtml
} from "../../rendering/katex-adapter.ts";
import {
  createKpQuadraticSelectorAnnotatedLatex
} from "../../rendering/quadratic-selector-annotated-latex.ts";
import { renderKpQuadraticParabolaSvg } from "../../rendering/quadratic-parabola-svg.ts";
import {
  createCanonicalKpQuadraticParabolaGraphProjection
} from "../../projections/quadratic-parabola-graph.ts";
import { createKpCompiledLessonArtifact } from "../document/public-api.ts";
import { parseKpLessonMarkdown } from "./lesson-markdown-parser.ts";
import { compileKpReaderPageShell } from "./reader-page-shell.ts";
import { compileKpStaticLessonProse } from "./static-prose-compiler.ts";

const documentId = "lesson.algebra.quadratic-branching";
const assetId = "animation.algebra.quadratic.solution-branching";

export function compileKpQuadraticBranchingLesson(markdown: string) {
  const document = parseKpLessonMarkdown({
    sourceId: "content/lessons/quadratic-branching.md",
    id: documentId,
    version: "1",
    title: "Two paths, the same two roots",
    language: "en",
    markdown
  });
  const story = document.blocks.find((block) => block.kind === "animation-story");
  if (story?.kind !== "animation-story" || story.asset.id !== assetId) {
    throw new Error(`Quadratic branching lesson must reference ${assetId}.`);
  }
  const canonical = createCanonicalKpQuadraticAnimation();
  if (canonical.animation.id !== story.asset.id) {
    throw new Error("Quadratic reader story and semantic authority disagree.");
  }
  const prose = compileKpStaticLessonProse(document, {
    renderAnimationStorySlot: ({ block }) =>
      block.id === story.id ? compileStage() : undefined
  });
  const hydration = {
    schemaVersion: "kp.quadratic-reader.v1",
    lesson: { id: documentId, version: "1" },
    asset: { id: canonical.animation.id, timelineId: canonical.inspection.sharedClockId },
    checkpoints: story.beats.map((beat) => ({
      id: beat.checkpoint.id,
      beatId: beat.id,
      progressPermille: beat.checkpoint.progressPermille
    }))
  };
  const html = compileKpReaderPageShell({
    title: "Two paths, the same two roots · Kinetic Press",
    description: "Solve one quadratic by completing the square or using the quadratic formula.",
    stylesheetHref: "/src/reader/app/quadratic-branching.css",
    bodyAttributes: [
      { name: "data-kp-reader", value: "quadratic-branching" },
      { name: "data-kp-reader-document-id", value: documentId },
      { name: "data-kp-reader-document-version", value: "1" },
      { name: "data-kp-reader-font-ready", value: "false" }
    ],
    modeLink: { href: "/reader/distribution-area/", label: "See distribution" },
    shareLink: {
      href: "/reader/quadratic-branching/",
      label: "Link this moment",
      dataAttribute: "data-kp-quadratic-share"
    },
    tocHtml: prose.tocHtml,
    articleHtml: prose.articleHtml,
    hydration: {
      dataAttribute: "data-kp-quadratic-hydration",
      json: JSON.stringify(hydration)
    },
    entryScriptSrc: "/src/reader/app/quadratic-branching-entry.ts"
  });
  return createKpCompiledLessonArtifact({
    id: "compiled.lesson.algebra.quadratic-branching",
    version: "1",
    document: { kind: "lesson-document", id: documentId, version: "1" },
    html,
    tocHtml: prose.tocHtml,
    hydration
  });
}

function compileStage(): string {
  const completingSquare = createKpCompletingSquareKatexProjection();
  const formula = createKpQuadraticFormulaKatexProjection();
  const graph = createCanonicalKpQuadraticParabolaGraphProjection();
  return [
    '<section class="kp-quadratic-stage" data-kp-quadratic-stage data-kp-reader-renderer-adapter="renderer.quadratic-native-katex" data-kp-method="completing-square" data-kp-phase="intro" tabindex="0" aria-label="Quadratic solution animation" aria-describedby="kp-quadratic-transcript">',
    '<header class="kp-quadratic-stage__header">',
    '<div><span>Two exact methods</span><output data-kp-quadratic-status aria-live="polite">Read the equation</output></div>',
    '<div class="kp-quadratic-methods" role="group" aria-label="Choose a solution method">',
    '<button type="button" data-kp-quadratic-method="completing-square" aria-pressed="true">Complete the square</button>',
    '<button type="button" data-kp-quadratic-method="formula" aria-pressed="false">Quadratic formula</button>',
    "</div>",
    '<label class="kp-quadratic-motion"><span>Motion</span><select data-kp-quadratic-motion aria-label="Motion preference"><option value="system">System</option><option value="reduced">Reduced</option><option value="full">Full</option><option value="static">Static steps</option></select></label>',
    "</header>",
    '<p class="kp-reader-visually-hidden" data-kp-quadratic-narration role="status" aria-live="polite" aria-atomic="true">x squared minus five x plus six equals zero.</p>',
    '<div class="kp-quadratic-visual" data-kp-quadratic-visual>',
    '<div class="kp-quadratic-equations" aria-label="Current equation">',
    ...stateMarkup(completingSquare.states, "completing-square"),
    ...stateMarkup(formula.states, "formula"),
    "</div>",
    '<div class="kp-quadratic-branches" data-kp-quadratic-branches aria-label="The minus and plus solution branches" hidden>',
    `<div data-kp-branch="minus" data-kp-semantic-id="branch.minus"><div data-kp-branch-candidate>${renderLatexToHtml("x=\\frac{5-1}{2}", { displayMode: true })}</div><div data-kp-branch-result hidden>${renderLatexToHtml("x=2", { displayMode: true })}</div><span class="kp-quadratic-branch-label">minus branch</span></div>`,
    `<div data-kp-branch="plus" data-kp-semantic-id="branch.plus"><div data-kp-branch-candidate>${renderLatexToHtml("x=\\frac{5+1}{2}", { displayMode: true })}</div><div data-kp-branch-result hidden>${renderLatexToHtml("x=3", { displayMode: true })}</div><span class="kp-quadratic-branch-label">plus branch</span></div>`,
    "</div>",
    `<div class="kp-quadratic-solution" data-kp-quadratic-solution data-kp-semantic-id="katex.quadratic.solution-set.native" hidden>${renderLatexToHtml("x\\in\\{2,3\\}", { displayMode: true })}<span class="kp-quadratic-solution__label">complete solution set</span></div>`,
    `<div class="kp-quadratic-graph-slot" data-kp-quadratic-graph-slot>${renderKpQuadraticParabolaSvg(graph)}</div>`,
    "</div>",
    '<nav class="kp-quadratic-controls" aria-label="Explanation controls">',
    '<button type="button" data-kp-quadratic-previous aria-label="Previous explanation step">Back</button>',
    '<label><span class="kp-reader-visually-hidden">Explanation progress</span><input type="range" min="0" max="1000" step="1" value="0" data-kp-quadratic-progress aria-label="Explanation progress"></label>',
    '<button type="button" data-kp-quadratic-next aria-label="Next explanation step">Next</button>',
    '<output data-kp-quadratic-count aria-live="polite">Read the equation, 0 percent</output>',
    "</nav>",
    '<p class="kp-quadratic-stage__hint">Scroll to move the proof. Use the controls to inspect an exact moment.</p>',
    '<p id="kp-quadratic-transcript" class="kp-quadratic-stage__transcript">Symbolic transcript: x² − 5x + 6 = 0; completing the square gives (x − 5/2)² = 1/4; the formula gives x = (5 ± 1)/2; both give x ∈ {2, 3}.</p>',
    "</section>"
  ].join("\n");
}

function stateMarkup(
  states: readonly KpQuadraticKatexState[],
  method: "completing-square" | "formula"
): readonly string[] {
  return states.map((state, index) => {
    const annotated = createKpQuadraticSelectorAnnotatedLatex(state);
    return `<div class="kp-quadratic-equation" data-kp-equation-method="${method}" data-kp-equation-state="${state.id}" data-kp-semantic-state="${state.semanticStateId}" aria-label="${attribute(state.spoken)}"${index === 0 && method === "completing-square" ? "" : " hidden"}>${renderSelectorAnnotatedLatexToHtml(annotated, { displayMode: true })}</div>`;
  });
}

function attribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
