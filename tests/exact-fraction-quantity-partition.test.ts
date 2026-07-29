import assert from "node:assert/strict";
import test from "node:test";

import { createKpRational } from "../domains/math/exact-rational.ts";
import { createKpExactQuantityUnit } from "../domains/quantities/exact-quantity.ts";
import {
  certifyKpFinitePartition,
  createKpFinitePartitionSelection,
  createKpUniformFinitePartition,
  type KpFinitePartitionPartId
} from "../domains/quantities/finite-partition.ts";

const unit = createKpExactQuantityUnit(
  "unit.exact-fraction-quantity.one-whole",
  "one whole"
);

test("uniform partitions have deterministic stable IDs and exact totality", () => {
  const createSixths = () => createKpUniformFinitePartition({
    id: "partition.unit-sixths",
    unit,
    partCount: 6,
    partIdPrefix: "part.unit-sixth"
  });
  const first = createSixths();
  const second = createSixths();

  assert.deepEqual(first, second);
  assert.deepEqual(
    first.parts.map(({ id }) => id),
    [
      "part.unit-sixth.0",
      "part.unit-sixth.1",
      "part.unit-sixth.2",
      "part.unit-sixth.3",
      "part.unit-sixth.4",
      "part.unit-sixth.5"
    ]
  );
  assert.deepEqual(first.totalMeasure, {
    numerator: 1n,
    denominator: 1n
  });
  assert.ok(first.parts.every(({ measure }) =>
    measure.numerator === 1n && measure.denominator === 6n
  ));
});

test("partition selections derive exact measure only from certified parts", () => {
  const sixths = createKpUniformFinitePartition({
    id: "partition.unit-sixths",
    unit,
    partCount: 6,
    partIdPrefix: "part.unit-sixth"
  });
  const selectedThird = createKpFinitePartitionSelection(
    sixths,
    "selection.one-third-as-sixths",
    [sixths.parts[0]!.id, sixths.parts[1]!.id]
  );

  assert.equal(selectedThird.partitionId, sixths.id);
  assert.equal(selectedThird.unit, unit);
  assert.deepEqual(selectedThird.quantity.value, {
    numerator: 1n,
    denominator: 3n
  });
});

test("duplicate and missing selection parts fail closed", () => {
  const sixths = createKpUniformFinitePartition({
    id: "partition.unit-sixths",
    unit,
    partCount: 6
  });
  const first = sixths.parts[0]!.id;

  assert.throws(
    () => createKpFinitePartitionSelection(
      sixths,
      "selection.duplicate",
      [first, first]
    ),
    /cannot repeat a part/
  );
  assert.throws(
    () => createKpFinitePartitionSelection(
      sixths,
      "selection.missing",
      [
        "partition.unit-sixths.part.99" as
          KpFinitePartitionPartId<"partition.unit-sixths">
      ]
    ),
    /references missing part/
  );
});

test("certification rejects duplicate IDs, missing ordinals, and bad totals", () => {
  const part = (id: string, ordinal: number, numerator = 1n) => ({
    id,
    ordinal,
    measure: createKpRational(numerator, 2n)
  });

  assert.throws(
    () => certifyKpFinitePartition({
      id: "partition.duplicate",
      unit,
      parts: [part("part.same", 0), part("part.same", 1)]
    }),
    /part IDs must be unique/
  );
  assert.throws(
    () => certifyKpFinitePartition({
      id: "partition.ordinal-gap",
      unit,
      parts: [part("part.0", 0), part("part.2", 2)]
    }),
    /ordinals must be unique and contiguous/
  );
  assert.throws(
    () => certifyKpFinitePartition({
      id: "partition.bad-total",
      unit,
      parts: [part("part.0", 0)]
    }),
    /must total one whole/
  );
});

test("part identity is partition-scoped at compile time", () => {
  const thirds = createKpUniformFinitePartition({
    id: "partition.thirds",
    unit,
    partCount: 3
  });
  const sixths = createKpUniformFinitePartition({
    id: "partition.sixths",
    unit,
    partCount: 6
  });

  if (false as boolean) {
    createKpFinitePartitionSelection(
      thirds,
      "selection.invalid",
      // @ts-expect-error A sixth ID cannot silently become a third ID.
      [sixths.parts[0]!.id]
    );
  }
  assert.notEqual(thirds.parts[0]!.id, sixths.parts[0]!.id);
});

test("the semantic partition model contains no view geometry", () => {
  const partition = createKpUniformFinitePartition({
    id: "partition.sixths",
    unit,
    partCount: 6
  });
  const keys = JSON.stringify(partition, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value
  );

  assert.doesNotMatch(
    keys,
    /angle|radius|path|coordinate|pixel|svg|dom|rendered-order/iu
  );
});
