import assert from "node:assert/strict";
import test from "node:test";

import {
  composeCorrespondenceMapsParallel,
  composeCorrespondenceMapsSequence,
  type CorrespondenceMap
} from "../src/semantic/correspondence.ts";

test("composeCorrespondenceMapsSequence links selectors through intermediate targets", () => {
  const first: CorrespondenceMap = {
    id: "append-inverse",
    records: [
      {
        id: "identity.x",
        relation: "identity",
        sourceSelectorIds: ["eq0.lhs.x"],
        targetSelectorIds: ["eq1.lhs.x"],
        summary: "x persists"
      }
    ]
  };
  const second: CorrespondenceMap = {
    id: "move-to-numerator",
    records: [
      {
        id: "role-change.x",
        relation: "role-change",
        sourceSelectorIds: ["eq1.lhs.x"],
        targetSelectorIds: ["eq2.fraction.numerator.x"],
        summary: "x becomes numerator"
      },
      {
        id: "introduction.fraction-bar",
        relation: "artifact",
        sourceSelectorIds: [],
        targetSelectorIds: ["eq2.fraction.bar"],
        summary: "fraction bar appears"
      }
    ]
  };

  assert.deepEqual(composeCorrespondenceMapsSequence("solve.sequence", [first, second]), {
    id: "solve.sequence",
    records: [
      {
        id: "append-inverse.identity.x__move-to-numerator.role-change.x",
        relation: "role-change",
        sourceSelectorIds: ["eq0.lhs.x"],
        targetSelectorIds: ["eq2.fraction.numerator.x"],
        summary: "x persists; x becomes numerator"
      },
      {
        id: "move-to-numerator.introduction.fraction-bar",
        relation: "artifact",
        sourceSelectorIds: [],
        targetSelectorIds: ["eq2.fraction.bar"],
        summary: "fraction bar appears"
      }
    ]
  });
});

test("composeCorrespondenceMapsParallel merges independent maps with stable namespaces", () => {
  const left: CorrespondenceMap = {
    id: "row1",
    records: [
      {
        id: "identity.a",
        relation: "identity",
        sourceSelectorIds: ["a"],
        targetSelectorIds: ["a-prime"],
        summary: "a persists"
      }
    ]
  };
  const right: CorrespondenceMap = {
    id: "row2",
    records: [
      {
        id: "identity.b",
        relation: "identity",
        sourceSelectorIds: ["b"],
        targetSelectorIds: ["b-prime"],
        summary: "b persists"
      }
    ]
  };

  assert.deepEqual(composeCorrespondenceMapsParallel("rows.parallel", [left, right]), {
    id: "rows.parallel",
    records: [
      {
        id: "row1.identity.a",
        relation: "identity",
        sourceSelectorIds: ["a"],
        targetSelectorIds: ["a-prime"],
        summary: "a persists"
      },
      {
        id: "row2.identity.b",
        relation: "identity",
        sourceSelectorIds: ["b"],
        targetSelectorIds: ["b-prime"],
        summary: "b persists"
      }
    ]
  });
});

test("correspondence map composition rejects empty input", () => {
  assert.throws(
    () => composeCorrespondenceMapsSequence("empty.sequence", []),
    /requires at least one correspondence map/
  );
  assert.throws(
    () => composeCorrespondenceMapsParallel("empty.parallel", []),
    /requires at least one correspondence map/
  );
});
