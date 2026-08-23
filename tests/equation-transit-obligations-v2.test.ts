import assert from "node:assert/strict";
import test from "node:test";
import {
  compileKpEquationGrammarV2,
  type KpCompiledEquationGrammarV2,
  type KpEquationGrammarV2Input
} from "../src/domain-ir/equation-grammar-v2.ts";
import {
  resolveKpEquationGrammarV2Operations
} from "../src/domain-ir/equation-grammar-v2-operation-resolution.ts";
import {
  resolveKpEquationProjectionChoreographiesV2
} from "../src/domain-ir/equation-projection-choreography-v2.ts";
import {
  compileKpEquationTransitObligationsV2,
  isKpCompiledEquationTransitObligationsV2,
  type KpEquationTransitionTransitIntentV2
} from "../src/domain-ir/equation-transit-obligations-v2.ts";

test("semantic boundary and cohort intents compile without routes or timing", () => {
  const { grammar, choreography } = fixture();
  const result = compileKpEquationTransitObligationsV2({
    grammar,
    choreography,
    intents: [intent]
  });
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;
  assert.equal(isKpCompiledEquationTransitObligationsV2(
    result.obligations
  ), true);
  const transition = result.obligations.transitions[0]!;
  assert.strictEqual(
    transition.semanticOperation,
    choreography.transitions[0]!.semanticOperation
  );
  assert.deepEqual(transition.transitRecords[0], {
    recordId: "record.x",
    relation: "identity",
    sourceEntityIds: ["entity.x"],
    targetEntityIds: ["entity.x"],
    boundaryIntentIds: ["boundary.equals"],
    routeAuthority: "renderer-measured-route",
    timingAuthority: "registered-renderer-profile"
  });
  assert.deepEqual(transition.arrivals[0], {
    id: "arrival.term-and-connector",
    kind: "semantic-target-cohort",
    recordIds: ["record.x", "record.plus"],
    targetEntityIds: ["entity.x"],
    connectorEntityIds: ["entity.plus"],
    geometryAuthority: "native-target-ink",
    timingAuthority: "registered-renderer-profile",
    handoff: "settle-before-native-target-ownership"
  });
  assert.equal(JSON.stringify(result.obligations).includes("duration"), false);
  assert.equal(JSON.stringify(result.obligations).includes("path"), false);
});

test("ungrouped target records receive deterministic individual arrivals", () => {
  const { grammar, choreography } = fixture();
  const result = compileKpEquationTransitObligationsV2({
    grammar,
    choreography
  });
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;
  assert.deepEqual(result.obligations.transitions[0]!.arrivals.map(({ id }) =>
    id), [
    "arrival.transition.0.record.x",
    "arrival.transition.0.record.plus"
  ]);
});

test("unknown semantics, duplicate cohorts, and caller motion fail closed", () => {
  const { grammar, choreography } = fixture();
  const result = compileKpEquationTransitObligationsV2({
    grammar,
    choreography,
    intents: [{
      ...intent,
      boundaries: [{
        ...intent.boundaries[0]!,
        boundaryEntityIds: ["entity.missing"],
        path: "M0 0"
      } as KpEquationTransitionTransitIntentV2["boundaries"][number]],
      arrivals: [intent.arrivals[0]!, {
        ...intent.arrivals[0]!,
        id: "arrival.duplicate"
      }]
    }]
  });
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  const codes = new Set(result.diagnostics.map(({ code }) => code));
  assert.equal(codes.has("transit.unknown-boundary-entity"), true);
  assert.equal(codes.has("transit.duplicate-arrival"), true);
  assert.equal(codes.has("transit.caller-presentation"), true);
});

const intent: KpEquationTransitionTransitIntentV2 = {
  transitionId: "transition.0",
  boundaries: [{
    id: "boundary.equals",
    kind: "preserve-readable-semantic-boundary",
    boundaryEntityIds: ["entity.equals"],
    crossingRecordIds: ["record.x"]
  }],
  arrivals: [{
    id: "arrival.term-and-connector",
    kind: "join-semantic-target-cohort",
    recordIds: ["record.x", "record.plus"],
    targetEntityIds: ["entity.x"],
    connectorEntityIds: ["entity.plus"]
  }]
};

function fixture(): {
  readonly grammar: KpCompiledEquationGrammarV2;
  readonly choreography: ReturnType<typeof resolvedChoreography>;
} {
  const compiled = compileKpEquationGrammarV2(input());
  assert.equal(compiled.status, "compiled");
  if (compiled.status !== "compiled") throw new Error("Fixture failed.");
  return {
    grammar: compiled.grammar,
    choreography: resolvedChoreography(compiled.grammar)
  };
}

function resolvedChoreography(grammar: KpCompiledEquationGrammarV2) {
  const operations = resolveKpEquationGrammarV2Operations(grammar);
  assert.equal(operations.status, "resolved");
  if (operations.status !== "resolved") throw new Error("Fixture failed.");
  const projection = resolveKpEquationProjectionChoreographiesV2({
    grammar,
    operations: operations.resolution
  });
  assert.equal(projection.status, "resolved");
  if (projection.status !== "resolved") throw new Error("Fixture failed.");
  return projection.choreography;
}

function input(): KpEquationGrammarV2Input {
  return {
    schemaVersion: "kp.equation-grammar.v2",
    id: "grammar.equation.transit",
    assetId: "animation.equation.transit",
    policyEpochId: "policy.animation.governance-v2.preview.1",
    semanticSource: {
      sourceId: "source.equation.transit",
      revisionId: "revision.1",
      operationPacks: [{ packId: "kp.core", version: "1.0.0" }]
    },
    clock: { authority: "kp.shared-normalized-clock.v1" },
    states: [{
      id: "state.0",
      objectIds: ["object.0"],
      entityIds: ["entity.x", "entity.equals"]
    }, {
      id: "state.1",
      objectIds: ["object.1"],
      entityIds: ["entity.x", "entity.equals", "entity.plus"]
    }],
    transitions: [{
      id: "transition.0",
      transformationId: "transformation.0",
      sourceStateId: "state.0",
      targetStateId: "state.1",
      operation: {
        operationId: "kp.core.persist",
        semanticClass: "transformation",
        roleBindings: {
          before: ["entity.x"],
          after: ["entity.x", "entity.plus"]
        },
        correspondenceMap: {
          id: "correspondence.0",
          records: [{
            id: "record.x",
            relation: "identity",
            sourceSelectorIds: ["entity.x"],
            targetSelectorIds: ["entity.x"],
            summary: "x crosses into the target expression."
          }, {
            id: "record.plus",
            relation: "introduction",
            sourceSelectorIds: [],
            targetSelectorIds: ["entity.plus"],
            summary: "The connector joins its arriving term."
          }]
        },
        semanticAuthorityIds: ["law.fixture.transit"]
      },
      projection: { intent: "equivalence" },
      typographyPolicyId: "typography.equation.stage.v2",
      typographyRequirements: { largeOperators: [] },
      teachingIntent: {
        kind: "transmit",
        primaryEntityIds: ["entity.x"],
        secondaryEntityIds: ["entity.equals", "entity.plus"],
        summary: "Preserve the relation while x joins the target."
      }
    }]
  };
}
