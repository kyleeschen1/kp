import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAnimationAssets
} from "../src/animation/catalog.ts";
import {
  compileKpGeneratedCancellationPresentation,
  kpGeneratedCancellationDraftSchemaVersion
} from "../src/animation/generated-cancellation-presentation-boundary.ts";
import {
  createLinearSolveAnimationAsset,
  createLinearSolveTeacherZeroAnimationAsset
} from "../src/animation/linear-solve-adapter.ts";
import {
  checkKpEquationPresentationCatalog,
  decideKpEquationPresentationCatalogPromotion
} from "../src/reader/renderers/equation-presentation-catalog-conformance.ts";

test("catalog separates executable routes from generic presentation labels", () => {
  const assets = createKpAnimationAssets();
  const report = checkKpEquationPresentationCatalog(assets);

  // Catalogue growth must extend this proof rather than requiring a second
  // hand-maintained asset total that silently goes stale.
  assert.equal(report.animationCount, assets.length);
  assert.ok(report.claimedTransformationCount > 0);
  assert.equal(
    report.claimedTransformationCount,
    report.equationTransformationCount +
      report.excludedTransformationCount
  );
  assert.deepEqual(
    report.exclusions.map(({ transformationId }) => transformationId),
    [
      "transform.comparison.jacobian-hessian.compare-derivative-structure",
      "transform.sample.fundamental-theorem-calculus.compare",
      "transform.sample.fourier-transform-pair.compare"
    ]
  );
  assert.equal(
    report.directionalEntryCount,
    report.equationTransformationCount * 2
  );
  const missingPlanEntries = report.entries.filter(
    ({ planKind }) => planKind === undefined
  );
  assert.deepEqual(
    [...new Set(missingPlanEntries.map(({ animationId }) => animationId))],
    ["animation.algebra.log-exponent.solve-two-power-x"]
  );
  assert.ok(missingPlanEntries.every(({ status }) => status === "incomplete"));
  assert.equal(report.coverage, "incomplete");
  assert.equal(
    report.issues.length,
    report.entries.filter(({ status }) => status === "incomplete").length
  );
  assert.deepEqual(
    [...new Set(report.issues.map(({ code }) => code))],
    [
      "catalog.missing-execution-route",
      "catalog.presentation-planning-failed"
    ]
  );
  assert.ok(report.issues
    .filter(({ code }) => code === "catalog.presentation-planning-failed")
    .every(({ animationId }) =>
      animationId === "animation.algebra.log-exponent.solve-two-power-x"
    ));
  assert.deepEqual(
    new Set(report.entries
      .filter(({ status }) => status === "incomplete")
      .flatMap(({ planKind }) => planKind === undefined ? [] : [planKind])),
    new Set(["visual-motif", "default-motion"])
  );
  assert.ok(report.entries
    .filter(({ status }) => status === "verified-animated")
    .every(({ executionRoute }) => executionRoute !== undefined));
  assert.deepEqual(
    [...new Set(report.entries
      .filter(({ status }) => status === "explicit-static")
      .map(({ transformationId }) => transformationId))],
    [
      "transform.generated.linear-solve.linear-68c15d41.cancel-additive-inverses",
      "transform.generated.linear-solve.linear-68c15d41.cancel-multiplicative-inverses"
    ]
  );
  assert.equal(
    decideKpEquationPresentationCatalogPromotion(report).status,
    "blocked"
  );
});

test("promotion requires all operations to remain verified animated", () => {
  const verified = checkKpEquationPresentationCatalog([
    createLinearSolveAnimationAsset()
  ]);
  assert.equal(verified.coverage, "verified-animated");
  assert.deepEqual(
    decideKpEquationPresentationCatalogPromotion(verified),
    {
      kind: "equation-presentation-catalog-promotion-decision",
      status: "approved",
      coverage: "verified-animated",
      diagnostics: []
    }
  );

  const staticReport = checkKpEquationPresentationCatalog([
    createLinearSolveTeacherZeroAnimationAsset()
  ]);
  assert.equal(staticReport.coverage, "incomplete");
  assert.ok(staticReport.entries.some(
    ({ status, staticReason }) =>
      status === "explicit-static" &&
      staticReason === "missing-verified-plan"
  ));
  assert.equal(
    decideKpEquationPresentationCatalogPromotion(staticReport).status,
    "blocked"
  );
  assert.deepEqual(
    [...new Set(staticReport.issues.map(({ code }) => code))],
    ["catalog.missing-execution-route"]
  );
});

test("caller-authored catalog coverage cannot mint promotion", () => {
  const verified = checkKpEquationPresentationCatalog([
    createLinearSolveAnimationAsset()
  ]);
  const forged = {
    ...verified,
    coverage: "verified-animated",
    issues: []
  } as unknown as typeof verified;

  assert.deepEqual(
    decideKpEquationPresentationCatalogPromotion(forged),
    {
      kind: "equation-presentation-catalog-promotion-decision",
      status: "blocked",
      coverage: "incomplete",
      diagnostics: [
        "catalog.unverified-report: Catalog promotion requires a fresh " +
        "conformance report, not caller-authored coverage."
      ]
    }
  );
});

test("catalog coverage cannot hide a missing equation transformation", () => {
  const animation = createLinearSolveAnimationAsset();
  const report = checkKpEquationPresentationCatalog([{
    ...animation,
    renderTargets: animation.renderTargets.map((target) =>
      target.kind !== "equation"
        ? target
        : {
            ...target,
            transformationIds: [
              ...(target.transformationIds ?? []),
              "transform.generated.missing"
            ]
          }
    )
  }]);

  assert.equal(report.coverage, "incomplete");
  assert.deepEqual(
    report.issues.map(({ code, transformationId }) => [
      code,
      transformationId
    ]),
    [[
      "catalog.missing-transformation",
      "transform.generated.missing"
    ]]
  );
  assert.equal(
    decideKpEquationPresentationCatalogPromotion(report).status,
    "blocked"
  );
});

test("adversarial generated drafts cannot smuggle presentation authority into catalog coverage", () => {
  const unsafe = compileKpGeneratedCancellationPresentation({
    schemaVersion: kpGeneratedCancellationDraftSchemaVersion,
    familyId: "generated.linear-solve",
    id: "generated.linear-solve.catalog-adversary",
    title: "Unsafe generated solve",
    variable: "x",
    coefficient: 3,
    solution: 4,
    selectorIds: ["source.left", "source.right"],
    presentationRoles: ["inverse-a", "inverse-b"],
    dom: "<span>x</span>",
    geometry: { x: 0, y: 0 },
    durationMs: 20,
    motionPath: "M0 0",
    recipe: "fade"
  });

  assert.equal(unsafe.kind, "rejected");
  if (unsafe.kind !== "rejected") return;
  assert.equal(unsafe.issues[0]?.code, "draft.unsupported");
  assert.match(
    unsafe.issues[0]?.message ?? "",
    /cannot author fields/
  );
});
