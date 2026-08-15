import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpSemanticMotionPrecedence,
  compileKpSemanticMotionRoleCohorts,
  isKpVerifiedSemanticMotionPrecedence,
  type KpVerifiedSemanticMotionRoleCohorts
} from "../src/domain-ir/public-api.ts";
import {
  cancellationSemanticMotionStructureContract,
  cancellationSemanticMotionPrecedenceSpec,
  createCancellationSemanticMotionFixture,
  createDistributionSemanticMotionFixture,
  createQuotientSemanticMotionFixture,
  distributionSemanticMotionStructureContract,
  distributionSemanticMotionPrecedenceSpec,
  quotientSemanticMotionPrecedenceSpec,
  quotientSemanticMotionStructureContract,
  type KpSemanticMotionCompilerTestFixture
} from "./fixtures/semantic-motion-compiler-fixtures.ts";

test("three operations compile distinct causal DAGs into deterministic semantic layers", () => {
  const quotientFixture = createQuotientSemanticMotionFixture();
  const distributionFixture = createDistributionSemanticMotionFixture();
  const cancellationFixture = createCancellationSemanticMotionFixture();
  const cases = [
    [quotientFixture, structureFor(quotientFixture, quotientSemanticMotionStructureContract()), quotientSemanticMotionPrecedenceSpec()],
    [distributionFixture, structureFor(distributionFixture, distributionSemanticMotionStructureContract()), distributionSemanticMotionPrecedenceSpec()],
    [cancellationFixture, structureFor(cancellationFixture, cancellationSemanticMotionStructureContract()), cancellationSemanticMotionPrecedenceSpec()]
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
  const base = cancellationSemanticMotionPrecedenceSpec();
  const malformed = {
    ...base,
    durationMs: 800,
    events: [...base.events, event("event.disconnected", "orient", ["cohort.missing"])],
    edges: [
      ...base.edges,
      { beforeEventId: "event.native-ready", afterEventId: "event.contact" }
    ]
  } as typeof base;
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

function event(
  id: string,
  kind: "orient",
  cohortIds: readonly string[]
) {
  return { id, kind, cohortIds, attachmentIds: [], correspondenceRecordIds: [], summary: id } as const;
}
