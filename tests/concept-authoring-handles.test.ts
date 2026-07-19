import assert from "node:assert/strict";
import test from "node:test";

import {
  defineCapability,
  defineConceptScope,
  defineProviderRef
} from "../src/authoring/public-api.ts";

test("authoring handles compile into frozen declarative references", () => {
  const equation = defineCapability({ id: "kp.equation", major: 1 });
  const provider = defineProviderRef({
    id: "linear-problems.exact-rational",
    protocol: "linear-problem.v1",
    version: "1.0.0"
  });
  const scope = defineConceptScope({ capabilities: [equation], providers: [provider] });

  assert.deepEqual(scope.capability(equation), { id: "kp.equation", major: 1 });
  assert.deepEqual(scope.provider(provider), {
    id: "linear-problems.exact-rational",
    protocol: "linear-problem.v1",
    version: "1.0.0"
  });
  assert.equal(Object.isFrozen(scope), true);
  assert.equal(Object.isFrozen(scope.capability(equation)), true);
});

test("authoring scopes reject forged unavailable handles at runtime", () => {
  const equation = defineCapability({ id: "kp.equation", major: 1 });
  const scope = defineConceptScope({ capabilities: [equation], providers: [] });
  assert.throws(() => scope.capability({
    kind: "capability-handle",
    id: "kp.equation",
    major: 2
  } as unknown as typeof equation), /not available/);
});
