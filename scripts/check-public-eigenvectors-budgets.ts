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
  readonly assets?: readonly string[] | undefined;
}

type Manifest = Readonly<Record<string, ManifestChunk>>;

const entryKey = "learn/math/eigenvectors/index.html";
const forbiddenMarkers = [
  "animation-catalogue",
  "codemirror",
  "dev-review",
  "economics-demand",
  "graph3d",
  "svelte",
  "three.module"
] as const;
const forbiddenRuntimeCalls = [
  "setinterval(",
  'addeventlistener("scroll"',
  "addeventlistener('scroll'"
] as const;

export const kpPublicEigenvectorBudgets = Object.freeze({
  htmlGzipBytes: 6_000,
  clientJavaScriptGzipBytes: 12_000,
  clientCssGzipBytes: 12_000,
  startupCodeAndCssGzipBytes: 24_000,
  declaredFontAssetBytes: 1_500_000
});

export interface KpPublicEigenvectorBudgetReport {
  readonly htmlGzipBytes: number;
  readonly clientJavaScriptGzipBytes: number;
  readonly clientCssGzipBytes: number;
  readonly startupCodeAndCssGzipBytes: number;
  readonly startupFiles: readonly KpBundleFileAttribution[];
  readonly declaredFontAssetBytes: number;
  readonly declaredFontAssetCount: number;
  readonly dynamicImportCount: number;
  readonly forbidden: readonly string[];
}

export async function inspectKpPublicEigenvectorBudgets(
  distRoot = resolve("dist/public-eigenvectors")
): Promise<KpPublicEigenvectorBudgetReport> {
  const manifest = JSON.parse(await readFile(
    resolve(distRoot, ".vite/manifest.json"),
    "utf8"
  )) as Manifest;
  const entry = manifest[entryKey];
  if (entry === undefined) {
    throw new Error("Production manifest lacks the eigenvector entry.");
  }
  const closureFiles = collectClosureFiles(manifest, entryKey);
  const closure = await measureKpBundleClosureAttribution(
    distRoot,
    closureFiles
  );
  const html = await readFile(resolve(distRoot, entryKey));
  const fontAssets = (entry.assets ?? []).filter((file) =>
    [".woff2", ".woff", ".ttf"].includes(extname(file))
  );
  const fontBuffers = await Promise.all(fontAssets.map((file) =>
    readFile(resolve(distRoot, file))
  ));
  const jsFiles = closure.files.filter(({ file }) => extname(file) === ".js");
  const cssFiles = closure.files.filter(({ file }) => extname(file) === ".css");
  return Object.freeze({
    htmlGzipBytes: gzipSync(html).byteLength,
    clientJavaScriptGzipBytes: totalGzip(jsFiles),
    clientCssGzipBytes: totalGzip(cssFiles),
    startupCodeAndCssGzipBytes: closure.gzipBytes,
    startupFiles: closure.files,
    // KaTeX's stock CSS declares a broad deploy-time font catalogue. Browsers
    // fetch only the faces exercised by this page; report both scopes so that
    // storage growth is not mistaken for startup transfer.
    declaredFontAssetBytes: fontBuffers.reduce(
      (total, buffer) => total + buffer.byteLength,
      0
    ),
    declaredFontAssetCount: fontAssets.length,
    dynamicImportCount: entry.dynamicImports?.length ?? 0,
    forbidden: await findForbidden(distRoot, manifest, jsFiles)
  });
}

function collectClosureFiles(
  manifest: Manifest,
  root: string
): readonly string[] {
  const files = new Set<string>();
  const visited = new Set<string>();
  const queue = [root];
  while (queue.length > 0) {
    const key = queue.pop();
    if (key === undefined || visited.has(key)) continue;
    visited.add(key);
    const chunk = manifest[key];
    if (chunk === undefined) {
      throw new Error(`Production manifest lacks eigenvector closure key ${key}.`);
    }
    if ([".js", ".css"].includes(extname(chunk.file))) files.add(chunk.file);
    for (const css of chunk.css ?? []) files.add(css);
    queue.push(...(chunk.imports ?? []));
  }
  return Object.freeze([...files].sort());
}

async function findForbidden(
  distRoot: string,
  manifest: Manifest,
  jsFiles: readonly KpBundleFileAttribution[]
): Promise<readonly string[]> {
  const findings = Object.keys(manifest).flatMap((key) =>
    forbiddenMarkers.filter((marker) => key.toLowerCase().includes(marker))
      .map((marker) => `manifest key ${key} contains ${marker}`)
  );
  for (const { file } of jsFiles) {
    const source = (await readFile(resolve(distRoot, file), "utf8"))
      .toLowerCase();
    for (const marker of forbiddenMarkers) {
      if (source.includes(marker)) findings.push(`${file} contains ${marker}`);
    }
    for (const call of forbiddenRuntimeCalls) {
      if (source.includes(call)) findings.push(`${file} contains ${call}`);
    }
  }
  return Object.freeze(findings.sort());
}

function totalGzip(files: readonly KpBundleFileAttribution[]): number {
  return files.reduce((total, { gzipBytes }) => total + gzipBytes, 0);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = await inspectKpPublicEigenvectorBudgets();
  console.log(JSON.stringify(report, null, 2));
  for (const metric of [
    "htmlGzipBytes",
    "clientJavaScriptGzipBytes",
    "clientCssGzipBytes",
    "startupCodeAndCssGzipBytes",
    "declaredFontAssetBytes"
  ] as const) {
    const ceiling = kpPublicEigenvectorBudgets[metric];
    if (report[metric] <= ceiling) continue;
    throw new Error(
      `Eigenvector ${metric} is ${report[metric]} bytes; ceiling is ${ceiling}.`
    );
  }
  if (report.dynamicImportCount !== 0) {
    throw new Error("Eigenvector startup unexpectedly gained dynamic imports.");
  }
  if (report.forbidden.length > 0) {
    throw new Error(`Eigenvector closure imports forbidden systems:\n${
      report.forbidden.join("\n")
    }`);
  }
}
