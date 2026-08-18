import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileKpEquationTransformSeries } from
  "../src/authoring/compile-equation-transform-series.ts";
import {
  KP_BOTH_SIDES_AUTHORING_PACK_PIN,
  kpEquationSeriesBothSidesAuthoringDeclarations,
  type KpEquationSeriesBothSidesAuthoringDeclaration,
  type KpEquationSeriesBothSidesSemanticArguments,
  type KpEquationSeriesVerifiedSemanticSource
} from "../src/authoring/equation-series-both-sides-authoring.ts";
import { kpEquationSeriesOperationRegistry } from
  "../src/authoring/equation-series-operation-declarations.ts";

test("all six both-sides registrations are governed equation-series declarations", () => {
  assert.deepEqual(
    kpEquationSeriesBothSidesAuthoringDeclarations.map(
      ({ registrationId }) => registrationId
    ),
    [
      "addBothSides",
      "subtractBothSides",
      "multiplyBothSides",
      "divideBothSides",
      "applyNaturalLogBothSides",
      "divideBothSidesByLogBase"
    ]
  );
  for (const declaration of kpEquationSeriesBothSidesAuthoringDeclarations) {
    const exposed = kpEquationSeriesOperationRegistry.byId[
      declaration.operationId
    ];
    assert.ok(exposed, declaration.operationId);
    assert.equal(exposed.bothSides?.registrationId, declaration.registrationId);
    assert.deepEqual(exposed.bothSides?.operationPin,
      KP_BOTH_SIDES_AUTHORING_PACK_PIN);
    assert.deepEqual(exposed.roleIds, [
      "lhs",
      "rhs",
      "relation",
      "applied-operation"
    ]);
  }
});

test("each governed declaration compiles from exact pins roles and assumptions", () => {
  for (const declaration of kpEquationSeriesBothSidesAuthoringDeclarations) {
    const authority = sourceAuthority(declaration);
    const result = compileKpEquationTransformSeries({
      value: request(declaration, semanticArguments(declaration, authority)),
      governedSources: [authority]
    });
    assert.equal(result.status, "compiled", declaration.operationId);
    assert.equal(
      result.active?.runtime.plans[0]?.declaration.bothSides?.registrationId,
      declaration.registrationId
    );
  }
});

test("wrong pins absent source incomplete roles and assumptions have distinct repairs", () => {
  const declaration = kpEquationSeriesBothSidesAuthoringDeclarations.find(
    ({ registrationId }) => registrationId === "divideBothSides"
  )!;
  const authority = sourceAuthority(declaration);
  const valid = semanticArguments(declaration, authority);
  assert.equal(repairKind(declaration, {
    ...valid,
    operationPin: { packId: "kp.both-sides", version: "9.9.9" }
  }, [authority]), "operation-pin");
  assert.equal(repairKind(declaration, valid, []), "semantic-source");
  assert.equal(repairKind(declaration, {
    ...valid,
    roleBindings: {
      ...valid.roleBindings,
      rhs: []
    }
  }, [authority]), "invalid-role");
  assert.equal(repairKind(declaration, {
    ...valid,
    assumptionEvidenceIds: []
  }, [authority]), "assumption-evidence");
});

test("unapproved entities fail closed and preserve the prior valid candidate", () => {
  const declaration = kpEquationSeriesBothSidesAuthoringDeclarations.find(
    ({ registrationId }) => registrationId === "applyNaturalLogBothSides"
  )!;
  const authority = sourceAuthority(declaration);
  const valid = compileKpEquationTransformSeries({
    value: request(declaration, semanticArguments(declaration, authority)),
    governedSources: [authority]
  });
  assert.equal(valid.status, "compiled");
  const argumentsWithFabricatedEntity = semanticArguments(
    declaration,
    authority
  );
  const invalid = compileKpEquationTransformSeries({
    value: request(declaration, {
      ...argumentsWithFabricatedEntity,
      roleBindings: {
        ...argumentsWithFabricatedEntity.roleBindings,
        lhs: ["entity.fabricated"]
      }
    }),
    governedSources: [authority],
    previous: valid
  });
  assert.equal(invalid.status, "repair-required");
  assert.equal(invalid.repairs[0]?.kind, "unresolved-entity");
  assert.equal(invalid.active, valid.active);
});

test("model prose and renderer fields cannot become both-sides authority", () => {
  const declaration = kpEquationSeriesBothSidesAuthoringDeclarations[0]!;
  const authority = sourceAuthority(declaration);
  const proposed = request(declaration, undefined, "proposed");
  const unresolved = compileKpEquationTransformSeries({
    value: proposed,
    proposals: [{
      adjacencyId: "adjacency.governed.both-sides",
      kind: "single",
      operationId: declaration.operationId
    }],
    governedSources: [authority]
  });
  assert.equal(unresolved.status, "repair-required");
  assert.equal(unresolved.repairs[0]?.kind, "invalid-request");

  const withRenderer = semanticArguments(declaration, authority) as
    KpEquationSeriesBothSidesSemanticArguments & { durationMs: number };
  Object.assign(withRenderer, { durationMs: 400 });
  const rejected = compileKpEquationTransformSeries({
    value: request(declaration, withRenderer),
    governedSources: [authority]
  });
  assert.equal(rejected.status, "repair-required");
  assert.equal(rejected.repairs[0]?.phase, "request");
});

test("governance resolution stays declaration-driven and renderer-free", () => {
  const source = readFileSync(new URL(
    "../src/authoring/equation-series-both-sides-authoring.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source, /switch\s*\(/u);
  assert.doesNotMatch(source,
    /(?:HTMLElement|SVGElement|WebGL|requestAnimationFrame|setTimeout|durationMs|motionPath|renderer)/u);
});

function repairKind(
  declaration: KpEquationSeriesBothSidesAuthoringDeclaration,
  semanticArgumentsValue: KpEquationSeriesBothSidesSemanticArguments,
  governedSources: readonly KpEquationSeriesVerifiedSemanticSource[]
): string | undefined {
  const result = compileKpEquationTransformSeries({
    value: request(declaration, semanticArgumentsValue),
    governedSources
  });
  assert.equal(result.status, "repair-required");
  return result.repairs[0]?.kind;
}

function request(
  declaration: KpEquationSeriesBothSidesAuthoringDeclaration,
  semanticArgumentsValue?: KpEquationSeriesBothSidesSemanticArguments,
  mode: "explicit" | "proposed" = "explicit"
) {
  return {
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request",
    id: "series.governed.both-sides",
    states: [
      { id: "state.governed.before", latex: "x=1" },
      { id: "state.governed.after", latex: "x=1" }
    ],
    adjacencies: [{
      id: "adjacency.governed.both-sides",
      fromStateId: "state.governed.before",
      toStateId: "state.governed.after",
      intent: mode === "explicit" ? {
        mode,
        operationId: declaration.operationId,
        semanticArguments: semanticArgumentsValue
      } : {
        mode,
        instruction: "Apply the same verified operation to both branches."
      }
    }]
  };
}

function semanticArguments(
  declaration: KpEquationSeriesBothSidesAuthoringDeclaration,
  source: KpEquationSeriesVerifiedSemanticSource
): KpEquationSeriesBothSidesSemanticArguments {
  return {
    schemaVersion: "kp.equation-series.both-sides-intent.v1",
    sourcePin: {
      sourceId: source.sourceId,
      revisionId: source.revisionId
    },
    operationPin: { ...declaration.operationPin },
    roleBindings: {
      lhs: ["entity.equation.lhs"],
      rhs: ["entity.equation.rhs"],
      relation: ["entity.equation.equals"],
      "applied-operation": ["entity.operation.value"]
    },
    assumptionEvidenceIds: [
      ...declaration.requiredAssumptionEvidenceIds
    ]
  };
}

function sourceAuthority(
  declaration: KpEquationSeriesBothSidesAuthoringDeclaration
): KpEquationSeriesVerifiedSemanticSource {
  return {
    sourceId: "source.governed.equation",
    revisionId: "revision.governed.equation.v1",
    operationIds: [declaration.operationId],
    entityIds: [
      "entity.equation.lhs",
      "entity.equation.rhs",
      "entity.equation.equals",
      "entity.operation.value"
    ],
    assumptionEvidenceIds: [
      ...declaration.requiredAssumptionEvidenceIds
    ]
  };
}
