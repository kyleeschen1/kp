import assert from "node:assert/strict";
import test from "node:test";

import {
  createLinearSolveKpAssetBundle,
  createLinearSolveTeacherZeroState,
  linearSolveAssetIds
} from "../src/semantic/linear-solve-asset.ts";

test("teacher detail owns a genuine x plus zero semantic state", () => {
  const state = createLinearSolveTeacherZeroState();

  assert.equal(state.id, linearSolveAssetIds.teacherZero);
  assert.deepEqual(state.value, { latex: "x + 0 = 7 - 3" });
  assert.deepEqual(
    state.selectors.map(({ id, kind, label }) => ({ id, kind, label })),
    [
      semantic("lhs.x", "term", "x"),
      semantic("lhs.plus", "operator", "+"),
      semantic("lhs.zero", "term", "0"),
      semantic("equals", "relation", "="),
      semantic("rhs.7", "term", "7"),
      semantic("rhs.minus", "operator", "−"),
      semantic("rhs.3", "term", "3")
    ]
  );
  assert.equal(state.provenance?.kind, "transformed");
  assert.deepEqual(state.provenance?.sourceIds, [linearSolveAssetIds.afterSubtract]);
  assert.equal(state.provenance?.transformationId, linearSolveAssetIds.exposeZero);
});

test("the streamlined asset does not silently acquire the teacher-only state", () => {
  const canonical = createLinearSolveKpAssetBundle();

  assert.equal(
    canonical.bundle.objects.some(({ id }) => id === linearSolveAssetIds.teacherZero),
    false
  );
});

function semantic(path: string, kind: string, label: string) {
  return {
    id: `${linearSolveAssetIds.teacherZero}.${path}`,
    kind,
    label
  };
}
