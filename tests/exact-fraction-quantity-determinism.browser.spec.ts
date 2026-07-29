import {
  expect,
  test,
  type Browser,
  type Page
} from "@playwright/test";

const descriptorId =
  "editor-animation.animation.exact-fraction-quantity.third-plus-sixth";
const animationId =
  "animation.exact-fraction-quantity.third-plus-sixth";
const playerSelector =
  `[data-kp-editor-animation-player]` +
  `[data-kp-editor-animation-id="${animationId}"]`;
const denseProgress = Object.freeze([
  0,
  0.09,
  0.179,
  0.18,
  0.181,
  0.399,
  0.4,
  0.401,
  0.559,
  0.56,
  0.561,
  0.819,
  0.82,
  0.821,
  0.999,
  1
]);

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
    "[data-kp-exact-symbolic-scene] .katex-html"
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
      "[data-kp-exact-symbolic-scene]"
    )).toHaveAttribute("data-kp-exact-symbolic-status", "ready");
  }
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
    "0"
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
  expect(p95).toBeLessThan(50);
  expect(Math.max(...durations)).toBeLessThan(150);
  expect(Number(await player.getAttribute(
    "data-kp-exact-repeated-frame-reuse-count"
  ))).toBeGreaterThanOrEqual(11);
  const created = Number(await player.getAttribute(
    "data-kp-exact-symbolic-playback-created-count"
  ));
  const disposed = Number(await player.getAttribute(
    "data-kp-exact-symbolic-playback-disposed-count"
  ));
  expect(created - disposed).toBe(1);

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
  await expect(player.locator(
    "[data-kp-exact-symbolic-scene]"
  )).toHaveAttribute("data-kp-exact-symbolic-status", "ready");
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
  await expect(player.locator(
    "[data-kp-exact-symbolic-scene]"
  )).toHaveAttribute("data-kp-exact-symbolic-status", "ready");
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  ));
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
      "[data-kp-exact-symbolic-scene]"
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
