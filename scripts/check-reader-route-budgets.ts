import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

import {
  isKpSemanticReaderForbiddenAsset
} from "../src/architecture/semantic-reader-route-budget.ts";

import {
  kpReaderRouteHtmlPath,
  type KpReaderRouteBudgetProfile,
  type KpReaderRouteDescriptor
} from "../src/reader/compiler/reader-route-descriptor.ts";
import { kpReaderRouteManifest } from "../src/reader/compiler/reader-route-manifest.ts";

interface ViteManifestChunk {
  readonly file: string;
  readonly imports?: readonly string[] | undefined;
  readonly css?: readonly string[] | undefined;
}

type ViteManifest = Readonly<Record<string, ViteManifestChunk>>;

export interface KpReaderRouteBudgetMeasurement {
  readonly compiledHtmlRawBytes: number;
  readonly compiledHtmlGzipBytes: number;
  readonly runtimeCodeGzipBytes: number;
  readonly runtimeFiles: readonly string[];
}

export interface KpReaderRouteBudgetIssue {
  readonly route: string;
  readonly metric: keyof KpReaderRouteBudgetProfile | "forbiddenRuntimeAsset";
  readonly measuredBytes: number;
  readonly allowedBytes: number;
  readonly baselineBytes: number;
  readonly message: string;
}

export const kpReaderRouteBudgetGrowthPermille = 50;

export function checkKpReaderRouteBudget(input: {
  readonly route: string;
  readonly budget: KpReaderRouteBudgetProfile;
  readonly measurement: KpReaderRouteBudgetMeasurement;
}): readonly KpReaderRouteBudgetIssue[] {
  const issues: KpReaderRouteBudgetIssue[] = [];
  for (const metric of [
    "compiledHtmlRawBytes",
    "compiledHtmlGzipBytes",
    "runtimeCodeGzipBytes"
  ] as const) {
    const baselineBytes = input.budget[metric];
    const measuredBytes = input.measurement[metric];
    const allowedBytes = Math.ceil(
      baselineBytes * (1 + kpReaderRouteBudgetGrowthPermille / 1_000)
    );
    if (measuredBytes <= allowedBytes) continue;
    issues.push({
      route: input.route,
      metric,
      measuredBytes,
      allowedBytes,
      baselineBytes,
      message:
        `${input.route} ${metric} is ${measuredBytes} bytes; ` +
        `the approved baseline is ${baselineBytes} and the 5% limit is ${allowedBytes}.`
    });
  }
  for (const path of input.measurement.runtimeFiles) {
    if (!isKpSemanticReaderForbiddenAsset(path)) continue;
    issues.push({
      route: input.route,
      metric: "forbiddenRuntimeAsset",
      measuredBytes: 0,
      allowedBytes: 0,
      baselineBytes: 0,
      message: `${input.route} runtime closure contains forbidden learner asset ${path}.`
    });
  }
  return issues;
}

export async function measureKpReaderRouteBudget(input: {
  readonly distRoot: string;
  readonly descriptor: KpReaderRouteDescriptor;
  readonly viteManifest: ViteManifest;
}): Promise<KpReaderRouteBudgetMeasurement> {
  const htmlPath = kpReaderRouteHtmlPath(input.descriptor.route);
  const html = await readFile(resolve(input.distRoot, htmlPath));
  const runtimeFiles = collectRuntimeCodeFiles(html.toString("utf8"), input.viteManifest);
  const runtimeBytes = await Promise.all(runtimeFiles.map((file) =>
    readFile(resolve(input.distRoot, file))
  ));
  return {
    compiledHtmlRawBytes: html.byteLength,
    compiledHtmlGzipBytes: gzipSync(html).byteLength,
    runtimeCodeGzipBytes: runtimeBytes.reduce(
      (total, source) => total + gzipSync(source).byteLength,
      0
    ),
    runtimeFiles
  };
}

export async function inspectKpReaderRouteBudgets(
  distRoot = resolve("dist")
): Promise<readonly {
  readonly route: string;
  readonly measurement: KpReaderRouteBudgetMeasurement;
  readonly issues: readonly KpReaderRouteBudgetIssue[];
}[]> {
  const viteManifest = JSON.parse(await readFile(
    resolve(distRoot, ".vite/manifest.json"),
    "utf8"
  )) as ViteManifest;
  return Promise.all(kpReaderRouteManifest.map(async (descriptor) => {
    const measurement = await measureKpReaderRouteBudget({
      distRoot,
      descriptor,
      viteManifest
    });
    return {
      route: descriptor.route,
      measurement,
      issues: checkKpReaderRouteBudget({
        route: descriptor.route,
        budget: descriptor.budget,
        measurement
      })
    };
  }));
}

function collectRuntimeCodeFiles(
  html: string,
  viteManifest: ViteManifest
): readonly string[] {
  const byFile = new Map(
    Object.entries(viteManifest).map(([key, chunk]) => [chunk.file, { key, chunk }] as const)
  );
  const files = new Set<string>([...html.matchAll(
    /(?:src|href)="\/?(assets\/[^"]+\.(?:js|css))"/g
  )].map((match) => match[1] ?? "").filter(Boolean));
  const queue = [...files];
  while (queue.length > 0) {
    const file = queue.pop();
    if (file === undefined) break;
    const record = byFile.get(file)?.chunk;
    for (const importKey of record?.imports ?? []) {
      const imported = viteManifest[importKey];
      if (imported === undefined || files.has(imported.file)) continue;
      files.add(imported.file);
      queue.push(imported.file);
    }
    for (const css of record?.css ?? []) files.add(css);
  }
  return [...files]
    .filter((file) => extname(file) === ".js" || extname(file) === ".css")
    .sort();
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const reports = await inspectKpReaderRouteBudgets();
  const issues = reports.flatMap((report) => report.issues);
  if (issues.length > 0) {
    throw new Error(`Reader route budgets failed:\n${issues
      .map((issue) => issue.message)
      .join("\n")}`);
  }
  console.log(JSON.stringify({
    growthLimit: "5%",
    routes: reports.map(({ route, measurement }) => ({ route, ...measurement }))
  }, null, 2));
}
