import assert from "node:assert/strict";
import test from "node:test";

import { compileKpPythonRefactorSemantics } from
  "../scripts/python-refactor-semantic-compiler.ts";
import { serializeKpPythonRefactorSemantics } from
  "../scripts/generate-python-refactor-semantics.ts";
import { readKpPythonRefactorSemanticArtifact } from
  "../src/semantic/python-refactor-semantic-artifact.ts";

test("Python compiler binds every authored identity to one real AST range", () => {
  const artifact = compileKpPythonRefactorSemantics();
  const entities = artifact.revisions.flatMap(({ entities }) => entities);

  assert.equal(artifact.schemaVersion, "kp.python-refactor-semantics.v1");
  assert.equal(entities.length, 12);
  assert.equal(new Set(entities.map(({ id }) => id)).size, entities.length);
  for (const revision of artifact.revisions) {
    for (const entity of revision.entities) {
      const source = revision.sourceText.slice(
        entity.sourceRange.startOffset,
        entity.sourceRange.endOffset
      );
      assert.ok(source.length > 0, entity.id);
      assert.match(entity.syntaxRecordId, /^syntax\./);
    }
  }
});

test("Python expressions and calls retain declared scope and declaration ids", () => {
  const entities = compileKpPythonRefactorSemantics().revisions
    .flatMap(({ entities }) => entities);
  const byId = new Map(entities.map((entity) => [entity.id, entity]));

  assert.equal(
    byId.get("rule.shipping-cost.before")?.scopeId,
    "scope.before.shipping_cost"
  );
  assert.equal(
    byId.get("rule.shipping-message.before")?.scopeId,
    "scope.before.shipping_message"
  );
  assert.equal(
    byId.get("rule.qualifies.after")?.declarationId,
    "function.qualifies.after"
  );
  assert.equal(
    byId.get("call.shipping-cost.after")?.declarationId,
    "function.qualifies.after"
  );
  assert.equal(
    byId.get("call.shipping-message.after")?.declarationId,
    "function.qualifies.after"
  );
});

test("checked-in Python semantics exactly match deterministic compilation", () => {
  const generated = readKpPythonRefactorSemanticArtifact();
  const compiled = compileKpPythonRefactorSemantics();

  assert.deepEqual(generated, compiled);
  assert.equal(serializeKpPythonRefactorSemantics(), `${JSON.stringify(generated)}\n`);
});

test("generated Python runtime reader contains no build-time frontend import", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) =>
    readFile("src/semantic/python-refactor-semantic-artifact.ts", "utf8")
  );

  assert.doesNotMatch(source, /scripts\/python-refactor|child_process|python3/);
  assert.match(source, /python-refactor-semantics\.generated\.json/);
});
