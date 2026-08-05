import { expect, test } from "@playwright/test";

const animationId = "animation.physics.constant-force-work-energy";
const solveXId = "animation.linear-solve.solve-x";
const sampleProgress = [
  0, 0.04, 0.08, 0.12, 0.14, 0.16, 0.2, 0.24, 0.28, 0.32,
  0.36, 0.4, 0.44, 0.48, 0.52, 0.56, 0.6, 0.64,
  0.68, 0.72, 0.76, 0.78, 0.8, 0.84, 0.88, 0.92, 0.96, 1
] as const;
const revisitProgress = [
  0.48, 0.04, 0.92, 0.2, 0.76, 0.14,
  1, 0.56, 0.32, 0.84, 0, 0.68
] as const;

test("physics retained SVG session preserves frame and KaTeX identity", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const graph = player.locator("[data-kp-editor-graph-svg]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  await expect(player).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  await expect(graph).toHaveAttribute(
    "aria-describedby",
    "kp-physics-work-energy-description"
  );
  const expectedFrames = await expectedPhysicsFrames(page, sampleProgress);

  await page.evaluate(() => {
    const svg = document.querySelector<SVGSVGElement>("[data-kp-editor-graph-svg]");
    const content = svg?.querySelector<SVGGElement>(
      "[data-kp-editor-graph-content]"
    );
    if (svg === null || svg === undefined || content === null || content === undefined) {
      throw new Error("Physics performance probe requires the mounted SVG shell.");
    }
    const readFrame = (): PhysicsDomFrame => {
      const view = content.querySelector("[data-kp-physics-work-energy-view]");
      const workArea = content.querySelector("[data-kp-physics-work-area]");
      const object = content.querySelector("[data-kp-physics-object-position]");
      const forceLine = content.querySelector(
        "[data-kp-physics-constant-force-line]"
      );
      const workBoundary = content.querySelector("[data-kp-physics-work-boundary]");
      const attributes = (element: Element | null, names: readonly string[]) =>
        names.map((name) => element?.getAttribute(name) ?? null);
      if (svg.getAttribute("aria-describedby") !==
          "kp-physics-work-energy-description") {
        throw new Error("Physics retained frame lost its accessible description owner.");
      }
      return {
        stage: view?.getAttribute("data-kp-physics-choreography-stage") ?? null,
        phase: view?.getAttribute("data-kp-physics-work-energy-phase") ?? null,
        position: view?.getAttribute("data-kp-physics-position") ?? null,
        force: view?.getAttribute("data-kp-physics-net-force") ?? null,
        work: workArea?.getAttribute("data-kp-physics-work-area") ?? null,
        displacement: content.querySelector("[data-kp-physics-displacement]")
          ?.getAttribute("data-kp-physics-displacement") ?? null,
        energy: content.querySelector("[data-kp-physics-energy-total]")
          ?.getAttribute("data-kp-physics-energy-total") ?? null,
        energyWork: content.querySelector("[data-kp-physics-energy-work]")
          ?.getAttribute("data-kp-physics-energy-work") ?? null,
        workLatex: content.querySelector('[data-kp-physics-equation-role="work"]')
          ?.getAttribute("data-kp-latex") ?? null,
        energyLatex: content.querySelector('[data-kp-physics-equation-role="energy"]')
          ?.getAttribute("data-kp-latex") ?? null,
        narrativeId: content.querySelector("[data-kp-physics-synchronized-view]")
          ?.getAttribute("data-kp-physics-narrative-id") ?? null,
        description: content.querySelector("[data-kp-physics-nonvisual-summary]")
          ?.textContent ?? null,
        workAreaGeometry: attributes(workArea, ["x", "y", "width", "height"]),
        objectGeometry: attributes(object, ["x", "y", "width", "height"]),
        forceLineGeometry: attributes(forceLine, ["x1", "y1", "x2", "y2"]),
        workBoundaryGeometry: attributes(
          workBoundary,
          ["x1", "y1", "x2", "y2"]
        )
      };
    };
    const baseline = {
      svg,
      content,
      view: content.querySelector("[data-kp-physics-work-energy-view]"),
      workArea: content.querySelector("[data-kp-physics-work-area]"),
      description: content.querySelector("[data-kp-physics-nonvisual-summary]"),
      math: content.querySelector(
        '[data-kp-physics-equation-role="work"] .katex'
      ),
      rootChildListMutations: 0,
      descendantChildListMutations: 0,
      characterDataMutations: 0,
      addedNodes: 0,
      removedNodes: 0,
      readFrame,
      observer: undefined as MutationObserver | undefined
    };
    baseline.observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData") {
          baseline.characterDataMutations += 1;
          continue;
        }
        if (record.type !== "childList") continue;
        if (record.target === content) baseline.rootChildListMutations += 1;
        else baseline.descendantChildListMutations += 1;
        baseline.addedNodes += record.addedNodes.length;
        baseline.removedNodes += record.removedNodes.length;
      }
    });
    baseline.observer.observe(content, {
      childList: true,
      subtree: true,
      characterData: true
    });
    (window as typeof window & {
      __kpPhysicsSvgBaseline?: typeof baseline;
    }).__kpPhysicsSvgBaseline = baseline;
  });

  const samples: PhysicsIdentitySample[] = [];
  const semanticFrames = new Map<string, PhysicsDomFrame>();
  const seekSequence = [
    ...sampleProgress,
    ...[...sampleProgress].reverse(),
    ...revisitProgress
  ];
  for (const progress of seekSequence) {
    await scrubber.fill(String(progress));
    await expect(player).toHaveAttribute(
      "data-kp-editor-animation-progress",
      String(progress)
    );
    const sample = await page.evaluate(() => {
      const baseline = (window as typeof window & {
        __kpPhysicsSvgBaseline?: PhysicsBrowserBaseline;
      }).__kpPhysicsSvgBaseline;
      if (baseline === undefined) throw new Error("Physics baseline was not installed.");
      return {
        svgPreserved: baseline.svg === document.querySelector(
          "[data-kp-editor-graph-svg]"
        ),
        contentPreserved: baseline.content === document.querySelector(
          "[data-kp-editor-graph-content]"
        ),
        viewPreserved: baseline.view === baseline.content.querySelector(
          "[data-kp-physics-work-energy-view]"
        ),
        workAreaPreserved: baseline.workArea === baseline.content.querySelector(
          "[data-kp-physics-work-area]"
        ),
        descriptionPreserved: baseline.description === baseline.content.querySelector(
          "[data-kp-physics-nonvisual-summary]"
        ),
        mathPreserved: baseline.math === baseline.content.querySelector(
          '[data-kp-physics-equation-role="work"] .katex'
        ),
        accessible: baseline.svg.getAttribute("aria-describedby") ===
          "kp-physics-work-energy-description" &&
          baseline.content.querySelector("#kp-physics-work-energy-description") !== null,
        serializedCharacters: baseline.content.innerHTML.length,
        frame: baseline.readFrame()
      };
    });
    samples.push(sample);
    const key = String(progress);
    expect(sample.frame).toEqual(expectedFrames.get(key));
    const prior = semanticFrames.get(key);
    if (prior === undefined) semanticFrames.set(key, sample.frame);
    else expect(sample.frame).toEqual(prior);
  }
  await page.evaluate(() => new Promise<void>((resolve) => queueMicrotask(resolve)));
  const mutations = await page.evaluate(() => {
    const baseline = (window as typeof window & {
      __kpPhysicsSvgBaseline?: PhysicsBrowserBaseline;
    }).__kpPhysicsSvgBaseline;
    if (baseline === undefined) throw new Error("Physics baseline was not installed.");
    baseline.observer?.disconnect();
    return {
      rootChildListMutations: baseline.rootChildListMutations,
      descendantChildListMutations: baseline.descendantChildListMutations,
      characterDataMutations: baseline.characterDataMutations,
      addedNodes: baseline.addedNodes,
      removedNodes: baseline.removedNodes
    };
  });
  const report = {
    schemaVersion: "kp.physics-retained-svg-runtime.v1",
    sampleCount: samples.length,
    retainedShellSamples: samples.filter(
      ({ svgPreserved, contentPreserved }) => svgPreserved && contentPreserved
    ).length,
    retainedViewSamples: samples.filter(({ viewPreserved }) => viewPreserved).length,
    retainedWorkAreaSamples: samples.filter(
      ({ workAreaPreserved }) => workAreaPreserved
    ).length,
    retainedDescriptionSamples: samples.filter(
      ({ descriptionPreserved }) => descriptionPreserved
    ).length,
    retainedMathSamples: samples.filter(({ mathPreserved }) => mathPreserved).length,
    accessibleSamples: samples.filter(({ accessible }) => accessible).length,
    exactFrameSamples: samples.length,
    revisitedFrameCount: seekSequence.length - sampleProgress.length,
    observedMarkupCharacters: samples.reduce(
      (total, sample) => total + sample.serializedCharacters,
      0
    ),
    ...mutations
  } as const;

  console.log("KP physics retained SVG runtime");
  console.log(JSON.stringify(report, null, 2));
  expect(report).toMatchObject({
    schemaVersion: "kp.physics-retained-svg-runtime.v1",
    sampleCount: 68,
    retainedShellSamples: 68,
    retainedViewSamples: 68,
    retainedWorkAreaSamples: 68,
    retainedDescriptionSamples: 68,
    retainedMathSamples: 68,
    accessibleSamples: 68,
    exactFrameSamples: 68,
    revisitedFrameCount: 40
  });
  expect(report.rootChildListMutations).toBe(0);
  expect(report.descendantChildListMutations).toBe(0);
  expect(report.addedNodes).toBe(0);
  expect(report.removedNodes).toBe(0);
  expect(report.characterDataMutations).toBeGreaterThan(0);
  expect(report.observedMarkupCharacters).toBeGreaterThan(0);
});

test("physics parameters and accessibility retain nodes until terminal disposal", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/?artifact=${animationId}`);
  const shell = page.locator("[data-kp-animation-catalogue]");
  const player = shell.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  await expect(player).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-accessibility-mode",
    "reduced-motion"
  );
  await page.evaluate(() => {
    const content = document.querySelector<SVGGElement>(
      "[data-kp-editor-graph-content]"
    );
    if (content === null) throw new Error("Physics retained content is missing.");
    (window as typeof window & {
      __kpPhysicsLifecycle?: {
        readonly content: SVGGElement;
        readonly view: Element | null;
        readonly description: Element | null;
        readonly math: Element | null;
      };
    }).__kpPhysicsLifecycle = {
      content,
      view: content.querySelector("[data-kp-physics-work-energy-view]"),
      description: content.querySelector("[data-kp-physics-nonvisual-summary]"),
      math: content.querySelector('[data-kp-physics-equation-role="work"] .katex')
    };
  });

  await scrubber.fill("0.46");
  await shell.locator(
    '[data-action="select-animation-catalogue-inspector"]'
  ).selectOption("parameters");
  await shell.locator('[data-action="set-physics-net-force"]').fill("5");
  await expect(player.locator("[data-kp-physics-work-area]"))
    .toHaveAttribute("data-kp-physics-work-area", "10");
  expect(await retainedLifecycleIdentity(page)).toEqual({
    content: true,
    view: true,
    description: true,
    math: true
  });

  await scrubber.fill("0.52");
  await expect(player.locator("#kp-physics-work-energy-description"))
    .toContainText("The net force is 5 newtons");
  await setPhysicsPresentationMode(page, "static");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-accessibility-mode",
    "static"
  );
  await scrubber.fill("0.78");
  await expect(player.locator("[data-kp-editor-graph-svg]"))
    .toHaveAttribute("aria-describedby", "kp-physics-work-energy-description");
  expect(await retainedLifecycleIdentity(page)).toEqual({
    content: true,
    view: true,
    description: true,
    math: true
  });

  await shell.locator(
    `[data-kp-animation-catalogue-row="${solveXId}"] ` +
    ".kp-animation-catalogue-shell__result-link"
  ).click();
  await expect(shell).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    solveXId
  );
  expect(await page.evaluate(() => {
    const lifecycle = (window as typeof window & {
      __kpPhysicsLifecycle?: PhysicsBrowserLifecycle;
    }).__kpPhysicsLifecycle;
    if (lifecycle === undefined) throw new Error("Physics lifecycle was not installed.");
    return {
      contentConnected: lifecycle.content.isConnected,
      viewConnected: lifecycle.view?.isConnected ?? false,
      retainedViewStillOwned:
        lifecycle.content.querySelector("[data-kp-physics-work-energy-view]") !== null
    };
  })).toEqual({
    contentConnected: false,
    viewConnected: false,
    retainedViewStillOwned: false
  });
});

interface PhysicsIdentitySample {
  readonly svgPreserved: boolean;
  readonly contentPreserved: boolean;
  readonly viewPreserved: boolean;
  readonly workAreaPreserved: boolean;
  readonly descriptionPreserved: boolean;
  readonly mathPreserved: boolean;
  readonly accessible: boolean;
  readonly serializedCharacters: number;
  readonly frame: PhysicsDomFrame;
}

interface PhysicsBrowserBaseline {
  readonly svg: SVGSVGElement;
  readonly content: SVGGElement;
  readonly view: Element | null;
  readonly workArea: Element | null;
  readonly description: Element | null;
  readonly math: Element | null;
  rootChildListMutations: number;
  descendantChildListMutations: number;
  characterDataMutations: number;
  addedNodes: number;
  removedNodes: number;
  readonly readFrame: () => PhysicsDomFrame;
  observer?: MutationObserver | undefined;
}

interface PhysicsBrowserLifecycle {
  readonly content: SVGGElement;
  readonly view: Element | null;
  readonly description: Element | null;
  readonly math: Element | null;
}

interface PhysicsDomFrame {
  readonly stage: string | null;
  readonly phase: string | null;
  readonly position: string | null;
  readonly force: string | null;
  readonly work: string | null;
  readonly displacement: string | null;
  readonly energy: string | null;
  readonly energyWork: string | null;
  readonly workLatex: string | null;
  readonly energyLatex: string | null;
  readonly narrativeId: string | null;
  readonly description: string | null;
  readonly workAreaGeometry: readonly (string | null)[];
  readonly objectGeometry: readonly (string | null)[];
  readonly forceLineGeometry: readonly (string | null)[];
  readonly workBoundaryGeometry: readonly (string | null)[];
}

async function expectedPhysicsFrames(
  page: import("@playwright/test").Page,
  progressValues: readonly number[]
): Promise<Map<string, PhysicsDomFrame>> {
  const entries = await page.evaluate(async ({ values, paths }) => {
    const [adapter, runtime, sampler, synchronized, svgProjection, viewportModule] =
      await Promise.all([
        import(paths.adapter),
        import(paths.runtime),
        import(paths.sampler),
        import(paths.synchronized),
        import(paths.svgProjection),
        import(paths.viewport)
      ]);
    const animation = adapter.createConstantForceWorkEnergyAnimationAsset();
    const viewport = viewportModule.createKpEditorGraphSvgViewportModel(animation);
    const exactText = (value: { numerator: string; denominator: string }) =>
      value.denominator === "1"
        ? value.numerator
        : `${value.numerator}/${value.denominator}`;
    return values.map((progress) => {
      const frame = runtime.sampleKpConstantForceWorkEnergyRuntimeFrame({
        animation,
        runtimeFrame: sampler.sampleKpAnimationRuntimeFrame({
          animation,
          progress
        })
      });
      const view = synchronized.createKpConstantForceWorkEnergySynchronizedView(
        frame
      );
      const geometry = svgProjection.projectKpConstantForceWorkEnergySvgGeometry({
        frame: frame.semanticFrame,
        viewport
      });
      const state = frame.semanticFrame.state;
      return [String(progress), {
        stage: frame.stage,
        phase: frame.semanticFrame.phase,
        position: exactText(state.position),
        force: exactText(state.netForceMagnitude),
        work: exactText(state.accumulatedWork),
        displacement: exactText(state.displacement),
        energy: exactText(state.kineticEnergy),
        energyWork: exactText(state.accumulatedWork),
        workLatex: view.equations.workLatex,
        energyLatex: view.equations.energyLatex,
        narrativeId: view.narrative.id,
        description: view.nonvisualSummary,
        workAreaGeometry: [
          geometry.graphOrigin[0],
          geometry.currentTop[1],
          geometry.areaWidth,
          geometry.areaHeight
        ].map(String),
        objectGeometry: [
          geometry.blockX,
          geometry.blockY,
          geometry.blockWidth,
          geometry.blockHeight
        ].map(String),
        forceLineGeometry: [
          geometry.forceStart[0],
          geometry.forceStart[1],
          geometry.forceEnd[0],
          geometry.forceEnd[1]
        ].map(String),
        workBoundaryGeometry: [
          geometry.currentBase[0],
          geometry.currentBase[1],
          geometry.currentTop[0],
          geometry.currentTop[1]
        ].map(String)
      }] as const;
    });
  }, {
    values: [...progressValues],
    paths: {
      adapter: "/src/animation/constant-force-work-energy-adapter.ts",
      runtime: "/src/animation/constant-force-work-energy-runtime-frame.ts",
      sampler: "/src/animation/runtime-sampler.ts",
      synchronized:
        "/src/animation/constant-force-work-energy-synchronized-view.ts",
      svgProjection: "/src/rendering/constant-force-work-energy-svg.ts",
      viewport: "/src/editor/graph-svg-viewport.ts"
    }
  });
  return new Map(entries as readonly (readonly [string, PhysicsDomFrame])[]);
}

async function retainedLifecycleIdentity(
  page: import("@playwright/test").Page
): Promise<{ content: boolean; view: boolean; description: boolean; math: boolean }> {
  return page.evaluate(() => {
    const lifecycle = (window as typeof window & {
      __kpPhysicsLifecycle?: PhysicsBrowserLifecycle;
    }).__kpPhysicsLifecycle;
    if (lifecycle === undefined) throw new Error("Physics lifecycle was not installed.");
    return {
      content: lifecycle.content === document.querySelector(
        "[data-kp-editor-graph-content]"
      ),
      view: lifecycle.view === lifecycle.content.querySelector(
        "[data-kp-physics-work-energy-view]"
      ),
      description: lifecycle.description === lifecycle.content.querySelector(
        "[data-kp-physics-nonvisual-summary]"
      ),
      math: lifecycle.math === lifecycle.content.querySelector(
        '[data-kp-physics-equation-role="work"] .katex'
      )
    };
  });
}

async function setPhysicsPresentationMode(
  page: import("@playwright/test").Page,
  mode: "reduced-motion" | "static"
): Promise<void> {
  await page.evaluate((nextMode) => {
    const player = document.querySelector<HTMLElement>(
      '[data-kp-editor-animation-id="animation.physics.constant-force-work-energy"]'
    );
    if (player === null) throw new Error("Physics player is not mounted.");
    // The focused catalogue shell is compact, so exercise the same delegated
    // presentation input contract without making a hidden product control.
    const control = document.createElement("select");
    control.dataset["kpEditorAnimationAccessibilityControl"] = "";
    const option = document.createElement("option");
    option.value = nextMode;
    control.append(option);
    control.value = nextMode;
    player.append(control);
    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.remove();
  }, mode);
}
