import type {
  KpSchemeFirstExpansion,
  KpSchemeFirstExpansionSample
} from "../animation/scheme-factorial-first-expansion.ts";

export interface KpSchemeFirstExpansionRenderInput {
  readonly expansion: KpSchemeFirstExpansion;
  readonly sample: KpSchemeFirstExpansionSample;
}

/** One code owner: settled and moving glyphs share the same reading surface. */
export function renderKpSchemeFirstExpansionHtml(
  input: KpSchemeFirstExpansionRenderInput
): string {
  const widthCh = Math.max(
    input.expansion.source.nativeCode.length,
    input.expansion.target.nativeCode.length
  );
  const tokens = input.sample.tokens.map((material) =>
    `<span class="kp-scheme-first-expansion__token" data-kp-scheme-first-expansion-token="${escapeAttribute(material.targetMaterialId)}" data-kp-scheme-motion-id="${escapeAttribute(material.motionId)}" data-kp-scheme-source-material-id="${escapeAttribute(material.sourceMaterialId ?? "introduced")}" data-kp-scheme-origin-expression-ids="${escapeAttribute(material.originExpressionIds.join(" "))}" data-kp-scheme-runtime-ids="${escapeAttribute(material.runtimeIds.join(" "))}" style="--kp-scheme-token-x:${material.xCh}ch;--kp-scheme-token-y:${material.yEm}em;--kp-scheme-token-opacity:${material.opacity};--kp-scheme-token-scale:${material.scale}">${escapeHtml(material.lexeme)}</span>`
  ).join("");
  return `<section class="kp-scheme-first-expansion" data-kp-scheme-first-expansion data-kp-scheme-first-expansion-phase="${input.sample.phase}" data-kp-scheme-first-expansion-progress="${input.sample.progress}" data-kp-scheme-paint-owner="code-material" aria-label="${escapeAttribute(input.expansion.accessibleDescription)}"><pre class="kp-scheme-first-expansion__code" style="--kp-scheme-code-width:${widthCh}ch"><code>${tokens}</code></pre><span class="kp-scheme-first-expansion__accessible">${escapeHtml(input.sample.nativeCode)}</span></section>`;
}

export const kpSchemeFirstExpansionCss = `
.kp-scheme-first-expansion {
  --kp-scheme-bg: var(--kp-lesson-theme-surface, #0d0e1c);
  --kp-scheme-ink: var(--kp-lesson-theme-math-foreground, #e7e5df);
  --kp-scheme-accent: var(--kp-lesson-theme-focus, #88c9ff);
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
  block-size: 4.5em;
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
  top: 1.5em;
  transform: translate(var(--kp-scheme-token-x), var(--kp-scheme-token-y)) scale(var(--kp-scheme-token-scale));
  transform-origin: center;
  will-change: transform, opacity;
}
.kp-scheme-first-expansion__token[data-kp-scheme-first-expansion-token*="retained-three"],
.kp-scheme-first-expansion__token[data-kp-scheme-first-expansion-token*="next-argument-two"] {
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

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
