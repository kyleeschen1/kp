import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { kpCanonicalEquationRendererConvergence as policy } from "../src/architecture/canonical-equation-renderer-convergence.ts";

// Read the owning policy rather than creating another baseline. Report every
// counted file so moving implementation between partitions cannot hide cost.
const partitions = [
  { name: "core", paths: policy.productionSourceFiles,
    byteLimit: policy.maximumProductionSourceBytes, moduleLimit: policy.maximumProductionModules },
  { name: "planner", paths: policy.productionScenePlanBoundarySourceFiles,
    byteLimit: policy.maximumProductionScenePlanBoundarySourceBytes, moduleLimit: policy.maximumProductionScenePlanBoundaryModules },
  { name: "renderer-support", paths: policy.productionRendererSupportSourceFiles,
    byteLimit: policy.maximumProductionRendererSupportSourceBytes, moduleLimit: policy.maximumProductionRendererSupportModules }
] as const;
const allPaths = partitions.flatMap(partition => [...partition.paths]);
assert.equal(new Set(allPaths).size, allPaths.length, "Partitions must not double count a source file.");
const sizes = new Map(await Promise.all(allPaths.map(async path =>
  [path, (await readFile(path)).byteLength] as const)));
const cohorts = [...partitions, {
  name: "direct-dependencies", paths: policy.productionDirectDependencySourceFiles,
  byteLimit: policy.maximumProductionDirectDependencySourceBytes,
  moduleLimit: policy.maximumProductionDirectDependencyModules
}, {
  name: "aggregate", paths: allPaths,
  byteLimit: policy.maximumProductionAggregateSourceBytes,
  moduleLimit: policy.maximumProductionAggregateModules
}];
const measurements = cohorts.map(cohort => {
  const files = cohort.paths.map(path => {
    const bytes = sizes.get(path);
    assert.notEqual(bytes, undefined, `Unaccounted direct dependency: ${path}`);
    return { path, bytes: bytes! };
  });
  const bytes = files.reduce((sum, file) => sum + file.bytes, 0);
  return { name: cohort.name, modules: files.length, moduleLimit: cohort.moduleLimit,
    bytes, byteLimit: cohort.byteLimit, headroom: cohort.byteLimit - bytes, files };
});
console.log(JSON.stringify({ authority: "existing-canonical-renderer-source-policy", measurements }, null, 2));
for (const measurement of measurements) {
  assert.ok(measurement.modules <= measurement.moduleLimit, `${measurement.name} module limit exceeded.`);
  assert.ok(measurement.headroom >= 0, `${measurement.name} source budget exceeded by ${-measurement.headroom} bytes.`);
}
