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

export interface KpReaderRouteDescriptor {
  readonly route: KpReaderRoutePath;
  readonly sourcePath: KpReaderLessonSourcePath;
  readonly compile: (markdown: string) => KpCompiledLessonArtifact;
  readonly conformance: KpReaderRouteConformanceProfile;
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
