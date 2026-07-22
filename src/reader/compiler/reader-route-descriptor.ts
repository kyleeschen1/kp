import type { KpCompiledLessonArtifact } from "../document/public-api.ts";

export type KpReaderRoutePath = `/reader/${string}/`;
export type KpReaderLessonSourcePath = `content/lessons/${string}.md`;

export interface KpReaderRouteDescriptor {
  readonly route: KpReaderRoutePath;
  readonly sourcePath: KpReaderLessonSourcePath;
  readonly compile: (markdown: string) => KpCompiledLessonArtifact;
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
