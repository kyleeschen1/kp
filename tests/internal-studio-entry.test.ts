import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  findKpApplicationEntryOwner
} from "../src/architecture/kp-application-entry-ownership.ts";

test("Internal Studio owns one dedicated route shell and production config", () => {
  const owner = findKpApplicationEntryOwner("entry-owner.internal-studio");
  assert.equal(owner.currentBoundary, "dedicated-production-graph");
  assert.deepEqual(owner.entryModules, [
    "src/internal-studio/internal-studio-entry.ts"
  ]);
  assert.deepEqual(owner.hostDocuments, ["studio/index.html"]);
  assert.deepEqual(owner.currentBuildConfigs, [
    "vite.internal-studio.config.ts"
  ]);
  const html = readFileSync("studio/index.html", "utf8");
  assert.match(html, /src\/internal-studio\/internal-studio-entry\.ts/);
  assert.doesNotMatch(html, /src\/(?:bootstrap|main)\.ts/);
});

test("Studio entry selects only Studio surfaces and excludes product routes", () => {
  const source = readFileSync(
    "src/internal-studio/internal-studio-entry.ts",
    "utf8"
  );
  assert.match(source, /svelte-catalogue-exemplar-entry\.ts/);
  assert.match(source, /import\("\.\.\/main\.ts"\)/);
  assert.doesNotMatch(source, /public-web|tutorial\/|content\/public-api/);
  const config = readFileSync("vite.internal-studio.config.ts", "utf8");
  assert.match(config, /outDir: "dist\/internal-studio"/);
  assert.match(config, /input: \{ internalStudio: routeFilename \}/);
  assert.doesNotMatch(config, /public-web|readerBuildRoutes|kpDevelopmentBuildEntries/);
});
