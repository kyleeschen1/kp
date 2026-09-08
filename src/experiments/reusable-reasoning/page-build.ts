import katex from "katex";
import { createKpReasoningSource } from "./source.ts";
import { bindKpReasoningEvidence } from "./evidence.ts";
import { extractKpReasoningContext } from "./extraction.ts";
import { renderReasoningPage, escapeReasoningText } from "./scaffold.ts";

export function buildKpReasoningInitialPage() {
  const evidence = bindKpReasoningEvidence(createKpReasoningSource());
  const extracted = extractKpReasoningContext(evidence);
  const staticTruth = extracted.states.map(state => katex.renderToString(
    state.segments.map(segment => segment.latex).join(""), { displayMode: true, throwOnError: true })).join("");
  return renderReasoningPage(evidence) + `<noscript><style>[data-reasoning-reader],.reasoning-toolbar{display:none}</style>
    <h2>Verified steps</h2>${staticTruth}<ul>${extracted.assumptions.map(item =>
      `<li>${escapeReasoningText(item.statement)}</li>`).join("")}</ul></noscript>`;
}
