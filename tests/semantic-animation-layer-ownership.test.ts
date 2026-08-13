import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  assertKpSemanticAnimationLayerOwnership,
  kpSemanticAnimationDependencyLayers,
  kpSemanticAnimationOwnershipMigrationDebt,
  kpSemanticAnimationPublicSeams
} from "../src/architecture/semantic-animation-layer-ownership.ts";
import {
  kpSemanticAnimationCompilerStages
} from "../src/architecture/semantic-animation-compiler-stages.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const forbiddenNeutralResources = [
  "HTMLElement",
  "Element",
  "Node",
  "KaTeX",
  "SVG",
  "pixel",
  "Three.js",
  "WebGL",
  "WebGLRenderer",
  "CanvasRenderingContext"
] as const;

test("layer ownership follows one monotonic compiler direction", () => {
  assert.doesNotThrow(() => assertKpSemanticAnimationLayerOwnership());
  assert.deepEqual(
    kpSemanticAnimationDependencyLayers.map(({ id, rank }) => [id, rank]),
    [
      ["semantic", 0],
      ["neutral-animation-domain", 1],
      ["presentation", 2],
      ["rendering", 3]
    ]
  );

  const assignedStages = kpSemanticAnimationDependencyLayers.flatMap(
    ({ stageIds }) => stageIds
  );
  assert.deepEqual(
    assignedStages,
    kpSemanticAnimationCompilerStages.map(({ id }) => id)
  );
});

test("public seams are adjacent, typed, and domain-honest", () => {
  assert.deepEqual(
    kpSemanticAnimationPublicSeams.map(({ from, to }) => `${from}->${to}`),
    [
      "semantic->neutral-animation-domain",
      "neutral-animation-domain->presentation",
      "presentation->rendering"
    ]
  );

  const equationIr = kpSemanticAnimationPublicSeams
    .flatMap(({ contracts }) => contracts)
    .find(({ representation }) =>
      representation === "KpEquationTransitionIr"
    );
  assert.equal(equationIr?.scope, "equation-domain");
});

test("neutral contracts prohibit concrete renderer resources", () => {
  const neutralContract = JSON.stringify({
    layers: kpSemanticAnimationDependencyLayers.filter(
      ({ concreteRendererResources }) =>
        concreteRendererResources === "forbidden"
    ),
    seams: kpSemanticAnimationPublicSeams
  });
  for (const resource of forbiddenNeutralResources) {
    assert.equal(
      neutralContract.includes(resource),
      false,
      `neutral ownership contract leaked ${resource}`
    );
  }
  assert.equal(
    kpSemanticAnimationDependencyLayers.find(
      ({ id }) => id === "rendering"
    )?.concreteRendererResources,
    "allowed"
  );
});

test("current ownership debt is explicit and scheduled", () => {
  assert.deepEqual(
    kpSemanticAnimationOwnershipMigrationDebt.map(
      ({ stageId, retirementSlice }) => [stageId, retirementSlice]
    ),
    []
  );
  for (const debt of kpSemanticAnimationOwnershipMigrationDebt) {
    const source = join(projectRoot, debt.currentSourcePath);
    assert.equal(existsSync(source), true, `missing ownership debt ${source}`);
    assert.notEqual(readFileSync(source, "utf8").trim(), "");
    assert.equal(
      kpSemanticAnimationCompilerStages.some(({ id }) => id === debt.stageId),
      true
    );
  }
});

test("ownership validation rejects reverse edges and false universal types", () => {
  const [semantic, neutral, presentation, rendering] =
    kpSemanticAnimationDependencyLayers;
  assert.throws(
    () =>
      assertKpSemanticAnimationLayerOwnership({
        layers: [
          semantic!,
          {
            ...neutral!,
            mayDependOn: ["semantic"]
          },
          {
            ...presentation!,
            rank: 0
          },
          rendering!
        ]
      }),
    /cannot depend/
  );

  assert.throws(
    () =>
      assertKpSemanticAnimationLayerOwnership({
        seams: kpSemanticAnimationPublicSeams.map((seam) =>
          seam.id === "seam.neutral-animation-to-presentation"
            ? {
                ...seam,
                contracts: [
                  {
                    representation: "KpEquationTransitionIr",
                    scope: "generic" as const
                  }
                ]
              }
            : seam
        )
      }),
    /cannot claim generic scope/
  );
});
