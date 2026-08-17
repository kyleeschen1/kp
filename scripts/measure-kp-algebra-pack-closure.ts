import { pathToFileURL } from "node:url";

import {
  attributeKpAlgebraPackClosure
} from "./kp-algebra-pack-closure-attribution.ts";
import {
  kpBundleExperienceScenarios
} from "./kp-bundle-experience-scenarios.ts";
import {
  includeKpBundleScenarioComparisonBases,
  measureKpBundleExperienceScenarios
} from "./measure-kp-bundle-experiences.ts";

const SCENARIO_ID = "bundle-experience.catalogue.solve-x";

export async function measureKpAlgebraPackClosure(): Promise<
  ReturnType<typeof attributeKpAlgebraPackClosure>
> {
  const selected = kpBundleExperienceScenarios.filter(
    ({ id }) => id === SCENARIO_ID
  );
  if (selected.length !== 1) {
    throw new Error(`Expected exactly one ${SCENARIO_ID} scenario.`);
  }
  const report = await measureKpBundleExperienceScenarios({
    scenarios: includeKpBundleScenarioComparisonBases({
      selected,
      registry: kpBundleExperienceScenarios
    })
  });
  const scenario = report.scenarios.find(({ id }) => id === SCENARIO_ID);
  const activation = scenario?.activationAttributions.find(
    ({ id }) => id === "load-domain-pack"
  );
  if (scenario === undefined || activation === undefined) {
    throw new Error(`${SCENARIO_ID} lacks load-domain-pack attribution.`);
  }
  return attributeKpAlgebraPackClosure({
    scenarioId: scenario.id,
    files: activation.files
  });
}

async function run(): Promise<void> {
  const report = await measureKpAlgebraPackClosure();
  const details = process.argv.slice(2).includes("--details");
  process.stdout.write(`${JSON.stringify(details ? report : {
    schemaVersion: report.schemaVersion,
    scenarioId: report.scenarioId,
    activationId: report.activationId,
    gzipBytes: report.gzipBytes,
    owners: report.owners.map(({ owner, gzipBytes, permille, files }) => ({
      owner,
      gzipBytes,
      permille,
      fileCount: files.length,
      largestFiles: [...files]
        .sort((left, right) => right.gzipBytes - left.gzipBytes)
        .slice(0, 5)
        .map(({ file, gzipBytes, ownerSources }) => ({
          file,
          gzipBytes,
          ownerSources
        }))
    }))
  }, null, 2)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await run();
}
