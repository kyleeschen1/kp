import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

import {
  measureKpBundleClosureAttribution,
  type KpBundleFileAttribution
} from "./bundle-closure-attribution.ts";
import {
  groupKpReaderSharedRuntimeClosures,
  inspectKpReaderRouteBudgets
} from "./check-reader-route-budgets.ts";

interface ManifestChunk {
  readonly file: string;
  readonly imports?: readonly string[] | undefined;
  readonly dynamicImports?: readonly string[] | undefined;
  readonly css?: readonly string[] | undefined;
}

type Manifest = Readonly<Record<string, ManifestChunk>>;

const algebraEntry = "tutorials/algebra/fraction-composition/index.html";
const algebraHtml = "tutorials/algebra/fraction-composition/index.html";
const commonReaderBaselineGzipBytes = 124_778;
const commonReaderCeilingGzipBytes = 145_000;
const algebraBaseline = Object.freeze({
  htmlGzipBytes: 4_434,
  startupCodeAndCssGzipBytes: 36_219,
  activationIncrementGzipBytes: 274_397,
  activeCodeAndCssGzipBytes: 310_616
});
const authoringMarkers = [
  "@codemirror",
  "codemirror-vim",
  "kpArticleSourceEditor",
  "/api/dev/article-sources/algebra-fraction-composition",
  "algebra-fraction-composition.kp.md"
] as const;

export interface KpAlgebraFractionCompositionBudgetReport {
  readonly commonReaderRuntimeGzipBytes: number;
  readonly commonReaderBaselineDeltaGzipBytes: number;
  readonly commonReaderCeilingGzipBytes: number;
  readonly commonReaderRoutes: readonly string[];
  readonly htmlGzipBytes: number;
  readonly startupCodeAndCssGzipBytes: number;
  readonly startupFiles: readonly KpBundleFileAttribution[];
  readonly activationIncrementGzipBytes: number;
  readonly activationFiles: readonly KpBundleFileAttribution[];
  readonly activeCodeAndCssGzipBytes: number;
  readonly authoringLeakage: readonly string[];
}

export async function inspectKpAlgebraFractionCompositionBudgets(
  distRoot = resolve("dist")
): Promise<KpAlgebraFractionCompositionBudgetReport> {
  const manifest = JSON.parse(await readFile(
    resolve(distRoot, ".vite/manifest.json"),
    "utf8"
  )) as Manifest;
  const entry = manifest[algebraEntry];
  if (entry === undefined) {
    throw new Error("Production manifest lacks the algebra article entry.");
  }
  const startupFiles = collectClosureFiles(manifest, [algebraEntry]);
  const activationFiles = collectClosureFiles(
    manifest,
    entry.dynamicImports ?? []
  ).filter((file) => !startupFiles.includes(file));
  const [startup, activation, readerReports, html, authoringLeakage] =
    await Promise.all([
      measureKpBundleClosureAttribution(distRoot, startupFiles),
      measureKpBundleClosureAttribution(distRoot, activationFiles),
      inspectKpReaderRouteBudgets(distRoot),
      readFile(resolve(distRoot, algebraHtml)),
      findAuthoringLeakage(distRoot)
    ]);
  const commonReader = groupKpReaderSharedRuntimeClosures(readerReports)
    .find(({ routes }) => routes.length === 10);
  if (commonReader === undefined) {
    throw new Error("The ten-route common reader closure could not be identified.");
  }
  return Object.freeze({
    commonReaderRuntimeGzipBytes: commonReader.runtimeCodeGzipBytes,
    commonReaderBaselineDeltaGzipBytes:
      commonReader.runtimeCodeGzipBytes - commonReaderBaselineGzipBytes,
    commonReaderCeilingGzipBytes,
    commonReaderRoutes: Object.freeze(commonReader.routes.map(({ route }) => route)),
    htmlGzipBytes: gzipSync(html).byteLength,
    startupCodeAndCssGzipBytes: startup.gzipBytes,
    startupFiles: startup.files,
    activationIncrementGzipBytes: activation.gzipBytes,
    activationFiles: activation.files,
    activeCodeAndCssGzipBytes: startup.gzipBytes + activation.gzipBytes,
    authoringLeakage
  });
}

function collectClosureFiles(
  manifest: Manifest,
  roots: readonly string[]
): readonly string[] {
  const files = new Set<string>();
  const visited = new Set<string>();
  const queue = [...roots];
  while (queue.length > 0) {
    const key = queue.pop();
    if (key === undefined || visited.has(key)) continue;
    visited.add(key);
    const chunk = manifest[key];
    if (chunk === undefined) {
      throw new Error(`Production manifest lacks algebra closure key ${key}.`);
    }
    if ([".js", ".css"].includes(extname(chunk.file))) files.add(chunk.file);
    for (const css of chunk.css ?? []) files.add(css);
    queue.push(...(chunk.imports ?? []));
  }
  return Object.freeze([...files].sort());
}

async function findAuthoringLeakage(root: string): Promise<readonly string[]> {
  const files = await collectFiles(root);
  const leakage: string[] = [];
  for (const file of files) {
    if (![".html", ".js", ".css", ".json"].includes(extname(file))) continue;
    const source = await readFile(file, "utf8");
    for (const marker of authoringMarkers) {
      if (source.includes(marker)) {
        leakage.push(`${relative(root, file)} contains ${marker}`);
      }
    }
  }
  return Object.freeze(leakage.sort());
}

async function collectFiles(root: string): Promise<readonly string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? collectFiles(path) : [path];
  }))).flat();
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = await inspectKpAlgebraFractionCompositionBudgets();
  console.log(JSON.stringify(report, null, 2));
  if (report.commonReaderRuntimeGzipBytes > commonReaderCeilingGzipBytes) {
    throw new Error(
      `Common reader closure is ${report.commonReaderRuntimeGzipBytes} gzip bytes; ` +
      `the established ceiling is ${commonReaderCeilingGzipBytes}.`
    );
  }
  assertWithinGrowthAllowance(report, "htmlGzipBytes");
  assertWithinGrowthAllowance(report, "startupCodeAndCssGzipBytes");
  assertWithinGrowthAllowance(report, "activationIncrementGzipBytes");
  assertWithinGrowthAllowance(report, "activeCodeAndCssGzipBytes");
  if (report.authoringLeakage.length > 0) {
    throw new Error(`Algebra authoring leaked into production:\n${
      report.authoringLeakage.join("\n")
    }`);
  }
}

function assertWithinGrowthAllowance(
  report: KpAlgebraFractionCompositionBudgetReport,
  metric: keyof typeof algebraBaseline
): void {
  const baseline = algebraBaseline[metric];
  const ceiling = Math.ceil(baseline * 1.05);
  if (report[metric] <= ceiling) return;
  throw new Error(
    `Algebra ${metric} is ${report[metric]} gzip bytes; ` +
    `the release baseline is ${baseline} and the 5% ceiling is ${ceiling}.`
  );
}
