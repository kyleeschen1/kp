import assert from "node:assert/strict";
import test from "node:test";

import {
  kpEquationGenerationPressureFixtures,
  validateKpEquationGenerationPressureFixture
} from "../src/authoring/equation-generation-pressure-contract.ts";

test("three contrasting LLM-shaped requests use only governed semantic vocabulary", () => {
  assert.deepEqual(
    kpEquationGenerationPressureFixtures.map(({ scenario }) => scenario),
    ["function-wrap", "cancellation", "distribution-factoring"]
  );
  assert.equal(
    new Set(kpEquationGenerationPressureFixtures.map(({ id }) => id)).size,
    3
  );
  for (const fixture of kpEquationGenerationPressureFixtures) {
    assert.deepEqual(validateKpEquationGenerationPressureFixture(fixture), []);
    assert.equal(fixture.successCriteria.maximumRepairCount, 0);
    assert.equal(fixture.repairAccounting.unit, "validator-round");
  }
});

test("pressure requests contain no geometry, timing, renderer, or recipe authority", () => {
  const requests = JSON.stringify(
    kpEquationGenerationPressureFixtures.map(({ request }) => request)
  );
  assert.doesNotMatch(
    requests,
    /duration|delay|timing|geometry|coordinate|trajectory|keyframe|renderer|recipe|opacity|scale|translate/i
  );
});

test("malformed requests fail with stable paths instead of falling back", () => {
  const canonical = kpEquationGenerationPressureFixtures[0];
  const malformed = {
    ...canonical,
    request: {
      ...canonical.request,
      durationMs: 400,
      operation: {
        ...canonical.request.operation,
        roleBindings: {
          "content-before": ["source.argument.x"],
          invented: ["target.guess"]
        }
      }
    }
  };
  const issues = validateKpEquationGenerationPressureFixture(malformed);

  assert.ok(issues.some(({ code, path }) =>
    code === "pressure.fixture.shape" && path === "$.request.durationMs"
  ));
  assert.ok(issues.some(({ code, message }) =>
    code === "pressure.fixture.request" &&
    message.includes("equation-llm.role.missing")
  ));
  assert.ok(issues.some(({ code, message }) =>
    code === "pressure.fixture.request" &&
    message.includes("equation-llm.role.unknown")
  ));
});

test("fixture vocabulary cannot silently drift from the governed operation", () => {
  const canonical = kpEquationGenerationPressureFixtures[2];
  const issues = validateKpEquationGenerationPressureFixture({
    ...canonical,
    allowedVocabulary: {
      ...canonical.allowedVocabulary,
      roleIds: ["factor-before", "products-after"]
    },
    successCriteria: {
      ...canonical.successCriteria,
      maximumRepairCount: 1
    }
  });

  assert.deepEqual(new Set(issues.map(({ code }) => code)), new Set([
    "pressure.fixture.vocabulary",
    "pressure.fixture.criteria"
  ]));
});
