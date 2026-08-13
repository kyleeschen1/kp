import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { compileKpPythonRefactorSemantics } from
  "../scripts/python-refactor-semantic-compiler.ts";
import { createKpPythonRefactorSourceProjections } from
  "../src/semantic/python-refactor-source-projections.ts";

test("Python adopts the same bounded projection and settlement seams", async () => {
  const projectionSource = await readFile(
    new URL("../src/semantic/python-refactor-source-projections.ts", import.meta.url),
    "utf8"
  );
  const theaterSource = await readFile(
    new URL("../src/animation/python-refactor-token-theater.ts", import.meta.url),
    "utf8"
  );
  const frameSource = await readFile(
    new URL("../src/animation/python-refactor-motion-frame.ts", import.meta.url),
    "utf8"
  );

  assert.match(projectionSource, /composeKpCompleteCodeSourceProjection/);
  assert.match(theaterSource, /sampleKpCodeSettlement/);
  assert.match(frameSource, /accessibleNativeOwner/);
  assert.doesNotMatch(`${projectionSource}${theaterSource}${frameSource}`, /typescript-refactor/u);
});

test("shared projection migration preserves Python AST and tokenize evidence", () => {
  const semantics = compileKpPythonRefactorSemantics();
  const projections = createKpPythonRefactorSourceProjections(semantics);

  assert.equal(projections[0]?.sourceText, semantics.revisions[0]?.sourceText);
  assert.equal(projections.at(-1)?.sourceText, semantics.revisions[1]?.sourceText);
  for (const projection of projections) {
    for (const token of projection.tokens) {
      assert.equal(
        projection.sourceText.slice(token.startOffset, token.endOffset),
        token.text
      );
    }
  }
});
