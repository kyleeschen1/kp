import { expect, test } from "@playwright/test";

const animationId =
  "animation.generated.calculus.integral.power-rule-quadratic";

test("two certified integration cohorts share one clock and remain separate", async ({
  page
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const result = await page.evaluate(async (expectedAnimationId) => {
    const catalogPath = "/src/animation/catalog.ts";
    const migrationPath =
      "/src/domain-ir/antiderivative-power-migration-v2.ts";
    const semanticLatexPath =
      "/src/editor/antiderivative-power-semantic-latex.ts";
    const katexAdapterPath = "/src/rendering/katex-adapter.ts";
    const hotPathPath = "/src/editor/equation-stage-hot-path-cache.ts";
    const mountPath =
      "/src/editor/antiderivative-power-evaluation-mount.ts";
    const [
      catalog,
      migrationModule,
      semanticLatex,
      katexAdapter,
      hotPathModule,
      mountModule
    ] = await Promise.all([
      import(catalogPath) as Promise<
        typeof import("../src/animation/catalog.ts")
      >,
      import(migrationPath) as Promise<
        typeof import(
          "../src/domain-ir/antiderivative-power-migration-v2.ts"
        )
      >,
      import(semanticLatexPath) as Promise<
        typeof import("../src/editor/antiderivative-power-semantic-latex.ts")
      >,
      import(katexAdapterPath) as Promise<
        typeof import("../src/rendering/katex-adapter.ts")
      >,
      import(hotPathPath) as Promise<
        typeof import("../src/editor/equation-stage-hot-path-cache.ts")
      >,
      import(mountPath) as Promise<
        typeof import("../src/editor/antiderivative-power-evaluation-mount.ts")
      >
    ]);
    const animation = catalog.createGeneratedProblemAnimationAssets().find(
      ({ id }) => id === expectedAnimationId
    );
    if (animation === undefined) throw new Error("Missing integration fixture.");
    const sourceObject = animation.bundle.objects.find(({ id }) =>
      id.endsWith(".expanded")
    );
    const targetObject = animation.bundle.objects.find(({ id }) =>
      id.endsWith(".integrated")
    );
    if (sourceObject === undefined || targetObject === undefined) {
      throw new Error("Integration fixture lacks evaluation endpoints.");
    }
    const sourceLatex =
      semanticLatex.createKpAntiderivativePowerSelectorAnnotatedLatex({
        objectId: sourceObject.id,
        selectors: sourceObject.selectors
      });
    const targetLatex =
      semanticLatex.createKpAntiderivativePowerSelectorAnnotatedLatex({
        objectId: targetObject.id,
        selectors: targetObject.selectors
      });
    if (sourceLatex === undefined || targetLatex === undefined) {
      throw new Error("Integration evaluation lacks semantic KaTeX.");
    }
    const migration =
      migrationModule.compileKpAntiderivativePowerMigrationV2(animation);
    const transformation = animation.transformations.find(({ transformType }) =>
      transformType === "simplifyAntiderivativePowerRule"
    );
    if (transformation === undefined) {
      throw new Error("Integration evaluation transformation is missing.");
    }

    const stage = document.createElement("section");
    stage.dataset["kpIntegrationEvaluationCanary"] = "true";
    stage.style.cssText = [
      "position:relative",
      "width:720px",
      "height:260px",
      "margin:24px",
      "font-size:48px",
      "color:rgb(24,24,27)"
    ].join(";");
    stage.innerHTML = `
      <div data-endpoint="source"></div>
      <div data-endpoint="target"></div>
      <div data-kp-editor-equation-material-layer></div>
    `;
    document.body.replaceChildren(stage);
    const sourceRoot = stage.querySelector<HTMLElement>(
      '[data-endpoint="source"]'
    );
    const targetRoot = stage.querySelector<HTMLElement>(
      '[data-endpoint="target"]'
    );
    const materialLayer = stage.querySelector<HTMLElement>(
      "[data-kp-editor-equation-material-layer]"
    );
    if (sourceRoot === null || targetRoot === null || materialLayer === null) {
      throw new Error("Integration evaluation stage is incomplete.");
    }
    for (const root of [sourceRoot, targetRoot]) {
      root.style.cssText = [
        "position:absolute",
        "inset:0",
        "display:grid",
        "place-items:center"
      ].join(";");
    }
    materialLayer.style.cssText =
      "position:absolute;inset:0;pointer-events:none";
    sourceRoot.innerHTML = katexAdapter.renderSelectorAnnotatedLatexToHtml(
      sourceLatex
    );
    targetRoot.innerHTML = katexAdapter.renderSelectorAnnotatedLatexToHtml(
      targetLatex
    );
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())));
    const hotPath = hotPathModule.getKpEditorEquationStageHotPathCache({
      stage,
      contentKey: "integration-power-rule-evaluation-canary",
      onInvalidate: () => undefined
    });

    const samples = [0, 0.25, 0.5, 0.53, 0.7, 1].map((progress) => {
      const mounted = mountModule.applyKpAntiderivativePowerEvaluationMount({
        stage,
        plan: migration.presentationPlan,
        activeTransformationIds: [transformation.id],
        localProgress: progress,
        direction: "forward",
        hotPath
      });
      const owners = [...stage.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )];
      const byCohort = Object.fromEntries(
        migrationModule.kpAntiderivativePowerEvaluationCohortIds.map(
          (cohortId) => {
            const cohortOwners = owners.filter((owner) =>
              owner.dataset[
                "kpEquationMaterialVerifiedOperationCohortId"
              ] === cohortId
            );
            const visible = cohortOwners.filter((owner) =>
              owner.style.visibility !== "hidden" &&
              Number(owner.style.opacity) > 0
            );
            const centers = visible.map((owner) => {
              const rect = owner.getBoundingClientRect();
              return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            });
            return [cohortId, {
              ownerCount: cohortOwners.length,
              visibleCount: visible.length,
              visibleSourceCount: visible.filter((owner) =>
                owner.dataset["kpEquationMaterialFragmentRole"]
                  ?.startsWith("successor-source:") === true
              ).length,
              visibleTargetCount: visible.filter((owner) =>
                owner.dataset["kpEquationMaterialFragmentRole"]
                  ?.startsWith("successor-target:") === true
              ).length,
              center: centers.length === 0
                ? undefined
                : {
                    x: centers.reduce((sum, point) => sum + point.x, 0) /
                      centers.length,
                    y: centers.reduce((sum, point) => sum + point.y, 0) /
                      centers.length
                  }
            }];
          }
        )
      );
      const realizedFractionRules = [
        ...stage.querySelectorAll<HTMLElement>(".frac-line")
      ].filter((rule) => {
        let opacity = 1;
        for (
          let current: HTMLElement | null = rule;
          current !== null;
          current = current.parentElement
        ) {
          const style = getComputedStyle(current);
          if (style.display === "none" || style.visibility === "hidden") {
            return false;
          }
          opacity *= Number(style.opacity);
          if (current === stage) break;
        }
        return opacity > 0.01;
      });
      return {
        progress,
        mounted,
        byCohort,
        visibleFractionRuleCount: realizedFractionRules.length,
        fractionOwner:
          stage.dataset["kpAntiderivativeEvaluationFractionOwner"],
        materialFractionOwnerCount: stage.querySelectorAll(
          '[data-kp-equation-material-fragment-role="rule:persistent-evaluation-fraction"]'
        ).length,
        legibilityState:
          stage.dataset["kpOperationEvaluationLegibilityState"],
        readableCohortCount:
          stage.dataset["kpOperationEvaluationReadableCohortCount"],
        realizedPrimitiveId:
          stage.dataset["kpOperationEvaluationRealizedPrimitiveId"],
        settlement:
          stage.dataset["kpAntiderivativeEvaluationNativeSettlement"]
      };
    });
    return {
      clockAuthority: migration.presentationPlan.clockAuthority,
      resolutionTransitionCount: migration.presentationPlan.transitions.filter(
        ({ semanticOperation }) =>
          semanticOperation.transformationId === transformation.id
      ).length,
      cohortIds: JSON.parse(
        stage.dataset["kpOperationEvaluationCohortIds"] ?? "[]"
      ) as string[],
      cohortCount: stage.dataset["kpOperationEvaluationCohortCount"],
      samples
    };
  }, animationId);

  expect(result.clockAuthority).toBe("kp.shared-normalized-clock.v1");
  expect(result.resolutionTransitionCount).toBe(1);
  expect(result.cohortCount).toBe("2");
  expect(result.cohortIds).toEqual([
    "cohort.antiderivative-power.numerator-successor",
    "cohort.antiderivative-power.denominator-successor"
  ]);
  for (const sample of result.samples) {
    expect(sample.mounted.status).toBe("mounted");
    expect(sample.realizedPrimitiveId).toBe(
      "kp.rendering.native-katex.primitive.ink-knot.v1"
    );
    for (const cohortId of result.cohortIds) {
      expect(sample.byCohort[cohortId]?.ownerCount).toBe(4);
    }
    expect(sample.visibleFractionRuleCount).toBe(1);
  }
  const source = result.samples.find(({ progress }) => progress === 0)!;
  const kernel = result.samples.find(({ progress }) => progress === 0.5)!;
  const target = result.samples.find(({ progress }) => progress === 0.53)!;
  const recognized = result.samples.find(({ progress }) => progress === 0.7)!;
  const settled = result.samples.find(({ progress }) => progress === 1)!;
  for (const cohortId of result.cohortIds) {
    expect(source.byCohort[cohortId]?.visibleCount).toBe(0);
    expect(kernel.byCohort[cohortId]?.visibleSourceCount).toBe(3);
    expect(kernel.byCohort[cohortId]?.visibleTargetCount).toBe(0);
    expect(target.byCohort[cohortId]?.visibleSourceCount).toBe(0);
    expect(target.byCohort[cohortId]?.visibleTargetCount).toBe(1);
    expect(settled.byCohort[cohortId]?.visibleCount).toBe(0);
  }
  expect(kernel.legibilityState).toBe("kernel");
  expect(kernel.readableCohortCount).toBe("0");
  expect(recognized.readableCohortCount).toBe("2");
  expect(source.settlement).toBe("source");
  expect(settled.settlement).toBe("target");
  expect(source.fractionOwner).toBe("source-native");
  expect(source.materialFractionOwnerCount).toBe(0);
  expect(kernel.fractionOwner).toBe("material");
  expect(kernel.materialFractionOwnerCount).toBe(1);
  expect(settled.fractionOwner).toBe("target-native");
  expect(settled.materialFractionOwnerCount).toBe(0);
  const numeratorCenter = kernel.byCohort[result.cohortIds[0]!]!.center!;
  const denominatorCenter = kernel.byCohort[result.cohortIds[1]!]!.center!;
  expect(Math.abs(numeratorCenter.y - denominatorCenter.y)).toBeGreaterThan(12);
});
