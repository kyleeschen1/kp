import assert from "node:assert/strict";
import test from "node:test";

import { createDistributionExpansionAnimationAsset } from "../src/animation/distribution-adapter.ts";
import { createKpSemanticTransformation } from "../src/semantic/asset-transformation.ts";
import {
  executeKpDistributionCanonicalOperation,
  kpDistributionCanonicalOperationSpec
} from "../src/semantic/distribution-canonical-operation.ts";
import {
  createKpCanonicalOperationProjectPins
} from "../src/semantic/canonical-operation-pack.ts";
import {
  resolveKpCanonicalOperation
} from "../src/semantic/canonical-operation-registry.ts";

test("distribution spec formalizes copy lineage, persistence, grouping exit, and rewind", () => {
  assert.equal(
    kpDistributionCanonicalOperationSpec.canonicalOperationId,
    "kp.algebra.distribute-multiplication"
  );
  assert.deepEqual(
    kpDistributionCanonicalOperationSpec.lineage.map((lineage) => [
      lineage.id,
      lineage.relation,
      lineage.mapping ?? "aggregate"
    ]),
    [
      ["factor-fans-out", "fan-out", "aggregate"],
      ["addends-persist", "identity", "pairwise"],
      ["connectors-persist", "identity", "pairwise"],
      ["grouping-exits", "artifact", "aggregate"]
    ]
  );
  assert.equal(kpDistributionCanonicalOperationSpec.examples[0]?.kind, "positive");
  assert.equal(kpDistributionCanonicalOperationSpec.examples[1]?.kind, "counterexample");
  assert.equal(
    kpDistributionCanonicalOperationSpec.rewind.operationId,
    "kp.algebra.factor-common-term"
  );
});

test("generated binary distribution executes through authoritative canonical lineage", () => {
  const animation = createDistributionExpansionAnimationAsset();
  const transformation = animation.transformations[0]!;
  const source = transformation.sourceObjectIds[0]!;
  const target = transformation.targetObjectIds[0]!;
  const execution = executeKpDistributionCanonicalOperation({
    transformation,
    roleBindings: bindings(source, target, ["left-term", "right-term"], ["plus"])
  });

  assert.deepEqual(
    execution.lineageGraph.edges.map((edge) => edge.relation),
    ["split", "persist", "persist", "persist", "removal"]
  );
  assert.deepEqual(
    execution.lineageGraph.edges[0]?.targetEntityIds,
    [`${target}.left-factor`, `${target}.right-factor`]
  );
  assert.deepEqual(
    execution.correspondenceMap.records.map((record) => record.relation),
    ["fan-out", "identity", "identity", "identity", "artifact"]
  );
});

test("distribution role cardinality expands to three addends without changing the operation", () => {
  const transformation = createKpSemanticTransformation({
    id: "transform.distribute-three",
    transformType: "distributeMultiplication",
    title: "Distribute across three addends",
    sourceObjectIds: ["before"],
    targetObjectIds: ["after"],
    preserves: ["identity", "value", "structure"]
  });
  const execution = executeKpDistributionCanonicalOperation({
    transformation,
    roleBindings: bindings(
      "before",
      "after",
      ["term.0", "term.1", "term.2"],
      ["connector.0", "connector.1"]
    )
  });
  assert.equal(
    execution.lineageGraph.edges.filter((edge) => edge.relation === "persist").length,
    5
  );
  assert.equal(execution.lineageGraph.edges[0]?.targetEntityIds.length, 3);
});

test("distribution rejects missing factor copies instead of guessing", () => {
  const transformation = createKpSemanticTransformation({
    id: "transform.incomplete-distribution",
    transformType: "distributeMultiplication",
    title: "Incomplete distribution",
    sourceObjectIds: ["before"],
    targetObjectIds: ["after"],
    preserves: ["identity"]
  });
  assert.throws(() => executeKpDistributionCanonicalOperation({
    transformation,
    roleBindings: {
      ...bindings("before", "after", ["left", "right"], ["plus"]),
      "factor-copies": ["after.factor.0"]
    }
  }), /one persistent addend and factor copy per source addend/);
});

test("canonical registry points distribution at its expandable formal spec", () => {
  const resolution = resolveKpCanonicalOperation({
    pins: createKpCanonicalOperationProjectPins([
      { packId: "kp.core", version: "1.0.0" },
      { packId: "kp.algebra", version: "0.1.0" }
    ]),
    operationId: "kp.algebra.distribute-multiplication"
  });
  assert.equal(resolution.status, "resolved");
  assert.equal(
    resolution.status === "resolved" ? resolution.entry.operationSpecId : undefined,
    kpDistributionCanonicalOperationSpec.id
  );
});

function bindings(
  source: string,
  target: string,
  addendRoles: readonly string[],
  connectorRoles: readonly string[]
) {
  return {
    "common-factor": `${source}.factor`,
    "source-addends": addendRoles.map((role) => `${source}.${role}`),
    "source-connectors": connectorRoles.map((role) => `${source}.${role}`),
    "grouping-artifacts": [`${source}.left-paren`, `${source}.right-paren`],
    "factor-copies": addendRoles.map((role, index) =>
      `${target}.${role.endsWith("-term") ? role.replace(/-term$/, "-factor") : `factor.${index}`}`
    ),
    "distributed-addends": addendRoles.map((role) => `${target}.${role}`),
    "target-connectors": connectorRoles.map((role) => `${target}.${role}`)
  };
}
