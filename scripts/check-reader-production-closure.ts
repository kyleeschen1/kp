import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  kpReaderRouteHtmlPath,
  type KpReaderRouteDescriptor
} from "../src/reader/compiler/reader-route-descriptor.ts";
import { kpReaderRouteManifest } from "../src/reader/compiler/reader-route-manifest.ts";

export interface KpReaderProductionArtifact {
  readonly path: string;
  readonly source: string;
}

export interface KpReaderProductionClosureIssue {
  readonly code:
    | "reader-production.missing-route"
    | "reader-production.undeclared-route"
    | "reader-production.compiler-leak";
  readonly message: string;
  readonly path: string;
}

const compilerMarkers = [
  "reader-route-manifest",
  "compileKpReaderPageShell",
  "parseKpMarkdownAst",
  "content/lessons/"
] as const;

/**
 * The build manifest is authoritative in both directions: every declared page
 * must ship, and every shipped reader page must have passed through a descriptor.
 */
export function checkKpReaderProductionClosure(input: {
  readonly routes: readonly Pick<KpReaderRouteDescriptor, "route">[];
  readonly artifacts: readonly KpReaderProductionArtifact[];
}): readonly KpReaderProductionClosureIssue[] {
  const expected = new Set(input.routes.map(({ route }) => kpReaderRouteHtmlPath(route)));
  const actual = new Set(input.artifacts
    .map((artifact) => artifact.path)
    .filter((path) => path.startsWith("reader/") && path.endsWith("/index.html")));
  const issues: KpReaderProductionClosureIssue[] = [];

  for (const path of expected) {
    if (actual.has(path)) continue;
    issues.push({
      code: "reader-production.missing-route",
      message: `Declared reader route did not produce ${path}.`,
      path
    });
  }
  for (const path of actual) {
    if (expected.has(path)) continue;
    issues.push({
      code: "reader-production.undeclared-route",
      message: `Production contains reader page ${path} without a route descriptor.`,
      path
    });
  }
  for (const artifact of input.artifacts) {
    for (const marker of compilerMarkers) {
      if (!artifact.source.includes(marker)) continue;
      issues.push({
        code: "reader-production.compiler-leak",
        message: `Production artifact ${artifact.path} contains build-only marker ${marker}.`,
        path: artifact.path
      });
    }
  }
  return issues;
}

export async function inspectKpReaderProductionClosure(
  distRoot = resolve("dist")
): Promise<readonly KpReaderProductionClosureIssue[]> {
  const paths = await collectFiles(distRoot);
  const artifacts = await Promise.all(paths
    .filter((path) => [".html", ".js", ".css", ".map"].includes(extname(path)))
    .map(async (path) => ({
      path: relative(distRoot, path).replaceAll("\\", "/"),
      source: await readFile(path, "utf8")
    })));
  return checkKpReaderProductionClosure({ routes: kpReaderRouteManifest, artifacts });
}

async function collectFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? collectFiles(path) : [path];
  }));
  return files.flat();
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const issues = await inspectKpReaderProductionClosure();
  if (issues.length > 0) {
    throw new Error(`Reader production closure failed:\n${issues
      .map((issue) => issue.message)
      .join("\n")}`);
  }
  console.log(
    `reader production closure passed (${kpReaderRouteManifest.length} manifest routes)`
  );
}
