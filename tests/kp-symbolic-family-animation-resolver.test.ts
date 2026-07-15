import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import {
  createKpSymbolicFamilyAnimationResolutions,
  resolveKpSymbolicFamilyAnimationSample
} from "../src/animation/symbolic-family-animation-resolver.ts";
import {
  createKpSymbolicManipulationFamily
} from "../src/animation/symbolic-manipulation-family.ts";

test("family animation resolver requires explicit concrete availability and exact ids", () => {
  const asset = createLinearSolveAnimationAsset();
  const plannedFamily = familyWithSample({
    animationId: asset.id
  });
  const concreteFamily = familyWithSample({
    animationId: asset.id,
    availability: "concrete"
  });
  const aliasedFamily = familyWithSample({
    animationId: "animation.solve-x",
    availability: "concrete"
  });

  assert.equal(
    resolveKpSymbolicFamilyAnimationSample({
      family: plannedFamily,
      sample: plannedFamily.runtimeSamples[0]!,
      assets: [asset]
    }).status,
    "planned"
  );

  const resolved = resolveKpSymbolicFamilyAnimationSample({
    family: concreteFamily,
    sample: concreteFamily.runtimeSamples[0]!,
    assets: [asset]
  });
  assert.equal(resolved.status, "resolved");
  assert.equal(resolved.asset?.id, asset.id);

  assert.equal(
    resolveKpSymbolicFamilyAnimationSample({
      family: aliasedFamily,
      sample: aliasedFamily.runtimeSamples[0]!,
      assets: [asset]
    }).status,
    "missing"
  );
});

test("family animation resolver reports duplicate exact ids as ambiguous", () => {
  const asset = createLinearSolveAnimationAsset();
  const family = familyWithSample({
    animationId: asset.id,
    availability: "concrete"
  });

  assert.equal(
    createKpSymbolicFamilyAnimationResolutions({
      families: [family],
      assets: [asset, asset]
    })[0]?.status,
    "ambiguous"
  );
});

function familyWithSample(input: {
  readonly animationId: string;
  readonly availability?: "planned" | "concrete" | undefined;
}) {
  return createKpSymbolicManipulationFamily({
    id: "family.algebra.resolver-sample",
    title: "Resolver sample family",
    domain: "algebra",
    runtimeSamples: [
      {
        id: "sample.animation.resolver",
        animationId: input.animationId,
        ...(input.availability === undefined
          ? {}
          : { availability: input.availability }),
        renderTargetKinds: ["equation"]
      }
    ]
  });
}
