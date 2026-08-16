import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { measureKpBundleClosureAttribution } from
  "./bundle-closure-attribution.ts";
import type {
  KpBundleExperienceBudget,
  KpBundleExperiencePhase,
  KpBundleExperienceScenario,
  KpBundleResourceKind
} from "./bundle-experience-scenario.ts";
import {
  findKpBundleBuildDeclaration,
  kpBundleExperienceScenarios
} from "./kp-bundle-experience-scenarios.ts";
import {
  collectKpViteManifestExperienceClosure,
  differenceKpViteManifestClosures,
  type KpViteManifest,
  type KpViteManifestResource
} from "./vite-manifest-closure.ts";

export interface KpBundleResourceMeasurement {
  readonly script: number;
  readonly style: number;
  readonly font: number;
  readonly asset: number;
  readonly total: number;
}

export interface KpBundleExperienceMeasurement {
  readonly id: KpBundleExperienceScenario["id"];
  readonly title: string;
  readonly buildId: KpBundleExperienceScenario["buildId"];
  readonly entry: KpBundleResourceMeasurement;
  readonly experience: KpBundleResourceMeasurement;
  readonly incremental?: KpBundleResourceMeasurement | undefined;
  readonly chunkKeys: readonly string[];
  readonly files: readonly {
    readonly file: string;
    readonly kind: Exclude<KpBundleResourceKind, "total">;
    readonly gzipBytes: number;
    readonly ownerSources: readonly string[];
  }[];
  readonly incrementalFiles?:
    KpBundleExperienceMeasurement["files"] | undefined;
  readonly activationAttributions: readonly {
    readonly id: string;
    readonly incremental: KpBundleResourceMeasurement;
    readonly chunkKeys: readonly string[];
    readonly files: KpBundleExperienceMeasurement["files"];
  }[];
  readonly ownerViolations: readonly string[];
  readonly budgetViolations: readonly string[];
}

export interface KpBundleExperienceMeasurementReport {
  readonly schemaVersion: "kp.bundle-experience-measurement.v1";
  readonly manifestSha256ByBuild: Readonly<Record<string, string>>;
  readonly scenarios: readonly KpBundleExperienceMeasurement[];
}

export interface KpBundleExperienceMeasurementSummary {
  readonly schemaVersion: "kp.bundle-experience-measurement-summary.v1";
  readonly manifestSha256ByBuild: Readonly<Record<string, string>>;
  readonly scenarios: readonly Omit<
    KpBundleExperienceMeasurement,
    "chunkKeys" | "files" | "incrementalFiles" | "activationAttributions"
  >[];
}

export async function measureKpBundleExperienceScenarios(input: {
  readonly scenarios: readonly KpBundleExperienceScenario[];
  readonly projectRoot?: string | undefined;
}): Promise<KpBundleExperienceMeasurementReport> {
  const projectRoot = input.projectRoot ?? process.cwd();
  const byBuild = new Map<string, {
    outputRoot: string;
    manifestSource: string;
    manifest: KpViteManifest;
  }>();
  for (const buildId of [...new Set(input.scenarios.map(({ buildId }) => buildId))]
    .sort()) {
    const build = findKpBundleBuildDeclaration(buildId);
    const outputRoot = resolve(projectRoot, build.outputRoot);
    const manifestSource = await readFile(
      resolve(outputRoot, ".vite/manifest.json"),
      "utf8"
    );
    byBuild.set(buildId, {
      outputRoot,
      manifestSource,
      manifest: JSON.parse(manifestSource) as KpViteManifest
    });
  }

  const closureByScenario = new Map<string, ReturnType<
    typeof collectKpViteManifestExperienceClosure
  >>();
  for (const scenario of input.scenarios) {
    const build = byBuild.get(scenario.buildId)!;
    closureByScenario.set(
      scenario.id,
      collectKpViteManifestExperienceClosure(build.manifest, scenario)
    );
  }

  const scenarios: KpBundleExperienceMeasurement[] = [];
  for (const scenario of input.scenarios) {
    const build = byBuild.get(scenario.buildId)!;
    const closure = closureByScenario.get(scenario.id)!;
    const comparison = scenario.comparisonBaseId === undefined
      ? undefined
      : requireComparison({ scenario, closureByScenario, input });
    const incremental = comparison === undefined
      ? undefined
      : differenceKpViteManifestClosures(
          closure.experience,
          comparison.experience
        );
    const [
      entry,
      experience,
      incrementalMeasurement,
      incrementalFiles,
      activationAttributions
    ] = await Promise.all([
      measureResources(build.outputRoot, closure.entry.resources),
      measureResources(build.outputRoot, closure.experience.resources),
      incremental === undefined
        ? Promise.resolve(undefined)
        : measureResources(build.outputRoot, incremental.resources),
      incremental === undefined
        ? Promise.resolve(undefined)
        : measureFiles(build.outputRoot, incremental.resources),
      Promise.all(closure.activations.map(async (activation) => {
        const [measurement, files] = await Promise.all([
          measureResources(
            build.outputRoot,
            activation.incremental.resources
          ),
          measureFiles(build.outputRoot, activation.incremental.resources)
        ]);
        return Object.freeze({
          id: activation.id,
          incremental: measurement,
          chunkKeys: activation.incremental.chunkKeys,
          files
        });
      }))
    ]);
    const files = await measureFiles(
      build.outputRoot,
      closure.experience.resources
    );
    const owners = new Set([
      ...closure.experience.chunkKeys,
      ...closure.experience.resources.flatMap(({ ownerSources }) => ownerSources)
    ]);
    const ownerViolations = [
      ...scenario.expectedOwners
        .filter((owner) => !owners.has(owner))
        .map((owner) => `missing expected owner ${owner}`),
      ...scenario.forbiddenOwners
        .filter((owner) => owners.has(owner))
        .map((owner) => `contains forbidden owner ${owner}`)
    ];
    const phases: Record<KpBundleExperiencePhase,
      KpBundleResourceMeasurement | undefined> = {
      entry,
      experience,
      incremental: incrementalMeasurement
    };
    const budgetViolations = scenario.budgets.flatMap((budget) =>
      inspectBudget(scenario, budget, phases[budget.phase])
    );
    scenarios.push(Object.freeze({
      id: scenario.id,
      title: scenario.title,
      buildId: scenario.buildId,
      entry,
      experience,
      ...(incrementalMeasurement === undefined
        ? {}
        : { incremental: incrementalMeasurement }),
      ...(incrementalFiles === undefined ? {} : { incrementalFiles }),
      activationAttributions: Object.freeze(activationAttributions),
      chunkKeys: closure.experience.chunkKeys,
      files,
      ownerViolations: Object.freeze(ownerViolations),
      budgetViolations: Object.freeze(budgetViolations)
    }));
  }

  return Object.freeze({
    schemaVersion: "kp.bundle-experience-measurement.v1" as const,
    manifestSha256ByBuild: Object.freeze(Object.fromEntries(
      [...byBuild.entries()].sort(([left], [right]) => left.localeCompare(right))
        .map(([id, { manifestSource }]) => [
          id,
          createHash("sha256").update(manifestSource).digest("hex")
        ])
    )),
    scenarios: Object.freeze(scenarios)
  });
}

export function summarizeKpBundleExperienceMeasurement(
  report: KpBundleExperienceMeasurementReport
): KpBundleExperienceMeasurementSummary {
  return Object.freeze({
    schemaVersion: "kp.bundle-experience-measurement-summary.v1" as const,
    manifestSha256ByBuild: report.manifestSha256ByBuild,
    scenarios: Object.freeze(report.scenarios.map(({
      chunkKeys: _chunkKeys,
      files: _files,
      incrementalFiles: _incrementalFiles,
      activationAttributions: _activationAttributions,
      ...scenario
    }) => Object.freeze(scenario)))
  });
}

function requireComparison(input: {
  readonly scenario: KpBundleExperienceScenario;
  readonly closureByScenario: ReadonlyMap<string, ReturnType<
    typeof collectKpViteManifestExperienceClosure
  >>;
  readonly input: {
    readonly scenarios: readonly KpBundleExperienceScenario[];
  };
}) {
  const baseId = input.scenario.comparisonBaseId!;
  const baseScenario = input.input.scenarios.find(({ id }) => id === baseId);
  if (baseScenario === undefined) {
    throw new Error(
      `Bundle scenario ${input.scenario.id} lacks comparison ${baseId}.`
    );
  }
  if (baseScenario.buildId !== input.scenario.buildId) {
    throw new Error(
      `Bundle scenario ${input.scenario.id} compares across build outputs.`
    );
  }
  const closure = input.closureByScenario.get(baseId);
  if (closure === undefined) throw new Error(`Unmeasured comparison ${baseId}.`);
  return closure;
}

async function measureResources(
  outputRoot: string,
  resources: readonly KpViteManifestResource[]
): Promise<KpBundleResourceMeasurement> {
  const files = await measureFiles(outputRoot, resources);
  const result: Record<KpBundleResourceKind, number> = {
    script: 0,
    style: 0,
    font: 0,
    asset: 0,
    total: 0
  };
  for (const file of files) {
    result[file.kind] += file.gzipBytes;
    result.total += file.gzipBytes;
  }
  return Object.freeze(result);
}

async function measureFiles(
  outputRoot: string,
  resources: readonly KpViteManifestResource[]
): Promise<KpBundleExperienceMeasurement["files"]> {
  const attribution = await measureKpBundleClosureAttribution(
    outputRoot,
    resources.map(({ file }) => file)
  );
  const byFile = new Map(attribution.files.map((file) => [file.file, file]));
  return Object.freeze(resources.map((resource) => Object.freeze({
    file: resource.file,
    kind: resource.kind,
    gzipBytes: byFile.get(resource.file)!.gzipBytes,
    ownerSources: resource.ownerSources
  })));
}

function inspectBudget(
  scenario: KpBundleExperienceScenario,
  budget: KpBundleExperienceBudget,
  measurement: KpBundleResourceMeasurement | undefined
): readonly string[] {
  if (measurement === undefined) {
    return [`${budget.phase}:${budget.resource} has no measurement`];
  }
  const actual = measurement[budget.resource];
  return actual <= budget.gzipBytes
    ? []
    : [
        `${scenario.id} ${budget.phase}:${budget.resource} is ${actual} ` +
        `gzip bytes; ceiling is ${budget.gzipBytes}`
      ];
}

function parseArguments(arguments_: readonly string[]): {
  readonly scenarios: readonly KpBundleExperienceScenario[];
  readonly check: boolean;
  readonly details: boolean;
  readonly output?: string | undefined;
} {
  const scenarioIds: string[] = [];
  const buildIds: string[] = [];
  let check = false;
  let details = false;
  let all = false;
  let output: string | undefined;
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index]!;
    if (argument === "--check") check = true;
    else if (argument === "--details") details = true;
    else if (argument === "--all") all = true;
    else if (argument === "--scenario") scenarioIds.push(arguments_[++index] ?? "");
    else if (argument === "--build") buildIds.push(arguments_[++index] ?? "");
    else if (argument === "--output") output = arguments_[++index];
    else throw new Error(`Unknown bundle measurement argument ${argument}.`);
  }
  if (all && (scenarioIds.length > 0 || buildIds.length > 0)) {
    throw new Error("--all cannot be combined with --scenario or --build.");
  }
  const selected = all
    ? kpBundleExperienceScenarios
    : kpBundleExperienceScenarios.filter((scenario) =>
        scenarioIds.includes(scenario.id) ||
        buildIds.includes(scenario.buildId) ||
        (scenarioIds.length === 0 && buildIds.length === 0 &&
          scenario.buildId === "bundle-build.main")
      );
  if (selected.length === 0) throw new Error("No bundle scenarios selected.");
  const withBases = includeKpBundleScenarioComparisonBases({
    selected,
    registry: kpBundleExperienceScenarios
  });
  return {
    scenarios: withBases,
    check,
    details,
    ...(output === undefined ? {} : { output })
  };
}

export function includeKpBundleScenarioComparisonBases(input: {
  readonly selected: readonly KpBundleExperienceScenario[];
  readonly registry: readonly KpBundleExperienceScenario[];
}): readonly KpBundleExperienceScenario[] {
  const includedIds = new Set(input.selected.map(({ id }) => id));
  const byId = new Map(input.registry.map((scenario) => [scenario.id, scenario]));
  const queue = [...input.selected];
  while (queue.length > 0) {
    const baseId = queue.pop()!.comparisonBaseId;
    if (baseId === undefined || includedIds.has(baseId)) continue;
    const base = byId.get(baseId);
    if (base === undefined) {
      throw new Error(`Bundle scenario registry lacks comparison ${baseId}.`);
    }
    includedIds.add(baseId);
    queue.push(base);
  }
  return Object.freeze(input.registry.filter(({ id }) => includedIds.has(id)));
}

async function run(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));
  const report = await measureKpBundleExperienceScenarios({
    scenarios: options.scenarios
  });
  const serialized = `${JSON.stringify(
    options.details ? report : summarizeKpBundleExperienceMeasurement(report),
    null,
    2
  )}\n`;
  const violations = report.scenarios.flatMap((scenario) => [
    ...scenario.ownerViolations,
    ...scenario.budgetViolations
  ]);
  if (options.check && violations.length > 0) {
    throw new Error(`Bundle experience checks failed:\n${violations.join("\n")}`);
  }
  if (options.output !== undefined) {
    await writeFile(resolve(options.output), serialized, "utf8");
  } else if (options.check && !options.details) {
    console.info(
      `Bundle experience checks passed (${report.scenarios.length} scenarios).`
    );
  } else {
    process.stdout.write(serialized);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await run();
}
