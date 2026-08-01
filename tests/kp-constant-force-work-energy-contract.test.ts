import assert from "node:assert/strict";
import test from "node:test";

import {
  kpConstantForceWorkEnergyExemplarInput,
  kpConstantForceWorkEnergyPreservation,
  kpConstantForceWorkEnergySchemaVersion
} from "../domains/physics/constant-force-work-energy.ts";

test("constant-force work-energy freezes one exact bounded scenario", () => {
  const input = kpConstantForceWorkEnergyExemplarInput;

  assert.equal(input.schemaVersion, kpConstantForceWorkEnergySchemaVersion);
  assert.deepEqual(input.assumptions, [
    "one-dimensional-horizontal-motion",
    "constant-net-force",
    "force-parallel-to-displacement",
    "frictionless-horizontal-surface",
    "vertical-forces-cancel"
  ]);
  assert.deepEqual(input.motion.object, {
    id: "object.physics.work-energy.block",
    initialKineticEnergy: {
      value: { numerator: "4", denominator: "1" },
      unitId: "unit.si.joule"
    }
  });
  assert.deepEqual(input.motion.interval, {
    id: "interval.physics.work-energy.displacement",
    axis: "positive-x",
    start: { numerator: "0", denominator: "1" },
    end: { numerator: "4", denominator: "1" },
    unitId: "unit.si.meter"
  });
  assert.deepEqual(input.motion.netForce, {
    id: "vector.physics.work-energy.net-force",
    componentId: "quantity.physics.work-energy.force-x",
    direction: "positive-x",
    magnitude: { numerator: "3", denominator: "1" },
    unitId: "unit.si.newton",
    parameter: {
      id: "parameter.physics.work-energy.net-force-newtons",
      minimum: { numerator: "1", denominator: "1" },
      maximum: { numerator: "5", denominator: "1" },
      step: { numerator: "1", denominator: "1" },
      default: { numerator: "3", denominator: "1" }
    }
  });
});

test("physics graph fixes position-force axes and one work area identity", () => {
  const graph = kpConstantForceWorkEnergyExemplarInput.forcePositionGraph;

  assert.deepEqual(graph.positionAxis, {
    id: "axis.physics.work-energy.position",
    symbolLatex: "x",
    label: "Position",
    orientation: "horizontal",
    unitId: "unit.si.meter",
    minimum: { numerator: "0", denominator: "1" },
    maximum: { numerator: "5", denominator: "1" },
    tickStep: { numerator: "1", denominator: "1" }
  });
  assert.deepEqual(graph.forceAxis, {
    id: "axis.physics.work-energy.force-x",
    symbolLatex: "F_x",
    label: "Horizontal net force",
    orientation: "vertical",
    unitId: "unit.si.newton",
    minimum: { numerator: "0", denominator: "1" },
    maximum: { numerator: "6", denominator: "1" },
    tickStep: { numerator: "1", denominator: "1" }
  });
  assert.equal(graph.constantForceSegmentId, "segment.physics.work-energy.constant-force");
  assert.equal(graph.workAreaId, "area.physics.work-energy.accumulated-work");
});

test("canonical results preserve exact work-energy and SI dimensional identities", () => {
  const input = kpConstantForceWorkEnergyExemplarInput;

  assert.deepEqual(input.canonicalResults, {
    work: {
      value: { numerator: "12", denominator: "1" },
      unitId: "unit.si.joule"
    },
    kineticEnergyChange: {
      value: { numerator: "12", denominator: "1" },
      unitId: "unit.si.joule"
    },
    finalKineticEnergy: {
      value: { numerator: "16", denominator: "1" },
      unitId: "unit.si.joule"
    }
  });
  assert.deepEqual(input.units.newton.siDimension, {
    mass: 1,
    length: 1,
    time: -2
  });
  assert.deepEqual(input.units.joule.siDimension, {
    mass: 1,
    length: 2,
    time: -2
  });
  assert.equal(input.laws.unitIdentity, "newton-meter-equals-joule");
  assert.deepEqual(input.preservation, kpConstantForceWorkEnergyPreservation);
});
