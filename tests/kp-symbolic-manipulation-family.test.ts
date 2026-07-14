import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSymbolicManipulationFamily,
  symbolicManipulationFamilyDashboardTags,
  validateKpSymbolicManipulationFamily
} from "../src/animation/symbolic-manipulation-family.ts";
import {
  createKpSemanticTransformationDefinition
} from "../src/semantic/asset-transformation.ts";

test("createKpSymbolicManipulationFamily captures one reusable manipulation family", () => {
  const subtractBothSides = createKpSemanticTransformationDefinition({
    id: "definition.symbolic.algebra.subtract-both-sides",
    transformType: "subtractBothSides",
    title: "Subtract the same value from both sides",
    sourceObjectRoles: ["equation.before"],
    targetObjectRoles: ["equation.after"],
    preserves: ["value", "structure"],
    lawRefs: [{ id: "law.equation.subtract-both-sides", level: "strict" }],
    correspondenceTemplates: [
      {
        sourceObjectRole: "equation.before",
        sourceSelectorRole: "lhs.variable",
        targetObjectRole: "equation.after",
        targetSelectorRole: "lhs.variable",
        preserves: ["identity", "role"]
      }
    ]
  });

  const family = createKpSymbolicManipulationFamily({
    id: "family.algebra.both-sides",
    title: "Both-sides equation operations",
    domain: "algebra",
    status: "seed",
    objectRoles: [
      {
        id: "equation.before",
        objectType: "equation",
        title: "Source equation",
        selectorRoles: [
          { id: "lhs.variable", kind: "term", summary: "Unknown being solved for." }
        ]
      },
      {
        id: "equation.after",
        objectType: "equation",
        title: "Target equation",
        selectorRoles: [
          { id: "lhs.variable", kind: "term", summary: "Persisting unknown." }
        ]
      }
    ],
    transformationDefinitions: [subtractBothSides],
    visualMotifs: [
      {
        id: "motif.append-after-shift",
        motifKind: "append-after-shift",
        transformationDefinitionIds: [subtractBothSides.id],
        summary: "Existing tokens shift before the inverse term appears."
      }
    ],
    runtimeSamples: [
      {
        id: "sample.animation.solve-x",
        animationId: "animation.solve-x",
        renderTargetKinds: ["equation"],
        transformationDefinitionIds: [subtractBothSides.id]
      }
    ],
    graphEquivalents: [
      {
        id: "graph.horizontal-line-preserved",
        title: "Equation solution set is preserved",
        representationKind: "equation-graph",
        exactness: "qualitative",
        preserves: ["value"],
        lawRefs: [
          {
            id: "law.graph.solution-set-preservation",
            level: "qualitative"
          }
        ],
        sampleAssetIds: ["animation.solve-x"]
      }
    ],
    generatedProblemHooks: [
      {
        id: "hook.generated.linear-equation",
        fixtureFamilyId: "generated.linear-solve",
        transformationDefinitionIds: [subtractBothSides.id]
      }
    ],
    flashcardHooks: [
      {
        id: "flashcard.predict-inverse-operation",
        kind: "predict-next",
        transformationDefinitionIds: [subtractBothSides.id]
      }
    ],
    dashboard: {
      rowId: "row.family.algebra.both-sides",
      tags: ["equation", "inverse-operation"]
    }
  });

  assert.equal(family.kind, "symbolic-manipulation-family");
  assert.equal(family.version, 1);
  assert.deepEqual(
    symbolicManipulationFamilyDashboardTags(family),
    ["symbolic-family", "algebra", "seed", "equation", "inverse-operation"]
  );
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("validateKpSymbolicManipulationFamily reports broken family references", () => {
  const family = createKpSymbolicManipulationFamily({
    id: "family.algebra.broken",
    title: "Broken algebra family",
    domain: "algebra",
    objectRoles: [
      {
        id: "equation.before",
        objectType: "equation",
        title: "Source equation",
        selectorRoles: [{ id: "lhs.variable", kind: "term" }]
      }
    ],
    transformationDefinitions: [
      createKpSemanticTransformationDefinition({
        id: "definition.symbolic.algebra.broken",
        transformType: "brokenTransform",
        title: "Broken transform",
        sourceObjectRoles: ["equation.before"],
        targetObjectRoles: ["equation.after"],
        preserves: ["value"]
      })
    ],
    visualMotifs: [
      {
        id: "motif.missing-definition",
        motifKind: "append-after-shift",
        transformationDefinitionIds: ["definition.symbolic.algebra.missing"]
      }
    ],
    runtimeSamples: [
      {
        id: "sample.missing-definition",
        animationId: "animation.missing",
        renderTargetKinds: ["equation"],
        transformationDefinitionIds: ["definition.symbolic.algebra.missing"]
      }
    ],
    graphEquivalents: [
      {
        id: "graph.missing-sample",
        title: "Missing sample",
        representationKind: "equation-graph",
        exactness: "sampled",
        preserves: ["value"],
        sampleAssetIds: ["animation.absent"]
      }
    ]
  });

  assert.deepEqual(validateKpSymbolicManipulationFamily(family), [
    {
      path: "transformationDefinitions[0].targetObjectRoles[0]",
      message:
        "Family family.algebra.broken transformation definition definition.symbolic.algebra.broken references missing target object role equation.after."
    },
    {
      path: "visualMotifs[0].transformationDefinitionIds[0]",
      message:
        "Family family.algebra.broken visual motif motif.missing-definition references missing transformation definition definition.symbolic.algebra.missing."
    },
    {
      path: "runtimeSamples[0].transformationDefinitionIds[0]",
      message:
        "Family family.algebra.broken runtime sample sample.missing-definition references missing transformation definition definition.symbolic.algebra.missing."
    },
    {
      path: "graphEquivalents[0].sampleAssetIds[0]",
      message:
        "Family family.algebra.broken graph equivalent graph.missing-sample references missing runtime sample animation animation.absent."
    },
    {
      path: "graphEquivalents[0].lawRefs",
      message:
        "Family family.algebra.broken graph equivalent graph.missing-sample with sampled exactness must include a sampled law reference."
    }
  ]);
});
