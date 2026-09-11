import { test, expect } from "@playwright/test";
import source from "../src/authoring/examples/composed-algebra-primary.json" with { type: "json" };
import product from "../src/authoring/examples/composed-algebra-product.json" with { type: "json" };
import { composedAlgebraPressureCases } from "./fixtures/composed-algebra-pressure.ts";
import { kpEquationSettlementTolerancePx } from "../src/animation/equation-shared-presentation-policy.ts";
import { buildComposedAlgebraEdition } from "../scripts/build-composed-algebra-edition.ts";
import { fileURLToPath } from "node:url";
import { unfamiliarAuthoringCases, unfamiliarAuthoringRejections } from "./fixtures/unfamiliar-authoring-trial.ts";
import intuition from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };

test("question-oriented checkpoint stays legible at phone width", async ({ page }, info) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/experiments/reusable-reasoning/?example=algebra-intuition");
  const root = page.locator("#authored-focus-card"), parent = root.locator("[data-composed-reader] [data-composed-card]");
  await expect(root).toHaveAttribute("data-composed-status", "ready", { timeout: 90_000 });
  for (const position of [0, 1.37, 2, 2.37, 4]) {
    await parent.locator("[data-kp-focus-deck-scrubber]").evaluate((node, p) => { (node as HTMLInputElement).value = String(p); node.dispatchEvent(new Event("input")); }, position);
    await expect(parent).toHaveAttribute("data-composed-step", String(position));
    const geometry = await parent.evaluate(card => ({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      header: card.querySelector(".kp-focus-deck__header")!.getBoundingClientRect().bottom,
      passage: card.querySelector("[data-kp-focus-deck-viewport]")!.getBoundingClientRect().top }));
    expect(geometry.overflow).toBeLessThanOrEqual(1); expect(geometry.passage).toBeGreaterThanOrEqual(geometry.header);
    await parent.screenshot({ path: info.outputPath(`phone-${position}.png`) });
  }
  await root.locator('[data-composed-intuition="distribute"]').click();
  await expect(root).toHaveAttribute("data-intuition-status", "ready", { timeout: 90_000 });
  await root.locator("[data-composed-intuition-panel]").screenshot({ path: info.outputPath("phone-intuition.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test("independent algebra questions retain context scoped control and exact return", async ({ page }, info) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/experiments/reusable-reasoning/?example=algebra-intuition");
  const root = page.locator("#authored-focus-card");
  await expect(root).toHaveAttribute("data-composed-status", "ready", { timeout: 90_000 });
  const parent = root.locator("[data-composed-reader] [data-composed-card]");
  await parent.locator("[data-kp-focus-deck-scrubber]").evaluate(node => { (node as HTMLInputElement).value = "2.37"; node.dispatchEvent(new Event("input")); });
  const panel = root.locator("[data-composed-intuition-panel]");
  const links: string[] = [];
  for (const [kind, first, last] of [["collect", 0, 2], ["distribute", 2, 4]] as const) {
    const origin = root.locator(`[data-composed-intuition="${kind}"]`);
    links.push((await origin.getAttribute("href"))!);
    await origin.click();
    await expect(root).toHaveAttribute("data-intuition-status", "ready", { timeout: 90_000 });
    await expect(parent).toBeHidden(); await expect(panel).toBeVisible();
    await expect(panel.locator("[data-composed-intuition-question]")).toContainText("?");
    await expect(panel.locator("[data-composed-intuition-setup]")).toContainText("x+3");
    const card = panel.locator("[data-composed-card]"), slider = card.locator("[data-kp-focus-deck-scrubber]");
    await expect(slider).toHaveAttribute("max", "2");
    await expect(card.locator("[data-kp-focus-deck-beat]")).toHaveCount(3);
    await expect(card.locator("[data-composed-count]")).toHaveText("1 / 3");
    await expect(card).toHaveAttribute("data-common-factor-state", intuition.states[first]!.id);
    await card.locator("[data-kp-focus-deck-next]").click();
    await expect.poll(async () => Number(await card.getAttribute("data-composed-step"))).toBeGreaterThan(0);
    expect(Number(await card.getAttribute("data-composed-step"))).toBeLessThan(1);
    await expect(card).toHaveAttribute("data-composed-step", "1", { timeout: 10_000 });
    await slider.evaluate(node => { (node as HTMLInputElement).value = "2"; node.dispatchEvent(new Event("input")); });
    await expect(card).toHaveAttribute("data-common-factor-state", intuition.states[last]!.id);
    await expect(card.locator("[data-composed-count]")).toHaveText("3 / 3");
    await panel.screenshot({ path: info.outputPath(`intuition-${kind}.png`) });
    await root.locator("[data-composed-intuition-return]").click();
    await expect(parent).toBeVisible(); await expect(parent).toHaveAttribute("data-composed-step", "2.37");
    await expect(origin).toBeFocused();
  }
  for (const href of links) {
    await page.goto(`/experiments/reusable-reasoning/${href}`);
    await expect(root).toHaveAttribute("data-intuition-status", "ready", { timeout: 90_000 });
    await expect(panel.locator("[data-composed-count]")).toHaveText("1 / 3");
    await expect(panel.locator("[data-composed-intuition-setup]")).toContainText("x+3");
  }
  await page.goto("/experiments/reusable-reasoning/?example=algebra-intuition&intuition=collect&revision=old");
  await expect(root).toHaveAttribute("data-intuition-status", "repair-gap", { timeout: 90_000 });
  await expect(panel).toBeHidden();
  await expect(root.locator("[data-composed-error]")).toContainText("another source revision");
  expect(errors).toEqual([]);
});

test("question-oriented primary edits the complete canonical revision", async ({ page }, info) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/experiments/reusable-reasoning/?example=algebra-intuition");
  const root = page.locator("#authored-focus-card"), card = root.locator("[data-composed-card]");
  await expect(root).toHaveAttribute("data-composed-status", "ready", { timeout: 90_000 });
  await expect(card.locator("[data-kp-focus-deck-beat]")).toHaveCount(5);
  const slider = card.locator("[data-kp-focus-deck-scrubber]");
  await expect(slider).toHaveAttribute("max", "4");
  for (const step of [1, 2, 3, 4]) {
    await card.locator("[data-kp-focus-deck-next]").click();
    await expect.poll(async () => Number(await card.getAttribute("data-composed-step"))).toBeGreaterThan(step - 1);
    expect(Number(await card.getAttribute("data-composed-step"))).toBeLessThan(step);
    await expect(card).toHaveAttribute("data-composed-step", String(step), { timeout: 10_000 });
    await expect(card.locator("[data-composed-count]")).toHaveText(`${step + 1} / 5`);
    await expect(card).toHaveAttribute("data-common-factor-state", intuition.states[step]!.id);
    await card.screenshot({ path: info.outputPath(`question-state-${step}.png`) });
  }
  await slider.focus(); await page.keyboard.press("ArrowLeft");
  await expect(card).toHaveAttribute("data-composed-step", "3", { timeout: 10_000 });
  await slider.evaluate(node => { (node as HTMLInputElement).value = "2.37"; node.dispatchEvent(new Event("input")); });
  await expect(card).toHaveAttribute("data-composed-step", "2.37");
  const previousRevision = await root.getAttribute("data-composed-revision");
  const edited = structuredClone(intuition);
  edited.states.forEach((state, index) => { state.latex = ["2(x+4)+3(x+4)", "(2+3)(x+4)", "5(x+4)", "5x+5*4", "5x+20"][index]!;
    state.narration = state.narration.replaceAll("x+3", "x+4").replaceAll("x and 3", "x and 4").replaceAll("fifteen", "twenty"); });
  await root.locator("[data-reasoning-editor] summary").click();
  const editor = root.locator("[data-reasoning-json]"), status = root.locator("[data-reasoning-draft-status]");
  await editor.fill(JSON.stringify(edited)); await root.locator("[data-composed-apply]").click();
  await expect(status).toHaveAttribute("data-status", "applied", { timeout: 90_000 });
  expect(await root.getAttribute("data-composed-revision")).not.toBe(previousRevision);
  await slider.evaluate(node => { (node as HTMLInputElement).value = "4"; node.dispatchEvent(new Event("input")); });
  await expect(card).toHaveAttribute("data-composed-step", "4");
  await expect(card.locator('[data-kp-reader-accessible-equation-state][aria-current="step"]')).toContainText("20");
  const committed = await root.getAttribute("data-composed-revision");
  edited.states[4]!.latex = "5x+21";
  await editor.fill(JSON.stringify(edited)); await root.locator("[data-composed-apply]").click();
  await expect(status).toHaveAttribute("data-status", "repair-gap");
  await expect(root).toHaveAttribute("data-composed-revision", committed!);
  await expect(card).toHaveAttribute("data-composed-step", "4");
  await expect(page.locator(".common-factor-staging")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("complete algebra native handoff canary", async ({ page }, info) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/reusable-reasoning/?example=composed-algebra");
  await expect(page.locator("#authored-focus-card")).toHaveAttribute("data-composed-status", "ready", { timeout: 90_000 });
  const result = await page.evaluate(async value => {
    const path = "/tests/browser-helpers/composed-algebra-canary.ts";
    const helper = await import(/* @vite-ignore */ path);
    return helper.mountCompleteAlgebraCanary(value);
  }, intuition);
  expect(result.checkpoints).toHaveLength(5);
  expect(result.samples.every((sample: { canonicalPaintOwner: boolean }) => sample.canonicalPaintOwner)).toBe(true);
  expect(result.samples.every((sample: { nativeEndpointPassed: boolean }) => sample.nativeEndpointPassed)).toBe(true);
  expect(result.samples.some((sample: { accessibleEquationState: string }) => sample.accessibleEquationState.includes(".view."))).toBe(false);
  expect(result.driftRejected).toBe(true);
  await info.attach("handoff-paint", { body: JSON.stringify(result.seamPaint, null, 2), contentType: "application/json" });
  for (const [sampleIndex, observed] of result.seamPaint.entries()) {
    const paint = [...observed];
    if (sampleIndex === 2) {
      // Just inside distribution, two issued fan-out copies intentionally
      // occupy the same source pose; neither may retain a native duplicate.
      expect(paint).toHaveLength(7);
      const copies = paint.filter((atom: { ink: string }) => atom.ink === "glyph:5");
      expect(copies).toHaveLength(2);
      expect(copies.every((atom: { native: boolean }) => !atom.native)).toBe(true);
      expect(new Set(copies.map((atom: { owner: string }) => atom.owner)).size).toBe(2);
      paint.splice(1, 1);
    }
    expect(paint.map((atom: { ink: string }) => atom.ink)).toEqual(["glyph:5", "glyph:(", "glyph:x", "glyph:+", "glyph:3", "glyph:)"]);
    paint.forEach((atom: { rect: Record<string, number> }, index: number) => {
      for (const key of ["left", "top", "width", "height"])
        expect(Math.abs(atom.rect[key]! - result.seamPaint[0][index].rect[key]), `Leaf ${index} ${key}: ${JSON.stringify(paint)} vs ${JSON.stringify(result.seamPaint[0])}`).toBeLessThan(.5);
    });
  }
  await page.locator("#complete-algebra-canary").screenshot({ path: info.outputPath("native-handoff.png") });
  expect(errors).toEqual([]);
});

for (const selected of unfamiliarAuthoringCases) test(`authoring trial Apply and controls ${selected.name}`, async ({ page }, info) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/experiments/reusable-reasoning/?example=composed-algebra");
  const root = page.locator("#authored-focus-card");
  await expect(root).toHaveAttribute("data-composed-status", "ready", { timeout: 90_000 });
  await root.locator("[data-reasoning-editor] summary").click();
  const editor = root.locator("[data-reasoning-json]"), status = root.locator("[data-reasoning-draft-status]");
  await editor.fill(selected.text); await root.locator("[data-composed-apply]").click();
  await expect(status).toHaveAttribute("data-status", "applied", { timeout: 90_000 });
  await expect(root).toHaveAttribute("data-composed-revision", selected.draft.revisionId);
  await expect(root.locator("[data-composed-title]")).toHaveText(selected.source.editorial.title);
  const card = root.locator("[data-composed-reader] [data-composed-card]");
  const slider = card.locator("[data-kp-focus-deck-scrubber]");
  await expect(slider).toHaveAttribute("max", "2");
  await expect(card.locator("[data-kp-focus-deck-beat]")).toHaveCount(3);
  for (const step of [1, 2]) {
    await card.locator("[data-kp-focus-deck-next]").click();
    await expect.poll(async () => Number(await card.getAttribute("data-composed-step"))).toBeGreaterThan(step - 1);
    expect(Number(await card.getAttribute("data-composed-step"))).toBeLessThan(step);
    await expect(card).toHaveAttribute("data-composed-step", String(step), { timeout: 10_000 });
    await expect(card.locator("[data-composed-count]")).toHaveText(`${step + 1} / 3`);
    await expect(card).toHaveAttribute("data-common-factor-state", selected.source.states[step]!.id);
  }
  await slider.focus(); await page.keyboard.press("ArrowLeft");
  await expect(card).toHaveAttribute("data-composed-step", "1", { timeout: 10_000 });
  for (const position of [0, .37, 1, 1.37, 2]) {
    await slider.evaluate((node, p) => { (node as HTMLInputElement).value = String(p); node.dispatchEvent(new Event("input")); }, position);
    await expect(card).toHaveAttribute("data-composed-step", String(position));
    await card.screenshot({ path: info.outputPath(`trial-${position}.png`) });
  }
  for (const rejected of unfamiliarAuthoringRejections) {
    await editor.fill(rejected.text); await root.locator("[data-composed-apply]").click();
    await expect(status).toHaveAttribute("data-status", "repair-gap");
    await expect(root).toHaveAttribute("data-composed-revision", selected.draft.revisionId);
    await expect(card).toHaveAttribute("data-composed-step", "2");
  }
  const download = page.waitForEvent("download"); await root.locator("[data-composed-download]").click();
  const stream = await (await download).createReadStream();
  let bytes = ""; for await (const chunk of stream!) bytes += chunk.toString();
  expect(JSON.parse(bytes)).toEqual(selected.source);
  await expect(page.locator(".common-factor-staging")).toHaveCount(0);
  expect(errors).toEqual([]);
});

for (const selected of unfamiliarAuthoringCases) test(`authoring trial projections ${selected.name}`, async ({ page }, info) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/reusable-reasoning/?example=composed-algebra");
  const root = page.locator("#authored-focus-card");
  await expect(root).toHaveAttribute("data-composed-status", "ready", { timeout: 90_000 });
  await root.locator("[data-reasoning-editor] summary").click();
  await root.locator("[data-reasoning-json]").fill(selected.text);
  await root.locator("[data-composed-apply]").click();
  await expect(root.locator("[data-reasoning-draft-status]")).toHaveAttribute("data-status", "applied", { timeout: 90_000 });
  const card = root.locator("[data-composed-reader] [data-composed-card]");
  const reading = root.locator("[data-composed-reading-output]");
  for (const mode of ["full", "compact"]) {
    await root.locator("[data-composed-reading]").selectOption(mode);
    await expect(reading).toHaveAttribute("data-revision", selected.draft.revisionId);
    await expect(reading.locator("math")).toHaveCount(3);
    expect(await reading.locator('annotation[encoding="application/x-tex"]').allTextContents())
      .toEqual(selected.source.states.map(state => state.latex));
    await expect(reading).toContainText(selected.source.editorial.summary);
  }
  await card.locator("[data-kp-focus-deck-scrubber]").evaluate(node => {
    (node as HTMLInputElement).value = "1.37"; node.dispatchEvent(new Event("input"));
  });
  for (const kind of ["prediction", "reconstruction"] as const) {
    const origin = root.locator(`[data-composed-practice="${kind}"]`);
    await origin.click();
    await expect(reading).toBeHidden();
    await expect(root.locator("[data-composed-answer]")).toBeHidden();
    await root.locator("[data-composed-reveal]").click();
    await expect(root.locator("[data-composed-answer]")).toContainText(selected.source.states[kind === "prediction" ? 1 : 2].latex);
    await root.locator("[data-composed-return]").click();
    await expect(origin).toBeFocused();
    await expect(card).toHaveAttribute("data-composed-step", "1.37");
    await expect(root).toHaveAttribute("data-composed-revision", selected.draft.revisionId);
  }
  await page.screenshot({ path: info.outputPath("trial-reading.png"), fullPage: true });
  expect(errors).toEqual([]);
});

for (const selected of unfamiliarAuthoringCases) test(`authoring trial narrow reduced-motion reverse ${selected.name}`, async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/experiments/reusable-reasoning/?example=composed-algebra");
  const root = page.locator("#authored-focus-card");
  await expect(root).toHaveAttribute("data-composed-status", "ready", { timeout: 90_000 });
  await root.locator("[data-reasoning-editor] summary").click();
  await root.locator("[data-reasoning-json]").fill(selected.text);
  await root.locator("[data-composed-apply]").click();
  await expect(root.locator("[data-reasoning-draft-status]")).toHaveAttribute("data-status", "applied", { timeout: 90_000 });
  await root.locator("[data-reasoning-editor] summary").click();
  const card = root.locator("[data-composed-reader] [data-composed-card]");
  const slider = card.locator("[data-kp-focus-deck-scrubber]");
  for (const step of [1, 2, 1, 0]) {
    await slider.focus(); await page.keyboard.press(step > Number(await card.getAttribute("data-composed-step")) ? "ArrowRight" : "ArrowLeft");
    await expect(card).toHaveAttribute("data-composed-step", String(step));
    await expect(card).toHaveAttribute("data-common-factor-state", selected.source.states[step]!.id);
    await expect(card.locator("[data-composed-count]")).toHaveText(`${step + 1} / 3`);
    const bounds = await card.evaluate(node => ({
      headerBottom: node.querySelector(".kp-focus-deck__header")!.getBoundingClientRect().bottom,
      passageTop: node.querySelector("[data-kp-focus-deck-viewport]")!.getBoundingClientRect().top,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    expect(bounds.passageTop).toBeGreaterThanOrEqual(bounds.headerBottom);
    expect(bounds.overflow).toBeLessThanOrEqual(1);
  }
  // Reduced motion must not disable continuous, directly controlled positions.
  for (const position of [1.37, .37, 0]) {
    await slider.evaluate((node, p) => { (node as HTMLInputElement).value = String(p); node.dispatchEvent(new Event("input")); }, position);
    await expect(card).toHaveAttribute("data-composed-step", String(position));
  }
  await expect(root).toHaveAttribute("data-composed-revision", selected.draft.revisionId);
  expect(errors).toEqual([]);
});

test("authoring trial editions retain exact source without JavaScript", async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  try {
    const page = await context.newPage();
    for (const selected of unfamiliarAuthoringCases) {
      const edition = buildComposedAlgebraEdition(selected.path, true);
      const base = `/tmp/codex/composed-algebra-editions/${edition.directory.split("/").at(-1)}`;
      const response = await page.goto(`${base}/index.html`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("[data-composed-publication-revision]")).toHaveAttribute("data-composed-publication-revision", selected.draft.revisionId);
      await expect(page.locator("h1")).toHaveText(selected.source.editorial.title);
      await expect(page.locator("math")).toHaveCount(8);
      await expect(page.locator("[data-kp-focus-deck-scrubber]")).toHaveCount(0);
      const sourceResponse = await page.request.get(`${base}/source.json`);
      expect(sourceResponse.status()).toBe(200); expect(await sourceResponse.text()).toBe(selected.text);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    }
  } finally { await context.close(); }
});

for (const width of [1280, 390]) test(`primary combined review at ${width}px`, async ({ page }, info) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => window.addEventListener("error", () => {
    document.documentElement.dataset["reviewLayoutFailure"] = JSON.stringify(
      [...document.querySelectorAll<HTMLElement>('[data-composed-card], .kp-reader-equation-viewport, [data-kp-reader-equation-measurement]')].map(node => ({
        className: node.className, rect: node.getBoundingClientRect().toJSON(), connected: node.isConnected,
        display: getComputedStyle(node).display, visibility: getComputedStyle(node).visibility
      })));
  }));
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/experiments/reusable-reasoning/?example=composed-algebra");
  const root = page.locator("#authored-focus-card");
  await expect(root).toHaveAttribute("data-composed-status", "ready", { timeout: 90_000 });
  const card = root.locator("[data-composed-reader] [data-composed-card]");
  for (const position of [0, .37, 1, 1.5, 2]) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, p) => {
      (node as HTMLInputElement).value = String(p); node.dispatchEvent(new Event("input"));
    }, position);
    await expect(card).toHaveAttribute("data-composed-step", String(position));
    const bounds = await card.evaluate(node => {
      const header = node.querySelector(".kp-focus-deck__header")!.getBoundingClientRect();
      const passage = node.querySelector("[data-kp-focus-deck-viewport]")!.getBoundingClientRect();
      return { headerBottom: header.bottom, passageTop: passage.top,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    expect(bounds.passageTop).toBeGreaterThanOrEqual(bounds.headerBottom);
    expect(bounds.overflow).toBeLessThanOrEqual(1);
    await card.screenshot({ path: info.outputPath(`card-${position}.png`) });
  }
  await root.locator("[data-composed-reading]").selectOption("compact");
  await page.screenshot({ path: info.outputPath("compact-page.png"), fullPage: true });
  await root.locator('[data-composed-practice="prediction"]').click();
  await page.screenshot({ path: info.outputPath("practice.png"), fullPage: true });
  expect(errors, await page.locator("html").getAttribute("data-review-layout-failure") ?? "live lifecycle").toEqual([]);
  await root.locator("[data-composed-return]").click();
  const edition = buildComposedAlgebraEdition(fileURLToPath(new URL("../src/authoring/examples/composed-algebra-primary.json", import.meta.url)));
  const response = await page.goto(`/tmp/codex/composed-algebra-editions/${edition.directory.split("/").at(-1)}/index.html`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("[data-composed-publication-revision]")).toHaveAttribute("data-composed-publication-revision", edition.revisionId);
  await expect(page.locator("math")).toHaveCount(8); await expect(page.locator("[data-kp-focus-deck-scrubber]")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("static-edition.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("readings and practice share the displayed revision and return to exact chain position", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/experiments/reusable-reasoning/?example=composed-algebra");
  const root = page.locator("#authored-focus-card");
  await expect(root).toHaveAttribute("data-composed-status", "ready", { timeout: 90_000 });
  const card = root.locator("[data-composed-reader] [data-composed-card]"), reading = root.locator("[data-composed-reading-output]");
  const revision = await root.getAttribute("data-composed-revision");
  await expect(reading).toHaveAttribute("data-revision", revision!);
  for (const mode of ["compact", "full"]) {
    await root.locator("[data-composed-reading]").selectOption(mode);
    await expect(reading.locator("math")).toHaveCount(3);
    await expect(reading).toContainText("may be zero");
  }
  await card.locator("[data-kp-focus-deck-scrubber]").evaluate(node => {
    (node as HTMLInputElement).value = "1.37"; node.dispatchEvent(new Event("input"));
  });
  const progress = await card.getAttribute("data-common-factor-progress");
  for (const kind of ["prediction", "reconstruction"]) {
    const origin = root.locator(`[data-composed-practice="${kind}"]`);
    await origin.click();
    await expect(root.locator("[data-composed-practice-panel]")).toBeVisible();
    await expect(reading).toBeHidden(); await expect(root.locator("[data-reasoning-editor]")).toBeHidden();
    await expect(root.locator("[data-composed-answer]")).toBeHidden();
    await expect(card.locator("[data-kp-focus-deck-viewport]")).toContainText(kind === "prediction" ? "unevaluated sum" : "Reconstruct both steps");
    await root.locator("[data-composed-reveal]").click();
    await expect(root.locator("[data-composed-answer]")).toContainText(kind === "prediction" ? source.states[1]!.latex : source.states[2]!.latex);
    await expect(card).toHaveAttribute("data-common-factor-state", source.states[kind === "prediction" ? 1 : 2]!.id, { timeout: 10_000 });
    await root.locator("[data-composed-return]").click();
    await expect(card).toHaveAttribute("data-common-factor-progress", progress!);
    await expect(card).toHaveAttribute("data-composed-step", "1.37");
    await expect(origin).toBeFocused(); await expect(reading).toBeVisible();
    await expect(root).toHaveAttribute("data-composed-revision", revision!);
  }
  await root.locator("[data-reasoning-editor] summary").click();
  const edited = structuredClone(source); edited.editorial.summary = "Updated editorial summary for the same verified chain.";
  await root.locator("[data-reasoning-json]").fill(JSON.stringify(edited)); await root.locator("[data-composed-apply]").click();
  await expect(root.locator("[data-reasoning-draft-status]")).toHaveAttribute("data-status", "applied", { timeout: 90_000 });
  const next = await root.getAttribute("data-composed-revision"); expect(next).not.toBe(revision);
  await expect(reading).toHaveAttribute("data-revision", next!); await expect(reading).toContainText(edited.editorial.summary);
});

test("three-stop controls animate adjacent operations and reverse gestures without independent prose travel", async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/experiments/reusable-reasoning/?example=composed-algebra");
  await expect(page.locator("#authored-focus-card")).toHaveAttribute("data-composed-status", "ready", { timeout: 90_000 });
  const card = page.locator("[data-composed-reader] [data-composed-card]"), slider = card.locator("[data-kp-focus-deck-scrubber]");
  await expect(slider).toHaveAttribute("max", "2");
  await expect(card.locator("[data-kp-focus-deck-beat]")).toHaveCount(3);
  const position = async () => Number(await card.getAttribute("data-composed-step"));
  for (const step of [1, 2]) {
    await card.locator("[data-kp-focus-deck-next]").click();
    await expect.poll(position).toBeGreaterThan(step - 1); expect(await position()).toBeLessThan(step);
    await expect(card).toHaveAttribute("data-composed-step", String(step), { timeout: 10_000 });
    await expect(card.locator("[data-composed-count]")).toHaveText(`${step + 1} / 3`);
    await expect(card.locator('[data-kp-focus-deck-beat][aria-current="page"]')).toHaveAttribute("data-kp-focus-deck-beat", source.states[step]!.id);
  }
  await slider.focus(); await page.keyboard.press("ArrowLeft");
  await expect.poll(position).toBeLessThan(2); expect(await position()).toBeGreaterThan(1);
  await expect(card).toHaveAttribute("data-composed-step", "1", { timeout: 10_000 });
  await card.locator("[data-distribution-stage]").hover();
  await page.mouse.wheel(-420, 0);
  await expect(card).toHaveAttribute("data-composed-step", "0", { timeout: 10_000 });
  await page.mouse.wheel(420, 0);
  await expect(card).toHaveAttribute("data-composed-step", "1", { timeout: 10_000 });
  await page.mouse.wheel(-420, 0);
  await expect(card).toHaveAttribute("data-composed-step", "0", { timeout: 10_000 });
  // The fraction/prose are sampled in the same clock callback, not after settling.
  const immediate = await slider.evaluate(node => {
    (node as HTMLInputElement).value = "1.6"; node.dispatchEvent(new Event("input"));
    const root = node.closest("[data-composed-card]")!;
    return { count: root.querySelector("[data-composed-count]")!.textContent,
      active: root.querySelector('[aria-current="page"]')!.getAttribute("data-kp-focus-deck-beat") };
  });
  expect(immediate).toEqual({ count: "3 / 3", active: source.states[2]!.id });
  await slider.dispatchEvent("change"); await expect(card).toHaveAttribute("data-composed-step", "2", { timeout: 10_000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await card.locator("[data-kp-focus-deck-previous]").click();
  await expect(card).toHaveAttribute("data-composed-step", "1");
  await expect(card.locator("[data-composed-count]")).toHaveText("2 / 3");
});

test("interrupted motion yields immediately to direct seek across both contribution mechanisms", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/experiments/reusable-reasoning/?example=composed-algebra");
  await expect(page.locator("#authored-focus-card")).toHaveAttribute("data-composed-status", "ready");
  const card = page.locator("[data-composed-reader] [data-composed-card]");
  const slider = card.locator("[data-kp-focus-deck-scrubber]");
  for (const destination of [1.37, .37]) {
    await card.locator(destination > 1 ? "[data-kp-focus-deck-next]" : "[data-kp-focus-deck-previous]").click();
    await expect.poll(async () => Number(await card.getAttribute("data-composed-step"))).not.toBe(destination > 1 ? 0 : 1.37);
    const interruptedAt = Number(await card.getAttribute("data-composed-step"));
    expect(interruptedAt).toBeGreaterThan(destination > 1 ? 0 : 1);
    expect(interruptedAt).toBeLessThan(destination > 1 ? 1 : 1.37);
    const direct = await slider.evaluate((node, position) => {
      (node as HTMLInputElement).value = String(position); node.dispatchEvent(new Event("input"));
      const card = node.closest<HTMLElement>("[data-composed-card]")!;
      return { position: Number(card.dataset["composedStep"]), count: card.querySelector("[data-composed-count]")!.textContent };
    }, destination);
    expect(direct.position).toBeCloseTo(destination, 8);
    expect(direct.count).toBe(destination > 1 ? "2 / 3" : "1 / 3");
    // Give the interrupted RAF enough frames to expose a stale write; this
    // assertion must not pass merely because the next animation tick is pending.
    await page.waitForTimeout(250);
    expect(Number(await card.getAttribute("data-composed-step"))).toBeCloseTo(destination, 8);
    await expect(card.locator('[data-kp-reader-transition-active="true"]')).toHaveCount(1);
  }
});

test("composed authoring applies one coherent prepared revision and preserves it on repair gaps", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/experiments/reusable-reasoning/?example=composed-algebra");
  const root = page.locator("#authored-focus-card"), card = root.locator("[data-composed-reader] [data-composed-card]");
  await expect(root).toHaveAttribute("data-composed-status", "ready", { timeout: 90_000 });
  const first = await root.getAttribute("data-composed-revision");
  await root.locator("summary").click();
  const editor = root.locator("[data-reasoning-json]"), status = root.locator("[data-reasoning-draft-status]");
  const edited = structuredClone(source); edited.editorial.title = "Count a revised shared unit";
  edited.states[0]!.latex = "2(x+4)+3(x+4)"; edited.states[1]!.latex = "(2+3)(x+4)"; edited.states[2]!.latex = "5(x+4)";
  await editor.fill(JSON.stringify(edited));
  await expect(root).toHaveAttribute("data-composed-revision", first!);
  await root.locator("[data-composed-apply]").click();
  await expect(status).toHaveAttribute("data-status", "applied", { timeout: 90_000 });
  await expect(root.locator("[data-composed-title]")).toHaveText(edited.editorial.title);
  const revision = await root.getAttribute("data-composed-revision"); expect(revision).not.toBe(first);
  await expect(root.locator("[data-reasoning-revision]")).toHaveText(revision!);
  await expect(card).toHaveAttribute("data-canonical-presentation-revision", revision!);
  await expect(page.locator(".common-factor-staging")).toHaveCount(0);
  await card.locator("[data-kp-focus-deck-scrubber]").evaluate(node => {
    (node as HTMLInputElement).value = "1"; node.dispatchEvent(new Event("input"));
  });
  await expect(card).toHaveAttribute("data-composed-step", "1");
  await expect(card.locator("[data-composed-count]")).toHaveText("2 / 3");
  await editor.fill("{}"); await root.locator("[data-composed-apply]").click();
  await expect(status).toHaveAttribute("data-status", "repair-gap");
  await expect(root).toHaveAttribute("data-composed-revision", revision!);
  await expect(card).toHaveAttribute("data-composed-step", "1");
  const downloaded = page.waitForEvent("download"); await root.locator("[data-composed-download]").click();
  const stream = await (await downloaded).createReadStream();
  let json = ""; for await (const chunk of stream!) json += chunk.toString();
  expect(JSON.parse(json)).toEqual(edited);
});

test("composed remount releases stale owners and resize preserves the current contribution", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/experiments/reusable-reasoning/?example=composed-algebra");
  const root = page.locator("#authored-focus-card");
  await expect(root).toHaveAttribute("data-composed-status", "ready");
  await root.locator("[data-reasoning-editor] summary").click();
  for (const value of [product, source]) {
    const card = root.locator("[data-composed-reader] [data-composed-card]");
    const old = await card.elementHandle();
    await root.locator("[data-reasoning-json]").fill(JSON.stringify(value));
    await root.locator("[data-composed-apply]").click();
    await expect(root.locator("[data-reasoning-draft-status]")).toHaveAttribute("data-status", "applied");
    expect(await old!.evaluate(node => node.isConnected)).toBe(false);
    await expect(card).toHaveCount(1);
    for (const position of [1, 2, 1, 0]) {
      await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, p) => {
        (node as HTMLInputElement).value = String(p); node.dispatchEvent(new Event("input"));
      }, position);
      await expect(card).toHaveAttribute("data-composed-step", String(position));
      await expect(card.locator("[data-composed-count]")).toHaveText(`${position + 1} / 3`);
    }
    await page.setViewportSize({ width: value === product ? 390 : 1280, height: 900 });
    await expect(card).toHaveAttribute("data-composed-step", "0");
    const staleMutations = await old!.evaluate(async node => {
      let mutations = 0;
      const observer = new MutationObserver(records => { mutations += records.length; });
      observer.observe(node, { subtree: true, attributes: true, childList: true });
      window.dispatchEvent(new Event("resize"));
      document.fonts.dispatchEvent(new Event("loadingdone"));
      await new Promise(resolve => setTimeout(resolve, 250));
      observer.disconnect(); return mutations;
    });
    expect(staleMutations).toBe(0);
    await old!.dispose();
    await expect(card.locator('[data-kp-reader-transition-active="true"]')).toHaveCount(1);
    await expect(root.locator(".common-factor-staging")).toHaveCount(0);
  }
});

test("both retained sources round-trip native Apply practice and displayed-source download", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/experiments/reusable-reasoning/?example=composed-algebra");
  const root = page.locator("#authored-focus-card");
  await expect(root).toHaveAttribute("data-composed-status", "ready", { timeout: 90_000 });
  await root.locator("[data-reasoning-editor] summary").click();
  const editor = root.locator("[data-reasoning-json]"), status = root.locator("[data-reasoning-draft-status]");
  for (const value of [product, source]) {
    const previous = await root.getAttribute("data-composed-revision");
    await editor.fill(JSON.stringify(value)); await root.locator("[data-composed-apply]").click();
    await expect(status).toHaveAttribute("data-status", "applied", { timeout: 90_000 });
    const revision = await root.getAttribute("data-composed-revision"); expect(revision).not.toBe(previous);
    await expect(root.locator("[data-composed-title]")).toHaveText(value.editorial.title);
    const card = root.locator("[data-composed-reader] [data-composed-card]");
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate(node => {
      (node as HTMLInputElement).value = "1.37"; node.dispatchEvent(new Event("input"));
    });
    await root.locator('[data-composed-practice="reconstruction"]').click();
    await root.locator("[data-composed-reveal]").click();
    await expect(root.locator("[data-composed-answer]")).toContainText(value.states[2]!.latex);
    await root.locator("[data-composed-return]").click();
    await expect(card).toHaveAttribute("data-composed-step", "1.37");
    await editor.fill("{}"); await root.locator("[data-composed-apply]").click();
    await expect(status).toHaveAttribute("data-status", "repair-gap");
    await expect(root).toHaveAttribute("data-composed-revision", revision!);
    const downloaded = page.waitForEvent("download"); await root.locator("[data-composed-download]").click();
    const stream = await (await downloaded).createReadStream();
    let bytes = ""; for await (const chunk of stream!) bytes += chunk.toString();
    expect(JSON.parse(bytes)).toEqual(value);
    await expect(root.locator("[data-composed-reading-output]")).toHaveAttribute("data-revision", revision!);
    await expect(page.locator(".common-factor-staging")).toHaveCount(0);
  }
});

async function mountCanary(page: import("@playwright/test").Page, step: 0 | 1 | "chain", value = source) {
  await page.goto("/experiments/reusable-reasoning/?example=common-factor");
  await expect(page.locator("#authored-focus-card")).toHaveAttribute("data-common-factor-status", /^(ready|repair-gap)$/, { timeout: 90_000 });
  expect((await page.locator("#authored-focus-card [role=alert]").allTextContents()).filter(Boolean)).toEqual([]);
  await expect(page.locator("#authored-focus-card")).toHaveAttribute("data-common-factor-status", "ready", { timeout: 90_000 });
  // Exercise the production mount, not a test renderer or a hand-assembled plan.
  // The opt-in canary leaves the M1a review host untouched during discovery.
  return page.evaluate(async ({ value, step }) => {
    const path = "/tests/browser-helpers/composed-algebra-canary.ts";
    const { mountComposedAlgebraCanary } = await import(/* @vite-ignore */ path) as typeof import("./browser-helpers/composed-algebra-canary.ts");
    return mountComposedAlgebraCanary(value, step);
  }, { value, step });
}

test("both immutable editions retain complete readable math without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  try {
    const page = await context.newPage();
    for (const name of ["primary", "product"]) {
      const edition = buildComposedAlgebraEdition(fileURLToPath(new URL(`../src/authoring/examples/composed-algebra-${name}.json`, import.meta.url)));
      const response = await page.goto(`http://localhost:8000/tmp/codex/composed-algebra-editions/${edition.directory.split("/").at(-1)}/index.html`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("[data-composed-publication-revision]")).toHaveAttribute("data-composed-publication-revision", edition.revisionId);
      await expect(page.locator("math")).toHaveCount(8);
      await expect(page.locator("[data-kp-focus-deck-scrubber]")).toHaveCount(0);
      expect(await page.locator("body").innerText()).toContain(name === "primary" ? source.editorial.title : product.editorial.title);
    }
  } finally { await context.close(); }
});

test("pressure sources prepare native endpoints and bounded material in both orientations", async ({ page }) => {
  test.setTimeout(120_000);
  for (const example of composedAlgebraPressureCases) {
    await mountCanary(page, "chain", example.source);
    const card = page.locator("#composed-canary");
    for (const position of [0, .37, 1, 1.5, 2, 1, 0]) {
      await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, p) => {
        (node as HTMLInputElement).value = String(p); node.dispatchEvent(new Event("input"));
      }, position);
      await expect.poll(async () => Number(await card.getAttribute("data-composed-step"))).toBeCloseTo(position, 8);
      const dimensions = await card.locator('[data-kp-reader-transition-active="true"] [data-kp-reader-fit-surface]').evaluate(stage => {
        const bounds = stage.getBoundingClientRect();
        return [...stage.querySelectorAll<HTMLElement>('[data-kp-equation-material-semantic-entity-id]')]
          .filter(owner => Number(getComputedStyle(owner).opacity) > 0)
          .map(owner => {
            const rect = owner.getBoundingClientRect();
            return { finite: [rect.left, rect.top, rect.width, rect.height].every(Number.isFinite),
              width: rect.width, height: rect.height, stageWidth: bounds.width, stageHeight: bounds.height };
          });
      });
      for (const rect of dimensions) {
        expect(rect.finite).toBe(true);
        expect(rect.width).toBeLessThanOrEqual(rect.stageWidth);
        expect(rect.height).toBeLessThanOrEqual(rect.stageHeight);
      }
    }
  }
});

test("a temporarily collapsed viewport defers layout certification and recovers on the next visible sample", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/experiments/reusable-reasoning/?example=composed-algebra");
  await expect(page.locator("#authored-focus-card")).toHaveAttribute("data-composed-status", "ready", { timeout: 90_000 });
  const card = page.locator("[data-composed-reader] [data-composed-card]");
  await card.locator(".kp-reader-equation-viewport").evaluate(node => {
    const viewport = node as HTMLElement;
    // Model a transient zero-sized containing block, not an invalid equation.
    viewport.style.height = "0px";
    window.dispatchEvent(new Event("resize"));
    viewport.style.removeProperty("height");
    window.dispatchEvent(new Event("resize"));
  });
  await card.locator("[data-kp-focus-deck-next]").click();
  await expect(card).toHaveAttribute("data-composed-step", "1", { timeout: 10_000 });
  expect(errors).toEqual([]);
});

// Both retained callers must traverse identical ownership and continuity laws.
for (const [name, value, factorInk] of [["primary", source, "(x+3)"], ["product", product, "(x⋅y)"]] as const) {
test(`${name}: compound factoring uses the canonical native compositor with one owner per compound`, async ({ page }, info) => {
  test.setTimeout(120_000);
  const roles = await mountCanary(page, 0, value);
  const card = page.locator("#composed-canary");
  const poses = new Map<number, unknown>();
  for (const p of [0, .01, .18, .37, .68, .99, 1, .99, .37, .01, 0]) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, value) => {
      (node as HTMLInputElement).value = String(value); node.dispatchEvent(new Event("input"));
    }, p);
    await expect(card).toHaveAttribute("data-common-factor-progress", String(p));
    if (p > 0 && p < 1) {
      const groups = card.locator('[data-kp-equation-material-fragment-role^="group:factoring-"]');
      await expect(groups).toHaveCount(3);
      const pose = await groups.evaluateAll(nodes => nodes.map(node => ({
        id: node.getAttribute("data-kp-equation-material-semantic-entity-id"), text: node.textContent,
        opacity: getComputedStyle(node).opacity, transform: (node as HTMLElement).style.transform,
        x: node.getBoundingClientRect().x, y: node.getBoundingClientRect().y
      })));
      for (const owner of pose) expect(owner.text?.replaceAll(/\s/g, "")).toBe(factorInk);
      if (poses.has(p)) expect(pose).toEqual(poses.get(p)); else poses.set(p, pose);
    }
    await card.screenshot({ path: info.outputPath(`compound-${p}.png`) });
  }
  async function ink(progress: number, entityIds: readonly string[]) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, p) => {
      (node as HTMLInputElement).value = String(p); node.dispatchEvent(new Event("input"));
    }, progress);
    return card.evaluate(async (root, ids) => {
      const path = "/src/rendering/native-katex-paint-geometry.ts";
      const { measureKpNativeKatexSubtreePaintRect } = await import(/* @vite-ignore */ path) as typeof import("../src/rendering/native-katex-paint-geometry.ts");
      const stage = root.querySelector<HTMLElement>("[data-kp-reader-fit-surface]")!;
      const opacity = (node: HTMLElement) => {
        let value = 1;
        for (let parent: HTMLElement | null = node; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          if (style.visibility === "hidden" || style.display === "none") return 0;
          value *= Number(style.opacity); if (parent === root) break;
        }
        return value;
      };
      return ids.map(id => {
        const native = [...stage.querySelectorAll<HTMLElement>(`[data-kp-reader-native] [data-kp-semantic-entity-id="${id}"]`)];
        const material = [...stage.querySelectorAll<HTMLElement>(`[data-kp-equation-material-semantic-entity-id="${id}"]`)].map(owner => owner.firstElementChild as HTMLElement);
        const visible = [...native, ...material].filter(node => opacity(node) > .99);
        return { id, count: visible.length, rect: visible[0] ? measureKpNativeKatexSubtreePaintRect(stage, visible[0]) : undefined };
      });
    }, entityIds);
  }
  for (const [native, material, ids] of [[0, .000001, roles.factorCopyIds], [1, .999999, [roles.commonFactorId]]] as const) {
    const before = await ink(native, ids), after = await ink(material, ids);
    before.forEach((item, index) => {
      expect(item.count).toBe(1); expect(after[index]!.count).toBe(1);
      expect(item.rect).toBeDefined(); expect(after[index]!.rect).toBeDefined();
      for (const key of ["left", "top", "width", "height"] as const)
        expect(Math.abs(item.rect![key] - after[index]!.rect![key]), `${item.id} ${key}`).toBeLessThan(.1);
    });
  }
});

test(`${name}: factoring occupancy cannot disappear with ownership partitioning`, async ({ page }) => {
  await mountCanary(page, 0, value);
  const result = await page.evaluate(async value => {
    const path = "/tests/browser-helpers/composed-algebra-canary.ts";
    const { probeOmittedFactoringOccupancy } = await import(/* @vite-ignore */ path) as typeof import("./browser-helpers/composed-algebra-canary.ts");
    return probeOmittedFactoringOccupancy(value);
  }, value);
  expect(result.isolatedIntersections).toBe(0);
  expect(result.combinedIntersections).toBeGreaterThan(0);
  expect(result.uninspectedPublicationRejected).toBe(true);
  expect(result.after).toEqual(result.before); // Inspection may not rewrite the motif.
  expect(result.handoff[0]).toHaveLength(2); expect(result.handoff[1]).toHaveLength(1);
  const received = result.handoff[1]![0]!;
  for (const contributor of result.handoff[0]!) {
    expect(contributor.focus).toEqual(received.focus);
    for (const key of ["left", "top", "width", "height"] as const)
      expect(Math.abs(contributor.rect![key] - received.rect![key])).toBeLessThan(.1);
  }
});

test(`${name}: evaluation contributor and result ink preserve native handoffs and exclusive ownership`, async ({ page }) => {
  const { evaluation } = await mountCanary(page, 1, value);
  const card = page.locator("#composed-canary");
  const poses = new Map<number, unknown>();
  async function capture(p: number) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, progress) => {
      (node as HTMLInputElement).value = String(progress); node.dispatchEvent(new Event("input"));
    }, p);
    return card.evaluate(async (root, roles) => {
      const path = "/src/rendering/native-katex-paint-geometry.ts";
      const { measureKpNativeKatexSubtreePaintRect } = await import(/* @vite-ignore */ path) as typeof import("../src/rendering/native-katex-paint-geometry.ts");
      const stage = root.querySelector<HTMLElement>("[data-kp-reader-fit-surface]")!;
      const visible = (node: HTMLElement) => {
        let opacity = 1;
        for (let parent: HTMLElement | null = node; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          if (style.visibility === "hidden" || style.display === "none") return false;
          opacity *= Number(style.opacity); if (parent === root) break;
        }
        return opacity > .99;
      };
      const collect = (side: "source" | "target") => roles[side].map(role => {
        const native = [...stage.querySelectorAll<HTMLElement>(`[data-kp-reader-native="${side}"] [data-kp-semantic-entity-id]`)]
          .filter(node => role.selectorIds.includes(node.dataset["kpSemanticEntityId"]!) && visible(node));
        const material = [...stage.querySelectorAll<HTMLElement>("[data-kp-equation-material-semantic-entity-id]")]
          .filter(node => node.dataset["kpEquationMaterialSemanticEntityId"] === role.id && visible(node));
        const nodes = [...native, ...material.map(node => node.firstElementChild as HTMLElement)];
        const rects = nodes.map(node => measureKpNativeKatexSubtreePaintRect(stage, node));
        if (rects.some(rect => rect === undefined)) throw new Error("Missing realized evaluation ink.");
        const ink = rects.filter((rect): rect is NonNullable<typeof rect> => rect !== undefined);
        const left = Math.min(...ink.map(rect => rect.left)), top = Math.min(...ink.map(rect => rect.top));
        return { id: role.id, native: native.length, material: material.length,
          ownerIds: material.map(node => node.dataset["kpEquationMaterialOwnerId"]!),
          rect: ink.length ? { left, top, width: Math.max(...ink.map(rect => rect.left + rect.width)) - left,
            height: Math.max(...ink.map(rect => rect.top + rect.height)) - top } : null };
      });
      return { source: collect("source"), target: collect("target") };
    }, evaluation);
  }
  for (const p of [0, .000001, .25, .48, .519999, .520001, .75, .999999, 1, .75, .25, .000001, 0]) {
    const pose = await capture(p);
    const sourceOwns = p < .52, materialOwns = p > 0 && p < 1;
    for (const [side, items] of Object.entries(pose)) for (const item of items) {
      const owns = (side === "source") === sourceOwns;
      expect(item.native > 0).toBe(owns && !materialOwns);
      expect(item.material > 0).toBe(owns && materialOwns);
      expect(new Set(item.ownerIds).size).toBe(item.ownerIds.length);
    }
    if (poses.has(p)) expect(pose).toEqual(poses.get(p)); else poses.set(p, pose);
  }
  for (const [nativeProgress, materialProgress, side] of [[0, .000001, "source"], [1, .999999, "target"]] as const) {
    const native = (await capture(nativeProgress))[side], material = (await capture(materialProgress))[side];
    for (const [i, item] of native.entries()) {
      expect(item.rect).not.toBeNull(); expect(material[i]!.rect).not.toBeNull();
      for (const key of ["left", "top", "width", "height"] as const)
        expect(Math.abs(item.rect![key] - material[i]!.rect![key]), `${side} ${item.id} ${key}`).toBeLessThan(.1);
    }
  }
  const original = (await capture(.000001)).source, kernel = (await capture(.48)).source;
  original.forEach((item, i) => {
    expect(kernel[i]!.rect!.width).toBeLessThan(item.rect!.width);
    expect(kernel[i]!.rect!.height).toBeLessThan(item.rect!.height);
  });
  // DOM opacity and Range bounds alone cannot prove that the clipped kernel
  // actually paints. Sample the browser raster on both sides of ownership.
  for (const p of [.519999, .520001]) {
    await card.locator("[data-kp-reader-fit-surface]").scrollIntoViewIfNeeded();
    await capture(p);
    const clip = await card.evaluate(root => {
      const owners = [...root.querySelectorAll<HTMLElement>('[data-kp-equation-material-fragment-role^="successor-"]')]
        .filter(node => getComputedStyle(node).opacity === "1");
      const bounds = owners.map(node => node.firstElementChild!.getBoundingClientRect());
      const x = Math.floor(Math.min(...bounds.map(rect => rect.left))), y = Math.floor(Math.min(...bounds.map(rect => rect.top)));
      return { x, y, width: Math.ceil(Math.max(...bounds.map(rect => rect.right))) - x,
        height: Math.ceil(Math.max(...bounds.map(rect => rect.bottom))) - y };
    });
    const raster = await page.screenshot({ clip, scale: "css" });
    const inkPixels = await page.evaluate(async base64 => {
      const image = new Image(); image.src = `data:image/png;base64,${base64}`; await image.decode();
      const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext("2d")!; context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, image.width, image.height).data;
      let ink = 0;
      for (let i = 0; i < pixels.length; i += 4)
        if (pixels[i + 3]! > 0 && pixels[i]! + pixels[i + 1]! + pixels[i + 2]! < 500) ink++;
      return ink;
    }, raster.toString("base64"));
    expect(inkPixels, `real painted kernel at ${p}`).toBeGreaterThan(0);
  }
});

test(`${name}: contextual sum uses certified ink-glyph evaluation while compound context persists`, async ({ page }, info) => {
  await mountCanary(page, 1, value);
  const card = page.locator("#composed-canary"), stage = card.locator("[data-kp-reader-fit-surface]");
  const poses = new Map<number, unknown>();
  let contextShape: readonly { x: number; y: number; width: number; height: number }[] | undefined;
  for (const p of [0, .01, .25, .5, .75, .99, 1, .75, .5, .01, 0]) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, value) => {
      (node as HTMLInputElement).value = String(value); node.dispatchEvent(new Event("input"));
    }, p);
    await expect(card).toHaveAttribute("data-common-factor-progress", String(p));
    if (p > 0 && p < 1) {
      await expect(stage).toHaveAttribute("data-kp-operation-evaluation-family", "contributor-fusion");
      const context = stage.locator('[data-kp-equation-material-semantic-entity-id$=".paint.factor"]');
      const pose = await context.evaluateAll(async nodes => {
        const path = "/src/rendering/native-katex-paint-geometry.ts";
        const { measureKpNativeKatexSubtreePaintRect } = await import(/* @vite-ignore */ path) as typeof import("../src/rendering/native-katex-paint-geometry.ts");
        return nodes.map(node => {
          const stage = node.closest<HTMLElement>("[data-kp-reader-fit-surface]")!;
          const rect = measureKpNativeKatexSubtreePaintRect(stage, node.firstElementChild as HTMLElement);
          if (!rect) throw new Error("Missing unchanged-context ink.");
          return { text: node.textContent, opacity: getComputedStyle(node).opacity, rect };
        }).sort((a, b) => a.rect.left - b.rect.left);
      });
      expect(pose.length).toBeGreaterThan(0);
      expect(pose.map(p => p.text).join("").replaceAll(/\s/g, "")).toBe(factorInk);
      expect(pose.every(item => item.opacity === "1")).toBe(true);
      const shape = pose.map(item => ({ x: item.rect.left - pose[0]!.rect.left, y: item.rect.top - pose[0]!.rect.top,
        width: item.rect.width, height: item.rect.height }));
      if (contextShape) shape.forEach((item, i) => {
        for (const key of ["x", "y", "width", "height"] as const) expect(Math.abs(item[key] - contextShape![i]![key])).toBeLessThan(.1);
      }); else contextShape = shape;
      if (poses.has(p)) expect(pose).toEqual(poses.get(p)); else poses.set(p, pose);
    }
    await card.screenshot({ path: info.outputPath(`evaluation-${p}.png`) });
  }
});

test(`${name}: one canonical chain retains native geometry across the shared checkpoint and direct reverse`, async ({ page }, info) => {
  await mountCanary(page, "chain", value);
  const card = page.locator("#composed-canary");
  await expect(card.locator("[data-kp-canonical-equation-host]")).toHaveCount(1);
  await expect(card.locator("[data-kp-reader-transition]")).toHaveCount(2);
  const samples = new Map<number, Awaited<ReturnType<typeof capture>>>();
  async function capture(position: number) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, value) => {
      (node as HTMLInputElement).value = String(value); node.dispatchEvent(new Event("input"));
    }, position);
    await expect.poll(async () => Number(await card.getAttribute("data-composed-step"))).toBeCloseTo(position, 8);
    const active = card.locator('[data-kp-reader-transition-active="true"]');
    await expect(active).toHaveCount(1);
    return active.evaluate(async root => {
      const path = "/src/rendering/native-katex-paint-geometry.ts";
      const { measureKpNativeKatexPaintAtomRect } = await import(/* @vite-ignore */ path) as typeof import("../src/rendering/native-katex-paint-geometry.ts");
      const scenePath = "/src/rendering/native-katex-rendered-scene.ts";
      const { observeKpNativeKatexPaintAtoms } = await import(/* @vite-ignore */ scenePath) as typeof import("../src/rendering/native-katex-rendered-scene.ts");
      const stage = root.querySelector<HTMLElement>("[data-kp-reader-fit-surface]")!;
      const visible = observeKpNativeKatexPaintAtoms({ stage, root: stage, endpoint: "source", semanticEntityId: "canary", presentationGroupId: "canary", fontRevision: 0 }).filter(atom => {
        let opacity = 1;
        for (let parent: HTMLElement | null = atom.sourceElement; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          if (style.visibility === "hidden" || style.display === "none") return false;
          opacity *= Number(style.opacity); if (parent === root) break;
        }
        return opacity > .99;
      });
      const rects = visible.map(atom => measureKpNativeKatexPaintAtomRect(stage, atom));
      const left = Math.min(...rects.map(rect => rect.left)), top = Math.min(...rects.map(rect => rect.top));
      return { text: visible.map(atom => atom.sourceElement.textContent).sort(), atoms: visible.map((atom, i) => ({ text: atom.sourceElement.textContent, rect: rects[i] })), left, top,
        width: Math.max(...rects.map(rect => rect.left + rect.width)) - left,
        height: Math.max(...rects.map(rect => rect.top + rect.height)) - top };
    });
  }
  // Revisit interior frames after crossing both ownership and operation boundaries.
  // A stable outer rectangle alone can conceal displaced or duplicated inner ink.
  for (const p of [0, .37, .68, .9, .999999, 1, 1.000001, 1.25, 1.5, 2,
    .68, 1.25, .37, 1.5, .9, 1.000001, 1, .999999, 0]) {
    const sample = await capture(p);
    if (samples.has(p)) {
      expect(sample.text).toEqual(samples.get(p)!.text);
      for (const key of ["left", "top", "width", "height"] as const) expect(Math.abs(sample[key] - samples.get(p)![key])).toBeLessThan(.001);
      const previous = samples.get(p)!.atoms;
      expect(sample.atoms).toHaveLength(previous.length);
      sample.atoms.forEach((atom, index) => {
        expect(atom.text).toBe(previous[index]!.text);
        const beforeRect = previous[index]!.rect;
        if (!atom.rect || !beforeRect) throw new Error("Replay requires measured ink for every visible atom.");
        for (const key of ["left", "top", "width", "height"] as const)
          expect(Math.abs(atom.rect[key] - beforeRect[key]), `replay ${p} atom ${index} ${key}`).toBeLessThan(.001);
      });
    } else samples.set(p, sample);
    await card.screenshot({ path: info.outputPath(`chain-${p}.png`) });
  }
  for (const p of [.999999, 1.000001]) for (const key of ["left", "top", "width", "height"] as const)
    expect(Math.abs(samples.get(p)![key] - samples.get(1)![key]), JSON.stringify({ checkpoint: p, key, before: samples.get(p), after: samples.get(1) })).toBeLessThan(kpEquationSettlementTolerancePx);
  // Exact stops have one native owner, never native plus re-exposed ink material.
  expect(samples.get(1)!.text).toHaveLength(10);
  expect(samples.get(2)!.text).toHaveLength(6);
});
}
