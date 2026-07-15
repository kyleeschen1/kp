import assert from "node:assert/strict";
import test from "node:test";

import { createKpEquationTransitionIr } from "../src/rendering/equation-transition-ir.ts";

test("createKpEquationTransitionIr projects semantic relations into renderer-neutral lifecycles", () => {
  const ir = createKpEquationTransitionIr({
    id: "equation-transition.combine-constants",
    transformationId: "transform.combine-constants",
    transformType: "simplify",
    title: "Combine constants",
    source: [{
      objectId: "equation.before",
      latex: "x = 7 - 3",
      selectors: [
        { id: "before.x", kind: "semantic", semanticKind: "term", label: "x" },
        { id: "before.7", kind: "semantic", semanticKind: "constant", label: "7" },
        { id: "before.minus-3", kind: "semantic", semanticKind: "term", label: "-3" }
      ]
    }],
    target: [{
      objectId: "equation.after",
      latex: "x = 4",
      selectors: [
        { id: "after.x", kind: "semantic", semanticKind: "term", label: "x" },
        { id: "after.4", kind: "semantic", semanticKind: "constant", label: "4" }
      ]
    }],
    correspondenceMap: {
      id: "correspondence.combine-constants",
      records: [
        {
          id: "x-persists",
          relation: "identity",
          sourceSelectorIds: ["before.x"],
          targetSelectorIds: ["after.x"],
          summary: "x persists."
        },
        {
          id: "constants-merge",
          relation: "fan-in",
          sourceSelectorIds: ["before.7", "before.minus-3"],
          targetSelectorIds: ["after.4"],
          summary: "The constants derive four."
        }
      ]
    }
  });

  assert.deepEqual(ir.relations.map((relation) => [
    relation.recordId,
    relation.relation,
    relation.lifecycle
  ]), [
    ["x-persists", "identity", "persist"],
    ["constants-merge", "fan-in", "merge"]
  ]);
  assert.equal(ir.kind, "equation-transition-ir");
});

test("createKpEquationTransitionIr rejects invalid endpoint shapes and selector closure", () => {
  const base = {
    id: "equation-transition.invalid",
    transformationId: "transform.invalid",
    transformType: "rewrite",
    title: "Invalid transition",
    source: [{
      objectId: "source",
      latex: "x",
      selectors: [{ id: "source.x", kind: "semantic" as const }]
    }],
    target: [{
      objectId: "target",
      latex: "y",
      selectors: [{ id: "target.y", kind: "semantic" as const }]
    }]
  };

  assert.throws(() => createKpEquationTransitionIr({
    ...base,
    correspondenceMap: {
      id: "invalid.shape",
      records: [{
        id: "bad-identity",
        relation: "identity",
        sourceSelectorIds: [],
        targetSelectorIds: ["target.y"],
        summary: "Identity needs both endpoints."
      }]
    }
  }), /requires endpoint shape one-to-one/);

  assert.throws(() => createKpEquationTransitionIr({
    ...base,
    correspondenceMap: {
      id: "invalid.closure",
      records: [{
        id: "missing-source",
        relation: "identity",
        sourceSelectorIds: ["source.missing"],
        targetSelectorIds: ["target.y"],
        summary: "Missing source."
      }]
    }
  }), /missing source selector source.missing/);
});
