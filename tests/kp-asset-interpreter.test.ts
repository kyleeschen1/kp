import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../src/semantic/asset.ts";
import {
  createKpInterpreter,
  runKpInterpreter
} from "../src/semantic/asset-interpreter.ts";

const bundle = createKpAssetBundle({
  id: "asset.linear-solve",
  title: "Linear solve",
  objects: [
    createKpSemanticAssetObject({
      id: "equation.solve.initial",
      objectType: "equation",
      title: "Initial equation",
      value: { latex: "x + 3 = 7" },
      selectors: [{ id: "eq0.x", kind: "term", label: "x" }]
    })
  ]
});

test("runKpInterpreter wraps strict interpretation metadata around output", () => {
  const interpreter = createKpInterpreter({
    id: "interpreter.katex.dom",
    target: "katex-dom",
    inputKind: "asset-bundle",
    preservation: "strict",
    interpret: (input: typeof bundle) => ({
      output: {
        latex: input.objects.map((object) => object.value).map((value) => {
          if (
            typeof value === "object" &&
            value !== null &&
            "latex" in value &&
            typeof value.latex === "string"
          ) {
            return value.latex;
          }

          return "";
        })
      }
    })
  });

  assert.deepEqual(runKpInterpreter(interpreter, bundle), {
    interpreterId: "interpreter.katex.dom",
    target: "katex-dom",
    inputKind: "asset-bundle",
    preservation: "strict",
    output: {
      latex: ["x + 3 = 7"]
    },
    diagnostics: []
  });
});

test("runKpInterpreter reports lax or lossy interpretation diagnostics", () => {
  const interpreter = createKpInterpreter({
    id: "interpreter.external.cas",
    target: "custom",
    inputKind: "asset-bundle",
    preservation: "lax",
    interpret: () => ({
      preservation: "lax",
      output: {
        imported: true
      },
      diagnostics: [
        {
          severity: "warning",
          code: "selector-renamed",
          message: "External selectors were normalized during interpretation.",
          path: "objects[0].selectors"
        }
      ]
    })
  });

  assert.deepEqual(runKpInterpreter(interpreter, bundle), {
    interpreterId: "interpreter.external.cas",
    target: "custom",
    inputKind: "asset-bundle",
    preservation: "lax",
    output: {
      imported: true
    },
    diagnostics: [
      {
        severity: "warning",
        code: "selector-renamed",
        message: "External selectors were normalized during interpretation.",
        path: "objects[0].selectors"
      }
    ]
  });
});

test("createKpInterpreter rejects empty identifiers", () => {
  assert.throws(
    () =>
      createKpInterpreter({
        id: "",
        target: "dashboard",
        inputKind: "asset-bundle",
        preservation: "strict",
        interpret: () => ({ output: null })
      }),
    /Interpreter id must not be empty/
  );
});
