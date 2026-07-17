import assert from "node:assert/strict";
import test from "node:test";

import {
  createExponentRadicalRepresentationalLineageFixture
} from "../src/animation/exponent-radical-adapter.ts";
import {
  compileKpRepresentationalLineageGraph
} from "../src/animation/representational-lineage-compiler.ts";
import {
  validateKpSemanticLineageGraph
} from "../src/semantic/semantic-lineage-graph.ts";

test("radical fixture compiles notation succession without false semantic identity", () => {
  const fixture = createExponentRadicalRepresentationalLineageFixture();
  assert.equal(
    fixture.animation.id,
    "animation.generated.radical.square-root-as-power"
  );
  assert.deepEqual(fixture.graph.edges.map((edge) => [
    edge.relation,
    edge.sourceEntityIds.length,
    edge.targetEntityIds.length,
    edge.representationAuthorityId
  ]), [[
    "representation-succession",
    3,
    2,
    "transform.generated.radical.square-root-as-power.rewrite-power-as-root#unit-numerator-absorbed+fraction-rule-becomes-radical-overbar+denominator-becomes-radical-hook"
  ]]);
  assert.equal(
    fixture.graph.edges.some((edge) => edge.relation === "persist"),
    false
  );
  assert.deepEqual(validateKpSemanticLineageGraph(fixture.graph), []);
});

test("compiler rejects successor endpoints that do not belong to authored lineage", () => {
  const fixture = createExponentRadicalRepresentationalLineageFixture();
  const lifecycle = {
    ...fixture.lifecycle,
    records: fixture.lifecycle.records.map((record) => ({
      ...record,
      targetEntityIds: ["unrelated.radical"]
    }))
  };
  assert.throws(
    () => compileKpRepresentationalLineageGraph({
      id: "graph.invalid",
      vocabulary: fixture.vocabulary,
      lifecycle
    }),
    /target does not match representational lineage/
  );
});

test("semantic lineage validation requires succession authority", () => {
  const fixture = createExponentRadicalRepresentationalLineageFixture();
  const graph = {
    ...fixture.graph,
    edges: fixture.graph.edges.map((edge) => ({
      ...edge,
      representationAuthorityId: ""
    }))
  };
  assert.deepEqual(validateKpSemanticLineageGraph(graph), [{
    code: "lineage.missing-representation-authority",
    path: "edges[0].representationAuthorityId",
    message:
      "Representation succession representation-edge.transform.generated.radical.square-root-as-power.rewrite-power-as-root.root-notation-successor requires an explicit semantic authority."
  }]);
});
