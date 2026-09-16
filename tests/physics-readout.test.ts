import { test } from "node:test";
import assert from "node:assert/strict";
import { defineNumericReadout, physicsReadouts, physicsReadoutValues } from "../src/tutorial/mechanics-relations/physics-readout.ts";
import { checkMomentumEnergy, momentumEnergyExamples, physicalTime, sampleMomentumEnergy } from "../domains/physics/momentum-energy.ts";
import { projectMomentumEnergyFigure, renderMomentumEnergySvg } from "../src/tutorial/mechanics-relations/momentum-energy-figure.ts";

test("numeric slots preserve precision, sign capacity and rounded digit growth", () => {
  const spec = defineNumericReadout({ decimals: 2, min: -12, max: 100, unit: "m" });
  assert.equal(spec.format(1), "1.00");
  assert.equal(spec.format(1.2), "1.20");
  assert.equal(spec.format(-0.001), "0.00");
  assert.equal(spec.format(-0), "0.00");
  assert.equal(spec.format(9.999), "10.00");
  assert.equal(spec.format(99.999), "100.00");
  for (const value of [-12, -9.999, -0.006, -.004, 0, 1, 9.999, 99.999, 100])
    assert.ok(spec.format(value).length <= spec.columns);
  for (const value of [NaN, Infinity, -Infinity, -12.001, 100.001, null])
    assert.throws(() => spec.format(value), /declared range/);
  assert.equal(physicsReadouts.forceAlongMotion.format(null), "—");
  for (const patch of [{ decimals: -1 }, { decimals: 1.2 }, { decimals: 7 }, { min: NaN }, { max: Infinity }, { min: 101 }, { max: 1e21 }])
    assert.throws(() => defineNumericReadout({ decimals: 2, min: -12, max: 100, unit: "m", ...patch }));
});

test("readout ranges cover both complete checked fixture families without altering physical values", () => {
  for (const source of momentumEnergyExamples) for (const massKg of [1, 1.25, 2, 3.5, 4]) {
    const result = checkMomentumEnergy({ ...source, massKg });
    assert.equal(result.status, "checked"); if (result.status !== "checked") continue;
    for (let step = 0; step <= 100; step++) {
      const frame = sampleMomentumEnergy(result.model, physicalTime(result.model.durationSeconds * step / 100));
      const values = physicsReadoutValues(frame);
      for (const id of Object.keys(physicsReadouts) as (keyof typeof physicsReadouts)[]) {
        const spec = physicsReadouts[id], text = spec.format(values[id]);
        assert.ok(text.length <= spec.columns, `${source.episode} ${id}: ${text}`);
        if (values[id] !== null) assert.match(text, /^-?\d+\.\d{2}$/);
      }
      assert.equal(values.power, frame.power);
      assert.equal(values.forceAlongMotion === null, frame.speed === 0);
    }
  }
});

test("fixed plot bounds retain arrowheads across the supported masses and both fixtures", () => {
  for (const source of momentumEnergyExamples) for (const massKg of [1, 2, 4]) {
    const result = checkMomentumEnergy({ ...source, massKg });
    assert.equal(result.status, "checked"); if (result.status !== "checked") continue;
    const bounds = /viewBox="([^"]+)"/.exec(renderMomentumEnergySvg(result.model, physicalTime(0)))![1]!;
    const [left = 0, top = 0, width = 0, height = 0] = bounds.split(" ").map(Number);
    for (let step = 0; step <= 100; step++) {
      const time = physicalTime(result.model.durationSeconds * step / 100);
      assert.equal(/viewBox="([^"]+)"/.exec(renderMomentumEnergySvg(result.model, time))![1], bounds);
      const projection = projectMomentumEnergyFigure(sampleMomentumEnergy(result.model, time));
      for (const path of [projection.momentum, projection.force, projection.rightAngle]) {
        for (const point of path.matchAll(/[ML]([-\d.e+]+) ([-\d.e+]+)/g)) {
          const x = Number(point[1]), y = Number(point[2]);
          assert.ok(x >= left + 2 && x <= left + width - 2 && y >= top + 2 && y <= top + height - 2,
            `${source.episode} mass ${massKg} step ${step}: (${x}, ${y}) outside ${bounds}`);
        }
      }
    }
  }
});
