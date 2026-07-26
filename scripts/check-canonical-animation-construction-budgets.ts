import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

import {
  projectKpGovernedCanonicalConstructionCohort,
  auditKpGovernedCanonicalProjectionBundle,
  serializeKpGovernedCanonicalProjectionBundle
} from "../src/authoring/governed-canonical-construction-projections.ts";
import {
  createKpGovernedCanonicalConstructionCohort
} from "../src/authoring/governed-canonical-construction-cohort.ts";
import {
  createKpGovernedCanonicalCompoundConstruction,
  sampleKpGovernedCanonicalCompoundConstruction
} from "../src/authoring/governed-canonical-compound-construction.ts";
import {
  validateKpCanonicalAnimationConstruction
} from "../src/authoring/canonical-animation-construction.ts";
import {
  inspectKpReaderRouteBudgets
} from "./check-reader-route-budgets.ts";

interface ViteManifestChunk {
  readonly file: string;
  readonly imports?: readonly string[] | undefined;
  readonly css?: readonly string[] | undefined;
}

type ViteManifest = Readonly<Record<string, ViteManifestChunk>>;

export interface KpCanonicalAnimationConstructionBudget {
  readonly constructionP95Ms: number;
  readonly verificationP95Ms: number;
  readonly compoundSampleP95Ms: number;
  readonly projectionBytes: number;
  readonly reviewEntryGzipBytes: number;
  readonly reviewClosureGzipBytes: number;
  readonly reviewAndGlyphClosureGzipBytes: number;
  readonly reviewClosureFiles: number;
}

export interface KpCanonicalAnimationConstructionBudgetMeasurement
  extends KpCanonicalAnimationConstructionBudget {
  readonly reviewFiles: readonly string[];
  readonly ordinaryReaderLeakFiles: readonly string[];
}

export interface KpCanonicalAnimationConstructionBudgetIssue {
  readonly metric:
    | keyof KpCanonicalAnimationConstructionBudget
    | "ordinaryReaderLeakFiles";
  readonly measured: number;
  readonly maximum: number;
  readonly message: string;
}

/**
 * These ceilings are the first frozen baseline for the governed cohort. They
 * leave machine-noise headroom while remaining far below user-visible frame,
 * payload, and optional-route costs.
 */
export const kpCanonicalAnimationConstructionBudget = Object.freeze({
  constructionP95Ms: 50,
  verificationP95Ms: 10,
  compoundSampleP95Ms: 0.1,
  projectionBytes: 48_000,
  reviewEntryGzipBytes: 4_000,
  reviewClosureGzipBytes: 80_000,
  // The isolated review iframe executes the existing full KaTeX experiment.
  // Its measured 236,565-byte closure is not shipped by any reader route.
  reviewAndGlyphClosureGzipBytes: 250_000,
  reviewClosureFiles: 32
} satisfies KpCanonicalAnimationConstructionBudget);

export function checkKpCanonicalAnimationConstructionBudget(input: {
  readonly budget: KpCanonicalAnimationConstructionBudget;
  readonly measurement: KpCanonicalAnimationConstructionBudgetMeasurement;
}): readonly KpCanonicalAnimationConstructionBudgetIssue[] {
  const issues: KpCanonicalAnimationConstructionBudgetIssue[] = [];
  for (const metric of Object.keys(input.budget) as (
    keyof KpCanonicalAnimationConstructionBudget
  )[]) {
    const measured = input.measurement[metric];
    const maximum = input.budget[metric];
    if (measured <= maximum) continue;
    issues.push({
      metric,
      measured,
      maximum,
      message: `${metric} measured ${measured}; frozen maximum is ${maximum}.`
    });
  }
  if (input.measurement.ordinaryReaderLeakFiles.length > 0) {
    issues.push({
      metric: "ordinaryReaderLeakFiles",
      measured: input.measurement.ordinaryReaderLeakFiles.length,
      maximum: 0,
      message:
        "Ordinary reader closures imported review-only canonical construction " +
        input.measurement.ordinaryReaderLeakFiles.join(", ")
    });
  }
  return Object.freeze(issues);
}

export async function measureKpCanonicalAnimationConstructionBudget(
  distRoot = resolve("dist")
): Promise<KpCanonicalAnimationConstructionBudgetMeasurement> {
  for (let index = 0; index < 5; index += 1) {
    createKpGovernedCanonicalConstructionCohort();
    projectKpGovernedCanonicalConstructionCohort();
  }
  const constructionP95Ms = measureP95(
    30,
    () => createKpGovernedCanonicalConstructionCohort()
  );
  const bundle = projectKpGovernedCanonicalConstructionCohort();
  const verificationP95Ms = measureP95(50, () => {
    bundle.artifacts.forEach((artifact) => {
      if (validateKpCanonicalAnimationConstruction(artifact).length > 0) {
        throw new Error(`Canonical artifact ${artifact.id} failed validation.`);
      }
    });
    if (auditKpGovernedCanonicalProjectionBundle(bundle).length > 0) {
      throw new Error("Canonical projection bundle failed runtime-state audit.");
    }
  });
  const compound = createKpGovernedCanonicalCompoundConstruction({
    includeDrillDown: false
  });
  const compoundSampleP95Ms = measureBatchedP95(50, 100, (index) => {
    sampleKpGovernedCanonicalCompoundConstruction(
      compound,
      (index % 101) / 100
    );
  });
  const projectionBytes = Buffer.byteLength(
    serializeKpGovernedCanonicalProjectionBundle(bundle)
  );
  const manifest = JSON.parse(
    await readFile(resolve(distRoot, ".vite/manifest.json"), "utf8")
  ) as ViteManifest;
  const reviewFiles = collectEntryClosure(
    manifest,
    "canonical-animation-review.html"
  );
  const glyphFiles = collectEntryClosure(
    manifest,
    "glyph-reconciliation-experiment.html"
  );
  const reviewAndGlyphFiles = [...new Set([...reviewFiles, ...glyphFiles])];
  const reviewEntry = manifest["canonical-animation-review.html"];
  if (reviewEntry === undefined) {
    throw new Error("Production manifest lacks canonical animation review.");
  }
  const readerReports = await inspectKpReaderRouteBudgets(distRoot);
  const ordinaryReaderLeakFiles = readerReports.flatMap(({ measurement }) =>
    measurement.runtimeFiles.filter((file) =>
      /canonicalAnimationReview|governed-canonical-construction/i.test(file)
    )
  );
  return Object.freeze({
    constructionP95Ms,
    verificationP95Ms,
    compoundSampleP95Ms,
    projectionBytes,
    reviewEntryGzipBytes: await gzipFileBytes(distRoot, reviewEntry.file),
    reviewClosureGzipBytes: await gzipFilesBytes(distRoot, reviewFiles),
    reviewAndGlyphClosureGzipBytes:
      await gzipFilesBytes(distRoot, reviewAndGlyphFiles),
    reviewClosureFiles: reviewFiles.length,
    reviewFiles: Object.freeze(reviewFiles),
    ordinaryReaderLeakFiles: Object.freeze([...new Set(ordinaryReaderLeakFiles)])
  });
}

function measureP95(
  iterations: number,
  operation: () => unknown
): number {
  const samples = Array.from({ length: iterations }, () => {
    const startedAt = performance.now();
    operation();
    return performance.now() - startedAt;
  });
  return percentile(samples, 0.95);
}

function measureBatchedP95(
  batches: number,
  iterations: number,
  operation: (index: number) => unknown
): number {
  const samples = Array.from({ length: batches }, (_, batch) => {
    const startedAt = performance.now();
    for (let index = 0; index < iterations; index += 1) {
      operation(batch * iterations + index);
    }
    return (performance.now() - startedAt) / iterations;
  });
  return percentile(samples, 0.95);
}

function percentile(values: readonly number[], quantile: number): number {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.min(
    ordered.length - 1,
    Math.ceil(ordered.length * quantile) - 1
  )] ?? 0;
}

function collectEntryClosure(
  manifest: ViteManifest,
  entryKey: string
): readonly string[] {
  const visited = new Set<string>();
  const files = new Set<string>();
  const visit = (key: string): void => {
    if (visited.has(key)) return;
    visited.add(key);
    const chunk = manifest[key];
    if (chunk === undefined) throw new Error(`Manifest lacks ${key}.`);
    files.add(chunk.file);
    chunk.css?.forEach((file) => files.add(file));
    chunk.imports?.forEach(visit);
  };
  visit(entryKey);
  return [...files]
    .filter((file) => [".js", ".css"].includes(extname(file)))
    .sort();
}

async function gzipFileBytes(distRoot: string, file: string): Promise<number> {
  return gzipSync(await readFile(resolve(distRoot, file)), { level: 9 }).byteLength;
}

async function gzipFilesBytes(
  distRoot: string,
  files: readonly string[]
): Promise<number> {
  return (await Promise.all(files.map((file) =>
    gzipFileBytes(distRoot, file)
  ))).reduce((total, bytes) => total + bytes, 0);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const measurement = await measureKpCanonicalAnimationConstructionBudget();
  const issues = checkKpCanonicalAnimationConstructionBudget({
    budget: kpCanonicalAnimationConstructionBudget,
    measurement
  });
  console.log(JSON.stringify({
    budget: kpCanonicalAnimationConstructionBudget,
    measurement,
    status: issues.length === 0 ? "passed" : "failed"
  }, null, 2));
  if (issues.length > 0) {
    throw new Error(issues.map(({ message }) => message).join("\n"));
  }
}
