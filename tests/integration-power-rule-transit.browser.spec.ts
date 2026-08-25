import { expect, test } from "@playwright/test";

const animationId =
  "animation.generated.calculus.integral.power-rule-quadratic";

test("canonical integration rewrite traverses real Native KaTeX paint owners", async ({
  page
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const result = await page.evaluate(async (expectedAnimationId) => {
    const catalogPath = "/src/animation/catalog.ts";
    const semanticLatexPath =
      "/src/editor/antiderivative-power-semantic-latex.ts";
    const katexAdapterPath = "/src/rendering/katex-adapter.ts";
    const fontModulePath = "/src/rendering/equation-font-readiness.ts";
    const observedScenePath =
      "/src/rendering/native-katex-rendered-scene.ts";
    const paintGeometryPath =
      "/src/rendering/native-katex-paint-geometry.ts";
    const transitPath =
      "/src/rendering/native-katex-antiderivative-power-transit.ts";
    const compositorPath =
      "/src/rendering/native-katex-scene-compositor.ts";
    const [
      catalog,
      semanticLatex,
      katexAdapter,
      fontModule,
      observedScene,
      paintGeometry,
      transit,
      compositor
    ] = await Promise.all([
      import(catalogPath) as Promise<
        typeof import("../src/animation/catalog.ts")
      >,
      import(semanticLatexPath) as Promise<
        typeof import("../src/editor/antiderivative-power-semantic-latex.ts")
      >,
      import(katexAdapterPath) as Promise<
        typeof import("../src/rendering/katex-adapter.ts")
      >,
      import(fontModulePath) as Promise<
        typeof import("../src/rendering/equation-font-readiness.ts")
      >,
      import(observedScenePath) as Promise<
        typeof import("../src/rendering/native-katex-rendered-scene.ts")
      >,
      import(paintGeometryPath) as Promise<
        typeof import("../src/rendering/native-katex-paint-geometry.ts")
      >,
      import(transitPath) as Promise<
        typeof import(
          "../src/rendering/native-katex-antiderivative-power-transit.ts"
        )
      >,
      import(compositorPath) as Promise<
        typeof import("../src/rendering/native-katex-scene-compositor.ts")
      >
    ]);
    const animation = catalog.createGeneratedProblemAnimationAssets().find(
      ({ id }) => id === expectedAnimationId
    );
    if (animation === undefined) throw new Error("Missing integration fixture.");
    const sourceObject = animation.bundle.objects.find(({ id }) =>
      id.endsWith(".initial")
    );
    const targetObject = animation.bundle.objects.find(({ id }) =>
      id.endsWith(".expanded")
    );
    if (sourceObject === undefined || targetObject === undefined) {
      throw new Error("Integration fixture lacks first-transition endpoints.");
    }
    const sourceLatex =
      semanticLatex.createKpAntiderivativePowerSelectorAnnotatedLatex(
        { objectId: sourceObject.id, selectors: sourceObject.selectors }
      );
    const targetLatex =
      semanticLatex.createKpAntiderivativePowerSelectorAnnotatedLatex(
        { objectId: targetObject.id, selectors: targetObject.selectors }
      );
    if (sourceLatex === undefined || targetLatex === undefined) {
      throw new Error("Integration endpoints lack selector-annotated KaTeX.");
    }

    const stage = document.createElement("section");
    stage.dataset["kpIntegrationTransitCanary"] = "true";
    stage.style.cssText = [
      "position:relative",
      "width:720px",
      "height:240px",
      "margin:24px",
      "font-size:42px",
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
      throw new Error("Integration canary stage is incomplete.");
    }
    for (const root of [sourceRoot, targetRoot]) {
      root.style.cssText = [
        "position:absolute",
        "inset:0",
        "display:grid",
        "place-items:center"
      ].join(";");
    }
    materialLayer.style.cssText = "position:absolute;inset:0;pointer-events:none";
    sourceRoot.innerHTML = katexAdapter.renderSelectorAnnotatedLatexToHtml(
      sourceLatex
    );
    targetRoot.innerHTML = katexAdapter.renderSelectorAnnotatedLatexToHtml(
      targetLatex
    );

    const bindOwnership = (
      root: HTMLElement,
      annotated: typeof sourceLatex,
      objectId: string
    ) => {
      root.dataset["kpSemanticEntityId"] = objectId;
      root.dataset["kpPresentationGroupId"] = `${objectId}.root`;
      for (const annotation of annotated.annotations) {
        const element = root.querySelector<HTMLElement>(
          `[data-kp-motion-id="${CSS.escape(annotation.motionId)}"]`
        );
        if (element === null) {
          throw new Error(`Missing annotated paint ${annotation.selectorId}.`);
        }
        element.dataset["kpSemanticEntityId"] = annotation.selectorId;
        element.dataset["kpPresentationGroupId"] = annotation.selectorId;
      }
      for (const attribute of [
        "data-kp-antiderivative-integrand-scope",
        "data-kp-antiderivative-differential-binding",
        "data-kp-antiderivative-exact-quotient",
        "data-kp-antiderivative-integration-constant"
      ]) {
        for (const element of root.querySelectorAll<HTMLElement>(
          `[${attribute}]`
        )) {
          const entityId = element.getAttribute(attribute);
          if (entityId === null) continue;
          element.dataset["kpSemanticEntityId"] = entityId;
          element.dataset["kpPresentationGroupId"] = entityId;
        }
      }
    };
    bindOwnership(sourceRoot, sourceLatex, sourceObject.id);
    bindOwnership(targetRoot, targetLatex, targetObject.id);

    const fontReadiness = fontModule.createKpEquationFontReadiness(document);
    const [source, target] = await Promise.all([
      observedScene.settleAndObserveKpNativeKatexRenderedScene({
        endpoint: "source",
        stage,
        root: sourceRoot,
        semanticEntityId: sourceObject.id,
        presentationGroupId: `${sourceObject.id}.root`,
        fontReadiness
      }),
      observedScene.settleAndObserveKpNativeKatexRenderedScene({
        endpoint: "target",
        stage,
        root: targetRoot,
        semanticEntityId: targetObject.id,
        presentationGroupId: `${targetObject.id}.root`,
        fontReadiness
      })
    ]);
    const semanticPlan =
      transit.createKpAntiderivativePowerNativeKatexTransitPlan(animation);
    const rendererPlan =
      transit.compileKpAntiderivativePowerNativeKatexScenePlan({
        plan: semanticPlan,
        source,
        target
      });
    const session = compositor.createKpCanonicalNativeKatexSceneSession(
      rendererPlan
    );

    const ownership = [0, 0.001, 0.5, 0.9, 0.999, 1].map((progress) => {
      const frame = session.session.apply(progress);
      const visibleMaterialOwnerIds = [
        ...stage.querySelectorAll<HTMLElement>(
          "[data-kp-equation-material-owner-id]"
        )
      ].filter((owner) => Number(getComputedStyle(owner).opacity) > 0)
        .map((owner) => owner.dataset["kpEquationMaterialOwnerId"] ?? "");
      return {
        progress,
        visualOwner: frame.visualOwner,
        nativeOpacityTotal:
          Number(getComputedStyle(sourceRoot).opacity) +
          Number(getComputedStyle(targetRoot).opacity),
        materialVisible: visibleMaterialOwnerIds.length > 0,
        visibleMaterialOwnerIds
      };
    });

    session.session.apply(0.001);
    const sourceAtoms = new Map(source.atoms.map((atom) => [atom.id, atom]));
    const sourceSeamResiduals = rendererPlan.handoffCorrelations
      .filter(({ sourceAtomId }) =>
        sourceAtomId !== undefined && sourceAtoms.has(sourceAtomId)
      )
      .map((correlation) => {
        const nativeSource = sourceAtoms.get(correlation.sourceAtomId!);
        const owner = stage.querySelector<HTMLElement>(
          `[data-kp-equation-material-owner-id="${
            CSS.escape(correlation.materialOwnerId)
          }"]`
        );
        const material = owner?.firstElementChild;
        if (
          nativeSource === undefined ||
          !(material instanceof HTMLElement)
        ) {
          throw new Error(
            `Missing source-seam paint for ${correlation.materialOwnerId}.`
          );
        }
        const nativeRect = paintGeometry.measureKpNativeKatexSubtreePaintRect(
          stage,
          nativeSource.sourceElement
        );
        const materialRect = paintGeometry.measureKpNativeKatexSubtreePaintRect(
          stage,
          material
        );
        if (nativeRect === undefined || materialRect === undefined) {
          throw new Error(
            `Unmeasurable source-seam paint ${correlation.materialOwnerId}.`
          );
        }
        const nativeBaseline = paintGeometry.measureKpNativeKatexBaselineY(
          stage,
          nativeSource.sourceElement
        );
        const materialBaseline = paintGeometry.measureKpNativeKatexBaselineY(
          stage,
          material
        );
        return {
          id: correlation.id,
          rect: Math.max(
            Math.abs(nativeRect.left - materialRect.left),
            Math.abs(nativeRect.top - materialRect.top),
            Math.abs(nativeRect.width - materialRect.width),
            Math.abs(nativeRect.height - materialRect.height)
          ),
          baseline: Math.abs(nativeBaseline - materialBaseline),
          paintMatches: nativeSource.sourceElement.textContent ===
            material.textContent,
          styleMatches: nativeSource.styleFingerprint ===
            observedScene.fingerprintKpNativeKatexPaintStyle(
              getComputedStyle(material)
            )
        };
      });
    const targetSeam = compositor.traceKpNativeKatexHandoffOwnership({
      stage,
      playback: session.session,
      reconciliation: session.reconciliation,
      correlations: rendererPlan.handoffCorrelations,
      progresses: [0.999],
      fontRevision: target.fontRevision,
      viewportKey: target.viewportKey
    })[0]!;
    const targetAtoms = new Map(target.atoms.map((atom) => [atom.id, atom]));
    const targetSeamResiduals = rendererPlan.handoffCorrelations
      .filter(({ targetAtomId }) =>
        targetAtomId !== undefined && targetAtoms.has(targetAtomId)
      )
      .map((correlation) => {
        const nativeTarget = targetAtoms.get(correlation.targetAtomId!);
        const owner = stage.querySelector<HTMLElement>(
          `[data-kp-equation-material-owner-id="${
            CSS.escape(correlation.materialOwnerId)
          }"]`
        );
        const material = owner?.firstElementChild;
        if (
          nativeTarget === undefined ||
          !(material instanceof HTMLElement)
        ) {
          throw new Error(
            `Missing target-seam paint for ${correlation.materialOwnerId}.`
          );
        }
        const nativeRect = paintGeometry.measureKpNativeKatexSubtreePaintRect(
          stage,
          nativeTarget.sourceElement
        );
        const materialRect = paintGeometry.measureKpNativeKatexSubtreePaintRect(
          stage,
          material
        );
        if (nativeRect === undefined || materialRect === undefined) {
          throw new Error(
            `Unmeasurable target-seam paint ${correlation.materialOwnerId}.`
          );
        }
        const isGlyph = nativeTarget.paintKind === "glyph";
        return {
          id: correlation.id,
          paintKind: nativeTarget.paintKind,
          rect: Math.max(
            Math.abs(nativeRect.left - materialRect.left),
            Math.abs(nativeRect.top - materialRect.top),
            Math.abs(nativeRect.width - materialRect.width),
            Math.abs(nativeRect.height - materialRect.height)
          ),
          baseline: isGlyph
            ? Math.abs(
                paintGeometry.measureKpNativeKatexBaselineY(
                  stage,
                  nativeTarget.sourceElement
                ) - paintGeometry.measureKpNativeKatexBaselineY(stage, material)
              )
            : 0,
          paintMatches: nativeTarget.sourceElement.textContent ===
            material.textContent,
          styleMatches: nativeTarget.styleFingerprint ===
            observedScene.fingerprintKpNativeKatexPaintStyle(
              getComputedStyle(material)
            )
        };
      });

    session.session.apply(0.9);
    const targetEntityByAtomId = new Map(target.atoms.map((atom) => [
      atom.id,
      atom.semanticEntityId
    ]));
    const visibleIntroductions = new Set([
      ...stage.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )
    ].filter((owner) => Number(getComputedStyle(owner).opacity) > 0)
      .map((owner) => targetEntityByAtomId.get(
        owner.dataset["kpEquationMaterialEndpointPaintAtomId"] ?? ""
      ))
      .filter((id): id is string => id !== undefined));
    const lifecycleCount = (
      lifecycle: "persist" | "split" | "introduce" | "eliminate"
    ) => session.reconciliation.dispositions.filter((candidate) =>
      candidate.lifecycle === lifecycle
    ).length;
    const lifecycleCounts = {
      persist: lifecycleCount("persist"),
      split: lifecycleCount("split"),
      introduce: lifecycleCount("introduce"),
      eliminate: lifecycleCount("eliminate")
    };
    const output = {
      mode: session.session.mode,
      mechanismId: semanticPlan.mechanismId,
      lifecycleCounts,
      splitTargetCount: session.reconciliation.dispositions
        .filter(({ lifecycle }) => lifecycle === "split")
        .reduce((count, disposition) =>
          count + disposition.targetAtomIds.length, 0),
      ownership,
      sourceSeamResiduals,
      targetSeam: {
        visualOwner: targetSeam.visualOwner,
        glyphStyleMismatchIds: targetSeam.glyphStyleMismatchIds
      },
      targetSeamResiduals,
      missingVisibleIntroductions:
        semanticPlan.introducedTargetSemanticEntityIds.filter((id) =>
          !visibleIntroductions.has(id)
        ),
      sourceText: sourceRoot.textContent?.replace(/\s+/gu, "") ?? "",
      targetText: targetRoot.textContent?.replace(/\s+/gu, "") ?? ""
    };
    session.session.retire({
      kind: "native-katex-paint-preserving-retirement",
      reason: "surface-disposed",
      structuralSuccession: "retire-preserving-paint"
    });
    fontReadiness.dispose();
    return output;
  }, animationId);

  expect(result.mode).toBe("atom-transit");
  expect(result.mechanismId).toBe(
    "kp.rendering.native-katex.antiderivative-power-material-transit.v1"
  );
  expect(result.lifecycleCounts.persist).toBeGreaterThan(0);
  expect(result.lifecycleCounts.split).toBe(1);
  expect(result.splitTargetCount).toBe(2);
  expect(result.lifecycleCounts.introduce).toBeGreaterThanOrEqual(7);
  expect(result.lifecycleCounts.eliminate).toBeGreaterThanOrEqual(3);
  expect(result.ownership.map(({ visualOwner }) => visualOwner)).toEqual([
    "source-native",
    "material-scene",
    "material-scene",
    "material-scene",
    "material-scene",
    "target-native"
  ]);
  for (const frame of result.ownership) {
    expect(
      frame.nativeOpacityTotal + Number(frame.materialVisible),
      `exclusive paint ownership at ${frame.progress}`
    ).toBe(1);
    expect(new Set(frame.visibleMaterialOwnerIds).size).toBe(
      frame.visibleMaterialOwnerIds.length
    );
  }
  expect(result.sourceSeamResiduals.length).toBeGreaterThan(0);
  expect(
    Math.max(...result.sourceSeamResiduals.map(({ rect }) => rect)),
    JSON.stringify(result.sourceSeamResiduals)
  )
    .toBeLessThanOrEqual(0.25);
  expect(Math.max(...result.sourceSeamResiduals.map(({ baseline }) => baseline)))
    .toBeLessThanOrEqual(0.25);
  expect(
    result.sourceSeamResiduals.every(({ paintMatches }) => paintMatches),
    JSON.stringify(result.sourceSeamResiduals)
  ).toBe(true);
  expect(result.targetSeam.visualOwner).toBe("material-scene");
  expect(result.targetSeam.glyphStyleMismatchIds).toEqual([]);
  expect(
    Math.max(...result.targetSeamResiduals.map(({ rect }) => rect)),
    JSON.stringify(result.targetSeamResiduals)
  ).toBeLessThanOrEqual(0.25);
  expect(Math.max(...result.targetSeamResiduals.map(({ baseline }) => baseline)))
    .toBeLessThanOrEqual(0.25);
  expect(result.targetSeamResiduals.every(({ paintMatches, styleMatches }) =>
    paintMatches && styleMatches
  )).toBe(true);
  expect(result.targetSeamResiduals.some(({ paintKind }) =>
    paintKind === "rule"
  )).toBe(true);
  expect(result.missingVisibleIntroductions).toEqual([]);
  expect(result.sourceText).toContain("∫x2dx");
  expect(result.targetText).toContain("x");
  expect(result.targetText).toContain("+C");
  expect(result.targetText.match(/2\+1/gu)).toHaveLength(2);
});
