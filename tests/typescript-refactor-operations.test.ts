import assert from "node:assert/strict";
import test from "node:test";

import { compileKpTypeScriptRefactorSemantics } from "../scripts/typescript-refactor-semantic-compiler.ts";
import {
  createKpTypeScriptRefactorOperationSet,
  findKpTypeScriptSemanticEntity,
  kpTypeScriptRefactorSelectorId
} from "../src/semantic/typescript-refactor-operations.ts";
import { validateKpAssetBundle } from "../src/semantic/asset.ts";
import { isKpImmutableSemanticAssetObject } from "../src/semantic/immutable-asset.ts";
import { validateKpSemanticTransformation } from "../src/semantic/asset-transformation.ts";
import {
  checkCorrespondenceMapRewindLaw,
  validateCorrespondenceMap
} from "../src/semantic/correspondence.ts";
import { validateKpSemanticLineageGraph } from "../src/semantic/semantic-lineage-graph.ts";

test("refactor operations reuse the canonical semantic authorities", () => {
  const operations = createKpTypeScriptRefactorOperationSet(
    compileKpTypeScriptRefactorSemantics()
  );

  assert.deepEqual(validateKpAssetBundle(operations.bundle), []);
  assert.ok(operations.bundle.objects.every(isKpImmutableSemanticAssetObject));
  assert.equal(operations.bundle.objects.length, 2);
  assert.equal(operations.bundle.objects.flatMap(({ selectors }) => selectors).length, 12);
  assert.deepEqual(
    operations.transformations.map(({ id }) => id),
    [
      "transform.typescript.extract-shared-rule",
      "transform.typescript.replace-cost-call",
      "transform.typescript.replace-message-call",
      "transform.typescript.recompose-program"
    ]
  );
  operations.transformations.forEach((transformation) => {
    assert.deepEqual(validateKpSemanticTransformation(transformation, operations.bundle), []);
    assert.deepEqual(validateCorrespondenceMap(transformation.correspondenceMap!), []);
    assert.deepEqual(checkCorrespondenceMapRewindLaw(transformation.correspondenceMap!), []);
  });
});

test("duplicate decisions merge into one rule while calls are introduced", () => {
  const operations = createKpTypeScriptRefactorOperationSet(
    compileKpTypeScriptRefactorSemantics()
  );
  const merge = operations.lineage.edges.find(({ id }) => id === "duplicate-rules-merge");

  assert.deepEqual(merge, {
    id: "duplicate-rules-merge",
    relation: "merge",
    sourceEntityIds: ["rule.shipping-cost.before", "rule.shipping-message.before"],
    targetEntityIds: ["rule.qualifies.after"],
    summary: "Two copies of one decision merge into the helper's rule."
  });
  assert.deepEqual(
    operations.lineage.edges
      .filter(({ relation }) => relation === "introduction")
      .flatMap(({ targetEntityIds }) => targetEntityIds),
    ["function.qualifies.after", "call.shipping-cost.after", "call.shipping-message.after"]
  );
  assert.deepEqual(validateKpSemanticLineageGraph(operations.lineage), []);
});

test("issued code objects do not alias a retained semantic source draft", () => {
  const source = structuredClone(compileKpTypeScriptRefactorSemantics());
  const entity = source.revisions[0]!.entities[0]!;
  const original = entity.label;
  const operations = createKpTypeScriptRefactorOperationSet(source);
  assert.equal(Reflect.set(entity, "label", "Changed outside issuance"), true);
  assert.equal(findKpTypeScriptSemanticEntity(operations, entity.id)?.label, original);
});

test("operation selectors retain exact source-derived identity", () => {
  const operations = createKpTypeScriptRefactorOperationSet(
    compileKpTypeScriptRefactorSemantics()
  );
  const costRule = findKpTypeScriptSemanticEntity(
    operations,
    "rule.shipping-cost.before"
  );
  const messageRule = findKpTypeScriptSemanticEntity(
    operations,
    "rule.shipping-message.before"
  );

  assert.notEqual(costRule?.syntaxRecordId, messageRule?.syntaxRecordId);
  assert.equal(
    operations.bundle.objects[0]?.selectors[2]?.id,
    kpTypeScriptRefactorSelectorId("rule.shipping-cost.before")
  );
  assert.deepEqual(JSON.parse(JSON.stringify(operations)), operations);
  assert.doesNotMatch(JSON.stringify(operations), /\b(?:bbox|glyph|clientRect)\b/i);
});
