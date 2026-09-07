import { expect, test, type Page } from "@playwright/test";

const referenceRoute = "/reader/fraction-composition/?kpLesson=lesson.algebra.fraction-composition&kpVersion=1&kpProgress=38&kpMotion=full&kpProfile=standard&kpFoldMode=expanded";

test("authored simplification preserves phone links, interrupted playback, reduced motion and disposal", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/experiments/authoring-simplification-focus-card/#beat.authoring-simplification.target");
  const card = page.locator("[data-kp-authoring-simplification-card]");
  await expect(card).toHaveAttribute("data-kp-authoring-simplification-card", "ready");
  const stage = card.locator("[data-kp-carrier-preserving-simplification-stage]");
  const slider = card.locator("[data-kp-focus-deck-scrubber]");
  await expect(stage).toHaveAttribute("data-kp-carrier-preserving-simplification-visual-owner", "target-native");
  await page.reload();
  await expect(card).toHaveAttribute("data-kp-authoring-simplification-card", "ready");
  await expect(stage).toHaveAttribute("data-kp-carrier-preserving-simplification-progress", "1");
  await slider.fill("0");
  await card.locator("[data-kp-focus-deck-next]").click();
  await expect.poll(async () => Number(await stage.getAttribute("data-kp-carrier-preserving-simplification-progress"))).toBeGreaterThan(0);
  await slider.fill("0.36");
  await expect(stage).toHaveAttribute("data-kp-carrier-preserving-simplification-progress", "0.36");
  // Force invalidation and seek in one task, before ResizeObserver delivery.
  await card.evaluate(root => {
    const surface = root.querySelector<HTMLElement>("[data-kp-carrier-preserving-simplification-stage]")!;
    const input = root.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
    surface.style.width = "95%";
    input.value = "0.41";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(stage).toHaveAttribute("data-kp-carrier-preserving-simplification-progress", "0.41");
  await stage.evaluate(surface => surface.style.removeProperty("width"));
  await slider.fill("0.36");
  await page.setViewportSize({ width: 420, height: 844 });
  await expect(stage).toHaveAttribute("data-kp-carrier-preserving-simplification-stage", "ready");
  await expect(stage).toHaveAttribute("data-kp-carrier-preserving-simplification-progress", "0.36");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await stage.screenshot({ path: info.outputPath("authored-carrier-phone.png") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await slider.fill("0.75");
  await expect(stage).toHaveAttribute("data-kp-carrier-preserving-simplification-visual-owner", "target-native");
  await slider.fill("0.25");
  await expect(stage).toHaveAttribute("data-kp-carrier-preserving-simplification-visual-owner", "source-native");
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
  await expect(stage.locator("[data-kp-equation-material-owner-id]")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("authored simplification rejects malformed prepared source without a fallback", async ({ page }) => {
  await page.route("**/api/dev/authoring-structural/simplification", route => route.fulfill({
    contentType: "application/json", body: JSON.stringify({ status: "valid", animation: {} })
  }));
  await page.goto("/experiments/authoring-simplification-focus-card/");
  await expect(page.locator("[data-kp-simplification-repair-gap]")).toBeVisible();
  await expect(page.locator("[data-kp-carrier-preserving-simplification-stage]")).toHaveCount(0);
});

test("authored simplification Focus Card uses the canonical carrier owner forward and reverse", async ({ page }, info) => {
  const errors: string[] = [];
  const modules: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => modules.push(request.url()));
  await page.goto("/experiments/authoring-simplification-focus-card/");
  const card = page.locator("[data-kp-authoring-simplification-card]");
  await expect(card).toHaveAttribute("data-kp-authoring-simplification-card", "ready");
  const stage = card.locator("[data-kp-carrier-preserving-simplification-stage]");
  const slider = card.locator("[data-kp-focus-deck-scrubber]");
  const sample = async (progress: number) => {
    await slider.fill(String(progress));
    await expect(stage).toHaveAttribute("data-kp-carrier-preserving-simplification-progress", String(progress));
  };
  await expect(stage).toHaveAttribute("data-kp-carrier-preserving-simplification-removed-track-count", "2");
  await expect(stage).toHaveAttribute("data-kp-carrier-preserving-simplification-treatment", "identity-ink-shrink-review");
  let first = "";
  for (const p of [0, .2, .42, .7, 1, .42, 0]) {
    await sample(p);
    await expect(stage.locator('[data-kp-carrier-preserving-simplification-endpoint][aria-hidden="false"]')).toHaveCount(1);
    expect(await stage.evaluate(root => {
      const native = [...root.querySelectorAll<HTMLElement>('[data-kp-carrier-preserving-simplification-endpoint]')]
        .filter(node => Number(getComputedStyle(node).opacity) > 0).length;
      const material = [...root.querySelectorAll<HTMLElement>('[data-kp-equation-material-owner-id]')]
        .some(node => Number(getComputedStyle(node).opacity) > 0);
      return native + Number(material);
    })).toBe(1);
    if (p === 0 || p === 1) await expect(stage).toHaveAttribute("data-kp-carrier-preserving-simplification-visual-owner", p === 0 ? "source-native" : "target-native");
    if (p === .42) {
      await expect(stage).toHaveAttribute("data-kp-carrier-preserving-simplification-visual-owner", "material-scene");
      const carrier = stage.locator('[data-kp-equation-material-semantic-entity-id$=".source.carrier"]');
      await expect(carrier).toHaveCount(1);
      const paint = await carrier.evaluate(node => {
        const style = getComputedStyle(node); const matrix = new DOMMatrix(style.transform);
        return { opacity: Number(style.opacity), x: matrix.a, y: matrix.d };
      });
      expect(paint.opacity).toBe(1); expect(paint.x).toBeCloseTo(1, 5); expect(paint.y).toBeCloseTo(1, 5);
      const signature = await stage.locator('[data-kp-editor-equation-material-layer]').innerHTML();
      if (!first) first = signature; else expect(signature).toEqual(first);
      await stage.screenshot({ path: info.outputPath("authored-carrier-transit.png") });
    }
  }
  expect(modules.some(url => url.includes("/src/semantic-state/"))).toBe(false);
  expect(errors).toEqual([]);
});

test("identity syntax shrinks as opaque ink while its carrier keeps its native size", async ({ page }, info) => {
  await page.goto("/experiments/authoring-simplification-focus-card/");
  const card = page.locator('[data-kp-authoring-simplification-card="ready"]');
  await expect(card).toBeVisible();
  const samples = [];
  for (const progress of [.17, .3, .42, .44, .42, .3, .17]) {
    await card.locator("[data-kp-focus-deck-scrubber]").fill(String(progress));
    const paint = await card.locator('[data-kp-equation-material-owner-id]').evaluateAll(nodes => nodes.map(node => {
      const style = getComputedStyle(node); const matrix = new DOMMatrix(style.transform);
      return { id: node.getAttribute("data-kp-equation-material-semantic-entity-id")!,
        scale: matrix.a, opacity: Number(style.opacity) };
    }));
    const carrier = paint.find(owner => owner.id.endsWith(".source.carrier"))!;
    expect(carrier.scale).toBeCloseTo(1, 5); expect(carrier.opacity).toBe(1);
    const removed = paint.filter(owner => !owner.id.endsWith(".source.carrier"));
    expect(removed).toHaveLength(2);
    for (const owner of removed) {
      expect(owner.scale).toBeLessThan(1);
      expect(owner.opacity).toBe(progress === .44 ? 0 : 1);
    }
    expect(removed[0]!.scale).toBeCloseTo(removed[1]!.scale, 5);
    samples.push(removed[0]!.scale);
    await card.screenshot({ path: info.outputPath(`identity-ink-shrink-${progress}.png`) });
  }
  expect(samples[0]).toBeGreaterThan(samples[1]!);
  expect(samples[1]).toBeGreaterThan(samples[2]!);
  expect(samples.slice(0, 3)).toEqual(samples.slice(4).reverse());
});

// The canonical reference is measured first. Subsequent integration slices must
// compare their aggregate-backed path against this session, not replace it with
// screenshots of a different distribution demo.
async function seek(page: Page, progress: number) {
  await page.locator("[data-kp-reader-attention-scrubber]").evaluate((element, value) => {
    const input = element as HTMLInputElement;
    // The existing reader clock accepts exact progress; integer range steps
    // otherwise skip the shared boundary between adjacent operations.
    input.step = "any";
    input.value = String(value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, progress);
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-progress", String(Math.round(progress)));
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

for (const source of ["canonical", "authored"] as const) test(`${source} distribution traverses the real native session and restores on reverse`, async ({ page }, info) => {
  const errors: string[] = [];
  const requestedModules: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => requestedModules.push(request.url()));
  await page.goto("/reader/fraction-composition/?kpLesson=lesson.algebra.fraction-composition&kpVersion=1&kpProgress=38&kpMotion=full&kpProfile=standard&kpFoldMode=expanded" +
    (source === "authored" ? "&kpAuthoringStructural=distribution" : ""));
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-hydrated", "true");
  if (source === "authored") {
    await expect(page.locator("body")).toHaveAttribute("data-kp-authoring-structural-source", "distribution");
    const pins = await page.locator("body").evaluate(body => [body.dataset["kpAuthoringStructuralBefore"], body.dataset["kpAuthoringStructuralAfter"]]);
    expect(pins[0]).toBeTruthy();
    expect(pins[1]).toBeTruthy();
    expect(pins[0]).not.toBe(pins[1]);
  } else await expect(page.locator("body")).not.toHaveAttribute("data-kp-authoring-structural-source");
  await page.evaluate(() => document.fonts.ready);
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveAttribute("data-kp-reader-canonical-equation-session-active", "true");
  const active = page.locator("[data-kp-reader-transition-active='true']");
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute("data-kp-reader-transition", "fraction-solve.step.distribute");
  await expect(active.locator("[data-kp-reader-fit-surface]")).toHaveCount(1);
  // Captures supplement ownership assertions; they are not new goldens or proof
  // that an authored-state adapter exists before its implementation slice.
  await seek(page, 38);
  const reference = await page.locator("body").getAttribute("data-kp-reader-review-frame");
  await stage.screenshot({ path: info.outputPath(`${source}-distribution-transit.png`) });
  await seek(page, 0);
  const observation = await stage.evaluate(async surface => {
    if (!(surface instanceof HTMLElement)) throw new Error("Expected an HTML equation stage.");
    const scenePath = "/src/rendering/native-katex-rendered-scene.ts";
    const fontPath = "/src/rendering/equation-font-readiness.ts";
    const scene = await import(scenePath) as typeof import("../src/rendering/native-katex-rendered-scene.ts");
    const fonts = await import(fontPath) as typeof import("../src/rendering/equation-font-readiness.ts");
    const root = surface.querySelector<HTMLElement>("[data-kp-reader-equation-state]")!;
    const fontReadiness = fonts.createKpEquationFontReadiness(document);
    await fontReadiness.whenReady();
    const owners = [...root.querySelectorAll<HTMLElement>("[data-kp-presentation-group-id]")];
    const before = owners.map(owner => owner.getBoundingClientRect().toJSON());
    try {
      const measured = scene.observeKpNativeKatexRenderedScene({
        endpoint: "source", stage: surface, root, semanticEntityId: "test.endpoint",
        presentationGroupId: "test.endpoint", fontReadiness, includeHiddenPaint: true
      });
      const structural = measured.groups.filter(group => group.atomIds.every(id =>
        measured.atoms.find(atom => atom.id === id)!.paintKind !== "glyph"));
      return { count: structural.length, baselines: structural.map(group => group.baselineY),
        before, after: owners.map(owner => owner.getBoundingClientRect().toJSON()) };
    } finally { fontReadiness.dispose(); }
  });
  expect(observation.count).toBeGreaterThan(0);
  expect(observation.baselines.every(baseline => baseline === null)).toBe(true);
  expect(observation.after).toEqual(observation.before);
  await stage.screenshot({ path: info.outputPath(`${source}-distribution-source.png`) });
  await seek(page, 1000 / 13);
  await stage.screenshot({ path: info.outputPath(`${source}-distribution-target-boundary.png`) });
  await seek(page, 38);
  await expect(active).toHaveAttribute("data-kp-reader-transition", "fraction-solve.step.distribute");
  expect(await page.locator("body").getAttribute("data-kp-reader-review-frame")).toBe(reference);
  expect(errors).toEqual([]);
  expect(requestedModules.filter(url => /\/src\/(?:experiments\/authoring-structural|semantic-state)\//.test(url))).toEqual([]);
  if (source === "authored") {
    const rejected = await page.request.post("/api/dev/authoring-structural/distribution");
    expect(rejected.status()).toBe(405);
  }
});

test("authored distribution preserves phone reduced-motion truth and direct URL reload", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(referenceRoute.replace("kpMotion=full", "kpMotion=reduced") + "&kpAuthoringStructural=distribution");
  const stage = page.locator("[data-kp-reader-equation-stage]");
  let originalFrame: string | null = null;
  for (const reload of [false, true]) {
    if (reload) await page.reload();
    await expect(page.locator("body")).toHaveAttribute("data-kp-reader-hydrated", "true");
    await expect(page.locator("body")).toHaveAttribute("data-kp-reader-motion-mode", "essential");
    await expect(page.locator("body")).toHaveAttribute("data-kp-authoring-structural-source", "distribution");
    await expect(stage).toHaveAttribute("data-kp-reader-canonical-equation-session-active", "true");
    await expect(stage.locator("[data-kp-reader-accessible-equation-state][aria-current='step'][role='math'][aria-label]")).toHaveCount(1);
    await expect(page.locator("[data-kp-reader-equation-material-layer]")).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator("[data-kp-reader-equation-material-layer]")).toHaveAttribute("inert", "");
    const frame = await page.locator("body").getAttribute("data-kp-reader-review-frame");
    if (!reload) originalFrame = frame;
    else expect(frame).toBe(originalFrame);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await stage.screenshot({ path: info.outputPath("authored-distribution-phone-reduced.png") });
  expect(errors).toEqual([]);
});

async function paintEvidence(page: Page) {
  return page.locator("[data-kp-reader-transition-active='true']").evaluate(async transition => {
    const modulePath = "/src/rendering/native-katex-paint-geometry.ts";
    const { measureKpNativeKatexSubtreePaintRect } = await import(modulePath);
    const stage = document.querySelector<HTMLElement>("[data-kp-reader-equation-viewport]")!;
    const opacity = (element: Element) => {
      let result = 1;
      for (let current: Element | null = element; current !== null; current = current.parentElement) {
        result *= Number(getComputedStyle(current).opacity);
        if (current === stage) break;
      }
      return result;
    };
    const native = [...transition.querySelectorAll<HTMLElement>("[data-kp-reader-native]")];
    const material = [...transition.querySelectorAll<HTMLElement>("[data-kp-equation-material-owner-id]")];
    const source = opacity(native.find(element => element.dataset["kpReaderNative"] === "source")!);
    const target = opacity(native.find(element => element.dataset["kpReaderNative"] === "target")!);
    const visibleMaterial = material.filter(element => opacity(element) > 0);
    const nodes = [
      ...native.flatMap(root => [...root.querySelectorAll<HTMLElement>("[data-kp-reader-equation-anchor-id]")]
        .filter(element => element.dataset["kpFoldableEnvelopeId"] === undefined)
        .map(element => ({ id: `native:${root.dataset["kpReaderNative"]}:${element.dataset["kpReaderEquationAnchorId"]}`, element }))),
      ...material.map(element => ({ id: element.dataset["kpEquationMaterialOwnerId"]!, element: element.firstElementChild as HTMLElement }))
    ].filter(({ element }) => element !== null && opacity(element) > 0);
    return { transition: transition.getAttribute("data-kp-reader-transition"), source, target,
      semanticState: document.querySelector<HTMLElement>("[data-kp-reader-equation-stage]")!.dataset["kpReaderAccessibleEquationState"],
      authorityCount: Number(source > 0) + Number(target > 0) + Number(visibleMaterial.length > 0),
      materialCount: visibleMaterial.length,
      paint: nodes.map(({ id, element }) => ({ id, opacity: opacity(element),
        rect: measureKpNativeKatexSubtreePaintRect(stage, element) })).sort((a, b) => a.id.localeCompare(b.id)) };
  });
}

test("authored distribution preserves realized canonical paint and exclusive ownership at bounded checkpoints", async ({ page }, info) => {
  test.setTimeout(60_000);
  const checkpoints = [0, 1, 25, 38, 65, 75, 76, 1000 / 13, 77, 38];
  const references: Awaited<ReturnType<typeof paintEvidence>>[] = [];
  const images: Buffer[] = [];
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const authored of [false, true]) {
    await page.goto(referenceRoute + (authored ? "&kpAuthoringStructural=distribution" : ""));
    await expect(page.locator("[data-kp-reader-equation-stage]")).toHaveAttribute("data-kp-reader-canonical-equation-session-active", "true");
    await page.evaluate(() => document.fonts.ready);
    for (const [index, progress] of checkpoints.entries()) {
      await seek(page, progress);
      const evidence = await paintEvidence(page);
      expect(evidence.authorityCount, `${authored ? "authored" : "canonical"} at ${progress}`).toBe(1);
      expect(evidence.paint.length).toBeGreaterThan(0);
      if (!authored) references.push(evidence);
      else expect(evidence, `realized paint parity at ${progress}`).toEqual(references[index]);
      if ([0, 38, 76].includes(progress)) {
        const capture = await page.locator("[data-kp-reader-equation-stage]").screenshot();
        if (!authored) images.push(capture);
        else expect(capture.equals(images.shift()!), `raster parity at ${progress}`).toBe(true);
      }
    }
  }
  expect(references.some(frame => frame.source === 1)).toBe(true);
  // At a shared chain boundary the settled target is the next operation's
  // source-native root. Test semantic state and native ownership, not DOM side.
  expect(references.some(frame => frame.semanticState === "fraction-solve.state.distributed" &&
    (frame.source === 1 || frame.target === 1))).toBe(true);
  expect(references.some(frame => frame.materialCount > 0)).toBe(true);
  expect(errors).toEqual([]);
  await info.attach("bounded-native-paint-evidence", { body: JSON.stringify({ checkpoints, references }, null, 2), contentType: "application/json" });
});
