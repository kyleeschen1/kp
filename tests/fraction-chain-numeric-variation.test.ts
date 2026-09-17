import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import source from "../examples/algebra/fraction-chain-numeric.json" with { type: "json" };
import original from "../examples/algebra/fraction-chain.json" with { type: "json" };
import both from "../examples/algebra/fraction-chain-two-sided.json" with { type: "json" };
import { compileFractionChain } from "../src/authoring/fraction-chain-compilation.ts";
import { compileKpCommonDenominatorPressurePresentationPlan } from "../src/animation/common-denominator-pressure-presentation-plan.ts";
import { createKpCommonDenominatorPressureNativeEndpoints } from "../src/rendering/common-denominator-pressure-native-endpoints.ts";
import { compileFractionChainPublication } from "../src/tutorial/fraction-chain/publication.ts";
import { fractionSceneAt } from "../src/tutorial/fraction-chain/position.ts";

test("numeric callers derive every alignment endpoint from issued authority without cross-caller state", () => {
  for (const input of [source, original, both, source]) {
    const compiled = compileFractionChain(input);
    assert.equal(compiled.status, "compiled");
    const step = compiled.compilation.steps[0];
    if (step?.kind !== "align") throw new Error("Expected alignment");
    const plan = compileKpCommonDenominatorPressurePresentationPlan(step.authority);
    const endpoints = createKpCommonDenominatorPressureNativeEndpoints(plan);
    assert.equal(endpoints[0].annotated.rawLatex, input.states[0]!.latex);
    assert.equal(endpoints[3].annotated.rawLatex, input.states[1]!.latex);
    assert.deepEqual(endpoints.map(e => e.annotated.rawLatex), plan.endpoints.map(e => e.latex));
    if (input === both) {
      assert.equal(plan.companion?.focus.position, "second-term");
      assert.deepEqual(plan.equivalence.contextTransfers.map(t => t.role), ["addition-operator"]);
      assert.equal(plan.evaluation.bindings.length, 4);
      assert.equal(endpoints[1].introductionNodes.length, 2);
      assert.match(endpoints[2].annotated.rawLatex, /4\\cdot1.*4\\cdot6.*3\\cdot1.*3\\cdot8/);
      for (const endpoint of endpoints) assert.equal(new Set(endpoint.nodes.map(n => n.occurrenceId)).size, endpoint.nodes.length);
    }
    assert.throws(() => createKpCommonDenominatorPressureNativeEndpoints({ ...plan }), /issued/);
  }
});

test("a chain without reduction ends at addition in static and interactive publication", () => {
  const markdown = readFileSync("examples/algebra/fraction-chain-numeric.article.md", "utf8");
  const html = compileFractionChainPublication(markdown, source);
  assert.match(html, /aria-valuemax="2"/);
  assert.doesNotMatch(html, /data-fraction-stage="reduction"|one half/);
  assert.equal((html.match(/data-fraction-stage=/g) ?? []).length, 3);
  assert.deepEqual(fractionSceneAt(2, 2), { index: 2, progress: 1 });
  assert.throws(() => fractionSceneAt(2.01, 2), /position/);
  const script = html.match(/id="fraction-chain-source">(.*?)<\/script>/s)![1]!;
  assert.deepEqual(JSON.parse(script), source);
  const hostile = structuredClone(source);
  hostile.title += " </script><script>alert(1)</script>";
  const published = compileFractionChainPublication(markdown, hostile);
  assert.match(published, /\\u003c\/script>/);
});
