import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  kpEquationAdapterOwnershipMap,
  validateKpEquationAdapterOwnershipMap
} from "../src/architecture/equation-adapter-ownership-map.ts";

test("equation adapter ownership dependencies are complete and acyclic", () => {
  assert.deepEqual(
    validateKpEquationAdapterOwnershipMap(kpEquationAdapterOwnershipMap),
    []
  );
  assert.equal(
    kpEquationAdapterOwnershipMap.owners.filter(
      ({ decision }) => decision === "extract-a"
    ).length,
    1
  );
});

test("equation adapter ownership anchors remain grounded in the source", async () => {
  const source = await readFile(
    kpEquationAdapterOwnershipMap.sourcePath,
    "utf8"
  );
  for (const owner of kpEquationAdapterOwnershipMap.owners) {
    assert.ok(owner.inputs.length > 0, `${owner.id} has no measurable input.`);
    assert.ok(owner.outputs.length > 0, `${owner.id} has no measurable output.`);
    for (const anchor of owner.sourceAnchors) {
      assert.match(
        source,
        new RegExp(`\\b${anchor}\\b`),
        `${owner.id} lost source anchor ${anchor}.`
      );
    }
  }
});

test("planned extraction direction leaves the adapter as composition root", () => {
  const host = kpEquationAdapterOwnershipMap.owners.find(
    ({ id }) => id === "host-orchestration"
  );
  assert.ok(host);
  assert.equal(host.decision, "retain-in-host");
  assert.deepEqual(new Set(host.dependsOn), new Set(
    kpEquationAdapterOwnershipMap.owners
      .filter(({ id }) => id !== "host-orchestration")
      .map(({ id }) => id)
  ));
  assert.equal(
    kpEquationAdapterOwnershipMap.owners.some(
      ({ id, dependsOn }) =>
        id !== "host-orchestration" &&
        dependsOn.includes("host-orchestration")
    ),
    false
  );
});
