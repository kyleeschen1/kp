import type {
  KpSchemeFirstExpansion,
  KpSchemeFirstExpansionSample
} from "../animation/scheme-factorial-first-expansion.ts";
import type {
  KpSchemeFactorialFullEvaluation,
  KpSchemeFactorialFullEvaluationSample
} from "../animation/scheme-factorial-full-evaluation.ts";
import { resolveKpSchemeMaterialSyntaxRole } from
  "../semantic/scheme-source-syntax.ts";
import {
  encodeKpEditorHtmlAttribute,
  encodeKpEditorHtmlText
} from "../editor/html-output-encoding.ts";

export interface KpSchemeFirstExpansionRenderInput {
  readonly expansion: KpSchemeFirstExpansion;
  readonly sample: KpSchemeFirstExpansionSample;
}

/** One code owner: settled and moving glyphs share the same reading surface. */
export function renderKpSchemeFirstExpansionHtml(
  input: KpSchemeFirstExpansionRenderInput
): string {
  return renderCodeMaterialStage({
    states: input.expansion.states,
    sample: input.sample,
    accessibleDescription: input.expansion.accessibleDescription,
    attributes: `data-kp-scheme-first-expansion data-kp-scheme-first-expansion-phase="${input.sample.phase}" data-kp-scheme-first-expansion-progress="${input.sample.progress}"`
  });
}

/** Projects the complete score through the same single code-material owner. */
export function renderKpSchemeFactorialFullEvaluationHtml(input: {
  readonly evaluation: KpSchemeFactorialFullEvaluation;
  readonly sample: KpSchemeFactorialFullEvaluationSample;
}): string {
  return renderCodeMaterialStage({
    states: input.evaluation.states,
    sample: input.sample,
    accessibleDescription: input.evaluation.accessibleDescription,
    attributes: `data-kp-scheme-full-evaluation data-kp-scheme-full-evaluation-phase="${input.sample.phase}" data-kp-scheme-full-evaluation-transition="${encodeKpEditorHtmlAttribute(input.sample.transitionId ?? "none")}" data-kp-scheme-full-evaluation-progress="${input.sample.progress}"`
  });
}

function renderCodeMaterialStage(input: {
  readonly states: readonly { readonly nativeCode: string }[];
  readonly sample: KpSchemeFirstExpansionSample | KpSchemeFactorialFullEvaluationSample;
  readonly accessibleDescription: string;
  readonly attributes: string;
}): string {
  const widthCh = Math.max(...input.states.flatMap(({ nativeCode }) =>
    nativeCode.split("\n").map((line) => line.length)));
  const lineCount = Math.max(...input.states.map(({ nativeCode }) =>
    nativeCode.split("\n").length));
  const tokens = input.sample.tokens.map((material) => {
    const syntaxRole = resolveKpSchemeMaterialSyntaxRole({
      lexeme: material.lexeme,
      provenance: material.provenance
    });
    return `<span class="kp-scheme-first-expansion__token" data-kp-scheme-first-expansion-token="${encodeKpEditorHtmlAttribute(material.materialId)}" data-kp-scheme-motion-id="${encodeKpEditorHtmlAttribute(material.motionId)}" data-kp-scheme-syntax-kind="${syntaxRole}" data-kp-scheme-provenance-kind="${encodeKpEditorHtmlAttribute(material.provenance.kind)}" data-kp-scheme-source-occurrence-id="${encodeKpEditorHtmlAttribute(material.provenance.sourceOccurrenceId)}"${renderRuntimeProvenance(material.provenance)} style="--kp-scheme-token-x:${material.xCh}ch;--kp-scheme-token-y:${material.yEm}em;--kp-scheme-token-opacity:${material.opacity};--kp-scheme-token-scale:${material.scale}">${encodeKpEditorHtmlText(material.lexeme)}</span>`;
  }).join("");
  const settlement = "settlement" in input.sample
    ? input.sample.settlement
    : null;
  const settlementAttributes = settlement === null
    ? ""
    : ` data-kp-scheme-settlement-phase="${settlement.sample.phase}" data-kp-scheme-native-owner="${settlement.sample.accessibleNativeOwnerId}"`;
  return `<section class="kp-scheme-first-expansion" ${input.attributes} data-kp-scheme-paint-owner="code-material"${settlementAttributes} aria-label="${encodeKpEditorHtmlAttribute(input.accessibleDescription)}"><pre class="kp-scheme-first-expansion__code" style="--kp-scheme-code-width:${widthCh}ch;--kp-scheme-code-lines:${lineCount}"><code>${tokens}</code></pre><span class="kp-scheme-first-expansion__accessible">${encodeKpEditorHtmlText(input.sample.nativeCode)}</span></section>`;
}

export const kpSchemeFirstExpansionCss = `
.kp-scheme-first-expansion {
  --kp-scheme-bg: var(--kp-lesson-theme-surface, #0d0e1c);
  --kp-scheme-ink: var(--kp-lesson-theme-math-foreground, #e7e5df);
  --kp-scheme-accent: var(--kp-lesson-theme-focus, #88c9ff);
  --kp-scheme-code-keyword: var(--kp-code-keyword, #9099d9);
  --kp-scheme-code-function: var(--kp-code-function, #338fff);
  --kp-scheme-code-number: var(--kp-code-number, var(--kp-scheme-ink));
  --kp-scheme-code-delimiter: var(--kp-code-delimiter, #989898);
  align-items: center;
  background: var(--kp-scheme-bg);
  box-sizing: border-box;
  color: var(--kp-scheme-ink);
  container-type: inline-size;
  display: grid;
  inline-size: 100%;
  min-block-size: var(--kp-scheme-stage-height, 18rem);
  overflow: hidden;
  padding: clamp(1rem, 4cqi, 2.5rem);
  place-items: center;
  position: relative;
}
.kp-scheme-first-expansion__code {
  block-size: calc(var(--kp-scheme-code-lines) * 1.5em);
  color: var(--kp-scheme-ink);
  font: 400 clamp(20px, 4cqi, 30px)/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  inline-size: min(100%, var(--kp-scheme-code-width));
  margin: 0;
  overflow: visible;
  position: relative;
}
@media (max-width: 420px) {
  .kp-scheme-first-expansion { padding-inline: .8rem; }
  .kp-scheme-first-expansion__code { font-size: 18px; }
}
.kp-scheme-first-expansion__code code {
  color: inherit;
  font: inherit;
  user-select: text;
  white-space: pre;
}
.kp-scheme-first-expansion__token {
  display: inline-block;
  left: 0;
  opacity: var(--kp-scheme-token-opacity);
  position: absolute;
  top: 0;
  transform: translate(var(--kp-scheme-token-x), var(--kp-scheme-token-y)) scale(var(--kp-scheme-token-scale));
  transform-origin: center;
  will-change: transform, opacity;
}
.kp-scheme-first-expansion__token[data-kp-scheme-syntax-kind="keyword"] {
  color: var(--kp-scheme-code-keyword);
}
.kp-scheme-first-expansion__token[data-kp-scheme-syntax-kind="function"] {
  color: var(--kp-scheme-code-function);
}
.kp-scheme-first-expansion__token[data-kp-scheme-syntax-kind="number"] {
  color: var(--kp-scheme-code-number);
}
.kp-scheme-first-expansion__token[data-kp-scheme-syntax-kind="operator"],
.kp-scheme-first-expansion__token[data-kp-scheme-syntax-kind="punctuation"] {
  color: var(--kp-scheme-code-delimiter);
}
/* Provenance conveys the active semantic event, so it must outrank lexical paint. */
.kp-scheme-first-expansion__token[data-kp-scheme-provenance-kind="binding-projection"],
.kp-scheme-first-expansion__token[data-kp-scheme-provenance-kind="primitive-result"] {
  color: var(--kp-scheme-accent);
}
.kp-scheme-first-expansion__accessible {
  block-size: 1px;
  clip-path: inset(50%);
  inline-size: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
}
`;

function renderRuntimeProvenance(
  provenance: KpSchemeFirstExpansionSample["tokens"][number]["provenance"]
): string {
  if (provenance.kind === "source") return "";
  const activation = "activationId" in provenance
    ? ` data-kp-scheme-activation-id="${encodeKpEditorHtmlAttribute(provenance.activationId)}"`
    : "";
  const binding = provenance.kind === "binding-projection"
    ? ` data-kp-scheme-binding-id="${encodeKpEditorHtmlAttribute(provenance.bindingId)}" data-kp-scheme-value-id="${encodeKpEditorHtmlAttribute(provenance.valueId)}"`
    : provenance.kind === "primitive-result"
      ? ` data-kp-scheme-value-id="${encodeKpEditorHtmlAttribute(provenance.valueId)}"`
      : "";
  return `${activation}${binding}`;
}
