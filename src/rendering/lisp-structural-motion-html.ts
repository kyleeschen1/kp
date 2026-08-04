import type { KpLispStructuralMotionFrame } from
  "../animation/lisp-structural-motion.ts";
import {
  kpLispExpressionBeadCss,
  renderKpLispExpressionBeadHtml
} from "./lisp-s-expression-bead-html.ts";

export const kpLispStructuralMotionCss = `
${kpLispExpressionBeadCss}
.kp-lisp-structural-stage {
  --kp-lisp-structural-ink: var(--kp-lesson-theme-math-foreground, #3d454b);
  align-items: center;
  color: var(--kp-lisp-structural-ink);
  display: grid;
  justify-items: center;
  min-block-size: 12em;
  overflow: visible;
  position: relative;
}
.kp-lisp-structural-stage__source {
  block-size: var(--kp-lisp-stage-height);
  inline-size: var(--kp-lisp-stage-width);
  margin: 0;
  overflow: visible;
  position: relative;
}
.kp-lisp-structural-stage__source code {
  block-size: 100%;
  color: inherit;
  display: block;
  font: 400 20px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
  inline-size: 100%;
  position: relative;
  user-select: text;
  white-space: pre;
}
.kp-lisp-structural-stage__token {
  display: inline-block;
  inset-block-start: var(--kp-lisp-token-y);
  inset-inline-start: var(--kp-lisp-token-x);
  opacity: var(--kp-lisp-token-opacity);
  position: absolute;
  transform: scale(var(--kp-lisp-token-scale));
  transform-origin: center;
  will-change: transform;
}
.kp-lisp-structural-stage__token[data-kp-lisp-visible="false"] {
  pointer-events: none;
}
.kp-lisp-structural-stage__bead {
  inset-block-start: var(--kp-lisp-bead-y);
  inset-inline-start: var(--kp-lisp-bead-x);
  opacity: var(--kp-lisp-bead-opacity);
  pointer-events: none;
  position: absolute;
  transform: translate(-50%, -50%) scale(var(--kp-lisp-bead-scale));
  transform-origin: center;
  will-change: transform;
}
.kp-lisp-structural-stage__bead > .kp-lisp-expression-bead {
  box-shadow: 0 .18rem .5rem rgb(32 59 53 / .12);
}
@media (prefers-reduced-motion: reduce) {
  .kp-lisp-structural-stage__token,
  .kp-lisp-structural-stage__bead { will-change: auto; }
}
`;

export function renderKpLispStructuralMotionHtml(
  frame: KpLispStructuralMotionFrame
): string {
  const tokenById = new Map(frame.tokens.map((token) => [token.token.id, token]));
  let cursor = 0;
  let sourceHtml = "";
  for (const sourceToken of frame.state.tokens) {
    const token = tokenById.get(sourceToken.id);
    if (token === undefined) throw new Error(`Structural frame lacks ${sourceToken.id}.`);
    sourceHtml += escapeHtml(frame.state.nativeCode.slice(cursor, sourceToken.source.start));
    sourceHtml += renderToken(token);
    cursor = sourceToken.source.end;
  }
  sourceHtml += escapeHtml(frame.state.nativeCode.slice(cursor));

  const beads = frame.beads.map((bead) =>
    `<span class="kp-lisp-structural-stage__bead" data-kp-lisp-structural-bead="${escapeAttribute(bead.bead.expressionId)}" data-kp-lisp-visible="${bead.opacity > 0.001}" style="--kp-lisp-bead-x:${bead.xEm}em;--kp-lisp-bead-y:${bead.yEm}em;--kp-lisp-bead-scale:${bead.scale};--kp-lisp-bead-opacity:${bead.opacity}">${renderKpLispExpressionBeadHtml({ bead: bead.bead, detailed: bead.detailed })}</span>`
  ).join("");
  const frontier = frame.frontierExpressionIds.join(" ");

  return `<section class="kp-lisp-structural-stage" data-kp-lisp-structural-stage data-kp-lisp-progress="${frame.progress}" data-kp-lisp-checkpoint="${escapeAttribute(frame.checkpointId)}" data-kp-lisp-phase="${frame.phase}" data-kp-lisp-direction="${frame.direction}" data-kp-lisp-frontier="${escapeAttribute(frontier)}" data-kp-lisp-paint-owner="semantic-dom" aria-label="${escapeAttribute(frame.accessibleDescription)}"><pre class="kp-lisp-structural-stage__source" style="--kp-lisp-stage-width:${frame.geometry.stage.widthEm}em;--kp-lisp-stage-height:${frame.geometry.stage.heightEm}em"><code data-kp-lisp-native-code="application">${sourceHtml}</code>${beads}</pre></section>`;
}

function renderToken(
  frame: KpLispStructuralMotionFrame["tokens"][number]
): string {
  const { token } = frame;
  return `<span class="kp-lisp-structural-stage__token" data-kp-lisp-material-id="${escapeAttribute(token.id)}" data-kp-lisp-material-kind="${token.kind}" data-kp-lisp-owner-expression="${escapeAttribute(token.ownerExpressionId)}" data-kp-lisp-owner-role="${token.ownerRole}" data-kp-lisp-origin-ids="${escapeAttribute(token.originIds.join(" "))}" data-kp-lisp-active="${frame.active}" data-kp-lisp-compression="${frame.compression}" data-kp-lisp-visible="${frame.opacity > 0.001}" style="--kp-lisp-token-x:${frame.xEm}em;--kp-lisp-token-y:${frame.yEm}em;--kp-lisp-token-scale:${frame.scale};--kp-lisp-token-opacity:${frame.opacity}">${escapeHtml(token.lexeme)}</span>`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
