import type {
  KpConceptRoomThemeShape,
  KpConceptRoomThemeTokens
} from "./concept-room-theme.ts";

export interface KpConceptRoomSvgTheme {
  readonly ink: string;
  readonly mutedInk: string;
  readonly accent: string;
  readonly relation: string;
  readonly focus: string;
  readonly variable: string;
  readonly unit: string;
  readonly line: string;
  readonly mathFamily: "KaTeX_Main";
  readonly lineWidth: string;
}

export function conceptRoomThemeVariables(
  theme: KpConceptRoomThemeShape
): readonly (readonly [name: string, value: string])[] {
  const tokens = requireTokens(theme);
  return Object.freeze([
    ["--kp-concept-paper", tokens.color.paper],
    ["--kp-concept-surface", tokens.color.surface],
    ["--kp-concept-ink", tokens.color.ink],
    ["--kp-concept-muted-ink", tokens.color.mutedInk],
    ["--kp-concept-accent", tokens.color.accent],
    ["--kp-concept-relation", tokens.color.relation],
    ["--kp-concept-focus", tokens.color.focus],
    ["--kp-concept-variable", tokens.color.variable],
    ["--kp-concept-unit", tokens.color.unit],
    ["--kp-concept-line", tokens.color.line],
    ["--kp-concept-font-display", tokens.typography.displayFamily],
    ["--kp-concept-font-body", tokens.typography.bodyFamily],
    ["--kp-concept-font-control", tokens.typography.controlFamily],
    ["--kp-concept-font-math", tokens.typography.mathFamily],
    ["--kp-concept-space-hairline", tokens.space.hairline],
    ["--kp-concept-space-compact", tokens.space.compact],
    ["--kp-concept-space-control", tokens.space.control],
    ["--kp-concept-space-section", tokens.space.section],
    ["--kp-concept-space-stage", tokens.space.stage],
    ["--kp-concept-surface-radius", tokens.shape.surfaceRadius],
    ["--kp-concept-control-radius", tokens.shape.controlRadius],
    ["--kp-concept-line-width", tokens.shape.lineWidth],
    ["--kp-concept-focus-width", tokens.focus.ringWidth],
    ["--kp-concept-focus-offset", tokens.focus.ringOffset],
    ["--kp-concept-focus-wash-opacity", String(tokens.focus.washOpacity)],
    ["--kp-concept-motion-focus", `${tokens.motion.focusMs}ms`],
    ["--kp-concept-motion-reflow", `${tokens.motion.reflowMs}ms`],
    ["--kp-concept-motion-act", `${tokens.motion.actMs}ms`],
    ["--kp-concept-motion-settle", `${tokens.motion.settleMs}ms`]
  ] as const);
}

export function applyConceptRoomTheme(
  element: HTMLElement | SVGElement,
  theme: KpConceptRoomThemeShape
): void {
  for (const [name, value] of conceptRoomThemeVariables(theme)) {
    element.style.setProperty(name, value);
  }
  element.dataset["kpTheme"] = theme.id;
}

export function conceptRoomSvgTheme(theme: KpConceptRoomThemeShape): KpConceptRoomSvgTheme {
  const tokens = requireTokens(theme);
  return Object.freeze({
    ink: tokens.color.ink,
    mutedInk: tokens.color.mutedInk,
    accent: tokens.color.accent,
    relation: tokens.color.relation,
    focus: tokens.color.focus,
    variable: tokens.color.variable,
    unit: tokens.color.unit,
    line: tokens.color.line,
    mathFamily: tokens.typography.mathFamily,
    lineWidth: tokens.shape.lineWidth
  });
}

export function conceptRoomThemeCss(
  theme: KpConceptRoomThemeShape,
  selector = `[data-kp-theme="${theme.id}"]`
): string {
  const declarations = conceptRoomThemeVariables(theme)
    .map(([name, value]) => `${name}:${value}`)
    .join(";");
  return `${selector}{${declarations}}`;
}

export function conceptRoomReviewThemeCss(theme: KpConceptRoomThemeShape): string {
  const selector = `[data-kp-concept-review][data-kp-theme="${theme.id}"]`;
  return [
    conceptRoomThemeCss(theme, selector),
    `${selector}{background:var(--kp-concept-paper);color:var(--kp-concept-ink);font-family:var(--kp-concept-font-body)}`,
    `${selector} .katex{color:inherit}`,
    `@media print{${selector}{background:#fff;color:#000}}`,
    `@media (prefers-reduced-motion:reduce){${selector} *{animation-duration:.001ms!important;scroll-behavior:auto!important;transition-duration:.001ms!important}}`,
    `@media (forced-colors:active){${selector}{--kp-concept-focus:Highlight;--kp-concept-line:CanvasText;forced-color-adjust:auto}}`
  ].join("\n");
}

function requireTokens(theme: KpConceptRoomThemeShape): KpConceptRoomThemeTokens {
  if (theme.tokens === undefined) {
    throw new Error(`Concept room theme ${theme.id} does not define visual tokens.`);
  }
  return theme.tokens;
}
