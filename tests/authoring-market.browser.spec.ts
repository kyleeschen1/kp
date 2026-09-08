import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { readFile, writeFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { buildKpAuthoringMarketEdition, kpAuthoringMarketEditionRoot } from "../scripts/build-authoring-market-edition.ts";
import { buildKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-build.ts";
import { compileKpAuthoredTaxSource } from "../scripts/compile-canonical-tax-source.ts";
import { compileKpAuthoringMarketStaticReading, compileKpAuthoringEquationStaticReading } from "../src/experiments/authoring-market/authoring-market-static-reading.ts";
import { createKpEquationSeriesLogarithmBaseExample } from "../src/authoring/equation-series-logarithm-base-example.ts";

test("equation authoring Focus Card retains paint on repairs and shares one continuous semantic playhead", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/authoring-market/#equation-authoring");
  const editor = page.locator("[data-kp-authoring-equation]");
  const deck = editor.locator("[data-kp-focus-deck]");
  const stage = deck.locator("[data-kp-logarithm-change-of-base-stage]");
  await expect(stage).toHaveAttribute("data-kp-logarithm-change-of-base-stage", "ready");
  await expect(page).toHaveURL(/#equation-authoring$/);
  await expect(deck.locator('[data-kp-editor-animation-surface-slot="equation"]')).toHaveAttribute("data-kp-editor-animation-adapter-id", "editor-animation-surface.logarithm-change-of-base.canonical-native-katex");
  await seek(deck.locator("[data-kp-focus-deck-scrubber]"), 0.37);
  await expect(stage).toHaveAttribute("data-kp-logarithm-change-of-base-progress", "0.37");
  await page.evaluate(() => { document.querySelector("[data-kp-logarithm-change-of-base-stage]")!.setAttribute("data-retained-stage", "yes"); });
  const request = JSON.parse(await editor.locator("textarea").inputValue());
  request.states[1].narration = "Keep the value; rewrite the base using **natural logarithms**.";
  await editor.locator("textarea").fill(JSON.stringify(request, null, 2));
  await editor.getByRole("button", { name: "Compile equation draft" }).click();
  await expect(editor).toHaveAttribute("data-kp-authoring-equation", "compiled");
  await expect(deck.locator(".kp-focus-deck__passage-page").nth(1)).toContainText("Keep the value");
  for (const bad of ["{", JSON.stringify({ ...request, states: [request.states[0], { ...request.states[1], latex: "x+1" }] })]) {
    await editor.locator("textarea").fill(bad);
    await editor.getByRole("button", { name: "Compile equation draft" }).click();
    await expect(editor).toHaveAttribute("data-kp-authoring-equation", "repair-required");
    await expect(editor.locator("[data-kp-equation-status]")).toContainText("Last valid equation retained");
    await expect(stage).toHaveAttribute("data-retained-stage", "yes");
    await expect(stage).toHaveAttribute("data-kp-logarithm-change-of-base-progress", "0.37");
  }
  const history = page.locator("[data-kp-authoring-market-source-history]");
  await history.locator("summary").click();
  await history.getByLabel("Include displayed, compiled equation in this edition").check();
  await history.getByRole("button", { name: "Export selected source as branch" }).click();
  await expect(history).toContainText("Compile and inspect a valid equation before including it");
  await editor.getByRole("button", { name: "Restore displayed request" }).click();
  await expect(editor).toHaveAttribute("data-kp-authoring-equation", "compiled");
  expect(JSON.parse(await editor.locator("textarea").inputValue())).toEqual(request);
  const viewport = deck.locator("[data-kp-focus-deck-viewport]");
  for (const position of [0.23, 0.64, 0.41]) {
    await viewport.evaluate((element, position) => { element.scrollLeft = element.clientWidth * position; }, position);
    await expect.poll(async () => Number(await stage.getAttribute("data-kp-logarithm-change-of-base-progress"))).toBeCloseTo(position, 2);
  }
  await seek(deck.locator("[data-kp-focus-deck-scrubber]"), 0.8);
  await deck.getByRole("button", { name: "Previous step" }).click();
  await expect.poll(async () => Number(await stage.getAttribute("data-kp-logarithm-change-of-base-progress"))).toBeLessThan(0.7);
  await expect(stage).toHaveAttribute("data-kp-logarithm-change-of-base-progress", "0", { timeout: 10000 });
  await deck.getByRole("button", { name: "Next step" }).click();
  await expect.poll(async () => Number(await stage.getAttribute("data-kp-logarithm-change-of-base-progress"))).toBeGreaterThan(0.1);
  await expect(stage).toHaveAttribute("data-kp-logarithm-change-of-base-progress", "1", { timeout: 10000 });
  await expect(stage).toHaveAttribute("data-kp-logarithm-change-of-base-visual-owner", "target-native");
  for (const width of [1280, 900, 800, 390]) {
    const geometryRevision = await stage.getAttribute("data-kp-logarithm-change-of-base-geometry-revision");
    await page.setViewportSize({ width, height: 900 });
    await seek(deck.locator("[data-kp-focus-deck-scrubber]"), 0.5);
    if (width !== 1280) await expect(stage).not.toHaveAttribute("data-kp-logarithm-change-of-base-geometry-revision", geometryRevision!);
    await expect(stage).toHaveAttribute("data-kp-logarithm-change-of-base-geometry-state", "ready");
    await expect.poll(() => stage.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      const ink = [...element.querySelectorAll('[data-kp-equation-material-semantic-entity-id="source.log-base-two.argument-seven"], [data-kp-equation-material-semantic-entity-id="source.log-base-two.base"]')];
      return ink.length === 2 && ink.every(owner => {
        const box = owner.getBoundingClientRect();
        return box.width > 5 && box.height > 5 && box.left >= bounds.left - 1 && box.right <= bounds.right + 1 && box.top >= bounds.top - 1 && box.bottom <= bounds.bottom + 1;
      });
    })).toBe(true);
    await deck.screenshot({ path: info.outputPath(`equation-authoring-${width}-midpoint.png`) });
    expect(await deck.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await deck.getByRole("button", { name: "Previous step" }).click();
  await expect(stage).toHaveAttribute("data-kp-logarithm-change-of-base-progress", "0");
  await deck.locator("[data-kp-focus-deck-scrubber]").focus();
  await page.keyboard.press("ArrowRight");
  await expect(stage).toHaveAttribute("data-kp-logarithm-change-of-base-progress", "1");
  await page.keyboard.press("ArrowLeft");
  await expect(stage).toHaveAttribute("data-kp-logarithm-change-of-base-progress", "0");
  expect(errors).toEqual([]);
});

test("equation authoring numeric JSON replaces verified native ink and retains it on invalid edits", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/authoring-market/#equation-authoring");
  const editor = page.locator("[data-kp-authoring-equation]");
  const stage = editor.locator("[data-kp-logarithm-change-of-base-stage]");
  await expect(stage).toHaveAttribute("data-kp-logarithm-change-of-base-stage", "ready");
  const request = JSON.parse(await editor.locator("textarea").inputValue());
  const scrubber = editor.locator("[data-kp-focus-deck-scrubber]");
  await seek(scrubber, 0.37);
  for (const [base, argument] of [[2, 9], [10, 100]]) {
    request.states[0].latex = `\\log_{${base}} ${argument}`;
    request.states[1].latex = `\\frac{\\ln ${argument}}{\\ln ${base}}`;
    await editor.locator("textarea").fill(JSON.stringify(request));
    await editor.getByRole("button", { name: "Compile equation draft" }).click();
    await expect(editor).toHaveAttribute("data-kp-authoring-equation", "compiled");
    await expect(stage).toHaveCount(1);
    await expect(stage).toHaveAttribute("data-kp-logarithm-change-of-base-progress", "0.37");
    await expect(stage.locator("annotation").first()).toContainText(String(argument));
    await expect(stage.locator('[data-kp-equation-material-semantic-entity-id="source.logarithm.argument"]')).toContainText(String(argument));
    await seek(scrubber, 1);
    await expect(stage).toHaveAttribute("data-kp-logarithm-change-of-base-visual-owner", "target-native");
    await expect(stage.locator("annotation").last()).toContainText(String(base));
    await seek(scrubber, 0.37);
    expect(JSON.parse(await editor.locator("textarea").inputValue()).adjacencies[0].intent.semanticArguments).toEqual({});
  }
  await stage.evaluate(element => element.setAttribute("data-retained-stage", "numeric"));
  request.states[0].latex = "\\log_{1} 100";
  await editor.locator("textarea").fill(JSON.stringify(request));
  await editor.getByRole("button", { name: "Compile equation draft" }).click();
  await expect(editor).toHaveAttribute("data-kp-authoring-equation", "repair-required");
  await expect(stage).toHaveAttribute("data-retained-stage", "numeric");
  await seek(scrubber, 0.6);
  await expect(stage).toHaveAttribute("data-kp-logarithm-change-of-base-progress", "0.6");
  expect(errors).toEqual([]);
});

test("equation authoring superseded preparation cannot revive stale paint or a disposed card", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/authoring-market/#equation-authoring");
  const editor = page.locator("[data-kp-authoring-equation]");
  await expect(editor).toHaveAttribute("data-kp-authoring-equation", "compiled");
  const request = JSON.parse(await editor.locator("textarea").inputValue());
  const race = async (mode: "valid" | "invalid" | "restore" | "dispose") => editor.evaluate((root, { request, mode }) => {
    const textarea = root.querySelector("textarea")!;
    const compile = root.querySelector<HTMLButtonElement>("[data-kp-equation-compile]")!;
    const edit = (argument: number) => {
      const changed = structuredClone(request);
      changed.states[0].latex = `\\log_{2} ${argument}`;
      changed.states[1].latex = `\\frac{\\ln ${argument}}{\\ln 2}`;
      textarea.value = JSON.stringify(changed);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      compile.click();
    };
    edit(9);
    if (mode === "valid") edit(11);
    if (mode === "invalid") { textarea.value = "{"; textarea.dispatchEvent(new Event("input")); compile.click(); }
    if (mode === "restore") root.querySelector<HTMLButtonElement>("[data-kp-equation-restore]")!.click();
    if (mode === "dispose") window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false }));
  }, { request, mode });
  await race("valid");
  await expect(editor).toHaveAttribute("data-kp-authoring-equation", "compiled");
  const stage = editor.locator("[data-kp-logarithm-change-of-base-stage]");
  await expect(stage).toHaveCount(1);
  await expect(stage.locator("annotation").first()).toContainText("11");
  await race("invalid");
  await expect(editor).toHaveAttribute("data-kp-authoring-equation", "repair-required");
  await expect(editor.locator(".kp-authoring-equation-staging")).toHaveCount(0);
  await expect(stage.locator("annotation").first()).toContainText("11");
  await race("restore");
  await expect(editor).toHaveAttribute("data-kp-authoring-equation", "compiled");
  await expect(editor.locator(".kp-authoring-equation-staging")).toHaveCount(0);
  await expect(stage.locator("annotation").first()).toContainText("11");
  expect(JSON.parse(await editor.locator("textarea").inputValue()).states[0].latex).toContain("11");
  await race("dispose");
  await expect(editor).toBeEmpty();
  expect(errors).toEqual([]);
});

test("bounded static readings remain meaningful with JavaScript disabled", async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    const market = compileKpAuthoringMarketStaticReading(compileKpAuthoredTaxSource(buildKpAuthoringMarketPreview("variation")));
    const equation = compileKpAuthoringEquationStaticReading(createKpEquationSeriesLogarithmBaseExample().value);
    await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Bounded reading edition</title><base href="http://127.0.0.1:4173/"><link rel="stylesheet" href="/node_modules/katex/dist/katex.min.css"></head><body>${market.html}${equation}</body></html>`);
    await expect(page.getByRole("heading", { name: "How does a tax reshape a market?" })).toBeVisible();
    await expect(page.locator('dt:has-text("after.revenue") + dd')).toHaveText("10");
    await expect(page.locator("[data-kp-authoring-equation-static] math")).toHaveCount(2);
    await expect(page.locator("[data-kp-authoring-equation-static] .katex-html")).toHaveCount(2);
    await expect(page.locator("script, img, canvas, iframe")).toHaveCount(0);
    await page.screenshot({ path: info.outputPath("bounded-no-js-reading.png"), fullPage: true });
  } finally { await context.close(); }
});

test("opt-in authoring host preserves canonical baseline and disposes cleanly", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/authoring-market/");
  await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market", "state-driven-tax");
  await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market-snapshot-count", "3");
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat", "baseline-market");
  await expect(deck.locator(".kp-supply-tax-graph__math .katex")).toHaveCount(27);
  await expect(deck.locator('[data-kp-supply-tax-entity="curve.economics.tax.supply"]')).toBeVisible();
  const baselineSvg = await deck.locator("svg").first().evaluate(element => element.outerHTML);
  await deck.screenshot({ path: info.outputPath("canonical-baseline.png") });
  await captureAuthorReview(page, info, "reference");
  await page.evaluate(async modulePath => {
    window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false }));
    const { mountKpAuthoringMarket } = await import(modulePath);
    const { prepareKpAuthoringMarketPreview } = await import(modulePath.replace("authoring-market-host", "authoring-market-preview-prepare"));
    const revision = await fetch("/__kp/authoring-market/revision").then(response => response.json());
    const root = document.querySelector<HTMLElement>("#app")!;
    const session = mountKpAuthoringMarket({ root, prepared: prepareKpAuthoringMarketPreview(revision.preview) });
    session.dispose();
    session.dispose();
  }, "/src/experiments/authoring-market/authoring-market-host.ts");
  await expect(page.locator("#app")).toBeEmpty();
  await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market", "disposed");
  await page.goto("/experiments/kinetic-figure/supply-tax/");
  const canonicalDeck = page.locator("[data-kp-supply-tax-focus-deck]");
  await expect(canonicalDeck).toHaveAttribute("data-kp-focus-deck-active-beat", "baseline-market");
  expect(await canonicalDeck.locator("svg").first().evaluate(element => element.outerHTML)).toBe(baselineSvg);
  await expect(page.locator("#app")).not.toHaveAttribute("data-kp-authoring-market");
  expect(errors).toEqual([]);
});

test("state-driven SVG preserves canonical transit, endpoints and reverse seeks", async ({ page }, info) => {
  const positions = [0, 1, 1.25, 1.5, 1.75, 2, 4, 7, 1.5, 0];
  const reference: string[] = [];
  for (const path of ["/experiments/kinetic-figure/supply-tax/", "/experiments/authoring-market/"]) {
    await page.goto(path);
    const deck = page.locator("[data-kp-supply-tax-focus-deck]");
    await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat", "baseline-market");
    for (const [index, position] of positions.entries()) {
      await seek(deck.locator("[data-kp-supply-tax-state-scrubber]"), position);
      // Exact accessible wording is now checked separately from preserved paint.
      const svg = await deck.locator("svg").first().evaluate(element => {
        const clone = element.cloneNode(true) as SVGSVGElement;
        clone.querySelector("desc")!.textContent = "";
        return clone.outerHTML;
      });
      if (path.includes("authoring-market")) {
        expect(svg, `canonical SVG at position ${position}`).toBe(reference[index]);
        await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market-snapshot-count", "3");
        if (index === 3) await deck.screenshot({ path: info.outputPath("state-driven-midpoint.png") });
      } else reference.push(svg);
    }
  }
});

test("native KaTeX uses exact live values and an explicitly separate endpoint ledger", async ({ page }, info) => {
  await page.goto("/experiments/authoring-market/");
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat", "baseline-market");
  await seek(deck.locator("[data-kp-supply-tax-state-scrubber]"), 1.371);
  const exact = await page.evaluate(async modulePath => {
    const { createKpAuthoringMarketFrameSession } = await import(modulePath);
    const { createKpAuthoredMarketSource } = await import(modulePath.replace("authoring-market/authoring-market-frame", "typed-linear-supply-demand/authoring-market-source"));
    const query = createKpAuthoringMarketFrameSession(createKpAuthoredMarketSource({ kind: "impose-per-unit-tax" }));
    const encoding = JSON.parse(document.querySelector<HTMLElement>("#app")!.dataset["kpAuthoringMarketAddress"]!);
    const [numerator, denominator] = encoding[5].split("/").map(Number);
    const frame = query.sample(numerator / denominator).frame;
    query.dispose();
    return frame;
  }, "/src/tutorial/authoring-market/authoring-market-frame.ts");
  const latex = (value: { numerator: string; denominator: string }) => value.denominator === "1"
    ? value.numerator : `\\frac{${value.numerator}}{${value.denominator}}`;
  const expectedPaint = await nativePaint(page, `P_c=${latex(exact.market.consumerPrice)}`);
  expect(await deck.locator('[data-kp-supply-tax-math-label="consumer-price"] > div').innerHTML()).toBe(expectedPaint);
  const spoken = (value: { numerator: string; denominator: string }) => value.denominator === "1"
    ? value.numerator : `${value.numerator} divided by ${value.denominator}`;
  await expect(deck.locator("svg desc")).toHaveText(`A tax of ${spoken(exact.market.taxAmount)} shifts buyer-facing supply while original supply remains visible. Quantity is ${spoken(exact.market.quantity)}, consumers pay ${spoken(exact.market.consumerPrice)}, and producers receive ${spoken(exact.market.producerPrice)}.`);
  const comparison = page.locator("[data-kp-authoring-market-comparison]");
  await comparison.locator("summary").click();
  await expect(comparison.locator("[data-kp-supply-tax-ledger]")).toBeVisible();
  await expect(comparison.locator('[data-kp-supply-tax-ledger-role="government-revenue"] [data-kp-exact-value]'))
    .toHaveCount(2);
  await expect(comparison.locator('[data-kp-supply-tax-ledger-role="government-revenue"] [data-kp-exact-value]').last())
    .toHaveAttribute("data-kp-exact-value", "12/1");
  await comparison.screenshot({ path: info.outputPath("exact-endpoint-ledger.png") });
  await seek(deck.locator("[data-kp-supply-tax-state-scrubber]"), 2);
  expect(await deck.locator('[data-kp-supply-tax-math-label="consumer-price"] > div').innerHTML()).toBe(await nativePaint(page, "P_c=9"));
});

async function nativePaint(page: Page, latex: string) {
  return page.evaluate(async input => {
    const { renderLatexToHtml } = await import(input.path);
    const element = document.createElement("div");
    element.innerHTML = renderLatexToHtml(input.latex, { displayMode: false });
    return element.innerHTML;
  }, { path: "/src/rendering/katex-adapter.ts", latex });
}

test("source branch export records the selected predecessor without writing live author files", async ({ page }) => {
  const modelPath = new URL("../src/experiments/authoring-market/authoring-market-model-source.ts", import.meta.url);
  const original = await readFile(modelPath, "utf8");
  await page.goto("/experiments/authoring-market/");
  await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market", "state-driven-tax");
  const parent = await page.locator("#app").getAttribute("data-kp-authoring-market-preview-revision");
  const history = page.locator("[data-kp-authoring-market-source-history]");
  await history.locator("summary").click();
  await history.getByLabel("New source branch name").fill("reviewed-copy");
  const pending = page.waitForEvent("download");
  await history.getByRole("button", { name: "Export selected source as branch" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("reviewed-copy.market.json");
  const stream = await download.createReadStream();
  if (stream === null) throw new Error("Expected branch download stream");
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const branch = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  expect(branch.parentSourceRevision).toBe(parent);
  expect(branch.data.article.sourceId).toBe("projection.authoring-market.branch.reviewed-copy");
  expect(branch.data.article.text).toContain("kp.article.v1");
  expect(await readFile(modelPath, "utf8")).toBe(original);
  await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market-preview-revision", parent!);
});

test("actual local-file rebuild retains invalid drafts and last valid preview without page reload", async ({ page }) => {
  const modelPath = new URL("../src/experiments/authoring-market/authoring-market-model-source.ts", import.meta.url);
  const articlePath = new URL("../src/experiments/authoring-market/authoring-market-article-source.ts", import.meta.url);
  const originalModel = await readFile(modelPath, "utf8");
  const originalArticle = await readFile(articlePath, "utf8");
  let writtenModel = originalModel;
  let writtenArticle = originalArticle;
  const requests: string[] = [];
  page.on("request", request => requests.push(new URL(request.url()).pathname));
  await page.goto("/experiments/authoring-market/");
  const status = page.locator("[data-kp-authoring-market-build-status]");
  await expect(status).toHaveAttribute("data-kp-authoring-market-build-status", "valid");
  await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market", "state-driven-tax");
  await page.evaluate(() => { document.body.dataset["localBuildDocument"] = "retained"; });
  const initialRevision = await page.locator("#app").getAttribute("data-kp-authoring-market-preview-revision");
  expect((await page.request.post("/__kp/authoring-market/revision")).status()).toBe(405);
  try {
    writtenModel = originalModel.replace('numerator: "4"', 'numerator: "2"');
    expect(writtenModel).not.toBe(originalModel);
    await writeFile(modelPath, writtenModel);
    await expect(page.locator("#app")).not.toHaveAttribute("data-kp-authoring-market-preview-revision", initialRevision!);
    await expect(page.locator('[data-kp-authoring-market-static-facts] dt:has-text("after.revenue") + dd')).toHaveText("8");
    const revisionReview = page.locator("[data-kp-authoring-market-revision-review]");
    await expect(revisionReview).toBeVisible();
    await revisionReview.locator("summary").click();
    await expect(revisionReview).toContainText("after.revenue");
    await expect(revisionReview).toContainText("Review free prose for stale assertions");
    const validRevision = await page.locator("#app").getAttribute("data-kp-authoring-market-preview-revision");
    const sourceHistory = page.locator("[data-kp-authoring-market-source-history]");
    await sourceHistory.locator("summary").click();
    await sourceHistory.locator("select").selectOption(initialRevision!);
    await sourceHistory.getByRole("button", { name: "Inspect selected revision" }).click();
    await expect(status).toHaveAttribute("data-kp-authoring-market-build-status", "historical");
    await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market-preview-revision", initialRevision!);
    await expect(page.locator('[data-kp-authoring-market-static-facts] dt:has-text("after.revenue") + dd')).toHaveText("12");
    expect(await readFile(modelPath, "utf8")).toBe(writtenModel);
    await sourceHistory.locator("select").selectOption(validRevision!);
    await sourceHistory.getByRole("button", { name: "Inspect selected revision" }).click();
    await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market-preview-revision", validRevision!);
    const validPaint = await page.locator("[data-kp-supply-tax-focus-deck] svg").first().evaluate(element => element.outerHTML);
    writtenModel = "export const kpAuthoringMarketModelInput = ;\n";
    await writeFile(modelPath, writtenModel);
    await expect(status).toHaveAttribute("data-kp-authoring-market-build-status", "invalid");
    await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market-preview-revision", validRevision!);
    await expect(status).toHaveAttribute("data-kp-authoring-market-displayed-revision", validRevision!);
    await expect(status).toContainText(`Displayed revision: ${validRevision!.slice(0, 12)}`);
    await expect(status).toContainText("Last valid preview retained.");
    expect(await page.locator("[data-kp-supply-tax-focus-deck] svg").first().evaluate(element => element.outerHTML)).toBe(validPaint);
    expect(await readFile(modelPath, "utf8")).toBe(writtenModel);
    expect(await status.getAttribute("data-kp-authoring-market-source-revision")).not.toBe(validRevision);
    const fresh = await page.context().newPage();
    try {
      await fresh.goto("/experiments/authoring-market/");
      await expect(fresh.locator("[data-kp-authoring-market-build-status]")).toContainText("No valid preview is available yet.");
      await expect(fresh.locator("[data-kp-supply-tax-focus-deck]")).toHaveCount(0);
    } finally { await fresh.close(); }
    writtenModel = originalModel;
    await writeFile(modelPath, writtenModel);
    await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market-preview-revision", initialRevision!);
    await seek(page.locator("[data-kp-supply-tax-state-scrubber]"), 1.5);
    const wordingPaint = await page.locator("[data-kp-supply-tax-focus-deck] svg").first().evaluate(element => element.outerHTML);
    writtenArticle = originalArticle.replace("Before the tax, demand", "Observe first: demand");
    await writeFile(articlePath, writtenArticle);
    await expect(page.locator("[data-kp-focus-deck-phrase]").first()).toContainText("Observe first");
    await expect(page.locator("[data-kp-supply-tax-state-scrubber]")).toHaveValue("1.5");
    expect(await page.locator("[data-kp-supply-tax-focus-deck] svg").first().evaluate(element => element.outerHTML)).toBe(wordingPaint);
    const proseRevision = await page.locator("#app").getAttribute("data-kp-authoring-market-preview-revision");
    writtenArticle = writtenArticle.replace("kp-ref:tax-market/tax", "kp-ref:tax-market/missing");
    await writeFile(articlePath, writtenArticle);
    await expect(status).toHaveAttribute("data-kp-authoring-market-build-status", "invalid");
    await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market-preview-revision", proseRevision!);
    expect(await readFile(articlePath, "utf8")).toBe(writtenArticle);
    await expect(page.locator("body")).toHaveAttribute("data-local-build-document", "retained");
    expect(requests.some(path => /authoring-market-(model-source|article-source|preview-build)\.ts/.test(path))).toBe(false);
    // Complete the same edit/break/repair/inspect run with the reviewed equation
    // and a real filesystem build of the browser-exported source bytes.
    writtenArticle = writtenArticle.replace("kp-ref:tax-market/missing", "kp-ref:tax-market/tax");
    await writeFile(articlePath, writtenArticle);
    await expect(status).toHaveAttribute("data-kp-authoring-market-build-status", "valid");
    const equationEditor = page.locator("[data-kp-authoring-equation]");
    const equation = JSON.parse(await equationEditor.locator("textarea").inputValue());
    equation.states[0].latex = "\\log_{10} 100";
    equation.states[1].latex = "\\frac{\\ln 100}{\\ln 10}";
    equation.states[1].narration = "The argument stays upstairs; the base supplies the denominator.";
    await equationEditor.locator("textarea").fill(JSON.stringify(equation));
    await equationEditor.getByRole("button", { name: "Compile equation draft" }).click();
    await expect(equationEditor).toHaveAttribute("data-kp-authoring-equation", "compiled");
    await expect(equationEditor.locator("[data-kp-logarithm-change-of-base-stage] annotation").first()).toContainText("100");
    await sourceHistory.getByLabel("Include displayed, compiled equation in this edition").check();
    const editionName = `browser-${randomUUID()}`;
    await sourceHistory.getByLabel("New source branch name").fill(editionName);
    const pending = page.waitForEvent("download");
    await sourceHistory.getByRole("button", { name: "Export selected source as branch" }).click();
    const download = await pending;
    const stream = await download.createReadStream();
    if (stream === null) throw new Error("Expected combined source download");
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const sourceText = Buffer.concat(chunks).toString("utf8");
    expect(JSON.parse(sourceText).equationRequest.states[1].narration).toBe(equation.states[1].narration);
    expect(JSON.parse(sourceText).equationRequest.states).toEqual(equation.states);
    expect(JSON.parse(sourceText).equationRequest.adjacencies[0].intent.semanticArguments).toEqual({});
    await mkdir(kpAuthoringMarketEditionRoot, { recursive: true });
    const sourceDirectory = await mkdtemp(join(kpAuthoringMarketEditionRoot, "browser-source-"));
    const editionDirectory = join(kpAuthoringMarketEditionRoot, editionName);
    await mkdir(editionDirectory);
    try {
      const sourcePath = join(sourceDirectory, `${editionName}.market.json`);
      await writeFile(sourcePath, sourceText);
      const built = buildKpAuthoringMarketEdition({ sourcePath });
      expect(buildKpAuthoringMarketEdition({ sourcePath, check: true }).payloadRevision).toBe(built.payloadRevision);
      const html = await readFile(join(editionDirectory, "index.html"), "utf8");
      expect(html).toContain("Observe first");
      expect(html).toContain(equation.states[1].narration);
      expect(html).not.toContain("<script");
      const noJs = await page.context().browser()!.newContext({ javaScriptEnabled: false });
      try {
        const readingPage = await noJs.newPage();
        await readingPage.setContent(html.replace("<head>", `<head><base href="http://127.0.0.1:4173/tmp/codex/authoring-market-editions/${editionName}/">`));
        await expect(readingPage.locator("[data-kp-authoring-equation-static] math")).toHaveCount(2);
        await expect(readingPage.locator("[data-kp-authoring-equation-static] annotation").first()).toHaveText(equation.states[0].latex);
        await expect(readingPage.locator("[data-kp-authoring-equation-static] annotation").last()).toHaveText(equation.states[1].latex);
        await expect(readingPage.locator('dt:has-text("after.revenue") + dd')).toHaveText("12");
      } finally { await noJs.close(); }
    } finally {
      await rm(editionDirectory, { recursive: true });
      await rm(sourceDirectory, { recursive: true });
    }
  } catch (error) {
    console.error("LOCAL_BUILD_FAILURE", {
      server: await page.request.get("/__kp/authoring-market/revision").then(response => response.json()),
      status: await status.textContent(),
      retainedDocument: await page.locator("body").getAttribute("data-local-build-document")
    });
    throw error;
  } finally {
    // Restore only our exact fixture writes; never overwrite a concurrent author edit.
    if (await readFile(modelPath, "utf8") === writtenModel) await writeFile(modelPath, originalModel);
    if (await readFile(articlePath, "utf8") === writtenArticle) await writeFile(articlePath, originalArticle);
    await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market-preview-revision", initialRevision!);
  }
});

test("named demand-then-tax variant shows recomputed history, prose, native labels and welfare", async ({ page }, info) => {
  const modelPath = new URL("../src/experiments/authoring-market/authoring-market-model-source.ts", import.meta.url);
  const original = await readFile(modelPath, "utf8");
  const variation = original.replace('= "reference";', '= "variation";');
  expect(variation).not.toBe(original);
  await page.goto("/experiments/authoring-market/");
  await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market-specimen", "specimen.market.reference");
  try {
    await writeFile(modelPath, variation);
    await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market-specimen", "specimen.market.demand-then-tax");
    const deck = page.locator("[data-kp-supply-tax-focus-deck]");
    await expect(deck.locator("[data-kp-focus-deck-phrase]").first()).toContainText("First, demand's price intercept changes");
    expect(await deck.locator('[data-kp-supply-tax-math-label="untaxed-equilibrium"] > div').innerHTML()).toBe(await nativePaint(page, "E_0=(6,8)"));
    await deck.screenshot({ path: info.outputPath("variant-baseline.png") });
    await seek(deck.locator("[data-kp-supply-tax-state-scrubber]"), 2);
    expect(await deck.locator('[data-kp-supply-tax-math-label="consumer-price"] > div').innerHTML()).toBe(await nativePaint(page, "P_c=9"));
    expect(await deck.locator('[data-kp-supply-tax-math-label="producer-price"] > div').innerHTML()).toBe(await nativePaint(page, "P_p=7"));
    const history = page.locator("[data-kp-authoring-market-history]");
    const comparison = page.locator("[data-kp-authoring-market-comparison]");
    await comparison.locator("summary").click();
    await expect(history.locator("tbody tr")).toHaveCount(3);
    expect(await history.locator("tbody tr").evaluateAll(rows => rows.map(row => [...row.querySelectorAll("td")].map(cell => cell.textContent))))
      .toEqual([["5", "7", "7", "0", "25"], ["6", "8", "8", "0", "36"], ["5", "9", "7", "2", "35"]]);
    await expect(comparison.locator('[data-kp-supply-tax-ledger-role="government-revenue"] [data-kp-exact-value]').last()).toHaveAttribute("data-kp-exact-value", "10/1");
    await history.screenshot({ path: info.outputPath("variant-history.png") });
    await seek(deck.locator("[data-kp-supply-tax-state-scrubber]"), 0);
    expect(await deck.locator('[data-kp-supply-tax-math-label="untaxed-equilibrium"] > div').innerHTML()).toBe(await nativePaint(page, "E_0=(6,8)"));
    await captureAuthorReview(page, info, "variation");
  } finally {
    if (await readFile(modelPath, "utf8") === variation) await writeFile(modelPath, original);
    await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market-specimen", "specimen.market.reference");
  }
});

async function captureAuthorReview(page: Page, info: TestInfo, name: string) {
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  const scrubber = deck.locator("[data-kp-supply-tax-state-scrubber]");
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [label, position] of [["baseline", 0], ["transit", 1.5], ["accounting", 5], ["final", 7], ["reverse-baseline", 0]] as const) {
      await seek(scrubber, position);
      await deck.screenshot({ path: info.outputPath(`${name}-${width}-${label}.png`) });
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seek(scrubber, 7);
  // Input previews a drag; change completes the existing navigation gesture.
  await scrubber.dispatchEvent("change");
  await expect(deck.locator("[data-kp-focus-deck-next]")).toBeDisabled();
  await expect(scrubber).toHaveAttribute("aria-valuetext", /Step 8 of 8/);
  await deck.screenshot({ path: info.outputPath(`${name}-reduced-motion.png`) });
  const staticHtml = await page.locator("[data-kp-authoring-market-static-facts]").evaluate(element => element.outerHTML);
  const staticContext = await page.context().browser()!.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  try {
    const staticPage = await staticContext.newPage();
    // Inspect the existing plain fact projection without scripts, not a claim
    // that the dev-only route now provides a static publication artifact.
    await staticPage.setContent(`<html lang="en"><title>Exact market facts</title><main>${staticHtml}</main></html>`);
    await expect(staticPage.locator("dt:has-text('after.revenue') + dd")).toHaveText(name === "reference" ? "12" : "10");
    await expect(staticPage.locator("script")).toHaveCount(0);
    await staticPage.locator("main").screenshot({ path: info.outputPath(`${name}-static-facts.png`) });
  } finally { await staticContext.close(); }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await seek(scrubber, 0);
}

async function seek(scrubber: Locator, position: number) {
  await scrubber.evaluate((element, value) => {
    const input = element as HTMLInputElement;
    input.value = String(value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, position);
}

test("fixed playhead restores identical graph, native labels, prose and attention after interruption", async ({ page }) => {
  await page.goto("/experiments/authoring-market/");
  const deck = page.locator("[data-kp-supply-tax-focus-deck]");
  await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat", "baseline-market");
  const scrubber = deck.locator("[data-kp-supply-tax-state-scrubber]");
  const capture = () => deck.evaluate(element => ({
    // Attribute insertion order is not paint or semantic state; retain every
    // value while making the equality failure identify the actual changed node.
    svg: [...element.querySelectorAll("svg, svg *")].map(node => ({ tag: node.tagName,
      attributes: Object.fromEntries([...node.attributes].map(attribute => [attribute.name,
        attribute.name === "style" ? [...(node as SVGElement).style].sort().map(property =>
          [property, (node as SVGElement).style.getPropertyValue(property), (node as SVGElement).style.getPropertyPriority(property)])
          : attribute.value]).sort()),
      text: node.children.length === 0 ? node.textContent : null })),
    labels: [...element.querySelectorAll("[data-kp-supply-tax-math-label]")].map(node => node.outerHTML),
    prose: [...element.querySelectorAll("[data-kp-focus-deck-phrase]")].map(node => node.outerHTML),
    beat: element.getAttribute("data-kp-focus-deck-active-beat"),
    address: document.querySelector<HTMLElement>("#app")!.dataset["kpAuthoringMarketAddress"]
  }));
  await seek(scrubber, 1.371);
  const fixed = await capture();
  for (const position of [7, 0, 4, 1.8, 1.1, 2, 0]) {
    await seek(scrubber, position);
    await seek(scrubber, 1.371);
    expect(await capture()).toEqual(fixed);
    await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market-snapshot-count", "3");
  }
});

test("isolated deep links restore endpoints through reload and resize without changing canonical URLs", async ({ page }) => {
  for (const [beat, progress] of [["baseline-market", "0.0000"], ["supply-translation", "1.0000"], ["deadweight-loss", "1.0000"]]) {
    const path = `/experiments/authoring-market/#beat.${beat}`;
    await page.goto(path);
    const deck = page.locator("[data-kp-supply-tax-focus-deck]");
    await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat", beat!);
    await expect(deck).toHaveAttribute("data-kp-supply-tax-model-progress", progress!);
    const address = await page.locator("#app").getAttribute("data-kp-authoring-market-address");
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(deck).toHaveAttribute("data-kp-focus-deck-active-beat", beat!);
      await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market-address", address!);
    }
    await page.reload();
    await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market-address", address!);
    expect(new URL(page.url()).pathname + new URL(page.url()).hash).toBe(path);
  }
  await page.goto("/experiments/kinetic-figure/supply-tax/#beat.government-revenue");
  await expect(page.locator("[data-kp-supply-tax-focus-deck]")).toHaveAttribute("data-kp-focus-deck-active-beat", "government-revenue");
  await expect(page.locator("#app")).not.toHaveAttribute("data-kp-authoring-market");
});

test("repeated host retirement cancels inactive sampling and releases exclusive adapters", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/authoring-market/");
  await expect(page.locator("#app")).toHaveAttribute("data-kp-authoring-market", "state-driven-tax");
  const results = await page.evaluate(async modulePath => {
    window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false }));
    const { mountKpAuthoringMarket } = await import(modulePath);
    const { prepareKpAuthoringMarketPreview } = await import(modulePath.replace("authoring-market-host", "authoring-market-preview-prepare"));
    const revision = await fetch("/__kp/authoring-market/revision").then(response => response.json());
    const prepared = prepareKpAuthoringMarketPreview(revision.preview);
    const root = document.querySelector<HTMLElement>("#app")!;
    const checks = [];
    for (let index = 0; index < 3; index++) {
      const mounted = mountKpAuthoringMarket({ root, prepared });
      const scrubber = root.querySelector<HTMLInputElement>("[data-kp-supply-tax-state-scrubber]")!;
      scrubber.value = "1.371";
      scrubber.dispatchEvent(new Event("input", { bubbles: true }));
      mounted.dispose(); mounted.dispose();
      root.dataset["kpAuthoringMarketAddress"] = "retired";
      scrubber.value = "1.8";
      scrubber.dispatchEvent(new Event("input", { bubbles: true }));
      window.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new Event("hashchange"));
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      checks.push({ state: mounted.frames.inspect().status, count: mounted.frames.history.snapshots.length,
        children: root.childElementCount, address: root.dataset["kpAuthoringMarketAddress"] });
    }
    return checks;
  }, "/src/experiments/authoring-market/authoring-market-host.ts");
  expect(results).toEqual(Array.from({ length: 3 }, () => ({ state: "disposed", count: 3, children: 0, address: "retired" })));
  expect(errors).toEqual([]);
});
