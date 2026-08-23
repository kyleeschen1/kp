import {
  compileKpEquationGrammarV2,
  type KpEquationGrammarV2Input
} from "../../src/domain-ir/equation-grammar-v2.ts";
import {
  resolveKpEquationGrammarV2Operations
} from "../../src/domain-ir/equation-grammar-v2-operation-resolution.ts";
import {
  resolveKpEquationProjectionChoreographiesV2
} from "../../src/domain-ir/equation-projection-choreography-v2.ts";
import {
  compileKpEquationTransitObligationsV2,
  type KpEquationTransitionTransitIntentV2
} from "../../src/domain-ir/equation-transit-obligations-v2.ts";

export function compileKpEquationGovernanceV2RouteFixture() {
  const grammar = compileKpEquationGovernanceV2GrammarFixture();
  const operations = resolveKpEquationGrammarV2Operations(grammar.grammar);
  if (operations.status !== "resolved") throw new Error("Fixture operations failed.");
  const projection = resolveKpEquationProjectionChoreographiesV2({
    grammar: grammar.grammar,
    operations: operations.resolution
  });
  if (projection.status !== "resolved") throw new Error("Fixture projection failed.");
  const obligations = compileKpEquationTransitObligationsV2({
    grammar: grammar.grammar,
    choreography: projection.choreography,
    intents: [kpEquationGovernanceV2RouteFixtureIntent]
  });
  if (obligations.status !== "compiled") throw new Error("Fixture transit failed.");
  return obligations.obligations;
}

export function compileKpEquationGovernanceV2GrammarFixture() {
  const grammar = compileKpEquationGrammarV2(input());
  if (grammar.status !== "compiled") throw new Error("Fixture grammar failed.");
  return grammar;
}

export const kpEquationGovernanceV2RouteFixtureIntent:
  KpEquationTransitionTransitIntentV2 = {
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

function input(): KpEquationGrammarV2Input {
  return {
    schemaVersion: "kp.equation-grammar.v2",
    id: "grammar.equation.route-certificate",
    assetId: "animation.equation.route-certificate",
    policyEpochId: "policy.animation.governance-v2.preview.1",
    semanticSource: {
      sourceId: "source.equation.route-certificate",
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
            summary: "x crosses the relation."
          }, {
            id: "record.plus",
            relation: "introduction",
            sourceSelectorIds: [],
            targetSelectorIds: ["entity.plus"],
            summary: "The connector joins x."
          }]
        },
        semanticAuthorityIds: ["law.fixture.route"]
      },
      projection: { intent: "equivalence" },
      typographyPolicyId: "typography.equation.stage.v2",
      typographyRequirements: { largeOperators: [] },
      teachingIntent: {
        kind: "transmit",
        primaryEntityIds: ["entity.x"],
        secondaryEntityIds: ["entity.equals", "entity.plus"],
        summary: "Clear the relation and settle with the connector."
      }
    }]
  };
}
