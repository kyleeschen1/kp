import { test, expect } from "@playwright/test";
import { buildCommonFactorEdition } from "../scripts/build-common-factor-edition.ts";
import { relative } from "node:path";
import { createKpCommonFactorExample } from "../src/authoring/common-factor-author-check.ts";
import { prepareKpCommonFactorDraft } from "../src/authoring/common-factor-draft.ts";
import { sampleKpFactoringChoreography } from "../src/animation/factoring-choreography.ts";
import numericSource from "../src/authoring/examples/common-factor-numeric.json" with { type: "json" };

async function expectPrepared(page: import("@playwright/test").Page) {
  const root = page.locator("#authored-focus-card");
  // Surface terminal diagnostics immediately instead of waiting out a loading timeout.
  await expect(root).toHaveAttribute("data-common-factor-status", /^(ready|repair-gap)$/, { timeout: 90_000 });
  expect(await root.getAttribute("data-common-factor-status"), await page.locator("[data-common-factor-error]").textContent() ?? "").toBe("ready");
}

test("preparation failure replaces the loading state with a visible repair", async ({ page }) => {
  await page.route("**/equation-scene-compositor-adapter.ts*", route => route.abort());
  await page.goto("/experiments/reusable-reasoning/?example=common-factor");
  await expect(page.locator("#authored-focus-card")).toHaveAttribute("data-common-factor-status", "repair-gap");
  const card = page.locator("[data-common-factor-card]");
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "repair-gap");
  await expect(card.locator("[data-distribution-stage]")).toHaveText("Figure could not be prepared. See the error below.");
  await expect(page.locator("[data-common-factor-error]")).toBeVisible();
  await expect(card.locator("[data-kp-focus-deck-next]")).toBeDisabled();
});

test("canonical factoring phases survive native projection and interrupted reverse seek", async ({ page }, info) => {
  test.setTimeout(120_000);
  const draft = prepareKpCommonFactorDraft(createKpCommonFactorExample());
  const reference = await page.context().newPage();
  await reference.goto("/?view=animation-library-host&animation=editor-animation.sample.animation.factoring.factor-common-a");
  const player = reference.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveAttribute("data-kp-editor-animation-hydrated", "true", { timeout: 90_000 });
  await page.goto("/experiments/reusable-reasoning/?example=common-factor");
  const card = page.locator("[data-common-factor-card]");
  await expectPrepared(page);
  await expect(card).toHaveAttribute("data-canonical-presentation-owner", "canonical-factoring-native-v1");
  const poses = new Map<number, unknown>();
  const contextBaselines = new Map<string, number>();
  for (const p of [0, .18, .37, .5, .68, .9, 1, .68, .37, 0]) {
    await player.locator('[data-action="seek-editor-animation"]').fill(String(p));
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, value) => {
      const slider = node as HTMLInputElement; slider.value = String(value); slider.dispatchEvent(new Event("input", { bubbles: true }));
    }, p);
    await expect(card).toHaveAttribute("data-common-factor-progress", String(p));
    if (p > 0 && p < 1) {
      const expected = sampleKpFactoringChoreography({ plan: draft.presentation.plan.choreography!, progress: p });
      const grouping = card.locator('[data-kp-equation-material-owner-id][data-kp-equation-material-semantic-entity-id$="-paren"]');
      await expect(grouping).toHaveCount(2);
      for (const owner of await grouping.all()) expect(Number(await owner.evaluate(node => getComputedStyle(node).opacity))).toBeCloseTo(expected.groupingOpacity, 5);
      const referenceOpacity = await player.locator("[data-kp-editor-equation-factoring-grouping-opacity]").getAttribute("data-kp-editor-equation-factoring-grouping-opacity");
      expect(Number(referenceOpacity)).toBeCloseTo(expected.groupingOpacity, 5);
      for (const suffix of ["left-term", "right-term", "plus"]) {
        const owner = card.locator(`[data-kp-equation-material-owner-id][data-kp-equation-material-semantic-entity-id$=".${suffix}"]`);
        const y = await owner.evaluate(node => node.getBoundingClientRect().y);
        if (contextBaselines.has(suffix)) expect(y).toBeCloseTo(contextBaselines.get(suffix)!, 1);
        else contextBaselines.set(suffix, y);
      }
      const pose = await card.locator("[data-kp-equation-material-owner-id]").evaluateAll(nodes => nodes.map(node => {
        const rect = node.getBoundingClientRect();
        return { id: node.getAttribute("data-kp-equation-material-semantic-entity-id"),
          opacity: getComputedStyle(node).opacity, x: Math.round(rect.x * 100), y: Math.round(rect.y * 100) };
      }).filter(value => Number(value.opacity) > 0).sort((a, b) => String(a.id).localeCompare(String(b.id))));
      if (poses.has(p)) expect(pose).toEqual(poses.get(p)); else poses.set(p, pose);
    }
    await player.screenshot({ path: info.outputPath(`canonical-${p}.png`) });
    await card.screenshot({ path: info.outputPath(`native-${p}.png`) });
  }
  await reference.close();
});

test("factoring continuants preserve actual ink and exclusive ownership across both native seams", async ({ page }) => {
  await page.goto("/experiments/reusable-reasoning/?example=common-factor");
  await expectPrepared(page);
  const draft = prepareKpCommonFactorDraft(createKpCommonFactorExample());
  const plan = draft.presentation.plan.choreography!;
  const pairs = [...plan.addendPairs, ...plan.connectorPairs];
  const card = page.locator("[data-common-factor-card]");
  const snapshots = new Map<number, Awaited<ReturnType<typeof capture>>>();
  async function capture(progress: number) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, p) => {
      (node as HTMLInputElement).value = String(p); node.dispatchEvent(new Event("input", { bubbles: true }));
    }, progress);
    await expect(card).toHaveAttribute("data-common-factor-progress", String(progress));
    return card.evaluate(async (root, input) => {
      const path = "/src/rendering/native-katex-paint-geometry.ts";
      const geometry = await import(/* @vite-ignore */ path) as typeof import("../src/rendering/native-katex-paint-geometry.ts");
      const stage = root.querySelector<HTMLElement>("[data-kp-reader-fit-surface]")!;
      const opacity = (node: HTMLElement) => {
        let result = 1;
        for (let current: HTMLElement | null = node; current; current = current.parentElement) {
          const style = getComputedStyle(current);
          if (style.display === "none" || style.visibility === "hidden") return 0;
          result *= Number(style.opacity);
          if (current === root) break;
        }
        return result;
      };
      return input.pairs.map(pair => {
        const source = stage.querySelector<HTMLElement>('[data-kp-reader-native="source"] [data-kp-semantic-entity-id="' + pair.sourceId + '"]')!;
        const target = stage.querySelector<HTMLElement>('[data-kp-reader-native="target"] [data-kp-semantic-entity-id="' + pair.targetId + '"]')!;
        const material = stage.querySelector<HTMLElement>('[data-kp-equation-material-semantic-entity-id="' + pair.sourceId + '"]')?.firstElementChild;
        if (!source || !target || !(material instanceof HTMLElement)) throw new Error("Missing correlated factoring paint owner");
        const owners = [source, material, target];
        const opacities = owners.map(opacity);
        const active = owners[input.progress === 0 ? 0 : input.progress === 1 ? 2 : 1]!;
        const rect = geometry.measureKpNativeKatexSubtreePaintRect(stage, active);
        if (!rect) throw new Error("Missing realized factoring ink");
        return { id: pair.sourceId, opacities, rect };
      });
    }, { pairs, progress });
  }
  for (const p of [0, .01, .37, .99, 1, .99, .37, .01, 0]) {
    const sample = await capture(p);
    for (const ink of sample) expect(ink.opacities).toEqual(p === 0 ? [1, 0, 0] : p === 1 ? [0, 0, 1] : [0, 1, 0]);
    if (snapshots.has(p)) expect(sample).toEqual(snapshots.get(p));
    else snapshots.set(p, sample);
  }
  for (const [native, material] of [[0, .01], [1, .99]]) {
    const a = snapshots.get(native!)!, b = snapshots.get(material!)!;
    a.forEach((ink, index) => {
      for (const key of ["left", "top", "width", "height"] as const)
        expect(Math.abs(ink.rect[key] - b[index]!.rect[key]), JSON.stringify({ native, key, before: ink, after: b[index] })).toBeLessThan(.1);
    });
  }
});

test("primary factoring traverses native endpoints, direct reverse and shared controls", async ({ page }, info) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/experiments/reusable-reasoning/?example=common-factor");
  const root = page.locator("#authored-focus-card"), card = page.locator("[data-common-factor-card]");
  await expectPrepared(page);
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  const stage = card.locator("[data-kp-canonical-equation-host]");
  await expect(stage).toHaveAttribute("data-kp-reader-animation-id", /^animation.authored.common-factor\./);
  const slider = card.locator("[data-kp-focus-deck-scrubber]");
  for (const value of ["0", "0.5", "1", "0.5", "0"]) {
    await slider.evaluate((node, selected) => { const input = node as HTMLInputElement; input.value = selected; input.dispatchEvent(new Event("input", { bubbles: true })); }, value);
    await expect(card).toHaveAttribute("data-common-factor-progress", value);
    await expect(stage).toHaveAttribute("data-kp-reader-canonical-paint-owner", "true");
  }
  await card.locator("[data-kp-focus-deck-next]").click();
  await expect.poll(async () => Number(await card.getAttribute("data-common-factor-progress"))).toBeGreaterThan(0);
  expect(Number(await card.getAttribute("data-common-factor-progress"))).toBeLessThan(1);
  await expect(card).toHaveAttribute("data-common-factor-progress", "1", { timeout: 10_000 });
  await expect(card.locator("[data-common-factor-count]")).toHaveText("2 / 2");
  await slider.focus(); await page.keyboard.press("ArrowLeft");
  await expect(card).toHaveAttribute("data-common-factor-progress", "0", { timeout: 10_000 });
  await expect(card.locator("[data-common-factor-count]")).toHaveText("1 / 2");
  await card.locator("[data-distribution-stage]").hover();
  await page.mouse.wheel(420, 0);
  await expect.poll(async () => Number(await card.getAttribute("data-common-factor-progress"))).toBeGreaterThan(0);
  expect(Number(await card.getAttribute("data-common-factor-progress"))).toBeLessThan(1);
  await expect(card).toHaveAttribute("data-common-factor-progress", "1", { timeout: 10_000 });
  await page.mouse.wheel(-420, 0);
  await expect(card).toHaveAttribute("data-common-factor-progress", "0", { timeout: 10_000 });
  await card.screenshot({ path: info.outputPath("primary.png") });
  await page.locator("[data-reasoning-editor] summary").click();
  const editor = page.locator("[data-reasoning-json]");
  const source = JSON.parse(await editor.inputValue());
  const oldRevision = await root.getAttribute("data-common-factor-revision");
  await editor.fill(JSON.stringify({ ...source, states: [source.states[0], { ...source.states[1], latex: "b(b+c)" }] }));
  await page.locator("[data-common-factor-apply]").click();
  await expect(page.locator("[data-reasoning-draft-status]")).toContainText("invalid-factorization");
  await expect(root).toHaveAttribute("data-common-factor-revision", oldRevision!);
  source.editorial.title = "A freshly authored explanation";
  await editor.fill(JSON.stringify(source)); await page.locator("[data-common-factor-apply]").click();
  await expect(page.locator("[data-reasoning-draft-status]")).toHaveText("Displayed revision updated.");
  await expect(root).not.toHaveAttribute("data-common-factor-revision", oldRevision!);
  await expect(card).toHaveCount(1); await expect(page.locator(".common-factor-staging")).toHaveCount(0);
  await expect(page.locator("[data-common-factor-title]")).toHaveText(source.editorial.title);
  await page.locator("[data-common-factor-reading]").selectOption("compact");
  const reading = page.locator("[data-common-factor-reading-output]");
  await expect(reading.locator("h2")).toHaveText("Compact reading");
  await expect(reading).toHaveAttribute("data-revision", (await root.getAttribute("data-common-factor-revision"))!);
  await expect(reading).toContainText("common factor may be zero");
  await expect(reading.locator("math")).toHaveCount(2);
  for (const kind of ["prediction", "reconstruction"]) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate(node => {
      const input = node as HTMLInputElement; input.value = "0.37"; input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await expect(card).toHaveAttribute("data-common-factor-progress", "0.37");
    const origin = page.locator(`[data-common-factor-practice="${kind}"]`);
    await origin.click();
    await expect(page.locator("[data-common-factor-practice-panel]")).toBeVisible();
    await expect(page.locator("[data-reasoning-editor]")).toBeHidden();
    await expect(page.locator("[data-common-factor-answer]")).toBeHidden();
    await expect(card).toHaveAttribute("data-common-factor-progress", "0");
    await page.locator("[data-common-factor-working]").fill("Distribute to check; no division required.");
    await page.locator("[data-common-factor-reveal]").click();
    await expect.poll(async () => Number(await card.getAttribute("data-common-factor-progress"))).toBeGreaterThan(0);
    expect(Number(await card.getAttribute("data-common-factor-progress"))).toBeLessThan(1);
    await expect(card).toHaveAttribute("data-common-factor-progress", "1", { timeout: 10_000 });
    await expect(page.locator("[data-common-factor-answer]")).toContainText("no division");
    await page.locator("[data-common-factor-return]").click();
    await expect(card).toHaveAttribute("data-common-factor-progress", "0.37");
    await expect(origin).toBeFocused();
    await expect(reading.locator("h2")).toHaveText("Compact reading");
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator("[data-kp-canonical-equation-host]")).toHaveAttribute("data-kp-reader-canonical-paint-owner", "true");
  await card.screenshot({ path: info.outputPath("primary-phone.png") });
  expect(errors).toEqual([]);
});

test("numeric source reuses the same card without renderer glue", async ({ page }, info) => {
  await page.goto("/experiments/reusable-reasoning/?example=common-factor");
  await expectPrepared(page);
  const expected = prepareKpCommonFactorDraft(numericSource);
  await page.locator("[data-reasoning-editor] summary").click();
  await page.locator("[data-reasoning-json]").fill(JSON.stringify(numericSource));
  await page.locator("[data-common-factor-apply]").click();
  await expect(page.locator("[data-reasoning-draft-status]")).toHaveText("Displayed revision updated.");
  const card = page.locator("[data-common-factor-card]");
  await expect(card).toHaveAttribute("data-canonical-presentation-owner", expected.presentation.owner);
  await expect(card).toHaveAttribute("data-canonical-presentation-revision", expected.revisionId);
  await expect(page.locator("[data-common-factor-title]")).toHaveText(numericSource.editorial.title);
  for (const p of [0, .18, .37, .68, 1, .68, 0]) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, value) => {
      (node as HTMLInputElement).value = String(value); node.dispatchEvent(new Event("input", { bubbles: true }));
    }, p);
    await expect(card).toHaveAttribute("data-common-factor-progress", String(p));
    await card.screenshot({ path: info.outputPath("numeric-" + p + ".png") });
  }
  await expect(page.locator(".common-factor-staging")).toHaveCount(0);
});

test("repeated Apply disposes old card owners and reduced motion preserves endpoints without idle paint", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/experiments/reusable-reasoning/?example=common-factor");
  await expectPrepared(page);
  await page.locator("[data-reasoning-editor] summary").click();
  const card = page.locator("[data-common-factor-card]");
  const counts = [];
  for (const source of [numericSource, createKpCommonFactorExample(), numericSource]) {
    const old = await card.elementHandle();
    await page.locator("[data-reasoning-json]").fill(JSON.stringify(source));
    await page.locator("[data-common-factor-apply]").click();
    await expect(page.locator("[data-reasoning-draft-status]")).toHaveText("Displayed revision updated.");
    expect(await old!.evaluate(node => node.isConnected)).toBe(false);
    await expect(card).toHaveCount(1);
    await expect(page.locator(".common-factor-staging")).toHaveCount(0);
    await card.locator("[data-kp-focus-deck-next]").click();
    await expect(card).toHaveAttribute("data-common-factor-progress", "1");
    await card.locator("[data-kp-focus-deck-previous]").click();
    await expect(card).toHaveAttribute("data-common-factor-progress", "0");
    const staleMutations = await old!.evaluate(async node => {
      let count = 0;
      const observer = new MutationObserver(records => { count += records.length; });
      observer.observe(node, { subtree: true, attributes: true, childList: true, characterData: true });
      window.dispatchEvent(new Event("resize"));
      await new Promise(resolve => setTimeout(resolve, 200)); observer.disconnect(); return count;
    });
    expect(staleMutations).toBe(0);
    await old!.dispose();
    const idleMutations = await card.evaluate(async node => {
      let count = 0;
      const observer = new MutationObserver(records => { count += records.length; });
      observer.observe(node, { subtree: true, attributes: true, childList: true, characterData: true });
      await new Promise(resolve => setTimeout(resolve, 200)); observer.disconnect(); return count;
    });
    expect(idleMutations).toBe(0);
    counts.push({ staleMutations, idleMutations });
  }
  await info.attach("bounded-idle-and-disposal", { body: JSON.stringify(counts), contentType: "application/json" });
});

for (const example of ["primary", "numeric"] as const) test(example + " local edition renders math and self-checks with JavaScript disabled", async ({ browser }, info) => {
  const edition = buildCommonFactorEdition("src/authoring/examples/common-factor-" + example + ".json");
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    const response = await page.goto(`http://localhost:8000/${relative(process.cwd(), edition.directory)}/index.html`);
    expect(response?.ok()).toBe(true);
    await expect(page.locator("h1")).toHaveText((example === "primary" ? createKpCommonFactorExample() : numericSource).editorial.title);
    await expect(page.locator("math")).toHaveCount(6);
    await expect(page.locator("[data-common-factor-publication-revision]")).toHaveAttribute("data-common-factor-publication-revision", edition.revisionId);
    await page.getByText("Compact reading", { exact: true }).first().click();
    await page.getByText("Compare with the verified answer", { exact: true }).first().click();
    await expect(page.getByText("Distributing the common factor recovers both ordered products.", { exact: false }).first()).toBeVisible();
    await page.screenshot({ path: info.outputPath("static-edition.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await context.close(); }
});
