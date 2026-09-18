import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { assertCheckedFractionChain, checkFractionChain } from "../src/authoring/fraction-chain-checked.ts";
import { assertFractionChainHostShape } from "../src/authoring/fraction-chain-host-shape.ts";
import { compileFractionChain } from "../src/authoring/fraction-chain-compilation.ts";
import { createCheckedFractionReductionAnimation } from "../src/authoring/fraction-chain-reduction-animation.ts";

test("runtime checks reissue exactly the build authority and reject copied or changed source", () => {
  for (const suffix of ["", "-numeric", "-two-sided", "-subtraction"]) {
    const source = JSON.parse(readFileSync(`examples/algebra/fraction-chain${suffix}.json`, "utf8"));
    const built = compileFractionChain(source), runtime = checkFractionChain(source);
    assert.equal(built.status, "compiled"); assert.equal(runtime.status, "checked");
    if (built.status !== "compiled" || runtime.status !== "checked") throw new Error("Expected source authority");
    assert.equal(runtime.chain.revision, built.compilation.revision);
    assert.deepEqual(runtime.chain.steps, built.compilation.checked.steps);
    assertFractionChainHostShape(runtime.chain);
    assert.throws(() => assertCheckedFractionChain({ ...runtime.chain }), /original/);
    assert.throws(() => assertCheckedFractionChain(built.compilation), /original/);
    assert.equal(checkFractionChain({ ...source, proof: "transported" }).status, "repair-required");
    source.states[1].latex = "999/6+1/6";
    assert.equal(checkFractionChain(source).status, "repair-required");
  }
});

test("valid mathematics cannot bypass host shape or unsupported reduction presentation", () => {
  const source = JSON.parse(readFileSync("examples/algebra/fraction-chain.json", "utf8"));
  const short = checkFractionChain({ ...source, states: source.states.slice(0, 2), moves: source.moves.slice(0, 1) });
  assert.equal(short.status, "checked");
  if (short.status === "checked") assert.throws(() => assertFractionChainHostShape(short.chain), /requires alignment/);
  const zero = checkFractionChain({ schema: source.schema, id: "zero", title: "Zero",
    states: [{ id: "a", latex: "0/6" }, { id: "b", latex: "0/3" }],
    moves: [{ id: "reduce", from: "a", to: "b", prose: "Divide by two." }] });
  assert.equal(zero.status, "checked");
  if (zero.status === "checked") assert.throws(() => createCheckedFractionReductionAnimation(zero.chain, 0), /positive numerators/);
});

test("runtime checked source does not import governed authoring compilation", () => {
  for (const file of ["src/tutorial/fraction-chain/entry.ts", "src/tutorial/fraction-chain/native.ts", "src/tutorial/fraction-chain/alignment.ts",
    "src/authoring/fraction-chain-checked.ts", "src/authoring/fraction-addition-presentation.ts"]) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /from ["'][^"']*(?:fraction-chain-compilation|compile-equation-transform-series|governed-canonical-construction-compiler)/);
  }
});
