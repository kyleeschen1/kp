import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAnimationAsset,
  createKpAnimationAssetBuilder,
  validateKpAnimationAsset
} from "../src/animation/asset.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../src/semantic/asset.ts";
import {
  createKpSemanticTransformation
} from "../src/semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from "../src/semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf
} from "../src/semantic/transformation-composition.ts";

test("createKpAnimationAsset creates a JSON-compatible semantic animation contract", () => {
  const bundle = createKpAssetBundle({
    id: "asset.solve-x",
    title: "Solve x",
    objects: [
      createKpSemanticAssetObject({
        id: "equation.initial",
        objectType: "equation",
        title: "Initial equation",
        value: { latex: "x + 3 = 7" },
        selectors: [{ id: "equation.initial.x", kind: "term", label: "x" }]
      }),
      createKpSemanticAssetObject({
        id: "equation.next",
        objectType: "equation",
        title: "After subtracting",
        value: { latex: "x + 3 - 3 = 7 - 3" },
        selectors: [{ id: "equation.next.x", kind: "term", label: "x" }]
      })
    ]
  });
  const subtract = createKpSemanticTransformation({
    id: "transform.subtract",
    definitionId: "definition.generated.linear-solve.subtract-both-sides",
    transformType: "subtractBothSides",
    title: "Subtract 3 from both sides",
    sourceObjectIds: ["equation.initial"],
    targetObjectIds: ["equation.next"],
    preserves: ["value", "structure"],
    correspondence: [
      {
        sourceSelectorId: "equation.initial.x",
        targetSelectorId: "equation.next.x",
        preserves: ["identity", "role"]
      }
    ],
    lawRefs: [{ id: "law.equation.subtract-both-sides", level: "strict" }]
  });
  const transformationTree = createEditableSemanticTransformationTree({
    root: createSemanticTransformationLeaf(
      createSemanticTransformationRef({
        id: subtract.id,
        kind: subtract.transformType,
        sourceObjectIds: subtract.sourceObjectIds,
        targetObjectIds: subtract.targetObjectIds,
        preserves: subtract.preserves
      })
    ),
    annotations: [
      {
        id: "pause.after-subtract",
        kind: "pause",
        targetNodeId: subtract.id,
        placement: "after",
        durationBeats: 1
      }
    ]
  });

  const animation = createKpAnimationAsset({
    id: "animation.solve-x",
    title: "Solve x + 3 = 7",
    bundle,
    transformations: [subtract],
    transformationTree,
    timeline: {
      id: "timeline.solve-x",
      durationMs: 1200,
      beatCount: 12
    },
    layout: {
      id: "layout.solve-x",
      kind: "single",
      targetId: "render.equation"
    },
    renderTargets: [
      {
        id: "render.equation",
        kind: "equation",
        objectIds: ["equation.initial", "equation.next"],
        transformationIds: [subtract.id]
      }
    ],
    checks: [
      {
        id: "check.rewind",
        lawId: "animation.rewind",
        level: "strict",
        targetId: transformationTree.root.id
      }
    ],
    exportTargets: [
      {
        id: "export.frames",
        kind: "frame-sequence",
        artifactId: "artifact.solve-x.frames"
      }
    ],
    dashboard: {
      rowId: "row.animation.solve-x",
      tags: ["animation", "algebra"],
      sampleTargetIds: ["sample.solve-x"]
    },
    metadata: {
      domain: "algebra"
    }
  });

  assert.deepEqual(animation, {
    id: "animation.solve-x",
    kind: "animation-asset",
    title: "Solve x + 3 = 7",
    version: 1,
    bundle,
    transformations: [subtract],
    transformationTree,
    timeline: {
      id: "timeline.solve-x",
      durationMs: 1200,
      beatCount: 12
    },
    layout: {
      id: "layout.solve-x",
      kind: "single",
      targetId: "render.equation"
    },
    renderTargets: [
      {
        id: "render.equation",
        kind: "equation",
        objectIds: ["equation.initial", "equation.next"],
        transformationIds: [subtract.id]
      }
    ],
    checks: [
      {
        id: "check.rewind",
        lawId: "animation.rewind",
        level: "strict",
        targetId: transformationTree.root.id
      }
    ],
    exportTargets: [
      {
        id: "export.frames",
        kind: "frame-sequence",
        artifactId: "artifact.solve-x.frames"
      }
    ],
    dashboard: {
      rowId: "row.animation.solve-x",
      tags: ["animation", "algebra"],
      sampleTargetIds: ["sample.solve-x"]
    },
    metadata: {
      domain: "algebra"
    }
  });
  assert.deepEqual(validateKpAnimationAsset(animation), []);
  assert.deepEqual(JSON.parse(JSON.stringify(animation)), animation);
});

test("validateKpAnimationAsset reports unresolved animation references", () => {
  const animation = createKpAnimationAsset({
    id: "animation.bad",
    title: "Bad animation",
    bundle: createKpAssetBundle({
      id: "asset.bad",
      title: "Bad asset",
      objects: []
    }),
    transformations: [
      createKpSemanticTransformation({
        id: "transform.missing",
        transformType: "unknown",
        title: "Missing objects",
        sourceObjectIds: ["object.missing.source"],
        targetObjectIds: ["object.missing.target"],
        preserves: ["value"]
      })
    ],
    transformationTree: createEditableSemanticTransformationTree({
      root: createSemanticTransformationLeaf(
        createSemanticTransformationRef({
          id: "transform.tree-only",
          kind: "unknown",
          sourceObjectIds: ["object.missing.source"],
          targetObjectIds: ["object.missing.target"],
          preserves: ["value"]
        })
      )
    }),
    layout: {
      id: "layout.bad",
      kind: "single",
      targetId: "render.missing"
    },
    renderTargets: [
      {
        id: "render.bad",
        kind: "equation",
        objectIds: ["object.missing.render"],
        transformationIds: ["transform.missing.render"]
      }
    ],
    checks: [
      {
        id: "check.bad",
        lawId: "animation.rewind",
        level: "strict",
        targetId: "transform.tree-only"
      }
    ],
    exportTargets: []
  });

  assert.deepEqual(validateKpAnimationAsset(animation), [
    {
      path: "transformations[0].sourceObjectIds[0]",
      message:
        "Transformation transform.missing references missing source object object.missing.source."
    },
    {
      path: "transformations[0].targetObjectIds[0]",
      message:
        "Transformation transform.missing references missing target object object.missing.target."
    },
    {
      path: "transformationTree.root",
      message:
        "Animation animation.bad transformation tree references missing transformation transform.tree-only."
    },
    {
      path: "layout.targetId",
      message:
        "Animation animation.bad layout layout.bad references missing render target render.missing."
    },
    {
      path: "renderTargets[0].objectIds[0]",
      message:
        "Animation animation.bad render target render.bad references missing object object.missing.render."
    },
    {
      path: "renderTargets[0].transformationIds[0]",
      message:
        "Animation animation.bad render target render.bad references missing transformation transform.missing.render."
    }
  ]);
});

test("createKpAnimationAssetBuilder assembles an inferred sequential animation asset", () => {
  const initial = createKpSemanticAssetObject({
    id: "equation.initial",
    objectType: "equation",
    title: "Initial equation",
    value: { latex: "x + 3 = 7" },
    selectors: [{ id: "equation.initial.x", kind: "term", label: "x" }]
  });
  const expanded = createKpSemanticAssetObject({
    id: "equation.expanded",
    objectType: "equation",
    title: "Subtract 3",
    value: { latex: "x + 3 - 3 = 7 - 3" },
    selectors: [{ id: "equation.expanded.x", kind: "term", label: "x" }]
  });
  const solved = createKpSemanticAssetObject({
    id: "equation.solved",
    objectType: "equation",
    title: "Solved equation",
    value: { latex: "x = 4" },
    selectors: [{ id: "equation.solved.x", kind: "term", label: "x" }]
  });
  const subtract = createKpSemanticTransformation({
    id: "transform.subtract",
    transformType: "subtractBothSides",
    title: "Subtract 3 from both sides",
    sourceObjectIds: [initial.id],
    targetObjectIds: [expanded.id],
    preserves: ["value", "structure"],
    correspondence: [
      {
        sourceSelectorId: "equation.initial.x",
        targetSelectorId: "equation.expanded.x",
        preserves: ["identity", "role"]
      }
    ]
  });
  const cancel = createKpSemanticTransformation({
    id: "transform.cancel",
    transformType: "cancel",
    title: "Cancel additive inverses",
    sourceObjectIds: [expanded.id],
    targetObjectIds: [solved.id],
    preserves: ["value", "structure"],
    correspondence: [
      {
        sourceSelectorId: "equation.expanded.x",
        targetSelectorId: "equation.solved.x",
        preserves: ["identity", "role"]
      }
    ]
  });

  const animation = createKpAnimationAssetBuilder({
    id: "animation.solve-x",
    title: "Solve x + 3 = 7",
    bundleId: "asset.solve-x",
    bundleTitle: "Solve x assets",
    metadata: { domain: "algebra" }
  })
    .addObject(initial)
    .addObject(expanded)
    .addObject(solved)
    .addTransformation(subtract)
    .addTransformation(cancel)
    .addAnnotation({
      id: "pause.after-cancel",
      kind: "pause",
      targetNodeId: cancel.id,
      placement: "after",
      durationBeats: 1
    })
    .withTimeline({
      id: "timeline.solve-x",
      beatCount: 20
    })
    .addRenderTarget({
      id: "render.equation",
      kind: "equation",
      objectIds: [initial.id, expanded.id, solved.id],
      transformationIds: [subtract.id, cancel.id]
    })
    .withLayout({
      id: "layout.solve-x",
      kind: "single",
      targetId: "render.equation"
    })
    .addCheck({
      id: "check.rewind",
      lawId: "animation.rewind",
      level: "strict",
      targetId: "animation.solve-x.transformations"
    })
    .addExportTarget({
      id: "export.frames",
      kind: "frame-sequence",
      artifactId: "artifact.solve-x.frames"
    })
    .withDashboard({
      rowId: "row.animation.solve-x",
      tags: ["animation", "algebra"]
    })
    .build();

  assert.deepEqual(validateKpAnimationAsset(animation), []);
  assert.equal(animation.bundle.id, "asset.solve-x");
  assert.equal(animation.bundle.title, "Solve x assets");
  assert.deepEqual(
    animation.bundle.objects.map((object) => object.id),
    [initial.id, expanded.id, solved.id]
  );
  assert.deepEqual(
    animation.transformations.map((transformation) => transformation.id),
    [subtract.id, cancel.id]
  );
  assert.equal(animation.transformationTree.root.kind, "sequence");
  assert.equal(animation.transformationTree.root.id, "animation.solve-x.transformations");
  assert.deepEqual(
    animation.transformationTree.root.children.map((child) => child.id),
    [subtract.id, cancel.id]
  );
  assert.deepEqual(animation.transformationTree.annotations, [
    {
      id: "pause.after-cancel",
      kind: "pause",
      targetNodeId: cancel.id,
      placement: "after",
      durationBeats: 1
    }
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(animation)), animation);
});
