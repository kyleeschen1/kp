import {
  expect,
  test,
  type Browser,
  type Page
} from "@playwright/test";

const articleRoute = "/tutorials/algebra/fraction-composition/";
const readerRoute = "/reader/fraction-composition/";
const firstRangeEnd = 2 / 13;
const localSamples = [0, 0.2, 0.5, 0.8, 1] as const;

for (const viewport of [
  { name: "wide", width: 1_100, height: 800 },
  { name: "phone", width: 390, height: 844 }
] as const) {
  for (const theme of ["light", "dark"] as const) {
    test(`Article and reader share canonical sampled frames · ${viewport.name} · ${theme}`, async ({
      browser
    }) => {
      const context = await browser.newContext({ viewport });
      const reader = await context.newPage();
      const article = await context.newPage();
      const themeQuery = `?kpTheme=${theme}`;
      await Promise.all([
        reader.goto(`${readerRoute}${themeQuery}`, {
          waitUntil: "domcontentloaded"
        }),
        article.goto(`${articleRoute}${themeQuery}`, {
          waitUntil: "domcontentloaded"
        })
      ]);
      await Promise.all([readyReader(reader), readyArticle(article)]);

      for (const localProgress of localSamples) {
        const globalProgress = firstRangeEnd * localProgress;
        await Promise.all([
          seekReader(reader, globalProgress),
          seekArticle(article, localProgress)
        ]);
        expect(await canonicalFrame(article, "article")).toEqual(
          await canonicalFrame(reader, "reader")
        );
      }
      await context.close();
    });
  }
}

async function readyReader(page: Page): Promise<void> {
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-hydrated",
    "true"
  );
  await expect(page.locator("[data-kp-reader-equation-stage]"))
    .toHaveAttribute("data-kp-reader-canonical-equation-session-active", "true");
  await settle(page);
}

async function readyArticle(page: Page): Promise<void> {
  await expect(page.locator("[data-kp-algebra-stage-host]"))
    .toHaveAttribute("data-kp-algebra-canonical-host-status", "active");
  await settle(page);
}

async function seekReader(page: Page, globalProgress: number): Promise<void> {
  await page.locator("[data-kp-reader-attention-scrubber]").evaluate(
    (element, progress) => {
      const scrubber = element as HTMLInputElement;
      // The learner control is intentionally permille-quantized. Parity must
      // feed both hosts the same exact global sample, including 2/13 ranges.
      scrubber.step = "any";
      scrubber.value = String(progress * 1_000);
      scrubber.dispatchEvent(new Event("input", { bubbles: true }));
    },
    globalProgress
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    String(Math.round(globalProgress * 1_000))
  );
  await settle(page);
}

async function seekArticle(page: Page, localProgress: number): Promise<void> {
  const host = page.locator("[data-kp-algebra-stage-host]");
  await host.locator("[data-kp-algebra-range-scrubber]").evaluate(
    (element, progress) => {
      const scrubber = element as HTMLInputElement;
      scrubber.value = String(progress * 1_000);
      scrubber.dispatchEvent(new Event("input", { bubbles: true }));
    },
    localProgress
  );
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-global-progress",
    String(Math.round(firstRangeEnd * localProgress * 1_000))
  );
  await settle(page);
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
  });
}

async function canonicalFrame(
  page: Page,
  host: "article" | "reader"
) {
  const selector = host === "article"
    ? '[data-kp-algebra-live-surface] [data-kp-reader-equation-stage]'
    : "[data-kp-reader-equation-stage]";
  return page.locator(selector).evaluate((stage) => {
    const root = stage as HTMLElement;
    const active = root.querySelector<HTMLElement>(
      '[data-kp-reader-transition-active="true"]'
    );
    const fit = active?.querySelector<HTMLElement>(
      "[data-kp-reader-fit-surface]"
    );
    const source = active?.querySelector<HTMLElement>(
      '[data-kp-reader-native="source"]'
    );
    const target = active?.querySelector<HTMLElement>(
      '[data-kp-reader-native="target"]'
    );
    if (active === undefined || active === null || fit === undefined ||
        fit === null || source === undefined || source === null ||
        target === undefined || target === null) {
      throw new Error("Canonical parity requires one complete active frame.");
    }
    const effectiveOpacity = (element: HTMLElement): number => {
      let opacity = 1;
      let current: HTMLElement | null = element;
      while (current !== null && current !== root) {
        const style = getComputedStyle(current);
        if (style.display === "none" || style.visibility === "hidden") return 0;
        opacity *= Number(style.opacity);
        current = current.parentElement;
      }
      return Math.round(opacity * 1_000_000) / 1_000_000;
    };
    const material = [
      ...root.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id], " +
        "[data-kp-reader-equation-material-owner-id]"
      )
    ].map((element) => ({
      id: element.dataset["kpEquationMaterialOwnerId"] ??
        element.dataset["kpReaderEquationMaterialOwnerId"] ?? "",
      opacity: effectiveOpacity(element)
    })).sort((left, right) => left.id.localeCompare(right.id));
    const salience = [
      ...active.querySelectorAll<HTMLElement>(
        "[data-kp-fraction-salience-bound]"
      )
    ].map((element) => ({
      id: element.dataset["kpReaderSelectorId"] ?? "",
      role: element.dataset["kpSemanticVisualRole"],
      level: element.dataset["kpSemanticSalienceLevel"],
      family: element.dataset["kpSemanticIdentityFamily"],
      color: element.style.getPropertyValue("--kp-semantic-salience-color"),
      opacity: element.style.getPropertyValue("--kp-semantic-salience-opacity"),
      stroke: element.style.getPropertyValue(
        "--kp-semantic-salience-stroke-scale"
      )
    })).sort((left, right) => left.id.localeCompare(right.id));
    const layout = [
      ...active.querySelectorAll<HTMLElement>(
        '[data-kp-equation-stage-layout-authority="applied-v1"]'
      )
    ].map((element) => ({
      id: element.dataset["kpReaderSelectorId"] ??
        element.dataset["kpFoldableEnvelopeId"] ??
        element.dataset["kpReaderEquationAnchorId"] ?? "",
      row: element.dataset["kpEquationStageLayoutRow"]
    })).sort((left, right) => left.id.localeCompare(right.id));
    const sourceOpacity = effectiveOpacity(source);
    const targetOpacity = effectiveOpacity(target);
    const visibleMaterial = material.filter(({ opacity }) => opacity > 0.01);
    return {
      reviewFrame: JSON.parse(
        root.dataset["kpReaderCanonicalReviewFrame"] ?? "[]"
      ),
      transition: active.dataset["kpReaderTransition"],
      operationChoreography:
        fit.dataset["kpNativeKatexOperationChoreography"],
      layoutPolicy: root.dataset["kpReaderCanonicalLayoutPolicy"],
      layout,
      fitStatus: root.dataset["kpReaderCanonicalFitStatus"],
      salienceScene: JSON.parse(
        root.dataset["kpReaderSemanticSalienceScene"] ?? "{}"
      ),
      salience,
      accessibleState: root.dataset["kpReaderAccessibleEquationState"],
      nativeEndpoint: root.dataset["kpReaderNativeEndpoint"] ?? null,
      nativeEndpointPassed:
        root.dataset["kpReaderNativeEndpointPassed"] ?? null,
      motionAuthority: root.dataset["kpReaderMotionAuthority"],
      canonicalPaintOwner: root.dataset["kpReaderCanonicalPaintOwner"],
      activeSessionCount: root.querySelectorAll(
        '[data-kp-reader-canonical-equation-session="active"]'
      ).length,
      materialLayerCount: root.querySelectorAll(
        ".kp-reader-canonical-equation-session-material"
      ).length,
      paint: {
        sourceOpacity,
        targetOpacity,
        material,
        visualAuthorityCount:
          Number(sourceOpacity > 0.01) +
          Number(targetOpacity > 0.01) +
          Number(visibleMaterial.length > 0)
      }
    };
  });
}
