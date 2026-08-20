import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export interface KpNativeKatexConformanceProductionArtifact {
  readonly path: string;
  readonly source: string;
}

export interface KpNativeKatexConformanceProductionIssue {
  readonly code: "native-katex-conformance.production-leak";
  readonly path: string;
  readonly marker: string;
  readonly message: string;
}

const testOnlyMarkers = Object.freeze([
  "native-katex-compositor-conformance-manifest",
  "native-katex-compositor-continuity-assessment",
  "native-katex-compositor-diagnostic-report",
  "native-katex-compositor-seam-trace",
  "native-katex-conformance-compound-risk-fixture",
  "native-katex-conformance-context-mutation-registry",
  "native-katex-conformance-matrix-fixture",
  "native-katex-conformance-shape-registry"
]);

export function checkKpNativeKatexConformanceProductionArtifacts(
  artifacts: readonly KpNativeKatexConformanceProductionArtifact[]
): readonly KpNativeKatexConformanceProductionIssue[] {
  return Object.freeze(artifacts.flatMap((artifact) =>
    testOnlyMarkers.flatMap((marker) => artifact.source.includes(marker)
      ? [Object.freeze({
          code: "native-katex-conformance.production-leak" as const,
          path: artifact.path,
          marker,
          message:
            `Production artifact ${artifact.path} contains test-only ${marker}.`
        })]
      : [])
  ));
}

export async function inspectKpNativeKatexConformanceProductionClosure(input: {
  readonly sourceRoot?: string | undefined;
  readonly distRoot?: string | undefined;
} = {}): Promise<readonly KpNativeKatexConformanceProductionIssue[]> {
  const roots = [
    input.sourceRoot ?? resolve("src"),
    input.distRoot ?? resolve("dist")
  ];
  const artifacts = (await Promise.all(roots.map(async (root) => {
    const paths = await collectFiles(root);
    return Promise.all(paths
      .filter((path) => [".ts", ".svelte", ".html", ".js", ".css", ".map"]
        .includes(extname(path)))
      .map(async (path) => ({
        path: `${relative(resolve(), root)}/${relative(root, path)}`
          .replaceAll("\\", "/"),
        source: await readFile(path, "utf8")
      })));
  }))).flat();
  return checkKpNativeKatexConformanceProductionArtifacts(artifacts);
}

async function collectFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? collectFiles(path) : [path];
  }));
  return nested.flat();
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const issues = await inspectKpNativeKatexConformanceProductionClosure();
  if (issues.length > 0) {
    throw new Error(`Native KaTeX conformance entered production:\n${issues
      .map(({ message }) => message)
      .join("\n")}`);
  }
  console.log(
    `native KaTeX compositor conformance production closure passed (${testOnlyMarkers.length} forbidden markers)`
  );
}
