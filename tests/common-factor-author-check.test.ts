import assert from "node:assert/strict";
import test from "node:test";
import { createKpCommonFactorExample, checkKpCommonFactorAuthorSource, checkKpCommonFactorDraft } from "../src/authoring/common-factor-author-check.ts";
import { runAuthorCheckCli } from "../scripts/author-check.ts";
import { reportAuthorCheck } from "../src/authoring/author-check-report.ts";

test("CLI and owner agree through valid edit, exact repair and retry without issuing runtime authority", async () => {
  const source = createKpCommonFactorExample();
  for (const value of [source, { ...source, states: [source.states[0], { ...source.states[1], latex: "a(b+b)" }] }, source]) {
    const json = JSON.stringify(value), owner = checkKpCommonFactorAuthorSource(json);
    assert.deepEqual(await runAuthorCheckCli(["--task", "equation.common-factor", "--request", "selected.json"], () => json), reportAuthorCheck("equation.common-factor", owner));
    assert.equal("draft" in owner, false);
    if (owner.status === "compiled") { assert.equal(owner.checkpointCount, 2); assert.equal(owner.transitionCount, 1); }
    else { assert.equal(owner.diagnostic.code, "invalid-factorization"); assert.equal(owner.diagnostic.path, "$.states"); }
  }
  assert.deepEqual(await runAuthorCheckCli(["--task", "equation.common-factor", "--example"]), source);
});

test("checker distinguishes notation, shape, math and size repairs without a partial draft", () => {
  const source = createKpCommonFactorExample();
  for (const [latex, code] of [["sin(a)", "ambiguous-notation"], ["az", "undeclared-symbol"], ["a^2", "unsupported-syntax"], ["a+b", "unsupported-shape"]]) {
    const result = checkKpCommonFactorDraft(JSON.stringify({ ...source, states: [{ ...source.states[0], latex }, source.states[1]] }));
    assert.equal(result.status, "repair-gap");
    assert.equal("draft" in result, false);
    if (result.status === "repair-gap") assert.equal(result.diagnostic.code, code);
  }
  assert.equal(checkKpCommonFactorDraft(" ".repeat(20_001)).status, "repair-gap");
  assert.equal(checkKpCommonFactorDraft("{").status, "repair-gap");
});
