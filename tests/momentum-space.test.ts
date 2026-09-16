import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compileMomentumEnergyPublication } from "../src/tutorial/mechanics-relations/momentum-energy-publication.ts";
import { renderMomentumSpacePassage } from "../src/tutorial/mechanics-relations/momentum-space-publication.ts";

test("momentum storyboard binds source meanings to checked unit-mass physics and static accessible geometry", () => {
  const publication = compileMomentumEnergyPublication(readFileSync("examples/physics/momentum-energy.article.md", "utf8"));
  const block = publication.article.document.blocks.find(b => b.kind === "passage" && b.id === "momentum-space");
  assert.ok(block?.kind === "passage");
  const models = publication.capabilities.map(c => c.compiled.model);
  const markup = renderMomentumSpacePassage(block.markdown, models);
  assert.equal((markup.match(/role="img"/g) ?? []).length, 3);
  assert.equal((markup.match(/>0\.50<\/span>/g) ?? []).length, 4);
  assert.equal((markup.match(/>2\.00<\/span>/g) ?? []).length, 2);
  assert.match(markup, /finite straight step/);
  assert.doesNotMatch(markup, /NaN|Infinity|<button|<input/);
  assert.throws(() => renderMomentumSpacePassage(block.markdown, models.slice(0, 1)), /fixtures/);
  assert.throws(() => renderMomentumSpacePassage(block.markdown.replace("### Push outward", "### Other"), models), /source/);
});
