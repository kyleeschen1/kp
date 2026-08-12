import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpSchemeFactorialFullEvaluation,
  sampleKpSchemeFactorialFullEvaluation
} from "../src/animation/scheme-factorial-full-evaluation.ts";
import { parseKpSchemeFactorialSource } from
  "../src/semantic/scheme-factorial-parser.ts";
import { readKpSchemeFactorialTraceArtifact } from
  "../src/semantic/scheme-factorial-trace-artifact.ts";

const evaluation = compileKpSchemeFactorialFullEvaluation({
  document: parseKpSchemeFactorialSource(),
  trace: readKpSchemeFactorialTraceArtifact().trace
});

test("compiles the complete factorial evaluation from certified trace events", () => {
  assert.equal(evaluation.states[0]?.nativeCode, "(factorial 3)");
  assert.equal(evaluation.states.at(-1)?.nativeCode, "6");
  assert.deepEqual(
    evaluation.states.filter(({ kind }) => kind === "call")
      .map(({ nativeCode }) => compact(nativeCode)),
    [
      "(factorial 3)",
      "(* 3 (factorial 2))",
      "(* 3 (* 2 (factorial 1)))",
      "(* 3 (* 2 (* 1 (factorial 0))))"
    ]
  );
  assert.deepEqual(
    evaluation.states.filter(({ kind }) => kind === "return")
      .map(({ nativeCode }) => compact(nativeCode)),
    ["(* 3 (* 2 1))", "(* 3 2)", "6"]
  );
  assert.deepEqual(
    evaluation.actions.filter(({ kind }) => kind === "ApplyPrimitive")
      .map(({ resultValueId }) => resultValueId),
    ["scheme-factorial.value.integer.093", "scheme-factorial.value.integer.095",
      "scheme-factorial.value.integer.097"]
  );
  assert.equal(Object.isFrozen(evaluation), true);
});

function compact(code: string): string {
  return code.replace(/\s+/gu, " ")
    .replace(/\( /gu, "(")
    .replace(/ \)/gu, ")");
}

test("keeps recursive call syntax continuous while giving activations fresh identity", () => {
  const branch = evaluation.states.find(({ id }) =>
    id === "scheme-factorial.full.state.branch-0")!;
  const recursiveCall = evaluation.states.find(({ id }) =>
    id === "scheme-factorial.full.state.call-1")!;
  const branchOperator = branch.tokens.find(({ lexeme }) => lexeme === "factorial")!;
  const callOperator = recursiveCall.tokens.find(({ lexeme }) => lexeme === "factorial")!;
  assert.equal(callOperator.id, branchOperator.id);

  const activations = new Set(evaluation.actions.flatMap((action) =>
    "activationId" in action ? [action.activationId] : []));
  assert.equal(activations.size, 4);
  assert.equal([...activations].every((id) =>
    id.startsWith("scheme-factorial.environment.call.")),
    true);
});

test("never opens more than one lambda body at a settled state", () => {
  for (const state of evaluation.states) {
    assert.ok((state.nativeCode.match(/lambda/gu) ?? []).length <= 1, state.id);
  }
});

test("samples exact endpoints and remains independent of seek history", () => {
  const forward = Array.from({ length: 101 }, (_, index) =>
    sampleKpSchemeFactorialFullEvaluation(evaluation, index / 100));
  const reverse = Array.from({ length: 101 }, (_, index) =>
    sampleKpSchemeFactorialFullEvaluation(evaluation, (100 - index) / 100))
    .reverse();
  assert.deepEqual(reverse, forward);
  assert.equal(forward[0]?.nativeCode, "(factorial 3)");
  assert.equal(forward.at(-1)?.nativeCode, "6");
  assert.throws(() => sampleKpSchemeFactorialFullEvaluation(evaluation, Number.NaN),
    /finite/u);
});

test("reduced motion seeks directly to a settled semantic state", () => {
  const sample = sampleKpSchemeFactorialFullEvaluation(evaluation, 0.5, {
    reducedMotion: true
  });
  assert.equal(sample.phase, "settle");
  assert.equal(evaluation.states.some(({ id }) => id === sample.settledStateId), true);
  assert.equal(sample.tokens.every(({ opacity, scale }) =>
    opacity === 1 && scale === 1), true);
});
