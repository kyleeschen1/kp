import assert from "node:assert/strict";
import test from "node:test";

import {
  KP_FINITE_BINDER_VOCABULARY_AUTHORITY,
  createKpFiniteBinderSemanticId,
  defineKpFiniteBinderSource,
  type KpFiniteBinderBodyInstance,
  type KpFiniteBinderSource
} from "../src/domain-ir/finite-binder-vocabulary.ts";

const id = createKpFiniteBinderSemanticId;

function sumSource(
  overrides: Partial<KpFiniteBinderSource> = {}
): KpFiniteBinderSource {
  const binderId = id("sum.i.declaration");
  return {
    schemaVersion: "kp.finite-binder-source.v1",
    kind: "finite-binder-source",
    authority: KP_FINITE_BINDER_VOCABULARY_AUTHORITY,
    id: id("sum.a_i.source"),
    operator: { id: id("sum.operator"), role: "operator", operator: "sum" },
    binder: { id: binderId, role: "binder-declaration", symbol: "i" },
    lowerBound: { id: id("sum.lower.1"), role: "lower-bound", value: 1 },
    upperBound: { id: id("sum.upper.3"), role: "upper-bound", value: 3 },
    body: {
      id: id("sum.body.a_i"),
      role: "body-template",
      sourceLatex: "a_i",
      freeSymbols: ["a"],
      references: [{
        id: id("sum.body.reference.i"),
        role: "bound-reference",
        symbol: "i",
        bindsTo: binderId
      }]
    },
    ...overrides
  };
}

test("finite binder vocabulary keeps source roles renderer-neutral", () => {
  const source = defineKpFiniteBinderSource(sumSource());

  assert.deepEqual({
    operator: source.operator.operator,
    binder: source.binder.symbol,
    lower: source.lowerBound.value,
    upper: source.upperBound.value,
    body: source.body.sourceLatex,
    freeSymbols: source.body.freeSymbols,
    referenceOwner: source.body.references[0]?.bindsTo
  }, {
    operator: "sum",
    binder: "i",
    lower: 1,
    upper: 3,
    body: "a_i",
    freeSymbols: ["a"],
    referenceOwner: source.binder.id
  });
  assert.equal(Object.isFrozen(source), true);
  assert.equal(Object.isFrozen(source.body.references), true);
  assert.doesNotMatch(
    JSON.stringify(source),
    /geometry|keyframe|opacity|duration|renderer|domNode|katexNode/u
  );
});

test("body instances have distinct identity and explicit derivation vocabulary", () => {
  const source = defineKpFiniteBinderSource(sumSource());
  const instances = [1, 2, 3].map((value, ordinal) => ({
    id: id(`sum.body.instance.${value}`),
    role: "body-instance" as const,
    ordinal,
    indexValue: value,
    derivedFrom: source.body.id,
    references: [{
      id: id(`sum.body.instance.${value}.reference`),
      role: "instantiated-reference" as const,
      value,
      derivedFrom: source.body.references[0]!.id,
      boundBy: source.binder.id
    }]
  })) satisfies readonly KpFiniteBinderBodyInstance[];

  assert.equal(new Set(instances.map(({ id: instanceId }) => instanceId)).size, 3);
  assert.ok(instances.every(({ derivedFrom }) => derivedFrom === source.body.id));
  assert.ok(instances.every(({ id: instanceId }) => instanceId !== source.body.id));
});

test("source validation rejects ambiguous occurrence ownership", () => {
  const valid = sumSource();
  assert.throws(() => defineKpFiniteBinderSource({
    ...valid,
    upperBound: { ...valid.upperBound, id: valid.lowerBound.id }
  }), /occurrence ids must be unique/u);

  assert.throws(() => defineKpFiniteBinderSource({
    ...valid,
    body: {
      ...valid.body,
      references: [{
        ...valid.body.references[0]!,
        bindsTo: id("other.scope.i")
      }]
    }
  }), /not owned by declaration/u);
});

test("source validation refuses symbolic limits and binder-free bodies", () => {
  const valid = sumSource();
  assert.throws(() => defineKpFiniteBinderSource({
    ...valid,
    upperBound: { ...valid.upperBound, value: 2.5 }
  }), /explicit integers/u);
  assert.throws(() => defineKpFiniteBinderSource({
    ...valid,
    body: { ...valid.body, references: [] }
  }), /must reference its declared binder/u);
});

test("semantic ids reject unscoped labels", () => {
  assert.throws(
    () => createKpFiniteBinderSemanticId("sum"),
    /Invalid finite-binder semantic id/u
  );
});
