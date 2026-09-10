import assert from "node:assert/strict";
import test from "node:test";
import { composedAlgebraPressureCases } from "./fixtures/composed-algebra-pressure.ts";
import { prepareKpComposedAlgebraDraft, checkKpComposedAlgebraDraft, createKpComposedAlgebraAuthoringSession } from "../src/authoring/composed-algebra-session.ts";

for (const example of composedAlgebraPressureCases) test(`complete chain pressure: ${example.name}`, async () => {
  const draft = prepareKpComposedAlgebraDraft(example.source);
  assert.equal(draft.checked.chain.steps[0].orientation, example.orientation);
  assert.equal(draft.checked.chain.steps[1].result.value, example.result);
  assert.deepEqual(draft.steps.map(step => step.kind), ["factoring", "evaluation"]);
  assert.equal(draft.checkpointProgress.length, 3);
  let preparations = 0, commits = 0;
  const session = createKpComposedAlgebraAuthoringSession({ initial: draft,
    prepare: async () => { ++preparations; return { dispose() {} }; }, commit: () => { ++commits; } });
  try {
    const invalid = structuredClone(example.source);
    invalid.states[2]!.latex = invalid.states[2]!.latex.replace(String(example.result), String(example.result + 1));
    const result = await session.apply(JSON.stringify(invalid));
    assert.equal(result.status, "repair-gap");
    if (result.status !== "repair-gap") throw Error("Expected a mathematical repair.");
    assert.equal(result.diagnostic.code, "invalid-evaluation");
    assert.equal(result.diagnostic.path, "$.states[2].latex");
    assert.equal(session.current(), draft); assert.equal(preparations, 0); assert.equal(commits, 0);
  } finally { session.dispose(); }
});

test("mathematical proof cannot silently widen unsupported presentation or syntax", () => {
  const base = composedAlgebraPressureCases[0]!.source;
  for (const latex of [
    ["2*0+3*0", "(2+3)*0", "5*0"],
    ["2*x+3*x", "(2+3)*x", "5*x"]
  ]) {
    const result = checkKpComposedAlgebraDraft(JSON.stringify({ ...base,
      states: base.states.map((state, index) => ({ ...state, latex: latex[index] })) }));
    assert.equal(result.status, "repair-gap");
    if (result.status !== "repair-gap") throw Error("Expected bounded compound presentation gap.");
    assert.equal(result.diagnostic.code, "unsupported-presentation");
    assert.equal("draft" in result, false);
  }
});
