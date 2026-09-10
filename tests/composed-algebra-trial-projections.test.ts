import assert from "node:assert/strict";
import { test } from "node:test";
import { unfamiliarAuthoringCases } from "./fixtures/unfamiliar-authoring-trial.ts";
import { projectComposedAlgebraReading } from "../src/experiments/composed-algebra/readings.ts";
import { captureComposedAlgebraPosition, projectComposedAlgebraPrompts, resolveComposedAlgebraPosition } from "../src/experiments/composed-algebra/practice.ts";
import { compileComposedAlgebraPublication, verifyComposedAlgebraPublication } from "../scripts/build-composed-algebra-edition.ts";

for (const selected of unfamiliarAuthoringCases) test(`trial projections retain exact source revision: ${selected.name}`, () => {
  const full = projectComposedAlgebraReading(selected.draft, "full");
  const compact = projectComposedAlgebraReading(selected.draft, "compact");
  assert.deepEqual(full.facts, compact.facts);
  assert.deepEqual(full.facts.states, selected.source.states.map(({ id, latex }) => ({ id, latex })));
  for (const reading of [full, compact]) {
    assert.equal(reading.revisionId, selected.draft.revisionId);
    for (const reference of reading.references) {
      assert.equal(reference.sourceId, selected.source.id);
      assert.equal(reference.revisionId, selected.draft.revisionId);
    }
  }
  for (const prompt of projectComposedAlgebraPrompts(selected.draft)) {
    assert.equal(prompt.revisionId, selected.draft.revisionId);
    assert.equal(prompt.answerLatex, selected.source.states[prompt.answerStep]!.latex);
  }
  const position = captureComposedAlgebraPosition(selected.draft, .63);
  assert.equal(resolveComposedAlgebraPosition(selected.draft, position), .63);
  const other = unfamiliarAuthoringCases.find(item => item.name !== selected.name)!;
  assert.throws(() => resolveComposedAlgebraPosition(other.draft, position), /another source, revision/);
});

for (const selected of unfamiliarAuthoringCases) test(`trial publication reproduces selected author bytes: ${selected.name}`, () => {
  const publication = compileComposedAlgebraPublication(selected.text, selected.path);
  verifyComposedAlgebraPublication(publication, selected.text, selected.path);
  assert.equal(publication.payload.revisionId, selected.draft.revisionId);
  assert.deepEqual(publication.payload.source, selected.source);
  assert.equal(publication.payload.proofRevisionId, selected.draft.checked.chain.revisionId);
  assert.equal(publication.math.fragmentCount, 8);
  for (const prompt of publication.payload.prompts) assert.equal(prompt.revisionId, selected.draft.revisionId);
  const other = unfamiliarAuthoringCases.find(item => item.name !== selected.name)!;
  assert.throws(() => verifyComposedAlgebraPublication(publication, other.text, other.path), /does not reproduce/);
});
