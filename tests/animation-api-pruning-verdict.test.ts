import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  deriveKpAnimationApiCallerLedger,
  kpAnimationApiCallerAuditTargets,
  type KpAnimationApiCallerSourceFile
} from "../src/architecture/animation-api-caller-ledger.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

test("pruning verdict retains every candidate that still owns a live contract", () => {
  const ledger = deriveKpAnimationApiCallerLedger([
    ...sourceFiles("src"),
    ...sourceFiles("tests"),
    ...sourceFiles("scripts")
  ]);
  const byId = new Map(ledger.map((entry) => [entry.id, entry]));

  assert.equal(
    kpAnimationApiCallerAuditTargets.some(({ disposition }) =>
      String(disposition).includes("candidate")
    ),
    false
  );
  assert.deepEqual(byId.get("metadata.animation-library-display")?.sourceCallers, [
    "src/editor/animation-library-display-catalog.ts"
  ]);
  assert.deepEqual(
    byId.get("ledger.semantic-animation-compatibility")?.scriptCallers,
    ["scripts/check-semantic-animation-boundaries.ts"]
  );
  assert.equal(
    existsSync(join(projectRoot, "src/animation/motifs/public-api.ts")),
    true
  );
});

test("display and search metadata remain non-interchangeable projections", () => {
  const display = JSON.parse(readFileSync(
    join(projectRoot, "src/editor/animation-library-display-catalog.generated.json"),
    "utf8"
  )) as Array<Record<string, unknown>>;
  const search = JSON.parse(readFileSync(
    join(projectRoot, "src/editor/animation-library-metadata.generated.json"),
    "utf8"
  )) as Array<Record<string, unknown>>;

  assert.ok(display.length > 0);
  assert.ok(search.length > 0);
  assert.ok(display.every((entry) =>
    "representations" in entry &&
    "availability" in entry &&
    "canonicalFormat" in entry
  ));
  assert.ok(search.every((entry) =>
    "controlKinds" in entry &&
    "durationMs" in entry &&
    "promotion" in entry
  ));
  assert.ok(display.some((entry) => !("controlKinds" in entry)));
  assert.ok(search.some((entry) => !("representations" in entry)));
});

function sourceFiles(relativeDirectory: string): KpAnimationApiCallerSourceFile[] {
  const absoluteDirectory = join(projectRoot, relativeDirectory);
  return readdirSync(absoluteDirectory, {
    recursive: true,
    withFileTypes: true
  })
    .filter((entry) =>
      entry.isFile() && /\.(?:ts|json)$/.test(entry.name)
    )
    .map((entry) => {
      const relativePath = join(
        relativeDirectory,
        entry.parentPath.slice(absoluteDirectory.length + 1),
        entry.name
      ).replaceAll("\\", "/");
      return {
        path: relativePath,
        source: readFileSync(join(projectRoot, relativePath), "utf8")
      };
    });
}
