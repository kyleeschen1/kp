import assert from "node:assert/strict";
import test from "node:test";

import { createKpSemanticStateSupplyTaxFamilyAuthoring } from
  "../src/experiments/typed-linear-supply-demand/semantic-state-supply-tax-family.ts";
import {
  declareKpSemanticStateComposition,
  declareKpSemanticStateCompositionGroup,
  declareKpSemanticStateCompositionIndependent,
  declareKpSemanticStateCompositionMember,
  declareKpSemanticStateCompositionSequence,
  type KpSemanticStateCompositionDeclarationError,
  type KpSemanticStateCompositionNodeDeclaration
} from "../src/semantic-state/state-family-composition-declaration.ts";

function member(name: string, applicationId = name) {
  const fixture = createKpSemanticStateSupplyTaxFamilyAuthoring();
  return declareKpSemanticStateCompositionMember({
    name,
    sourceId: `test.composition.${name}`,
    application: fixture.family.prepareApplication({
      applicationId,
      parameters: { finalTaxAmount: { numerator: "2", denominator: "1" } },
      sourceId: `test.application.${name}`
    })
  });
}

test("composition grammar keeps sequence nesting and independence disjoint", () => {
  const demand = member("demand");
  const tax = member("tax");
  const cohort = declareKpSemanticStateCompositionIndependent({
    name: "policy",
    sourceId: "test.composition.policy",
    evidence: {
      id: "demand-tax-disjoint",
      sourceId: "test.evidence.demand-tax-disjoint"
    },
    members: [tax, demand]
  });
  const nested = declareKpSemanticStateCompositionGroup({
    name: "market",
    sourceId: "test.composition.market",
    body: cohort
  });
  const sequence = declareKpSemanticStateCompositionSequence({
    name: "timeline",
    sourceId: "test.composition.timeline",
    members: [nested, member("settle")]
  });
  const declaration = declareKpSemanticStateComposition({
    namespace: "economics.supply-tax.family-authoring",
    localId: "market-policy",
    sourceId: "test.composition.market-policy",
    root: sequence
  });

  assert.equal(declaration.root.kind, "sequence");
  assert.equal(declaration.root.members[0]?.kind, "group");
  assert.equal(nested.body.kind, "independent");
  assert.equal(cohort.evidence.kind, "demonstrated-independence");
  assert.equal(Object.isFrozen(declaration), true);
  assert.equal(Object.isFrozen(sequence.members), true);
  assert.equal(Object.isFrozen(cohort.members), true);
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(declaration)));
});

test("the node union narrows exhaustively without one permissive shape", () => {
  const summarize = (node: KpSemanticStateCompositionNodeDeclaration): string => {
    switch (node.kind) {
      case "member": return node.application.applicationId;
      case "sequence": return `sequence:${node.members.length}`;
      case "group": return `group:${node.body.kind}`;
      case "independent": return `independent:${node.evidence.id}`;
      default: return assertNever(node);
    }
  };

  assert.equal(summarize(member("tax")), "tax");
  assert.equal(
    summarize(declareKpSemanticStateCompositionSequence({
      name: "timeline",
      sourceId: "test.timeline",
      members: [member("demand")]
    })),
    "sequence:1"
  );
});

test("empty sequence and cohort declarations fail locally", () => {
  assert.equal(captureCode(() => declareKpSemanticStateCompositionSequence({
    name: "timeline",
    sourceId: "test.timeline",
    members: []
  })), "empty-sequence");
  assert.equal(captureCode(() => declareKpSemanticStateCompositionIndependent({
    name: "policy",
    sourceId: "test.policy",
    evidence: { id: "disjoint", sourceId: "test.disjoint" },
    members: []
  })), "empty-independent-cohort");
});

test("recursive and ambiguous declaration shapes are rejected", () => {
  const cyclic = {
    schemaVersion: "kp.semantic-state-composition-node.v1",
    kind: "group",
    name: "cycle",
    sourceId: "test.cycle"
  } as unknown as {
    schemaVersion: "kp.semantic-state-composition-node.v1";
    kind: "group";
    name: string;
    sourceId: string;
    body: KpSemanticStateCompositionNodeDeclaration;
  };
  (cyclic as { body: KpSemanticStateCompositionNodeDeclaration }).body = cyclic;
  assert.equal(captureCode(() => declareKpSemanticStateComposition({
    namespace: "test.composition",
    localId: "recursive",
    sourceId: "test.recursive",
    root: cyclic
  })), "recursive-declaration");

  const validMember = member("tax");
  const ambiguous = {
    ...validMember,
    members: [validMember]
  } as unknown as KpSemanticStateCompositionNodeDeclaration;
  assert.equal(captureCode(() => declareKpSemanticStateComposition({
    namespace: "test.composition",
    localId: "ambiguous",
    sourceId: "test.ambiguous",
    root: ambiguous
  })), "ambiguous-declaration-shape");
});

test("closures and cross-form fields fail at the static declaration boundary", () => {
  const validMember = member("tax");
  if (false) {
    // @ts-expect-error Type-only negative cases must remain unreachable.
    declareKpSemanticStateCompositionIndependent({
      name: "policy",
      sourceId: "test.policy",
      evidence: { id: "disjoint", sourceId: "test.disjoint" },
      // @ts-expect-error Independent cohorts contain only leaf applications.
      members: [declareKpSemanticStateCompositionGroup({
        name: "nested",
        sourceId: "test.nested",
        body: validMember
      })]
    });
    declareKpSemanticStateCompositionGroup({
      name: "market",
      sourceId: "test.market",
      body: validMember,
      // @ts-expect-error Group scope wraps one body and owns no implicit order.
      members: [validMember]
    });
    declareKpSemanticStateCompositionMember({
      name: "callback",
      sourceId: "test.callback",
      application: validMember.application,
      // @ts-expect-error Execution closures are not declaration truth.
      apply: () => undefined
    });
  }
});

function captureCode(run: () => unknown):
  KpSemanticStateCompositionDeclarationError["code"] {
  try {
    run();
  } catch (error) {
    return (error as KpSemanticStateCompositionDeclarationError).code;
  }
  throw new Error("Expected a composition declaration error.");
}

function assertNever(value: never): never {
  throw new Error(`Unexpected composition node ${JSON.stringify(value)}.`);
}
