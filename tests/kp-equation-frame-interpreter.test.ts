import assert from "node:assert/strict";
import test from "node:test";

import { runKpInterpreter } from "../src/semantic/asset-interpreter.ts";
import {
  createKpEquationFrameInterpreter,
  type KpEquationFrame
} from "../src/semantic/equation-frame-interpreter.ts";

test("equation frame interpreter contract carries semantic ids to KaTeX frames", () => {
  const interpreter = createKpEquationFrameInterpreter<{ progress: number }>({
    id: "interpreter.linear-solve.katex-frame",
    inputKind: "linear-solve-asset",
    preservation: "sampled",
    interpret: ({ progress }) => ({
      output: {
        id: "frame.linear-solve.katex.0001",
        assetId: "asset.linear-solve",
        progress,
        surface: "katex-dom",
        activeTransformationIds: [
          "transform.linear-solve.cancel-left-additive-inverse"
        ],
        objectRefs: [
          {
            objectId: "equation.linear-solve.after-subtract",
            role: "source"
          },
          {
            objectId: "equation.linear-solve.left-simplified",
            role: "target"
          }
        ],
        transformationRefs: [
          {
            transformationId: "transform.linear-solve.cancel-left-additive-inverse",
            sourceObjectIds: ["equation.linear-solve.after-subtract"],
            targetObjectIds: ["equation.linear-solve.left-simplified"],
            progress
          }
        ],
        selectorRefs: [
          {
            selectorId: "equation.linear-solve.after-subtract.lhs.x",
            objectId: "equation.linear-solve.after-subtract",
            role: "persistent"
          },
          {
            selectorId: "equation.linear-solve.left-simplified.lhs.x",
            objectId: "equation.linear-solve.left-simplified",
            role: "persistent"
          }
        ],
        diagnostics: []
      } satisfies KpEquationFrame
    })
  });

  const interpretation = runKpInterpreter(interpreter, { progress: 0.5 });

  assert.equal(interpretation.target, "katex-dom");
  assert.equal(interpretation.inputKind, "linear-solve-asset");
  assert.equal(interpretation.preservation, "sampled");
  assert.equal(interpretation.output.surface, "katex-dom");
  assert.deepEqual(
    interpretation.output.transformationRefs.map((ref) => ref.transformationId),
    ["transform.linear-solve.cancel-left-additive-inverse"]
  );
  assert.deepEqual(
    interpretation.output.selectorRefs.map((ref) => ref.selectorId),
    [
      "equation.linear-solve.after-subtract.lhs.x",
      "equation.linear-solve.left-simplified.lhs.x"
    ]
  );
});

test("equation frame interpreter rejects empty contract identifiers", () => {
  assert.throws(
    () =>
      createKpEquationFrameInterpreter({
        id: "",
        inputKind: "linear-solve-asset",
        preservation: "strict",
        interpret: () => ({
          output: {
            id: "frame.linear-solve.katex.0000",
            assetId: "asset.linear-solve",
            progress: 0,
            surface: "katex-dom",
            activeTransformationIds: [],
            objectRefs: [],
            transformationRefs: [],
            selectorRefs: [],
            diagnostics: []
          }
        })
      }),
    /Interpreter id must not be empty/
  );
});
