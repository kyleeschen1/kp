import { expect, test } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import contract from "./fixtures/algebra-style-contract.json" with { type: "json" };

// Disposable before/after evidence for a maintenance conversion. This file is
// intentionally outside the default *.browser.spec.ts suite: capture before
// editing, then compare. It never adopts machine captures as reviewed goldens.
const families = [
  ["distribution", "/experiments/authoring-distribution-focus-card/?inspection=true"],
  ["reasoning", "/experiments/reusable-reasoning/"],
  ["code", "/experiments/reusable-reasoning-code/"],
  ["common-factor", "/experiments/reusable-reasoning/?example=common-factor"],
  ["composed", "/experiments/reusable-reasoning/?example=composed-algebra"],
  ["intuition", "/experiments/reusable-reasoning/?example=algebra-intuition"],
  ["distribute-collect", "/experiments/reusable-reasoning/?example=distribute-collect"]
] as const;
const properties = ["position", "top", "left", "opacity", "pointer-events", "z-index", "color", "white-space",
  "font-family", "font-size", "line-height", "overflow-wrap", "display", "width", "box-sizing", "margin-top",
  "height", "grid-template-rows", "order", "border-bottom", "align-items", "min-height", "flex-wrap", "gap",
  "margin", "border", "border-radius", "background", "padding", "cursor", "touch-action", "overflow-x",
  "scroll-snap-type", "overscroll-behavior-x", "overscroll-behavior-block", "border-left", "visibility", "transform"];

for (const [name, route] of families) test(`algebra stylesheet ${name}: existing paint and layout`, async ({ page }, info) => {
  test.setTimeout(180_000);
  const directory = resolve("tmp/codex/algebra-style-preservation");
  const baseline = resolve(directory, `${info.project.name}-${name}.json`);
  const capture = info.config.updateSnapshots === "all";
  expect(capture || existsSync(baseline), "Capture the unchanged baseline before running the maintenance comparison").toBe(true);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const snapshots: unknown[] = [];
  for (const width of [1100, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route);
    const card = page.locator("[data-kp-focus-card-enhancement]").first();
    await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready", { timeout: 90_000 });
    await page.evaluate(() => document.fonts.ready);
    const slider = page.locator("[data-kp-focus-deck-scrubber]").first();
    for (const step of [0, .5, 1, 0]) {
      await slider.evaluate((node, value) => {
        (node as HTMLInputElement).value = String(value);
        node.dispatchEvent(new Event("input", { bubbles: true }));
      }, step);
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      snapshots.push(await page.evaluate(({ selectors, properties }) => selectors.map(selector => ({ selector,
        elements: [...document.querySelectorAll<HTMLElement>(selector)].map(element => {
          const style = getComputedStyle(element), rect = element.getBoundingClientRect();
          return { properties: Object.fromEntries(properties.map(property => [property, style.getPropertyValue(property)])),
            rect: [rect.x, rect.y, rect.width, rect.height].map(value => Math.round(value * 1000) / 1000) };
        })
      })), { selectors: [...Object.keys(contract.selectors), ".kp-focus-deck__card", ".katex-html",
        "[data-kp-reader-selector-id]", "[data-kp-equation-material-semantic-entity-id]"], properties }));
    }
    await card.screenshot({ path: info.outputPath(`${name}-${width}.png`) });
  }
  expect(errors).toEqual([]);
  mkdirSync(directory, { recursive: true });
  if (capture) writeFileSync(baseline, JSON.stringify(snapshots) + "\n");
  else {
    const before = JSON.parse(readFileSync(baseline, "utf8")) as unknown[];
    const differences = snapshots.flatMap((snapshot, index) => JSON.stringify(snapshot) === JSON.stringify(before[index]) ? [] : [index]);
    if (differences.length) writeFileSync(resolve(directory, `${info.project.name}-${name}-after.json`), JSON.stringify(snapshots) + "\n");
    expect(differences, `Changed captures for ${name}; compare baseline and -after JSON in ${directory}`).toEqual([]);
  }
});
