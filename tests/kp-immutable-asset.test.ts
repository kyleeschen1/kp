import assert from "node:assert/strict";
import test from "node:test";
import { createKpSemanticAssetObject } from "../src/semantic/asset.ts";
import { createKpImmutableSemanticAssetObject, isKpImmutableSemanticAssetObject,
  KpSemanticDataRepairGap } from "../src/semantic/immutable-asset.ts";

const fields = { id: "object.test", objectType: "test-data", title: "Owned semantic data" };

test("immutable issuance closes the legacy alias escape without freezing the author input", () => {
  const shared = { x: 1 }, value = { points: [shared], same: shared, exact: 3n, optional: undefined };
  const metadata = { revision: "one" }, sources = ["source.one"];
  const legacy = createKpSemanticAssetObject({ ...fields, value });
  const object = createKpImmutableSemanticAssetObject({ ...fields, value,
    metadata, selectors: [{ id: "p", kind: "point", metadata }], provenance: { kind: "authored", sourceIds: sources } });
  shared.x = 2; value.points.push({ x: 3 }); metadata.revision = "two"; sources.push("source.two");
  assert.equal(legacy.value.same.x, 2);
  assert.equal(object.value.same.x, 1);
  assert.equal(object.value.points.length, 1);
  assert.equal(object.value.points[0], object.value.same);
  assert.equal(object.value.exact, 3n);
  assert.ok(Object.hasOwn(object.value, "optional"));
  assert.equal(object.metadata?.["revision"], "one");
  assert.equal(object.selectors[0]?.metadata?.["revision"], "one");
  assert.deepEqual(object.provenance?.sourceIds, ["source.one"]);
  for (const owned of [object, object.value, object.value.same, object.value.points, object.selectors, object.selectors[0], object.metadata, object.provenance, object.provenance?.sourceIds]) assert.ok(Object.isFrozen(owned));
  assert.equal(Reflect.set(object.value.same, "x", 99), false);
  assert.ok(!Object.isFrozen(value)); assert.ok(!Object.isFrozen(shared));
  assert.ok(isKpImmutableSemanticAssetObject(object));
  assert.ok(!isKpImmutableSemanticAssetObject(structuredClone(object)));
});

test("unsupported data returns a typed path without invoking getters or silently coercing values", () => {
  let reads = 0;
  const accessor = { get x() { reads++; return 1; } };
  const cycle: { self?: unknown } = {}; cycle.self = cycle;
  const hidden = Object.defineProperty({}, "x", { value: 1 });
  for (const value of [accessor, new Date(), new Map(), new Set(), new Uint8Array(2), () => 1, Symbol("x"), Infinity, NaN, [ , 1], hidden, { [Symbol("x")]: 1 }]) {
    // External data bypasses static checking only to pressure the runtime seam.
    assert.throws(() => createKpImmutableSemanticAssetObject({ ...fields, value: value as never }), error =>
      error instanceof KpSemanticDataRepairGap && error.code === "unsupported" && error.path.startsWith("$.value"));
  }
  assert.equal(reads, 0);
  assert.throws(() => createKpImmutableSemanticAssetObject({ ...fields, value: cycle as never }), error => error instanceof KpSemanticDataRepairGap && error.code === "cycle");
  let deep: unknown = 1; for (let i = 0; i < 105; i++) deep = { child: deep };
  assert.throws(() => createKpImmutableSemanticAssetObject({ ...fields, value: deep as never }), error => error instanceof KpSemanticDataRepairGap && error.code === "limit");
});

test("literal prototype fields and null-prototype records remain data", () => {
  const value = JSON.parse('{"__proto__":{"safe":true},"zero":0}');
  const object = createKpImmutableSemanticAssetObject({ ...fields, value });
  assert.equal(Object.getPrototypeOf(object.value), Object.prototype);
  assert.deepEqual(Object.getOwnPropertyDescriptor(object.value, "__proto__")?.value, { safe: true });
  const plain = Object.create(null); plain.x = 2;
  assert.equal(Object.getPrototypeOf(createKpImmutableSemanticAssetObject({ ...fields, value: plain }).value), null);
});

test("bounded issuance cost is observable without a machine-specific timing assertion", () => {
  const value = { samples: Array.from({ length: 1000 }, (_, i) => ({ x: i, y: i * i })) };
  const samples: number[] = [];
  for (let i = 0; i < 25; i++) {
    const start = performance.now();
    const object = createKpImmutableSemanticAssetObject({ ...fields, value });
    samples.push(performance.now() - start);
    assert.equal(object.value.samples[999]?.y, 998001);
  }
  samples.sort((a, b) => a - b);
  console.log(JSON.stringify({ kind: "immutable-issuance-cost", records: 1000, repeats: 25, p50Ms: samples[12], p95Ms: samples[23], caveat: "Local clone/freeze cost, not browser or hardware certification." }));
});

function staticOwnershipChecks() {
  const object = createKpImmutableSemanticAssetObject({ ...fields, value: { nested: { x: 1 }, list: [1, 2] } });
  // @ts-expect-error Issued nested data cannot be mutated.
  object.value.nested.x = 2;
  // @ts-expect-error Issued arrays have no mutable push operation.
  object.value.list.push(3);
  // @ts-expect-error Functions cannot be issued as semantic data.
  createKpImmutableSemanticAssetObject({ ...fields, value: { calculate: () => 1 } });
  // @ts-expect-error Class methods are not plain semantic data.
  createKpImmutableSemanticAssetObject({ ...fields, value: new Date() });
}
void staticOwnershipChecks;
