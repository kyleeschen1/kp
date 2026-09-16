import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compileMomentumEnergyPublication } from "../src/tutorial/mechanics-relations/momentum-energy-publication.ts";
import { renderPowerCorrespondencePassage } from "../src/tutorial/mechanics-relations/power-correspondence-publication.ts";
import { powerCorrespondenceMap, powerTerms, projectPowerCorrespondence } from "../src/tutorial/mechanics-relations/power-correspondence.ts";
import { validateKpCrossViewCorrespondenceMap } from "../src/tutorial/cross-view-correspondence.ts";

test("power inspection resolves one semantic meaning across native symbols, prose and both checked cases", () => {
  assert.deepEqual(validateKpCrossViewCorrespondenceMap(powerCorrespondenceMap), []);
  assert.equal(powerCorrespondenceMap.identities.length, 0, "evidence is not a claim that momentum length equals speed or energy equals power");
  for (const term of powerTerms) {
    const direct = projectPowerCorrespondence(term.id);
    assert.equal(direct.filter(state => state.salience === "focus").length, 4);
    assert.ok(direct.filter(state => state.salience === "focus").every(state => state.id.startsWith(`physics.power.${term.id}.`)));
    projectPowerCorrespondence("energy"); projectPowerCorrespondence(null);
    assert.deepEqual(projectPowerCorrespondence(term.id), direct);
  }
  assert.ok(projectPowerCorrespondence(null).every(state => state.salience === "normal"));
  // @ts-expect-error Unsupported meanings also fail at runtime instead of selecting unrelated paint.
  assert.throws(() => projectPowerCorrespondence("potential-energy"), /Unknown/);
});

test("static correspondence preserves source explanations and checked numerical samples without energy-rate conflation", () => {
  const publication = compileMomentumEnergyPublication(readFileSync("examples/physics/momentum-energy.article.md", "utf8"));
  const passage = publication.article.document.blocks.find(block => block.kind === "passage" && block.id === "power-correspondence");
  assert.ok(passage?.kind === "passage");
  const models = publication.capabilities.map(capability => capability.compiled.model);
  const markup = renderPowerCorrespondencePassage(passage.markdown, models);
  for (const member of powerCorrespondenceMap.members) assert.ok(markup.includes(`data-power-entity="${member.selectorId}"`), member.id);
  for (const term of powerTerms) assert.ok(markup.includes(`data-power-reason="${term.id}"`));
  assert.ok(markup.indexOf('data-power-reason="speed"') < markup.indexOf('data-power-case="straight"'));
  assert.doesNotMatch(markup, /data-energy=""/);
  assert.match(markup, /data-physics-number="power"[^>]*>4\.00/);
  assert.match(markup, /data-physics-number="power"[^>]*>0\.00/);
  assert.match(markup, /energy <strong>rate<\/strong>/);
  assert.throws(() => renderPowerCorrespondencePassage(passage.markdown.replace("### Force along motion", "### Arbitrary force"), models), /correspondence-source/);
  assert.throws(() => renderPowerCorrespondencePassage(passage.markdown, models.slice(0, 1)), /correspondence-fixtures/);
});
