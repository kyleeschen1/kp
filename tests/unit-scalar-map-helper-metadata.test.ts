import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpStandardMathAuthoringContext
} from "../src/math/authoring/algebra.ts";
import {
  defineKpAuthoredUnitScalarMap
} from "../src/math/authoring/unit-scalar-map.ts";
import {
  createKpUnitDescriptor,
  createKpUnitValue
} from "../src/math/authoring/units.ts";

const quantityUnit = createKpUnitDescriptor({
  id: "fixture.unit.item",
  symbol: "item"
});
const priceUnit = createKpUnitDescriptor({
  id: "fixture.unit.usd",
  symbol: "USD"
});

test("one-call authoring retains explicit provenance and tested evidence", () => {
  const authored = defineMap();
  const derivative = authored.map.derivativeAt(
    createKpUnitValue(quantityUnit, 10)
  );

  assert.equal(authored.kind, "authored-unit-scalar-map");
  assert.deepEqual(authored.ids, {
    map: "fixture.market.functions.demand-price-at-quantity",
    derivative: "fixture.market.derivatives.demand"
  });
  assert.deepEqual(authored.provenance, {
    sourceFunctionId: "fixture.market.curves.demand",
    derivativeSourceMapId: "fixture.market.curves.demand",
    testedLinearitySuiteId: "fixture.test.demand-derivative-linearity"
  });
  assert.deepEqual(authored.map.sourceFunctionIds, [
    authored.provenance.sourceFunctionId
  ]);
  assert.deepEqual(derivative.sourceMapIds, [
    authored.provenance.derivativeSourceMapId
  ]);
  assert.deepEqual(derivative.linearity, {
    kind: "tested",
    suiteId: authored.provenance.testedLinearitySuiteId,
    equalityId: authored.spaces.codomain.vectors.equality.id
  });
  assert.equal(
    authored.derivativeUnitLatex,
    "\\frac{\\mathrm{USD}}{\\mathrm{item}}"
  );
  assert.equal(Object.isFrozen(authored.provenance), true);
});

test("default derivative provenance names the authored map itself", () => {
  const authored = defineMap({ derivativeMapId: undefined });
  const derivative = authored.map.derivativeAt(
    createKpUnitValue(quantityUnit, 0)
  );

  assert.equal(authored.provenance.derivativeSourceMapId, authored.map.id);
  assert.deepEqual(derivative.sourceMapIds, [authored.map.id]);
});

test("metadata is validated without manufacturing source or proof", async () => {
  assert.throws(
    () => defineMap({ functionId: "" }),
    /Unit-scalar source function id must be non-empty and trimmed/
  );
  assert.throws(
    () => defineMap({ derivativeMapId: " " }),
    /Unit-scalar derivative source map id must be non-empty and trimmed/
  );
  assert.throws(
    () => defineMap({ testedLinearitySuiteId: "" }),
    /Unit-scalar tested-linearity suite id must be non-empty and trimmed/
  );

  const source = await readFile(
    "src/math/authoring/unit-scalar-map.ts",
    "utf8"
  );
  assert.doesNotMatch(source, /kind: "proved"/);
  assert.doesNotMatch(source, /authorityId:/);
  assert.doesNotMatch(source, /renderer|Graph2D|KaTeX|Article/);
});

function defineMap(overrides: Readonly<{
  functionId?: string | undefined;
  derivativeMapId?: string | undefined;
  testedLinearitySuiteId?: string | undefined;
}> = {}) {
  const functionId = overrides.functionId ?? "fixture.market.curves.demand";
  const derivativeMapId = Object.hasOwn(overrides, "derivativeMapId")
    ? overrides.derivativeMapId
    : "fixture.market.curves.demand";
  return defineKpAuthoredUnitScalarMap(
    createKpStandardMathAuthoringContext({ namespace: "fixture.market" }),
    {
      path: "demand-price-at-quantity",
      derivativePath: "demand",
      domain: {
        path: "quantity",
        label: "Market quantity",
        unit: quantityUnit
      },
      codomain: {
        path: "price",
        label: "Market price",
        unit: priceUnit
      },
      evaluateMagnitude: (quantity) => 100 - 2 * quantity,
      derivativeMagnitudeAt: (_quantity, change) => -2 * change,
      diagnostics: {
        evaluationInput: "Demand quantity",
        derivativePoint: "Demand derivative point",
        derivativeChange: "Demand quantity change"
      },
      source: {
        functionId,
        ...(derivativeMapId === undefined ? {} : { derivativeMapId })
      },
      testedLinearitySuiteId: overrides.testedLinearitySuiteId ??
        "fixture.test.demand-derivative-linearity"
    }
  );
}
