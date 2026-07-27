import { expect, test, type Page } from "@playwright/test";

const route = (
  progressPermille: number,
  additions: Record<string, string> = {}
) => {
  const parameters = new URLSearchParams({
    kpLesson: "lesson.algebra.foldable-distribution",
    kpVersion: "1",
    kpProgress: String(progressPermille),
    kpMotion: "full",
    kpProfile: "standard",
    ...additions
  });
  return `/reader/foldable-distribution/?${parameters}`;
};

async function visibleXPaint(page: Page) {
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-hydrated",
    "true"
  );
  return page.locator(
    "[data-kp-reader-transition-active='true']"
  ).evaluate(async (transition) => {
    const geometryModule =
      "/src/rendering/native-katex-paint-geometry.ts";
    const { measureKpNativeKatexSubtreePaintRect } =
      await import(geometryModule);
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-reader-equation-viewport]"
    );
    if (stage === null) throw new Error("Visible x paint lacks its viewport.");
    const observations: Array<{
      owner: string;
      top: number;
      bottom: number;
      height: number;
    }> = [];
    for (const root of transition.querySelectorAll<HTMLElement>(
      "[data-kp-reader-native]"
    )) {
      if (Number(getComputedStyle(root).opacity) <= 0.01) continue;
      for (const anchor of root.querySelectorAll<HTMLElement>(
        "[data-kp-reader-selector-id$='.x']"
      )) {
        const rect = measureKpNativeKatexSubtreePaintRect(stage, anchor);
        if (rect === undefined) continue;
        observations.push({
          owner: `native:${anchor.dataset["kpReaderSelectorId"]}`,
          top: rect.top,
          bottom: rect.top + rect.height,
          height: rect.height
        });
      }
    }
    for (const owner of document.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )) {
      if (
        Number(getComputedStyle(owner).opacity) <= 0.01 ||
        owner.textContent?.trim() !== "x"
      ) {
        continue;
      }
      const visual = owner.firstElementChild as HTMLElement | null;
      const rect = visual === null
        ? undefined
        : measureKpNativeKatexSubtreePaintRect(stage, visual);
      if (rect === undefined) continue;
      observations.push({
        owner: `material:${owner.dataset["kpEquationMaterialOwnerId"]}`,
        top: rect.top,
        bottom: rect.top + rect.height,
        height: rect.height
      });
    }
    return {
      transition: transition.getAttribute("data-kp-reader-transition"),
      observations
    };
  });
}

test("fold controls preserve one semantic clock and stable URL state", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_100, height: 800 });
  await page.goto(route(300), { waitUntil: "domcontentloaded" });
  const body = page.locator("body");
  const stage = page.locator("[data-kp-reader-equation-stage]");
  const mode = page.getByLabel("Evaluation detail", { exact: true });

  await expect(body).toHaveAttribute("data-kp-reader-hydrated", "true");
  await expect(stage).toHaveAttribute("data-kp-reader-fold-mode", "automatic");
  await expect(stage).toHaveAttribute("data-kp-reader-fold-total-beats", "78");

  await mode.focus();
  await mode.selectOption("expanded");
  await expect(mode).toHaveValue("expanded");
  await mode.selectOption("collapsed");
  await expect(stage).toHaveAttribute("data-kp-reader-fold-mode", "collapsed");
  await expect(stage).toHaveAttribute("data-kp-reader-fold-total-beats", "60");
  await expect(mode).toHaveAttribute(
    "aria-describedby",
    "kp-reader-fold-status"
  );
  await expect(page.locator("#kp-reader-fold-status")).toContainText("Folded:");
  await expect(page.locator("#kp-reader-fold-status")).toContainText(
    "operations"
  );
  await expect.poll(() =>
    new URL(page.url()).searchParams.get("kpFoldMode")
  ).toBe("collapsed");
  expect(new URL(page.url()).searchParams.getAll("kpFold")).toHaveLength(2);

  const distribution = page.getByRole("button", { name: "Distribution" });
  await distribution.focus();
  await page.keyboard.press("Space");
  await expect(distribution).toHaveAttribute("aria-pressed", "true");
  await expect(mode).toHaveValue("pinned");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-fold-pinned",
    "evaluation.foldable-distribution.distribute"
  );
  await expect(stage).toHaveAttribute("data-kp-reader-fold-total-beats", "69");
  await expect.poll(() =>
    new URL(page.url()).searchParams.get("kpPin")
  ).toBe("evaluation.foldable-distribution.distribute");
});

test("parallel distribution and product work each render as one complete cohort", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_100, height: 800 });
  await page.goto(route(140, { kpFoldMode: "expanded" }), {
    waitUntil: "domcontentloaded"
  });

  const body = page.locator("body");
  await expect(body).toHaveAttribute("data-kp-reader-hydrated", "true");
  await expect(body).toHaveAttribute("data-kp-reader-transition", /^cohort\./);
  await expect(
    page.locator(
      "[data-kp-reader-transition-active='true']" +
      "[data-kp-reader-cohort-transformations*=',']"
    )
  ).toHaveCount(1);
  const splitOwners = page.locator(
    '[data-kp-equation-material-owner-id*="factor-fans-out"]'
  );
  await expect.poll(() => splitOwners.count()).toBeGreaterThan(0);
  await expect(
    page.locator(
      "[data-kp-reader-transition-active='true'] [data-kp-reader-fit-surface]"
    )
  ).toHaveAttribute(
    "data-kp-native-katex-motion-profile",
    "canonical-copy-fan-out"
  );
  expect(await splitOwners.evaluateAll((owners) =>
    owners.every((owner) => getComputedStyle(owner).opacity === "1")
  )).toBe(true);
  const fanOutPaint = await splitOwners.evaluateAll(async (owners) => {
    const geometryModule =
      "/src/rendering/native-katex-paint-geometry.ts";
    const { measureKpNativeKatexSubtreePaintRect } =
      await import(geometryModule);
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-reader-equation-viewport]"
    );
    if (stage === null) throw new Error("Fan-out paint lacks its viewport.");
    const movingTops = owners.flatMap((owner) => {
      const visual = owner.firstElementChild as HTMLElement | null;
      const rect = visual === null
        ? undefined
        : measureKpNativeKatexSubtreePaintRect(stage, visual);
      return rect === undefined ? [] : [rect.top];
    });
    const endpointIds = new Set([
      "factored.left-factor",
      "factored.right-factor",
      "distribution.left.factor-3-x",
      "distribution.left.factor-3-constant",
      "distribution.right.factor-2-x",
      "distribution.right.factor-2-constant"
    ]);
    const endpointTops = [
      ...document.querySelectorAll<HTMLElement>(
        "[data-kp-reader-selector-id]"
      )
    ].flatMap((anchor) => {
      if (!endpointIds.has(anchor.dataset["kpReaderSelectorId"] ?? "")) {
        return [];
      }
      const rect = measureKpNativeKatexSubtreePaintRect(stage, anchor);
      return rect === undefined ? [] : [rect.top];
    });
    return { movingTops, endpointTops };
  });
  expect(fanOutPaint.movingTops.length).toBeGreaterThanOrEqual(4);
  expect(fanOutPaint.endpointTops.length).toBeGreaterThanOrEqual(6);
  expect(
    Math.min(...fanOutPaint.movingTops),
    JSON.stringify(fanOutPaint)
  ).toBeLessThan(Math.min(...fanOutPaint.endpointTops) - 1.5);

  await page.goto(route(340, { kpFoldMode: "expanded" }), {
    waitUntil: "domcontentloaded"
  });
  await expect(body).toHaveAttribute("data-kp-reader-transition", /^cohort\./);
  await expect(
    page.locator(
      "[data-kp-reader-transition-active='true']" +
      "[data-kp-reader-cohort-transformations*=',']"
    )
  ).toHaveCount(1);
  const productOwners = page.locator(
    '[data-kp-equation-material-owner-id*="native-scene-owner.successor."]'
  );
  await expect.poll(() => productOwners.count()).toBeGreaterThan(0);
  await expect(
    page.locator(
      "[data-kp-reader-transition-active='true'] [data-kp-reader-fit-surface]"
    )
  ).toHaveAttribute(
    "data-kp-native-katex-successor-synthesis-count",
    "2"
  );
  expect(await productOwners.evaluateAll((owners) => {
    const roles = owners.map(
      (owner) => owner.getAttribute("data-kp-equation-material-fragment-role")
    );
    return roles.some((role) => role === "successor-source:material-input") &&
      roles.some((role) => role === "successor-source:catalyst") &&
      roles.some((role) => role === "successor-target:result");
  })).toBe(true);
  expect(await productOwners.evaluateAll((owners) =>
    owners
      .filter((owner) =>
        owner.getAttribute("data-kp-equation-material-fragment-role")
          ?.startsWith("successor-source:")
      )
      .every((owner) => getComputedStyle(owner).opacity === "1")
  )).toBe(true);
  expect(await page.locator(
    "[data-kp-equation-material-owner-id]"
  ).evaluateAll((owners) => {
    const claimed = new Set([
      "distribution.left.factor-3-constant",
      "distribution.left.constant-2",
      "expression.foldable-distribution.distributed.operator.three-times-two",
      "distribution.right.factor-2-constant",
      "distribution.right.negative-one",
      "expression.foldable-distribution.distributed.operator.two-times-negative-one",
      "distributed.constant-6",
      "distributed.negative-2"
    ]);
    return owners
      .filter((owner) => claimed.has(
        owner.getAttribute(
          "data-kp-equation-material-semantic-entity-id"
        ) ?? ""
      ))
      .every((owner) =>
        owner.getAttribute("data-kp-equation-material-fragment-role")
          ?.startsWith("successor-")
      );
  })).toBe(true);
});

test("outline navigation lands on an exact native checkpoint, never intermediate paint", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_100, height: 800 });
  await page.goto(route(740, { kpFoldMode: "expanded" }), {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-hydrated",
    "true"
  );
  await page.locator(
    '.kp-lesson-toc a[href="#beat.distributed"]'
  ).click();

  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    "231"
  );
  await expect(page.locator(".kp-lesson-toc")).toHaveAttribute(
    "data-kp-toc-active-id",
    "beat.distributed"
  );
  expect(await page.locator(
    "[data-kp-equation-material-owner-id]"
  ).evaluateAll((owners) =>
    owners.every((owner) => Number(getComputedStyle(owner).opacity) === 0)
  )).toBe(true);
  await expect(
    page.locator(
      "[data-kp-reader-transition-active='true'] [data-kp-reader-native='source']"
    )
  ).toHaveCSS("opacity", "1");
});

test("persistent product terms translate as opaque paint through evaluation", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_100, height: 800 });
  const persistentEntityIds = new Set([
    "distribution.left.factor-3-x",
    "distribution.left.x",
    "distributed.term-3x",
    "distribution.right.factor-2-x",
    "distribution.right.x",
    "distributed.term-2x"
  ]);

  for (const progress of [300, 320, 340, 380, 420]) {
    await page.goto(route(progress, { kpFoldMode: "expanded" }), {
      waitUntil: "domcontentloaded"
    });
    await expect(page.locator("body")).toHaveAttribute(
      "data-kp-reader-transition",
      /^cohort\./
    );
    const observations = await page.locator(
      "[data-kp-equation-material-owner-id]"
    ).evaluateAll((owners, entityIds) => owners.flatMap((owner) => {
      const element = owner as HTMLElement;
      const semantic =
        element.dataset["kpEquationMaterialSemanticEntityId"] ?? "";
      if (!entityIds.includes(semantic)) return [];
      return [{
        ownerId: element.dataset["kpEquationMaterialOwnerId"],
        semantic,
        opacity: Number(getComputedStyle(element).opacity),
        text: element.textContent?.trim()
      }];
    }), [...persistentEntityIds]);

    expect(
      observations.length,
      JSON.stringify({ progress, observations })
    ).toBeGreaterThan(0);
    expect(
      observations.every(({ ownerId, opacity }) =>
        !ownerId?.includes(".eliminate.") &&
        !ownerId?.includes(".introduce.") &&
        opacity === 1
      ),
      JSON.stringify({ progress, observations })
    ).toBe(true);
  }
});

test("successor ownership survives direct seek, rewind, phone, and reduced motion", async ({
  page
}) => {
  const cases = [
    {
      width: 1_100,
      progress: 340,
      additions: { kpFoldMode: "expanded" }
    },
    {
      width: 390,
      progress: 400,
      additions: { kpFoldMode: "expanded" }
    },
    {
      width: 1_100,
      progress: 400,
      additions: { kpFoldMode: "expanded", kpMotion: "reduced" }
    }
  ] as const;

  for (const candidate of cases) {
    await page.setViewportSize({ width: candidate.width, height: 800 });
    await page.goto(route(candidate.progress, candidate.additions), {
      waitUntil: "domcontentloaded"
    });
    await expect(page.locator("body")).toHaveAttribute(
      "data-kp-reader-transition",
      /^cohort\./
    );
    await expect(
      page.locator(
        "[data-kp-reader-transition-active='true'] [data-kp-reader-fit-surface]"
      )
    ).toHaveAttribute(
      "data-kp-native-katex-successor-synthesis-count",
      "2"
    );
    const owners = page.locator(
      '[data-kp-equation-material-owner-id*="native-scene-owner.successor."]'
    );
    await expect.poll(() => owners.count()).toBeGreaterThan(0);
    expect(await owners.evaluateAll((elements) =>
      elements.every((element) =>
        element.getAttribute("data-kp-equation-material-fragment-role")
          ?.startsWith("successor-")
      )
    )).toBe(true);
    expect(await page.evaluate(async () => {
      const poolUrl = "/src/rendering/webgl-context-lease-pool.ts";
      const pool = await import(/* @vite-ignore */ poolUrl);
      return pool.inspectKpWebglContextLeasePool(document);
    })).toMatchObject({ active: 0, waiting: 0 });
    await expect(
      page.locator(
        "[data-kp-reader-transition-active='true'] " +
        "[data-kp-editor-equation-material-layer]"
      )
    ).toHaveCount(1);
    if (candidate.width === 390) {
      await expect(
        page.locator("[data-kp-reader-equation-stage]")
      ).toHaveAttribute(
        "data-kp-reader-fold-layout-policy",
        "semantic-two-row-stage"
      );
      expect(await page.evaluate(() =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
      )).toBeLessThanOrEqual(1);
    }
  }

  await page.setViewportSize({ width: 1_100, height: 800 });
  await page.goto(route(340, { kpFoldMode: "expanded" }), {
    waitUntil: "domcontentloaded"
  });
  const sampleSuccessors = () => page.locator(
    '[data-kp-equation-material-owner-id*="native-scene-owner.successor."]'
  ).evaluateAll((owners) => owners.map((owner) => {
    const element = owner as HTMLElement;
    return {
      semantic:
        element.dataset["kpEquationMaterialSemanticEntityId"],
      role: element.dataset["kpEquationMaterialFragmentRole"],
      text: element.textContent,
      left: element.style.left,
      top: element.style.top,
      width: element.style.width,
      height: element.style.height,
      opacity: element.style.opacity,
      transform: element.style.transform
    };
  }).sort((left, right) =>
    JSON.stringify(left).localeCompare(JSON.stringify(right))
  ));
  await expect.poll(() => page.locator(
    '[data-kp-equation-material-owner-id*="native-scene-owner.successor."]'
  ).count()).toBeGreaterThan(0);
  const forwardFrame = await sampleSuccessors();
  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  const seek = (value: number) => scrubber.evaluate((node, nextValue) => {
    const input = node as HTMLInputElement;
    input.value = String(nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
  await seek(450);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    "450"
  );
  await seek(340);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-playback-direction",
    "rewind"
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-transition",
    /^cohort\./
  );
  await expect(
    page.locator(
      "[data-kp-reader-transition-active='true'] [data-kp-reader-fit-surface]"
    )
  ).toHaveAttribute(
    "data-kp-native-katex-successor-synthesis-count",
    "2"
  );
  await expect.poll(() => page.locator(
    '[data-kp-equation-material-owner-id*="native-scene-owner.successor."]'
  ).count()).toBeGreaterThan(0);
  expect(await sampleSuccessors()).toEqual(forwardFrame);
});

test("one native MathML owner reports settled equation truth", async ({ page }) => {
  await page.setViewportSize({ width: 1_100, height: 800 });
  await page.goto(route(140, { kpFoldMode: "expanded" }), {
    waitUntil: "domcontentloaded"
  });

  const accessible = page.locator("[data-kp-reader-accessible-equation]");
  await expect(accessible).toHaveCount(1);
  await expect(
    accessible.locator("[data-kp-reader-accessible-equation-state]")
  ).toHaveCount(6);
  await expect(
    accessible.locator(
      "[data-kp-reader-accessible-equation-state]:not([hidden])"
    )
  ).toHaveCount(1);
  await expect(
    accessible.locator(
      "[data-kp-reader-accessible-equation-state]:not([hidden]) math"
    )
  ).toHaveCount(1);
  const measurements = page.locator("[data-kp-reader-equation-measurement]");
  await expect(measurements).toHaveCount(5);
  expect(await measurements.evaluateAll((elements) =>
    elements.every((element) => element.getAttribute("aria-hidden") === "true")
  )).toBe(true);
  await expect(page.locator("[data-kp-reader-equation-material-layer]")).toHaveAttribute(
    "aria-hidden",
    "true"
  );
  await expect(page.locator("[data-kp-reader-equation-stage]")).toHaveAttribute(
    "data-kp-reader-accessible-equation-state",
    "expression.foldable-distribution.factored"
  );

  await page.goto(route(1_000, { kpFoldMode: "collapsed" }), {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator("[data-kp-reader-equation-stage]")).toHaveAttribute(
    "data-kp-reader-accessible-equation-state",
    "expression.foldable-distribution.collected"
  );
});

test("no-JavaScript document exposes all six native static checkpoints", async ({
  browser
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(route(0), { waitUntil: "domcontentloaded" });

  await expect(page.locator("[data-kp-static-state]")).toHaveCount(6);
  await expect(page.locator("[data-kp-static-state] math")).toHaveCount(6);
  await expect(page.locator("[data-kp-reader-equation-stage]")).toHaveCount(0);
  await expect(page.locator("body")).toContainText("5x + 4");

  await context.close();
});

test("factoring and coefficient evaluation remain separate visual beats", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_100, height: 800 });
  await page.goto(route(740, { kpFoldMode: "expanded" }), {
    waitUntil: "domcontentloaded"
  });

  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-transition",
    "transform.foldable-distribution.factor-common-x"
  );
  await expect(
    page.locator(
      "[data-kp-reader-transition-active='true'] [data-kp-reader-native='target']"
    )
  ).toContainText("(3+2)x+(6−2)");

  const factoringPaintSamples = [];
  for (const progress of [650, 670, 740, 800, 820]) {
    await page.goto(route(progress, { kpFoldMode: "expanded" }), {
      waitUntil: "domcontentloaded"
    });
    await expect(page.locator("body")).toHaveAttribute(
      "data-kp-reader-transition",
      "transform.foldable-distribution.factor-common-x"
    );
    const baselineEvidence = await page.locator(
      "[data-kp-equation-material-owner-id]"
    ).evaluateAll(async (owners) => {
      const geometryModule =
        "/src/rendering/native-katex-paint-geometry.ts";
      const { measureKpNativeKatexSubtreePaintRect } =
        await import(geometryModule);
      const stage = document.querySelector<HTMLElement>(
        "[data-kp-reader-equation-viewport]"
      );
      if (stage === null) {
        throw new Error("Factoring paint lacks its equation viewport.");
      }
      const visible = owners.filter((owner) =>
        Number(getComputedStyle(owner).opacity) > 0.01
      );
      const glyphBaselines = visible.flatMap((owner) => {
        const glyph = [
          owner,
          ...owner.querySelectorAll<HTMLElement>("*")
        ].find((candidate) =>
          [...candidate.childNodes].some((node) =>
            node.nodeType === Node.TEXT_NODE &&
            (node.textContent?.trim() ?? "") !== ""
          )
        ) as HTMLElement | undefined;
        if (glyph === undefined) return [];
        const marker = document.createElement("span");
        marker.setAttribute("aria-hidden", "true");
        marker.style.cssText =
          "display:inline-block;width:0;height:0;padding:0;margin:0;" +
          "border:0;line-height:0;vertical-align:baseline";
        glyph.append(marker);
        const baseline = marker.getBoundingClientRect().top;
        marker.remove();
        return [{
          semantic:
            (owner as HTMLElement)
              .dataset["kpEquationMaterialSemanticEntityId"],
          text: glyph.textContent?.trim(),
          baseline
        }];
      });
      const xPaint = visible.filter((owner) =>
        owner.textContent?.trim() === "x"
      ).map((owner) => {
        const element = owner as HTMLElement;
        const visual = element.firstElementChild as HTMLElement | null;
        const rect = visual === null
          ? undefined
          : measureKpNativeKatexSubtreePaintRect(stage, visual);
        if (rect === undefined) {
          throw new Error(
            `Moving x ${element.dataset["kpEquationMaterialSemanticEntityId"]}` +
            " has no measured paint."
          );
        }
        return {
          semantic:
            element.dataset["kpEquationMaterialSemanticEntityId"],
          role: element.dataset["kpEquationMaterialFragmentRole"],
          top: rect.top,
          bottom: rect.top + rect.height,
          height: rect.height,
          inlineTop: element.style.top,
          inlineHeight: element.style.height,
          transform: element.style.transform
        };
      });
      const visiblePaint = visible.flatMap((owner) => {
        const element = owner as HTMLElement;
        const visual = element.firstElementChild as HTMLElement | null;
        const rect = visual === null
          ? undefined
          : measureKpNativeKatexSubtreePaintRect(stage, visual);
        return rect === undefined
          ? []
          : [{
              semantic:
                element.dataset["kpEquationMaterialSemanticEntityId"],
              text: element.textContent?.trim() ?? "",
              left: rect.left,
              top: rect.top,
              right: rect.left + rect.width,
              bottom: rect.top + rect.height
            }];
      });
      const nativeXPaint = [
        ...document.querySelectorAll<HTMLElement>(
          "[data-kp-reader-transition-active='true'] " +
          "[data-kp-reader-selector-id='grouped.x-from-left'], " +
          "[data-kp-reader-transition-active='true'] " +
          "[data-kp-reader-selector-id='grouped.x-from-right'], " +
          "[data-kp-reader-transition-active='true'] " +
          "[data-kp-reader-selector-id='coefficient-factored.x']"
        )
      ].map((anchor) => {
        const rect = measureKpNativeKatexSubtreePaintRect(stage, anchor);
        if (rect === undefined) {
          throw new Error(
            `Native x ${anchor.dataset["kpReaderSelectorId"]} has no paint.`
          );
        }
        return {
          selector: anchor.dataset["kpReaderSelectorId"],
          top: rect.top,
          bottom: rect.top + rect.height,
          height: rect.height
        };
      });
      if (xPaint.length === 0 || nativeXPaint.length !== 3) {
        throw new Error("Factoring paint lacks complete native x geometry.");
      }
      return {
        residual: Math.max(...xPaint.map(({ bottom }) =>
          Math.min(...nativeXPaint.map(({ bottom: nativeBottom }) =>
            Math.abs(bottom - nativeBottom)
          ))
        )),
        glyphBaselines,
        visiblePaint,
        xPaint,
        nativeXPaint
      };
    });
    factoringPaintSamples.push({
      progress,
      xNativeResidual: baselineEvidence.residual,
      baselines: baselineEvidence.glyphBaselines,
      visiblePaint: baselineEvidence.visiblePaint,
      observations: baselineEvidence.xPaint
    });
  }
  expect(
    Math.max(...factoringPaintSamples.map(({ xNativeResidual }) =>
      xNativeResidual
    )),
    JSON.stringify(factoringPaintSamples)
  ).toBeGreaterThanOrEqual(4);
  const persistentContextIds = new Set([
    "grouped.coefficients.plus",
    "grouped.coefficient-2",
    "grouped.coefficients.right-parenthesis"
  ]);
  const persistentContext = factoringPaintSamples.flatMap((sample) =>
    sample.visiblePaint
      .filter(({ semantic }) =>
        semantic !== undefined && persistentContextIds.has(semantic)
      )
      .map((observation) => ({ progress: sample.progress, ...observation }))
  );
  expect(
    persistentContext.length,
    JSON.stringify(persistentContext)
  ).toBe(factoringPaintSamples.length * persistentContextIds.size);
  for (const semantic of persistentContextIds) {
    const observations = persistentContext.filter((observation) =>
      observation.semantic === semantic
    );
    expect(
      Math.max(...observations.map(({ top }) => top)) -
        Math.min(...observations.map(({ top }) => top)),
      JSON.stringify({ semantic, observations })
    ).toBeLessThanOrEqual(0.75);
  }
  const crowding = factoringPaintSamples.flatMap((sample) => {
    const xPaint = sample.visiblePaint.filter(({ text }) => text === "x");
    const otherPaint = sample.visiblePaint.filter(({ text }) => text !== "x");
    return xPaint.flatMap((x) => otherPaint.flatMap((other) => {
      const width =
        Math.min(x.right, other.right) - Math.max(x.left, other.left);
      const height =
        Math.min(x.bottom, other.bottom) - Math.max(x.top, other.top);
      return width > 0.25 && height > 0.25
        ? [{ progress: sample.progress, x, other, width, height }]
        : [];
    }));
  });
  expect(crowding, JSON.stringify(crowding)).toEqual([]);
  const persistentContextBaselines = factoringPaintSamples.flatMap(
    ({ baselines }) => baselines.filter(({ semantic }) =>
      semantic !== undefined && persistentContextIds.has(semantic)
    ).map(({ baseline }) => baseline)
  );
  expect(
    Math.max(...persistentContextBaselines) -
      Math.min(...persistentContextBaselines),
    JSON.stringify(factoringPaintSamples)
  ).toBeLessThanOrEqual(0.75);

  await page.goto(route(900, { kpFoldMode: "expanded" }), {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-transition",
    "transform.foldable-distribution.collect-results"
  );
  await expect(
    page.locator(
      "[data-kp-reader-transition-active='true'] [data-kp-reader-native='source']"
    )
  ).toContainText("(3+2)x+(6−2)");

  const collectionSamples = [];
  for (const progress of [821, 825, 840, 880, 940, 999, 1_000]) {
    await page.goto(route(progress, { kpFoldMode: "expanded" }), {
      waitUntil: "domcontentloaded"
    });
    const paint = await visibleXPaint(page);
    expect(
      paint.observations.length,
      JSON.stringify({ progress, paint })
    ).toBeGreaterThan(0);
    collectionSamples.push({
      progress,
      transition: paint.transition,
      bottom:
        paint.observations.reduce((sum, observation) =>
          sum + observation.bottom, 0
        ) / paint.observations.length,
      observations: paint.observations
    });
  }
  const collectionBottoms = collectionSamples.map(({ bottom }) => bottom);
  expect(
    Math.max(...collectionBottoms) - Math.min(...collectionBottoms),
    JSON.stringify(collectionSamples)
  ).toBeLessThanOrEqual(0.75);
});

test("number collection reuses canonical arithmetic derivation paint", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_100, height: 800 });
  await page.goto(route(900, { kpFoldMode: "expanded" }), {
    waitUntil: "domcontentloaded"
  });

  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-transition",
    "transform.foldable-distribution.collect-results"
  );
  await expect(
    page.locator(
      "[data-kp-reader-transition-active='true'] [data-kp-reader-fit-surface]"
    )
  ).toHaveAttribute("data-kp-native-katex-successor-synthesis-count", "2");
});

test("shared equation fitting contains and centers foldable and linear solve cards", async ({
  page
}) => {
  const cases = [
    {
      path: route(740, { kpFoldMode: "expanded" }),
      width: 1_100,
      height: 800
    },
    {
      path: route(740, { kpFoldMode: "expanded" }),
      width: 390,
      height: 844
    },
    {
      path:
        "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1" +
        "&kpProgress=500&kpMotion=full",
      width: 1_100,
      height: 800
    },
    {
      path:
        "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1" +
        "&kpProgress=500&kpMotion=full",
      width: 390,
      height: 844
    }
  ];

  for (const candidate of cases) {
    await page.setViewportSize(candidate);
    await page.goto(candidate.path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toHaveAttribute(
      "data-kp-reader-hydrated",
      "true"
    );
    await expect(
      page.locator("[data-kp-reader-transition-active='true']")
    ).toHaveCount(1);
    const geometry = await equationGeometry(page);

    expect(geometry.fitStatus).not.toBe("overflow");
    expect(geometry.wrapAllowed).toBe("false");
    expect(
      geometry.maximumOverflowPx,
      JSON.stringify({ candidate, geometry })
    ).toBeLessThanOrEqual(0.75);
    expect(
      Math.abs(geometry.horizontalCenterDeltaPx),
      JSON.stringify({ candidate, geometry })
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(geometry.verticalCenterDeltaPx),
      JSON.stringify({ candidate, geometry })
    ).toBeLessThanOrEqual(1);
  }
});

async function equationGeometry(page: Page): Promise<{
  fitStatus: string | undefined;
  wrapAllowed: string | undefined;
  maximumOverflowPx: number;
  horizontalCenterDeltaPx: number;
  verticalCenterDeltaPx: number;
  fitScale: string | undefined;
  fitBounds: string | undefined;
}> {
  return page.evaluate(() => {
    const viewport = document.querySelector<HTMLElement>(
      "[data-kp-reader-equation-viewport]"
    );
    const transition = document.querySelector<HTMLElement>(
      "[data-kp-reader-transition-active='true']"
    );
    const fit = transition?.querySelector<HTMLElement>(
      "[data-kp-reader-fit-surface]"
    );
    if (
      viewport === null ||
      transition === null ||
      fit === null ||
      fit === undefined
    ) {
      throw new Error("Active fitted equation is unavailable.");
    }
    const viewportRect = viewport.getBoundingClientRect();
    const nativeRects = [
      ...transition.querySelectorAll<HTMLElement>(
        "[data-kp-reader-equation-anchor-id]"
      )
    ].map((element) => element.getBoundingClientRect()).filter(
      ({ width, height }) => width > 0 && height > 0
    );
    const materialRects = [
      ...document.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )
    ].map((element) => element.getBoundingClientRect()).filter(
      ({ width, height }) => width > 0 && height > 0
    );
    const rects = [...nativeRects, ...materialRects];
    if (rects.length === 0 || nativeRects.length === 0) {
      throw new Error("Fitted equation exposes no measurable paint.");
    }
    const union = {
      left: Math.min(...rects.map(({ left }) => left)),
      top: Math.min(...rects.map(({ top }) => top)),
      right: Math.max(...rects.map(({ right }) => right)),
      bottom: Math.max(...rects.map(({ bottom }) => bottom))
    };
    const nativeUnion = {
      left: Math.min(...nativeRects.map(({ left }) => left)),
      top: Math.min(...nativeRects.map(({ top }) => top)),
      right: Math.max(...nativeRects.map(({ right }) => right)),
      bottom: Math.max(...nativeRects.map(({ bottom }) => bottom))
    };
    return {
      fitStatus: fit.dataset["kpReaderEquationFitStatus"],
      wrapAllowed: fit.dataset["kpReaderEquationWrapAllowed"],
      fitScale: fit.dataset["kpReaderEquationFitScale"],
      fitBounds: fit.dataset["kpReaderEquationFitBounds"],
      maximumOverflowPx: Math.max(
        0,
        viewportRect.left - union.left,
        union.right - viewportRect.right,
        viewportRect.top - union.top,
        union.bottom - viewportRect.bottom
      ),
      horizontalCenterDeltaPx:
        (nativeUnion.left + nativeUnion.right) / 2 -
        (viewportRect.left + viewportRect.right) / 2,
      verticalCenterDeltaPx:
        (nativeUnion.top + nativeUnion.bottom) / 2 -
        (viewportRect.top + viewportRect.bottom) / 2
    };
  });
}
