import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  KP_FRACTION_COMPOSITION_PROMOTION_STAGES,
  kpFractionCompositionPromotionInventory
} from "../src/reader/compiler/fraction-composition-promotion-inventory.ts";

test("fraction promotion inventory keeps five evidence stages distinct", () => {
  assert.deepEqual(KP_FRACTION_COMPOSITION_PROMOTION_STAGES, [
    "semantic-definition",
    "semantic-composition",
    "compatibility-animation",
    "canonical-renderer",
    "learner-promotion"
  ]);
  assert.equal(
    kpFractionCompositionPromotionInventory.find(
      ({ id }) => id === "fraction.composition-trace"
    )?.stage,
    "semantic-composition"
  );
  assert.equal(
    kpFractionCompositionPromotionInventory.find(
      ({ id }) => id === "fraction.fractional-linear-reader"
    )?.stage,
    "compatibility-animation"
  );
  assert.equal(
    kpFractionCompositionPromotionInventory.find(
      ({ id }) => id === "fraction.numerator-split-merge-reader"
    )?.stage,
    "learner-promotion"
  );
});

test("canonical paint ownership does not imply learner promotion", () => {
  const canonical = kpFractionCompositionPromotionInventory.filter(
    ({ paintOwner }) => paintOwner === "canonical"
  );
  assert.deepEqual(
    canonical.map(({ id }) => id),
    [
      "fraction.numerator-split-merge-reader",
      "fraction.composition-canonical-reader"
    ]
  );
  assert.deepEqual(
    canonical.map(({ stage }) => stage),
    ["learner-promotion", "canonical-renderer"]
  );
});

test("inventory source references exist and target trace has no product route", async () => {
  for (const entry of kpFractionCompositionPromotionInventory) {
    for (const sourceRef of entry.sourceRefs) {
      assert.ok((await readFile(sourceRef, "utf8")).length > 0, sourceRef);
    }
  }
  const target = kpFractionCompositionPromotionInventory.find(
    ({ id }) => id === "fraction.composition-trace"
  );
  assert.equal(target?.productRoute, undefined);
  assert.equal(target?.paintOwner, "none");
});

test("descriptor source distinguishes canonical and compatibility readers", async () => {
  const [fractionalLinear, numeratorSplitMerge] = await Promise.all([
    readFile(
      "src/reader/app/equation-lesson-descriptors/fractional-linear.ts",
      "utf8"
    ),
    readFile(
      "src/reader/app/equation-lesson-descriptors/numerator-split-merge.ts",
      "utf8"
    )
  ]);
  assert.doesNotMatch(
    fractionalLinear,
    /defineKpCanonicalEquationLessonDescriptor/
  );
  assert.match(
    numeratorSplitMerge,
    /defineKpCanonicalEquationLessonDescriptor/
  );
});
