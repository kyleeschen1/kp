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

test("cross-schema targets and dependencies remain distinct diagnostics", () => {
  const fixture = createFixture();
  const foreign = createFixture("lesson.foreign-derived-graph");
  const target = fixture.handles.refs.metrics.equilibrium;
  const foreignDependency = createDefinitionSource({
    derivationId: fixture.equilibrium.id,
    targetSlotId: target.slotId,
    dependencySlotIds: [foreign.handles.refs.market.supply.slotId],
    sourceId: "fixture.foreign-dependency"
  });
  const dependencyDiagnostics = validationDiagnostics(
    normalizeKpSemanticDerivedGraphInput(fixture.compiled, [
      foreignDependency,
      fixture.revenue
    ])
  );
  assert.deepEqual(projectDiagnostics(dependencyDiagnostics), [{
    code: "cross-schema-derived-dependency",
    sourceId: "fixture.foreign-dependency",
    targetPath: ["metrics", "equilibrium"],
    dependencyPath: null
  }]);

  const foreignTarget = createDefinitionSource({
    derivationId: foreign.equilibrium.id,
    targetSlotId: foreign.handles.refs.metrics.equilibrium.slotId,
    dependencySlotIds: [fixture.handles.refs.market.supply.slotId],
    sourceId: "fixture.foreign-target"
  });
  const targetDiagnostics = validationDiagnostics(
    normalizeKpSemanticDerivedGraphInput(fixture.compiled, [
      fixture.equilibrium,
      fixture.revenue,
      foreignTarget
    ])
  );
  assert.deepEqual(projectDiagnostics(targetDiagnostics), [{
    code: "cross-schema-derived-target",
    sourceId: "fixture.foreign-target",
    targetPath: null,
    dependencyPath: null
  }]);
});

test("target kind and derivation identity must match compiled authority", () => {
  const fixture = createFixture();
  const invalidTarget = createDefinitionSource({
    derivationId: fixture.compiled.identityScope.derivation("invalid.supply"),
    targetSlotId: fixture.handles.refs.market.supply.slotId,
    dependencySlotIds: [fixture.handles.refs.market.demand.slotId],
    sourceId: "fixture.invalid-target"
  });
  const targetDiagnostics = validationDiagnostics(
    normalizeKpSemanticDerivedGraphInput(fixture.compiled, [
      fixture.equilibrium,
      fixture.revenue,
      invalidTarget
    ])
  );
  assert.deepEqual(projectDiagnostics(targetDiagnostics), [{
    code: "invalid-derived-target",
    sourceId: "fixture.invalid-target",
    targetPath: ["market", "supply"],
    dependencyPath: null
  }]);

  const wrongIdentity = createDefinitionSource({
    derivationId: fixture.compiled.identityScope.derivation(
      "wrong.equilibrium"
    ),
    targetSlotId: fixture.handles.refs.metrics.equilibrium.slotId,
    dependencySlotIds: [fixture.handles.refs.market.supply.slotId],
    sourceId: "fixture.wrong-identity"
  });
  const identityDiagnostics = validationDiagnostics(
    normalizeKpSemanticDerivedGraphInput(fixture.compiled, [
      wrongIdentity,
      fixture.revenue
    ])
  );
  assert.deepEqual(projectDiagnostics(identityDiagnostics), [{
    code: "incompatible-derived-identity",
    sourceId: "fixture.wrong-identity",
    targetPath: ["metrics", "equilibrium"],
    dependencyPath: null
  }]);
});

test("durable declarations cannot replace definition-local compute capability", () => {
  const fixture = createFixture();
  const declarationOnly = createDefinitionSource({
    derivationId: fixture.equilibrium.id,
    targetSlotId: fixture.handles.refs.metrics.equilibrium.slotId,
    dependencySlotIds: [fixture.handles.refs.market.supply.slotId],
    sourceId: "fixture.declaration-only",
    computeCapability: false
  });
  const diagnostics = validationDiagnostics(
    normalizeKpSemanticDerivedGraphInput(fixture.compiled, [
      declarationOnly,
      fixture.revenue
    ])
  );

  assert.deepEqual(projectDiagnostics(diagnostics), [{
    code: "missing-derived-compute-capability",
    sourceId: "fixture.declaration-only",
    targetPath: ["metrics", "equilibrium"],
    dependencyPath: null
  }]);
  assert.equal(fixture.computeCalls(), 0);
});

test("direct cycles fail before their compute callback", () => {
  const fixture = createCycleFixture(({ alpha }) => ({
    alpha: [alpha],
    beta: [],
    gamma: []
  }));
  const diagnostics = validationDiagnostics(fixture.graph);

  assert.equal(diagnostics[0]?.code, "self-derived-dependency");
  assert.equal(fixture.computeCalls(), 0);
});

test("two-node dependency cycles report one exact closed path", () => {
  const fixture = createCycleFixture(({ alpha, beta }) => ({
    alpha: [beta],
    beta: [alpha],
    gamma: []
  }));
  const diagnostics = validationDiagnostics(fixture.graph);

  assert.equal(diagnostics.length, 1);
  assert.equal(diagnostics[0]?.code, "cyclic-derived-dependency");
  assert.deepEqual(diagnostics[0]?.cyclePaths, [
    ["alpha"],
    ["beta"],
    ["alpha"]
  ]);
  assert.equal(fixture.computeCalls(), 0);
});

test("long dependency cycles canonicalize independently of definition order", () => {
  const fixture = createCycleFixture(({ alpha, beta, gamma }) => ({
    alpha: [beta],
    beta: [gamma],
    gamma: [alpha]
  }), true);
  const diagnostics = validationDiagnostics(fixture.graph);

  assert.equal(diagnostics.length, 1);
  assert.equal(diagnostics[0]?.code, "cyclic-derived-dependency");
  assert.deepEqual(diagnostics[0]?.cyclePaths, [
    ["alpha"],
    ["beta"],
    ["gamma"],
    ["alpha"]
  ]);
  assert.equal(fixture.computeCalls(), 0);
});

function createFixture(
  namespace = "lesson.derived-graph-normalization"
) {
  let computeCalls = 0;
  const compiled = compileKpSemanticStateSchema(
    namespace,
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

function createCycleFixture(
  dependencies: (slots: Readonly<{
    alpha: KpSemanticSlotId;
    beta: KpSemanticSlotId;
    gamma: KpSemanticSlotId;
    seed: KpSemanticSlotId;
  }>) => Readonly<{
    alpha: readonly KpSemanticSlotId[];
    beta: readonly KpSemanticSlotId[];
    gamma: readonly KpSemanticSlotId[];
  }>,
  reverseDefinitions = false
) {
  let computeCalls = 0;
  const compiled = compileKpSemanticStateSchema(
    "lesson.derived-cycle",
    kpStateGroup({
      seed: kpStateValue(1),
      alpha: kpStateDerived<number>(),
      beta: kpStateDerived<number>(),
      gamma: kpStateDerived<number>()
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const slots = Object.freeze({
    alpha: handles.refs.alpha.slotId,
    beta: handles.refs.beta.slotId,
    gamma: handles.refs.gamma.slotId,
    seed: handles.refs.seed.slotId
  });
  const dependencySlots = dependencies(slots);
  const definitionFor = (
    encodedPath: "alpha" | "beta" | "gamma",
    dependencySlotIds: readonly KpSemanticSlotId[]
  ) => {
    const ordinal = compiled.leafIndex[encodedPath];
    if (ordinal === undefined) {
      throw new Error(`Missing cycle fixture path ${encodedPath}.`);
    }
    const leaf = compiled.leaves[ordinal]!;
    return createDefinitionSource({
      derivationId: leaf.identities.derivationId,
      targetSlotId: leaf.identities.slotId,
      dependencySlotIds: dependencySlotIds.length === 0
        ? [slots.seed]
        : dependencySlotIds,
      sourceId: leaf.identities.sourceIds.derivation,
      compute: () => {
        computeCalls += 1;
        return 1;
      }
    });
  };
  const definitions = [
    definitionFor("alpha", dependencySlots.alpha),
    definitionFor("beta", dependencySlots.beta),
    definitionFor("gamma", dependencySlots.gamma)
  ];
  return {
    graph: normalizeKpSemanticDerivedGraphInput(
      compiled,
      reverseDefinitions ? [...definitions].reverse() : definitions
    ),
    computeCalls: () => computeCalls
  };
}

function createDefinitionSource(input: {
  readonly derivationId: KpSemanticDerivationId;
  readonly targetSlotId: KpSemanticSlotId;
  readonly dependencySlotIds: readonly KpSemanticSlotId[];
  readonly sourceId: string;
  readonly computeCapability?: false;
  readonly compute?: () => unknown;
}): KpSemanticStateDerivationDefinitionSource {
  const definition = Object.freeze({
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
    }),
    ...(input.computeCapability === false
      ? {}
      : { compute: input.compute ?? (() => {
            throw new Error("Validation must not invoke compute capability.");
          }) })
  });
  return definition;
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
