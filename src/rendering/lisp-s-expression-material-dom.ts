import type {
  KpLispCanonicalMaterialState,
  KpLispSourceMaterialToken
} from "../animation/lisp-s-expression-material-projection.ts";

export interface KpLispTransientGuideLayer {
  readonly lifetime: "transient";
  readonly widthEm: number;
  readonly heightEm: number;
  readonly paths: readonly {
    readonly id: string;
    readonly d: string;
    readonly opacity: number;
  }[];
}

export interface KpLispSemanticDomRenderInput {
  readonly state: KpLispCanonicalMaterialState;
  readonly presentation: "canonical-endpoint" | "material-motion";
  readonly accessibleLabel: string;
  readonly transientGuides?: KpLispTransientGuideLayer | undefined;
}

export const kpLispSemanticDomCss = `
.kp-lisp-material-stage {
  --kp-lisp-material-ink: var(--kp-lesson-theme-math-foreground, #3d454b);
  --kp-lisp-material-guide: var(--kp-lesson-theme-focus, #7a9da8);
  align-items: center;
  color: var(--kp-lisp-material-ink);
  display: grid;
  justify-items: center;
  min-block-size: 12em;
  position: relative;
}
.kp-lisp-material-stage__code {
  grid-area: 1 / 1;
  margin: 0;
  overflow: visible;
}
.kp-lisp-material-stage__code code {
  color: inherit;
  font: 400 20px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
  user-select: text;
  white-space: pre;
}
.kp-lisp-material-stage__token { display: inline-block; }
.kp-lisp-material-stage__guides {
  block-size: 100%;
  inline-size: 100%;
  inset: 0;
  overflow: visible;
  pointer-events: none;
  position: absolute;
}
.kp-lisp-material-stage__guide {
  fill: none;
  stroke: var(--kp-lisp-material-guide);
  stroke-linecap: round;
  stroke-width: .11;
  vector-effect: non-scaling-stroke;
}
`;

/**
 * Renders certified source material directly into the reading-order DOM.
 * Motion decorates this one owner; it never introduces a competing code copy.
 */
export function renderKpLispSemanticDomHtml(
  input: KpLispSemanticDomRenderInput
): string {
  validateState(input.state);
  validateGuides(input.transientGuides);

  const tokens = renderTokens(input.state);
  const guides = input.transientGuides === undefined
    ? ""
    : renderTransientGuides(input.transientGuides);

  return `<section class="kp-lisp-material-stage" data-kp-lisp-material-stage data-kp-lisp-canonical-state="${input.state.id}" data-kp-lisp-presentation="${input.presentation}" data-kp-lisp-paint-owner="semantic-dom" aria-label="${escapeAttribute(input.accessibleLabel)}"><pre class="kp-lisp-material-stage__code"><code data-kp-lisp-native-code="${input.state.id}">${tokens}</code></pre>${guides}</section>`;
}

function renderTokens(state: KpLispCanonicalMaterialState): string {
  let cursor = 0;
  let html = "";
  for (const token of state.tokens) {
    html += escapeHtml(state.nativeCode.slice(cursor, token.source.start));
    html += renderToken(token);
    cursor = token.source.end;
  }
  return html + escapeHtml(state.nativeCode.slice(cursor));
}

function renderToken(token: KpLispSourceMaterialToken): string {
  const origins = token.originIds.join(" ");
  return `<span class="kp-lisp-material-stage__token" data-kp-lisp-material-id="${escapeAttribute(token.id)}" data-kp-lisp-material-kind="${token.kind}" data-kp-lisp-owner-expression="${escapeAttribute(token.ownerExpressionId)}" data-kp-lisp-owner-role="${token.ownerRole}" data-kp-lisp-depth="${token.depth}" data-kp-lisp-origin-ids="${escapeAttribute(origins)}">${escapeHtml(token.lexeme)}</span>`;
}

function renderTransientGuides(layer: KpLispTransientGuideLayer): string {
  const paths = layer.paths.map((path) =>
    `<path class="kp-lisp-material-stage__guide" data-kp-lisp-transient-guide="${escapeAttribute(path.id)}" d="${escapeAttribute(path.d)}" opacity="${path.opacity.toFixed(4)}"></path>`
  ).join("");
  return `<svg class="kp-lisp-material-stage__guides" data-kp-lisp-transient-guides data-kp-lisp-guide-lifetime="transient" viewBox="0 0 ${layer.widthEm} ${layer.heightEm}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">${paths}</svg>`;
}

function validateState(state: KpLispCanonicalMaterialState): void {
  let cursor = 0;
  const ids = new Set<string>();
  for (const token of state.tokens) {
    if (ids.has(token.id)) {
      throw new Error(`Duplicate Lisp material ${token.id}.`);
    }
    ids.add(token.id);
    if (token.source.start < cursor || token.source.end <= token.source.start) {
      throw new Error(`Lisp material ${token.id} is outside canonical reading order.`);
    }
    if (state.nativeCode.slice(token.source.start, token.source.end) !== token.lexeme) {
      throw new Error(`Lisp material ${token.id} does not match canonical source.`);
    }
    cursor = token.source.end;
  }
}

function validateGuides(layer: KpLispTransientGuideLayer | undefined): void {
  if (layer === undefined) return;
  if (layer.lifetime !== "transient") {
    throw new Error("Lisp SVG guides must be transient.");
  }
  if (!positiveFinite(layer.widthEm) || !positiveFinite(layer.heightEm)) {
    throw new Error("Lisp SVG guides require a positive finite view box.");
  }
  const ids = new Set<string>();
  for (const path of layer.paths) {
    if (path.id.trim() === "" || path.d.trim() === "") {
      throw new Error("Lisp SVG guide paths require ids and geometry.");
    }
    if (ids.has(path.id)) throw new Error(`Duplicate Lisp guide ${path.id}.`);
    ids.add(path.id);
    if (!Number.isFinite(path.opacity) || path.opacity < 0 || path.opacity > 1) {
      throw new Error(`Lisp guide ${path.id} opacity must be between zero and one.`);
    }
  }
}

function positiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
