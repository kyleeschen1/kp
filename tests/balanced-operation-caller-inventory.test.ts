import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

import generatedInventory from
  "../src/architecture/balanced-operation-caller-inventory.generated.json" with {
    type: "json"
  };
import {
  createKpBalancedOperationCallerInventory,
  kpBalancedOperationCallerInventory,
  type KpBalancedOperationCallerInventoryEntry
} from "../src/architecture/balanced-operation-caller-inventory.ts";
import {
  kpCanonicalOperationRegistry
} from "../src/semantic/canonical-operation-registry.ts";
import {
  kpCanonicalLogExponentAuthoredProgram
} from "../src/semantic/log-exponent-authored-operations.ts";

const transformTypes = kpBalancedOperationCallerInventory.entries.map(
  ({ transformType }) => transformType
);

test("balanced-operation inventory is current and covers the five categories", () => {
  assert.deepEqual(generatedInventory, kpBalancedOperationCallerInventory);
  assert.deepEqual(
    [...new Set(kpBalancedOperationCallerInventory.entries.map(
      ({ category }) => category
    ))].sort(),
    ["add", "apply-log", "divide", "multiply", "subtract"]
  );
  assert.equal(new Set(transformTypes).size, transformTypes.length);
});

test("every authority, presentation, and authoring claim has live source evidence", async () => {
  for (const item of kpBalancedOperationCallerInventory.entries) {
    for (const evidence of [
      item.semanticAuthority,
      item.presentation,
      item.authoring
    ]) {
      const source = await readFile(evidence.sourcePath, "utf8");
      assert.ok(
        source.includes(evidence.sourceNeedle),
        `${item.id} no longer matches ${evidence.sourcePath}`
      );
    }
    assert.deepEqual(item.roles, [
      "lhs",
      "rhs",
      "relation",
      "applied-operation"
    ]);
    assert.ok(item.assumptions.length > 0, item.id);
  }
});

test("literal discovery cannot add an orphan balanced-operation caller", async () => {
  const roots = ["src/animation", "src/authoring", "src/reader", "src/semantic"];
  const sourceFiles = (await Promise.all(roots.map(listTypeScriptFiles))).flat();
  for (const item of kpBalancedOperationCallerInventory.entries) {
    const actual = [] as string[];
    for (const sourcePath of sourceFiles) {
      const source = await readFile(sourcePath, "utf8");
      if (source.includes(`"${item.transformType}"`)) actual.push(sourcePath);
    }
    assert.deepEqual(actual.sort(), [...item.literalSourcePaths].sort(), item.id);
  }
});

test("canonical and specialized authoring exposure is stated rather than inferred", () => {
  for (const item of kpBalancedOperationCallerInventory.entries) {
    const canonical = kpCanonicalOperationRegistry.entries.find(
      ({ sourceTransformType }) => sourceTransformType === item.transformType
    );
    const specialized = kpCanonicalLogExponentAuthoredProgram.operations.find(
      ({ id }) => id === item.authoring.operationId
    );
    if (item.authoring.exposure === "canonical-equation-series") {
      assert.equal(canonical?.id, item.authoring.operationId, item.id);
      assert.equal(specialized, undefined, item.id);
    } else if (item.authoring.exposure === "specialized-authored-program") {
      assert.equal(canonical, undefined, item.id);
      assert.equal(specialized?.id, item.authoring.operationId, item.id);
    } else {
      assert.equal(canonical, undefined, item.id);
      assert.equal(specialized, undefined, item.id);
    }
  }
});

test("contradictory authorities and duplicate source evidence are rejected", () => {
  const original = kpBalancedOperationCallerInventory.entries[0]!;
  assert.throws(
    () => createKpBalancedOperationCallerInventory([
      original,
      { ...original, id: "balanced-operation.conflict" }
    ]),
    /Contradictory balanced-operation authority/
  );
  assert.throws(
    () => createKpBalancedOperationCallerInventory([{
      ...original,
      id: "balanced-operation.duplicate-source",
      transformType: "differentTransform",
      literalSourcePaths: [
        original.literalSourcePaths[0]!,
        original.literalSourcePaths[0]!
      ]
    } satisfies KpBalancedOperationCallerInventoryEntry]),
    /repeats a source path/
  );
});

async function listTypeScriptFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory()) return listTypeScriptFiles(path);
    return entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
  }));
  return nested.flat().sort();
}
