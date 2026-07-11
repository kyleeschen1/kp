import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../src/semantic/asset.ts";
import {
  createKpSemanticTransformation
} from "../src/semantic/asset-transformation.ts";
import {
  createKpFlashcardSpec,
  validateKpFlashcardSpec
} from "../src/semantic/asset-flashcard.ts";

const bundle = createKpAssetBundle({
  id: "asset.linear-solve",
  title: "Linear solve",
  objects: [
    createKpSemanticAssetObject({
      id: "equation.solve.initial",
      objectType: "equation",
      title: "Initial equation",
      value: { latex: "x + 3 = 7" },
      selectors: [
        { id: "eq0.x", kind: "term", label: "x" },
        { id: "eq0.plus3", kind: "term", label: "+3" }
      ]
    })
  ]
});

const subtract = createKpSemanticTransformation({
  id: "transform.subtract-both-sides.3",
  transformType: "subtractBothSides",
  title: "Subtract 3 from both sides",
  sourceObjectIds: ["equation.solve.initial"],
  targetObjectIds: ["equation.solve.with-inverses"],
  preserves: ["value"]
});

test("createKpFlashcardSpec stores cloze references over an asset", () => {
  const card = createKpFlashcardSpec({
    id: "card.linear-solve.hide-plus3",
    kind: "cloze",
    title: "Hide the constant term",
    assetId: "asset.linear-solve",
    prompt: "What term must be removed to isolate x?",
    selectorIds: ["eq0.plus3"],
    answer: {
      kind: "text",
      value: "+3"
    }
  });

  assert.deepEqual(card, {
    id: "card.linear-solve.hide-plus3",
    kind: "cloze",
    title: "Hide the constant term",
    assetId: "asset.linear-solve",
    prompt: "What term must be removed to isolate x?",
    selectorIds: ["eq0.plus3"],
    answer: {
      kind: "text",
      value: "+3"
    }
  });
  assert.deepEqual(
    validateKpFlashcardSpec(card, {
      bundle,
      transformations: [subtract]
    }),
    []
  );
});

test("createKpFlashcardSpec stores predict-next transformation references", () => {
  const card = createKpFlashcardSpec({
    id: "card.linear-solve.predict-subtract",
    kind: "predict-next",
    title: "Predict the next step",
    assetId: "asset.linear-solve",
    prompt: "Which transformation should happen next?",
    transformationIds: ["transform.subtract-both-sides.3"],
    timeMs: 400,
    answer: {
      kind: "transformation",
      value: "transform.subtract-both-sides.3"
    }
  });

  assert.deepEqual(validateKpFlashcardSpec(card, { bundle, transformations: [subtract] }), []);
});

test("validateKpFlashcardSpec reports unresolved references", () => {
  const card = createKpFlashcardSpec({
    id: "card.bad",
    kind: "explain-transform",
    title: "Bad refs",
    assetId: "asset.other",
    prompt: "Explain this step.",
    objectIds: ["equation.missing"],
    selectorIds: ["selector.missing"],
    transformationIds: ["transform.missing"]
  });

  assert.deepEqual(validateKpFlashcardSpec(card, { bundle, transformations: [subtract] }), [
    {
      path: "assetId",
      message:
        "Flashcard card.bad references asset asset.other but validation context is asset.linear-solve."
    },
    {
      path: "objectIds[0]",
      message: "Flashcard card.bad references missing object equation.missing."
    },
    {
      path: "selectorIds[0]",
      message: "Flashcard card.bad references missing selector selector.missing."
    },
    {
      path: "transformationIds[0]",
      message:
        "Flashcard card.bad references missing transformation transform.missing."
    }
  ]);
});
