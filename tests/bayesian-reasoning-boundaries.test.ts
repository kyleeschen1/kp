import test from "node:test";
import assert from "node:assert/strict";
import { BinaryJointModel } from "../domains/probability/binary-joint-model.ts";
import { factorBinaryTree, treeJointMass } from "../domains/probability/binary-probability-trace.ts";
import { marginalProbability, PositiveProbabilityPopulation, conditionalProbability } from "../domains/probability/binary-probability-queries.ts";
import { equalKpRationals } from "../domains/math/exact-rational.ts";
import { checkBayesDraft, createBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { createUrnBayesDraft } from "../src/experiments/bayesian-reasoning/urn-source.ts";
import { projectBayesReading } from "../src/experiments/bayesian-reasoning/readings.ts";

test("all 35 quarter-unit joint tables preserve both orders and complementary queries, including zero support", () => {
  let tables = 0;
  for (let tt = 0; tt <= 4; tt++) for (let tf = 0; tf <= 4 - tt; tf++) for (let ft = 0; ft <= 4 - tt - tf; ft++) {
    const source = createBayesDraft(); source.model.masses = [tt, tf, ft, 4 - tt - tf - ft].map(n => `${n}/4`);
    const model = BinaryJointModel.from(source.model); tables++;
    for (const first of [0, 1] as const) {
      const tree = factorBinaryTree(model, first);
      for (const outcome of model.outcomes) assert.ok(equalKpRationals(treeJointMass(tree, outcome.id), outcome.mass));
      for (const occurs of [true, false]) {
        const event = { eventId: model.events[first].id, occurs }, marginal = marginalProbability(model, event);
        const population = PositiveProbabilityPopulation.from(model, event);
        assert.equal(population.status === "repair-gap", marginal.mass.numerator === 0n);
        if (population.status === "defined") {
          const same = conditionalProbability(model, event, population.population);
          assert.equal(same.value.numerator, same.value.denominator);
        }
      }
    }
    const draft = checkBayesDraft(JSON.stringify(source));
    assert.equal(draft.status, tt + ft === 0 ? "repair-gap" : "compiled");
    if (draft.status === "compiled") assert.equal(draft.draft.trace.states.length, 7);
  }
  assert.equal(tables, 35);
});

test("all views use one smallest exact display population outside the accepted hundredths case", () => {
  for (const source of [createBayesDraft(), createUrnBayesDraft()]) {
    const result = checkBayesDraft(JSON.stringify(source)); assert.equal(result.status, "compiled"); if (result.status !== "compiled") return;
    const { draft } = result;
    assert.equal(draft.tree.display.unit, draft.notation.unit);
    assert.equal(draft.tree.display.count(draft.tree.query.denominator), draft.notation.denominatorUnits);
    assert.equal(draft.notation.unit, source.model.kind === "joint-masses" ? 100n : 8n);
  }
  const source = createBayesDraft(); source.model.masses = ["1/999999999999999999", "0/1", "0/1", "999999999999999998/999999999999999999"];
  assert.equal(checkBayesDraft(JSON.stringify(source)).status, "repair-gap");
  source.model.events[0]!.label = "x".repeat(161); assert.equal(checkBayesDraft(JSON.stringify(source)).status, "repair-gap");
});

test("literal label runs cannot become Article math or nested code syntax", () => {
  const source = createBayesDraft(); source.model.events[0]!.label = "Cost $$ and `$x$`";
  const result = checkBayesDraft(JSON.stringify(source)); assert.equal(result.status, "compiled"); if (result.status !== "compiled") return;
  const html = projectBayesReading(result.draft, "full").html;
  assert.doesNotMatch(html, /class="katex"/); assert.match(html, /<code>\$\$<\/code>/);
});
