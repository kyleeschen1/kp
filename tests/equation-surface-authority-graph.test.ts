import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import generatedGraph from
  "../src/architecture/equation-surface-authority-graph.generated.json" with {
    type: "json"
  };
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  compileKpEquationSurfaceAuthorityGraph,
  createKpEquationSurfaceAuthorityGraph,
  KpEquationSurfaceAuthorityGraphError
} from "../src/architecture/equation-surface-authority-graph.ts";
import {
  createKpEquationSurfaceInventory
} from "../src/architecture/equation-surface-inventory.ts";

test("generated authority graph owns all 28 equation surfaces", () => {
  const graph = createKpEquationSurfaceAuthorityGraph();

  assert.deepEqual(generatedGraph, graph);
  assert.equal(graph.rows.length, 28);
  assert.equal(
    graph.rows.filter(({ pathClass }) =>
      pathClass === "generic-semantic-equation"
    ).length,
    23
  );
  assert.equal(
    graph.rows.filter(({ pathClass }) =>
      pathClass === "operation-evaluation-specialized"
    ).length,
    3
  );
  assert.equal(
    graph.rows.every((row) =>
      row.compilerNodeIds.length > 0 &&
      row.registryNodeIds.length > 0 &&
      row.motifNodeIds.length > 0 &&
      row.localTimingNodeIds.length > 0 &&
      row.rendererInferenceNodeIds.length > 0 &&
      row.fallbackNodeIds.length > 0 &&
      row.directSamplerNodeIds.length > 0 &&
      row.privateClockAuthority === "none" &&
      row.cssAnimationAuthority === "none"
    ),
    true
  );
});

test("every authority node reaches its named source declaration", async () => {
  const graph = createKpEquationSurfaceAuthorityGraph();

  await Promise.all(graph.nodes.map(async (node) => {
    const source = await readFile(
      new URL(`../${node.sourcePath}`, import.meta.url),
      "utf8"
    );
    assert.equal(
      source.includes(node.sourceNeedle),
      true,
      `${node.id} cannot reach ${node.sourcePath}#${node.sourceNeedle}`
    );
  }));
});

test("authority graph rejects missing and duplicate production owners", () => {
  const inventory = createKpEquationSurfaceInventory();
  const assets = createKpAnimationAssets();
  const missingId = inventory.entries[0]!.animationId;

  assert.throws(
    () => compileKpEquationSurfaceAuthorityGraph({
      inventory,
      assets: assets.filter(({ id }) => id !== missingId)
    }),
    (error: unknown) =>
      error instanceof KpEquationSurfaceAuthorityGraphError &&
      error.diagnostics.some((message) =>
        message.includes(`Missing authority asset ${missingId}`)
      )
  );

  assert.throws(
    () => compileKpEquationSurfaceAuthorityGraph({
      inventory,
      assets: [...assets, assets[0]!]
    }),
    (error: unknown) =>
      error instanceof KpEquationSurfaceAuthorityGraphError &&
      error.diagnostics.some((message) =>
        message.includes("Duplicate animation asset id")
      )
  );
});
