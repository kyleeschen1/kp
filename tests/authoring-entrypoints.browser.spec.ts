import { expect, test } from "@playwright/test";
import { createKpEquationSeriesLogarithmBaseDraft } from "../src/authoring/equation-series-logarithm-base-draft.ts";
import { checkAuthorTask, authorTaskExample } from "../scripts/author-check-owner-dispatch.ts";
import { readFileSync, rmSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { buildBayesEdition } from "../scripts/build-bayesian-edition.ts";
import { buildKpAuthoringMarketEdition } from "../scripts/build-authoring-market-edition.ts";
import { checkBayesAuthorSource } from "../src/experiments/bayesian-reasoning/author-check.ts";
import { checkBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { editorialFixture } from "./fixtures/bayes-editorial-source.ts";
import spamFilterSource from "../content/authoring/r4b-spam-filter.bayes.json" with { type: "json" };

test("R4B primary lesson loads as content and traverses the existing seven stops", async ({ page }, info) => {
  const checked = checkBayesDraft(JSON.stringify(spamFilterSource));
  if (checked.status !== "compiled") throw new Error(checked.diagnostic.expected);
  await page.goto("/experiments/bayesian-reasoning/");
  const card = page.locator("[data-bayes-display] [data-bayes-card]");
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  await page.locator(".bayes-author summary").click();
  await page.locator("[data-bayes-load-spam]").click();
  expect(JSON.parse(await page.locator("[data-bayes-draft]").inputValue())).toEqual(spamFilterSource);
  await expect(page.locator("[data-bayes-editorial]")).toHaveCount(0);
  await page.locator("[data-bayes-apply]").click();
  await expect(card).toHaveAttribute("data-bayes-revision", checked.draft.revisionId);
  await expect(page.locator("[data-bayes-editorial]")).toContainText(spamFilterSource.editorial.title);
  for (const mode of ["full", "compact"]) {
    const reading = page.locator(`[data-bayes-reading="${mode}"]`);
    await reading.locator("summary").click();
    await expect(reading).toHaveAttribute("data-bayes-reading-revision", checked.draft.revisionId);
    await expect(reading).toContainText(spamFilterSource.editorial.title);
    await expect(reading).toContainText(mode === "full" ? "Our question reverses the conditioning" : "Both groups belong in the denominator");
    await expect(reading).toContainText("= 2/13.");
    await reading.locator("summary").click();
  }
  for (const step of [0, 1, 2, 3, 4, 5, 6, 4]) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, step) => {
      (node as HTMLInputElement).value = String(step); node.dispatchEvent(new Event("input", { bubbles: true }));
    }, step);
    await expect(card).toHaveAttribute("data-bayes-position", String(step));
    await expect(card.locator("#bayes-tree-description")).toContainText("P(A given B) = 2/13");
  }
  await expect(card.locator(".kp-focus-deck__passage-page").nth(4)).toContainText("Of those 117 messages, 18 are spam");
  await card.screenshot({ path: info.outputPath("r4b-spam-conditioned.png") });
});

test("R4B authored Apply preserves one selected revision and rejects foreign references", async ({ page }) => {
  const source = editorialFixture();
  source.editorial.title = "Atomic authored explanation";
  source.editorial.passages[0]!.body = ["Authored first passage."];
  const checked = checkBayesDraft(JSON.stringify(source));
  if (checked.status !== "compiled") throw new Error(checked.diagnostic.expected);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/bayesian-reasoning/");
  const card = page.locator("[data-bayes-display] [data-bayes-card]");
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  await page.locator(".bayes-author summary").click();
  await card.locator("[data-kp-focus-deck-scrubber]").evaluate(node => {
    (node as HTMLInputElement).value = "2.5"; node.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator("[data-bayes-draft]").fill(JSON.stringify(source));
  await expect(page.locator("[data-bayes-editorial]")).toHaveCount(0);
  await page.locator("[data-bayes-apply]").click();
  await expect(card).toHaveAttribute("data-bayes-revision", checked.draft.revisionId);
  await expect(card).toHaveAttribute("data-bayes-position", "2.5");
  await expect(page.locator("[data-bayes-editorial]")).toContainText(source.editorial.title);
  await expect(card.locator(".kp-focus-deck__passage-page").first()).toContainText("Authored first passage.");
  await expect(card.locator(".kp-focus-deck__passage-page")).toHaveCount(7);
  const invalid = { ...source, editorial: { ...source.editorial, passages: source.editorial.passages.map(passage => ({ ...passage, stateId: "foreign" })) } };
  await page.locator("[data-bayes-draft]").fill(JSON.stringify(invalid));
  await page.locator("[data-bayes-apply]").click();
  await expect(page.locator("[data-bayes-author-status]")).toHaveAttribute("data-bayes-apply-status", "repair-gap");
  await expect(card).toHaveAttribute("data-bayes-revision", checked.draft.revisionId);
  await expect(card).toHaveAttribute("data-bayes-position", "2.5");
  await expect(page.locator("[data-bayes-author-status]")).toContainText("$.editorial.passages[0].stateId");
  await page.locator("[data-bayes-restore]").click();
  expect(JSON.parse(await page.locator("[data-bayes-draft]").inputValue())).toEqual(source);
  await expect(page.locator(".bayes-staging")).toHaveCount(0);
  await expect(page.locator("[data-bayes-display-revision]")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("R4A numeric CLI and browser agree while dirty and invalid drafts preserve active truth", async ({ page }) => {
  const source = createKpEquationSeriesLogarithmBaseDraft();
  const request = { ...source, states: source.states.map((state, index) => ({ ...state,
    latex: index ? "\\frac{\\ln(9)}{\\ln(3)}" : "\\log_3(9)", narration: index ? "R4A equivalent quotient." : "R4A original logarithm." })) };
  const json = JSON.stringify(request), checked = await checkAuthorTask("equation.logarithm-base", json);
  expect(checked.status).toBe("checked");
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/authoring-market/#equation-authoring");
  const editor = page.locator("[data-kp-authoring-equation]");
  const stage = editor.locator("[data-kp-logarithm-change-of-base-stage]");
  await expect(editor).toHaveAttribute("data-kp-authoring-equation", "compiled");
  const before = await editor.locator(".kp-focus-deck__passage-page").allTextContents();
  const scrubber = editor.locator("[data-kp-focus-deck-scrubber]");
  await scrubber.evaluate(element => { const input = element as HTMLInputElement; input.value = "0.37"; input.dispatchEvent(new Event("input", { bubbles: true })); });
  await editor.locator("textarea").fill(json);
  await expect(editor).toHaveAttribute("data-kp-authoring-equation", "dirty");
  expect(await editor.locator(".kp-focus-deck__passage-page").allTextContents()).toEqual(before);
  await editor.getByRole("button", { name: "Compile equation draft" }).click();
  await expect(editor).toHaveAttribute("data-kp-authoring-equation", "compiled");
  await expect(stage).toHaveCount(1);
  await expect(stage).toHaveAttribute("data-kp-logarithm-change-of-base-progress", "0.37");
  await expect(stage.locator("annotation").first()).toContainText("9");
  await expect(editor.locator(".kp-focus-deck__passage-page").nth(0)).toContainText(request.states[0]!.narration);
  await expect(editor.locator(".kp-focus-deck__passage-page").nth(1)).toContainText(request.states[1]!.narration);
  await expect(editor.locator("[data-kp-focus-deck-position]")).toContainText("Step 1 of 2");
  expect(JSON.parse(await editor.locator("textarea").inputValue())).toEqual(request);
  const invalid = "{";
  const rejected = await checkAuthorTask("equation.logarithm-base", invalid);
  expect(rejected.status).toBe("repair-gap");
  await editor.locator("textarea").fill(invalid);
  await editor.getByRole("button", { name: "Compile equation draft" }).click();
  await expect(editor).toHaveAttribute("data-kp-authoring-equation", "repair-required");
  await expect(editor.locator("[data-kp-equation-status]")).toContainText("equation-series.request.json");
  await expect(stage).toHaveAttribute("data-kp-logarithm-change-of-base-progress", "0.37");
  await expect(stage.locator("annotation").first()).toContainText("9");
  await expect(editor.locator(".kp-authoring-equation-staging")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("R4A Graph3D checked route reaches its actual pinned host and retained fixed-camera paint", async ({ page }) => {
  const source = await authorTaskExample("graph3d.saddle");
  const checked = await checkAuthorTask("graph3d.saddle", JSON.stringify(source));
  expect(checked.status).toBe("checked");
  if (checked.status !== "checked" || !("artifact" in checked.result)) throw new Error("Graph3D check lost its artifact reference");
  const artifact = checked.result.artifact;
  await page.goto(artifact.directUrl);
  const catalogue = page.locator("[data-kp-animation-catalogue]");
  await expect(catalogue).toHaveAttribute("data-kp-animation-catalogue-selection", artifact.artifactId);
  await expect(catalogue).toHaveAttribute("data-kp-animation-catalogue-host-outcome", "painted");
  const player = catalogue.locator("[data-kp-editor-animation-player]");
  const slot = player.locator('[data-kp-editor-animation-surface-slot="graph"]');
  await expect(slot).toHaveAttribute("data-kp-editor-animation-adapter-id", artifact.rendererId);
  const stage = slot.locator("[data-kp-graph-3d-saddle-paint]");
  await expect(stage).toHaveAttribute("data-kp-camera-state", "camera.graph-3d.saddle-parameter.fixed");
  await expect(stage.locator(".graph-webgl")).toHaveAttribute("data-kp-webgl-status", "ready");
  for (const [progress, denominator] of [[0, 4], [0.5, 6], [1, 8], [0, 4]]) {
    await player.locator('[data-action="seek-editor-animation"]').fill(String(progress));
    await expect(stage).toHaveAttribute("data-kp-saddle-denominator", String(denominator));
    await expect(stage).toHaveAttribute("data-kp-camera-state", "camera.graph-3d.saddle-parameter.fixed");
    await expect(stage.locator("canvas")).toHaveCount(1);
  }
});

test("R4A retained urn source checks, traverses seven stops and exports the exact local edition", async ({ page, browser }, info) => {
  const json = readFileSync("content/authoring/r4a-urn-prior.bayes.json", "utf8");
  const checked = checkBayesAuthorSource(json);
  expect(checked.status).toBe("compiled");
  if (checked.status !== "compiled") throw new Error("Retained urn source failed");
  expect((await checkAuthorTask("bayes.binary", json)).result).toEqual(checked);
  await page.goto("/experiments/bayesian-reasoning/");
  const card = page.locator("[data-bayes-display] [data-bayes-card]");
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  await page.locator(".bayes-author summary").click();
  await page.locator("[data-bayes-draft]").fill(json);
  await page.locator("[data-bayes-apply]").click();
  await expect(card).toHaveAttribute("data-bayes-revision", checked.revisionId);
  for (const step of [0, 1, 2, 3, 4, 5, 6, 3.5, 2]) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, step) => {
      (node as HTMLInputElement).value = String(step); node.dispatchEvent(new Event("input", { bubbles: true }));
    }, step);
    await expect.poll(async () => Number(await card.getAttribute("data-bayes-position"))).toBeCloseTo(step, 9);
    await expect(card.locator("#bayes-tree-description")).toContainText("P(A given B) = 1/7");
  }
  // A dirty editor must not replace the explicitly displayed export source.
  await page.locator("[data-bayes-draft]").fill("{");
  const pending = page.waitForEvent("download"); await page.locator("[data-bayes-download]").click();
  const selected = info.outputPath(`r4a-urn-${randomUUID()}.json`);
  await (await pending).saveAs(selected);
  expect(JSON.parse(readFileSync(selected, "utf8"))).toEqual(JSON.parse(json));
  const built = buildBayesEdition(selected);
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    expect(built.revisionId).toBe(checked.revisionId);
    expect(buildBayesEdition(selected, true).checked).toBe(true);
    const reading = await context.newPage();
    await reading.goto(pathToFileURL(join(built.directory, "index.html")).href);
    await expect(reading.locator("[data-bayes-publication-revision]")).toHaveAttribute("data-bayes-publication-revision", checked.revisionId);
    await expect(reading.locator("svg.bayes-tree")).toHaveCount(7);
    await expect(reading.locator("script")).toHaveCount(0);
    await expect(reading.locator("#bayes-static-4-description")).toContainText("tt: 1/12, tf: 1/4, ft: 1/2, ff: 1/6");
    await expect(reading.locator("[data-bayes-publication-revision]")).toContainText("P(A | B) = P(A ∩ B) / P(B) = (1/12) / (7/12) = 1/7.");
  } finally { await context.close(); rmSync(built.directory, { recursive: true, force: true }); }
});

test("R4A retained numeric source exports through its enclosing market branch to no-JS reading", async ({ page, browser }, info) => {
  const json = readFileSync("content/authoring/r4a-logarithm-base.json", "utf8"), source = JSON.parse(json);
  expect((await checkAuthorTask("equation.logarithm-base", json)).status).toBe("checked");
  await page.goto("/experiments/authoring-market/#equation-authoring");
  const editor = page.locator("[data-kp-authoring-equation]");
  await expect(editor).toHaveAttribute("data-kp-authoring-equation", "compiled");
  await editor.locator("textarea").fill(json);
  await editor.getByRole("button", { name: "Compile equation draft" }).click();
  await expect(editor).toHaveAttribute("data-kp-authoring-equation", "compiled");
  const history = page.locator("[data-kp-authoring-market-source-history]");
  await history.locator("summary").click();
  const name = `r4a-log-${randomUUID().slice(0, 8)}`;
  await history.getByLabel("New source branch name").fill(name);
  await history.getByLabel("Include displayed, compiled equation in this edition").check();
  await editor.locator("textarea").fill("{");
  const downloads: string[] = [];
  page.on("download", download => downloads.push(download.suggestedFilename()));
  await history.getByRole("button", { name: "Export selected source as branch" }).click();
  await expect(history).toContainText("Compile and inspect a valid equation before including it");
  expect(downloads).toEqual([]);
  await editor.locator("textarea").fill(json);
  await editor.getByRole("button", { name: "Compile equation draft" }).click();
  await expect(editor).toHaveAttribute("data-kp-authoring-equation", "compiled");
  const pending = page.waitForEvent("download");
  await history.getByRole("button", { name: "Export selected source as branch" }).click();
  const selected = info.outputPath(`${name}.market.json`); await (await pending).saveAs(selected);
  const branch = JSON.parse(readFileSync(selected, "utf8"));
  expect(branch.equationRequest).toEqual(source);
  expect((await checkAuthorTask("graph2d.supply-tax", JSON.stringify(branch))).status).toBe("checked");
  const built = buildKpAuthoringMarketEdition({ sourcePath: selected });
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    expect(buildKpAuthoringMarketEdition({ sourcePath: selected, check: true }).checked).toBe(true);
    const reading = await context.newPage();
    await reading.goto(pathToFileURL(join(built.directory, "index.html")).href);
    const equation = reading.locator("[data-kp-authoring-equation-static]");
    await expect(equation).toContainText(source.states[0].narration);
    await expect(equation).toContainText(source.states[1].narration);
    await expect(equation.locator("annotation").first()).toContainText("9");
    await expect(equation.locator("annotation").last()).toContainText("3");
    await expect(reading.locator("script")).toHaveCount(0);
  } finally { await context.close(); rmSync(built.directory, { recursive: true, force: true }); }
});
