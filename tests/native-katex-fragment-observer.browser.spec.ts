import { expect, test } from "@playwright/test";

test("observer measures one explicitly tagged real KaTeX fragment", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  await page.evaluate(async () => document.fonts.ready);
  const observed = await page.evaluate(async () => {
    const stage = document.querySelector<HTMLElement>(
      '[data-reconciliation-case="solve-x"] [data-case-stage]'
    )!;
    const renderedX = stage.querySelector<HTMLElement>(
      "[data-case-source] .mord.mathnormal"
    )!;
    renderedX.dataset["kpMotionId"] = "motion.solve-x.x";
    const observeKpNativeKatexFragments = (
      window as unknown as {
        __kpObserveNativeKatexFragments: (input: {
          stage: HTMLElement;
          bindings: readonly {
            id: string;
            semanticEntityId: string;
            motionId: string;
            glyphKey: string;
          }[];
          fontRevision: number;
        }) => {
          lifecycle: string;
          fragments: readonly {
            sourceElement: HTMLElement;
            rect: { left: number; width: number; height: number };
            styleFingerprint: string;
          }[];
        };
      }
    ).__kpObserveNativeKatexFragments;
    const batch = observeKpNativeKatexFragments({
      stage,
      bindings: [{
        id: "fragment.solve-x.x",
        semanticEntityId: "equation.solve-x.before.x",
        motionId: "motion.solve-x.x",
        glyphKey: "x"
      }],
      fontRevision: 1
    });
    const fragment = batch.fragments[0]!;
    return {
      lifecycle: batch.lifecycle,
      text: fragment.sourceElement.textContent,
      className: fragment.sourceElement.className,
      rect: fragment.rect,
      styleFingerprint: fragment.styleFingerprint
    };
  });

  expect(observed.lifecycle).toBe("renderer-session");
  expect(observed.text).toBe("x");
  expect(observed.className).toContain("mathnormal");
  expect(observed.rect.width).toBeGreaterThan(0);
  expect(observed.rect.height).toBeGreaterThan(0);
  expect(observed.rect.left).toBeGreaterThanOrEqual(0);
  expect(observed.styleFingerprint).toContain("font-family:");
});

test("scene observer enumerates visible KaTeX glyph paint without MathML ink", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const evidence = await page.evaluate(() => {
    const observe = (window as unknown as {
      __kpObserveNativeKatexGlyphPaintAtoms: (input: {
        endpoint: "source";
        stage: HTMLElement;
        root: HTMLElement;
        semanticEntityId: string;
        presentationGroupId: string;
        fontRevision: number;
      }) => readonly {
        id: string;
        visualKey: string;
        paintKind: string;
        sourceElement: HTMLElement;
        rect: { width: number; height: number };
      }[];
    }).__kpObserveNativeKatexGlyphPaintAtoms;
    const stage = document.querySelector<HTMLElement>("[data-fraction-stage]")!;
    const root = document.querySelector<HTMLElement>("[data-fraction-source]")!;
    return observe({
      endpoint: "source",
      stage,
      root,
      semanticEntityId: "entity.fraction.source",
      presentationGroupId: "group.fraction.source",
      fontRevision: 1
    }).map((atom) => ({
      id: atom.id,
      visualKey: atom.visualKey,
      paintKind: atom.paintKind,
      inMathMl: atom.sourceElement.closest(".katex-mathml") !== null,
      width: atom.rect.width,
      height: atom.rect.height
    }));
  });

  expect(evidence.length).toBeGreaterThanOrEqual(5);
  expect(evidence.some(({ visualKey }) => visualKey === "glyph:x")).toBe(true);
  expect(evidence.some(({ visualKey }) => visualKey === "glyph:y")).toBe(true);
  expect(evidence.filter(({ visualKey }) => visualKey === "glyph:2")).toHaveLength(2);
  expect(evidence.every(({ paintKind, inMathMl, width, height }) =>
    paintKind === "glyph" &&
    !inMathMl &&
    width > 0 &&
    height > 0
  )).toBe(true);
});

test("scene observer includes generic fraction rules as structural paint", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const evidence = await page.evaluate(() => {
    const observe = (window as unknown as {
      __kpObserveNativeKatexPaintAtoms: (input: {
        endpoint: "source";
        stage: HTMLElement;
        root: HTMLElement;
        semanticEntityId: string;
        presentationGroupId: string;
        fontRevision: number;
      }) => readonly {
        paintKind: string;
        visualKey: string;
        rect: { width: number; height: number };
      }[];
    }).__kpObserveNativeKatexPaintAtoms;
    return observe({
      endpoint: "source",
      stage: document.querySelector<HTMLElement>("[data-fraction-stage]")!,
      root: document.querySelector<HTMLElement>("[data-fraction-source]")!,
      semanticEntityId: "entity.fraction.source",
      presentationGroupId: "group.fraction.source",
      fontRevision: 1
    }).map(({ paintKind, visualKey, rect }) => ({
      paintKind,
      visualKey,
      width: rect.width,
      height: rect.height
    }));
  });

  const rules = evidence.filter(({ paintKind }) => paintKind === "rule");
  expect(rules).toHaveLength(2);
  expect(rules.every(({ visualKey, width, height }) =>
    visualKey === "rule" && width > height && height > 0
  )).toBe(true);
});

test("scene paint inherits explicit semantic and presentation ownership", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const evidence = await page.evaluate(() => {
    const observe = (window as unknown as {
      __kpObserveNativeKatexPaintAtoms: (input: {
        endpoint: "source";
        stage: HTMLElement;
        root: HTMLElement;
        semanticEntityId: string;
        presentationGroupId: string;
        fontRevision: number;
        requireExplicitOwnership: boolean;
      }) => readonly {
        semanticEntityId: string;
        presentationGroupId: string;
        paintKind: string;
        visualKey: string;
      }[];
    }).__kpObserveNativeKatexPaintAtoms;
    return observe({
      endpoint: "source",
      stage: document.querySelector<HTMLElement>("[data-fraction-stage]")!,
      root: document.querySelector<HTMLElement>("[data-fraction-source]")!,
      semanticEntityId: "forbidden.fallback",
      presentationGroupId: "forbidden.fallback",
      fontRevision: 1,
      requireExplicitOwnership: true
    });
  });

  expect(evidence.every(({ semanticEntityId, presentationGroupId }) =>
    semanticEntityId !== "forbidden.fallback" &&
    presentationGroupId !== "forbidden.fallback"
  )).toBe(true);
  expect(evidence.some(({ semanticEntityId }) =>
    semanticEntityId === "symbol.x"
  )).toBe(true);
  expect(evidence.some(({ semanticEntityId }) =>
    semanticEntityId === "symbol.y"
  )).toBe(true);
  expect(evidence.filter(({ paintKind }) => paintKind === "rule")
    .every(({ semanticEntityId }) =>
      semanticEntityId === "fraction.left" ||
      semanticEntityId === "fraction.right"
    )).toBe(true);
});

test("complete scene observation settles and invalidates by viewport", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const first = await page.evaluate(async () => {
    const settle = (window as unknown as {
      __kpSettleAndObserveNativeKatexRenderedScene: (input: {
        endpoint: "source";
        stage: HTMLElement;
        root: HTMLElement;
        semanticEntityId: string;
        presentationGroupId: string;
        fontReadiness: {
          revision: number;
          whenReady(): Promise<void>;
        };
      }) => Promise<{
        atoms: readonly unknown[];
        groups: readonly unknown[];
        viewportKey: string;
      }>;
    }).__kpSettleAndObserveNativeKatexRenderedScene;
    const scene = await settle({
      endpoint: "source",
      stage: document.querySelector<HTMLElement>("[data-fraction-stage]")!,
      root: document.querySelector<HTMLElement>("[data-fraction-source]")!,
      semanticEntityId: "fraction.expression",
      presentationGroupId: "group.fraction.source",
      fontReadiness: { revision: 7, async whenReady() {} }
    });
    return {
      atoms: scene.atoms.length,
      groups: scene.groups.length,
      viewportKey: scene.viewportKey
    };
  });
  await page.setViewportSize({ width: 390, height: 844 });
  const phoneKey = await page.evaluate(async () => {
    const settle = (window as unknown as {
      __kpSettleAndObserveNativeKatexRenderedScene: (input: {
        endpoint: "source";
        stage: HTMLElement;
        root: HTMLElement;
        semanticEntityId: string;
        presentationGroupId: string;
        fontReadiness: {
          revision: number;
          whenReady(): Promise<void>;
        };
      }) => Promise<{ viewportKey: string }>;
    }).__kpSettleAndObserveNativeKatexRenderedScene;
    return (await settle({
      endpoint: "source",
      stage: document.querySelector<HTMLElement>("[data-fraction-stage]")!,
      root: document.querySelector<HTMLElement>("[data-fraction-source]")!,
      semanticEntityId: "fraction.expression",
      presentationGroupId: "group.fraction.source",
      fontReadiness: { revision: 7, async whenReady() {} }
    })).viewportKey;
  });

  expect(first.atoms).toBeGreaterThanOrEqual(7);
  expect(first.groups).toBeGreaterThanOrEqual(7);
  expect(first.viewportKey).toContain("font-7");
  expect(phoneKey).not.toBe(first.viewportKey);
});

test("live fraction route exposes complete source and target inventories", async ({
  page
}) => {
  for (const viewport of [
    { width: 1440, height: 950 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/glyph-reconciliation-experiment.html?progress=0");
    const review = page.locator('[data-kp-glyph-review][data-kp-ready="true"]');
    await review.waitFor();
    const inventory = await review.evaluate((element) => ({
      sourceAtoms: Number(element.dataset["kpFractionSourceAtomCount"]),
      targetAtoms: Number(element.dataset["kpFractionTargetAtomCount"]),
      sourceGroups: Number(element.dataset["kpFractionSourceGroupCount"]),
      targetGroups: Number(element.dataset["kpFractionTargetGroupCount"])
    }));

    expect(inventory.sourceAtoms).toBeGreaterThanOrEqual(7);
    expect(inventory.targetAtoms).toBeGreaterThanOrEqual(5);
    expect(inventory.sourceGroups).toBeGreaterThanOrEqual(7);
    expect(inventory.targetGroups).toBeGreaterThanOrEqual(6);
    await expect(page.locator("[data-fraction-inventory]")).toContainText(
      "paint atoms inventoried"
    );
  }
});

test("live fraction scene exposes continuously sampled structural rule tracks", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  const review = page.locator('[data-kp-glyph-review][data-kp-ready="true"]');
  await review.waitFor();
  await expect(review).toHaveAttribute("data-kp-fraction-rule-track-count", "2");
  const samples = await page.evaluate(() => {
    const sample = (window as unknown as {
      __kpSampleFractionSceneTracks: (progress: number) => readonly {
        paintKind: string;
        sizingMode: string;
        rect: { left: number; top: number; width: number; height: number };
      }[];
    }).__kpSampleFractionSceneTracks;
    return [0, 0.5, 1].map((progress) =>
      sample(progress).filter(({ paintKind }) => paintKind === "rule")
    );
  });

  expect(samples.every((frames) => frames.length === 2)).toBe(true);
  expect(samples[1]!.every(({ sizingMode }) =>
    sizingMode === "rule-length"
  )).toBe(true);
  for (let index = 0; index < 2; index += 1) {
    const start = samples[0]![index]!.rect;
    const middle = samples[1]![index]!.rect;
    const end = samples[2]![index]!.rect;
    expect(middle.left).toBeGreaterThanOrEqual(
      Math.min(start.left, end.left) - 0.01
    );
    expect(middle.left).toBeLessThanOrEqual(
      Math.max(start.left, end.left) + 0.01
    );
    expect(middle.width).toBeGreaterThanOrEqual(
      Math.min(start.width, end.width) - 0.01
    );
    expect(middle.width).toBeLessThanOrEqual(
      Math.max(start.width, end.width) + 0.01
    );
  }
});

test("full fraction scene has one exclusive visual owner through handoff", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const ownership = await page.evaluate(() => {
    const apply = (window as unknown as {
      __kpApplyFractionSceneFrame: (progress: number) => {
        visualOwner: string;
        sourceNativeOpacity: number;
        materialSceneOpacity: number;
        targetNativeOpacity: number;
        frames: readonly { opacity: number }[];
      };
    }).__kpApplyFractionSceneFrame;
    return [0, 0.5, 1].map((progress) => {
      const frame = apply(progress);
      const stage = document.querySelector<HTMLElement>(
        "[data-fraction-stage]"
      )!;
      const materialOwners = [...stage.querySelectorAll<HTMLElement>(
        "[data-kp-native-katex-scene-owner]"
      )];
      return {
        ...frame,
        sourceOpacity: stage.querySelector<HTMLElement>(
          "[data-fraction-source]"
        )!.style.opacity,
        targetOpacity: stage.querySelector<HTMLElement>(
          "[data-fraction-target]"
        )!.style.opacity,
        materialOwnerCount: materialOwners.length,
        inertOwners: materialOwners.filter((owner) =>
          owner.hasAttribute("inert") &&
          owner.getAttribute("aria-hidden") === "true"
        ).length,
        visibleMaterialOwners: materialOwners.filter((owner) =>
          Number(owner.style.opacity) > 0
        ).length
      };
    });
  });

  expect(ownership.map(({ visualOwner }) => visualOwner)).toEqual([
    "source-native",
    "material-scene",
    "target-native"
  ]);
  expect(ownership.map((frame) => [
    frame.sourceNativeOpacity,
    frame.materialSceneOpacity,
    frame.targetNativeOpacity
  ])).toEqual([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ]);
  expect(ownership.map(({ sourceOpacity, targetOpacity }) => [
    sourceOpacity,
    targetOpacity
  ])).toEqual([
    ["1", "0"],
    ["0", "0"],
    ["0", "1"]
  ]);
  expect(ownership[1]!.materialOwnerCount).toBe(
    ownership[1]!.frames.length
  );
  expect(ownership[1]!.inertOwners).toBe(
    ownership[1]!.materialOwnerCount
  );
  expect(ownership[1]!.visibleMaterialOwners).toBeGreaterThan(0);
  expect(ownership[0]!.visibleMaterialOwners).toBe(0);
  expect(ownership[2]!.visibleMaterialOwners).toBe(0);
});

test("full-scene playback direct seek is stateless through reverse application", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const snapshots = await page.evaluate(() => {
    const apply = (window as unknown as {
      __kpApplyFractionSceneFrame: (progress: number) => unknown;
    }).__kpApplyFractionSceneFrame;
    const stage = document.querySelector<HTMLElement>("[data-fraction-stage]")!;
    return [0.37, 0.82, 0.37].map((progress) => {
      apply(progress);
      return [...stage.querySelectorAll<HTMLElement>(
        "[data-kp-native-katex-scene-owner]"
      )].map((owner) => ({
        id: owner.dataset["kpEquationMaterialOwnerId"],
        left: owner.style.left,
        top: owner.style.top,
        width: owner.style.width,
        height: owner.style.height,
        opacity: owner.style.opacity
      }));
    });
  });

  expect(snapshots[0]).toEqual(snapshots[2]);
  expect(snapshots[0]).not.toEqual(snapshots[1]);
});

test("glyph handoff microscope is repeatable across viewport and DPR", async ({
  browser
}) => {
  for (const profile of [
    {
      id: "wide",
      viewport: { width: 1_440, height: 950 },
      deviceScaleFactor: 1
    },
    {
      id: "phone-dpr2",
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2
    }
  ]) {
    const context = await browser.newContext({
      viewport: profile.viewport,
      deviceScaleFactor: profile.deviceScaleFactor
    });
    const page = await context.newPage();
    await page.goto("/glyph-reconciliation-experiment.html?progress=859");
    await page.locator(
      '[data-kp-glyph-review][data-kp-ready="true"]'
    ).waitFor();
    const evidence = await page.evaluate(() => {
      const measure = (window as unknown as {
        __kpMeasureFractionGlyphHandoff: (progress: number) => {
          observations: readonly {
            id: string;
            side: "material" | "native-target";
            paintAtomId: string;
            semanticEntityId: string;
            paintKind: string;
            rect: {
              left: number;
              top: number;
              width: number;
              height: number;
            };
            baselineY: number | null;
            wrapperTransform: string;
            paintFingerprint: string;
            styleFingerprint: string;
            opacity: number;
          }[];
        };
      }).__kpMeasureFractionGlyphHandoff;
      const snapshot = (progress: number) => measure(progress).observations.map(
        (observation) => ({ ...observation })
      );
      return {
        before: snapshot(0.999),
        repeated: snapshot(0.999),
        native: snapshot(1)
      };
    });

    expect(evidence.before).toEqual(evidence.repeated);
    expect(evidence.before.length).toBeGreaterThanOrEqual(10);
    expect(evidence.before.every(({ paintKind }) =>
      paintKind === "glyph"
    )).toBe(true);
    expect(evidence.before.every((observation) =>
      Number.isFinite(observation.rect.left) &&
      Number.isFinite(observation.rect.top) &&
      observation.rect.width > 0 &&
      observation.rect.height > 0 &&
      Number.isFinite(observation.baselineY) &&
      observation.wrapperTransform.length > 0 &&
      observation.paintFingerprint.startsWith("glyph:") &&
      observation.styleFingerprint.includes("font-family:")
    )).toBe(true);
    const byCorrelation = evidence.before.reduce((groups, observation) => {
      const id = observation.id.replace(/\.(material|native)$/, "");
      groups.set(id, [...(groups.get(id) ?? []), observation]);
      return groups;
    }, new Map<string, typeof evidence.before>());
    expect([...byCorrelation.values()].every((pair) =>
      pair.length === 2 &&
      pair[0]!.paintAtomId === pair[1]!.paintAtomId &&
      pair[0]!.semanticEntityId === pair[1]!.semanticEntityId &&
      pair[0]!.paintFingerprint === pair[1]!.paintFingerprint
    )).toBe(true);
    expect(evidence.before.filter(({ side, opacity }) =>
      side === "native-target" && opacity > 0
    )).toHaveLength(0);
    expect(evidence.before.some(({ side, opacity }) =>
      side === "material" && opacity > 0
    )).toBe(true);
    expect(evidence.native.filter(({ side, opacity }) =>
      side === "material" && opacity > 0
    )).toHaveLength(0);
    expect(evidence.native.filter(({ side, opacity }) =>
      side === "native-target" && opacity > 0
    ).length).toBeGreaterThan(0);
    await context.close();
  }
});

test("structural handoff microscope measures generic rule geometry", async ({
  browser
}) => {
  for (const profile of [
    {
      viewport: { width: 1_440, height: 950 },
      deviceScaleFactor: 1
    },
    {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2
    }
  ]) {
    const context = await browser.newContext({
      viewport: profile.viewport,
      deviceScaleFactor: profile.deviceScaleFactor
    });
    const page = await context.newPage();
    await page.goto("/glyph-reconciliation-experiment.html?progress=859");
    await page.locator(
      '[data-kp-glyph-review][data-kp-ready="true"]'
    ).waitFor();
    const evidence = await page.evaluate(() => {
      const measure = (window as unknown as {
        __kpMeasureFractionRuleHandoff: (progress: number) => {
          observations: readonly {
            id: string;
            side: "material" | "native-target";
            paintAtomId: string;
            semanticEntityId: string;
            paintKind: string;
            rect: {
              left: number;
              top: number;
              width: number;
              height: number;
            };
            baselineY: number | null;
            wrapperTransform: string;
            clipPath: string;
            paintFingerprint: string;
            styleFingerprint: string;
            opacity: number;
            ruleGeometry: {
              axis: "horizontal" | "vertical";
              left: number;
              top: number;
              width: number;
              thickness: number;
            };
          }[];
        };
      }).__kpMeasureFractionRuleHandoff;
      const snapshot = (progress: number) => measure(progress).observations.map(
        (observation) => ({ ...observation })
      );
      return {
        before: snapshot(0.999),
        repeated: snapshot(0.999),
        native: snapshot(1)
      };
    });

    expect(evidence.before).toEqual(evidence.repeated);
    expect(evidence.before.length).toBeGreaterThanOrEqual(4);
    expect(evidence.before.every((observation) =>
      observation.paintKind === "rule" &&
      observation.baselineY === null &&
      observation.wrapperTransform.length > 0 &&
      observation.clipPath.length > 0 &&
      observation.paintFingerprint === "rule" &&
      observation.styleFingerprint.includes("border-") &&
      observation.ruleGeometry.axis === "horizontal" &&
      observation.ruleGeometry.width > 0 &&
      observation.ruleGeometry.thickness > 0 &&
      Number.isFinite(observation.ruleGeometry.left) &&
      Number.isFinite(observation.ruleGeometry.top)
    )).toBe(true);
    const byCorrelation = evidence.before.reduce((groups, observation) => {
      const id = observation.id.replace(/\.(material|native)$/, "");
      groups.set(id, [...(groups.get(id) ?? []), observation]);
      return groups;
    }, new Map<string, typeof evidence.before>());
    expect([...byCorrelation.values()].every((pair) =>
      pair.length === 2 &&
      pair[0]!.paintAtomId === pair[1]!.paintAtomId &&
      pair[0]!.semanticEntityId === pair[1]!.semanticEntityId &&
      pair[0]!.paintFingerprint === pair[1]!.paintFingerprint
    )).toBe(true);
    expect(evidence.before.filter(({ side, opacity }) =>
      side === "native-target" && opacity > 0
    )).toHaveLength(0);
    expect(evidence.native.filter(({ side, opacity }) =>
      side === "material" && opacity > 0
    )).toHaveLength(0);
    expect(evidence.native.filter(({ side, opacity }) =>
      side === "native-target" && opacity > 0
    ).length).toBeGreaterThan(0);
    await context.close();
  }
});

test("visible fraction card renders the complete moving scene on its shared clock", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=250");
  const review = page.locator('[data-kp-glyph-review][data-kp-ready="true"]');
  await review.waitFor();
  const fraction = page.locator('[data-reconciliation-case="fraction-merge"]');
  const slider = fraction.locator("[data-progress]");
  const snapshot = async () => fraction.evaluate((card) =>
    [...card.querySelectorAll<HTMLElement>(
      "[data-kp-native-katex-scene-owner]"
    )].map((owner) => ({
      id: owner.dataset["kpEquationMaterialOwnerId"],
      role: owner.dataset["kpEquationMaterialFragmentRole"],
      left: owner.style.left,
      top: owner.style.top,
      width: owner.style.width,
      opacity: owner.style.opacity
    }))
  );
  const early = await snapshot();
  await slider.evaluate((element: HTMLInputElement) => {
    element.value = "750";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const late = await snapshot();

  await expect(review).toHaveAttribute(
    "data-kp-fraction-visual-owner",
    "material-scene"
  );
  await expect(fraction.locator("[data-fraction-source]")).toHaveCSS(
    "opacity",
    "0"
  );
  await expect(fraction.locator("[data-fraction-target]")).toHaveCSS(
    "opacity",
    "0"
  );
  expect(early.length).toBeGreaterThan(5);
  expect(early.map(({ id }) => id)).toEqual(late.map(({ id }) => id));
  expect(early.filter((frame, index) => {
    const next = late[index]!;
    return frame.left !== next.left ||
      frame.top !== next.top ||
      frame.width !== next.width ||
      frame.opacity !== next.opacity;
  }).length).toBeGreaterThan(4);
  expect(early.filter(({ role }) => role?.startsWith("rule:"))).toHaveLength(2);
});

test("observer rejects missing and duplicate explicit motion nodes", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const messages = await page.evaluate(async () => {
    const stage = document.querySelector<HTMLElement>(
      '[data-reconciliation-case="solve-x"] [data-case-stage]'
    )!;
    const observeKpNativeKatexFragments = (
      window as unknown as {
        __kpObserveNativeKatexFragments: (input: {
          stage: HTMLElement;
          bindings: readonly {
            id: string;
            semanticEntityId: string;
            motionId: string;
            glyphKey: string;
          }[];
          fontRevision: number;
        }) => unknown;
      }
    ).__kpObserveNativeKatexFragments;
    const binding = {
      id: "fragment.solve-x.x",
      semanticEntityId: "entity.x",
      motionId: "motion.ambiguous",
      glyphKey: "x"
    };
    const capture = (): string => {
      try {
        observeKpNativeKatexFragments({
          stage,
          bindings: [binding],
          fontRevision: 0
        });
        return "";
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    };
    const missing = capture();
    const nodes = stage.querySelectorAll<HTMLElement>(".mord.mathnormal");
    nodes[0]!.dataset["kpMotionId"] = binding.motionId;
    nodes[1]!.dataset["kpMotionId"] = binding.motionId;
    return { missing, duplicate: capture() };
  });

  expect(messages.missing).toContain("resolved to 0");
  expect(messages.duplicate).toContain("resolved to 2");
});

test("stage-local fragment geometry is stable under stage scaling", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const measurements = await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>(
      '[data-reconciliation-case="solve-x"] [data-case-stage]'
    )!;
    const renderedX = stage.querySelector<HTMLElement>(
      "[data-case-source] .mord.mathnormal"
    )!;
    renderedX.dataset["kpMotionId"] = "motion.solve-x.scaled-x";
    const observe = (
      window as unknown as {
        __kpObserveNativeKatexFragments: (input: {
          stage: HTMLElement;
          bindings: readonly {
            id: string;
            semanticEntityId: string;
            motionId: string;
            glyphKey: string;
          }[];
          fontRevision: number;
        }) => {
          fragments: readonly {
            rect: { left: number; top: number; width: number; height: number };
          }[];
        };
      }
    ).__kpObserveNativeKatexFragments;
    const read = () => observe({
      stage,
      bindings: [{
        id: "fragment.solve-x.scaled-x",
        semanticEntityId: "entity.x",
        motionId: "motion.solve-x.scaled-x",
        glyphKey: "x"
      }],
      fontRevision: 0
    }).fragments[0]!.rect;
    const normal = read();
    stage.style.transformOrigin = "0 0";
    stage.style.transform = "scale(1.5)";
    const scaled = read();
    return { normal, scaled };
  });

  for (const key of ["left", "top", "width", "height"] as const) {
    expect(measurements.scaled[key]).toBeCloseTo(
      measurements.normal[key],
      4
    );
  }
});

test("settled observation waits for fonts and rejects consecutive-frame drift", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const result = await page.evaluate(async () => {
    const stage = document.querySelector<HTMLElement>(
      '[data-reconciliation-case="solve-x"] [data-case-stage]'
    )!;
    const renderedX = stage.querySelector<HTMLElement>(
      "[data-case-source] .mord.mathnormal"
    )!;
    renderedX.dataset["kpMotionId"] = "motion.solve-x.settled-x";
    const settle = (
      window as unknown as {
        __kpSettleAndObserveNativeKatexFragments: (input: {
          stage: HTMLElement;
          bindings: readonly {
            id: string;
            semanticEntityId: string;
            motionId: string;
            glyphKey: string;
          }[];
          fontReadiness: {
            status: "ready";
            revision: number;
            whenReady(): Promise<void>;
            subscribe(): () => void;
            dispose(): void;
          };
        }) => Promise<{
          fragments: readonly {
            fontRevision: number;
            rect: { width: number };
          }[];
        }>;
      }
    ).__kpSettleAndObserveNativeKatexFragments;
    const binding = [{
      id: "fragment.solve-x.settled-x",
      semanticEntityId: "entity.x",
      motionId: "motion.solve-x.settled-x",
      glyphKey: "x"
    }];
    const fontReadiness = {
      status: "ready" as const,
      revision: 7,
      whenReady: async () => document.fonts.ready.then(() => undefined),
      subscribe: () => () => undefined,
      dispose: () => undefined
    };
    const stable = await settle({
      stage,
      bindings: binding,
      fontReadiness
    });
    const originalRect = renderedX.getBoundingClientRect.bind(renderedX);
    let reads = 0;
    renderedX.getBoundingClientRect = () => {
      const rect = originalRect();
      reads += 1;
      return DOMRect.fromRect({
        x: rect.x,
        y: rect.y,
        width: rect.width + reads,
        height: rect.height
      });
    };
    let drift = "";
    try {
      await settle({ stage, bindings: binding, fontReadiness });
    } catch (error) {
      drift = error instanceof Error ? error.message : String(error);
    }
    return {
      fontRevision: stable.fragments[0]!.fontRevision,
      width: stable.fragments[0]!.rect.width,
      drift
    };
  });

  expect(result.fontRevision).toBe(7);
  expect(result.width).toBeGreaterThan(0);
  expect(result.drift).toContain("did not settle");
});

test("material clone uses the exact KaTeX subtree without semantic authority", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const result = await page.evaluate(async () => {
    const stage = document.querySelector<HTMLElement>(
      '[data-reconciliation-case="solve-x"] [data-case-stage]'
    )!;
    const renderedX = stage.querySelector<HTMLElement>(
      "[data-case-source] .mord.mathnormal"
    )!;
    renderedX.dataset["kpMotionId"] = "motion.solve-x.clone-x";
    renderedX.id = "semantic-x";
    renderedX.setAttribute("role", "math");
    renderedX.setAttribute("aria-label", "semantic x");
    renderedX.tabIndex = 0;
    const layer = document.createElement("span");
    layer.dataset["kpEditorEquationMaterialLayer"] = "true";
    stage.append(layer);
    // @ts-expect-error Vite resolves browser-side source modules.
    const observer = await import("/src/rendering/native-katex-fragment-observer.ts");
    // @ts-expect-error Vite resolves browser-side source modules.
    const compositor = await import("/src/rendering/native-katex-glyph-compositor.ts");
    const observation = observer.observeKpNativeKatexFragments({
      stage,
      bindings: [{
        id: "fragment.solve-x.clone-x",
        semanticEntityId: "entity.x",
        motionId: "motion.solve-x.clone-x",
        glyphKey: "x"
      }],
      fontRevision: 1
    }).fragments[0]!;
    const clone = compositor.createKpNativeKatexFragmentClone({
      stage,
      ownerId: "owner.solve-x.clone-x",
      observation
    });
    const sourceStyle = getComputedStyle(renderedX);
    return {
      text: clone.visualElement.textContent,
      className: clone.visualElement.className,
      fontFamily: clone.visualElement.style.fontFamily,
      sourceFontFamily: sourceStyle.fontFamily,
      fontSize: clone.visualElement.style.fontSize,
      sourceFontSize: sourceStyle.fontSize,
      cloneMotionId: clone.visualElement.dataset["kpMotionId"] ?? null,
      cloneId: clone.visualElement.id,
      cloneRole: clone.visualElement.getAttribute("role"),
      cloneLabel: clone.visualElement.getAttribute("aria-label"),
      cloneTabIndex: clone.visualElement.getAttribute("tabindex"),
      ownerAriaHidden: clone.ownerElement.getAttribute("aria-hidden"),
      ownerInert: clone.ownerElement.inert,
      ownerPointerEvents: clone.ownerElement.style.pointerEvents
    };
  });

  expect(result.text).toBe("x");
  expect(result.className).toContain("mathnormal");
  expect(result.fontFamily).toBe(result.sourceFontFamily);
  expect(result.fontSize).toBe(result.sourceFontSize);
  expect(result.cloneMotionId).toBeNull();
  expect(result.cloneId).toBe("");
  expect(result.cloneRole).toBeNull();
  expect(result.cloneLabel).toBeNull();
  expect(result.cloneTabIndex).toBeNull();
  expect(result.ownerAriaHidden).toBe("true");
  expect(result.ownerInert).toBe(true);
  expect(result.ownerPointerEvents).toBe("none");
});

test("source, clone, and target have exactly one visual owner", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const frames = await page.evaluate(async () => {
    const stage = document.querySelector<HTMLElement>(
      '[data-reconciliation-case="solve-x"] [data-case-stage]'
    )!;
    const sourceX = stage.querySelector<HTMLElement>(
      "[data-case-source] .mord.mathnormal"
    )!;
    const targetX = stage.querySelector<HTMLElement>(
      "[data-case-target] .mord.mathnormal"
    )!;
    sourceX.dataset["kpMotionId"] = "motion.solve-x.owner-source";
    targetX.dataset["kpMotionId"] = "motion.solve-x.owner-target";
    const layer = document.createElement("span");
    layer.dataset["kpEditorEquationMaterialLayer"] = "true";
    stage.append(layer);
    // @ts-expect-error Vite resolves browser-side source modules.
    const observer = await import("/src/rendering/native-katex-fragment-observer.ts");
    // @ts-expect-error Vite resolves browser-side source modules.
    const compositor = await import("/src/rendering/native-katex-glyph-compositor.ts");
    const observed = observer.observeKpNativeKatexFragments({
      stage,
      bindings: [{
        id: "fragment.owner.source",
        semanticEntityId: "entity.source.x",
        motionId: "motion.solve-x.owner-source",
        glyphKey: "x"
      }, {
        id: "fragment.owner.target",
        semanticEntityId: "entity.target.x",
        motionId: "motion.solve-x.owner-target",
        glyphKey: "x"
      }],
      fontRevision: 1
    }).fragments;
    const clone = compositor.createKpNativeKatexFragmentClone({
      stage,
      ownerId: "owner.solve-x.exclusive",
      observation: observed[0]!
    });
    return [0, 0.001, 0.5, 0.999, 1].map((progress) => ({
      progress,
      ...compositor.applyKpNativeKatexGlyphOwnership({
        clone,
        source: observed[0]!,
        target: observed[1]!,
        progress
      })
    }));
  });

  expect(frames.map(({ visualOwner }) => visualOwner)).toEqual([
    "source-native",
    "clone-transit",
    "clone-transit",
    "clone-transit",
    "target-native"
  ]);
  for (const frame of frames) {
    expect(
      frame.sourceNativeOpacity +
      frame.cloneOpacity +
      frame.targetNativeOpacity
    ).toBe(1);
    expect([
      frame.sourceNativeOpacity,
      frame.cloneOpacity,
      frame.targetNativeOpacity
    ].filter((opacity) => opacity === 1)).toHaveLength(1);
  }
});

test("generic many-to-one frame converges exact native fragments without substitution", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const result = await page.evaluate(async () => {
    const stage = document.querySelector<HTMLElement>(
      '[data-reconciliation-case="solve-x"] [data-case-stage]'
    )!;
    const firstSource = stage.querySelector<HTMLElement>("[data-case-source]")!;
    const target = stage.querySelector<HTMLElement>("[data-case-target]")!;
    const secondSource = firstSource.cloneNode(true) as HTMLElement;
    secondSource.removeAttribute("data-case-source");
    secondSource.style.left = `${parseFloat(firstSource.style.left) + 120}px`;
    secondSource.dataset["kpMotionId"] = "motion.merge.source-b";
    firstSource.dataset["kpMotionId"] = "motion.merge.source-a";
    target.dataset["kpMotionId"] = "motion.merge.target";
    stage.append(secondSource);
    // @ts-expect-error Vite resolves browser-side source modules.
    const observer = await import("/src/rendering/native-katex-fragment-observer.ts");
    // @ts-expect-error Vite resolves browser-side source modules.
    const compositor = await import("/src/rendering/native-katex-glyph-compositor.ts");
    type BrowserObservation = {
      id: string;
      semanticEntityId: string;
      motionId: string;
      glyphKey: string;
      sourceElement: HTMLElement;
      rect: { left: number; top: number; width: number; height: number };
      styleFingerprint: string;
      fontRevision: number;
    };
    const observed = observer.observeKpNativeKatexFragments({
      stage,
      bindings: [{
        id: "fragment.merge.source-a",
        semanticEntityId: "entity.merge.source-a",
        motionId: "motion.merge.source-a",
        glyphKey: "x"
      }, {
        id: "fragment.merge.source-b",
        semanticEntityId: "entity.merge.source-b",
        motionId: "motion.merge.source-b",
        glyphKey: "x"
      }, {
        id: "fragment.merge.target",
        semanticEntityId: "entity.merge.target",
        motionId: "motion.merge.target",
        glyphKey: "x"
      }],
      fontRevision: 1
    }).fragments as BrowserObservation[];
    const clones = compositor.createKpNativeKatexFragmentClones({
      stage,
      fragments: observed.slice(0, 2).map((observation, index) => ({
        ownerId: `owner.merge.${index}`,
        observation
      }))
    }) as {
      ownerElement: HTMLElement;
      visualElement: HTMLElement;
    }[];
    const frames = [0, 0.5, 1].map((progress) =>
      compositor.applyKpNativeKatexManyToOneFrame({
        clones,
        sources: observed.slice(0, 2),
        target: observed[2]!,
        progress
      })
    );
    return {
      owners: frames.map(({ visualOwner }) => visualOwner),
      endpointDelta: frames[2]!.targetHandoffDeltaPx,
      sourceTexts: observed.slice(0, 2).map(({ sourceElement }) =>
        sourceElement.textContent
      ),
      cloneTexts: clones.map(({ visualElement }) => visualElement.textContent),
      targetText: target.textContent,
      endpointCloneOpacities: clones.map(({ ownerElement }) =>
        Number(ownerElement.style.opacity)
      ),
      targetOpacity: Number(target.style.opacity)
    };
  });

  expect(result.owners).toEqual([
    "source-natives",
    "clone-transit",
    "target-native"
  ]);
  expect(result.endpointDelta).toBe(0);
  expect(result.sourceTexts).toEqual([
    result.targetText,
    result.targetText
  ]);
  expect(result.cloneTexts).toEqual(result.sourceTexts);
  expect(result.endpointCloneOpacities).toEqual([0, 0]);
  expect(result.targetOpacity).toBe(1);
});

test("generic one-to-many frame separates exact target fragments without transit substitution", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const result = await page.evaluate(async () => {
    const stage = document.querySelector<HTMLElement>(
      '[data-reconciliation-case="solve-x"] [data-case-stage]'
    )!;
    const source = stage.querySelector<HTMLElement>("[data-case-source]")!;
    const firstTarget = stage.querySelector<HTMLElement>("[data-case-target]")!;
    const secondTarget = firstTarget.cloneNode(true) as HTMLElement;
    secondTarget.removeAttribute("data-case-target");
    secondTarget.style.left = `${parseFloat(firstTarget.style.left) + 120}px`;
    source.dataset["kpMotionId"] = "motion.split.source";
    firstTarget.dataset["kpMotionId"] = "motion.split.target-a";
    secondTarget.dataset["kpMotionId"] = "motion.split.target-b";
    stage.append(secondTarget);
    // @ts-expect-error Vite resolves browser-side source modules.
    const observer = await import("/src/rendering/native-katex-fragment-observer.ts");
    // @ts-expect-error Vite resolves browser-side source modules.
    const compositor = await import("/src/rendering/native-katex-glyph-compositor.ts");
    const observed = observer.observeKpNativeKatexFragments({
      stage,
      bindings: [{
        id: "fragment.split.source",
        semanticEntityId: "entity.split.source",
        motionId: "motion.split.source",
        glyphKey: "x"
      }, {
        id: "fragment.split.target-a",
        semanticEntityId: "entity.split.target-a",
        motionId: "motion.split.target-a",
        glyphKey: "x"
      }, {
        id: "fragment.split.target-b",
        semanticEntityId: "entity.split.target-b",
        motionId: "motion.split.target-b",
        glyphKey: "x"
      }],
      fontRevision: 1
    }).fragments;
    const clones = compositor.createKpNativeKatexFragmentClones({
      stage,
      fragments: [{
        ownerId: "owner.split.target-a",
        observation: observed[1]!
      }, {
        ownerId: "owner.split.target-b",
        observation: observed[2]!
      }]
    }) as {
      ownerElement: HTMLElement;
      visualElement: HTMLElement;
    }[];
    const frames = [0, 0.5, 1].map((progress: number) =>
      compositor.applyKpNativeKatexOneToManyFrame({
        clones,
        source: observed[0]!,
        targets: observed.slice(1),
        progress
      })
    ) as { visualOwner: string; targetHandoffDeltaPx: number }[];
    return {
      owners: frames.map((frame) => frame.visualOwner),
      endpointDelta: frames[2]!.targetHandoffDeltaPx,
      cloneTexts: clones.map(({ visualElement }) => visualElement.textContent),
      targetTexts: [firstTarget.textContent, secondTarget.textContent],
      sourceOpacity: Number(source.style.opacity),
      targetOpacities: [
        Number(firstTarget.style.opacity),
        Number(secondTarget.style.opacity)
      ]
    };
  });

  expect(result.owners).toEqual([
    "source-native",
    "clone-transit",
    "target-natives"
  ]);
  expect(result.endpointDelta).toBe(0);
  expect(result.cloneTexts).toEqual(result.targetTexts);
  expect(result.sourceOpacity).toBe(0);
  expect(result.targetOpacities).toEqual([1, 1]);
});

test("moving clone meets native target within one CSS pixel without typography drift", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const result = await page.evaluate(async () => {
    const stage = document.querySelector<HTMLElement>(
      '[data-reconciliation-case="solve-x"] [data-case-stage]'
    )!;
    const sourceX = stage.querySelector<HTMLElement>(
      "[data-case-source] .mord.mathnormal"
    )!;
    const targetX = stage.querySelector<HTMLElement>(
      "[data-case-target] .mord.mathnormal"
    )!;
    sourceX.dataset["kpMotionId"] = "motion.solve-x.handoff-source";
    targetX.dataset["kpMotionId"] = "motion.solve-x.handoff-target";
    const layer = document.createElement("span");
    layer.dataset["kpEditorEquationMaterialLayer"] = "true";
    stage.append(layer);
    // @ts-expect-error Vite resolves browser-side source modules.
    const observer = await import("/src/rendering/native-katex-fragment-observer.ts");
    // @ts-expect-error Vite resolves browser-side source modules.
    const compositor = await import("/src/rendering/native-katex-glyph-compositor.ts");
    const observed = observer.observeKpNativeKatexFragments({
      stage,
      bindings: [{
        id: "fragment.handoff.source",
        semanticEntityId: "entity.source.x",
        motionId: "motion.solve-x.handoff-source",
        glyphKey: "x"
      }, {
        id: "fragment.handoff.target",
        semanticEntityId: "entity.target.x",
        motionId: "motion.solve-x.handoff-target",
        glyphKey: "x"
      }],
      fontRevision: 1
    }).fragments;
    const clone = compositor.createKpNativeKatexFragmentClone({
      stage,
      ownerId: "owner.solve-x.handoff",
      observation: observed[0]!
    });
    const before = compositor.applyKpNativeKatexGlyphFrame({
      clone,
      source: observed[0]!,
      target: observed[1]!,
      progress: 0.999999
    });
    const atTarget = compositor.applyKpNativeKatexGlyphFrame({
      clone,
      source: observed[0]!,
      target: observed[1]!,
      progress: 1
    });
    const stageRect = stage.getBoundingClientRect();
    const ownerRect = clone.ownerElement.getBoundingClientRect();
    const visualRect = clone.visualElement.getBoundingClientRect();
    const targetRect = targetX.getBoundingClientRect();
    const scaleX = stageRect.width / stage.offsetWidth;
    const scaleY = stageRect.height / stage.offsetHeight;
    const ownerDelta = Math.max(
      Math.abs(ownerRect.left - targetRect.left) / scaleX,
      Math.abs(ownerRect.top - targetRect.top) / scaleY,
      Math.abs(ownerRect.width - targetRect.width) / scaleX,
      Math.abs(ownerRect.height - targetRect.height) / scaleY
    );
    const visualDelta = Math.max(
      Math.abs(visualRect.left - targetRect.left) / scaleX,
      Math.abs(visualRect.top - targetRect.top) / scaleY,
      Math.abs(visualRect.width - targetRect.width) / scaleX,
      Math.abs(visualRect.height - targetRect.height) / scaleY
    );
    return {
      beforeDelta: before.targetHandoffDeltaPx,
      atTargetDelta: atTarget.targetHandoffDeltaPx,
      ownerDelta,
      visualDelta,
      sourceFingerprint: observed[0]!.styleFingerprint,
      targetFingerprint: observed[1]!.styleFingerprint,
      visualOwner: atTarget.visualOwner
    };
  });

  expect(result.beforeDelta).toBeLessThan(0.01);
  expect(result.atTargetDelta).toBe(0);
  expect(result.ownerDelta).toBeLessThanOrEqual(1);
  expect(result.visualDelta).toBeLessThanOrEqual(1);
  expect(result.sourceFingerprint).toBe(result.targetFingerprint);
  expect(result.visualOwner).toBe("target-native");
});

test("persistent context reflows continuously while only local context departs", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const result = await page.evaluate(async () => {
    // @ts-expect-error Vite resolves browser-side source modules.
    const compositor = await import("/src/rendering/native-katex-glyph-compositor.ts");
    const stage = document.querySelector<HTMLElement>(
      '[data-reconciliation-case="solve-x"] [data-case-stage]'
    )!;
    const sourceEquation = stage.querySelector<HTMLElement>(
      "[data-case-source]"
    )!;
    const targetEquation = stage.querySelector<HTMLElement>(
      "[data-case-target]"
    )!;
    const persistent = document.createElement("span");
    persistent.textContent = "= 7 − 3";
    const departing = document.createElement("span");
    departing.textContent = "+ 3 − 3";
    stage.append(persistent, departing);
    const samples = [0, 0.25, 0.5, 0.75, 1].map((progress) =>
      compositor.applyKpNativeKatexContextReflow({
        persistentElement: persistent,
        persistentSourceRect: {
          left: 300,
          top: 100,
          width: 80,
          height: 24
        },
        persistentTargetRect: {
          left: 210,
          top: 100,
          width: 80,
          height: 24
        },
        departingElements: [departing],
        reflowProgress: progress,
        departureProgress: progress
      })
    );
    return {
      samples,
      sourceEquationOpacity: sourceEquation.style.opacity,
      targetEquationOpacity: targetEquation.style.opacity,
      persistentOpacity: persistent.style.opacity
    };
  });

  expect(result.samples.map(({ translateX }) => translateX)).toEqual([
    0,
    -14.0625,
    -45,
    -75.9375,
    -90
  ]);
  expect(result.samples.map(({ departingOpacity }) => departingOpacity)).toEqual([
    1,
    0.84375,
    0.5,
    0.15625,
    0
  ]);
  expect(result.persistentOpacity).toBe("");
  expect(result.sourceEquationOpacity).toBe("1");
  expect(result.targetEquationOpacity).toBe("0");
});

test("solve-x exemplar moves one real x without crossfade or character substitution", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const samples = await page.evaluate(() => {
    const review = document.querySelector<HTMLElement>(
      "[data-kp-glyph-review]"
    )!;
    const slider = document.querySelector<HTMLInputElement>("[data-progress]")!;
    const source = document.querySelector<HTMLElement>("[data-case-source]")!;
    const target = document.querySelector<HTMLElement>("[data-case-target]")!;
    const context = document.querySelector<HTMLElement>("[data-case-context]")!;
    const departing = document.querySelector<HTMLElement>(
      "[data-case-departing]"
    )!;
    const owner = document.querySelector<HTMLElement>(
      "[data-kp-native-katex-fragment-clone]"
    )!;
    const visual = owner.firstElementChild as HTMLElement;
    return [0, 250, 500, 750, 1000].map((progress) => {
      slider.value = String(progress);
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      const rect = owner.getBoundingClientRect();
      return {
        progress,
        visualOwner: review.dataset["kpVisualOwner"],
        sourceText: source.textContent,
        targetText: target.textContent,
        cloneText: visual.textContent,
        sourceOpacity: Number(source.style.opacity),
        cloneOpacity: Number(owner.style.opacity),
        targetOpacity: Number(target.style.opacity),
        cloneLeft: rect.left,
        cloneTop: rect.top,
        contextOpacity: context.style.opacity,
        departingOpacity: Number(departing.style.opacity)
      };
    });
  });

  expect(samples.map(({ visualOwner }) => visualOwner)).toEqual([
    "source-native",
    "source-native",
    "clone-transit",
    "clone-transit",
    "target-native"
  ]);
  expect(samples.map(({ cloneLeft }) => cloneLeft)).toEqual(
    [...samples.map(({ cloneLeft }) => cloneLeft)].sort((a, b) => a - b)
  );
  for (const sample of samples) {
    expect(sample.sourceText).toMatch(/^x+$/);
    expect(sample.targetText).toMatch(/^x+$/);
    expect(sample.cloneText).toMatch(/^x+$/);
    expect(
      sample.sourceOpacity + sample.cloneOpacity + sample.targetOpacity
    ).toBe(1);
    expect(sample.contextOpacity).toBe("");
    expect(sample.cloneTop).toBeCloseTo(samples[0]!.cloneTop, 1);
  }
  expect(samples[1]!.departingOpacity).toBe(0);
});

test("fraction merge settles one native denominator with Cloze authority", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=1000");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const fraction = page.locator('[data-reconciliation-case="fraction-merge"]');
  const target = fraction.locator(
    '[data-kp-motion-id="motion.fraction.target-denominator"]'
  );
  const sceneOwners = fraction.locator("[data-kp-native-katex-scene-owner]");

  await expect(fraction).toHaveCount(1);
  expect(await sceneOwners.count()).toBeGreaterThan(5);
  await expect(target).toHaveText("2");
  await expect(target).toHaveAttribute(
    "data-kp-semantic-selector-id",
    "equation.numerator-split-merge.combined.fraction.denominator.2"
  );
  await expect(target).toHaveAttribute("tabindex", "0");
  await expect(sceneOwners.first()).toHaveAttribute("aria-hidden", "true");
  expect(await sceneOwners.evaluateAll((elements) =>
    elements.every((element) =>
      !element.hasAttribute("data-kp-semantic-selector-id") &&
      !element.hasAttribute("tabindex") &&
      element.hasAttribute("inert")
    )
  )).toBe(true);

  await fraction.locator("[data-fraction-cloze]").click();
  await expect(target).toHaveAttribute("data-kp-cloze-hidden", "true");
  await expect(target).toHaveClass(/glyph-exemplar__cloze-hidden/);
  await expect(fraction.locator("[data-fraction-cloze]")).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

test("fraction semantic affordances remain native through seek and rewind", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const fraction = page.locator('[data-reconciliation-case="fraction-merge"]');
  const source = fraction.locator("[data-fraction-source]");
  const targetRoot = fraction.locator("[data-fraction-target]");
  const target = fraction.locator(
    '[data-kp-motion-id="motion.fraction.target-denominator"]'
  );
  const stage = fraction.locator("[data-fraction-stage]");
  const slider = fraction.locator("[data-progress]");

  await expect(source).toHaveAttribute("aria-hidden", "false");
  await expect(source).not.toHaveAttribute("inert", "");
  await expect(targetRoot).toHaveAttribute("aria-hidden", "true");
  await expect(targetRoot).toHaveAttribute("inert", "");
  await expect(stage).toHaveAttribute(
    "data-kp-fraction-semantic-owner",
    "source-native"
  );

  await slider.fill("500");
  await slider.dispatchEvent("input");
  await expect(source).toHaveAttribute("aria-hidden", "true");
  await expect(targetRoot).toHaveAttribute("aria-hidden", "true");
  await expect(source).toHaveAttribute("inert", "");
  await expect(targetRoot).toHaveAttribute("inert", "");
  await expect(target).toHaveAttribute("tabindex", "-1");
  await expect(stage).toHaveAttribute(
    "data-kp-fraction-semantic-owner",
    "stage-description"
  );
  await expect(stage).toHaveAttribute("aria-label", /Transforming/);

  await slider.fill("1000");
  await slider.dispatchEvent("input");
  await expect(source).toHaveAttribute("aria-hidden", "true");
  await expect(source).toHaveAttribute("inert", "");
  await expect(targetRoot).toHaveAttribute("aria-hidden", "false");
  await expect(targetRoot).not.toHaveAttribute("inert", "");
  await expect(target).toHaveAttribute("tabindex", "0");
  await target.focus();
  await expect(target).toBeFocused();

  await fraction.locator("[data-fraction-cloze]").click();
  await slider.fill("0");
  await slider.dispatchEvent("input");
  await slider.fill("1000");
  await slider.dispatchEvent("input");
  await expect(target).toHaveClass(/glyph-exemplar__cloze-hidden/);
  await expect(target).toHaveAttribute("data-kp-cloze-hidden", "true");
  await expect(target).toHaveAttribute("tabindex", "0");
});

test("plus-minus split preserves live branch choice through seek and rewind", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=1000");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const branch = page.locator(
    '[data-reconciliation-case="plus-minus-branch"]'
  );
  const minus = branch.locator('[data-kp-branch-id="minus"]');
  const plus = branch.locator('[data-kp-branch-id="plus"]');
  const clones = branch.locator("[data-kp-native-katex-fragment-clone]");
  const slider = page.locator("[data-progress]").first();

  await expect(clones).toHaveCount(2);
  await expect(minus).toHaveAttribute("tabindex", "0");
  await expect(plus).toHaveAttribute("tabindex", "0");
  await expect(minus).toHaveAttribute(
    "data-kp-annotation",
    "Negative quadratic root branch"
  );
  expect(await clones.evaluateAll((elements) =>
    elements.every((element) =>
      element.getAttribute("aria-hidden") === "true" &&
      !element.hasAttribute("data-kp-branch-id")
    )
  )).toBe(true);

  await branch.locator('[data-branch-choice="minus"]').click();
  await expect(branch.locator('[data-branch-choice="minus"]')).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(branch.locator('[data-branch-target="minus"]')).toHaveAttribute(
    "aria-hidden",
    "false"
  );
  await expect(branch.locator('[data-branch-target="plus"]')).toHaveAttribute(
    "aria-hidden",
    "true"
  );

  await slider.fill("0");
  await slider.dispatchEvent("input");
  await slider.fill("1000");
  await slider.dispatchEvent("input");
  await expect(branch.locator('[data-branch-choice="minus"]')).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(branch.locator('[data-branch-target="plus"]')).toHaveAttribute(
    "aria-hidden",
    "true"
  );
  await expect(minus).toHaveAttribute("tabindex", "0");
  await expect(plus).toHaveAttribute("tabindex", "-1");
});

test("crowded quadratic uses the same bounded schedule at wide and phone widths", async ({
  page
}) => {
  for (const viewport of [
    { width: 1440, height: 950 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/glyph-reconciliation-experiment.html?progress=500");
    await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
    const evidence = await page.evaluate(() => {
      const review = document.querySelector<HTMLElement>(
        "[data-kp-glyph-review]"
      )!;
      const caseElement = document.querySelector<HTMLElement>(
        '[data-reconciliation-case="crowded-quadratic"]'
      )!;
      const stage = caseElement.querySelector<HTMLElement>(
        "[data-crowded-stage]"
      )!;
      const stageRect = stage.getBoundingClientRect();
      const protectedInk = caseElement.querySelector<HTMLElement>(
        '[data-kp-motion-id="motion.crowded.source-plus-minus"]'
      )!.getBoundingClientRect();
      const cloneRects = [
        ...caseElement.querySelectorAll<HTMLElement>(
          "[data-kp-native-katex-fragment-clone]"
        )
      ].map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          ariaHidden: element.getAttribute("aria-hidden")
        };
      });
      return {
        routeStatuses: review.dataset["kpCrowdedRouteStatuses"]?.split(","),
        disposition: review.dataset["kpCrowdedDisposition"],
        dispositionReason: review.dataset["kpCrowdedDispositionReason"],
        protectedOpacity: getComputedStyle(
          caseElement.querySelector<HTMLElement>(
            '[data-kp-motion-id="motion.crowded.source-plus-minus"]'
          )!
        ).opacity,
        protectedInk: {
          left: protectedInk.left,
          top: protectedInk.top,
          right: protectedInk.right,
          bottom: protectedInk.bottom
        },
        cloneRects,
        stageRect: {
          left: stageRect.left,
          top: stageRect.top,
          right: stageRect.right,
          bottom: stageRect.bottom
        },
        overflow:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      };
    });

    expect(evidence.routeStatuses).toHaveLength(3);
    expect(evidence.routeStatuses?.every((status) =>
      status === "clearance-route" || status === "settle"
    )).toBe(true);
    expect(evidence.disposition).toBe("checkpoint-settlement");
    expect(evidence.dispositionReason).toBe("blocked-geometry");
    expect(evidence.protectedOpacity).toBe("1");
    expect(evidence.overflow).toBeLessThanOrEqual(1);
    expect(evidence.cloneRects.every((rect) =>
      rect.left >= evidence.stageRect.left - 1 &&
      rect.right <= evidence.stageRect.right + 1 &&
      rect.top >= evidence.stageRect.top - 1 &&
      rect.bottom <= evidence.stageRect.bottom + 1 &&
      rect.ariaHidden === "true"
    ), JSON.stringify({ viewport, evidence })).toBe(true);
  }

  await page.locator("[data-progress]").first().fill("1000");
  await page.locator("[data-progress]").first().dispatchEvent("input");
  await expect(page.locator(
    '[data-reconciliation-case="crowded-quadratic"] ' +
    '[data-kp-motion-id="motion.crowded.target-result"]'
  )).toHaveText("1");
});

test("compound trace depicts every operation and restores its paused parent", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=371");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const trace = page.locator("[data-compound-trace]");
  const slider = page.locator("[data-progress]").first();
  const operations = trace.locator("[data-trace-operation]");

  await expect(operations).toHaveCount(10);
  await trace.locator("[data-trace-inspect]").click();
  await expect(trace).toHaveAttribute("data-trace-mode", "full-detail");
  await expect(trace).toHaveAttribute("data-trace-parent-progress", "0.371");
  await expect(slider).toBeDisabled();
  await expect(trace.locator("[data-trace-detail-operation]")).toHaveCount(10);

  await trace.locator("[data-trace-inspect]").click();
  await expect(trace).toHaveAttribute("data-trace-mode", "compressed");
  await expect(trace).toHaveAttribute("data-trace-restore-exact", "true");
  await expect(slider).toHaveValue("371");
  await expect(slider).toBeEnabled();

  await trace.locator("[data-trace-play]").click();
  await expect(trace).toHaveAttribute("data-trace-completed-cycles", "1", {
    timeout: 4_000
  });
  await expect(trace.locator(
    '[data-trace-operation][data-trace-state="complete"]'
  )).toHaveCount(10);
});

test("every equation card exposes synchronized local playback controls", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  const review = page.locator('[data-kp-glyph-review][data-kp-ready="true"]');
  await review.waitFor();
  const cards = page.locator("[data-reconciliation-case]");
  const controls = cards.locator("[data-playback-controls]");
  const sliders = controls.locator("[data-progress]");
  const playButtons = controls.locator("[data-play]");
  const statuses = controls.locator("[data-status]");

  await expect(cards).toHaveCount(4);
  await expect(controls).toHaveCount(4);
  await expect(sliders).toHaveCount(4);
  await expect(playButtons).toHaveCount(4);
  await expect(statuses).toHaveCount(4);

  await sliders.nth(1).fill("500");
  await sliders.nth(1).dispatchEvent("input");
  await expect(review).toHaveAttribute("data-kp-progress", "500");
  for (let index = 0; index < 4; index += 1) {
    await expect(sliders.nth(index)).toHaveValue("500");
    await expect(statuses.nth(index)).toHaveText("50%");
  }

  await playButtons.nth(3).click();
  for (let index = 0; index < 4; index += 1) {
    await expect(sliders.nth(index)).toHaveValue("1000", { timeout: 1_500 });
    await expect(playButtons.nth(index)).toHaveText("Rewind");
  }
});

test("reduced motion uses exact endpoint settlement without transit", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  const review = page.locator('[data-kp-glyph-review][data-kp-ready="true"]');
  await review.waitFor();

  await page.locator("[data-play]").first().click();
  await expect(review).toHaveAttribute("data-kp-progress", "1000");
  await expect(review).toHaveAttribute("data-kp-visual-owner", "target-native");
  await expect(page.locator("[data-progress]").first()).toHaveValue("1000");

  const trace = page.locator("[data-compound-trace]");
  await trace.locator("[data-trace-play]").click();
  await expect(trace).toHaveAttribute("data-trace-completed-cycles", "1");
  await expect(trace.locator(
    '[data-trace-operation][data-trace-state="complete"]'
  )).toHaveCount(10);
});

test("phone branch equations remain fully inside their presentation stage", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/glyph-reconciliation-experiment.html?progress=500");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const geometry = await page.locator(
    '[data-reconciliation-case="plus-minus-branch"]'
  ).evaluate((caseElement) => {
    const stage = caseElement.querySelector<HTMLElement>(
      "[data-branch-stage]"
    )!.getBoundingClientRect();
    const targets = [
      ...caseElement.querySelectorAll<HTMLElement>("[data-branch-target]")
    ].map((element) => element.getBoundingClientRect());
    return {
      stage: { left: stage.left, right: stage.right },
      targets: targets.map(({ left, right }) => ({ left, right }))
    };
  });

  expect(geometry.targets.every(({ left, right }) =>
    left >= geometry.stage.left - 1 && right <= geometry.stage.right + 1
  ), JSON.stringify(geometry)).toBe(true);
});
