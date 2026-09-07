import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

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
