import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCanonicalOperationPack,
  createKpCanonicalOperationProjectPins
} from "../src/semantic/canonical-operation-pack.ts";
import {
  createKpCanonicalOperationContract
} from "../src/semantic/canonical-operation-contract.ts";
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
      ? matrix.entry.contract.roles.map((role) => role.id)
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
      && entry.contract.roles.length > 0
  ));
});

test("registry rejects duplicate operations and unsatisfied exact dependencies", () => {
  const corePack = kpCanonicalOperationRegistry.packs.find((pack) => pack.id === "kp.core")!;
  const wrap = kpCanonicalOperationRegistry.entries.find(
    (entry) => entry.id === "kp.core.wrap"
  )!;
  assert.throws(
    () => createKpCanonicalOperationRegistry({
      packs: [corePack],
      entries: [
        { ...wrap },
        { ...wrap }
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

test("registry contracts centralize execution policy without copying transformation truth", () => {
  assert.ok(kpCanonicalOperationRegistry.entries.every((entry) =>
    entry.contract.authority.refId.length > 0 &&
    entry.contract.roles.length > 0 &&
    entry.contract.lineageRelationIds.length > 0 &&
    entry.contract.lawIds.length > 0 &&
    entry.contract.motifRequirementIds.length > 0 &&
    entry.contract.fixtureIds.length > 0
  ));
  const distribution = kpCanonicalOperationRegistry.entries.find(
    (entry) => entry.id === "kp.algebra.distribute-multiplication"
  )!;
  assert.equal(distribution.contract.authority.kind, "operation-spec");
  assert.equal(distribution.contract.ownershipMode, "fission-fusion");
  assert.equal(distribution.contract.reverse.operationId, "kp.algebra.factor-common-term");
});

test("a pinned extension pack can add a complete operation contract", () => {
  const corePack = kpCanonicalOperationRegistry.packs.find((pack) => pack.id === "kp.core")!;
  const extensionPack = createKpCanonicalOperationPack({
    id: "project.test-extension",
    scope: "project",
    version: "1.0.0",
    title: "Test extension",
    operationIds: ["project.test-extension.rotate-terms"],
    dependencies: [{ packId: corePack.id, version: corePack.version }]
  });
  const role = {
    id: "terms",
    endpoint: "source" as const,
    kind: "semantic-entity" as const,
    cardinality: "one-or-more" as const,
    summary: "Terms to rotate."
  };
  const registry = createKpCanonicalOperationRegistry({
    packs: [corePack, extensionPack],
    entries: [{
      id: "project.test-extension.rotate-terms",
      packId: extensionPack.id,
      canonicalComposition: ["kp.core.reorder"],
      contract: createKpCanonicalOperationContract({
        authority: {
          kind: "transformation-definition",
          refId: "definition.test.rotate-terms"
        },
        roles: [role],
        lineageRelationIds: ["identity", "role-change"],
        ownershipMode: "continuant",
        lawIds: ["law.test.rotation-preserves-members"],
        witnessIds: [],
        reverse: {
          kind: "self",
          operationId: "project.test-extension.rotate-terms",
          interpretation: "Rotate the same terms back to their authored positions.",
          validity: "identity",
          choreography: {
            kind: "identity",
            causalEmphasis: "continuants",
            narration: "The same terms return to their earlier positions."
          }
        },
        motifRequirementIds: ["motif.kp.core.reorder"],
        pacing: { kind: "single" },
        cost: {
          tokenRoleIds: [role.id],
          simultaneousGroupRoleIds: [role.id],
          fragmentRoleIds: [],
          shadowPolicy: "none",
          threeDPolicy: "none"
        },
        fixtureIds: ["fixture.test.rotate-terms"]
      })
    }]
  });
  const resolution = resolveKpCanonicalOperation({
    registry,
    pins: createKpCanonicalOperationProjectPins([
      { packId: corePack.id, version: corePack.version },
      { packId: extensionPack.id, version: extensionPack.version }
    ]),
    operationId: "project.test-extension.rotate-terms"
  });
  assert.equal(resolution.status, "resolved");
});

test("registry validation closes reverse-operation references", () => {
  const corePack = kpCanonicalOperationRegistry.packs.find((pack) => pack.id === "kp.core")!;
  const wrap = kpCanonicalOperationRegistry.entries.find(
    (entry) => entry.id === "kp.core.wrap"
  )!;
  assert.throws(() => createKpCanonicalOperationRegistry({
    packs: [corePack],
    entries: [{
      ...wrap,
      contract: {
        ...wrap.contract,
        reverse: { ...wrap.contract.reverse, operationId: "kp.core.missing" }
      }
    }]
  }), /references missing reverse operation kp\.core\.missing/);
});
