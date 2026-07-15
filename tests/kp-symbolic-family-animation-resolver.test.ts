import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import {
  checkKpSymbolicFamilyAnimationReferenceClosure,
  createKpSymbolicFamilyAnimationResolutions,
  resolveKpSymbolicFamilyAnimationSample
} from "../src/animation/symbolic-family-animation-resolver.ts";
import {
  createKpSymbolicManipulationFamily
} from "../src/animation/symbolic-manipulation-family.ts";
import {
  createSymbolicManipulationFamilyRegistry
} from "../src/animation/symbolic-manipulation-family-registry.ts";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";

test("canonical solve-x asset resolves both algebra family samples", () => {
  const assets = createKpAnimationAssets();
  const families = createSymbolicManipulationFamilyRegistry();
  const solveXResolutions = createKpSymbolicFamilyAnimationResolutions({
    families,
    assets
  }).filter(
    (resolution) =>
      resolution.animationId === "animation.linear-solve.solve-x"
  );

  assert.deepEqual(
    solveXResolutions.map((resolution) => [
      resolution.familyId,
      resolution.sampleId,
      resolution.status
    ]),
    [
      [
        "family.algebra.both-sides",
        "sample.animation.solve-x.both-sides",
        "resolved"
      ],
      [
        "family.algebra.cancel-combine",
        "sample.animation.solve-x.cancel-additive-inverses",
        "resolved"
      ]
    ]
  );
  assert.equal(
    checkKpSymbolicFamilyAnimationReferenceClosure({ families, assets }).passed,
    true
  );
});

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
  assert.equal(
    checkKpSymbolicFamilyAnimationReferenceClosure({
      families: [family],
      assets: [asset, asset]
    }).passed,
    false
  );
});

test("family animation reference closure ignores planned refs and rejects missing concrete refs", () => {
  const asset = createLinearSolveAnimationAsset();
  const planned = familyWithSample({ animationId: "animation.future" });
  const resolved = familyWithSample({
    animationId: asset.id,
    availability: "concrete"
  });
  const missing = familyWithSample({
    animationId: "animation.missing",
    availability: "concrete"
  });

  assert.equal(
    checkKpSymbolicFamilyAnimationReferenceClosure({
      families: [planned, resolved],
      assets: [asset]
    }).passed,
    true
  );
  assert.deepEqual(
    checkKpSymbolicFamilyAnimationReferenceClosure({
      families: [missing],
      assets: [asset]
    }),
    {
      lawId: "symbolic-family.animation-reference-closure",
      passed: false,
      failures: [
        {
          path:
            "family.algebra.resolver-sample.runtimeSamples[sample.animation.resolver]",
          message:
            "Concrete symbolic sample sample.animation.resolver references missing animation animation.missing."
        }
      ]
    }
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
