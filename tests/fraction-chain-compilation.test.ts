import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compileFractionChain, assertCompiledFractionChain } from "../src/authoring/fraction-chain-compilation.ts";

const input = () => JSON.parse(readFileSync("examples/algebra/fraction-chain.json", "utf8"));
test("explicit four-state chain compiles issued adjacent operations through governed construction", () => {
  const result = compileFractionChain(input());
  assert.equal(result.status, "compiled", JSON.stringify(result.status === "repair-required" ? result : {}));
  if (result.status !== "compiled") return;
  const chain = result.compilation;
  assertCompiledFractionChain(chain);
  assert.deepEqual(chain.steps.map(step => step.kind), ["align", "combine", "reduce"]);
  const alignment = chain.steps[0]!;
  if (alignment.kind !== "align") throw new Error("Missing alignment");
  assert.deepEqual(alignment.governed.runtime.plans.map(plan => plan.operationId),
    ["kp.algebra.align-common-denominator", "kp.algebra.simplify-constant-product"]);
  assert.equal(alignment.governed.runtime.plans.at(-1)!.toStateId, alignment.authority.target.stateId);
  for (let i = 1; i < chain.steps.length; i++) assert.equal(chain.steps[i - 1]!.authority.target.stateId, chain.steps[i]!.authority.source.stateId);
  assert.throws(() => assertCompiledFractionChain({ ...chain }));
  const reduction = chain.steps[2]!;
  if (reduction.kind !== "reduce") throw new Error("Missing reduction");
  assert.equal(reduction.governed.mathematicalVerification.operations.length, 3);
  const changed = input(); changed.moves[0].prose += " Keep the value fixed.";
  const fresh = compileFractionChain(changed);
  assert.equal(fresh.status, "compiled");
  if (fresh.status === "compiled") assert.notEqual(fresh.compilation.revision, chain.revision);
});
test("true two-sided alignment preserves both scaling applications before evaluating products", () => {
  const result = compileFractionChain({ schema: "kp.algebra.fraction-chain.v1", id: "both", title: "Both terms",
    states: [{ id: "before", latex: "1/6+1/8" }, { id: "after", latex: "4/24+3/24" }],
    moves: [{ id: "align", from: "before", to: "after", hint: "align", prose: "Scale both fractions." }] });
  assert.equal(result.status, "compiled", JSON.stringify(result, (_, value) => typeof value === "bigint" ? String(value) : value));
});
test("wrong, skipped, reordered, forged and unsupported adjacencies return explicit repairs", () => {
  for (const mutate of [
    (source: ReturnType<typeof input>) => { source.states[1].latex = "\\frac{3}{6}+\\frac{1}{6}"; },
    (source: ReturnType<typeof input>) => { source.states[2].latex = "\\frac{1}{2}"; },
    (source: ReturnType<typeof input>) => { source.moves.reverse(); },
    (source: ReturnType<typeof input>) => { source.moves[1].proof = "copied"; },
    (source: ReturnType<typeof input>) => { source.moves[0].hint = "combine"; },
    (source: ReturnType<typeof input>) => { source.moves.splice(1, 1); }
  ]) { const source = input(); mutate(source); assert.equal(compileFractionChain(source).status, "repair-required"); }
});
for (const [before, after] of [["0/6", "0/1"], ["(-6)/12", "(-1)/2"]]) {
test(`unsupported reduction ${before} returns a presentation repair, never substitute motion`, () => {
  const result = compileFractionChain({ schema: "kp.algebra.fraction-chain.v1", id: "zero-reduction", title: "Zero",
    states: [{ id: "before", latex: before! }, { id: "after", latex: after! }],
    moves: [{ id: "reduce", from: "before", to: "after", hint: "reduce", prose: "Divide both integers by six." }] });
  assert.equal(result.status, "repair-required");
  if (result.status === "repair-required") assert.equal(result.code, "fraction-chain.presentation");
});
}
