import assert from "node:assert/strict";
import test from "node:test";

import { createKpCanonicalOperationProjectPins } from "../src/semantic/canonical-operation-pack.ts";
import {
  createKpCanonicalOperationRegistry,
  kpCanonicalOperationRegistry,
  kpGeneratedAlgebraOperationEntries,
  kpSemanticMotionOperationEntries,
  resolveKpCanonicalOperation
} from "../src/semantic/canonical-operation-registry.ts";
import { listGeneratedAlgebraTransformDefinitions } from "../src/semantic/generated-algebra-transform-definition-registry.ts";

const pins = createKpCanonicalOperationProjectPins([
  { packId: "kp.core", version: "1.0.0" },
  { packId: "kp.algebra", version: "0.1.0" },
  { packId: "kp.semantic-motion", version: "0.1.0" }
]);

test("default registry resolves exact core and algebra pins deterministically", () => {
  const wrap = resolveKpCanonicalOperation({ pins, operationId: "kp.core.wrap" });
  const distribute = resolveKpCanonicalOperation({
    pins,
    operationId: "kp.algebra.distribute-multiplication"
  });

  assert.equal(wrap.status, "resolved");
  assert.deepEqual(wrap.status === "resolved" ? wrap.entry.canonicalComposition : [], ["kp.core.wrap"]);
  assert.equal(distribute.status, "resolved");
  assert.deepEqual(
    distribute.status === "resolved" ? distribute.entry.canonicalComposition : [],
    ["kp.core.persist", "kp.core.fan-out", "kp.core.eliminate", "kp.core.reorder"]
  );
  const matrix = resolveKpCanonicalOperation({
    pins,
    operationId: "kp.semantic-motion.matrix-matrix"
  });
  assert.equal(matrix.status, "resolved");
  assert.equal(
    matrix.status === "resolved" ? matrix.entry.sourceTransformType : undefined,
    "multiplyMatrices"
  );
  assert.deepEqual(
    matrix.status === "resolved"
      ? matrix.entry.authoringRoles?.map((role) => role.id)
      : [],
    ["left-rows", "right-columns", "cell-products", "result-cells"]
  );
});

test("registry reports unknown operations, missing pins, and version drift", () => {
  assert.equal(
    resolveKpCanonicalOperation({ pins, operationId: "kp.algebra.unknown" }).status,
    "unknown-operation"
  );
  assert.equal(
    resolveKpCanonicalOperation({
      pins: createKpCanonicalOperationProjectPins([{ packId: "kp.core", version: "1.0.0" }]),
      operationId: "kp.algebra.distribute-multiplication"
    }).status,
    "missing-pin"
  );
  assert.equal(
    resolveKpCanonicalOperation({
      pins: createKpCanonicalOperationProjectPins([
        { packId: "kp.core", version: "1.0.0" },
        { packId: "kp.algebra", version: "0.2.0" }
      ]),
      operationId: "kp.algebra.distribute-multiplication"
    }).status,
    "version-mismatch"
  );
});

test("every promoted generated algebra definition has one compatibility entry", () => {
  const definitions = listGeneratedAlgebraTransformDefinitions();
  assert.equal(kpGeneratedAlgebraOperationEntries.length, definitions.length);
  assert.deepEqual(
    kpGeneratedAlgebraOperationEntries.map((entry) => entry.sourceDefinitionId),
    definitions.map((definition) => definition.id)
  );
  assert.equal(
    new Set(kpGeneratedAlgebraOperationEntries.map((entry) => entry.id)).size,
    definitions.length
  );
});

test("semantic motion pack exposes only operations with explicit role contracts", () => {
  assert.equal(kpSemanticMotionOperationEntries.length, 12);
  assert.ok(kpSemanticMotionOperationEntries.every(
    (entry) => entry.sourceTransformType !== undefined
      && entry.authoringRoles !== undefined
      && entry.authoringRoles.length > 0
  ));
});

test("registry rejects duplicate operations and unsatisfied exact dependencies", () => {
  const corePack = kpCanonicalOperationRegistry.packs.find((pack) => pack.id === "kp.core")!;
  assert.throws(
    () => createKpCanonicalOperationRegistry({
      packs: [corePack],
      entries: [
        { id: "kp.core.wrap", packId: "kp.core", canonicalComposition: ["kp.core.wrap"] },
        { id: "kp.core.wrap", packId: "kp.core", canonicalComposition: ["kp.core.wrap"] }
      ]
    }),
    /Duplicate canonical operation kp.core.wrap/
  );
  assert.throws(
    () => createKpCanonicalOperationRegistry({
      packs: [kpCanonicalOperationRegistry.packs.find((pack) => pack.id === "kp.algebra")!],
      entries: []
    }),
    /requires exact dependency kp.core@1.0.0/
  );
});
