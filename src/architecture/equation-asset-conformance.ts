import {
  checkKpAnimationAssetSeekRewindLaw,
  sampleKpAnimationAssetPhase,
  validateKpAnimationAsset,
  type KpAnimationAsset
} from "../animation/asset.ts";
import {
  kpAnimationCatalogPackId,
  kpAnimationCatalogPackSourcePath,
  loadKpAnimationAsset,
  type KpLoadedAnimationAsset
} from "../animation/catalog-loader.ts";
import type {
  KpEquationAssetManifest,
  KpEquationAssetManifestEntry
} from "./equation-asset-manifest.ts";

export const kpEquationConformanceLawIds = Object.freeze([
  "invariant",
  "composition",
  "clock",
  "accessibility",
  "lazy-capability",
  "inventory"
] as const);

export type KpEquationConformanceLawId =
  typeof kpEquationConformanceLawIds[number];

export interface KpEquationAssetConformanceResult {
  readonly assetId: string;
  readonly lawId: KpEquationConformanceLawId;
  readonly passed: boolean;
  readonly diagnostics: readonly string[];
}

export interface KpEquationAssetConformanceReport {
  readonly schemaVersion: "kp.equation-asset-conformance.v1";
  readonly kind: "equation-asset-conformance-report";
  readonly passed: boolean;
  readonly assetCount: number;
  readonly checkCount: number;
  readonly lazyLoadCount: number;
  readonly results: readonly KpEquationAssetConformanceResult[];
  readonly diagnostics: readonly string[];
}

export interface KpEquationAssetConformanceBudget {
  readonly maximumAssets: number;
  readonly lawsPerAsset: number;
}

export const kpEquationAssetConformanceBudget = Object.freeze({
  maximumAssets: 128,
  lawsPerAsset: kpEquationConformanceLawIds.length
} satisfies KpEquationAssetConformanceBudget);

export class KpEquationAssetConformanceError extends Error {
  override readonly name = "KpEquationAssetConformanceError";
  readonly report: KpEquationAssetConformanceReport;

  constructor(report: KpEquationAssetConformanceReport) {
    super(report.diagnostics.join("\n"));
    this.report = report;
  }
}

export async function assertKpEquationAssetConformance(input: {
  readonly manifest: KpEquationAssetManifest;
  readonly assets: readonly KpAnimationAsset[];
  readonly loadAsset?: (assetId: string) => Promise<KpLoadedAnimationAsset>;
  readonly budget?: KpEquationAssetConformanceBudget;
}): Promise<KpEquationAssetConformanceReport> {
  const report = await inspectKpEquationAssetConformance(input);
  if (!report.passed) throw new KpEquationAssetConformanceError(report);
  return report;
}

export async function inspectKpEquationAssetConformance(input: {
  readonly manifest: KpEquationAssetManifest;
  readonly assets: readonly KpAnimationAsset[];
  readonly loadAsset?: (assetId: string) => Promise<KpLoadedAnimationAsset>;
  readonly budget?: KpEquationAssetConformanceBudget;
}): Promise<KpEquationAssetConformanceReport> {
  const budget = input.budget ?? kpEquationAssetConformanceBudget;
  const diagnostics: string[] = [];
  if (input.manifest.entries.length > budget.maximumAssets) {
    diagnostics.push(
      `Manifest has ${input.manifest.entries.length} assets; conformance budget allows ${budget.maximumAssets}.`
    );
  }
  if (budget.lawsPerAsset !== kpEquationConformanceLawIds.length) {
    diagnostics.push("Conformance budget must cover every canonical law once.");
  }
  uniqueById(
    input.manifest.entries,
    ({ assetId }) => assetId,
    "manifest",
    diagnostics
  );
  const assetById = uniqueById(
    input.assets,
    ({ id }) => id,
    "asset",
    diagnostics
  );
  const loadAsset = input.loadAsset ?? loadKpAnimationAsset;
  const results: KpEquationAssetConformanceResult[] = [];
  let lazyLoadCount = 0;
  for (const entry of input.manifest.entries) {
    const asset = assetById.get(entry.assetId);
    if (asset === undefined) {
      diagnostics.push(`Manifest asset ${entry.assetId} is absent from the catalogue.`);
      for (const lawId of kpEquationConformanceLawIds) {
        results.push(result(entry.assetId, lawId, ["Missing catalogue asset."]));
      }
      continue;
    }
    results.push(result(entry.assetId, "invariant", invariantIssues(entry, asset)));
    results.push(result(entry.assetId, "composition", compositionIssues(asset)));
    results.push(result(entry.assetId, "clock", clockIssues(entry, asset)));
    results.push(result(
      entry.assetId,
      "accessibility",
      accessibilityIssues(entry)
    ));
    const lazyIssues: string[] = [];
    try {
      lazyIssues.push(...lazyCapabilityIssues(entry));
      lazyLoadCount += 1;
      const loaded = await loadAsset(entry.assetId);
      if (loaded.animation.id !== entry.assetId) {
        lazyIssues.push(`Lazy loader returned ${loaded.animation.id}.`);
      }
      if (loaded.packId !== entry.lazyLoader.packId) {
        lazyIssues.push(`Lazy loader returned pack ${loaded.packId}.`);
      }
    } catch (error: unknown) {
      lazyIssues.push(
        `Lazy loader failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    results.push(result(entry.assetId, "lazy-capability", lazyIssues));
    results.push(result(entry.assetId, "inventory", inventoryIssues(entry, asset)));
  }
  for (const failed of results.filter(({ passed }) => !passed)) {
    diagnostics.push(...failed.diagnostics.map((message) =>
      `${failed.assetId} [${failed.lawId}]: ${message}`
    ));
  }
  return Object.freeze({
    schemaVersion: "kp.equation-asset-conformance.v1" as const,
    kind: "equation-asset-conformance-report" as const,
    passed: diagnostics.length === 0,
    assetCount: input.manifest.entries.length,
    checkCount: results.length,
    lazyLoadCount,
    results: Object.freeze(results),
    diagnostics: Object.freeze(diagnostics)
  });
}

function invariantIssues(
  entry: KpEquationAssetManifestEntry,
  asset: KpAnimationAsset
): readonly string[] {
  return [
    ...validateKpAnimationAsset(asset).map(({ path, message }) =>
      `${path}: ${message}`
    ),
    ...(entry.staticTruth.semanticEndpointFingerprints.length === 0
      ? ["Static endpoint fingerprints are empty."]
      : []),
    ...(asset.transformations.length === 0
      ? ["Asset has no semantic transformations."]
      : [])
  ];
}

function compositionIssues(asset: KpAnimationAsset): readonly string[] {
  const law = checkKpAnimationAssetSeekRewindLaw(asset);
  return law.failures.map(({ path, message }) => `${path}: ${message}`);
}

function clockIssues(
  entry: KpEquationAssetManifestEntry,
  asset: KpAnimationAsset
): readonly string[] {
  const issues: string[] = [];
  if (asset.timeline === undefined) {
    issues.push("Asset has no shared timeline.");
    return issues;
  }
  const equationTargets = asset.renderTargets.filter(({ kind }) =>
    kind === "equation"
  );
  if (equationTargets.length === 0) {
    issues.push("Asset has no equation render target.");
  }
  for (const target of equationTargets) {
    if (target.timelineId !== asset.timeline.id) {
      issues.push(`Render target ${target.id} does not use the shared timeline.`);
    }
  }
  for (const progress of [0, 0.5, 1]) {
    const forward = sampleKpAnimationAssetPhase(asset, {
      direction: "forward",
      progress
    });
    const rewind = sampleKpAnimationAssetPhase(asset, {
      direction: "rewind",
      progress: 1 - progress
    });
    if (forward.progress !== progress || rewind.progress !== 1 - progress) {
      issues.push(`Clock sampling changed requested progress ${progress}.`);
    }
  }
  if (entry.staticTruth.route.selectionParameter !== "artifact") {
    issues.push("Direct-seek route does not use the artifact parameter.");
  }
  return issues;
}

function accessibilityIssues(
  entry: KpEquationAssetManifestEntry
): readonly string[] {
  const truth = entry.accessibilityTruth as {
    readonly playerLabel?: string;
    readonly mathSemantics?: string;
    readonly reducedMotionAttribute?: string;
    readonly reducedMotionValue?: string;
  };
  return [
    ...(truth.playerLabel === "descriptor-title-animation-player"
      ? [] : ["Player label contract is invalid."]),
    ...(truth.mathSemantics === "katex-mathml" ||
      truth.mathSemantics === "semantic-stage-aria-label"
      ? [] : ["Math semantics contract is invalid."]),
    ...(truth.reducedMotionAttribute ===
      "data-kp-editor-animation-accessibility-mode" &&
      truth.reducedMotionValue === "reduced-motion"
      ? [] : ["Reduced-motion contract is invalid."])
  ];
}

function lazyCapabilityIssues(
  entry: KpEquationAssetManifestEntry
): readonly string[] {
  const expectedPack = kpAnimationCatalogPackId(entry.assetId);
  const expectedPath = kpAnimationCatalogPackSourcePath(expectedPack);
  return [
    ...(entry.lazyLoader.packId === expectedPack
      ? [] : [`Manifest pack ${entry.lazyLoader.packId} should be ${expectedPack}.`]),
    ...(entry.lazyLoader.packSourcePath === expectedPath
      ? [] : [`Manifest pack source ${entry.lazyLoader.packSourcePath} should be ${expectedPath}.`])
  ];
}

function inventoryIssues(
  entry: KpEquationAssetManifestEntry,
  asset: KpAnimationAsset
): readonly string[] {
  const issues: string[] = [];
  const manifestTransformations = [...entry.semanticSource.transformationIds].sort();
  const assetTransformations = asset.transformations.map(({ id }) => id).sort();
  if (manifestTransformations.join("\n") !== assetTransformations.join("\n")) {
    issues.push("Manifest transformation inventory differs from the asset.");
  }
  const expectedRoute = `/?artifact=${encodeURIComponent(entry.assetId)}`;
  if (entry.staticTruth.route.href !== expectedRoute) {
    issues.push(`Manifest route should be ${expectedRoute}.`);
  }
  if (!entry.capabilities.renderTargetKinds.includes("equation")) {
    issues.push("Manifest does not declare an equation render target.");
  }
  return issues;
}

function result(
  assetId: string,
  lawId: KpEquationConformanceLawId,
  diagnostics: readonly string[]
): KpEquationAssetConformanceResult {
  return Object.freeze({
    assetId,
    lawId,
    passed: diagnostics.length === 0,
    diagnostics: Object.freeze([...diagnostics])
  });
}

function uniqueById<T>(
  values: readonly T[],
  identify: (value: T) => string,
  label: string,
  diagnostics: string[]
): ReadonlyMap<string, T> {
  const result = new Map<string, T>();
  for (const value of values) {
    const id = identify(value);
    if (result.has(id)) diagnostics.push(`Duplicate ${label} id ${id}.`);
    else result.set(id, value);
  }
  return result;
}
