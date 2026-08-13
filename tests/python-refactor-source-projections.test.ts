import assert from "node:assert/strict";
import test from "node:test";

import { compileKpPythonRefactorSemantics } from
  "../scripts/python-refactor-semantic-compiler.ts";
import { createKpPythonRefactorSourceProjections } from
  "../src/semantic/python-refactor-source-projections.ts";

const semantics = compileKpPythonRefactorSemantics();
const projections = createKpPythonRefactorSourceProjections(semantics);

test("Python source projections preserve endpoints and authored replacement order", () => {
  const [before, helper, cost, final] = projections;

  assert.equal(before?.sourceText, semantics.revisions[0]?.sourceText);
  assert.equal(final?.sourceText, semantics.revisions[1]?.sourceText);
  assert.match(helper!.sourceText, /def qualifies_for_free_shipping/);
  assert.equal(count(helper!.sourceText, "total >= 50"), 3);
  assert.equal(count(helper!.sourceText, "qualifies_for_free_shipping(total)"), 0);
  assert.equal(count(cost!.sourceText, "total >= 50"), 2);
  assert.equal(count(cost!.sourceText, "qualifies_for_free_shipping(total)"), 1);
  assert.equal(count(final!.sourceText, "total >= 50"), 1);
  assert.equal(count(final!.sourceText, "qualifies_for_free_shipping(total)"), 2);
});

test("every Python projected entity retains an AST-derived source fragment", () => {
  for (const projection of projections) {
    for (const entity of projection.entities) {
      const source = projection.sourceText.slice(
        entity.sourceRange.startOffset,
        entity.sourceRange.endOffset
      );
      if (entity.kind === "function") {
        assert.match(source, new RegExp(`^def ${entity.label}\\(`));
      } else {
        assert.equal(source, entity.label);
      }
    }
  }
});

test("Python projections keep native indentation and exact three-line separation", () => {
  for (const projection of projections) {
    assert.doesNotMatch(projection.sourceText, /\t/);
    assert.doesNotMatch(projection.sourceText, /\n {1,3}(?:def|$)/);
    assert.match(projection.sourceText, /^def /);
  }
  assert.equal(projections[1]!.sourceText.split("\n\n\n").length, 3);
});

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}
