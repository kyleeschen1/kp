import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCanonicalOperationPack,
  createKpCanonicalOperationProjectPins,
  kpCanonicalOperationCorePack,
  kpCanonicalOperationPackMatchesPin,
  validateKpCanonicalOperationPack,
  validateKpCanonicalOperationProjectPins
} from "../src/semantic/canonical-operation-pack.ts";

test("canonical operation core pack pins every universal operation", () => {
  assert.equal(kpCanonicalOperationCorePack.id, "kp.core");
  assert.equal(kpCanonicalOperationCorePack.scope, "core");
  assert.equal(kpCanonicalOperationCorePack.version, "1.0.0");
  assert.equal(kpCanonicalOperationCorePack.operationIds.length, 13);
  assert.deepEqual(kpCanonicalOperationCorePack.dependencies, []);
});

test("shared and project packs use exact dependency versions", () => {
  const algebra = createKpCanonicalOperationPack({
    id: "kp.algebra",
    scope: "shared-domain",
    version: "1.2.0",
    title: "Algebra operations",
    operationIds: ["kp.algebra.distribute"],
    dependencies: [{ packId: "kp.core", version: "1.0.0" }]
  });
  const lesson = createKpCanonicalOperationPack({
    id: "project.lesson-12",
    scope: "project",
    version: "0.3.0-experimental",
    title: "Lesson 12 operations",
    operationIds: ["project.lesson-12.area-distribution"],
    dependencies: [{ packId: "kp.algebra", version: "1.2.0" }]
  });

  assert.deepEqual(algebra.dependencies, [{ packId: "kp.core", version: "1.0.0" }]);
  assert.deepEqual(lesson.dependencies, [{ packId: "kp.algebra", version: "1.2.0" }]);
  assert.equal(
    kpCanonicalOperationPackMatchesPin(algebra, { packId: "kp.algebra", version: "1.2.0" }),
    true
  );
  assert.equal(
    kpCanonicalOperationPackMatchesPin(algebra, { packId: "kp.algebra", version: "1.3.0" }),
    false
  );
});

test("project pins reject duplicate packs and version ranges", () => {
  const pins = createKpCanonicalOperationProjectPins([
    { packId: "kp.core", version: "1.0.0" },
    { packId: "kp.algebra", version: "1.2.0" }
  ]);
  assert.deepEqual(pins, {
    schemaVersion: "kp.canonical-operation-pins.v1",
    packs: [
      { packId: "kp.core", version: "1.0.0" },
      { packId: "kp.algebra", version: "1.2.0" }
    ]
  });
  assert.deepEqual(
    validateKpCanonicalOperationProjectPins({
      ...pins,
      packs: [
        { packId: "kp.algebra", version: "^1.2.0" },
        { packId: "kp.algebra", version: "1.2.0" }
      ]
    }),
    [
      { path: "packs[1]", message: "Duplicate pack pin kp.algebra." },
      { path: "packs[0].version", message: "^1.2.0 must be an exact semantic version." }
    ]
  );
});

test("pack validation enforces scope, namespaces, and dependency closure inputs", () => {
  assert.deepEqual(
    validateKpCanonicalOperationPack({
      id: "lesson",
      kind: "canonical-operation-pack",
      scope: "project",
      version: "latest",
      title: "",
      operationIds: ["bad", "bad"],
      dependencies: [
        { packId: "lesson", version: "*" },
        { packId: "lesson", version: "1.0.0" }
      ]
    }),
    [
      { path: "id", message: "lesson must be a lowercase namespaced id." },
      { path: "version", message: "latest must be an exact semantic version." },
      { path: "title", message: "Operation pack title must not be empty." },
      { path: "operationIds[1]", message: "Duplicate operation id bad." },
      { path: "operationIds[0]", message: "bad must be a lowercase namespaced id." },
      { path: "operationIds[1]", message: "bad must be a lowercase namespaced id." },
      { path: "dependencies[1]", message: "Duplicate dependency pack id lesson." },
      { path: "dependencies[0].packId", message: "lesson must be a lowercase namespaced id." },
      { path: "dependencies[0].version", message: "* must be an exact semantic version." },
      { path: "dependencies[0].packId", message: "Operation pack lesson must not depend on itself." },
      { path: "dependencies[1].packId", message: "lesson must be a lowercase namespaced id." },
      { path: "dependencies[1].packId", message: "Operation pack lesson must not depend on itself." },
      { path: "id", message: "Project operation pack ids must start with project." }
    ]
  );
});
