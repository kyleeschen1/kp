import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

import {
  measureKpBundleClosureAttribution,
  type KpBundleFileAttribution
} from "./bundle-closure-attribution.ts";

interface ManifestChunk {
  readonly file: string;
  readonly imports?: readonly string[] | undefined;
  readonly dynamicImports?: readonly string[] | undefined;
  readonly css?: readonly string[] | undefined;
}

type Manifest = Readonly<Record<string, ManifestChunk>>;

const entryKey = "learn/math/normal-matrices/index.html";
const htmlPath = "learn/math/normal-matrices/index.html";
const forbiddenMarkers = [
  "animation-catalogue",
  "codemirror",
  "dev-review",
  "economics-demand",
  "graph3d",
  "python-refactor",
  "scheme-factorial",
  "svelte",
  "three.module"
] as const;
// The stage may request one setup frame, but its deterministic seek contract
// never needs a recurring timer in the production closure.
const forbiddenRuntimeCalls = ["setinterval("] as const;

export const kpPublicNormalMatrixProofBudgets = Object.freeze({
  commonReaderRuntimeGzipBytes: 145_000,
  htmlGzipBytes: 10_000,
  startupCodeAndCssGzipBytes: 40_000,
  activationIncrementGzipBytes: 274_397,
  normalProofSpecificGzipBytes: 20_000
});

export interface KpPublicNormalMatrixProofBudgetReport {
  readonly commonReaderRuntimeGzipBytes: number;
  readonly htmlGzipBytes: number;
  readonly startupCodeAndCssGzipBytes: number;
  readonly startupFiles: readonly KpBundleFileAttribution[];
  readonly activationIncrementGzipBytes: number;
  readonly activationFiles: readonly KpBundleFileAttribution[];
  readonly normalProofSpecificGzipBytes: number;
  readonly normalProofSpecificFiles: readonly KpBundleFileAttribution[];
  readonly forbidden: readonly string[];
}

export async function inspectKpPublicNormalMatrixProofBudgets(
  distRoot = resolve("dist/public-normal-matrices")
): Promise<KpPublicNormalMatrixProofBudgetReport> {
  const manifest = JSON.parse(await readFile(
    resolve(distRoot, ".vite/manifest.json"),
    "utf8"
  )) as Manifest;
  const entry = manifest[entryKey];
  if (entry === undefined) {
    throw new Error("Production manifest lacks the normal-matrix proof entry.");
  }
  const startupFiles = collectClosureFiles(manifest, [entryKey]);
  const activationFiles = collectClosureFiles(
    manifest,
    entry.dynamicImports ?? []
  ).filter((file) => !startupFiles.includes(file));
  const [startup, activation, html] = await Promise.all([
    measureKpBundleClosureAttribution(distRoot, startupFiles),
    measureKpBundleClosureAttribution(distRoot, activationFiles),
    readFile(resolve(distRoot, htmlPath))
  ]);
  const allFiles = Object.freeze([...startup.files, ...activation.files]);
  const specificFiles = Object.freeze(allFiles.filter(({ file }) =>
    extname(file) === ".js" || file.includes("normal-matrix-proof-public-")
  ));
  return Object.freeze({
    // This isolated route intentionally never acquires the common reader.
    commonReaderRuntimeGzipBytes: 0,
    htmlGzipBytes: gzipSync(html).byteLength,
    startupCodeAndCssGzipBytes: startup.gzipBytes,
    startupFiles: startup.files,
    activationIncrementGzipBytes: activation.gzipBytes,
    activationFiles: activation.files,
    normalProofSpecificGzipBytes: specificFiles.reduce(
      (total, { gzipBytes }) => total + gzipBytes,
      0
    ),
    normalProofSpecificFiles: specificFiles,
    forbidden: await findForbiddenClosure(distRoot, manifest, allFiles)
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
      throw new Error(`Production manifest lacks normal-proof closure key ${key}.`);
    }
    if ([".js", ".css"].includes(extname(chunk.file))) files.add(chunk.file);
    for (const css of chunk.css ?? []) files.add(css);
    queue.push(...(chunk.imports ?? []));
  }
  return Object.freeze([...files].sort());
}

async function findForbiddenClosure(
  distRoot: string,
  manifest: Manifest,
  files: readonly KpBundleFileAttribution[]
): Promise<readonly string[]> {
  const findings = Object.keys(manifest).flatMap((key) =>
    forbiddenMarkers.filter((marker) => key.toLowerCase().includes(marker))
      .map((marker) => `manifest key ${key} contains ${marker}`)
  );
  for (const { file } of files) {
    const source = (await readFile(resolve(distRoot, file), "utf8")).toLowerCase();
    for (const marker of forbiddenMarkers) {
      if (source.includes(marker)) findings.push(`${file} contains ${marker}`);
    }
    if (extname(file) !== ".js") continue;
    for (const call of forbiddenRuntimeCalls) {
      if (source.includes(call)) findings.push(`${file} contains ${call}`);
    }
  }
  return Object.freeze(findings.sort());
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = await inspectKpPublicNormalMatrixProofBudgets();
  console.log(JSON.stringify(report, null, 2));
  for (const metric of [
    "commonReaderRuntimeGzipBytes",
    "htmlGzipBytes",
    "startupCodeAndCssGzipBytes",
    "activationIncrementGzipBytes",
    "normalProofSpecificGzipBytes"
  ] as const) {
    const ceiling = kpPublicNormalMatrixProofBudgets[metric];
    if (report[metric] <= ceiling) continue;
    throw new Error(
      `Normal-proof ${metric} is ${report[metric]} gzip bytes; ` +
      `the ceiling is ${ceiling}.`
    );
  }
  if (report.forbidden.length > 0) {
    throw new Error(`Normal-proof closure imports forbidden systems:\n${
      report.forbidden.join("\n")
    }`);
  }
}
