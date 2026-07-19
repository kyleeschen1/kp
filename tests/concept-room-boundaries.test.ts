import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  kpConceptRoomBoundaries,
  type KpConceptRoomBoundaryId
} from "../src/architecture/concept-room-boundaries.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

test("concept-room boundaries expose one narrow public entrypoint each", async () => {
  const ids = new Set<KpConceptRoomBoundaryId>();
  const entrypoints = new Set<string>();

  for (const boundary of kpConceptRoomBoundaries) {
    assert.ok(!ids.has(boundary.id), `duplicate boundary ${boundary.id}`);
    assert.ok(!entrypoints.has(boundary.publicEntryPoint), `duplicate entrypoint ${boundary.publicEntryPoint}`);
    ids.add(boundary.id);
    entrypoints.add(boundary.publicEntryPoint);
    assert.ok(existsSync(join(projectRoot, boundary.root)), `${boundary.id} root is missing`);
    assert.ok(
      existsSync(join(projectRoot, boundary.publicEntryPoint)),
      `${boundary.id} public entrypoint is missing`
    );
  }

  for (const boundary of kpConceptRoomBoundaries) {
    const allowedImports = boundary.mayImport as readonly KpConceptRoomBoundaryId[];
    assert.ok(!allowedImports.includes(boundary.id), `${boundary.id} cannot import itself`);
    for (const dependency of allowedImports) {
      assert.ok(ids.has(dependency), `${boundary.id} names unknown dependency ${dependency}`);
    }
  }

  const modules = await Promise.all([
    import("../protocols/public-api.ts"),
    import("../domains/public-api.ts"),
    import("../src/kernel/public-api.ts"),
    import("../src/authoring/public-api.ts"),
    import("../src/integrations/public-api.ts"),
    import("../src/projections/public-api.ts"),
    import("../src/app-adapters/public-api.ts")
  ]);
  assert.equal(modules.length, kpConceptRoomBoundaries.length);
});

test("concept-room dependency declarations are acyclic", () => {
  const dependencies = new Map(
    kpConceptRoomBoundaries.map((boundary) => [boundary.id, boundary.mayImport])
  );
  const visiting = new Set<KpConceptRoomBoundaryId>();
  const visited = new Set<KpConceptRoomBoundaryId>();

  function visit(id: KpConceptRoomBoundaryId): void {
    if (visited.has(id)) return;
    assert.ok(!visiting.has(id), `dependency cycle reaches ${id}`);
    visiting.add(id);
    for (const dependency of dependencies.get(id) ?? []) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  }

  for (const boundary of kpConceptRoomBoundaries) visit(boundary.id);
});
