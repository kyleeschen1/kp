import { expect, test, type Locator } from "@playwright/test";

const animationId = "animation.equation.logarithm-change-of-base.v1";

test("change-of-base mounts one native compositor and seeks deterministically", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`/?artifact=${animationId}&playhead=0`);
  const player = page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const slot = player.locator(
    '[data-kp-editor-animation-surface-slot="equation"]'
  );
  const stage = slot.locator("[data-kp-logarithm-change-of-base-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');

  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.logarithm-change-of-base.canonical-native-katex"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-logarithm-change-of-base-stage",
    "ready"
  );
  await expect(stage.locator(
    ".kp-logarithm-change-of-base-stage__endpoint"
  )).toHaveCount(2);
  await expect(stage.locator(
    '[data-kp-semantic-entity-id="target.natural-log-quotient.division"].frac-line'
  )).toHaveCount(1);

  const summary = JSON.parse(
    await stage.getAttribute("data-kp-logarithm-change-of-base-track-summary") ??
      "[]"
  ) as Array<{
    lifecycle: string;
    sourceEntityId?: string;
    targetEntityId?: string;
    timingGroupId?: string;
    metricInterpolation?: string;
  }>;
  expect(summary.some(({ lifecycle, sourceEntityId, targetEntityId }) =>
    lifecycle === "persist" &&
    sourceEntityId === "source.log-base-two.argument-seven" &&
    targetEntityId === "target.numerator.argument-seven"
  )).toBe(true);
  expect(summary.some(({ lifecycle, sourceEntityId, targetEntityId }) =>
    lifecycle === "persist" &&
    sourceEntityId === "source.log-base-two.base" &&
    targetEntityId === "target.denominator.argument-two"
  )).toBe(true);
  expect(summary.some(({ lifecycle, targetEntityId, timingGroupId }) =>
    lifecycle === "introduce" &&
    targetEntityId === "target.natural-log-quotient.division" &&
    timingGroupId?.includes("fraction-rule") === true
  )).toBe(true);
  expect(summary.some(({ lifecycle, sourceEntityId, timingGroupId }) =>
    lifecycle === "eliminate" &&
    sourceEntityId === "source.log-base-two.operator" &&
    timingGroupId === "timing.logarithm-change-of-base.operator-handoff"
  )).toBe(true);
  await expect(stage.locator('[data-kp-semantic-entity-id$=".open"], ' +
    '[data-kp-semantic-entity-id$=".close"]')).toHaveCount(0);
  expect(summary.filter(({ lifecycle, metricInterpolation }) =>
    lifecycle === "persist" &&
    metricInterpolation === "semantic-role-change"
  )).toHaveLength(2);

  const sourceBase = stage.locator(
    '[data-kp-semantic-entity-id="source.log-base-two.base"]'
  );
  const targetArgument = stage.locator(
    '[data-kp-semantic-entity-id="target.denominator.argument-two"]'
  );
  const sourceInk = await measureNativeKatexInk(sourceBase, false);
  const targetInk = await measureNativeKatexInk(targetArgument, false);
  expect(targetInk.height).toBeGreaterThan(sourceInk.height + 1);
  const roleChangeInk: Array<{ width: number; height: number }> = [];
  for (const progress of [0.22, 0.5, 0.78, 0.999]) {
    await seek.fill(String(progress));
    const owner = stage.locator(
      '[data-kp-equation-material-semantic-entity-id="source.log-base-two.base"]'
    );
    await expect(owner).toHaveCount(1);
    await expect(owner).toHaveAttribute(
      "data-kp-native-katex-typography-model",
      "target-style-reverse-flip"
    );
    await expect(owner).toHaveAttribute(
      "data-kp-equation-material-visual-revision",
      /target:/
    );
    roleChangeInk.push(await measureNativeKatexInk(owner, true));
  }
  expect(Math.abs(roleChangeInk[0]!.height - sourceInk.height)).toBeLessThan(0.4);
  expect(roleChangeInk[1]!.height).toBeGreaterThan(roleChangeInk[0]!.height + 1);
  expect(roleChangeInk[1]!.height).toBeLessThan(roleChangeInk[2]!.height - 1);
  expect(Math.abs(roleChangeInk[2]!.height - targetInk.height)).toBeLessThan(0.4);
  expect(Math.abs(roleChangeInk[3]!.height - targetInk.height)).toBeLessThan(0.4);
  expect(Math.abs(roleChangeInk[3]!.width - targetInk.width)).toBeLessThan(0.4);

  for (const progress of [0, 0.25, 0.5, 0.75, 1, 0.625, 0]) {
    await seek.fill(String(progress));
    await expect(stage).toHaveAttribute(
      "data-kp-logarithm-change-of-base-progress",
      String(progress)
    );
    await expectExclusiveOwner(stage);
  }
  expect(pageErrors).toEqual([]);
});

async function measureNativeKatexInk(
  locator: Locator,
  useFirstChild: boolean
): Promise<{ width: number; height: number }> {
  return locator.evaluate(async (element, firstChild) => {
    const modulePath = "/src/rendering/native-katex-paint-geometry.ts";
    const geometry = await import(modulePath);
    const stage = element.closest<HTMLElement>(
      "[data-kp-logarithm-change-of-base-stage]"
    );
    const root = firstChild ? element.firstElementChild : element;
    if (stage === null || !(root instanceof HTMLElement)) {
      throw new Error("Change-of-base ink probe could not find native paint.");
    }
    const rect = geometry.measureKpNativeKatexSubtreePaintRect(stage, root);
    if (rect === undefined) {
      throw new Error("Change-of-base ink probe found no painted geometry.");
    }
    return { width: rect.width, height: rect.height };
  }, useFirstChild);
}

test("change-of-base URL restores direct semantic playhead", async ({ page }) => {
  await page.goto(`/?artifact=${animationId}&playhead=0.625`);
  const stage = page.locator(
    `[data-kp-editor-animation-id="${animationId}"] ` +
    "[data-kp-logarithm-change-of-base-stage]"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-logarithm-change-of-base-stage",
    "ready"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-logarithm-change-of-base-progress",
    "0.625"
  );
  await expectExclusiveOwner(stage);
});

test("accepted choreography survives multi-glyph base and argument paint", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}&playhead=0`);
  const result = await page.evaluate(async () => {
    const paths = {
      corpus: "/src/semantic/logarithm-change-of-base-corpus.ts",
      semantic: "/src/semantic/logarithm-change-of-base.ts",
      endpoints:
        "/src/rendering/logarithm-change-of-base-native-endpoints.ts",
      transit: "/src/rendering/logarithm-change-of-base-transit-session.ts",
      fonts: "/src/rendering/equation-font-readiness.ts",
      geometry: "/src/rendering/native-katex-paint-geometry.ts"
    };
    const [corpus, semanticApi, endpointApi, transitApi, fontApi, geometry] =
      await Promise.all([
        import(paths.corpus),
        import(paths.semantic),
        import(paths.endpoints),
        import(paths.transit),
        import(paths.fonts),
        import(paths.geometry)
      ]);
    const fixture = corpus.kpLogarithmChangeOfBaseCorpus.cases.find(
      ({ id }: { id: string }) => id.endsWith("ten-hundred")
    );
    if (fixture === undefined) throw new Error("Missing pressure fixture.");
    const semantic = semanticApi.verifyKpLogarithmChangeOfBase(fixture.draft);
    const endpoints = endpointApi.createKpLogarithmChangeOfBaseNativeEndpoints(
      semantic
    );
    const stage = document.createElement("section");
    stage.className = "kp-logarithm-change-of-base-stage";
    stage.style.cssText =
      "position:fixed;left:0;top:0;width:800px;height:480px;contain:layout paint";
    const roots = endpoints.map((endpoint: typeof endpoints[number]) => {
      const root = document.createElement("div");
      root.className = "kp-logarithm-change-of-base-stage__endpoint";
      root.innerHTML = endpoint.nativeHtmlAndMathml;
      stage.append(root);
      return root;
    });
    const layer = document.createElement("div");
    layer.className = "kp-logarithm-change-of-base-stage__material-layer";
    layer.dataset["kpEditorEquationMaterialLayer"] = "true";
    stage.append(layer);
    document.body.append(stage);
    // This synthetic caller bypasses the catalogue's font reservation. Load
    // the exact native math faces before granting measurement authority.
    await Promise.all([
      document.fonts.load("40px KaTeX_Main", "100"),
      document.fonts.load("40px KaTeX_Math", "x")
    ]);
    await document.fonts.ready;
    const fontReadiness = fontApi.createKpEquationFontReadiness(document);
    try {
      const source = await endpointApi
        .settleAndObserveKpLogarithmChangeOfBaseNativeEndpoint({
          endpointSide: "source",
          stage,
          root: roots[0]!,
          endpoint: endpoints[0],
          fontReadiness
        });
      const target = await endpointApi
        .settleAndObserveKpLogarithmChangeOfBaseNativeEndpoint({
          endpointSide: "target",
          stage,
          root: roots[1]!,
          endpoint: endpoints[1],
          fontReadiness
        });
      const session = transitApi.createKpLogarithmChangeOfBaseTransitSession({
        source,
        target,
        semantic
      });
      const ink = (root: HTMLElement) => {
        const rect = geometry.measureKpNativeKatexSubtreePaintRect(stage, root);
        if (rect === undefined) throw new Error("Pressure fixture has no ink.");
        return { width: rect.width, height: rect.height };
      };
      const sourceBase = roots[0]!.querySelector(
        `[data-kp-semantic-entity-id="${semantic.source.base.entityId}"]`
      ) as HTMLElement | null;
      const targetBase = roots[1]!.querySelector(
        `[data-kp-semantic-entity-id="${
          semantic.target.denominator.argument.entityId
        }"]`
      ) as HTMLElement | null;
      if (sourceBase === null || targetBase === null) {
        throw new Error("Pressure fixture lost semantic base ownership.");
      }
      const sourceInk = ink(sourceBase);
      const targetInk = ink(targetBase);
      const samples = [0.22, 0.5, 0.78, 0.999].map((progress) => {
        session.apply(progress);
        const owner = stage.querySelector<HTMLElement>(
          `[data-kp-equation-material-semantic-entity-id="${
            semantic.source.base.entityId
          }"]`
        );
        if (owner?.firstElementChild instanceof HTMLElement) {
          return {
            ...ink(owner.firstElementChild),
            model: owner.dataset["kpNativeKatexTypographyModel"]
          };
        }
        throw new Error("Pressure fixture lost moving base paint.");
      });
      const reverse = [1, 0.5, 0].map((progress) =>
        session.apply(progress).visualOwner);
      session.retire();
      return {
        latex: endpoints.map((endpoint: typeof endpoints[number]) =>
          endpoint.annotated.rawLatex),
        sourceInk,
        targetInk,
        samples,
        reverse
      };
    } finally {
      fontReadiness.dispose();
      stage.remove();
    }
  });

  expect(result.latex).toEqual([
    "\\log_{10} 100",
    "\\frac{\\ln 100}{\\ln 10}"
  ]);
  expect(result.samples.every(({ model }) =>
    model === "target-style-reverse-flip"
  )).toBe(true);
  expect(Math.abs(result.samples[0]!.height - result.sourceInk.height))
    .toBeLessThan(0.4);
  expect(result.samples[1]!.height).toBeGreaterThan(
    result.samples[0]!.height + 1
  );
  expect(Math.abs(result.samples[2]!.height - result.targetInk.height))
    .toBeLessThan(0.4);
  expect(Math.abs(result.samples[3]!.width - result.targetInk.width))
    .toBeLessThan(0.4);
  expect(result.reverse).toEqual([
    "target-native",
    "material-scene",
    "source-native"
  ]);
});

async function expectExclusiveOwner(stage: Locator): Promise<void> {
  await expect.poll(async () => stage.evaluate((root) => {
    const endpointOpacities = [...root.querySelectorAll<HTMLElement>(
      ".kp-logarithm-change-of-base-stage__endpoint"
    )].map((element) => Number(getComputedStyle(element).opacity));
    const material = root.querySelector<HTMLElement>(
      "[data-kp-editor-equation-material-layer]"
    );
    const visibleMaterial = material === null ? false :
      [...material.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )].some((element) => Number(getComputedStyle(element).opacity) > 0);
    return endpointOpacities.filter((opacity) => opacity > 0).length +
      (visibleMaterial ? 1 : 0);
  })).toBe(1);
}
