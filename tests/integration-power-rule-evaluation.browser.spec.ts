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

    const samples = [
      0,
      0.25,
      0.5,
      0.53,
      0.57,
      0.58,
      0.6,
      0.62,
      0.64,
      0.66,
      0.68,
      0.7,
      0.72,
      1
    ].map((progress) => {
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
      const visibleFractionRect = realizedFractionRules[0]
        ?.getBoundingClientRect();
      const materialFractionOwner = stage.querySelector<HTMLElement>(
        '[data-kp-equation-material-fragment-role="rule:persistent-evaluation-fraction"]'
      );
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
        fractionMotion:
          stage.dataset["kpAntiderivativeEvaluationFractionMotion"],
        fractionReshapeProgress: Number(
          stage.dataset[
            "kpAntiderivativeEvaluationFractionReshapeProgress"
          ] ?? 0
        ),
        visibleFractionRect: visibleFractionRect === undefined
          ? undefined
          : {
              left: visibleFractionRect.left,
              top: visibleFractionRect.top,
              width: visibleFractionRect.width,
              height: visibleFractionRect.height
            },
        materialFractionLayout: materialFractionOwner === null
          ? undefined
          : {
              left: materialFractionOwner.style.left,
              top: materialFractionOwner.style.top,
              width: materialFractionOwner.style.width,
              height: materialFractionOwner.style.height,
              transform: materialFractionOwner.style.transform
            },
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
  expect(source.fractionMotion).toBe("native");
  expect(settled.fractionMotion).toBe("native");
  const materialSamples = result.samples.filter((sample) =>
    sample.progress > 0 && sample.progress < 1
  );
  expect(materialSamples.every((sample) =>
    sample.fractionMotion === "transform-only"
  )).toBe(true);
  expect(new Set(materialSamples.map((sample) =>
    sample.materialFractionLayout?.left
  )).size).toBe(1);
  expect(new Set(materialSamples.map((sample) =>
    sample.materialFractionLayout?.top
  )).size).toBe(1);
  expect(new Set(materialSamples.map((sample) =>
    sample.materialFractionLayout?.width
  )).size).toBe(1);
  expect(materialSamples.every((sample) => {
    const layout = sample.materialFractionLayout;
    return layout !== undefined &&
      layout.transform.includes("translate3d(") &&
      layout.transform.includes("scaleX(");
  })).toBe(true);
  const reshapingSamples = result.samples.filter((sample) =>
    sample.progress >= 0.58 && sample.progress <= 0.7
  );
  expect(reshapingSamples[0]?.fractionReshapeProgress).toBe(0);
  expect(reshapingSamples.at(-1)?.fractionReshapeProgress).toBe(1);
  for (let index = 1; index < reshapingSamples.length; index += 1) {
    const previous = reshapingSamples[index - 1]!;
    const current = reshapingSamples[index]!;
    expect(current.fractionReshapeProgress)
      .toBeGreaterThanOrEqual(previous.fractionReshapeProgress);
    expect(current.visibleFractionRect!.width)
      .toBeLessThanOrEqual(previous.visibleFractionRect!.width + 0.1);
  }
  expect(reshapingSamples[0]!.visibleFractionRect!.width)
    .toBeGreaterThan(reshapingSamples.at(-1)!.visibleFractionRect!.width);
  const numeratorCenter = kernel.byCohort[result.cohortIds[0]!]!.center!;
  const denominatorCenter = kernel.byCohort[result.cohortIds[1]!]!.center!;
  expect(Math.abs(numeratorCenter.y - denominatorCenter.y)).toBeGreaterThan(12);
});

test("live fraction reshape keeps one transform-only owner at frame cadence", async ({
  page,
  browserName
}) => {
  test.setTimeout(30_000);
  await page.goto(`/?artifact=${animationId}&playhead=0.785&theme=dark`);
  const player = page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-editor-equation-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-antiderivative-evaluation-mount",
    "native-katex",
    { timeout: 30_000 }
  );
  const auditPromise = stage.evaluate((root) => new Promise<{
    readonly browser: string;
    readonly frames: readonly {
      readonly at: number;
      readonly reshape: number;
      readonly width: number;
      readonly visibleFractionCount: number;
      readonly layoutLeft: string;
      readonly layoutWidth: string;
      readonly transform: string;
    }[];
  }>((resolve, reject) => {
    const frames: {
      at: number;
      reshape: number;
      width: number;
      visibleFractionCount: number;
      layoutLeft: string;
      layoutWidth: string;
      transform: string;
    }[] = [];
    const startedAt = performance.now();
    const timeout = window.setTimeout(() => {
      reject(new Error("Timed out observing the live fraction reshape."));
    }, 5_000);
    const realized = (element: HTMLElement): boolean => {
      let opacity = 1;
      for (
        let current: HTMLElement | null = element;
        current !== null;
        current = current.parentElement
      ) {
        const style = getComputedStyle(current);
        if (style.display === "none" || style.visibility === "hidden") {
          return false;
        }
        opacity *= Number(style.opacity);
        if (current === root) break;
      }
      return opacity > 0.01;
    };
    const sample = (at: number): void => {
      const owner = root.querySelector<HTMLElement>(
        '[data-kp-equation-material-fragment-role="rule:persistent-evaluation-fraction"]'
      );
      const reshape = Number(root.dataset[
        "kpAntiderivativeEvaluationFractionReshapeProgress"
      ] ?? 0);
      if (owner !== null) {
        const rect = owner.getBoundingClientRect();
        frames.push({
          at,
          reshape,
          width: rect.width,
          visibleFractionCount: [
            ...root.querySelectorAll<HTMLElement>(".frac-line")
          ].filter(realized).length,
          layoutLeft: owner.style.left,
          layoutWidth: owner.style.width,
          transform: owner.style.transform
        });
      }
      if (reshape >= 1 && frames.length > 1) {
        window.clearTimeout(timeout);
        resolve({ browser: navigator.userAgent, frames });
        return;
      }
      if (at - startedAt > 4_000) {
        window.clearTimeout(timeout);
        reject(new Error("Fraction reshape did not settle during playback."));
        return;
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
  await player.locator('[data-action="toggle-editor-animation"]').click();
  const audit = await auditPromise;
  const active = audit.frames.filter(({ reshape }) =>
    reshape > 0 && reshape < 1
  );
  const intervals = active.slice(1).map((frame, index) =>
    frame.at - active[index]!.at
  ).sort((left, right) => left - right);
  const p95 = intervals[Math.floor((intervals.length - 1) * 0.95)] ?? Infinity;
  expect(audit.browser.toLowerCase()).toContain(
    browserName === "chromium" ? "chrome" : browserName
  );
  expect(active.length).toBeGreaterThanOrEqual(20);
  expect(p95).toBeLessThan(50);
  expect(new Set(audit.frames.map(({ layoutLeft }) => layoutLeft)).size)
    .toBe(1);
  expect(new Set(audit.frames.map(({ layoutWidth }) => layoutWidth)).size)
    .toBe(1);
  expect(audit.frames.every(({ transform }) =>
    transform.includes("translate3d(") && transform.includes("scaleX(")
  )).toBe(true);
  expect(audit.frames.every(({ visibleFractionCount }) =>
    visibleFractionCount === 1
  )).toBe(true);
  for (let index = 1; index < audit.frames.length; index += 1) {
    expect(audit.frames[index]!.width)
      .toBeLessThanOrEqual(audit.frames[index - 1]!.width + 0.1);
  }
});
