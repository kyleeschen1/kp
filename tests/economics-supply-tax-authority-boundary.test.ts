import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpPerUnitTaxWelfareModel
} from "../domains/economics/per-unit-tax-welfare-model.ts";
import {
  projectKpExactRationalLinearMarket
} from "../src/experiments/typed-linear-supply-demand/exact-rational-adapter.ts";
import {
  createKpStandardMathAuthoringContext
} from "../src/math/authoring/algebra.ts";
import {
  createKpUnitDescriptor
} from "../src/math/authoring/units.ts";

test("the exact domain remains upstream of the typed pressure projection", async () => {
  const [model, accounting, adapter, experiment] = await Promise.all([
    readFile("domains/economics/per-unit-tax-welfare-model.ts", "utf8"),
    readFile("domains/economics/per-unit-tax-welfare-accounting.ts", "utf8"),
    readFile(
      "src/experiments/typed-linear-supply-demand/exact-rational-adapter.ts",
      "utf8"
    ),
    readFile(
      "src/experiments/typed-linear-supply-demand/typed-linear-supply-demand.ts",
      "utf8"
    )
  ]);

  assert.doesNotMatch(model, /src\/experiments/);
  assert.doesNotMatch(accounting, /src\/experiments/);
  assert.doesNotMatch(experiment, /domains\/economics/);
  assert.match(adapter, /domains\/economics\/per-unit-tax-welfare-model\.ts/);
  assert.match(adapter, /\.\/typed-linear-supply-demand\.ts/);
});

test("the reviewed supply-tax asset still consumes canonical domain truth", async () => {
  const source = await readFile(
    "src/animation/economics-supply-tax-asset.ts",
    "utf8"
  );

  assert.match(source, /domains\/economics\/per-unit-tax-welfare-asset\.ts/);
  assert.match(source, /domains\/economics\/per-unit-tax-welfare-frame\.ts/);
  assert.doesNotMatch(source, /typed-linear-supply-demand/);
  assert.doesNotMatch(source, /exact-rational-adapter/);
});

test("the typed projection remains an internal pressure seam", async () => {
  const files = await readdir(
    "src/experiments/typed-linear-supply-demand"
  );
  const projection = projectKpExactRationalLinearMarket({
    author: createKpStandardMathAuthoringContext({
      namespace: "lesson.economics.authority-gate"
    }),
    key: "market",
    model: createKpPerUnitTaxWelfareModel(),
    units: {
      quantity: createKpUnitDescriptor({
        id: "kp.unit.economics.authority.item",
        symbol: "item"
      }),
      price: createKpUnitDescriptor({
        id: "kp.unit.economics.authority.usd-per-item",
        symbol: "USD/item"
      }),
      welfare: createKpUnitDescriptor({
        id: "kp.unit.economics.authority.usd",
        symbol: "USD"
      })
    }
  });

  assert.equal(files.includes("public-api.ts"), false);
  assert.equal(files.includes("index.ts"), false);
  assert.equal(projection.market.kind, "linear-supply-demand-experiment");
  assert.equal(projection.canonical.model.id, projection.sourceIds[0]);
  assert.equal(Object.isFrozen(projection), true);
});

test("the authority record names supported parity and explicit gaps", async () => {
  const record = await readFile(
    "docs/project/reviews/2026-09-03-economics-authority-gate.md",
    "utf8"
  );

  assert.match(record, /sole computational authority/);
  assert.match(record, /one-way/);
  assert.match(record, /Supported Parity/);
  assert.match(record, /Explicit Gaps/);
  assert.match(record, /Non-binary-exact rationals/);
  assert.match(record, /Price floors are outside parity/);
  assert.match(record, /not a competing source of economic truth/);
});
