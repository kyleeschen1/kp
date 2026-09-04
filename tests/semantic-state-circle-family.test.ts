import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { evaluateKpSemanticDerivedValue } from
  "../src/semantic-state/derived-evaluator.ts";
import {
  createKpSemanticStateCircleFamilyFixture,
  kpCircleAreaUnit,
  kpCircleRadiusUnit
} from "./fixtures/semantic-state-circle-family.ts";

const SOURCE = "tests/fixtures/semantic-state-circle-family.ts";

test("the circle family changes one unit-tagged radius driver", () => {
  const fixture = createKpSemanticStateCircleFamilyFixture();
  const operation = fixture.application.commit.journal[0]?.operation;

  assert.deepEqual(fixture.application.before.measurement.radius.read(), {
    magnitude: 2,
    unitId: kpCircleRadiusUnit.id
  });
  assert.deepEqual(fixture.application.after.measurement.radius.read(), {
    magnitude: 4,
    unitId: kpCircleRadiusUnit.id
  });
  assert.equal(fixture.application.commit.journal.length, 1);
  assert.equal(operation?.kind, "update");
  if (operation?.kind !== "update") {
    throw new Error("Expected one radius update.");
  }
  assert.equal(operation.slotId, fixture.handles.refs.measurement.radius.slotId);
  assert.deepEqual(
    fixture.family.declaration.transitionPlan.declarations.map(declaration => ({
      mode: declaration.transitionMode,
      path: declaration.target.path
    })),
    [{ mode: "semantic-interpolation", path: ["measurement", "radius"] }]
  );
});

test("circle endpoints derive area and point-dependent response", () => {
  const fixture = createKpSemanticStateCircleFamilyFixture();

  for (const [snapshot, radius] of [
    [fixture.initial, 2],
    [fixture.application.commit.after, 4]
  ] as const) {
    assert.deepEqual(evaluateKpSemanticDerivedValue({
      graph: fixture.graph,
      snapshot,
      target: fixture.handles.refs.measurement.area
    }), {
      magnitude: Math.PI * radius ** 2,
      unitId: kpCircleAreaUnit.id
    });
    assert.deepEqual(evaluateKpSemanticDerivedValue({
      graph: fixture.graph,
      snapshot,
      target: fixture.handles.refs.measurement.response
    }), {
      magnitude: Math.PI * radius,
      unitId: kpCircleAreaUnit.id
    });
  }
  assert.deepEqual(
    fixture.graph.input.definitions.map(definition => ({
      target: definition.target.path?.join("."),
      dependencies: definition.dependencies.map(edge =>
        edge.dependency.path?.join(".")
      )
    })),
    [
      {
        target: "measurement.area",
        dependencies: ["measurement.radius"]
      },
      {
        target: "measurement.response",
        dependencies: ["measurement.radius", "source.radiusChange"]
      }
    ]
  );
});

test("circle semantic identities and math authority remain stable", () => {
  const fixture = createKpSemanticStateCircleFamilyFixture();

  assert.equal(fixture.measurement.id,
    "lesson.circle-measurement.circles.garden");
  assert.equal(fixture.measurement.areaAtRadius.id,
    "lesson.circle-measurement.circles.garden.functions.area-at-radius");
  assert.equal(fixture.compiled.namespace,
    "lesson.circle-measurement.state-family");
  assert.equal(fixture.handles.refs.measurement.radius.path.join("."),
    "measurement.radius");
  const serialized = JSON.stringify([
    fixture.initial,
    fixture.application.commit.after
  ]);
  assert.doesNotMatch(serialized, /areaAtRadius|authoring-context|function/iu);
});

test("the circle family packet is compact and renderer neutral", () => {
  const source = readFileSync(SOURCE, "utf8");
  const authoring = /\/\/ circle-state-family-authoring:start\n([\s\S]*?)\/\/ circle-state-family-authoring:end/u
    .exec(source)?.[1];
  assert.ok(authoring);
  const imports = [...source.matchAll(/from "([^"]+)"/gu)]
    .map(match => match[1]);

  assert.equal(count(authoring, /\.update\(/gu), 1);
  assert.equal(count(authoring,
    /(?:createKpSemanticStateIdentityScope|createKpSemanticEntityVersionStore|createKpAggregateSemanticSnapshot|beginKpSemanticTransaction)\(/gu
  ), 0);
  assert.equal(count(authoring, /\bas\s+(?:Kp|Readonly|never)\b/gu), 0);
  assert.equal(authoring.split("\n").filter(line => line.trim()).length, 70);
  assert.equal(imports.some(specifier =>
    /render|article|animation|dom|svelte/iu.test(specifier ?? "")
  ), false);
});

function count(source: string, pattern: RegExp): number {
  return [...source.matchAll(pattern)].length;
}
