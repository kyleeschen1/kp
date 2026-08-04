import type { KpLispEvaluationMotionFrame } from
  "../animation/lisp-evaluation-motion.ts";
import type { KpLispSourceMaterialToken } from
  "../animation/lisp-s-expression-material-projection.ts";

export const kpLispEvaluationMotionCss = `
.kp-lisp-evaluation-stage {
  --kp-lisp-evaluation-ink: var(--kp-lesson-theme-math-foreground, #3d454b);
  --kp-lisp-evaluation-accent: var(--kp-lesson-theme-focus, #7a9da8);
  align-items: center;
  color: var(--kp-lisp-evaluation-ink);
  display: grid;
  justify-items: center;
  min-block-size: 12em;
  overflow: visible;
  position: relative;
}
.kp-lisp-evaluation-stage__source {
  block-size: var(--kp-lisp-stage-height);
  inline-size: var(--kp-lisp-stage-width);
  margin: 0;
  overflow: visible;
  position: relative;
}
.kp-lisp-evaluation-stage__source code {
  block-size: 100%;
  color: inherit;
  display: block;
  font: 400 20px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
  inline-size: 100%;
  position: relative;
  user-select: text;
  white-space: pre;
}
.kp-lisp-evaluation-stage__token,
.kp-lisp-evaluation-stage__result {
  display: inline-block;
  inset-block-start: var(--kp-lisp-y);
  inset-inline-start: var(--kp-lisp-x);
  opacity: var(--kp-lisp-opacity);
  position: absolute;
  transform: scale(var(--kp-lisp-scale));
  transform-origin: center;
  will-change: transform;
}
.kp-lisp-evaluation-stage__result {
  font: 650 20px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
  pointer-events: none;
}
.kp-lisp-evaluation-stage__operator {
  align-items: center;
  background: color-mix(in srgb, var(--kp-lesson-theme-surface, #f4f0e6) 88%, var(--kp-lisp-evaluation-accent));
  border: 1px solid color-mix(in srgb, var(--kp-lisp-evaluation-accent) 55%, transparent);
  border-radius: 999px;
  box-shadow:
    0 0 0 calc(var(--kp-lisp-pulse) * .45rem) color-mix(in srgb, var(--kp-lisp-evaluation-accent) 24%, transparent),
    0 .18rem .5rem rgb(32 59 53 / .12);
  display: inline-flex;
  font: 700 20px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  inline-size: 2.35rem;
  block-size: 2.35rem;
  inset-block-start: var(--kp-lisp-y);
  inset-inline-start: var(--kp-lisp-x);
  justify-content: center;
  opacity: var(--kp-lisp-opacity);
  pointer-events: none;
  position: absolute;
  transform: translate(-50%, -50%) scale(var(--kp-lisp-scale));
  transform-origin: center;
}
@media (prefers-reduced-motion: reduce) {
  .kp-lisp-evaluation-stage__token,
  .kp-lisp-evaluation-stage__result { will-change: auto; }
}
`;

export function renderKpLispEvaluationMotionHtml(
  frame: KpLispEvaluationMotionFrame,
  options: { readonly reducedMotion?: boolean | undefined } = {}
): string {
  const body = frame.phase === "settled"
    ? renderResultEndpoint(frame)
    : renderMotion(frame);
  return `<section class="kp-lisp-evaluation-stage" data-kp-lisp-evaluation-stage data-kp-lisp-motion-mode="${options.reducedMotion === true ? "reduced" : "full"}" data-kp-lisp-progress="${frame.progress}" data-kp-lisp-checkpoint="${escapeAttribute(frame.checkpointId)}" data-kp-lisp-phase="${frame.phase}" data-kp-lisp-canonical-endpoint="${frame.canonicalEndpoint ?? "none"}" data-kp-lisp-paint-owner="semantic-dom" aria-label="${escapeAttribute(frame.accessibleDescription)}">${body}</section>`;
}

function renderMotion(frame: KpLispEvaluationMotionFrame): string {
  const byId = new Map(frame.sourceTokens.map((entry) => [entry.token.id, entry]));
  const source = renderCodeWithGaps(
    frame.sourceState.nativeCode,
    frame.sourceState.tokens,
    (token) => {
      const entry = required(byId, token.id);
      return `<span class="kp-lisp-evaluation-stage__token" data-kp-lisp-material-id="${escapeAttribute(token.id)}" data-kp-lisp-reduction-disposition="${entry.disposition}" data-kp-lisp-origin-ids="${escapeAttribute(token.originIds.join(" "))}" style="--kp-lisp-x:${px(entry.xEm)};--kp-lisp-y:${px(entry.yEm)};--kp-lisp-scale:${entry.scale};--kp-lisp-opacity:${entry.opacity}">${escapeHtml(token.lexeme)}</span>`;
    }
  );
  const operator = frame.operatorBead;
  const bead = `<span class="kp-lisp-evaluation-stage__operator" data-kp-lisp-reduction-operator="${escapeAttribute(operator.materialId)}" data-kp-lisp-structural-bead="${escapeAttribute(operator.id)}" data-kp-lisp-causal-pulse="${operator.causalPulse}" aria-hidden="true" style="--kp-lisp-x:${px(operator.xEm)};--kp-lisp-y:${px(operator.yEm)};--kp-lisp-scale:${operator.scale};--kp-lisp-opacity:${operator.opacity};--kp-lisp-pulse:${operator.causalPulse}">${escapeHtml(operator.nativeCode)}</span>`;
  const result = frame.result;
  const resultHtml = `<span class="kp-lisp-evaluation-stage__result" data-kp-lisp-result-material="${escapeAttribute(result.materialId)}" data-kp-lisp-emitted-from="${escapeAttribute(result.emittedFromOperatorId)}" data-kp-lisp-origin-ids="${escapeAttribute(result.originIds.join(" "))}" aria-hidden="true" style="--kp-lisp-x:${px(result.xEm)};--kp-lisp-y:${px(result.yEm)};--kp-lisp-scale:${result.scale};--kp-lisp-opacity:${result.opacity}">${escapeHtml(result.nativeCode)}</span>`;
  return `<pre class="kp-lisp-evaluation-stage__source" style="--kp-lisp-stage-width:${px(frame.geometry.stage.widthEm)};--kp-lisp-stage-height:${px(frame.geometry.stage.heightEm)}"><code data-kp-lisp-native-code="reconstructed">${source}</code>${bead}${resultHtml}</pre>`;
}

function renderResultEndpoint(frame: KpLispEvaluationMotionFrame): string {
  const result = frame.result;
  const token = frame.resultState.tokens[0]!;
  return `<pre class="kp-lisp-evaluation-stage__source" style="--kp-lisp-stage-width:${px(frame.geometry.stage.widthEm)};--kp-lisp-stage-height:${px(frame.geometry.stage.heightEm)}"><code data-kp-lisp-native-code="result"><span class="kp-lisp-evaluation-stage__token" data-kp-lisp-material-id="${escapeAttribute(token.id)}" data-kp-lisp-origin-ids="${escapeAttribute(token.originIds.join(" "))}" style="--kp-lisp-x:${px(result.xEm)};--kp-lisp-y:${px(result.yEm)};--kp-lisp-scale:1;--kp-lisp-opacity:1">${escapeHtml(token.lexeme)}</span></code></pre>`;
}

function renderCodeWithGaps(
  nativeCode: string,
  tokens: readonly KpLispSourceMaterialToken[],
  renderToken: (token: KpLispSourceMaterialToken) => string
): string {
  let cursor = 0;
  let html = "";
  for (const token of tokens) {
    html += escapeHtml(nativeCode.slice(cursor, token.source.start));
    html += renderToken(token);
    cursor = token.source.end;
  }
  return html + escapeHtml(nativeCode.slice(cursor));
}

function required<T>(values: ReadonlyMap<string, T>, id: string): T {
  const value = values.get(id);
  if (value === undefined) throw new Error(`Missing evaluation material ${id}.`);
  return value;
}

function px(valueEm: number): string {
  return `${Math.round(valueEm * 20 * 1e6) / 1e6}px`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
