import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

import { measureKpBundleClosureAttribution } from
  "./bundle-closure-attribution.ts";

interface ManifestChunk {
  readonly file: string;
  readonly imports?: readonly string[] | undefined;
  readonly dynamicImports?: readonly string[] | undefined;
  readonly css?: readonly string[] | undefined;
}

type Manifest = Readonly<Record<string, ManifestChunk>>;

const entryKey = "learn/code/free-shipping/index.html";
const forbiddenClosureMarkers = [
  "animation-catalogue",
  "codemirror",
  "dev-review",
  "development-toolbar",
  "python-refactor",
  "scheme-factorial"
] as const;
const forbiddenContentMarkers = [
  "data-kp-dev-review-shell",
  "data-kp-dev-toolbar",
  "Review this moment",
  "Development tools",
  "CodeMirror"
] as const;

export const kpPublicTypeScriptBudgets = Object.freeze({
  htmlGzipBytes: 4_000,
  startupCodeAndCssGzipBytes: 24_000
});

export async function inspectKpPublicTypeScriptBudgets(
  distRoot = resolve("dist/public-typescript")
) {
  const manifest = JSON.parse(await readFile(
    resolve(distRoot, ".vite/manifest.json"),
    "utf8"
  )) as Manifest;
  const entry = manifest[entryKey];
  if (entry === undefined) {
    throw new Error("Production manifest lacks the public TypeScript lesson.");
  }
  const closureKeys = collectClosureKeys(manifest, entryKey);
  const files = collectClosureFiles(manifest, closureKeys);
  const closure = await measureKpBundleClosureAttribution(distRoot, files);
  const html = await readFile(resolve(distRoot, entryKey));
  const forbiddenKeys = closureKeys.filter((key) =>
    forbiddenClosureMarkers.some((marker) => key.includes(marker))
  );
  const forbiddenContent = await findForbiddenContent(distRoot, files);
  return Object.freeze({
    htmlGzipBytes: gzipSync(html).byteLength,
    startupCodeAndCssGzipBytes: closure.gzipBytes,
    startupFiles: closure.files,
    closureKeys,
    forbidden: Object.freeze([...forbiddenKeys, ...forbiddenContent])
  });
}

async function findForbiddenContent(
  distRoot: string,
  files: readonly string[]
): Promise<readonly string[]> {
  const findings = await Promise.all(files.map(async (file) => {
    const source = await readFile(resolve(distRoot, file), "utf8");
    return forbiddenContentMarkers
      .filter((marker) => source.includes(marker))
      .map((marker) => `${file} contains ${marker}`);
  }));
  return Object.freeze(findings.flat());
}

function collectClosureKeys(
  manifest: Manifest,
  root: string
): readonly string[] {
  const visited = new Set<string>();
  const queue = [root];
  while (queue.length > 0) {
    const key = queue.pop();
    if (key === undefined || visited.has(key)) continue;
    visited.add(key);
    const chunk = manifest[key];
    if (chunk === undefined) {
      throw new Error(`Production manifest lacks public closure key ${key}.`);
    }
    queue.push(...(chunk.imports ?? []), ...(chunk.dynamicImports ?? []));
  }
  return Object.freeze([...visited].sort());
}

function collectClosureFiles(
  manifest: Manifest,
  keys: readonly string[]
): readonly string[] {
  const files = new Set<string>();
  for (const key of keys) {
    const chunk = manifest[key]!;
    if ([".js", ".css"].includes(extname(chunk.file))) files.add(chunk.file);
    for (const css of chunk.css ?? []) files.add(css);
  }
  return Object.freeze([...files].sort());
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = await inspectKpPublicTypeScriptBudgets();
  console.info(JSON.stringify(report, null, 2));
  if (report.htmlGzipBytes > kpPublicTypeScriptBudgets.htmlGzipBytes) {
    throw new Error(
      `Public TypeScript HTML is ${report.htmlGzipBytes} gzip bytes; ` +
      `the ceiling is ${kpPublicTypeScriptBudgets.htmlGzipBytes}.`
    );
  }
  if (report.startupCodeAndCssGzipBytes >
      kpPublicTypeScriptBudgets.startupCodeAndCssGzipBytes) {
    throw new Error(
      `Public TypeScript startup is ${report.startupCodeAndCssGzipBytes} ` +
      `gzip bytes; the ceiling is ` +
      `${kpPublicTypeScriptBudgets.startupCodeAndCssGzipBytes}.`
    );
  }
  if (report.forbidden.length > 0) {
    throw new Error(`Public TypeScript closure imports forbidden systems:\n${
      report.forbidden.join("\n")
    }`);
  }
}
