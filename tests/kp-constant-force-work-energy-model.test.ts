import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpConstantForceWorkEnergyModel,
  evaluateKpConstantForceWorkEnergyAtPosition,
  validateKpConstantForceWorkEnergyInput
} from "../domains/physics/constant-force-work-energy-model.ts";
import {
  kpConstantForceWorkEnergyExemplarInput,
  type KpConstantForceWorkEnergyModelInputV1
} from "../domains/physics/constant-force-work-energy.ts";

const exact = (numerator: string, denominator = "1") => ({
  numerator,
  denominator
});

test("exact physics model derives work and kinetic energy at both boundaries", () => {
  const model = createKpConstantForceWorkEnergyModel();

  assert.deepEqual(model.parameterState, {
    netForceMagnitude: exact("3")
  });
  assert.deepEqual(model.states.initial, {
    id: "state.physics.work-energy.initial",
    phase: "initial",
    objectId: "object.physics.work-energy.block",
    position: exact("0"),
    displacement: exact("0"),
    netForceMagnitude: exact("3"),
    accumulatedWork: exact("0"),
    kineticEnergyChange: exact("0"),
    kineticEnergy: exact("4"),
    workEqualsKineticEnergyChange: true
  });
  assert.deepEqual(model.states.final, {
    id: "state.physics.work-energy.final",
    phase: "final",
    objectId: "object.physics.work-energy.block",
    position: exact("4"),
    displacement: exact("4"),
    netForceMagnitude: exact("3"),
    accumulatedWork: exact("12"),
    kineticEnergyChange: exact("12"),
    kineticEnergy: exact("16"),
    workEqualsKineticEnergyChange: true
  });
  assert.equal(model.unitProof.newtonTimesMeterEqualsJoule, true);
  assert.equal(Object.isFrozen(model.states.final), true);
});

test("position sampling preserves exact fractional work-energy truth", () => {
  const model = createKpConstantForceWorkEnergyModel();

  assert.deepEqual(
    evaluateKpConstantForceWorkEnergyAtPosition({
      model,
      position: exact("3", "2")
    }),
    {
      id: "state.physics.work-energy.sample",
      phase: "sample",
      objectId: "object.physics.work-energy.block",
      position: exact("3", "2"),
      displacement: exact("3", "2"),
      netForceMagnitude: exact("3"),
      accumulatedWork: exact("9", "2"),
      kineticEnergyChange: exact("9", "2"),
      kineticEnergy: exact("17", "2"),
      workEqualsKineticEnergyChange: true
    }
  );
});

test("bounded force parameter recomputes exact model truth without mutating the contract", () => {
  const model = createKpConstantForceWorkEnergyModel({
    netForceMagnitude: exact("5")
  });

  assert.deepEqual(model.states.final.accumulatedWork, exact("20"));
  assert.deepEqual(model.states.final.kineticEnergy, exact("24"));
  assert.deepEqual(
    model.input.motion.netForce.magnitude,
    kpConstantForceWorkEnergyExemplarInput.motion.netForce.magnitude
  );
  assert.throws(
    () =>
      createKpConstantForceWorkEnergyModel({
        netForceMagnitude: exact("6")
      }),
    /netForceMagnitude must lie inside the authored parameter bounds/
  );
});

test("bounded model rejects unit-law, graph-domain, and canonical-result drift", () => {
  const input: KpConstantForceWorkEnergyModelInputV1 = {
    ...kpConstantForceWorkEnergyExemplarInput,
    units: {
      ...kpConstantForceWorkEnergyExemplarInput.units,
      joule: {
        ...kpConstantForceWorkEnergyExemplarInput.units.joule,
        siDimension: { mass: 1, length: 1, time: -2 }
      }
    },
    forcePositionGraph: {
      ...kpConstantForceWorkEnergyExemplarInput.forcePositionGraph,
      positionAxis: {
        ...kpConstantForceWorkEnergyExemplarInput.forcePositionGraph.positionAxis,
        maximum: exact("3")
      }
    },
    canonicalResults: {
      ...kpConstantForceWorkEnergyExemplarInput.canonicalResults,
      work: {
        ...kpConstantForceWorkEnergyExemplarInput.canonicalResults.work,
        value: exact("11")
      }
    }
  };
  const issues = validateKpConstantForceWorkEnergyInput(input);

  assert.deepEqual(
    issues.map(({ path }) => path),
    [
      "units.joule.siDimension",
      "motion.interval.end",
      "canonicalResults.work.value"
    ]
  );
  assert.throws(
    () => createKpConstantForceWorkEnergyModel({ input }),
    /newton times meter must equal joule/
  );
});
