import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpSemanticMotionPrecedence,
  compileKpSemanticMotionRoleCohorts,
  isKpVerifiedSemanticMotionPrecedence,
  type KpSemanticMotionPrecedenceSpec,
  type KpVerifiedSemanticMotionRoleCohorts
} from "../src/domain-ir/public-api.ts";
import {
  cancellationSemanticMotionStructureContract,
  createCancellationSemanticMotionFixture,
  createDistributionSemanticMotionFixture,
  createQuotientSemanticMotionFixture,
  distributionSemanticMotionStructureContract,
  quotientSemanticMotionStructureContract,
  type KpSemanticMotionCompilerTestFixture
} from "./fixtures/semantic-motion-compiler-fixtures.ts";

test("three operations compile distinct causal DAGs into deterministic semantic layers", () => {
  const quotientFixture = createQuotientSemanticMotionFixture();
  const distributionFixture = createDistributionSemanticMotionFixture();
  const cancellationFixture = createCancellationSemanticMotionFixture();
  const cases = [
    [quotientFixture, structureFor(quotientFixture, quotientSemanticMotionStructureContract()), quotientPrecedence()],
    [distributionFixture, structureFor(distributionFixture, distributionSemanticMotionStructureContract()), distributionPrecedence()],
    [cancellationFixture, structureFor(cancellationFixture, cancellationSemanticMotionStructureContract()), cancellationPrecedence()]
  ] as const;
  for (const [fixture, structure, spec] of cases) {
    const first = compileKpSemanticMotionPrecedence({ request: fixture.request, structure, spec });
    const second = compileKpSemanticMotionPrecedence({ request: fixture.request, structure, spec });
    assert.equal(first.status, "verified", fixture.request.id);
    assert.equal(second.status, "verified", fixture.request.id);
    if (first.status !== "verified" || second.status !== "verified") continue;
    assert.equal(isKpVerifiedSemanticMotionPrecedence(first.precedence), true);
    assert.deepEqual(first.precedence.topologicalLayers, second.precedence.topologicalLayers);
    assert.equal(JSON.stringify(first.precedence).match(/duration|easing|progress|geometry/g), null);
  }
});

test("cycle missing references disconnected events and authored physical timing fail closed", () => {
  const fixture = createCancellationSemanticMotionFixture();
  const structure = structureFor(fixture, cancellationSemanticMotionStructureContract());
  const base = cancellationPrecedence();
  const malformed = {
    ...base,
    durationMs: 800,
    events: [...base.events, event("event.disconnected", "orient", ["cohort.missing"])],
    edges: [
      ...base.edges,
      { beforeEventId: "event.native-ready", afterEventId: "event.contact" }
    ]
  } as KpSemanticMotionPrecedenceSpec;
  const result = compileKpSemanticMotionPrecedence({
    request: fixture.request,
    structure,
    spec: malformed
  });
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  const codes = new Set(result.issues.map(({ code }) => code));
  [
    "semantic-motion.precedence.physical-authority",
    "semantic-motion.precedence.event-reference",
    "semantic-motion.precedence.cycle"
  ].forEach((code) => assert.equal(codes.has(code), true, code));
});

function structureFor(
  fixture: KpSemanticMotionCompilerTestFixture,
  contract: ReturnType<typeof quotientSemanticMotionStructureContract>
): KpVerifiedSemanticMotionRoleCohorts {
  const result = compileKpSemanticMotionRoleCohorts({ request: fixture.request, lifecycle: fixture.lifecycle, contract });
  if (result.status !== "verified") throw new Error(`Structure fixture ${fixture.request.id} failed.`);
  return result.structure;
}

function quotientPrecedence(): KpSemanticMotionPrecedenceSpec {
  return chain([
    event("event.orient", "orient", ["cohort.quotient.operator-fusion"]),
    event("event.clear-enclosures", "clearance", ["cohort.quotient.arguments"]),
    event("event.arguments-depart", "departure", ["cohort.quotient.arguments"]),
    event("event.arguments-arrive", "arrival", ["cohort.quotient.arguments"]),
    attachmentEvent("event.target-attachment", "attachment.target-operator"),
    readyEvent()
  ]);
}

function distributionPrecedence(): KpSemanticMotionPrecedenceSpec {
  return chain([
    event("event.reserve-products", "orient", ["cohort.distribution.addends"]),
    event("event.factor-departs", "departure", ["cohort.distribution.factors"]),
    event("event.factor-copies-arrive", "arrival", ["cohort.distribution.factors"]),
    attachmentEvent("event.connector-attached", "attachment.distribution.connector"),
    event("event.products-settled", "settlement", ["cohort.distribution.addends"]),
    readyEvent()
  ]);
}

function cancellationPrecedence(): KpSemanticMotionPrecedenceSpec {
  return chain([
    event("event.orient", "orient", ["cohort.cancellation.inverse-pair"]),
    event("event.contact", "contact", ["cohort.cancellation.inverse-pair"]),
    event("event.retire", "retirement", ["cohort.cancellation.inverse-pair"]),
    event("event.survivors-settle", "settlement", ["cohort.cancellation.survivors"]),
    readyEvent()
  ]);
}

function chain(events: readonly ReturnType<typeof event>[]): KpSemanticMotionPrecedenceSpec {
  return {
    events,
    edges: events.slice(1).map((current, index) => ({
      beforeEventId: events[index]!.id,
      afterEventId: current.id
    }))
  };
}

function event(
  id: string,
  kind: Exclude<Parameters<typeof semanticEvent>[0]["kind"], "native-target-ready">,
  cohortIds: readonly string[]
) {
  return semanticEvent({ id, kind, cohortIds, attachmentIds: [], correspondenceRecordIds: [], summary: id });
}

function attachmentEvent(id: string, attachmentId: string) {
  return semanticEvent({ id, kind: "attachment", cohortIds: [], attachmentIds: [attachmentId], correspondenceRecordIds: [], summary: id });
}

function readyEvent() {
  return semanticEvent({ id: "event.native-ready", kind: "native-target-ready", cohortIds: [], attachmentIds: [], correspondenceRecordIds: [], summary: "Native target ready." });
}

function semanticEvent(input: KpSemanticMotionPrecedenceSpec["events"][number]) {
  return input;
}
