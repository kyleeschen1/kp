import assert from "node:assert/strict";
import test from "node:test";
import {
  kpEconomicsSalienceObjectDefinitions,
  projectKpEconomicsSalience
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-salience-adapter.ts";
import { kpEconomicsDemandShiftCheckpoints } from
  "../src/tutorial/economics-demand-shift/economics-demand-shift-checkpoints.ts";
import { projectKpEconomicsLessonMotion } from
  "../src/tutorial/economics-demand-shift/economics-demand-shift-motion-blocks.ts";

test("every economics focus target maps to semantic role-state objects", () => {
  assert.equal(kpEconomicsSalienceObjectDefinitions.length, 10);
  for (const checkpoint of kpEconomicsDemandShiftCheckpoints) {
    const frame = projectKpEconomicsSalience({
      market: checkpoint.progress === 0 ? "initial" : "shifted",
      presentation: checkpoint.attention.target === "equations"
        ? "comparison-verified"
        : "graph-only",
      focusTarget: checkpoint.attention.target
    });
    const focused = Object.values(frame.objects).filter(({ salience }) =>
      salience.state.level === "focus"
    );
    assert.ok(focused.length >= 1, checkpoint.id);
    assert.equal(JSON.stringify(frame).includes("#"), false);
    assert.equal(JSON.stringify(frame).includes("opacity"), false);
  }
});

test("economics salience reconstructs directly from cumulative scene state", () => {
  const samples = [
    ["demand-shift", 0],
    ["demand-shift", 0.4],
    ["demand-shift", 1],
    ["supply-movement", 0.6],
    ["supply-movement", 1]
  ] as const;
  const forward = samples.map(([activeBlockId, localProgress]) => {
    const motion = projectKpEconomicsLessonMotion({ activeBlockId, localProgress });
    return projectKpEconomicsSalience({
      ...motion.scene,
      focusTarget: activeBlockId === "demand-shift" ? "demand" : "supply"
    });
  });
  const rewound = [...samples].reverse().map(([activeBlockId, localProgress]) => {
    const motion = projectKpEconomicsLessonMotion({ activeBlockId, localProgress });
    return projectKpEconomicsSalience({
      ...motion.scene,
      focusTarget: activeBlockId === "demand-shift" ? "demand" : "supply"
    });
  }).reverse();
  assert.deepEqual(rewound, forward);
  assert.deepEqual(
    projectKpEconomicsSalience({
      market: "shifted",
      presentation: "comparison-verified",
      focusTarget: "equations"
    }),
    projectKpEconomicsSalience({
      market: "shifted",
      presentation: "comparison-verified",
      focusTarget: "equations"
    })
  );
});

test("historical references and equations follow existing semantic presence", () => {
  const initial = projectKpEconomicsSalience({
    market: "initial",
    presentation: "graph-only",
    focusTarget: "demand"
  });
  assert.equal(initial.objects["market.demand.initial"].salience.state.level, "absent");
  assert.equal(initial.objects["market.equations"].salience.state.level, "absent");
  const verified = projectKpEconomicsSalience({
    market: "shifted",
    presentation: "comparison-verified",
    focusTarget: "equations"
  });
  assert.equal(verified.objects["market.demand.initial"].salience.state.level, "ghost");
  assert.equal(verified.objects["market.equations"].salience.state.level, "focus");
});

test("the grid retains its deliberately dim structural baseline", () => {
  const frame = projectKpEconomicsSalience({
    market: "initial",
    presentation: "graph-only",
    focusTarget: "equilibrium"
  });
  assert.equal(frame.objects["market.grid"].salience.state.level, "dim");
  assert.equal(frame.objects["market.axes"].salience.state.level, "context");
  assert.equal(frame.objects["market.guides"].salience.state.level, "context");
});
