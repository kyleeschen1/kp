import type { KpCompiledLessonArtifact } from "../document/public-api.ts";

export type KpReaderRoutePath = `/reader/${string}/`;
export type KpReaderLessonSourcePath = `content/lessons/${string}.md`;

export interface KpReaderRouteConformanceProfile {
  readonly readerId: string;
  readonly documentId: string;
  readonly version: string;
  readonly progressPermille: number;
  readonly beatId: string;
  readonly query: Readonly<Record<string, string>>;
  readonly stageSelector: string;
  readonly rendererAdapterId: string;
  readonly shareSelector: string;
  readonly fontReadyEvidence: "body-attribute" | "document-fonts";
  readonly progressEvidence:
    | { readonly kind: "attribute"; readonly selector: string; readonly name: string }
    | { readonly kind: "value"; readonly selector: string };
  readonly searchableText: string;
}

export type KpReaderVisualReviewViewport = "desktop" | "tablet" | "phone";

export interface KpReaderVisualReviewCheckpoint {
  readonly id: string;
  readonly label: string;
  readonly progressPermille: number;
  readonly viewport: KpReaderVisualReviewViewport;
  readonly query?: Readonly<Record<string, string>> | undefined;
  readonly direction?: "forward" | "inverse" | undefined;
  readonly visualProgressPermille?: number | undefined;
}

export interface KpReaderRouteVisualReviewProfile {
  readonly id: string;
  readonly title: string;
  readonly capture: "viewport" | "stage";
  readonly columns: number;
  readonly imageFit: "contain" | "cover";
  readonly checkpoints: readonly KpReaderVisualReviewCheckpoint[];
}

export interface KpReaderRouteBudgetProfile {
  readonly compiledHtmlRawBytes: number;
  readonly compiledHtmlGzipBytes: number;
  readonly runtimeCodeGzipBytes: number;
}

export type KpReaderRoutePresentationGovernance =
  | {
      readonly kind: "shared-certified-runtime";
      readonly certificationId: string;
      readonly genericFallback: "forbidden";
      readonly browserPhaseGates: readonly string[];
    }
  | {
      readonly kind: "certified-custom-renderer";
      readonly certificationId: string;
      readonly operationCertificateIds: readonly string[];
      readonly genericFallback: "forbidden";
      readonly browserPhaseGates: readonly string[];
    };

export interface KpReaderRouteDescriptor {
  readonly route: KpReaderRoutePath;
  readonly sourcePath: KpReaderLessonSourcePath;
  readonly compile: (markdown: string) => KpCompiledLessonArtifact;
  readonly conformance: KpReaderRouteConformanceProfile;
  readonly presentation: KpReaderRoutePresentationGovernance;
  readonly review: KpReaderRouteVisualReviewProfile;
  readonly budget: KpReaderRouteBudgetProfile;
}

/**
 * Keeps route declarations literal and inferred while validating the filesystem
 * conventions consumed by Vite, conformance tests, and review tooling.
 */
export function defineKpReaderRoute<const TRoute extends KpReaderRouteDescriptor>(
  descriptor: TRoute
): TRoute {
  if (!descriptor.route.startsWith("/reader/") || !descriptor.route.endsWith("/")) {
    throw new Error(`Reader route ${descriptor.route} must start with /reader/ and end with /.`);
  }
  if (!descriptor.sourcePath.startsWith("content/lessons/") || !descriptor.sourcePath.endsWith(".md")) {
    throw new Error(`Reader source ${descriptor.sourcePath} must be lesson Markdown.`);
  }
  if (!Number.isInteger(descriptor.conformance.progressPermille) ||
      descriptor.conformance.progressPermille < 0 ||
      descriptor.conformance.progressPermille > 1_000) {
    throw new Error(`Reader route ${descriptor.route} requires bounded conformance progress.`);
  }
  if (Object.hasOwn(descriptor.conformance.query, "kpProgress")) {
    throw new Error(`Reader route ${descriptor.route} conformance query must not fix kpProgress.`);
  }
  for (const [field, value] of Object.entries({
    documentId: descriptor.conformance.documentId,
    beatId: descriptor.conformance.beatId,
    stageSelector: descriptor.conformance.stageSelector,
    rendererAdapterId: descriptor.conformance.rendererAdapterId,
    searchableText: descriptor.conformance.searchableText
  })) {
    if (value.trim() === "") {
      throw new Error(`Reader route ${descriptor.route} conformance ${field} must not be empty.`);
    }
  }
  if (descriptor.review.id.trim() === "" || descriptor.review.title.trim() === "") {
    throw new Error(`Reader route ${descriptor.route} requires named visual review metadata.`);
  }
  if (
    descriptor.presentation.certificationId.trim() === "" ||
    descriptor.presentation.genericFallback !== "forbidden" ||
    descriptor.presentation.browserPhaseGates.length === 0 ||
    descriptor.presentation.browserPhaseGates.some(
      (phase) => phase.trim() === "" || /generic/i.test(phase)
    )
  ) {
    throw new Error(
      `Reader route ${descriptor.route} requires certified presentation phases and must forbid generic fallback.`
    );
  }
  if (
    descriptor.presentation.kind === "shared-certified-runtime" &&
    descriptor.conformance.rendererAdapterId !== "renderer.equation-dom"
  ) {
    throw new Error(
      `Reader route ${descriptor.route} may use shared certification only with renderer.equation-dom.`
    );
  }
  if (
    descriptor.presentation.kind === "certified-custom-renderer" &&
    (descriptor.conformance.rendererAdapterId === "renderer.equation-dom" ||
      descriptor.presentation.operationCertificateIds.length === 0 ||
      descriptor.presentation.operationCertificateIds.some(
        (id) => id.trim() === ""
      ))
  ) {
    throw new Error(
      `Custom reader route ${descriptor.route} requires explicit operation-presentation certificate ids.`
    );
  }
  if (!Number.isInteger(descriptor.review.columns) || descriptor.review.columns < 1) {
    throw new Error(`Reader route ${descriptor.route} requires positive visual review columns.`);
  }
  if (descriptor.review.checkpoints.length === 0) {
    throw new Error(`Reader route ${descriptor.route} requires a visual review checkpoint.`);
  }
  for (const [metric, value] of Object.entries(descriptor.budget)) {
    if (!Number.isInteger(value) || value < 1) {
      throw new Error(
        `Reader route ${descriptor.route} budget ${metric} must be a positive byte baseline.`
      );
    }
  }
  const reviewIds = new Set<string>();
  for (const checkpoint of descriptor.review.checkpoints) {
    if (checkpoint.id.trim() === "" || checkpoint.label.trim() === "") {
      throw new Error(`Reader route ${descriptor.route} has an unnamed visual review checkpoint.`);
    }
    if (reviewIds.has(checkpoint.id)) {
      throw new Error(
        `Reader route ${descriptor.route} repeats visual review checkpoint ${checkpoint.id}.`
      );
    }
    reviewIds.add(checkpoint.id);
    for (const value of [checkpoint.progressPermille, checkpoint.visualProgressPermille]
      .filter((candidate): candidate is number => candidate !== undefined)) {
      if (!Number.isInteger(value) || value < 0 || value > 1_000) {
        throw new Error(
          `Reader route ${descriptor.route} has unbounded visual review progress.`
        );
      }
    }
    if (checkpoint.query !== undefined && Object.hasOwn(checkpoint.query, "kpProgress")) {
      throw new Error(
        `Reader route ${descriptor.route} visual review query must not fix kpProgress.`
      );
    }
  }
  return descriptor;
}

export function defineKpReaderRouteManifest<
  const TRoutes extends readonly KpReaderRouteDescriptor[]
>(routes: TRoutes): TRoutes {
  const seenRoutes = new Set<string>();
  const seenEntries = new Set<string>();
  for (const route of routes) {
    defineKpReaderRoute(route);
    const entryName = kpReaderRouteEntryName(route.route);
    if (seenRoutes.has(route.route)) {
      throw new Error(`Reader route ${route.route} is declared more than once.`);
    }
    if (seenEntries.has(entryName)) {
      throw new Error(`Reader entry ${entryName} is declared more than once.`);
    }
    seenRoutes.add(route.route);
    seenEntries.add(entryName);
  }
  return routes;
}

export function kpReaderRouteEntryName(route: KpReaderRoutePath): string {
  return route.slice(1, -1).replaceAll("/", "-");
}

export function kpReaderRouteHtmlPath(route: KpReaderRoutePath): string {
  return `${route.slice(1)}index.html`;
}
