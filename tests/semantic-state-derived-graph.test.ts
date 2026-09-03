import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpSemanticStateDerivation,
  type KpSemanticStateDerivationDefinitionSource
} from "../src/semantic-state/authoring-derived-definition.ts";
import { compileKpSemanticStateSchema } from
  "../src/semantic-state/authoring-schema-compiler.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateValue
} from "../src/semantic-state/authoring-schema.ts";
import { createKpSemanticStateHandleSet } from
  "../src/semantic-state/authoring-state-handles.ts";
import { normalizeKpSemanticDerivedGraphInput } from
  "../src/semantic-state/derived-graph.ts";

test("typed definitions normalize to stable definition-local graph input", () => {
  const fixture = createFixture();
  const first = normalizeKpSemanticDerivedGraphInput(
    fixture.compiled,
    [fixture.revenue, fixture.equilibrium]
  );
  const second = normalizeKpSemanticDerivedGraphInput(
    fixture.compiled,
    [fixture.equilibrium, fixture.revenue]
  );

  assert.deepEqual(
    first.definitions.map(({ id }) => id),
    second.definitions.map(({ id }) => id)
  );
  assert.deepEqual(
    first.edges.map(({ id }) => id),
    second.edges.map(({ id }) => id)
  );
  assert.equal(first.definitions[0]?.definition, fixture.equilibrium);
  assert.equal(first.definitions[1]?.definition, fixture.revenue);
  assert.equal(fixture.computeCalls(), 0);
});

test("normalized edges retain exact schema source paths and dependency order", () => {
  const fixture = createFixture();
  const graph = normalizeKpSemanticDerivedGraphInput(
    fixture.compiled,
    [fixture.equilibrium]
  );
  const definition = graph.definitions[0];

  assert.deepEqual(definition?.target.path, ["metrics", "equilibrium"]);
  assert.equal(definition?.target.encodedPath, "metrics.equilibrium");
  assert.equal(definition?.target.descriptorKind, "derived-value");
  assert.deepEqual(
    definition?.dependencies.map(({ dependency, dependencyIndex }) => ({
      dependencyIndex,
      path: dependency.path,
      encodedPath: dependency.encodedPath,
      descriptorKind: dependency.descriptorKind
    })),
    [
      {
        dependencyIndex: 0,
        path: ["market", "supply"],
        encodedPath: "market.supply",
        descriptorKind: "required-value"
      },
      {
        dependencyIndex: 1,
        path: ["market", "demand"],
        encodedPath: "market.demand",
        descriptorKind: "required-value"
      }
    ]
  );
  assert.equal(definition?.sourceId, "schema.metrics.equilibrium.derivation");
});

test("normalization snapshots its collections without invoking definitions", () => {
  const fixture = createFixture();
  const definitions: KpSemanticStateDerivationDefinitionSource[] = [
    fixture.equilibrium
  ];
  const graph = normalizeKpSemanticDerivedGraphInput(
    fixture.compiled,
    definitions
  );
  definitions.push(fixture.revenue);

  assert.equal(graph.definitions.length, 1);
  assert.equal(graph.edges.length, 2);
  assert.equal(fixture.computeCalls(), 0);
  assert.ok(Object.isFrozen(graph));
  assert.ok(Object.isFrozen(graph.definitions));
  assert.ok(Object.isFrozen(graph.edges));
  assert.ok(Object.isFrozen(graph.definitions[0]?.dependencies));
  assert.ok(Object.isFrozen(graph.edges[0]));
});

function createFixture() {
  let computeCalls = 0;
  const compiled = compileKpSemanticStateSchema(
    "lesson.derived-graph-normalization",
    kpStateGroup({
      market: kpStateGroup({
        supply: kpStateValue({ intercept: 2, slope: 1 }),
        demand: kpStateValue({ intercept: 12, slope: -1 })
      }),
      metrics: kpStateGroup({
        equilibrium: kpStateDerived<number>(),
        revenue: kpStateDerived<number>()
      })
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const equilibrium = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.metrics.equilibrium,
    dependencies: [
      handles.refs.market.supply,
      handles.refs.market.demand
    ],
    compute: ([supply, demand]) => {
      computeCalls += 1;
      return demand.intercept - supply.intercept;
    }
  });
  const revenue = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.metrics.revenue,
    dependencies: [handles.refs.metrics.equilibrium],
    compute: ([equilibriumValue]) => {
      computeCalls += 1;
      return equilibriumValue * 2;
    }
  });
  return {
    compiled,
    equilibrium,
    revenue,
    computeCalls: () => computeCalls
  };
}
