import assert from "node:assert/strict";
import test from "node:test";

import { compileKpPythonRefactorSemantics } from
  "../scripts/python-refactor-semantic-compiler.ts";
import { validateKpAssetBundle } from "../src/semantic/asset.ts";
import { validateKpSemanticTransformation } from
  "../src/semantic/asset-transformation.ts";
import {
  checkCorrespondenceMapRewindLaw,
  validateCorrespondenceMap
} from "../src/semantic/correspondence.ts";
import {
  createKpPythonRefactorOperationSet,
  findKpPythonSemanticEntity,
  kpPythonRefactorSelectorId
} from "../src/semantic/python-refactor-operations.ts";
import { validateKpSemanticLineageGraph } from
  "../src/semantic/semantic-lineage-graph.ts";

test("Python refactor operations use canonical assets and transformations", () => {
  const operations = createKpPythonRefactorOperationSet(
    compileKpPythonRefactorSemantics()
  );

  assert.deepEqual(validateKpAssetBundle(operations.bundle), []);
  assert.equal(operations.bundle.objects.length, 2);
  assert.equal(operations.bundle.objects.flatMap(({ selectors }) => selectors).length, 12);
  assert.deepEqual(operations.transformations.map(({ id }) => id), [
    "transform.python.extract-shared-rule",
    "transform.python.replace-cost-call",
    "transform.python.replace-message-call",
    "transform.python.recompose-program"
  ]);
  for (const transformation of operations.transformations) {
    assert.deepEqual(validateKpSemanticTransformation(transformation, operations.bundle), []);
    assert.deepEqual(validateCorrespondenceMap(transformation.correspondenceMap!), []);
    assert.deepEqual(checkCorrespondenceMapRewindLaw(transformation.correspondenceMap!), []);
  }
});

test("Python lineage explicitly merges decisions and introduces calls", () => {
  const operations = createKpPythonRefactorOperationSet(
    compileKpPythonRefactorSemantics()
  );
  const merge = operations.lineage.edges.find(({ id }) => id === "duplicate-rules-merge");

  assert.deepEqual(merge?.sourceEntityIds, [
    "rule.shipping-cost.before",
    "rule.shipping-message.before"
  ]);
  assert.deepEqual(merge?.targetEntityIds, ["rule.qualifies.after"]);
  assert.deepEqual(operations.lineage.edges
    .filter(({ relation }) => relation === "introduction")
    .flatMap(({ targetEntityIds }) => targetEntityIds), [
      "function.qualifies.after",
      "call.shipping-cost.after",
      "call.shipping-message.after"
    ]);
  assert.deepEqual(validateKpSemanticLineageGraph(operations.lineage), []);
});

test("Python operation selectors retain AST-derived occurrence identity", () => {
  const operations = createKpPythonRefactorOperationSet(
    compileKpPythonRefactorSemantics()
  );
  const cost = findKpPythonSemanticEntity(operations, "rule.shipping-cost.before");
  const message = findKpPythonSemanticEntity(operations, "rule.shipping-message.before");

  assert.notEqual(cost?.syntaxRecordId, message?.syntaxRecordId);
  assert.equal(
    operations.bundle.objects[0]?.selectors[2]?.id,
    kpPythonRefactorSelectorId("rule.shipping-cost.before")
  );
  assert.doesNotMatch(JSON.stringify(operations), /\b(?:bbox|glyph|clientRect)\b/i);
});
