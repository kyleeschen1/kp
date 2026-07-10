import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { headlessKernelBoundaryConformanceEntries } from "../src/architecture/headless-kernel-boundaries.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

test("headless kernel boundary catalogue covers KP renderer-neutral and adapter seams", () => {
  const entries = headlessKernelBoundaryConformanceEntries();
  const ids = new Set(entries.map((entry) => entry.id));

  assert.ok(entries.length >= 5);
  assert.equal(ids.size, entries.length);
  assert.ok(entries.filter((entry) => entry.rendererNeutral).length >= 3);
  assert.ok(entries.some((entry) => entry.role === "surface-adapter" && !entry.rendererNeutral));

  for (const entry of entries) {
    assert.ok(entry.rationale.length >= 40, `${entry.id} should explain why the seam exists`);

    for (const path of [...entry.sourceFiles, ...entry.testFiles]) {
      assert.ok(existsSync(join(projectRoot, path)), `${entry.id} lists missing file ${path}`);
    }
  }
});
