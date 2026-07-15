import assert from "node:assert/strict";
import test from "node:test";

import {
  checkCorrespondenceMapRewindLaw,
  composeCorrespondenceMapsParallel,
  composeCorrespondenceMapsSequence,
  projectCorrespondenceMapForPlayback,
  validateCorrespondenceMap,
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

test("validateCorrespondenceMap enforces relation endpoint shapes", () => {
  const map: CorrespondenceMap = {
    id: "invalid.shapes",
    records: [
      {
        id: "bad-identity",
        relation: "identity",
        sourceSelectorIds: ["a", "b"],
        targetSelectorIds: ["c"],
        summary: "Identity cannot merge two values."
      },
      {
        id: "bad-fan-out",
        relation: "fan-out",
        sourceSelectorIds: ["x"],
        targetSelectorIds: ["y"],
        summary: "Fan-out needs multiple targets."
      }
    ]
  };

  assert.deepEqual(validateCorrespondenceMap(map).map((issue) => issue.path), [
    "records[0]",
    "records[1]"
  ]);
});

test("validateCorrespondenceMap requires one semantic lifecycle per expected selector", () => {
  const map: CorrespondenceMap = {
    id: "lifecycle.total",
    records: [
      {
        id: "identity-x",
        relation: "identity",
        sourceSelectorIds: ["source.x"],
        targetSelectorIds: ["target.x"],
        summary: "x persists."
      },
      {
        id: "focus-x",
        relation: "focus",
        sourceSelectorIds: ["source.x"],
        targetSelectorIds: ["target.x"],
        summary: "Visual focus does not duplicate semantic lifecycle ownership."
      }
    ]
  };

  assert.deepEqual(validateCorrespondenceMap(map, {
    sourceSelectorIds: ["source.x", "source.constant"],
    targetSelectorIds: ["target.x", "target.result"]
  }).map((issue) => issue.message), [
    "Correspondence map lifecycle.total leaves source selector source.constant without a semantic lifecycle relation.",
    "Correspondence map lifecycle.total leaves target selector target.result without a semantic lifecycle relation."
  ]);
});

test("correspondence playback projection mirrors endpoints without changing semantic relations", () => {
  const map: CorrespondenceMap = {
    id: "rewind.fan-in",
    records: [
      {
        id: "combine-constants",
        relation: "fan-in",
        sourceSelectorIds: ["source.7", "source.minus-3"],
        targetSelectorIds: ["target.4"],
        summary: "Two constants derive one result."
      }
    ]
  };

  assert.deepEqual(projectCorrespondenceMapForPlayback(map, "backward"), [
    {
      id: "combine-constants",
      relation: "fan-in",
      fromSelectorIds: ["target.4"],
      toSelectorIds: ["source.7", "source.minus-3"],
      summary: "Two constants derive one result."
    }
  ]);
  assert.deepEqual(checkCorrespondenceMapRewindLaw(map), []);
});
