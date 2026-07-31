import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

import {
  kpBundleBudgetDeltaBytes,
  measureKpBundleClosureAttribution,
  type KpBundleFileAttribution
} from "./bundle-closure-attribution.ts";

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
  readonly runtimeFileAttribution: readonly KpBundleFileAttribution[];
}

export interface KpReaderRouteBudgetDeltas {
  readonly compiledHtmlRawBytes: number;
  readonly compiledHtmlGzipBytes: number;
  readonly runtimeCodeGzipBytes: number;
}

export interface KpReaderRouteBudgetIssue {
  readonly route: string;
  readonly metric: keyof KpReaderRouteBudgetProfile | "forbiddenRuntimeAsset";
  readonly measuredBytes: number;
  readonly allowedBytes: number;
  readonly baselineBytes: number;
  readonly deltaBytes: number;
  readonly message: string;
}

export interface KpReaderRouteBudgetInspection {
  readonly route: string;
  readonly measurement: KpReaderRouteBudgetMeasurement;
  readonly deltas: KpReaderRouteBudgetDeltas;
  readonly issues: readonly KpReaderRouteBudgetIssue[];
}

export interface KpReaderSharedRuntimeClosure {
  readonly routes: readonly Readonly<{
    route: string;
    deltaBytes: number;
  }>[];
  readonly runtimeCodeGzipBytes: number;
  readonly files: readonly KpBundleFileAttribution[];
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
    const allowedBytes = allowedKpReaderRouteBytes(baselineBytes);
    if (measuredBytes <= allowedBytes) continue;
    issues.push({
      route: input.route,
      metric,
      measuredBytes,
      allowedBytes,
      baselineBytes,
      deltaBytes: measuredBytes - allowedBytes,
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
      deltaBytes: 0,
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
  const runtime = await measureKpBundleClosureAttribution(
    input.distRoot,
    runtimeFiles
  );
  return {
    compiledHtmlRawBytes: html.byteLength,
    compiledHtmlGzipBytes: gzipSync(html).byteLength,
    runtimeCodeGzipBytes: runtime.gzipBytes,
    runtimeFiles: Object.freeze(runtime.files.map(({ file }) => file)),
    runtimeFileAttribution: runtime.files
  };
}

export function measureKpReaderRouteBudgetDeltas(input: {
  readonly budget: KpReaderRouteBudgetProfile;
  readonly measurement: KpReaderRouteBudgetMeasurement;
}): KpReaderRouteBudgetDeltas {
  return Object.freeze({
    compiledHtmlRawBytes: kpBundleBudgetDeltaBytes(
      input.measurement.compiledHtmlRawBytes,
      allowedKpReaderRouteBytes(input.budget.compiledHtmlRawBytes)
    ),
    compiledHtmlGzipBytes: kpBundleBudgetDeltaBytes(
      input.measurement.compiledHtmlGzipBytes,
      allowedKpReaderRouteBytes(input.budget.compiledHtmlGzipBytes)
    ),
    runtimeCodeGzipBytes: kpBundleBudgetDeltaBytes(
      input.measurement.runtimeCodeGzipBytes,
      allowedKpReaderRouteBytes(input.budget.runtimeCodeGzipBytes)
    )
  });
}

export async function inspectKpReaderRouteBudgets(
  distRoot = resolve("dist")
): Promise<readonly KpReaderRouteBudgetInspection[]> {
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
      deltas: measureKpReaderRouteBudgetDeltas({
        budget: descriptor.budget,
        measurement
      }),
      issues: checkKpReaderRouteBudget({
        route: descriptor.route,
        budget: descriptor.budget,
        measurement
      })
    };
  }));
}

export function groupKpReaderSharedRuntimeClosures(
  reports: readonly KpReaderRouteBudgetInspection[]
): readonly KpReaderSharedRuntimeClosure[] {
  const groups = new Map<string, {
    readonly runtimeCodeGzipBytes: number;
    readonly files: readonly KpBundleFileAttribution[];
    readonly routes: Array<{ route: string; deltaBytes: number }>;
  }>();
  for (const report of reports) {
    const fingerprint = report.measurement.runtimeFileAttribution
      .map(({ file, gzipBytes }) => `${file}:${gzipBytes}`)
      .join("\n");
    const group = groups.get(fingerprint) ?? {
      runtimeCodeGzipBytes: report.measurement.runtimeCodeGzipBytes,
      files: report.measurement.runtimeFileAttribution,
      routes: []
    };
    group.routes.push({
      route: report.route,
      deltaBytes: report.deltas.runtimeCodeGzipBytes
    });
    groups.set(fingerprint, group);
  }
  return Object.freeze([...groups.values()]
    .map((group) => Object.freeze({
      runtimeCodeGzipBytes: group.runtimeCodeGzipBytes,
      files: group.files,
      routes: Object.freeze(group.routes
        .sort((left, right) => left.route.localeCompare(right.route))
        .map((route) => Object.freeze(route)))
    }))
    .sort((left, right) =>
      (left.routes[0]?.route ?? "").localeCompare(right.routes[0]?.route ?? "")
    ));
}

function allowedKpReaderRouteBytes(baselineBytes: number): number {
  return Math.ceil(
    baselineBytes * (1 + kpReaderRouteBudgetGrowthPermille / 1_000)
  );
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
  console.log(JSON.stringify({
    growthLimit: "5%",
    routes: reports.map(({ route, measurement, deltas, issues: routeIssues }) => ({
      route,
      compiledHtmlRawBytes: measurement.compiledHtmlRawBytes,
      compiledHtmlGzipBytes: measurement.compiledHtmlGzipBytes,
      runtimeCodeGzipBytes: measurement.runtimeCodeGzipBytes,
      deltas,
      issues: routeIssues
    })),
    sharedRuntimeClosures: groupKpReaderSharedRuntimeClosures(reports)
  }, null, 2));
  if (issues.length > 0) {
    throw new Error(`Reader route budgets failed:\n${issues
      .map((issue) => issue.message)
      .join("\n")}`);
  }
}
