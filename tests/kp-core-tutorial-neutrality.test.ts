import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { collectKpTypescriptImportGraph } from
  "../scripts/typescript-import-extractor.ts";
import { kpDependencyDirectionExceptions } from
  "../src/architecture/kp-dependency-direction-exceptions.ts";
import { resolveKpModuleOwnershipZone } from
  "../src/architecture/kp-module-ownership.ts";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));

test("neutral core has no source or runtime dependency on tutorial composition", () => {
  const graph = collectKpTypescriptImportGraph(repositoryRoot);
  const coreToTutorial = graph.localEdges.filter(
    ({ importer, target }) =>
      resolveKpModuleOwnershipZone(importer)?.id === "neutral-core" &&
      target.startsWith("src/tutorial/")
  );
  const maskedTutorialEdges = kpDependencyDirectionExceptions.filter(
    ({ importer, target }) =>
      resolveKpModuleOwnershipZone(importer)?.id === "neutral-core" &&
      target.startsWith("src/tutorial/")
  );

  assert.deepEqual(coreToTutorial, []);
  assert.deepEqual(maskedTutorialEdges, []);
});
