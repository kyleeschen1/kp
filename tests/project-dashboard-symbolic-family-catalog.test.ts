import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createSymbolicManipulationFamilyRegistry,
  symbolicManipulationFamilyById
} from "../src/animation/symbolic-manipulation-family-registry.ts";
import {
  validateKpSymbolicManipulationFamily
} from "../src/animation/symbolic-manipulation-family.ts";
import {
  createSymbolicManipulationFamilyAgendaRows
} from "../src/project-dashboard/symbolic-family-catalog.ts";
import {
  createSemanticAssetCatalogAgendaRows
} from "../src/project-dashboard/semantic-asset-catalog.ts";

test("symbolic manipulation family registry seeds the approved library families", () => {
  const families = createSymbolicManipulationFamilyRegistry();

  assert.deepEqual(
    families.map((family) => family.id),
    [
      "family.algebra.both-sides",
      "family.algebra.cancel-combine",
      "family.algebra.distribution-factoring",
      "family.algebra.fraction-simplification",
      "family.algebra.exponent-log-laws",
      "family.algebra.inequality",
      "family.calculus.derivative-rules",
      "family.calculus.integral-ftc",
      "family.calculus.taylor-local-linearization",
      "family.calculus.gradient-jacobian",
      "family.calculus.hessian-optimization",
      "family.linear-algebra.vector-add-scale",
      "family.linear-algebra.dot-projection",
      "family.linear-algebra.matrix-vector",
      "family.linear-algebra.matrix-matrix-composition",
      "family.linear-algebra.row-operations",
      "family.linear-algebra.determinant-inverse",
      "family.linear-algebra.basis-eigen"
    ]
  );
  assert.equal(
    families.find((family) => family.id === "family.linear-algebra.matrix-matrix-composition")
      ?.metadata?.["composition"],
    "matrix multiplication as composed dot products"
  );
});

test("algebra both-sides family promotes operation definitions and sample hooks", () => {
  const family = symbolicManipulationFamilyById("family.algebra.both-sides");

  assert.ok(family);
  assert.equal(family.status, "promoted");
  assert.deepEqual(
    family.objectRoles.map((role) => [
      role.id,
      role.objectType,
      role.selectorRoles.map((selector) => selector.id)
    ]),
    [
      [
        "equation.before",
        "equation",
        ["lhs.variable", "equals", "rhs.value"]
      ],
      [
        "equation.after",
        "equation",
        ["lhs.variable", "equals", "rhs.value", "operation.artifact"]
      ]
    ]
  );
  assert.deepEqual(
    family.transformationDefinitions.map((definition) => [
      definition.id,
      definition.transformType,
      definition.preserves,
      definition.lawRefs?.[0]?.id
    ]),
    [
      [
        "definition.symbolic.algebra.add-both-sides",
        "addBothSides",
        ["value", "structure"],
        "law.equation.add-both-sides"
      ],
      [
        "definition.symbolic.algebra.subtract-both-sides",
        "subtractBothSides",
        ["value", "structure"],
        "law.equation.subtract-both-sides"
      ],
      [
        "definition.symbolic.algebra.multiply-both-sides",
        "multiplyBothSides",
        ["value", "structure"],
        "law.equation.multiply-both-sides"
      ],
      [
        "definition.symbolic.algebra.divide-both-sides",
        "divideBothSides",
        ["value", "structure"],
        "law.equation.divide-both-sides"
      ]
    ]
  );
  assert.deepEqual(
    family.transformationDefinitions[1]?.correspondenceTemplates.map(
      (correspondence) => [
        correspondence.sourceSelectorRole,
        correspondence.targetSelectorRole,
        correspondence.preserves
      ]
    ),
    [
      ["lhs.variable", "lhs.variable", ["identity", "role"]],
      ["equals", "equals", ["identity", "role"]],
      ["rhs.value", "rhs.value", ["identity", "role"]]
    ]
  );
  assert.deepEqual(family.visualMotifs, [
    {
      id: "motif.algebra.both-sides.append-after-shift",
      motifKind: "append-after-shift",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.add-both-sides",
        "definition.symbolic.algebra.subtract-both-sides",
        "definition.symbolic.algebra.multiply-both-sides",
        "definition.symbolic.algebra.divide-both-sides"
      ],
      summary:
        "Persistent tokens shift first, then the operation artifact appears on both sides."
    }
  ]);
  assert.deepEqual(family.runtimeSamples, [
    {
      id: "sample.animation.solve-x.both-sides",
      animationId: "animation.solve-x",
      renderTargetKinds: ["equation"],
      transformationDefinitionIds: [
        "definition.symbolic.algebra.subtract-both-sides"
      ],
      summary: "Existing x + 3 = 7 animation exercises subtract-both-sides."
    }
  ]);
  assert.deepEqual(family.graphEquivalents, [
    {
      id: "graph.algebra.both-sides.solution-set",
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
      sampleAssetIds: ["animation.solve-x"],
      summary:
        "Both-sides operations preserve the solution set even when the rendered equation changes."
    }
  ]);
  assert.deepEqual(family.generatedProblemHooks, [
    {
      id: "hook.generated.linear-solve.both-sides",
      fixtureFamilyId: "generated.linear-solve",
      transformationDefinitionIds: [
        "definition.symbolic.algebra.add-both-sides",
        "definition.symbolic.algebra.subtract-both-sides",
        "definition.symbolic.algebra.multiply-both-sides",
        "definition.symbolic.algebra.divide-both-sides"
      ],
      summary:
        "Generated linear-solve traces can map add/subtract/multiply/divide both-sides steps to this family."
    }
  ]);
  assert.deepEqual(validateKpSymbolicManipulationFamily(family), []);
});

test("symbolic manipulation family dashboard rows expose comparable readiness fields", () => {
  const rows = createSymbolicManipulationFamilyAgendaRows("");

  assert.equal(rows.length, 18);
  assert.deepEqual(rows[0], {
    id: "symbolic-family-algebra-both-sides",
    title: "Both-sides equation operations",
    summary:
      "Promoted symbolic manipulation family for algebra: add, subtract, multiply, and divide both sides while preserving equality.",
    status: "active",
    detail: "symbolic family",
    kind: "protocol-api",
    depth: 0,
    tags: [
      "symbolic-family",
      "algebra",
      "promoted",
      "equation",
      "inverse-operation",
      "generated-problem"
    ],
    dataAttributes: [
      ["data-kp-symbolic-family", "family.algebra.both-sides"],
      ["data-kp-symbolic-family-domain", "algebra"],
      ["data-kp-symbolic-family-status", "promoted"]
    ],
    relatedIds: [
      "family.algebra.both-sides",
      "run-contract.kp.animation.symbolic-manipulation-library-v0"
    ],
    previewFields: [
      { label: "Symbolic family", value: "family.algebra.both-sides" },
      { label: "Domain", value: "algebra" },
      { label: "Family status", value: "promoted" },
      { label: "Object roles", value: "2" },
      { label: "Transform definitions", value: "4" },
      { label: "Visual motifs", value: "1" },
      { label: "Runtime samples", value: "1" },
      { label: "Graph equivalents", value: "1" },
      { label: "Generated problem hooks", value: "1" },
      { label: "Flashcard hooks", value: "0" },
      { label: "Validation", value: "passed" }
    ],
    searchFields: [
      "semantic asset catalog",
      "symbolic manipulation family catalog",
      "symbolic family",
      "family.algebra.both-sides",
      "Both-sides equation operations",
      "algebra",
      "promoted",
      "equation",
      "inverse-operation",
      "generated-problem",
      "add, subtract, multiply, and divide both sides while preserving equality",
      "graph-equivalent:equation-graph",
      "flashcard-ready:false",
      "generated-problem-ready:true"
    ]
  });
});

test("symbolic family rows are searchable through the semantic asset catalog", () => {
  assert.deepEqual(
    createSymbolicManipulationFamilyAgendaRows(
      "matrix multiplication dot products"
    ).map((row) => row.id),
    ["symbolic-family-linear-algebra-matrix-matrix-composition"]
  );
  assert.deepEqual(
    createSemanticAssetCatalogAgendaRows(
      "symbolic family hessian curvature graph-equivalent"
    ).map((row) => row.id),
    ["symbolic-family-calculus-hessian-optimization"]
  );
});
