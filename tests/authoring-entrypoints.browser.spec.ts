import { expect, test } from "@playwright/test";
import { createKpEquationSeriesLogarithmBaseDraft } from "../src/authoring/equation-series-logarithm-base-draft.ts";
import { checkAuthorTask } from "../scripts/author-check-owner-dispatch.ts";
import { readFileSync, rmSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { buildBayesEdition } from "../scripts/build-bayesian-edition.ts";
import { buildKpAuthoringMarketEdition } from "../scripts/build-authoring-market-edition.ts";
import { checkBayesAuthorSource } from "../src/experiments/bayesian-reasoning/author-check.ts";

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
