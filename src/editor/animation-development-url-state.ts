export const kpAnimationDevelopmentViews = [
  "animation-catalogue",
  "coverage"
] as const;

export const kpAnimationDevelopmentThemes = ["light", "dark"] as const;
export const KP_ANIMATION_DEVELOPMENT_DEFAULT_THEME = "dark" as const;
export const kpAnimationDevelopmentStyles = [
  "organic-subtle",
  "restrained-editorial"
] as const;
export const kpAnimationDevelopmentFocusModes = [
  "flat",
  "elevated",
  "no-depth"
] as const;

export type KpAnimationDevelopmentView =
  typeof kpAnimationDevelopmentViews[number];
export type KpAnimationDevelopmentTheme =
  typeof kpAnimationDevelopmentThemes[number];
export type KpAnimationDevelopmentStyle =
  typeof kpAnimationDevelopmentStyles[number];
export type KpAnimationDevelopmentFocusMode =
  typeof kpAnimationDevelopmentFocusModes[number];

export interface KpAnimationDevelopmentDisplaySettings {
  readonly style: KpAnimationDevelopmentStyle;
  readonly focus: KpAnimationDevelopmentFocusMode;
}

export interface KpAnimationDevelopmentUrlState {
  readonly view: KpAnimationDevelopmentView | undefined;
  readonly viewSource: "default" | "explicit" | "other-view";
  readonly theme: KpAnimationDevelopmentTheme;
  readonly display: KpAnimationDevelopmentDisplaySettings;
  readonly artifactId?: string | undefined;
  readonly checkpointId?: string | undefined;
  readonly playhead?: number | undefined;
}

/**
 * Keeps theme precedence independent from any particular persistence host:
 * exact links must win, while a host may supply a saved preference before the
 * shared dark fallback is used.
 */
export function resolveKpAnimationDevelopmentTheme(input: {
  readonly explicitTheme: string | null;
  readonly preferredTheme?: string | null | undefined;
  readonly fallbackTheme?: KpAnimationDevelopmentTheme | undefined;
}): KpAnimationDevelopmentTheme {
  return member(input.explicitTheme, kpAnimationDevelopmentThemes) ??
    member(input.preferredTheme ?? null, kpAnimationDevelopmentThemes) ??
    input.fallbackTheme ??
    KP_ANIMATION_DEVELOPMENT_DEFAULT_THEME;
}

const ownedParameters = [
  "view",
  "theme",
  "style",
  "focus",
  "artifact",
  "checkpoint",
  "playhead"
] as const;

export function readKpAnimationDevelopmentUrlState(
  input: string | URL
): KpAnimationDevelopmentUrlState {
  const url = input instanceof URL
    ? input
    : new URL(input, "https://kp.invalid");
  const requestedView = url.searchParams.get("view");
  const view = requestedView === null ||
      requestedView === "animation-catalogue"
    ? "animation-catalogue" as const
    : requestedView === "coverage"
      ? "coverage" as const
      : undefined;
  const viewSource = requestedView === null
    ? "default" as const
    : view === undefined
      ? "other-view" as const
      : "explicit" as const;
  const defaultTheme = view === "coverage" ? "dark" : "light";
  const theme = member(
    url.searchParams.get("theme"),
    kpAnimationDevelopmentThemes
  ) ?? defaultTheme;
  const style = member(
    url.searchParams.get("style"),
    kpAnimationDevelopmentStyles
  ) ?? "organic-subtle";
  const focus = member(
    url.searchParams.get("focus"),
    kpAnimationDevelopmentFocusModes
  ) ?? "flat";
  const artifactId = nonBlank(url.searchParams.get("artifact"));
  const checkpointId = nonBlank(url.searchParams.get("checkpoint"));
  const playhead = readPlayhead(url.searchParams.get("playhead"));

  return Object.freeze({
    view,
    viewSource,
    theme,
    display: Object.freeze({ style, focus }),
    ...(artifactId === undefined ? {} : { artifactId }),
    ...(checkpointId === undefined ? {} : { checkpointId }),
    ...(playhead === undefined ? {} : { playhead })
  });
}

/**
 * Produces a complete reproducible development URL. The codec owns values and
 * canonical formatting; browser or framework hosts still own history policy.
 */
export function writeKpAnimationDevelopmentUrlState(input: {
  readonly baseUrl: string | URL;
  readonly state: KpAnimationDevelopmentUrlState;
}): string {
  if (input.state.view === undefined) {
    throw new Error("Animation development URL requires a supported view.");
  }
  const url = input.baseUrl instanceof URL
    ? new URL(input.baseUrl.href)
    : new URL(input.baseUrl);
  for (const parameter of ownedParameters) url.searchParams.delete(parameter);
  url.searchParams.set("view", input.state.view);
  url.searchParams.set("theme", input.state.theme);
  url.searchParams.set("style", input.state.display.style);
  url.searchParams.set("focus", input.state.display.focus);
  setNonBlank(url.searchParams, "artifact", input.state.artifactId);
  setNonBlank(url.searchParams, "checkpoint", input.state.checkpointId);
  if (input.state.playhead !== undefined) {
    url.searchParams.set("playhead", formatPlayhead(input.state.playhead));
  }
  url.searchParams.sort();
  return url.href;
}

export function createKpAnimationDevelopmentExactHref(
  href: string | URL
): string {
  return writeKpAnimationDevelopmentUrlState({
    baseUrl: href,
    state: readKpAnimationDevelopmentUrlState(href)
  });
}

function member<const TValues extends readonly string[]>(
  value: string | null,
  values: TValues
): TValues[number] | undefined {
  return values.includes(value ?? "")
    ? value as TValues[number]
    : undefined;
}

function nonBlank(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
}

function readPlayhead(value: string | null): number | undefined {
  if (value === null || value.trim().length === 0) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1
    ? parsed
    : undefined;
}

function formatPlayhead(value: number): string {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError("Animation playhead must be between zero and one.");
  }
  return String(Math.round(value * 1_000) / 1_000);
}

function setNonBlank(
  parameters: URLSearchParams,
  key: string,
  value: string | undefined
): void {
  const normalized = nonBlank(value ?? null);
  if (normalized !== undefined) parameters.set(key, normalized);
}
