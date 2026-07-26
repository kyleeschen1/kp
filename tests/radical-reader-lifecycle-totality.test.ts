import assert from "node:assert/strict";
import test from "node:test";

import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  createKpGovernedRadicalSuccessionFixture
} from "../src/authoring/governed-radical-succession-fixture.ts";
import {
  compileKpReaderEquationMaterialPlan,
  projectKpReaderEquationRenderPlan
} from "../src/reader/renderers/public-api.ts";

const animation =
  createKpGovernedRadicalSuccessionFixture().authority.animation;

test("radical selector lifecycles are total and inverse", () => {
  const forward = plans("forward");
  const reverse = plans("rewind");
  assert.deepEqual(forward.render.diagnostics, []);
  assert.deepEqual(forward.material.diagnostics, []);
  assert.deepEqual(reverse.render.diagnostics, []);
  assert.deepEqual(reverse.material.diagnostics, []);

  const forwardTransition = forward.render.transitions[0]!;
  const reverseTransition = reverse.render.transitions[0]!;
  assert.deepEqual(
    selectorIds(forwardTransition.source),
    selectorIds(reverseTransition.target)
  );
  assert.deepEqual(
    selectorIds(forwardTransition.target),
    selectorIds(reverseTransition.source)
  );
  assert.deepEqual(
    forwardTransition.relations.map((relation) => ({
      source: relation.sourceSelectorIds,
      target: relation.targetSelectorIds,
      lifecycle: relation.lifecycle
    })),
    reverseTransition.relations.map((relation) => ({
      source: relation.targetSelectorIds,
      target: relation.sourceSelectorIds,
      lifecycle: reverseLifecycle(relation.lifecycle)
    }))
  );
});

test("every radical selector is owned by exactly one semantic relation", () => {
  for (const direction of ["forward", "rewind"] as const) {
    const transition = plans(direction).render.transitions[0]!;
    const relatedSource = transition.relations.flatMap(
      ({ sourceSelectorIds }) => sourceSelectorIds
    );
    const relatedTarget = transition.relations.flatMap(
      ({ targetSelectorIds }) => targetSelectorIds
    );
    assertExactCoverage(selectorIds(transition.source), relatedSource);
    assertExactCoverage(selectorIds(transition.target), relatedTarget);
  }
});

function plans(direction: "forward" | "rewind") {
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: `runtime.test.radical-lifecycle.${direction}`,
    animation,
    direction,
    progress: 0.5
  });
  const render = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame
  });
  return {
    render,
    material: compileKpReaderEquationMaterialPlan(render)
  };
}

function selectorIds(
  states: readonly {
    readonly selectors: readonly { readonly id: string }[];
  }[]
): string[] {
  return states.flatMap(({ selectors }) => selectors.map(({ id }) => id))
    .sort();
}

function assertExactCoverage(
  expected: readonly string[],
  observed: readonly string[]
): void {
  assert.deepEqual([...observed].sort(), [...expected].sort());
  assert.equal(new Set(observed).size, observed.length);
}

function reverseLifecycle(
  lifecycle:
    | "persist"
    | "role-change"
    | "enter"
    | "exit"
    | "cancel"
    | "merge"
    | "split"
    | "artifact"
    | "focus"
) {
  if (lifecycle === "enter") return "exit";
  if (lifecycle === "exit" || lifecycle === "cancel") return "enter";
  if (lifecycle === "split") return "merge";
  if (lifecycle === "merge") return "split";
  return lifecycle;
}
