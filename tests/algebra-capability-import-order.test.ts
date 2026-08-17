import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const imports = [
  "./src/animation/distribution-choreography.ts",
  "./src/animation/factoring-choreography.ts",
  "./src/animation/canonical-reverse-choreography.ts",
  "./src/animation/catalog-packs/algebra.ts"
] as const;

test("algebra pack construction is repeatable and produces isolated catalogs", async () => {
  const { createKpAlgebraAnimationPack } = await import(
    "../src/animation/catalog-packs/algebra.ts"
  );
  const first = createKpAlgebraAnimationPack();
  const second = createKpAlgebraAnimationPack();

  assert.notEqual(first, second);
  assert.notEqual(first.catalog, second.catalog);
  assert.deepEqual(
    first.catalog.map(({ id }) => id),
    second.catalog.map(({ id }) => id)
  );
  assert.equal(first.runtimeCapabilities, second.runtimeCapabilities);
  assert.equal(Object.isFrozen(first.runtimeCapabilities), true);
  assert.equal(
    first.runtimeCapabilities.canonicalReverseChoreography?.entries.length,
    8
  );
});

test("every compiler-first and pack-first clean-process order has the same result", () => {
  const orders = [
    imports,
    [...imports].reverse(),
    [imports[1], imports[3], imports[0], imports[2]],
    [imports[2], imports[0], imports[3], imports[1]]
  ];
  const results = orders.map(runCleanProcessOrder);

  results.forEach((result) => assert.deepEqual(result, results[0]));
  assert.deepEqual(results[0], {
    assetIds: [
      "animation.generated.cancellation.additive-inverses",
      "animation.generated.fraction-expression.two-fourths",
      "animation.generated.exponent.square-as-product",
      "animation.generated.radical.square-root-as-power",
      "animation.generated.function-wrap.apply-f",
      "animation.generated.distribution.expand-a-sum",
      "animation.generated.distribution.factor-common-a",
      "animation.inequality.sign-flip.basic",
      "animation.algebra.log-exponent.solve-two-power-x",
      "animation.algebra.log-quotient.difference-to-quotient"
    ],
    capabilityKeys: [
      "canonicalReverseChoreography",
      "distributionChoreography",
      "factoringChoreography",
      "fissionFusion",
      "semanticMotion"
    ],
    reverseCount: 8
  });
});

test("linear solve and remaining algebra share one choreography authority", async () => {
  const [{ createKpAlgebraAnimationPack }, {
    createKpAlgebraLinearSolveAnimationPack
  }] = await Promise.all([
    import("../src/animation/catalog-packs/algebra.ts"),
    import("../src/animation/catalog-packs/algebra-linear-solve.ts")
  ]);
  const algebra = createKpAlgebraAnimationPack();
  const linearSolve = createKpAlgebraLinearSolveAnimationPack();

  assert.equal(
    linearSolve.runtimeCapabilities,
    algebra.runtimeCapabilities
  );
  assert.deepEqual(linearSolve.catalog.map(({ id }) => id), [
    "animation.linear-solve.solve-x",
    "animation.generated.linear-solve.linear-68c15d41"
  ]);
});

test("repeated lazy loads return one deterministic pack capability identity", async () => {
  const { loadKpAnimationAsset } = await import(
    "../src/animation/catalog-loader.ts"
  );
  const [distribution, factoring, distributionAgain] = await Promise.all([
    loadKpAnimationAsset("animation.generated.distribution.expand-a-sum"),
    loadKpAnimationAsset("animation.generated.distribution.factor-common-a"),
    loadKpAnimationAsset("animation.generated.distribution.expand-a-sum")
  ]);

  assert.equal(distribution.runtimeCapabilities, factoring.runtimeCapabilities);
  assert.equal(distribution.runtimeCapabilities, distributionAgain.runtimeCapabilities);
  assert.equal(distribution.catalog, factoring.catalog);
  assert.deepEqual(
    distribution.catalog.map(({ id }) => id),
    distributionAgain.catalog.map(({ id }) => id)
  );
});

function runCleanProcessOrder(order: readonly string[]) {
  const script = `
    const modules = await Promise.all(${JSON.stringify(order)}.map((path) => import(path)));
    const packModule = modules.find((module) =>
      typeof module.createKpAlgebraAnimationPack === "function"
    );
    const pack = packModule.createKpAlgebraAnimationPack();
    console.log(JSON.stringify({
      assetIds: pack.catalog.map(({ id }) => id),
      capabilityKeys: Object.keys(pack.runtimeCapabilities).sort(),
      reverseCount: pack.runtimeCapabilities.canonicalReverseChoreography.entries.length
    }));
  `;
  return JSON.parse(execFileSync(
    process.execPath,
    ["--disable-warning=ExperimentalWarning", "--input-type=module", "-e", script],
    {
      cwd: projectRoot,
      encoding: "utf8"
    }
  ));
}
