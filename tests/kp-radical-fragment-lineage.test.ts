import assert from "node:assert/strict";
import test from "node:test";

import {
  createExponentRadicalRewriteAnimationAsset
} from "../src/animation/exponent-radical-adapter.ts";
import {
  createKpRadicalFragmentLineage
} from "../src/animation/radical-fragment-lineage.ts";
import {
  validateKpSemanticLineageGraph
} from "../src/semantic/semantic-lineage-graph.ts";

const lineage = createKpRadicalFragmentLineage(
  createExponentRadicalRewriteAnimationAsset()
);

test("radical lineage assigns one explicit cause to every visible fragment", () => {
  assert.deepEqual(validateKpSemanticLineageGraph(lineage.graph), []);
  assert.deepEqual(
    lineage.graph.edges.map((edge) => [
      edge.relation,
      edge.sourceEntityIds.length,
      edge.targetEntityIds.length,
      edge.representationAuthorityId
    ]),
    [
      ["persist", 1, 1, undefined],
      ["removal", 1, 0, undefined],
      [
        "representation-succession",
        1,
        1,
        "transform.generated.radical.square-root-as-power.rewrite-power-as-root.fraction-rule-becomes-radical-overbar-lineage"
      ],
      [
        "representation-succession",
        1,
        1,
        "transform.generated.radical.square-root-as-power.rewrite-power-as-root.denominator-becomes-radical-hook-lineage"
      ]
    ]
  );
});

test("unit numerator absorption remains intentional and reversible in the model", () => {
  assert.deepEqual(lineage.absorptions, [{
    recordId: "unit-numerator-absorbed",
    edgeId:
      "transform.generated.radical.square-root-as-power.rewrite-power-as-root.unit-numerator-absorbed-lineage-edge",
    sourceSelectorIds: [
      "expression.generated.radical.square-root-as-power.power.exponent-numerator"
    ],
    cause: "conventional-root-notation",
    summary: "The unit numerator is absorbed by conventional root notation."
  }]);
  assert.equal(lineage.successions.length, 2);
  assert.ok(lineage.successions.every(
    (succession) =>
      succession.sourceSelectorIds.length === 1 &&
      succession.targetSelectorIds.length === 1
  ));
});
