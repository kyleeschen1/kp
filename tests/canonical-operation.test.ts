import assert from "node:assert/strict";
import test from "node:test";

import {
  findKpCanonicalOperationCoreDescriptor,
  kpCanonicalOperationCore,
  kpCanonicalOperationCoreVersion
} from "../src/semantic/canonical-operation.ts";

test("canonical operation core is renderer-neutral and versioned", () => {
  assert.equal(kpCanonicalOperationCoreVersion, "1.0.0");
  assert.equal(new Set(kpCanonicalOperationCore.map((operation) => operation.id)).size, 13);
  assert.deepEqual(
    kpCanonicalOperationCore.map((operation) => operation.id),
    [
      "kp.core.persist",
      "kp.core.introduce",
      "kp.core.eliminate",
      "kp.core.substitute",
      "kp.core.copy",
      "kp.core.fan-out",
      "kp.core.merge",
      "kp.core.reorder",
      "kp.core.wrap",
      "kp.core.unwrap",
      "kp.core.group",
      "kp.core.ungroup",
      "kp.core.focus"
    ]
  );
  for (const operation of kpCanonicalOperationCore) {
    assert.equal(operation.version, kpCanonicalOperationCoreVersion);
    assert.ok(operation.roles.length > 0);
    assert.ok(operation.correspondenceRelations.length > 0);
    assert.doesNotMatch(JSON.stringify(operation), /latex|coordinate|keyframe|dom|svg/i);
  }
});

test("canonical copy and fan-out roles make source persistence explicit", () => {
  assert.deepEqual(findKpCanonicalOperationCoreDescriptor("kp.core.copy"), {
    id: "kp.core.copy",
    version: "1.0.0",
    title: "Copy",
    summary: "Preserve a source while deriving one lineage-bearing copy.",
    roles: [
      {
        id: "source",
        endpoint: "source",
        kind: "semantic-entity",
        cardinality: "exactly-one",
        summary: "source semantic-entity role source"
      },
      {
        id: "persistent-source",
        endpoint: "target",
        kind: "semantic-entity",
        cardinality: "exactly-one",
        summary: "target semantic-entity role persistent-source"
      },
      {
        id: "copy",
        endpoint: "target",
        kind: "semantic-entity",
        cardinality: "exactly-one",
        summary: "target semantic-entity role copy"
      }
    ],
    correspondenceRelations: ["identity", "fan-out"]
  });
  assert.deepEqual(
    findKpCanonicalOperationCoreDescriptor("kp.core.fan-out").roles.map(
      (role) => [role.id, role.endpoint, role.cardinality]
    ),
    [
      ["source", "source", "exactly-one"],
      ["destinations", "target", "one-or-more"]
    ]
  );
});

test("canonical inverse pairs are symmetric", () => {
  for (const operation of kpCanonicalOperationCore) {
    if (operation.reversibleAs === undefined) continue;
    assert.equal(
      findKpCanonicalOperationCoreDescriptor(operation.reversibleAs).reversibleAs,
      operation.id
    );
  }
});
