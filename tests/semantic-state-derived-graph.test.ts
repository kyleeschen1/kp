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
import {
  KpSemanticDerivedGraphValidationError,
  type KpSemanticDerivedGraphDiagnostic,
  type KpSemanticDerivedGraphInput,
  normalizeKpSemanticDerivedGraphInput,
  validateKpSemanticDerivedGraphInput
} from "../src/semantic-state/derived-graph.ts";
import type { KpSemanticDerivedDependencyReference } from
  "../src/semantic-state/derived-binding.ts";
import type {
  KpSemanticDerivationId,
  KpSemanticSlotId
} from "../src/semantic-state/identity.ts";

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

test("a complete normalized graph passes local dependency validation", () => {
  const fixture = createFixture();
  const graph = normalizeKpSemanticDerivedGraphInput(
    fixture.compiled,
    [fixture.revenue, fixture.equilibrium]
  );

  assert.equal(validateKpSemanticDerivedGraphInput(graph), graph);
  assert.equal(fixture.computeCalls(), 0);
});

test("missing definitions and dependencies report exact local paths", () => {
  const fixture = createFixture();
  const missingDefinition = validationDiagnostics(
    normalizeKpSemanticDerivedGraphInput(
      fixture.compiled,
      [fixture.equilibrium]
    )
  );
  assert.deepEqual(projectDiagnostics(missingDefinition), [{
    code: "missing-derived-definition",
    sourceId: "schema.metrics.revenue.derivation",
    targetPath: ["metrics", "revenue"],
    dependencyPath: null
  }]);

  const missingSlot = fixture.compiled.identityScope.slot("missing.local");
  const missingDependency = validationDiagnostics(
    normalizeKpSemanticDerivedGraphInput(fixture.compiled, [
      createDefinitionSource({
        derivationId: fixture.equilibrium.id,
        targetSlotId: fixture.handles.refs.metrics.equilibrium.slotId,
        dependencySlotIds: [missingSlot],
        sourceId: "fixture.missing-dependency"
      }),
      fixture.revenue
    ])
  );
  assert.deepEqual(projectDiagnostics(missingDependency), [{
    code: "missing-derived-dependency",
    sourceId: "fixture.missing-dependency",
    targetPath: ["metrics", "equilibrium"],
    dependencyPath: null
  }]);
  assert.equal(missingDependency[0]?.dependencySlotId, missingSlot);

  const emptyDependency = validationDiagnostics(
    normalizeKpSemanticDerivedGraphInput(fixture.compiled, [
      createDefinitionSource({
        derivationId: fixture.equilibrium.id,
        targetSlotId: fixture.handles.refs.metrics.equilibrium.slotId,
        dependencySlotIds: [],
        sourceId: "fixture.empty-dependencies"
      }),
      fixture.revenue
    ])
  );
  assert.equal(emptyDependency[0]?.code, "missing-derived-dependency");
  assert.deepEqual(emptyDependency[0]?.targetPath, ["metrics", "equilibrium"]);
});

test("duplicate and self dependencies fail before compute is reachable", () => {
  const fixture = createFixture();
  const target = fixture.handles.refs.metrics.equilibrium;
  const supply = fixture.handles.refs.market.supply;
  const duplicate = createDefinitionSource({
    derivationId: fixture.equilibrium.id,
    targetSlotId: target.slotId,
    dependencySlotIds: [supply.slotId, supply.slotId],
    sourceId: "fixture.duplicate-dependency"
  });
  const self = createDefinitionSource({
    derivationId: fixture.equilibrium.id,
    targetSlotId: target.slotId,
    dependencySlotIds: [target.slotId],
    sourceId: "fixture.self-dependency"
  });

  const duplicateDiagnostics = validationDiagnostics(
    normalizeKpSemanticDerivedGraphInput(
      fixture.compiled,
      [duplicate, fixture.revenue]
    )
  );
  assert.deepEqual(projectDiagnostics(duplicateDiagnostics), [{
    code: "duplicate-derived-dependency",
    sourceId: "fixture.duplicate-dependency",
    targetPath: ["metrics", "equilibrium"],
    dependencyPath: ["market", "supply"]
  }]);

  const selfDiagnostics = validationDiagnostics(
    normalizeKpSemanticDerivedGraphInput(
      fixture.compiled,
      [self, fixture.revenue]
    )
  );
  assert.deepEqual(projectDiagnostics(selfDiagnostics), [{
    code: "self-derived-dependency",
    sourceId: "fixture.self-dependency",
    targetPath: ["metrics", "equilibrium"],
    dependencyPath: ["metrics", "equilibrium"]
  }]);
  assert.equal(fixture.computeCalls(), 0);
});

test("duplicate target definitions report one stable local diagnostic", () => {
  const fixture = createFixture();
  const target = fixture.handles.refs.metrics.equilibrium;
  const duplicate = createDefinitionSource({
    derivationId: fixture.equilibrium.id,
    targetSlotId: target.slotId,
    dependencySlotIds: [fixture.handles.refs.market.supply.slotId],
    sourceId: "zz.fixture.duplicate-definition"
  });
  const diagnostics = validationDiagnostics(
    normalizeKpSemanticDerivedGraphInput(fixture.compiled, [
      fixture.equilibrium,
      duplicate,
      fixture.revenue
    ])
  );

  assert.deepEqual(projectDiagnostics(diagnostics), [{
    code: "duplicate-derived-definition",
    sourceId: "zz.fixture.duplicate-definition",
    targetPath: ["metrics", "equilibrium"],
    dependencyPath: null
  }]);
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
    handles,
    equilibrium,
    revenue,
    computeCalls: () => computeCalls
  };
}

function createDefinitionSource(input: {
  readonly derivationId: KpSemanticDerivationId;
  readonly targetSlotId: KpSemanticSlotId;
  readonly dependencySlotIds: readonly KpSemanticSlotId[];
  readonly sourceId: string;
}): KpSemanticStateDerivationDefinitionSource {
  return Object.freeze({
    schemaVersion: "kp.semantic-state-derivation-definition.v1",
    kind: "semantic-state-derivation-definition",
    declaration: Object.freeze({
      schemaVersion: "kp.semantic-derived-binding.v1",
      kind: "semantic-derived-binding",
      derivationId: input.derivationId,
      slotId: input.targetSlotId,
      dependencies: Object.freeze(input.dependencySlotIds.map(
        (slotId): KpSemanticDerivedDependencyReference => Object.freeze({
          schemaVersion: "kp.semantic-derived-dependency.v1",
          kind: "semantic-derived-dependency",
          slotId
        })
      )),
      sourceId: input.sourceId
    })
  });
}

function validationDiagnostics(
  input: KpSemanticDerivedGraphInput
): readonly KpSemanticDerivedGraphDiagnostic[] {
  try {
    validateKpSemanticDerivedGraphInput(input);
  } catch (error) {
    if (error instanceof KpSemanticDerivedGraphValidationError) {
      return error.diagnostics;
    }
    throw error;
  }
  throw new Error("Expected derived graph validation to fail.");
}

function projectDiagnostics(
  diagnostics: readonly KpSemanticDerivedGraphDiagnostic[]
) {
  return diagnostics.map((diagnostic) => ({
    code: diagnostic.code,
    sourceId: diagnostic.sourceId,
    targetPath: diagnostic.targetPath,
    dependencyPath: diagnostic.dependencyPath
  }));
}
