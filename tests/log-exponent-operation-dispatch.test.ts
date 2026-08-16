import assert from "node:assert/strict";
import test from "node:test";

import {
  kpLogExponentOperationPresentationRegistry,
  requireKpLogExponentOperationPresentation
} from "../src/animation/log-exponent-operation-presentation-registry.ts";
import {
  kpLogExponentSymbolMotionDispatch
} from "../src/animation/log-exponent-symbol-motion.ts";
import {
  requireKpClosedDispatchEntry
} from "../src/domain-ir/equation-extension-registry.ts";
import {
  kpCanonicalLogExponentAuthoredProgram
} from "../src/semantic/log-exponent-authored-operations.ts";
import {
  kpLogExponentOperationDispatch
} from "../src/semantic/log-exponent-operation-dispatch.ts";

const operationKinds = kpCanonicalLogExponentAuthoredProgram.operations.map(
  ({ kind }) => kind
);
const operationIds = kpCanonicalLogExponentAuthoredProgram.operations.map(
  ({ id }) => id
);

test("log-exponent operation declarations close semantic and presentation dispatch", () => {
  assert.deepEqual(kpLogExponentOperationDispatch.ids, operationKinds);
  assert.deepEqual(kpLogExponentSymbolMotionDispatch.ids, operationKinds);
  assert.deepEqual(
    kpLogExponentOperationPresentationRegistry.ids,
    operationIds
  );
  assert.equal(Object.isFrozen(kpLogExponentOperationDispatch), true);
  assert.equal(Object.isFrozen(kpLogExponentSymbolMotionDispatch), true);
  assert.equal(Object.isFrozen(kpLogExponentOperationPresentationRegistry), true);
});

test("closed dispatch rejects unknown operations instead of choosing a visual fallback", () => {
  assert.throws(
    () => requireKpClosedDispatchEntry(
      kpLogExponentOperationDispatch,
      "invented-operation" as never
    ),
    /Unknown log-exponent operation dispatch id invented-operation/
  );
  assert.throws(
    () => requireKpLogExponentOperationPresentation("invented-operation"),
    /Unknown log-exponent presentation dispatch id invented-operation/
  );
});
