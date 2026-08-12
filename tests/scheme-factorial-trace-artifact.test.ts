import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileKpSchemeFactorialTraceArtifact,
  KP_SCHEME_FACTORIAL_MAX_TRANSITIONS,
  serializeKpSchemeFactorialTraceArtifact
} from "../scripts/compile-scheme-factorial-trace.ts";
import { readKpSchemeFactorialTraceArtifact } from
  "../src/semantic/scheme-factorial-trace-artifact.ts";

const artifactSource = readFileSync(new URL(
  "../src/semantic/scheme-factorial-trace.generated.json",
  import.meta.url
), "utf8");
const learnerSeamSource = readFileSync(new URL(
  "../src/semantic/scheme-factorial-trace-artifact.ts",
  import.meta.url
), "utf8");

test("generated factorial trace is reproduced byte for byte from source", () => {
  const compiled = compileKpSchemeFactorialTraceArtifact();
  assert.equal(serializeKpSchemeFactorialTraceArtifact(compiled), artifactSource);
  assert.equal(compiled.trace.events.at(-1)?.kind, "evaluation-completed");
  assert.ok(compiled.trace.events.length < KP_SCHEME_FACTORIAL_MAX_TRANSITIONS);
});

test("learner artifact is deeply frozen and schema-valid", () => {
  const artifact = readKpSchemeFactorialTraceArtifact();
  assert.equal(Object.isFrozen(artifact), true);
  assert.equal(Object.isFrozen(artifact.trace), true);
  assert.equal(Object.isFrozen(artifact.trace.snapshots), true);
  assert.equal(Object.isFrozen(artifact.trace.snapshots[0]?.state), true);
  assert.equal(Object.isFrozen(artifact.trace.events), true);
  assert.doesNotThrow(() => JSON.stringify(artifact));
});

test("learner artifact seam cannot import or execute the evaluator", () => {
  assert.doesNotMatch(learnerSeamSource, /scheme-factorial-evaluator/);
  assert.doesNotMatch(learnerSeamSource,
    /stepKpSchemeFactorialEvaluator|createKpSchemeFactorialInitialState/);
});
