import type {
  KpLispApplicationMotionFrame,
  KpLispApplicationSourceTokenFrame
} from "../animation/lisp-application-motion.ts";
import type { KpLispSourceMaterialToken } from
  "../animation/lisp-s-expression-material-projection.ts";

export const kpLispApplicationMotionCss = `
.kp-lisp-application-stage {
  --kp-lisp-application-ink: var(--kp-lesson-theme-math-foreground, #3d454b);
  --kp-lisp-binding-color: var(--kp-lesson-theme-focus, #7a9da8);
  align-items: center;
  color: var(--kp-lisp-application-ink);
  display: grid;
  justify-items: center;
  min-block-size: 12em;
  overflow: visible;
  position: relative;
}
.kp-lisp-application-stage__source {
  block-size: var(--kp-lisp-stage-height);
  inline-size: var(--kp-lisp-stage-width);
  margin: 0;
  overflow: visible;
  position: relative;
}
.kp-lisp-application-stage__source code {
  block-size: 100%;
  color: inherit;
  display: block;
  font: 400 20px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
  inline-size: 100%;
  position: relative;
  user-select: text;
  white-space: pre;
}
.kp-lisp-application-stage__token,
.kp-lisp-application-stage__derived,
.kp-lisp-application-stage__reconstructed-token {
  display: inline-block;
  inset-block-start: var(--kp-lisp-y);
  inset-inline-start: var(--kp-lisp-x);
  opacity: var(--kp-lisp-opacity);
  position: absolute;
  transform: scale(var(--kp-lisp-scale));
  transform-origin: center;
  will-change: transform;
}
.kp-lisp-application-stage__derived,
.kp-lisp-application-stage__reconstructed-token {
  font: 400 20px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
  pointer-events: none;
}
.kp-lisp-application-stage__derived {
  color: var(--kp-lisp-application-ink);
  font-weight: 650;
}
.kp-lisp-application-stage__box {
  border: var(--kp-lisp-box-width) solid var(--kp-lisp-binding-color);
  border-radius: .22em;
  inset-block-start: var(--kp-lisp-box-y);
  inset-inline-start: var(--kp-lisp-box-x);
  block-size: var(--kp-lisp-box-height);
  inline-size: var(--kp-lisp-box-width-em);
  opacity: var(--kp-lisp-box-opacity);
  pointer-events: none;
  position: absolute;
}
.kp-lisp-application-stage__guides {
  block-size: 100%;
  inline-size: 100%;
  inset: 0;
  overflow: visible;
  pointer-events: none;
  position: absolute;
}
.kp-lisp-application-stage__guide,
.kp-lisp-application-stage__wake {
  fill: none;
  stroke: var(--kp-lisp-binding-color);
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}
.kp-lisp-application-stage__guide { stroke-width: .1; }
.kp-lisp-application-stage__wake { stroke-width: .22; }
.kp-lisp-application-stage__provenance {
  align-items: center;
  background: color-mix(in srgb, var(--kp-lesson-theme-surface, #f4f0e6) 88%, var(--kp-lisp-binding-color));
  border: 1px solid color-mix(in srgb, var(--kp-lisp-binding-color) 55%, transparent);
  border-radius: 999px;
  box-shadow: 0 .18rem .5rem rgb(32 59 53 / .12);
  display: inline-flex;
  font: 600 1rem/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
  inset-block-start: var(--kp-lisp-y);
  inset-inline-start: var(--kp-lisp-x);
  min-block-size: 2rem;
  opacity: var(--kp-lisp-opacity);
  padding: .3rem .55rem;
  pointer-events: none;
  position: absolute;
  transform: translate(-50%, -50%) scale(var(--kp-lisp-scale));
}
@media (prefers-reduced-motion: reduce) {
  .kp-lisp-application-stage__token,
  .kp-lisp-application-stage__derived,
  .kp-lisp-application-stage__reconstructed-token { will-change: auto; }
}
`;

export function renderKpLispApplicationMotionHtml(
  frame: KpLispApplicationMotionFrame
): string {
  const body = frame.phase === "settled"
    ? renderSettledEndpoint(frame)
    : renderMotion(frame);
  return `<section class="kp-lisp-application-stage" data-kp-lisp-application-stage data-kp-lisp-progress="${frame.progress}" data-kp-lisp-checkpoint="${escapeAttribute(frame.checkpointId)}" data-kp-lisp-phase="${frame.phase}" data-kp-lisp-canonical-endpoint="${frame.canonicalEndpoint ?? "none"}" data-kp-lisp-paint-owner="semantic-dom" aria-label="${escapeAttribute(frame.accessibleDescription)}">${body}</section>`;
}

function renderMotion(frame: KpLispApplicationMotionFrame): string {
  const tokenById = new Map(frame.sourceTokens.map((entry) => [entry.token.id, entry]));
  const source = renderCodeWithGaps(
    frame.sourceState.nativeCode,
    frame.sourceState.tokens,
    (token) => renderSourceToken(required(tokenById, token.id))
  );
  const boxes = frame.bindingBoxes.map((box) =>
    `<span class="kp-lisp-application-stage__box" data-kp-lisp-binding-box="${escapeAttribute(box.materialId)}" data-kp-lisp-binding-role="${box.role}" data-kp-lisp-binding-strength="${box.strength}" aria-hidden="true" style="--kp-lisp-box-x:${px(box.rect.xEm)};--kp-lisp-box-y:${px(box.rect.yEm)};--kp-lisp-box-width-em:${px(box.rect.widthEm)};--kp-lisp-box-height:${px(box.rect.heightEm)};--kp-lisp-box-width:${box.strength === "strong" ? 2 : 1}px;--kp-lisp-box-opacity:${box.opacity}"></span>`
  ).join("");
  const derived = frame.derivedValues.map((value) =>
    `<span class="kp-lisp-application-stage__derived" data-kp-lisp-derived-material="${escapeAttribute(value.materialId)}" data-kp-lisp-origin-ids="${escapeAttribute(value.originIds.join(" "))}" aria-hidden="true" style="--kp-lisp-x:${px(value.xEm)};--kp-lisp-y:${px(value.yEm)};--kp-lisp-scale:${value.scale};--kp-lisp-opacity:${value.opacity}">${escapeHtml(value.nativeCode)}</span>`
  ).join("");
  const reconstructed = frame.reconstructedTokens.map((entry) =>
    `<span class="kp-lisp-application-stage__reconstructed-token" data-kp-lisp-reconstructed-material="${escapeAttribute(entry.token.id)}" data-kp-lisp-origin-ids="${escapeAttribute(entry.token.originIds.join(" "))}" aria-hidden="true" style="--kp-lisp-x:${px(entry.xEm)};--kp-lisp-y:${px(entry.yEm)};--kp-lisp-scale:${entry.scale};--kp-lisp-opacity:${entry.opacity}">${escapeHtml(entry.token.lexeme)}</span>`
  ).join("");
  const bead = frame.provenanceBead;
  const provenance = `<span class="kp-lisp-application-stage__provenance" data-kp-lisp-provenance-bead="${escapeAttribute(bead.id)}" data-kp-lisp-consumed-materials="${escapeAttribute(bead.consumedMaterialIds.join(" "))}" aria-hidden="true" style="--kp-lisp-x:${px(bead.xEm)};--kp-lisp-y:${px(bead.yEm)};--kp-lisp-scale:${bead.scale};--kp-lisp-opacity:${bead.opacity}"><code>${escapeHtml(bead.nativeCode)}</code></span>`;
  const guides = renderGuides(frame);
  return `<pre class="kp-lisp-application-stage__source" style="--kp-lisp-stage-width:${px(frame.geometry.stage.widthEm)};--kp-lisp-stage-height:${px(frame.geometry.stage.heightEm)}"><code data-kp-lisp-native-code="application">${source}</code>${boxes}${derived}${provenance}${reconstructed}${guides}</pre>`;
}

function renderSettledEndpoint(frame: KpLispApplicationMotionFrame): string {
  const byId = new Map(frame.reconstructedTokens.map((entry) => [entry.token.id, entry]));
  const source = renderCodeWithGaps(
    frame.reconstructedState.nativeCode,
    frame.reconstructedState.tokens,
    (token) => {
      const entry = required(byId, token.id);
      return `<span class="kp-lisp-application-stage__token" data-kp-lisp-material-id="${escapeAttribute(token.id)}" data-kp-lisp-origin-ids="${escapeAttribute(token.originIds.join(" "))}" style="--kp-lisp-x:${px(entry.xEm)};--kp-lisp-y:${px(entry.yEm)};--kp-lisp-scale:1;--kp-lisp-opacity:1">${escapeHtml(token.lexeme)}</span>`;
    }
  );
  return `<pre class="kp-lisp-application-stage__source" style="--kp-lisp-stage-width:${px(frame.geometry.stage.widthEm)};--kp-lisp-stage-height:${px(frame.geometry.stage.heightEm)}"><code data-kp-lisp-native-code="reconstructed">${source}</code></pre>`;
}

function renderSourceToken(frame: KpLispApplicationSourceTokenFrame): string {
  const token = frame.token;
  return `<span class="kp-lisp-application-stage__token" data-kp-lisp-material-id="${escapeAttribute(token.id)}" data-kp-lisp-material-kind="${token.kind}" data-kp-lisp-owner-expression="${escapeAttribute(token.ownerExpressionId)}" data-kp-lisp-origin-ids="${escapeAttribute(token.originIds.join(" "))}" data-kp-lisp-transported="${frame.transported}" style="--kp-lisp-x:${px(frame.xEm)};--kp-lisp-y:${px(frame.yEm)};--kp-lisp-scale:${frame.scale};--kp-lisp-opacity:${frame.opacity}">${escapeHtml(token.lexeme)}</span>`;
}

function px(valueEm: number): string {
  return `${Math.round(valueEm * 20 * 1e6) / 1e6}px`;
}

function renderGuides(frame: KpLispApplicationMotionFrame): string {
  const guide = frame.transientGuide;
  if (guide === null) return "";
  return `<svg class="kp-lisp-application-stage__guides" data-kp-lisp-transient-guides data-kp-lisp-guide-lifetime="transient" viewBox="0 0 ${frame.geometry.stage.widthEm} ${frame.geometry.stage.heightEm}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false"><path class="kp-lisp-application-stage__guide" data-kp-lisp-transient-guide="${escapeAttribute(guide.id)}" d="${escapeAttribute(guide.d)}" opacity="${guide.opacity}"></path><path class="kp-lisp-application-stage__wake" data-kp-lisp-transient-wake="${escapeAttribute(guide.id)}" d="${escapeAttribute(guide.d)}" opacity="${guide.wakeOpacity}"></path></svg>`;
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
  if (value === undefined) throw new Error(`Missing rendered Lisp material ${id}.`);
  return value;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
