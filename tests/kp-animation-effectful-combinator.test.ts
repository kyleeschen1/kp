import assert from "node:assert/strict";
import test from "node:test";

import {
  chainKpAnimationCombinatorResult,
  checkKpAnimationCombinatorEffectOrder,
  createKpAnimationCombinatorEffect,
  createKpAnimationCombinatorResult,
  mapKpAnimationCombinatorResult
} from "../src/animation/effectful-combinator.ts";

test("animation combinator map preserves ordered effects", () => {
  const result = createKpAnimationCombinatorResult({
    value: 2,
    effects: [
      createKpAnimationCombinatorEffect({
        id: "effect.parse",
        kind: "diagnostic",
        summary: "Parsed external trace."
      })
    ]
  });
  const mapped = mapKpAnimationCombinatorResult(result, (value) => value * 2);

  assert.equal(mapped.value, 4);
  assert.deepEqual(mapped.effects.map((effect) => effect.id), ["effect.parse"]);
});

test("animation combinator chain threads effects in order", () => {
  const result = createKpAnimationCombinatorResult({
    value: "trace",
    effects: [
      createKpAnimationCombinatorEffect({
        id: "effect.import",
        kind: "external-port",
        summary: "Imported trace."
      })
    ]
  });
  const chained = chainKpAnimationCombinatorResult(result, (value) =>
    createKpAnimationCombinatorResult({
      value: `${value}:animation`,
      effects: [
        createKpAnimationCombinatorEffect({
          id: "effect.project",
          kind: "projection",
          summary: "Projected animation."
        })
      ]
    })
  );

  assert.equal(chained.value, "trace:animation");
  assert.deepEqual(chained.effects.map((effect) => effect.id), [
    "effect.import",
    "effect.project"
  ]);
  assert.deepEqual(
    checkKpAnimationCombinatorEffectOrder(chained, [
      "effect.import",
      "effect.project"
    ]),
    {
      lawId: "animation-combinator.effect-order",
      passed: true,
      failures: []
    }
  );
});

test("effect order law reports missing or reordered effects", () => {
  const result = createKpAnimationCombinatorResult({
    value: "trace:animation",
    effects: [
      createKpAnimationCombinatorEffect({
        id: "effect.project",
        kind: "projection",
        summary: "Projected animation."
      }),
      createKpAnimationCombinatorEffect({
        id: "effect.import",
        kind: "external-port",
        summary: "Imported trace."
      })
    ]
  });

  assert.deepEqual(
    checkKpAnimationCombinatorEffectOrder(result, [
      "effect.import",
      "effect.project"
    ]),
    {
      lawId: "animation-combinator.effect-order",
      passed: false,
      failures: [
        {
          path: "effects",
          message:
            "Animation combinator result must preserve effect order effect.import -> effect.project."
        }
      ]
    }
  );
});

