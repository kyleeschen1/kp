import {
  kpVisualPaletteSources,
  type KpVisualThemeId
} from "../animation/semantic-visual-salience.ts";

export type KpSemanticVisualDomThemeProperties = Readonly<Record<
  `--kp-semantic-${string}`,
  string
>>;

export function projectKpSemanticVisualDomThemeProperties(
  theme: KpVisualThemeId
): KpSemanticVisualDomThemeProperties {
  const palette = kpVisualPaletteSources[theme];
  return Object.freeze({
    "--kp-semantic-page": palette.neutral.page,
    "--kp-semantic-surface": palette.neutral.surface,
    "--kp-semantic-surface-raised": palette.neutral.surfaceRaised,
    "--kp-semantic-ink-strong": palette.neutral.inkStrong,
    "--kp-semantic-ink": palette.neutral.ink,
    "--kp-semantic-ink-secondary": palette.neutral.inkSecondary,
    "--kp-semantic-ink-context": palette.neutral.inkContext,
    "--kp-semantic-ink-dim": palette.neutral.inkDim,
    "--kp-semantic-ink-ghost": palette.neutral.inkGhost,
    "--kp-semantic-line-strong": palette.neutral.lineStrong,
    "--kp-semantic-line": palette.neutral.line,
    "--kp-semantic-line-subtle": palette.neutral.lineSubtle,
    "--kp-semantic-focus": palette.identities.cyan.focus,
    "--kp-semantic-relation": palette.identities.cyan.normal
  });
}

/** Projects cached theme endpoints once; per-frame salience never reads styles. */
export function applyKpSemanticVisualDomTheme(input: {
  readonly root: HTMLElement;
  readonly theme: KpVisualThemeId;
}): void {
  input.root.dataset["kpVisualTheme"] = input.theme;
  for (const [name, value] of Object.entries(
    projectKpSemanticVisualDomThemeProperties(input.theme)
  )) {
    input.root.style.setProperty(name, value);
  }
}
