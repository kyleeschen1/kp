import { renderLatexToHtml } from "../rendering/katex-adapter.ts";
import {
  createKpVerifiedGeneratedLinearSolveSession,
  type KpVerifiedGeneratedLinearSolveStaticOutput
} from "../tutorial/verified-generated-linear-solve-session.ts";
import type {
  KpExplanationLearnerProjectionV1,
  KpExplanationSegmentV1
} from "../tutorial/verified-linear-problem-explanation-compiler.ts";

export interface KpAnimationCatalogueReaderCompanion {
  readonly id: string;
  readonly label: string;
  readonly html: string;
}

export function createKpVerifiedGeneratedLinearSolveReaderCompanion():
KpAnimationCatalogueReaderCompanion {
  const session = createKpVerifiedGeneratedLinearSolveSession();
  return Object.freeze({
    id: session.explanation.projection.id,
    label: "Explanation",
    html: renderReader({
      projection: session.explanation.projection,
      staticOutput: session.staticOutput
    })
  });
}

function renderReader(input: {
  readonly projection: KpExplanationLearnerProjectionV1;
  readonly staticOutput: KpVerifiedGeneratedLinearSolveStaticOutput;
}): string {
  const sections = input.projection.sections.map((section) =>
    `<section class="kp-animation-catalogue-shell__explanation-section" data-kp-generated-explanation-section="${attribute(section.kind)}">
      <h3>${text(sectionTitle(section.kind))}</h3>
      <ol>${section.cues.map((cue) =>
        `<li data-kp-generated-explanation-cue="${attribute(cue.id)}">${cue.segments
          .map(renderSegment)
          .join("")}</li>`
      ).join("")}</ol>
    </section>`
  ).join("");
  const staticStates = input.staticOutput.states.map((state) =>
    `<li data-kp-generated-static-state="${attribute(state.id)}">
      <span>${text(state.label)}</span>
      <span class="kp-animation-catalogue-shell__inline-math">${renderLatexToHtml(
        state.latex,
        { displayMode: false, output: "htmlAndMathml" }
      )}</span>
    </li>`
  ).join("");
  return `<div class="kp-animation-catalogue-shell__explanation" data-kp-generated-explanation="${attribute(input.projection.id)}">
    <p class="kp-animation-catalogue-shell__explanation-intro">A deterministic learner spine grounded in the verified trace.</p>
    ${sections}
    <details data-kp-generated-static-output>
      <summary>Static steps</summary>
      <ol>${staticStates}</ol>
    </details>
  </div>`;
}

function renderSegment(segment: KpExplanationSegmentV1): string {
  return segment.kind === "text"
    ? text(segment.text)
    : `<span class="kp-animation-catalogue-shell__inline-math" data-kp-generated-claim="${attribute(segment.claimRef)}">${renderLatexToHtml(
        segment.latex,
        { displayMode: false, output: "htmlAndMathml" }
      )}</span>`;
}

function sectionTitle(
  kind: KpExplanationLearnerProjectionV1["sections"][number]["kind"]
): string {
  switch (kind) {
    case "orientation": return "Orient";
    case "subtract": return "Subtract";
    case "divide": return "Divide";
    case "solution": return "Check";
  }
}

function text(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function attribute(value: string): string {
  return text(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
