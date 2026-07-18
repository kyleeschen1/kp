import assert from "node:assert/strict";
import test from "node:test";
import {
  checkKpTutorialInteractionDeterminism,
  sampleKpTutorialInteractionModel,
  type KpTutorialInteractionModel
} from "../src/tutorial/interaction-model.ts";

const model = {
  id: "interaction.ftc",
  parameters: [
    {
      id: "upperBound",
      label: "x",
      defaultValue: 2,
      minimum: 0,
      maximum: 3,
      step: 0.25
    }
  ],
  derivedLaws: [
    {
      id: "law.ftc.quadratic-area",
      inputIds: ["upperBound"],
      outputIds: ["accumulatedArea", "integrandHeight"],
      summary: "Exact t squared lens."
    }
  ]
} satisfies KpTutorialInteractionModel;

const evaluators = {
  "law.ftc.quadratic-area": ({ upperBound }: Readonly<Record<string, number>>) => ({
    accumulatedArea: upperBound! ** 3 / 3,
    integrandHeight: upperBound! ** 2
  })
};

test("interaction parameters normalize before named derived laws run", () => {
  const frame = sampleKpTutorialInteractionModel({
    model,
    parameterValues: { upperBound: 2.13 },
    evaluators
  });

  assert.deepEqual(frame.parameterValues, { upperBound: 2.25 });
  assert.deepEqual(frame.derivedValues, {
    accumulatedArea: 3.796875,
    integrandHeight: 5.0625
  });
  assert.equal(
    checkKpTutorialInteractionDeterminism({ model, evaluators }),
    true
  );
});

test("interaction sampling refuses missing domain-law evaluators", () => {
  assert.throws(
    () => sampleKpTutorialInteractionModel({ model, evaluators: {} }),
    /Missing evaluator for derived law law.ftc.quadratic-area/
  );
});
