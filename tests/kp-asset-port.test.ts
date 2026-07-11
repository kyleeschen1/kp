import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../src/semantic/asset.ts";
import {
  createKpExternalPort,
  runKpExternalPort
} from "../src/semantic/asset-port.ts";

interface AlgebraTrace {
  readonly id: string;
  readonly steps: readonly string[];
}

test("runKpExternalPort wraps deterministic imports with provenance", () => {
  const port = createKpExternalPort<AlgebraTrace>({
    id: "port.algebra.trace",
    title: "Algebra trace port",
    sourceSystem: "fixture.algebra",
    version: "0.1.0",
    preservation: "strict",
    importAsset: (trace) => ({
      bundle: createKpAssetBundle({
        id: `asset.${trace.id}`,
        title: "Imported algebra trace",
        objects: trace.steps.map((latex, index) =>
          createKpSemanticAssetObject({
            id: `equation.${trace.id}.${index}`,
            objectType: "equation",
            title: `Equation step ${index + 1}`,
            value: { latex },
            selectors: [],
            provenance: {
              kind: index === 0 ? "imported" : "transformed",
              sourceIds: [trace.id],
              portId: "port.algebra.trace"
            }
          })
        )
      })
    })
  });

  assert.deepEqual(
    runKpExternalPort(port, {
      id: "linear-solve",
      steps: ["x + 3 = 7", "x = 4"]
    }),
    {
      portId: "port.algebra.trace",
      title: "Algebra trace port",
      sourceSystem: "fixture.algebra",
      version: "0.1.0",
      preservation: "strict",
      bundle: {
        id: "asset.linear-solve",
        title: "Imported algebra trace",
        version: 1,
        objects: [
          {
            id: "equation.linear-solve.0",
            kind: "semantic-object",
            objectType: "equation",
            title: "Equation step 1",
            value: { latex: "x + 3 = 7" },
            selectors: [],
            provenance: {
              kind: "imported",
              sourceIds: ["linear-solve"],
              portId: "port.algebra.trace"
            }
          },
          {
            id: "equation.linear-solve.1",
            kind: "semantic-object",
            objectType: "equation",
            title: "Equation step 2",
            value: { latex: "x = 4" },
            selectors: [],
            provenance: {
              kind: "transformed",
              sourceIds: ["linear-solve"],
              portId: "port.algebra.trace"
            }
          }
        ]
      },
      diagnostics: []
    }
  );
});

test("runKpExternalPort preserves lossy import diagnostics", () => {
  const port = createKpExternalPort<AlgebraTrace>({
    id: "port.lossy",
    title: "Lossy port",
    sourceSystem: "fixture.cas",
    version: "0.1.0",
    preservation: "lax",
    importAsset: () => ({
      bundle: createKpAssetBundle({
        id: "asset.lossy",
        title: "Lossy asset"
      }),
      diagnostics: [
        {
          severity: "warning",
          code: "opaque-step",
          lossKind: "opaque",
          message: "The CAS supplied a step without a rewrite rule.",
          path: "steps[1]"
        }
      ]
    })
  });

  assert.deepEqual(
    runKpExternalPort(port, {
      id: "lossy",
      steps: []
    }).diagnostics,
    [
      {
        severity: "warning",
        code: "opaque-step",
        lossKind: "opaque",
        message: "The CAS supplied a step without a rewrite rule.",
        path: "steps[1]"
      }
    ]
  );
});

test("createKpExternalPort rejects empty source metadata", () => {
  assert.throws(
    () =>
      createKpExternalPort({
        id: "port.bad",
        title: "Bad port",
        sourceSystem: "",
        version: "0.1.0",
        preservation: "strict",
        importAsset: () =>
          ({
            bundle: createKpAssetBundle({
              id: "asset.empty",
              title: "Empty"
            })
          })
      }),
    /sourceSystem must not be empty/
  );
});
