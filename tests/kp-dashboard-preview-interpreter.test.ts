import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../src/semantic/asset.ts";
import { runKpInterpreter } from "../src/semantic/asset-interpreter.ts";
import {
  createKpDashboardAssetPreviewInterpreter
} from "../src/semantic/dashboard-preview-interpreter.ts";

test("dashboard asset preview interpreter summarizes semantic asset rows", () => {
  const bundle = createKpAssetBundle({
    id: "asset.preview",
    title: "Preview asset",
    objects: [
      createKpSemanticAssetObject({
        id: "equation.initial",
        objectType: "equation",
        title: "Initial equation",
        value: { latex: "x + 3 = 7" },
        selectors: [
          { id: "equation.initial.x", kind: "term", label: "x" },
          { id: "equation.initial.plus3", kind: "term", label: "+3" }
        ]
      }),
      createKpSemanticAssetObject({
        id: "graph.solution",
        objectType: "graph",
        title: "Solution graph",
        value: { equation: "x = 4" },
        selectors: [{ id: "graph.solution.point", kind: "point", label: "(4, 0)" }]
      })
    ]
  });

  assert.deepEqual(
    runKpInterpreter(createKpDashboardAssetPreviewInterpreter(), bundle),
    {
      interpreterId: "interpreter.dashboard.asset-preview",
      target: "dashboard",
      inputKind: "asset-bundle",
      preservation: "strict",
      output: {
        assetId: "asset.preview",
        title: "Preview asset",
        summary: "2 objects, 3 selectors",
        fields: [
          { label: "Asset id", value: "asset.preview" },
          { label: "Version", value: "1" },
          { label: "Objects", value: "2" },
          { label: "Selectors", value: "3" },
          { label: "Object types", value: "equation, graph" }
        ],
        searchFields: [
          "asset.preview",
          "Preview asset",
          "equation.initial",
          "Initial equation",
          "equation",
          "equation.initial.x",
          "equation.initial.plus3",
          "graph.solution",
          "Solution graph",
          "graph",
          "graph.solution.point"
        ]
      },
      diagnostics: []
    }
  );
});

test("dashboard asset preview interpreter reports asset validation diagnostics", () => {
  const bundle = createKpAssetBundle({
    id: "asset.invalid-preview",
    title: "Invalid preview asset",
    objects: [
      createKpSemanticAssetObject({
        id: "equation.a",
        objectType: "equation",
        title: "Equation A",
        value: {},
        selectors: [{ id: "selector.shared", kind: "term" }]
      }),
      createKpSemanticAssetObject({
        id: "equation.b",
        objectType: "equation",
        title: "Equation B",
        value: {},
        selectors: [{ id: "selector.shared", kind: "term" }]
      })
    ]
  });

  assert.deepEqual(
    runKpInterpreter(createKpDashboardAssetPreviewInterpreter(), bundle),
    {
      interpreterId: "interpreter.dashboard.asset-preview",
      target: "dashboard",
      inputKind: "asset-bundle",
      preservation: "lossy",
      output: {
        assetId: "asset.invalid-preview",
        title: "Invalid preview asset",
        summary: "2 objects, 2 selectors",
        fields: [
          { label: "Asset id", value: "asset.invalid-preview" },
          { label: "Version", value: "1" },
          { label: "Objects", value: "2" },
          { label: "Selectors", value: "2" },
          { label: "Object types", value: "equation" }
        ],
        searchFields: [
          "asset.invalid-preview",
          "Invalid preview asset",
          "equation.a",
          "Equation A",
          "equation",
          "selector.shared",
          "equation.b",
          "Equation B",
          "equation",
          "selector.shared"
        ]
      },
      diagnostics: [
        {
          severity: "error",
          code: "asset-validation",
          message: "Duplicate asset selector id: selector.shared.",
          lossKind: "identity",
          path: "objects[1].selectors[0].id"
        }
      ]
    }
  );
});
