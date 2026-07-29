import {
  expect,
  test,
  type Browser,
  type Page
} from "@playwright/test";
import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../src/reader/compiler/exact-fraction-quantity-preservation-manifest.ts";

const descriptorId =
  "editor-animation.animation.exact-fraction-quantity.third-plus-sixth";
const animationId =
  "animation.exact-fraction-quantity.third-plus-sixth";
const playerSelector =
  `[data-kp-editor-animation-player]` +
  `[data-kp-editor-animation-id="${animationId}"]`;
const committedSceneSelector =
  "[data-kp-exact-symbolic-scene]" +
  "[data-kp-prepared-scene-state=\"committed\"]";
const denseProgress = Object.freeze(
  manifest.browserAudit.denseProgressPermille.map(
    (progressPermille) => progressPermille / 1_000
  )
);

test("dense seek, reverse seek, and repeated scrub are paint deterministic", async ({
  page
}) => {
  test.setTimeout(90_000);
  const player = await openExactQuantity(page, {
    width: 1_100,
    height: 800
  });
  expect(await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.status;
  })).toBe("loaded");

  const forward = new Map<number, string>();
  for (const progress of denseProgress) {
    await seekAndSettle(page, player, progress);
    forward.set(progress, await paintFingerprint(player));
  }
  for (const progress of [...denseProgress].reverse()) {
    await seekAndSettle(page, player, progress);
    expect(await paintFingerprint(player)).toBe(forward.get(progress));
  }
  for (const progress of [0.401, 0.821, 0.181, 1, 0.56, 0.401]) {
    await seekAndSettle(page, player, progress);
    expect(await paintFingerprint(player)).toBe(forward.get(progress));
  }

  await seekAndSettle(page, player, 1);
  const leafFonts = await player.locator(
    `${committedSceneSelector} .katex-html`
  ).evaluateAll((roots) =>
    roots.flatMap((root) =>
      [...root.querySelectorAll<HTMLElement>("span")]
        .filter((element) =>
          element.children.length === 0 &&
          (element.textContent?.trim().length ?? 0) > 0
        )
        .map((element) => getComputedStyle(element).fontFamily)
    )
  );
  expect(leafFonts.length).toBeGreaterThan(0);
  expect(leafFonts.every((family) => family.includes("KaTeX"))).toBe(true);

  for (const endpoint of [0.18, 0.4, 0.56, 0.82, 1]) {
    await seekAndSettle(page, player, endpoint);
    await expect(player).toHaveAttribute(
      "data-kp-exact-paint-ownership",
      "target-native"
    );
    await expect(player.locator(
      committedSceneSelector
    )).toHaveAttribute("data-kp-exact-symbolic-status", "ready");
  }
});

test("captured regression moments retain opaque committed paint during scene preparation", async ({
  page
}) => {
  test.setTimeout(60_000);
  const player = await openExactQuantity(page, {
    width: 1_100,
    height: 800
  });
  await seekAndSettle(page, player, 0.29);
  const refinementSource = player.locator(
    `${committedSceneSelector} ` +
    "[data-kp-exact-symbolic-source]"
  );
  await expect(refinementSource).toHaveCSS("opacity", "1");
  await expect(refinementSource.locator(".katex-html")).toContainText("×");
  await expect(refinementSource.locator(".katex-html")).toContainText("2");
  for (const progress of [
    0.34,
    0.472,
    0.72,
    0.816,
    0.856,
    0.9,
    0.94,
    1
  ]) {
    await player.locator(
      "[data-action=\"seek-editor-animation\"]"
    ).fill(String(progress));
    const samples = await player.evaluate(async (root) => {
      const frames: Array<{
        committedCount: number;
        symbolicStatus?: string | undefined;
        sceneOpacity: number;
        visibleOwnerCount: number;
        fractionalOpacityCount: number;
        preparingCount: number;
      }> = [];
      const effectiveOpacity = (element: HTMLElement): number => {
        let opacity = 1;
        let current: HTMLElement | null = element;
        while (current !== null && current !== root) {
          opacity *= Number(getComputedStyle(current).opacity);
          current = current.parentElement;
        }
        return opacity;
      };
      for (let index = 0; index < 8; index += 1) {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve())
        );
        const committed = [
          ...root.querySelectorAll<HTMLElement>(
            "[data-kp-exact-symbolic-scene]" +
            "[data-kp-prepared-scene-state=\"committed\"]"
          )
        ];
        const owners = committed.flatMap((scene) => [
          ...scene.querySelectorAll<HTMLElement>(
            "[data-kp-exact-symbolic-source], " +
            "[data-kp-exact-symbolic-target], " +
            "[data-kp-equation-material-owner-id]"
          )
        ]);
        const opacities = owners.map(effectiveOpacity);
        frames.push({
          committedCount: committed.length,
          symbolicStatus:
            committed[0]?.dataset["kpExactSymbolicStatus"],
          sceneOpacity: committed.length === 1
            ? Number(getComputedStyle(committed[0]!).opacity)
            : 0,
          visibleOwnerCount: owners.filter((owner, ownerIndex) => {
            const rect = owner.getBoundingClientRect();
            return opacities[ownerIndex]! > 0.01 &&
              rect.width > 0 &&
              rect.height > 0;
          }).length,
          fractionalOpacityCount: opacities.filter((opacity) =>
            opacity !== 0 && opacity !== 1
          ).length,
          preparingCount: root.querySelectorAll(
            "[data-kp-prepared-scene-state=\"preparing\"]"
          ).length
        });
      }
      return frames;
    });
    expect(samples.every((sample) =>
      sample.committedCount === 1 &&
      sample.symbolicStatus === "ready" &&
      sample.sceneOpacity === 1 &&
      sample.visibleOwnerCount > 0 &&
      sample.fractionalOpacityCount === 0 &&
      sample.preparingCount <= 1
    ), JSON.stringify({ progress, samples })).toBe(true);
    await expect.poll(() => player.evaluate((root) => {
      const committed = root.querySelector<HTMLElement>(
        "[data-kp-exact-symbolic-scene]" +
        "[data-kp-prepared-scene-state=\"committed\"]"
      );
      return committed?.dataset["kpExactSymbolicSegment"] ===
        root.dataset["kpExactSymbolicSegment"];
    })).toBe(true);
    await page.evaluate(() => new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    ));
    const paintContact = await exactPaintContactEvidence(player, progress);
    expect(
      paintContact.violations,
      JSON.stringify({ progress, paintContact })
    ).toEqual([]);
  }
});

test("concrete views execute persistent atomic tracks without node replacement", async ({
  page
}) => {
  const player = await openExactQuantity(page, {
    width: 1_100,
    height: 800
  });
  await seekAndSettle(page, player, 0);
  const initialTransforms = await player.evaluate((root) => {
    const canvases = [
      ...root.querySelectorAll<HTMLElement>(
        "[data-kp-exact-view-canvas=\"partitioned-circle\"], " +
        "[data-kp-exact-view-canvas=\"fraction-bar\"], " +
        "[data-kp-exact-view-canvas=\"number-line\"]"
      )
    ];
    return canvases.map((canvas, canvasIndex) => {
      const svg = canvas.querySelector<SVGSVGElement>("svg");
      if (svg === null) throw new Error("Missing persistent concrete SVG.");
      svg.dataset["kpTestIdentity"] = `svg-${canvasIndex}`;
      return {
        view: canvas.dataset["kpExactViewCanvas"],
        transforms: [
          ...svg.querySelectorAll<SVGElement>("[data-kp-atomic-part-id]")
        ].map((element, atomIndex) => {
          element.dataset["kpTestIdentity"] =
            `atom-${canvasIndex}-${atomIndex}`;
          return element.style.transform;
        })
      };
    });
  });
  await seekAndSettle(page, player, 0.09);
  const animated = await player.evaluate((root) => [
    ...root.querySelectorAll<HTMLElement>(
      "[data-kp-exact-view-canvas=\"partitioned-circle\"], " +
      "[data-kp-exact-view-canvas=\"fraction-bar\"], " +
      "[data-kp-exact-view-canvas=\"number-line\"]"
    )
  ].map((canvas) => {
    const svg = canvas.querySelector<SVGSVGElement>("svg");
    if (svg === null) throw new Error("Missing persistent concrete SVG.");
    const atoms = [
      ...svg.querySelectorAll<SVGElement>("[data-kp-atomic-part-id]")
    ];
    return {
      view: canvas.dataset["kpExactViewCanvas"],
      renderer: canvas.dataset["kpExactMotionRenderer"],
      trackCount: canvas.dataset["kpExactMotionTrackCount"],
      svgIdentity: svg.dataset["kpTestIdentity"],
      atomIdentities: atoms.map(
        (element) => element.dataset["kpTestIdentity"]
      ),
      trackIds: atoms.map((element) => element.dataset["kpMotionTrackId"]),
      transforms: atoms.map((element) => element.style.transform)
    };
  }));
  expect(animated).toHaveLength(3);
  for (const [index, view] of animated.entries()) {
    expect(view.renderer).toBe("persistent-svg-atomic-tracks");
    expect(view.trackCount).toBe("6");
    expect(view.svgIdentity).toBe(`svg-${index}`);
    expect(view.atomIdentities).toEqual(
      Array.from({ length: 6 }, (_, atomIndex) =>
        `atom-${index}-${atomIndex}`
      )
    );
    expect(view.trackIds.every(Boolean)).toBe(true);
    expect(view.transforms).not.toEqual(initialTransforms[index]!.transforms);
  }
});

test("endpoint settlement is raster-stable and natural playback preserves concrete nodes", async ({
  page
}) => {
  test.setTimeout(60_000);
  const player = await openExactQuantity(page, {
    width: 1_100,
    height: 800
  });
  await seekAndSettle(page, player, 0.967);
  await expect(player).toHaveAttribute(
    "data-kp-exact-paint-ownership",
    "transient"
  );
  const materialPose = await player.locator(
    committedSceneSelector
  ).screenshot({
    path: test.info().outputPath("endpoint-material-pose.png")
  });
  const materialGeometry = await endpointGeometry(player);
  await seekAndSettle(page, player, 0.968);
  await expect(player).toHaveAttribute(
    "data-kp-exact-paint-ownership",
    "target-native"
  );
  const nativePose = await player.locator(
    committedSceneSelector
  ).screenshot({
    path: test.info().outputPath("endpoint-native-pose.png")
  });
  const nativeGeometry = await endpointGeometry(player);
  const raster = await rasterDifference(page, materialPose, nativePose);
  expect(
    raster.changedPixelRatio,
    JSON.stringify({ raster, materialGeometry, nativeGeometry })
  ).toBeLessThanOrEqual(
    manifest.browserAudit.maximumEndpointChangedPixelRatio
  );
  expect(raster.meanChannelDelta).toBeLessThanOrEqual(
    manifest.browserAudit.maximumEndpointMeanChannelDelta
  );

  await seekAndSettle(page, player, 0.92);
  await player.evaluate((root) => {
    for (const [index, svg] of [
      ...root.querySelectorAll<SVGSVGElement>(
        "[data-kp-exact-persistent-svg]"
      )
    ].entries()) {
      svg.dataset["kpNaturalPlayIdentity"] = `concrete-${index}`;
    }
    const samples: Array<{
      progress: number;
      checkpoint?: string | undefined;
      sourceOpacity?: string | undefined;
      targetOpacity?: string | undefined;
      poseProgress?: string | undefined;
    }> = [];
    (root as HTMLElement & {
      __kpEndpointNaturalSamples?: typeof samples;
    }).__kpEndpointNaturalSamples = samples;
    root.addEventListener("kp-editor-animation-frame", () => {
      const scene = root.querySelector<HTMLElement>(
        "[data-kp-exact-symbolic-scene]" +
        "[data-kp-prepared-scene-state=\"committed\"]"
      );
      samples.push({
        progress: Number(root.dataset["kpEditorAnimationProgress"]),
        checkpoint: root.dataset["kpExactCheckpoint"],
        sourceOpacity: scene?.querySelector<HTMLElement>(
          "[data-kp-exact-symbolic-source]"
        )?.style.opacity,
        targetOpacity: scene?.querySelector<HTMLElement>(
          "[data-kp-exact-symbolic-target]"
        )?.style.opacity,
        poseProgress: scene?.dataset["kpNativeKatexPoseProgress"]
      });
    });
  });
  await player.locator(
    '[data-action="toggle-editor-animation"]'
  ).click();
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-status",
    "complete",
    { timeout: 10_000 }
  );
  const toggle = player.locator(
    '[data-action="toggle-editor-animation"]'
  );
  await expect(toggle).toHaveCount(1);
  await expect(toggle).toHaveText("Replay");
  await expect(toggle).toHaveAttribute("aria-label", "Replay animation");
  expect(await player.evaluate((root) => [
    ...root.querySelectorAll<SVGSVGElement>(
      "[data-kp-exact-persistent-svg]"
    )
  ].map((svg) => svg.dataset["kpNaturalPlayIdentity"]))).toEqual([
    "concrete-0",
    "concrete-1",
    "concrete-2"
  ]);
  const naturalSamples = await player.evaluate((root) =>
    (root as HTMLElement & {
      __kpEndpointNaturalSamples?: Array<{
        progress: number;
        checkpoint?: string | undefined;
        sourceOpacity?: string | undefined;
        targetOpacity?: string | undefined;
        poseProgress?: string | undefined;
      }>;
    }).__kpEndpointNaturalSamples ?? []
  );
  expect(naturalSamples.length).toBeGreaterThan(2);
  expect(naturalSamples.every((sample, index) =>
    sample.progress >= 0.92 &&
    (
      index === 0 ||
      sample.progress >= naturalSamples[index - 1]!.progress
    ) &&
    sample.checkpoint === manifest.checkpoints.at(-1)!.id
  )).toBe(true);
  const settledSamples = naturalSamples.filter(
    ({ poseProgress }) => poseProgress === "1"
  );
  expect(settledSamples.length).toBeGreaterThan(0);
  expect(settledSamples.every(
    ({ sourceOpacity }) => sourceOpacity === "0"
  )).toBe(true);
  await expect(player.locator(
    `${committedSceneSelector} [data-kp-exact-symbolic-target]`
  )).toHaveCSS("opacity", "1");
});

test("wide, phone, restored, and DPR2 layouts preserve one semantic frame", async ({
  browser,
  page
}) => {
  test.setTimeout(60_000);
  const player = await openExactQuantity(page, {
    width: 1_100,
    height: 800
  });
  await seekAndSettle(page, player, 0.72);
  const semantic = await semanticFingerprint(player);
  expect(await visibleViewCount(player)).toBe(4);
  expect(await overlapArea(player)).toBe(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(player).toHaveAttribute(
    "data-kp-exact-active-representation",
    "symbolic"
  );
  expect(await visibleViewCount(player)).toBe(1);
  expect(await semanticFingerprint(player)).toBe(semantic);

  for (const view of [
    "partitioned-circle",
    "fraction-bar",
    "number-line",
    "symbolic"
  ]) {
    await player.locator(
      `button[data-kp-exact-active-view="${view}"]`
    ).click();
    expect(await visibleViewCount(player)).toBe(1);
    expect(await semanticFingerprint(player)).toBe(semantic);
  }

  await page.setViewportSize({ width: 1_100, height: 800 });
  expect(await visibleViewCount(player)).toBe(4);
  expect(await overlapArea(player)).toBe(0);
  expect(await semanticFingerprint(player)).toBe(semantic);

  const dprPage = await openDprPage(browser, 2);
  try {
    const dprPlayer = await openExactQuantity(dprPage, {
      width: 390,
      height: 844
    });
    await seekAndSettle(dprPage, dprPlayer, 0.72);
    expect(await dprPage.evaluate(() => window.devicePixelRatio)).toBe(2);
    expect(await semanticFingerprint(dprPlayer)).toBe(semantic);
    expect(await visibleViewCount(dprPlayer)).toBe(1);
  } finally {
    await dprPage.context().close();
  }
});

test("scrub hot path stays bounded and releases its sole symbolic session", async ({
  page
}) => {
  test.setTimeout(60_000);
  const player = await openExactQuantity(page, {
    width: 1_100,
    height: 800
  });
  await seekAndSettle(page, player, 0.72);
  await expect(player).toHaveAttribute(
    "data-kp-exact-symbolic-playback-active-count",
    "1"
  );
  await expect(player).toHaveAttribute(
    "data-kp-exact-webgl-lease-count",
    String(manifest.browserAudit.maximumWebglLeaseCount)
  );
  await expect(player.locator("canvas")).toHaveCount(0);
  await expect(player.locator(
    "[data-kp-editor-equation-material-layer]"
  )).toHaveCount(1);

  const durations = await player.locator(
    "[data-action=\"seek-editor-animation\"]"
  ).evaluate((scrubber) => {
    const input = scrubber as HTMLInputElement;
    const samples: number[] = [];
    for (let index = 0; index < 120; index += 1) {
      input.value = String(((index * 37) % 1_001) / 1_000);
      const started = performance.now();
      input.dispatchEvent(new Event("input", { bubbles: true }));
      samples.push(performance.now() - started);
    }
    for (let index = 0; index < 12; index += 1) {
      input.value = "0.72";
      const started = performance.now();
      input.dispatchEvent(new Event("input", { bubbles: true }));
      samples.push(performance.now() - started);
    }
    return samples;
  });
  await seekAndSettle(page, player, 0.72);
  const sorted = [...durations].sort((left, right) => left - right);
  const p95 = sorted[Math.floor(sorted.length * 0.95)]!;
  expect(p95).toBeLessThan(manifest.browserAudit.maximumScrubP95Ms);
  expect(Math.max(...durations)).toBeLessThan(
    manifest.browserAudit.maximumScrubSampleMs
  );
  expect(Number(await player.getAttribute(
    "data-kp-exact-repeated-frame-reuse-count"
  ))).toBeGreaterThanOrEqual(11);
  const created = Number(await player.getAttribute(
    "data-kp-exact-symbolic-playback-created-count"
  ));
  const disposed = Number(await player.getAttribute(
    "data-kp-exact-symbolic-playback-disposed-count"
  ));
  expect(created - disposed).toBe(
    manifest.browserAudit.maximumSymbolicSessionCount
  );

  await page.evaluate((selector) => {
    const oldPlayer = document.querySelector<HTMLElement>(selector);
    if (oldPlayer === null) return;
    (window as typeof window & {
      __kpDisposedExactPlayer?: HTMLElement;
    }).__kpDisposedExactPlayer = oldPlayer;
  }, playerSelector);
  const picker = page.getByLabel("Select editor animation");
  const replacement = await picker.locator("option").evaluateAll(
    (options, exactDescriptorId) =>
      options.map((option) => (option as HTMLOptionElement).value)
        .find((value) => value !== exactDescriptorId),
    descriptorId
  );
  expect(replacement).toBeTruthy();
  await picker.selectOption(replacement!);
  await expect(page.locator(playerSelector)).toHaveCount(0);
  expect(await page.evaluate(() => {
    const oldPlayer = (window as typeof window & {
      __kpDisposedExactPlayer?: HTMLElement;
    }).__kpDisposedExactPlayer;
    if (oldPlayer === undefined) return null;
    return {
      status: oldPlayer.dataset["kpExactSurfaceResources"],
      active: oldPlayer.dataset["kpExactSymbolicPlaybackActiveCount"],
      created: oldPlayer.dataset["kpExactSymbolicPlaybackCreatedCount"],
      disposed: oldPlayer.dataset["kpExactSymbolicPlaybackDisposedCount"]
    };
  })).toEqual({
    status: "disposed",
    active: "0",
    created: String(created),
    disposed: String(created)
  });
});

async function openExactQuantity(
  page: Page,
  viewport: { readonly width: number; readonly height: number }
) {
  await page.setViewportSize(viewport);
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(playerSelector);
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await page.evaluate(async () => document.fonts.ready);
  await awaitCommittedSymbolicScene(player);
  return player;
}

async function openDprPage(browser: Browser, deviceScaleFactor: number) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor
  });
  return context.newPage();
}

async function seekAndSettle(
  page: Page,
  player: ReturnType<Page["locator"]>,
  progress: number
): Promise<void> {
  await player.locator(
    "[data-action=\"seek-editor-animation\"]"
  ).fill(String(progress));
  await expect(player).toHaveAttribute(
    "data-kp-exact-input-progress-permille",
    String(Math.round(progress * 1_000))
  );
  await awaitCommittedSymbolicScene(player);
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  ));
}

async function awaitCommittedSymbolicScene(
  player: ReturnType<Page["locator"]>
): Promise<void> {
  await expect.poll(async () => {
    const state = await player.evaluate((root) => {
      const committed = root.querySelector<HTMLElement>(
        "[data-kp-exact-symbolic-scene]" +
        "[data-kp-prepared-scene-state=\"committed\"]"
      );
      return {
        status: committed?.dataset["kpExactSymbolicStatus"],
        error: committed?.dataset["kpExactSymbolicError"],
        segment: committed?.dataset["kpExactSymbolicSegment"],
        expectedSegment: root.dataset["kpExactSymbolicSegment"]
      };
    });
    if (state.status === "error") {
      throw new Error(
        state.error ?? "Exact symbolic scene failed without a diagnostic."
      );
    }
    return state.status === "ready" &&
      state.segment === state.expectedSegment;
  }).toBe(true);
}

async function paintFingerprint(
  player: ReturnType<Page["locator"]>
): Promise<string> {
  return player.evaluate((root) => {
    const normalizedRect = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return [
        rect.x,
        rect.y,
        rect.width,
        rect.height
      ].map((value) => Math.round(value * 100) / 100);
    };
    const scene = root.querySelector<HTMLElement>(
      "[data-kp-exact-symbolic-scene]" +
      "[data-kp-prepared-scene-state=\"committed\"]"
    );
    if (scene === null) throw new Error("Missing exact symbolic scene.");
    const endpoints = [
      ...scene.querySelectorAll<HTMLElement>(
        "[data-kp-exact-symbolic-source], [data-kp-exact-symbolic-target]"
      )
    ].map((endpoint) => ({
      side: endpoint.hasAttribute("data-kp-exact-symbolic-source")
        ? "source"
        : "target",
      opacity: getComputedStyle(endpoint).opacity,
      text: endpoint.textContent?.replace(/\s+/gu, ""),
      rect: normalizedRect(endpoint)
    }));
    const materials = [
      ...scene.querySelectorAll<HTMLElement>(
        ".editor-equation-stage__material-owner"
      )
    ].map((element) => ({
      semanticId: element.dataset["kpSemanticEntityId"],
      opacity: getComputedStyle(element).opacity,
      transform: element.style.transform,
      rect: normalizedRect(element)
    }));
    const views = [
      ...root.querySelectorAll<HTMLElement>("[data-kp-exact-view]")
    ].map((view) => ({
      id: view.dataset["kpExactView"],
      html: view.querySelector("svg")?.outerHTML ?? ""
    }));
    return JSON.stringify({
      progress: root.getAttribute("data-kp-exact-progress-permille"),
      checkpoint: root.getAttribute("data-kp-exact-checkpoint"),
      phase: root.getAttribute("data-kp-exact-phase"),
      ownership: root.getAttribute("data-kp-exact-paint-ownership"),
      scene: {
        status: scene.dataset["kpExactSymbolicStatus"],
        mode: scene.dataset["kpExactSymbolicMode"],
        endpoints,
        materials
      },
      views
    });
  });
}

async function rasterDifference(
  page: Page,
  left: Buffer,
  right: Buffer
): Promise<{
  readonly differingPixels: number;
  readonly maximumChannelDelta: number;
  readonly changedPixelRatio: number;
  readonly meanChannelDelta: number;
  readonly bounds: readonly [number, number, number, number] | null;
}> {
  return page.evaluate(async ({ leftBase64, rightBase64 }) => {
    const pixels = async (base64: string) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (context === null) throw new Error("Missing raster audit context.");
      context.drawImage(image, 0, 0);
      return {
        data: context.getImageData(0, 0, canvas.width, canvas.height).data,
        width: canvas.width,
        height: canvas.height
      };
    };
    const [leftImage, rightImage] = await Promise.all([
      pixels(leftBase64),
      pixels(rightBase64)
    ]);
    const leftPixels = leftImage.data;
    const rightPixels = rightImage.data;
    if (leftPixels.length !== rightPixels.length) {
      throw new Error("Endpoint raster dimensions diverged.");
    }
    if (
      leftImage.width !== rightImage.width ||
      leftImage.height !== rightImage.height
    ) {
      throw new Error("Endpoint raster dimensions diverged.");
    }
    let differingPixels = 0;
    let maximumChannelDelta = 0;
    let totalChannelDelta = 0;
    let minimumX = Number.POSITIVE_INFINITY;
    let minimumY = Number.POSITIVE_INFINITY;
    let maximumX = Number.NEGATIVE_INFINITY;
    let maximumY = Number.NEGATIVE_INFINITY;
    const width = leftImage.width;
    for (let index = 0; index < leftPixels.length; index += 4) {
      let differs = false;
      for (let channel = 0; channel < 4; channel += 1) {
        const delta = Math.abs(
          leftPixels[index + channel]! - rightPixels[index + channel]!
        );
        maximumChannelDelta = Math.max(maximumChannelDelta, delta);
        totalChannelDelta += delta;
        differs ||= delta !== 0;
      }
      if (differs) {
        differingPixels += 1;
        const pixelIndex = index / 4;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);
        minimumX = Math.min(minimumX, x);
        minimumY = Math.min(minimumY, y);
        maximumX = Math.max(maximumX, x);
        maximumY = Math.max(maximumY, y);
      }
    }
    return {
      differingPixels,
      maximumChannelDelta,
      changedPixelRatio: differingPixels / (leftPixels.length / 4),
      meanChannelDelta: totalChannelDelta / leftPixels.length,
      bounds: differingPixels === 0
        ? null
        : [minimumX, minimumY, maximumX, maximumY] as const
    };
  }, {
    leftBase64: left.toString("base64"),
    rightBase64: right.toString("base64")
  });
}

async function endpointGeometry(
  player: ReturnType<Page["locator"]>
): Promise<unknown> {
  return player.evaluate((root) => {
    const rect = (element: Element) => {
      const value = element.getBoundingClientRect();
      return [value.x, value.y, value.width, value.height]
        .map((part) => Math.round(part * 1_000) / 1_000);
    };
    const scene = root.querySelector<HTMLElement>(
      "[data-kp-exact-symbolic-scene]" +
      "[data-kp-prepared-scene-state=\"committed\"]"
    );
    if (scene === null) throw new Error("Missing endpoint geometry scene.");
    const material = [
      ...scene.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )
    ].map((owner) => ({
      id: owner.dataset["kpEquationMaterialOwnerId"],
      owner: rect(owner),
      transform: owner.style.transform,
      insetX: owner.dataset["kpEquationMaterialPaintInsetX"],
      insetY: owner.dataset["kpEquationMaterialPaintInsetY"],
      visual: owner.firstElementChild === null
        ? null
        : rect(owner.firstElementChild)
    }));
    const target = scene.querySelector<HTMLElement>(
      "[data-kp-exact-symbolic-target]"
    );
    return {
      ownership: root.getAttribute("data-kp-exact-paint-ownership"),
      rawProgress: scene.dataset["kpNativeKatexRawProgress"],
      poseProgress: scene.dataset["kpNativeKatexPoseProgress"],
      material,
      target: target === null
        ? []
        : [...target.querySelectorAll<HTMLElement>("span")]
          .filter((element) =>
            element.children.length === 0 &&
            (element.textContent?.trim().length ?? 0) > 0
          )
          .map((element) => ({
            text: element.textContent,
            rect: rect(element),
            family: getComputedStyle(element).fontFamily,
            size: getComputedStyle(element).fontSize
          }))
    };
  });
}

async function semanticFingerprint(
  player: ReturnType<Page["locator"]>
): Promise<string> {
  return player.evaluate((root) => JSON.stringify({
    progress: root.getAttribute("data-kp-exact-progress-permille"),
    checkpoint: root.getAttribute("data-kp-exact-checkpoint"),
    phase: root.getAttribute("data-kp-exact-phase"),
    focus: root.getAttribute("data-kp-exact-focus-refs"),
    selected: [
      ...root.querySelectorAll<HTMLElement>(
        "[data-kp-atomic-part-id][data-kp-selected=\"true\"]"
      )
    ].map((element) => element.dataset["kpAtomicPartId"]).sort()
  }));
}

async function visibleViewCount(
  player: ReturnType<Page["locator"]>
): Promise<number> {
  return player.locator("[data-kp-exact-view]").evaluateAll((views) =>
    views.filter((view) => getComputedStyle(view).display !== "none").length
  );
}

async function overlapArea(
  player: ReturnType<Page["locator"]>
): Promise<number> {
  return player.locator("[data-kp-exact-view]").evaluateAll((views) => {
    const rectangles = views.map((view) => view.getBoundingClientRect());
    let area = 0;
    for (let left = 0; left < rectangles.length; left += 1) {
      for (let right = left + 1; right < rectangles.length; right += 1) {
        const a = rectangles[left]!;
        const b = rectangles[right]!;
        area += Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
          Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      }
    }
    return Math.round(area * 100) / 100;
  });
}

async function exactPaintContactEvidence(
  player: ReturnType<Page["locator"]>,
  progress: number
) {
  return player.evaluate(async (root, sampledProgress) => {
    const overlapModule =
      "/src/rendering/equation-visible-paint-overlap.ts";
    const geometryModule =
      "/src/rendering/native-katex-paint-geometry.ts";
    const {
      evaluateKpEquationVisiblePaintCertifiedContacts,
      inspectKpEquationVisiblePaintOverlap
    } = await import(overlapModule);
    const { measureKpNativeKatexSubtreePaintRect } =
      await import(geometryModule);
    const stage = root.querySelector<HTMLElement>(
      "[data-kp-exact-symbolic-scene]" +
      "[data-kp-prepared-scene-state=\"committed\"]"
    );
    if (stage === null) {
      throw new Error("Exact paint census requires one committed scene.");
    }
    const effectiveOpacity = (element: HTMLElement): number => {
      let opacity = 1;
      let current: HTMLElement | null = element;
      while (current !== null) {
        opacity *= Number(getComputedStyle(current).opacity);
        if (current === stage) break;
        current = current.parentElement;
      }
      return opacity;
    };
    const native = [
      ...stage.querySelectorAll<HTMLElement>(
        "[data-kp-exact-symbolic-source], " +
        "[data-kp-exact-symbolic-target]"
      )
    ].flatMap((endpoint) => {
      const authority = endpoint.hasAttribute(
        "data-kp-exact-symbolic-source"
      )
        ? "source-native" as const
        : "target-native" as const;
      return [
        ...endpoint.querySelectorAll<HTMLElement>(
          "[data-kp-semantic-selector-id], .frac-line"
        )
      ].flatMap((paint, index) => {
        const rect = measureKpNativeKatexSubtreePaintRect(stage, paint);
        return rect === undefined ? [] : [{
          ownerId:
            `native:${authority}:${
              paint.dataset["kpSemanticEntityId"] ?? index
            }`,
          semanticEntityId: paint.dataset["kpSemanticEntityId"],
          authority,
          rect,
          opacity: effectiveOpacity(paint)
        }];
      });
    });
    const material = [
      ...stage.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )
    ].flatMap((owner) => {
      const visual = owner.firstElementChild as HTMLElement | null;
      const rect = visual === null
        ? undefined
        : measureKpNativeKatexSubtreePaintRect(stage, visual);
      return rect === undefined ? [] : [{
        ownerId: owner.dataset["kpEquationMaterialOwnerId"] ?? "",
        semanticEntityId:
          owner.dataset["kpEquationMaterialSemanticEntityId"],
        semanticContacts: JSON.parse(
          owner.dataset["kpEquationMaterialSemanticContacts"] ?? "[]"
        ),
        authority: "material" as const,
        rect,
        opacity: effectiveOpacity(owner)
      }];
    });
    const report = inspectKpEquationVisiblePaintOverlap({
      progress: sampledProgress,
      viewportId: `${window.innerWidth}x${window.innerHeight}`,
      observations: [...native, ...material],
      contactTolerancePx: 0.75
    });
    const evaluated = evaluateKpEquationVisiblePaintCertifiedContacts({
      report,
      contactTolerancePx: 0.75
    });
    return {
      observationCount: report.observationCount,
      intersections: report.intersections,
      allowed: evaluated.allowed,
      violations: evaluated.violations
    };
  }, progress);
}
