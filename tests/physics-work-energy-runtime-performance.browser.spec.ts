import { expect, test } from "@playwright/test";

const animationId = "animation.physics.constant-force-work-energy";
const sampleProgress = [
  0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32,
  0.36, 0.4, 0.44, 0.48, 0.52, 0.56, 0.6, 0.64,
  0.68, 0.72, 0.76, 0.8, 0.84, 0.88, 0.92, 0.96
] as const;

test("physics SVG baseline measures frame rebuild and retained shell identity", async ({
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

  await page.evaluate(() => {
    const svg = document.querySelector<SVGSVGElement>("[data-kp-editor-graph-svg]");
    const content = svg?.querySelector<SVGGElement>(
      "[data-kp-editor-graph-content]"
    );
    if (svg === null || svg === undefined || content === null || content === undefined) {
      throw new Error("Physics performance probe requires the mounted SVG shell.");
    }
    const baseline = {
      svg,
      content,
      view: content.querySelector("[data-kp-physics-work-energy-view]"),
      workArea: content.querySelector("[data-kp-physics-work-area]"),
      description: content.querySelector("[data-kp-physics-nonvisual-summary]"),
      math: content.querySelector('[data-kp-physics-equation-role="work"]'),
      childListMutations: 0,
      addedNodes: 0,
      removedNodes: 0,
      observer: undefined as MutationObserver | undefined
    };
    baseline.observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type !== "childList") continue;
        baseline.childListMutations += 1;
        baseline.addedNodes += record.addedNodes.length;
        baseline.removedNodes += record.removedNodes.length;
      }
    });
    baseline.observer.observe(content, { childList: true, subtree: true });
    (window as typeof window & {
      __kpPhysicsSvgBaseline?: typeof baseline;
    }).__kpPhysicsSvgBaseline = baseline;
  });

  const samples: PhysicsIdentitySample[] = [];
  for (const progress of sampleProgress) {
    await scrubber.fill(String(progress));
    await expect(player).toHaveAttribute(
      "data-kp-editor-animation-progress",
      String(progress)
    );
    samples.push(await page.evaluate(() => {
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
          '[data-kp-physics-equation-role="work"]'
        ),
        accessible: baseline.svg.getAttribute("aria-describedby") ===
          "kp-physics-work-energy-description" &&
          baseline.content.querySelector("#kp-physics-work-energy-description") !== null,
        serializedCharacters: baseline.content.innerHTML.length
      };
    }));
  }
  await page.evaluate(() => new Promise<void>((resolve) => queueMicrotask(resolve)));
  const mutations = await page.evaluate(() => {
    const baseline = (window as typeof window & {
      __kpPhysicsSvgBaseline?: PhysicsBrowserBaseline;
    }).__kpPhysicsSvgBaseline;
    if (baseline === undefined) throw new Error("Physics baseline was not installed.");
    baseline.observer?.disconnect();
    return {
      childListMutations: baseline.childListMutations,
      addedNodes: baseline.addedNodes,
      removedNodes: baseline.removedNodes
    };
  });
  const report = {
    schemaVersion: "kp.physics-svg-runtime-baseline.v1",
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
    serializedCharacters: samples.reduce(
      (total, sample) => total + sample.serializedCharacters,
      0
    ),
    ...mutations
  } as const;

  console.log("KP physics SVG runtime baseline");
  console.log(JSON.stringify(report, null, 2));
  expect(report).toMatchObject({
    schemaVersion: "kp.physics-svg-runtime-baseline.v1",
    sampleCount: 24,
    retainedShellSamples: 24,
    retainedViewSamples: 0,
    retainedWorkAreaSamples: 0,
    retainedDescriptionSamples: 0,
    retainedMathSamples: 0,
    accessibleSamples: 24
  });
  expect(report.childListMutations).toBeGreaterThanOrEqual(report.sampleCount);
  expect(report.addedNodes).toBeGreaterThanOrEqual(report.sampleCount);
  expect(report.removedNodes).toBeGreaterThanOrEqual(report.sampleCount);
  expect(report.serializedCharacters).toBeGreaterThan(0);
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
}

interface PhysicsBrowserBaseline {
  readonly svg: SVGSVGElement;
  readonly content: SVGGElement;
  readonly view: Element | null;
  readonly workArea: Element | null;
  readonly description: Element | null;
  readonly math: Element | null;
  childListMutations: number;
  addedNodes: number;
  removedNodes: number;
  observer?: MutationObserver | undefined;
}
