import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpSemanticStateSchema,
  encodeKpSemanticStatePathSegment,
  KpSemanticStateSchemaCompileError
} from "../src/semantic-state/authoring-schema-compiler.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateOptional,
  kpStateValue,
  type KpSemanticStateGroupDescriptor,
  type KpSemanticStateMemberMap
} from "../src/semantic-state/authoring-schema.ts";

test("nested schema paths mint stable scoped identity defaults", () => {
  const compiled = compileKpSemanticStateSchema("lesson.tax", kpStateGroup({
    market: kpStateGroup({
      supply: kpStateValue({ intercept: 2, slope: 1 }),
      demand: kpStateValue({ intercept: 12, slope: -1 })
    }),
    equilibrium: kpStateDerived<{ price: number; quantity: number }>(),
    governmentRevenue: kpStateOptional<number>()
  }));

  assert.deepEqual(
    compiled.leaves.map(({ encodedPath }) => encodedPath),
    [
      "equilibrium",
      encodeKpSemanticStatePathSegment("governmentRevenue"),
      "market.demand",
      "market.supply"
    ]
  );
  const supply = compiled.leaves[3];
  assert.equal(
    supply?.identities.slotId,
    "kp-state/lesson.tax/slot/market.supply"
  );
  assert.equal(
    supply?.identities.initialEntityId,
    "kp-state/lesson.tax/entity/initial.market.supply"
  );
  assert.equal(
    supply?.identities.derivationId,
    "kp-state/lesson.tax/derivation/derived.market.supply"
  );
  assert.equal(
    supply?.identities.operationIds.update,
    "schema.market.supply.update"
  );
  assert.equal(
    supply?.identities.sourceIds.initialValue,
    "schema.market.supply.initial-value"
  );
});

test("compilation order depends on paths rather than declaration order", () => {
  const first = compileKpSemanticStateSchema("lesson.order", kpStateGroup({
    zeta: kpStateValue(3),
    alpha: kpStateValue(1),
    middle: kpStateValue(2)
  }));
  const second = compileKpSemanticStateSchema("lesson.order", kpStateGroup({
    middle: kpStateValue(2),
    alpha: kpStateValue(1),
    zeta: kpStateValue(3)
  }));

  assert.deepEqual(projectIdentities(first), projectIdentities(second));
});

test("segment encoding keeps dotted and nested paths injective", () => {
  const compiled = compileKpSemanticStateSchema("lesson.paths", kpStateGroup({
    "market.supply": kpStateValue(1),
    market: kpStateGroup({ supply: kpStateValue(2) }),
    z0061: kpStateValue(3),
    A: kpStateValue(4)
  }));
  const encodedPaths = compiled.leaves.map(({ encodedPath }) => encodedPath);

  assert.equal(new Set(encodedPaths).size, 4);
  assert.ok(encodedPaths.includes("market.supply"));
  assert.ok(encodedPaths.includes("z006d00610072006b00650074002e0073007500700070006c0079"));
  assert.notEqual(
    encodeKpSemanticStatePathSegment("a.b"),
    encodeKpSemanticStatePathSegment("z0061002e0062")
  );
});

test("the same paths remain isolated by schema namespace", () => {
  const schema = kpStateGroup({ value: kpStateValue(1) });
  const first = compileKpSemanticStateSchema("lesson.first", schema);
  const second = compileKpSemanticStateSchema("lesson.second", schema);

  assert.notEqual(
    first.leaves[0]?.identities.slotId,
    second.leaves[0]?.identities.slotId
  );
  assert.notEqual(
    first.leaves[0]?.identities.initialEntityId,
    second.leaves[0]?.identities.initialEntityId
  );
});

test("invalid, reserved, symbol, and cyclic members fail locally", () => {
  assertCompileError(
    () => compileKpSemanticStateSchema("lesson.invalid", kpStateGroup({
      " bad ": kpStateValue(1)
    })),
    "invalid-member-name",
    [" bad "]
  );
  assertCompileError(
    () => compileKpSemanticStateSchema("lesson.reserved", kpStateGroup({
      constructor: kpStateValue(1)
    })),
    "reserved-member-name",
    ["constructor"]
  );

  const symbol = Symbol("hidden");
  assertCompileError(
    () => compileKpSemanticStateSchema("lesson.symbol", kpStateGroup({
      visible: kpStateValue(1),
      [symbol]: kpStateValue(2)
    })),
    "symbol-member-name",
    []
  );

  const cyclic = {
    schemaVersion: "kp.semantic-state-schema-node.v1",
    kind: "group",
    members: {} as Record<string, unknown>
  };
  cyclic.members["again"] = cyclic;
  assertCompileError(
    () => compileKpSemanticStateSchema(
      "lesson.cycle",
      cyclic as KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
    ),
    "descriptor-cycle",
    ["again"]
  );
});

function projectIdentities(
  schema: ReturnType<typeof compileKpSemanticStateSchema>
) {
  return schema.leaves.map(({ path, encodedPath, descriptor, identities }) => ({
    path,
    encodedPath,
    descriptorKind: descriptor.kind,
    identities
  }));
}

function assertCompileError(
  run: () => unknown,
  code: KpSemanticStateSchemaCompileError["code"],
  path: readonly string[]
): void {
  assert.throws(run, (error) => {
    assert.ok(error instanceof KpSemanticStateSchemaCompileError);
    assert.equal(error.code, code);
    assert.deepEqual(error.path, path);
    return true;
  });
}
