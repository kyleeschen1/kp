import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkMomentumEnergy, momentumEnergyExamples } from "../domains/physics/momentum-energy.ts";
import { projectMomentumMove, momentumMoveMap } from "../src/tutorial/mechanics-relations/momentum-move.ts";
import { renderMomentumMove } from "../src/tutorial/mechanics-relations/momentum-move-publication.ts";
import { compileMomentumEnergyPublication } from "../src/tutorial/mechanics-relations/momentum-energy-publication.ts";

test("text move advances the checked turn only during action, then inspects invariant and consequence", () => {
  const checked = checkMomentumEnergy(momentumEnergyExamples[1]);
  assert.ok(checked.status === "checked");
  for (const p of [0, .1, .2, .4, .549, .55, .7, .8, 1, .4, 0]) {
    const state = projectMomentumMove(checked.model, p);
    assert.equal(state.frame.kineticEnergy, .5);
    assert.ok(Math.abs(Math.hypot(state.frame.momentum.x, state.frame.momentum.y) - 1) < 1e-12);
    assert.equal(state.entities.filter(e => e.salience === "focus").length, 2);
    assert.deepEqual(projectMomentumMove(checked.model, p), state);
  }
  assert.equal(projectMomentumMove(checked.model, .55).part, "magnitude");
  assert.equal(projectMomentumMove(checked.model, .8).part, "energy");
  assert.deepEqual(projectMomentumMove(checked.model, .55).frame, projectMomentumMove(checked.model, 1).frame);
  for (const p of [NaN, Infinity, -.1, 1.1]) assert.throws(() => projectMomentumMove(checked.model, p));
  const wrong = checkMomentumEnergy(momentumEnergyExamples[0]);
  assert.ok(wrong.status === "checked");
  assert.throws(() => projectMomentumMove(wrong.model, .5), /source/);
});

test("the persistent argument and every declared evidence binding survive static publication", () => {
  const publication = compileMomentumEnergyPublication(readFileSync("examples/physics/momentum-energy.article.md", "utf8"));
  const passage = publication.article.document.blocks.find(b => b.kind === "passage" && b.id === "momentum-move");
  assert.ok(passage?.kind === "passage");
  const models = publication.capabilities.map(c => c.compiled.model);
  const markup = renderMomentumMove(passage.markdown, models);
  for (const entity of momentumMoveMap.members) assert.ok(markup.includes(`data-move-entity="${entity.selectorId}"`));
  assert.match(markup, /Therefore kinetic energy stays the same/);
  assert.match(markup, /0\.50/);
  assert.throws(() => renderMomentumMove(passage.markdown.replace('### magnitude', '### mass'), models), /text/);
});
