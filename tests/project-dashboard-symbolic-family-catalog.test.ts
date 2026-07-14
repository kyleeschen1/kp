import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createSymbolicManipulationFamilyRegistry
} from "../src/animation/symbolic-manipulation-family-registry.ts";
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

test("symbolic manipulation family dashboard rows expose comparable readiness fields", () => {
  const rows = createSymbolicManipulationFamilyAgendaRows("");

  assert.equal(rows.length, 18);
  assert.deepEqual(rows[0], {
    id: "symbolic-family-algebra-both-sides",
    title: "Both-sides equation operations",
    summary:
      "Seed symbolic manipulation family for algebra: add, subtract, multiply, and divide both sides while preserving equality.",
    status: "planned",
    detail: "symbolic family",
    kind: "protocol-api",
    depth: 0,
    tags: [
      "symbolic-family",
      "algebra",
      "seed",
      "equation",
      "inverse-operation",
      "generated-problem"
    ],
    dataAttributes: [
      ["data-kp-symbolic-family", "family.algebra.both-sides"],
      ["data-kp-symbolic-family-domain", "algebra"],
      ["data-kp-symbolic-family-status", "seed"]
    ],
    relatedIds: [
      "family.algebra.both-sides",
      "run-contract.kp.animation.symbolic-manipulation-library-v0"
    ],
    previewFields: [
      { label: "Symbolic family", value: "family.algebra.both-sides" },
      { label: "Domain", value: "algebra" },
      { label: "Family status", value: "seed" },
      { label: "Object roles", value: "0" },
      { label: "Transform definitions", value: "0" },
      { label: "Visual motifs", value: "0" },
      { label: "Runtime samples", value: "0" },
      { label: "Graph equivalents", value: "0" },
      { label: "Generated problem hooks", value: "0" },
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
      "seed",
      "equation",
      "inverse-operation",
      "generated-problem",
      "add, subtract, multiply, and divide both sides while preserving equality",
      "graph-equivalent:equation-graph",
      "flashcard-ready:false",
      "generated-problem-ready:false"
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
