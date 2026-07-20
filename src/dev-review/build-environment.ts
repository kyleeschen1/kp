import type { KpDevReviewEnvironmentV1 } from "../../protocols/dev-review-v1.ts";

export interface KpDevReviewBuildIdentity {
  readonly commit: string;
  readonly fingerprint: string;
  readonly dirty: boolean;
}

export interface KpDevReviewEnvironmentSource {
  readonly userAgent: string;
  readonly platform?: string | undefined;
  readonly language: string;
  readonly viewport: {
    readonly width: number;
    readonly height: number;
    readonly devicePixelRatio: number;
    readonly scrollX: number;
    readonly scrollY: number;
  };
  readonly mediaMatches: (query: string) => boolean;
}

export function captureKpDevReviewEnvironment(
  source: KpDevReviewEnvironmentSource,
  build: KpDevReviewBuildIdentity
): KpDevReviewEnvironmentV1 {
  const browser = parseBrowserIdentity(source.userAgent);
  return {
    browserName: browser.name,
    ...(browser.version === undefined ? {} : { browserVersion: browser.version }),
    ...(source.platform === undefined || source.platform.length === 0
      ? {}
      : { platform: source.platform }),
    language: source.language || "und",
    viewport: {
      width: finiteOr(source.viewport.width, 1),
      height: finiteOr(source.viewport.height, 1),
      devicePixelRatio: finiteOr(source.viewport.devicePixelRatio, 1),
      scrollX: finiteOr(source.viewport.scrollX, 0),
      scrollY: finiteOr(source.viewport.scrollY, 0)
    },
    reducedMotion: source.mediaMatches("(prefers-reduced-motion: reduce)"),
    forcedColors: source.mediaMatches("(forced-colors: active)"),
    colorScheme: source.mediaMatches("(prefers-color-scheme: dark)") ? "dark" : "light",
    build: normalizeBuildIdentity(build)
  };
}

export function browserKpDevReviewEnvironmentSource(
  browserWindow: Window,
  browserNavigator: Navigator
): KpDevReviewEnvironmentSource {
  return {
    userAgent: browserNavigator.userAgent,
    platform: browserNavigator.platform,
    language: browserNavigator.language,
    viewport: {
      width: browserWindow.innerWidth,
      height: browserWindow.innerHeight,
      devicePixelRatio: browserWindow.devicePixelRatio,
      scrollX: browserWindow.scrollX,
      scrollY: browserWindow.scrollY
    },
    mediaMatches: (query) => browserWindow.matchMedia(query).matches
  };
}

function normalizeBuildIdentity(build: KpDevReviewBuildIdentity): KpDevReviewBuildIdentity {
  return {
    commit: build.commit || "unknown",
    fingerprint: build.fingerprint || "dev-unknown",
    dirty: build.dirty
  };
}

function parseBrowserIdentity(userAgent: string): { name: string; version?: string } {
  const candidates: readonly [RegExp, string][] = [
    [/Edg\/([\d.]+)/, "Edge"],
    [/Chrome\/([\d.]+)/, "Chrome"],
    [/Firefox\/([\d.]+)/, "Firefox"],
    [/Version\/([\d.]+).*Safari\//, "Safari"]
  ];
  for (const [pattern, name] of candidates) {
    const match = pattern.exec(userAgent);
    if (match?.[1] !== undefined) return { name, version: match[1] };
  }
  return { name: "Unknown" };
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}
