import { test, expect } from "@playwright/test";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { buildBayesEdition } from "../scripts/build-bayesian-edition.ts";

test("Bayes performance: idle and offscreen cards stop work and preserve interrupted position", async ({ page }, info) => {
  await page.goto("/experiments/bayesian-reasoning/");
  const card = page.locator("[data-bayes-display] [data-bayes-card]");
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  const idle = await card.evaluate(async node => {
    let mutations = 0;
    const observer = new MutationObserver(records => { mutations += records.length; });
    observer.observe(node, { subtree: true, attributes: true, childList: true, characterData: true });
    await new Promise(resolve => setTimeout(resolve, 200)); observer.disconnect(); return mutations;
  });
  expect(idle).toBe(0);
  const treeOnlyNativeMutations = await card.evaluate(async node => {
    let mutations = 0;
    const observer = new MutationObserver(records => { mutations += records.length; });
    observer.observe(node.querySelector("[data-bayes-native-host] .kp-reader-exemplar") ?? node.querySelector("[data-bayes-native-host]")!.firstElementChild!,
      { subtree: true, attributes: true, childList: true, characterData: true });
    const slider = node.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
    for (const step of [.1, .5, 1, 2, 0]) {
      slider.value = String(step); slider.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise(requestAnimationFrame);
    }
    observer.disconnect(); return mutations;
  });
  expect(treeOnlyNativeMutations).toBe(0);
  await card.locator("[data-kp-focus-deck-replay]").click();
  await expect.poll(async () => Number(await card.getAttribute("data-bayes-position"))).toBeGreaterThan(0);
  // Supply real page travel even when all reading disclosures are collapsed.
  await page.evaluate(() => { const spacer = document.createElement("div"); spacer.style.height = "200vh"; document.body.append(spacer); scrollTo(0, document.body.scrollHeight); });
  await expect.poll(() => card.evaluate(node => node.getBoundingClientRect().bottom)).toBeLessThan(0);
  await page.waitForTimeout(250);
  const paused = await card.getAttribute("data-bayes-position");
  await page.waitForTimeout(250);
  await expect(card).toHaveAttribute("data-bayes-position", paused!);
  await card.scrollIntoViewIfNeeded(); await page.waitForTimeout(150);
  await expect(card).toHaveAttribute("data-bayes-position", paused!);
  await info.attach("inactive-work", { body: JSON.stringify({ idleMutations: idle, paused }), contentType: "application/json" });
});

test("Bayes performance: exact forward/reverse sampling and source preparation are measured", async ({ page }, info) => {
  await page.goto("/experiments/bayesian-reasoning/");
  const card = page.locator("[data-bayes-display] [data-bayes-card]");
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  const evidence = await card.evaluate(async card => {
    const slider = card.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
    const samples: number[] = [], intervals: number[] = [];
    let previous = await new Promise<number>(requestAnimationFrame);
    for (let i = 0; i <= 120; i++) {
      const position = i <= 60 ? i / 10 : (120 - i) / 10;
      const start = performance.now();
      slider.value = String(position); slider.dispatchEvent(new Event("input", { bubbles: true }));
      samples.push(performance.now() - start);
      if (Math.abs(Number((card as HTMLElement).dataset["bayesPosition"]) - position) > 1e-8) throw new Error("Sample drift");
      const now = await new Promise<number>(requestAnimationFrame); intervals.push(now - previous); previous = now;
    }
    const stats = (values: number[]) => { values.sort((a, b) => a - b); return { p50: values[Math.floor(values.length * .5)], p95: values[Math.floor(values.length * .95)], max: values.at(-1) }; };
    return { samples: samples.length, dispatchMs: stats(samples), frameMs: stats(intervals) };
  });
  await page.locator(".bayes-author summary").click();
  await page.locator("[data-bayes-load-urn]").click();
  const started = performance.now(); await page.locator("[data-bayes-apply]").click();
  await expect(page.locator("[data-bayes-author-status]")).toHaveAttribute("data-bayes-apply-status", "applied");
  const result = { ...evidence, prepareAndApplyMs: performance.now() - started, browser: info.project.name };
  expect(await page.locator(".bayes-staging").count()).toBe(0);
  console.log(JSON.stringify(result));
  await info.attach("bayes-runtime-cost", { body: JSON.stringify(result), contentType: "application/json" });
});

test("Bayes performance: replacement mounts two revisions but disposes the old owner", async ({ page }) => {
  await page.goto("/experiments/bayesian-reasoning/");
  const card = page.locator("[data-bayes-display] [data-bayes-card]");
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  const old = await card.elementHandle();
  await page.evaluate(() => {
    const observer = new MutationObserver(() => {
      const count = document.querySelectorAll("[data-bayes-card]").length;
      document.documentElement.dataset["bayesPeakCards"] = String(Math.max(count, Number(document.documentElement.dataset["bayesPeakCards"] ?? 0)));
    });
    observer.observe(document.body, { childList: true, subtree: true });
    addEventListener("pagehide", () => observer.disconnect(), { once: true });
  });
  await page.locator(".bayes-author summary").click(); await page.locator("[data-bayes-load-urn]").click();
  await page.locator("[data-bayes-apply]").click();
  await expect(page.locator("[data-bayes-author-status]")).toHaveAttribute("data-bayes-apply-status", "applied");
  await expect(page.locator("html")).toHaveAttribute("data-bayes-peak-cards", "2");
  expect(await old!.evaluate(node => node.isConnected)).toBe(false);
  const before = await old!.evaluate(node => node.outerHTML);
  await card.locator("[data-kp-focus-deck-next]").click(); await page.waitForTimeout(150);
  expect(await old!.evaluate(node => node.outerHTML)).toBe(before);
  expect(await page.locator("[data-bayes-card]").count()).toBe(1);
});

test("Bayes zero outcomes retain native zero evaluation while impossible conditioning preserves last-valid", async ({ page }) => {
  await page.goto("/experiments/bayesian-reasoning/");
  const card = page.locator("[data-bayes-display] [data-bayes-card]");
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  await page.locator(".bayes-author summary").click();
  const editor = page.locator("[data-bayes-draft]"), source = JSON.parse(await editor.inputValue());
  source.model.masses = ["0/1", "0/1", "1/4", "3/4"];
  await editor.fill(JSON.stringify(source)); await page.locator("[data-bayes-apply]").click();
  await expect(page.locator("[data-bayes-author-status]")).toHaveAttribute("data-bayes-apply-status", "applied");
  for (const step of [2, 3, 3.5, 4, 6]) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, step) => {
      (node as HTMLInputElement).value = String(step); node.dispatchEvent(new Event("input", { bubbles: true }));
    }, step);
    await expect(card.locator("#bayes-tree-description")).toContainText("P(A given B) = 0.");
    expect(await card.locator("[data-bayes-outcome]").count()).toBe(4);
  }
  await expect(card.locator("[data-bayes-native-host]")).toContainText("0");
  const revision = await card.getAttribute("data-bayes-revision"), owner = await card.elementHandle();
  source.model.masses = ["0/1", "1/4", "0/1", "3/4"];
  await editor.fill(JSON.stringify(source)); await page.locator("[data-bayes-apply]").click();
  await expect(page.locator("[data-bayes-author-status]")).toHaveAttribute("data-bayes-apply-status", "repair-gap");
  await expect(card).toHaveAttribute("data-bayes-revision", revision!);
  expect(await owner!.evaluate(node => node.isConnected)).toBe(true);
});

test("Bayes urn source reuses the accepted seven-stop card and opposite-order tree", async ({ page }, info) => {
  await page.goto("/experiments/bayesian-reasoning/");
  const card = page.locator("[data-bayes-display] [data-bayes-card]");
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  await page.locator(".bayes-author summary").click(); await page.locator("[data-bayes-load-urn]").click();
  await page.locator("[data-bayes-apply]").click();
  await expect(card.locator(".bayes-legend")).toContainText("Selected urn A");
  for (const step of [2, 2.5, 3, 3.5, 4, 5, 5.5, 6, 2]) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, step) => {
      (node as HTMLInputElement).value = String(step); node.dispatchEvent(new Event("input", { bubbles: true }));
    }, step);
    if (Number.isInteger(step)) await expect(card).toHaveAttribute("data-bayes-position", String(step));
    else await expect.poll(async () => Number(await card.getAttribute("data-bayes-position"))).toBeCloseTo(step, 9);
    expect(await card.locator("[data-bayes-outcome]").count()).toBe(4);
    await expect(card.locator("#bayes-tree-description")).toContainText("P(A given B) = 1/4");
    if ([2, 4, 6].includes(step)) await card.screenshot({ path: info.outputPath(`urn-stop-${step}.png`) });
  }
  await expect(card.locator("[data-kp-focus-deck-beat]").nth(1)).toContainText("into B and not B");
  await expect(page.locator("[data-bayes-reading=compact]")).toHaveAttribute("data-bayes-reading-revision", (await card.getAttribute("data-bayes-revision"))!);
});

test("Bayes applied-source download builds a verified no-JS edition with local shared styles", async ({ page, browser }, info) => {
  let edition: string | undefined;
  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  try {
    await page.goto("/experiments/bayesian-reasoning/");
    const card = page.locator("[data-bayes-display] [data-bayes-card]");
    await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
    await page.locator(".bayes-author summary").click();
    const editor = page.locator("[data-bayes-draft]"), source = JSON.parse(await editor.inputValue());
    source.model.events[0].label = `Static edition ${Date.now()}`;
    source.model.masses = ["1/8", "3/8", "3/8", "1/8"];
    await editor.fill(JSON.stringify(source)); await page.locator("[data-bayes-apply]").click();
    await expect(card.locator(".bayes-legend")).toContainText(source.model.events[0].label);
    const revision = await card.getAttribute("data-bayes-revision");
    await editor.fill("{");
    const pending = page.waitForEvent("download"); await page.locator("[data-bayes-download]").click();
    const download = await pending, selected = info.outputPath("displayed-source.json"); await download.saveAs(selected);
    expect(JSON.parse(readFileSync(selected, "utf8"))).toEqual(source);
    const built = buildBayesEdition(selected); edition = built.directory;
    expect(built.revisionId).toBe(revision); expect(buildBayesEdition(selected, true).checked).toBe(true);
    const reading = await staticContext.newPage(), requests: string[] = [];
    reading.on("request", request => requests.push(request.url()));
    await reading.goto(pathToFileURL(join(edition, "index.html")).href);
    await expect(reading.locator("[data-bayes-publication-revision]")).toHaveAttribute("data-bayes-publication-revision", revision!);
    expect(await reading.locator("svg.bayes-tree").count()).toBe(7);
    await expect(reading.locator("#bayes-static-4-description")).toHaveText(/B reference population/);
    await expect(reading.locator(".bayes-tree").nth(4).locator("[data-bayes-outcome]").first()).toBeVisible();
    expect(await reading.locator("script").count()).toBe(0);
    expect(requests.every(url => url.startsWith(pathToFileURL(edition + "/").href))).toBe(true);
    const paint = await reading.locator(".bayes-tree").nth(4).evaluate(svg => {
      const text = svg.querySelector("text")!, rule = svg.querySelector("rect")!;
      return { family: getComputedStyle(text).fontFamily, stroke: getComputedStyle(rule).stroke, width: svg.getBoundingClientRect().width };
    });
    expect(paint.family).toContain("Iowan Old Style"); expect(paint.stroke).not.toBe("none"); expect(paint.width).toBeGreaterThan(300);
    await reading.locator(".bayes-tree").nth(4).screenshot({ path: info.outputPath("bayes-static-conditioned.png") });
  } finally { await staticContext.close(); if (edition) rmSync(edition, { recursive: true, force: true }); }
});

test("Bayes practice hides live answers until reveal and returns to the interrupted card", async ({ page }) => {
  await page.goto("/experiments/bayesian-reasoning/");
  const card = page.locator("[data-bayes-display] [data-bayes-card]");
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  await card.locator("[data-kp-focus-deck-scrubber]").evaluate(node => {
    (node as HTMLInputElement).value = "4"; node.dispatchEvent(new Event("input", { bubbles: true }));
  });
  for (const kind of ["prediction", "reconstruction"]) {
    await page.locator(`[data-bayes-practice="${kind}"]`).click();
    await expect(card).toBeHidden(); await expect(page.locator("[data-bayes-answer]")).toBeHidden();
    await expect(page.locator("[data-bayes-reading=full]")).toBeHidden();
    await expect(page.locator("[data-bayes-prompt-context]")).toContainText("no independence");
    await page.locator("[data-bayes-reveal]").click();
    await expect(page.locator("[data-bayes-answer]")).toContainText("2/3");
    await page.locator("[data-bayes-practice-return]").click();
    await expect(card).toBeVisible(); await expect(card).toHaveAttribute("data-bayes-position", "4");
  }
});

test("Bayes addresses restore direct positions, edited revision refresh, Back and Forward", async ({ page }) => {
  await page.goto("/experiments/bayesian-reasoning/");
  const card = page.locator("[data-bayes-display] [data-bayes-card]");
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  await expect.poll(() => page.url()).toContain("bayes=");
  const original = await card.getAttribute("data-bayes-revision");
  const url = await page.evaluate(() => {
    const params = new URLSearchParams(location.hash.slice(1)); const state = JSON.parse(params.get("bayes")!);
    state.position.step = 4; state.position.reference.id = state.position.reference.id.replace(/population$/, "conditioned");
    return `${location.pathname}#${new URLSearchParams({ bayes: JSON.stringify(state) })}`;
  });
  await page.goto(url); await expect(card).toHaveAttribute("data-bayes-position", "4");
  await page.locator(".bayes-author summary").click();
  const editor = page.locator("[data-bayes-draft]");
  const source = JSON.parse(await editor.inputValue()); source.model.events[0].label = "History edit";
  await editor.fill(JSON.stringify(source)); await page.locator("[data-bayes-apply]").click();
  await expect(card.locator(".bayes-legend")).toContainText("History edit");
  const edited = await card.getAttribute("data-bayes-revision"); expect(edited).not.toBe(original);
  await page.reload(); await expect(card).toHaveAttribute("data-bayes-revision", edited!);
  await expect(card).toHaveAttribute("data-bayes-position", "4");
  await page.goBack(); await expect(card).toHaveAttribute("data-bayes-revision", original!);
  await page.goForward(); await expect(card).toHaveAttribute("data-bayes-revision", edited!);
  await expect(card.locator(".bayes-legend")).toContainText("History edit");
  await page.evaluate(() => { location.hash = "bayes=%7B"; });
  await expect(page.locator("[data-bayes-author-status]")).toContainText("Address not restored");
  await expect(page.locator("[data-bayes-error]")).toBeVisible();
  await expect(card).toHaveAttribute("data-bayes-revision", edited!);
  await page.evaluate(() => {
    dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
    dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
  });
  await expect(card).toHaveAttribute("data-bayes-position", "4");
});

test("Bayes denominator disclosure returns to the exact interrupted shared-clock position", async ({ page }) => {
  await page.goto("/experiments/bayesian-reasoning/");
  const card = page.locator("[data-bayes-display] [data-bayes-card]");
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  await card.locator("[data-kp-focus-deck-scrubber]").evaluate(node => {
    (node as HTMLInputElement).value = "5.45"; node.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator("[data-bayes-explain]").click();
  await expect(page.locator("[data-bayes-reason]")).toBeVisible();
  await expect(page.locator("[data-bayes-reason]")).toContainText("Gathering B and conditioning on B are distinct");
  await expect(card).toHaveAttribute("data-bayes-position", "3");
  await page.locator("[data-bayes-return]").click();
  await expect(card).toHaveAttribute("data-bayes-position", "5.45");
  await expect(page.locator("[data-bayes-reason]")).toBeHidden();
  await expect(page.locator("[data-bayes-explain]")).toBeFocused();
  await page.goBack();
  await expect(page.locator("[data-bayes-reason]")).toBeVisible();
  await expect(card).toHaveAttribute("data-bayes-position", "3");
  await page.locator("[data-bayes-return]").click();
  await expect(card).toHaveAttribute("data-bayes-position", "5.45");
});

test("Bayes author apply replaces every projection together and retains last-valid on repair", async ({ page }, info) => {
  await page.goto("/experiments/bayesian-reasoning/");
  const display = page.locator("[data-bayes-display]"), card = display.locator("[data-bayes-card]");
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  await page.locator(".bayes-author summary").click();
  const editor = page.locator("[data-bayes-draft]"), status = page.locator("[data-bayes-author-status]");
  const source = JSON.parse(await editor.inputValue());
  source.model.masses = ["8/100", "12/100", "16/100", "64/100"];
  source.model.events[0].label = "Needs review";
  source.teaching.firstEventId = "flagged";
  const oldRevision = await card.getAttribute("data-bayes-revision");
  await editor.fill(JSON.stringify(source));
  await card.locator("[data-kp-focus-deck-replay]").click();
  await expect.poll(async () => Number(await card.getAttribute("data-bayes-position"))).toBeGreaterThan(0);
  await page.locator("[data-bayes-apply]").click();
  await expect(status).toHaveAttribute("data-bayes-apply-status", "applied");
  await expect(card).not.toHaveAttribute("data-bayes-revision", oldRevision!);
  const revision = await card.getAttribute("data-bayes-revision");
  await expect(display.locator("[data-bayes-display-revision]")).toHaveAttribute("data-bayes-display-revision", revision!);
  await expect(display.locator(".bayes-legend")).toContainText("Needs review");
  await expect(display.locator("[data-kp-focus-deck-beat]").nth(1)).toContainText("into B and not B");
  await expect(display.locator("[data-bayes-model-summary]")).toContainText("tt = 2/25");
  await card.locator("[data-kp-focus-deck-scrubber]").evaluate(node => {
    (node as HTMLInputElement).value = "4"; node.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(card.locator("[data-bayes-count]")).toHaveText("5 / 7");
  await expect(card.locator("#bayes-tree-description")).toContainText("P(A given B) = 1/3");
  await expect(card.locator("[data-bayes-native-host]")).toContainText("1");
  const oldCard = await card.elementHandle();
  await editor.fill("{"); await page.locator("[data-bayes-apply]").click();
  await expect(status).toHaveAttribute("data-bayes-apply-status", "repair-gap");
  expect(await oldCard!.evaluate(node => node.isConnected)).toBe(true);
  await expect(card).toHaveAttribute("data-bayes-revision", revision!);
  await expect(card).toHaveAttribute("data-bayes-position", "4");
  await page.locator("[data-bayes-restore]").click();
  expect(JSON.parse(await editor.inputValue()).model.events[0].label).toBe("Needs review");
  // Apply during an unfinished continuous scrub; the old token cannot move
  // the replacement and the exact interrupted position is retained.
  await card.locator("[data-kp-focus-deck-scrubber]").evaluate(node => {
    (node as HTMLInputElement).value = "2.35"; node.dispatchEvent(new Event("input", { bubbles: true }));
  });
  source.model.events[1].label = "Signal";
  await editor.fill(JSON.stringify(source)); await page.locator("[data-bayes-apply]").click();
  await expect(card.locator(".bayes-legend")).toContainText("Signal");
  await expect(card).toHaveAttribute("data-bayes-position", "2.35");
  expect(await page.locator(".bayes-staging").count()).toBe(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("bayes-editor-mobile.png"), fullPage: true });
});

test("Bayes notation does not paint its prepared fraction over the question", async ({ page }, info) => {
  await page.goto("/experiments/bayesian-reasoning/");
  const card = page.locator("[data-bayes-card]");
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  const paintedText = () => card.locator("[data-bayes-native-host]").evaluate(host => {
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    const texts: string[] = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent?.trim()) continue;
      const element = node.parentElement!;
      if (getComputedStyle(element).visibility !== "visible") continue;
      let opacity = 1;
      for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor);
        opacity *= Number(style.opacity);
        if (style.display === "none") opacity = 0;
      }
      const range = document.createRange(); range.selectNodeContents(node);
      if (opacity > 0 && [...range.getClientRects()].some(rect => rect.width > 1 && rect.height > 1)) texts.push(node.textContent);
    }
    return texts;
  });
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const position of [0, 2.9, 3, 3.5, 4, 6, 2, 0]) {
      await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, position) => {
        (node as HTMLInputElement).value = String(position); node.dispatchEvent(new Event("input", { bubbles: true }));
      }, position);
      if (position < 3) {
        await expect(card.locator("[data-bayes-question]")).toBeVisible();
        expect(await paintedText()).toEqual([]);
        await expect(card.locator("[data-bayes-native-host]")).toHaveAttribute("aria-hidden", "true");
      } else {
        await expect(card.locator("[data-bayes-question]")).toBeHidden();
        expect((await paintedText()).length).toBeGreaterThan(0);
        await expect(card.locator("[data-bayes-native-host]")).toHaveAttribute("aria-hidden", "false");
        const label = (await card.locator("[data-bayes-formula-label]").boundingBox())!;
        const native = (await card.locator("[data-bayes-native-host]").boundingBox())!;
        expect(label.y + label.height <= native.y + 1 || label.x + label.width <= native.x + 1).toBe(true);
      }
    }
    await card.screenshot({ path: info.outputPath(`notation-question-${width}.png`) });
  }
});

test("Bayes initial population is readable without JavaScript or exposed measurement equations", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("http://localhost:8000/experiments/bayesian-reasoning/");
    await expect(page.locator("[data-bayes-root]")).toBeVisible();
    await expect(page.locator("[data-bayes-count]")).toHaveText("1 / 7");
    await expect(page.locator("[data-bayes-population-label]")).toHaveText("Reference: whole population");
    expect(await page.locator("[data-bayes-native-host] .katex").count()).toBe(0);
    await expect(page.locator("[data-kp-focus-deck-beat-active=true]")).toContainText("The model specifies four disjoint joint outcomes");
  } finally { await context.close(); }
});

test("Bayes reversible tree retains owners and supplies an exemplar contact sheet", async ({ page }, info) => {
  await page.goto("/experiments/bayesian-reasoning/");
  const card = page.locator("[data-bayes-card]");
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  const originals = await page.locator("[data-bayes-outcome]").elementHandles();
  const frames: { position: number; svg: string }[] = [];
  for (const position of [0, 1, 2, 2.5, 3, 3.5, 4, 5, 5.5, 6, 2]) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, value) => {
      (node as HTMLInputElement).value = String(value); node.dispatchEvent(new Event("input", { bubbles: true }));
    }, position);
    await expect.poll(async () => Number(await card.getAttribute("data-bayes-position"))).toBeCloseTo(position, 9);
    expect(await page.locator("[data-bayes-outcome]").count()).toBe(4);
    for (const owner of originals) expect(await owner.evaluate(node => node.isConnected)).toBe(true);
    if (Number.isInteger(position)) frames.push({ position, svg: await card.locator("svg.bayes-tree").evaluate(node => node.outerHTML) });
    if ([2, 3, 4, 6].includes(position)) {
      const stage = await card.locator(".bayes-stage").boundingBox(), tree = await card.locator("svg.bayes-tree").boundingBox();
      expect(tree!.y + tree!.height).toBeLessThanOrEqual(stage!.y + stage!.height + 1);
      await card.screenshot({ path: info.outputPath(`bayes-step-${position + 1}.png`) });
    }
  }
  expect(frames[2]!.svg).toBe(frames.at(-1)!.svg);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await card.locator("[data-kp-focus-deck-scrubber]").focus();
  await page.keyboard.press("End");
  await expect(card).toHaveAttribute("data-bayes-position", "6");
  await expect(card.locator("[data-bayes-count]")).toHaveText("7 / 7");
  await expect(page.locator("[data-bayes-error]")).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await card.screenshot({ path: info.outputPath("bayes-phone-reduced.png") });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(frames => {
    const sheet = document.createElement("section"); sheet.id = "bayes-contact-sheet";
    sheet.style.cssText = "display:grid;grid-template-columns:repeat(2,700px);background:#fffdf8;color:#20252b;gap:12px;padding:12px";
    for (const frame of frames.slice(0, 7)) { const cell = document.createElement("section");
      cell.innerHTML = `<h2>Stop ${frame.position + 1} / 7</h2>${frame.svg}`; sheet.append(cell); }
    document.body.replaceChildren(sheet);
  }, frames);
  await page.locator("#bayes-contact-sheet").screenshot({ path: info.outputPath("bayes-contact-sheet.png") });
});

test("Bayes card uses seven shared semantic stops and animated keyboard traversal", async ({ page }) => {
  await page.goto("/experiments/bayesian-reasoning/");
  const card = page.locator("[data-bayes-card]");
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  const slider = card.locator("[data-kp-focus-deck-scrubber]");
  await slider.focus(); await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(250);
  const position = Number(await card.getAttribute("data-bayes-position"));
  expect(position).toBeGreaterThan(0); expect(position).toBeLessThan(1);
  await expect(slider).toHaveValue("1", { timeout: 4000 });
  await expect(card.locator("[data-bayes-count]")).toHaveText("2 / 7");
  await page.keyboard.press("ArrowLeft");
  await expect(slider).toHaveValue("0", { timeout: 4000 });
  await expect(card.locator("[data-bayes-count]")).toHaveText("1 / 7");
  const viewport = card.locator("[data-kp-focus-deck-viewport]");
  const samples = await viewport.evaluate(async viewport => {
    const samples: number[] = [];
    for (const step of [.3, .8, 1.4, 1.8, 1.3, .7]) {
      viewport.dispatchEvent(new WheelEvent("wheel", { deltaX: 1, bubbles: true }));
      viewport.scrollLeft = viewport.clientWidth * step;
      viewport.dispatchEvent(new Event("scroll"));
      await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
      samples.push(Number(viewport.closest<HTMLElement>("[data-bayes-card]")!.dataset["bayesPosition"]));
    }
    viewport.dispatchEvent(new Event("scrollend"));
    return samples;
  });
  expect(new Set(samples).size, JSON.stringify(samples)).toBeGreaterThan(4);
  expect(samples.at(-1)).toBeLessThan(samples[3]!);
  // A new intent interrupts travel; a stale gesture must not reclaim the clock.
  await slider.focus(); await page.keyboard.press("Home");
  await expect(slider).toHaveValue("0", { timeout: 5000 });
  await page.waitForTimeout(450); await expect(slider).toHaveValue("0");
  await expect(page.locator("[data-bayes-error]")).toBeHidden();
});

test("Bayes quotient traverses canonical native material and native endpoints", async ({ page }) => {
  await page.goto("/experiments/bayesian-reasoning-native-probe/");
  await expect(page.locator("[data-bayes-native-status]")).toHaveText("ready", { timeout: 60000 });
  const frames = await page.evaluate(() => {
    const probe = (window as unknown as { bayesNativeProbe: { seek: (progress: number) => { nativeEndpointPassed: boolean; canonicalPaintOwner: boolean; motionAuthority: string } } }).bayesNativeProbe;
    return [0, .25, .5, .75, 1, .75, .25, 0].map(progress => ({ progress, ...probe.seek(progress) }));
  });
  for (const frame of frames.filter(frame => frame.progress === 0 || frame.progress === 1)) expect(frame.nativeEndpointPassed).toBe(true);
  expect(frames.some(frame => frame.progress > 0 && frame.progress < 1 && frame.canonicalPaintOwner)).toBe(true);
  await expect(page.locator("[data-bayes-native-status][data-error]")).toHaveCount(0);
});
