import { expect, test } from "@playwright/test";
import { renderKpFocusDeckScaffold } from "../src/tutorial/focus-deck-scaffold.ts";
import { renderKpFocusDeckAnnotation } from "../src/tutorial/focus-deck-annotation.ts";
import { gradientComparisonBounds } from "../src/tutorial/gradient-contour/gradient-contour-story.ts";
import { renderLatexToHtml } from "../src/rendering/katex-adapter.ts";

test("a new static focus card inherits typography without caller font CSS", async ({ page }) => {
  const html = renderKpFocusDeckScaffold({ id: "typography-second-caller", ariaLabel: "Static explanation",
    activeBeatSlug: "inspect", rootAttributes: { "data-kp-focus-deck-static": true },
    beats: [{ slug: "inspect", title: "Inspect", html: "<p>Read the same explanation.</p>" }],
    stageHtml: `<figure class="kp-focus-deck__stage"><div style="position:relative;min-height:6rem">${renderKpFocusDeckAnnotation({ entityId: "fixture.relation", text: "Same relation", detail: "Supporting words" })}</div><p data-unclassified>Ordinary stage words</p><div>${renderLatexToHtml("x+1", { displayMode: false })}</div><code>return x + 1;</code><button>Inspect</button></figure>`
  });
  // Serve generated static markup without enhancement. The actual scaffold CSS
  // must import its policy; the fixture supplies no annotation/prose font rules.
  await page.route("**/__focus-card-typography-test__", route => route.fulfill({ contentType: "text/html", body: `<!doctype html><html><head><link rel="stylesheet" href="/src/tutorial/focus-deck-scaffold.css"><link rel="stylesheet" href="/node_modules/katex/dist/katex.min.css"><style>body{font-family:Arial,sans-serif;margin:1rem}figure{margin:0}p{margin:0}</style></head><body>${html}</body></html>` }));
  await page.goto("/__focus-card-typography-test__");
  const label = page.locator("[data-kp-focus-deck-type=label]");
  await expect(label).toHaveCSS("font-size", "18px");
  const metrics = () => page.locator(".kp-focus-deck").evaluate(element => {
    const font = (selector: string) => getComputedStyle(element.querySelector(selector)!).fontFamily;
    return { label: font("[data-kp-focus-deck-type=label]"), prose: font(".kp-focus-deck__narrative"), ordinary: font("[data-unclassified]"), math: font(".katex .mathnormal"), code: font("code"), ui: font("button") };
  });
  const initial = await metrics();
  expect(initial.label).toContain("Georgia");
  expect(initial.label).toBe(initial.prose); expect(initial.ordinary).toBe(initial.prose);
  expect(initial.math).toContain("KaTeX"); expect(initial.code).toContain("monospace");
  expect(initial.ui).not.toBe(initial.prose);
  await page.locator(".kp-focus-deck").evaluate(element => {
    (element as HTMLElement).style.setProperty("--kp-focus-card-passage-font", "Arial, sans-serif");
    (element as HTMLElement).style.setProperty("--kp-focus-card-label-size", "1.25rem");
  });
  await expect(label).toHaveCSS("font-size", "20px");
  const themed = await metrics();
  expect(themed.prose).toContain("Arial"); expect(themed.label).toBe(themed.prose); expect(themed.ordinary).toBe(themed.prose);
  expect(themed.math).toBe(initial.math); expect(themed.code).toBe(initial.code); expect(themed.ui).toBe(initial.ui);
  await page.evaluate(() => { document.documentElement.style.fontSize = "32px"; });
  await expect(label).toHaveCSS("font-size", "40px");
  await expect(page.locator("[data-kp-focus-deck-type=support]")).toHaveCSS("font-size", "32px");
});

test("gradient typography is screen-sized, contained and stable through attention phases", async ({ page }, info) => {
  await page.goto("/experiments/kinetic-figure/gradient-contour/");
  const card = page.locator("[data-kp-focus-deck-id=gradient-contour]");
  await expect(card).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    let prepared: unknown;
    for (const step of [0, .5, 1, .25, 0].map(t => gradientComparisonBounds.start + t)) {
      await page.locator("[data-kp-focus-deck-scrubber]").evaluate((element, position) => {
        (element as HTMLInputElement).value = String(position); element.dispatchEvent(new Event("input", { bubbles: true }));
      }, step);
      const labels = await card.evaluate(element => {
        const plot = element.querySelector(".kp-surface-contour-stage")!.getBoundingClientRect();
        const prose = getComputedStyle(element.querySelector(".kp-focus-deck__narrative")!).fontFamily;
        return [...element.querySelectorAll<HTMLElement>("[data-gradient-annotations] [data-kp-focus-deck-annotation]")].map(label => {
          const style = getComputedStyle(label), bounds = label.getBoundingClientRect();
          return { font: style.fontFamily, prose, size: parseFloat(style.fontSize), weight: style.fontWeight,
            x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height,
            contained: bounds.left >= plot.left - 1 && bounds.right <= plot.right + 1 && bounds.top >= plot.top - 1 && bounds.bottom <= plot.bottom + 1,
            overflow: label.scrollWidth - label.clientWidth };
        });
      });
      expect(labels).toHaveLength(3);
      for (const label of labels) { expect(label.font).toBe(label.prose); expect(label.size).toBeGreaterThanOrEqual(16); expect(label.contained).toBe(true); expect(label.overflow).toBeLessThanOrEqual(1); }
      expect(labels[0]!.size).toBe(18); expect(labels[0]!.weight).toBe(labels[1]!.weight);
      if (step === gradientComparisonBounds.start && prepared === undefined) prepared = labels;
      else expect(labels).toEqual(prepared);
    }
    await page.screenshot({ path: info.outputPath(`typography-${width}.png`), fullPage: true });
  }
});

test("gradient typography retains enlarged text without clipping labels", async ({ page }, info) => {
  await page.goto("/experiments/kinetic-figure/gradient-contour/");
  await expect(page.locator("[data-kp-focus-deck]")).toHaveAttribute("data-kp-focus-card-enhancement", "ready");
  await page.locator("[data-kp-focus-deck-scrubber]").evaluate((element, step) => {
    (element as HTMLInputElement).value = String(step); element.dispatchEvent(new Event("input", { bubbles: true }));
  }, gradientComparisonBounds.start);
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const size of [20, 24, 32]) {
      await page.evaluate(value => { document.documentElement.style.fontSize = `${value}px`; }, size);
      const labels = await page.locator("[data-gradient-annotations]").evaluate(element => {
        const plot = element.closest(".kp-surface-contour-stage")!.getBoundingClientRect();
        return [...element.querySelectorAll<HTMLElement>("[data-kp-focus-deck-annotation]")].map(label => {
          const bounds = label.getBoundingClientRect();
          const text = document.createRange(); text.selectNodeContents(label.firstChild!);
          return { id: label.dataset["kpFocusDeckAnnotation"], size: parseFloat(getComputedStyle(label).fontSize),
            wordHeight: text.getBoundingClientRect().height,
            clipped: bounds.left < plot.left - 1 || bounds.right > plot.right + 1 || bounds.top < plot.top - 1 || bounds.bottom > plot.bottom + 1,
            overflow: label.scrollWidth - label.clientWidth };
        });
      });
      expect(labels.filter(label => label.clipped || label.overflow > 1), `width ${width}, root font ${size}`).toEqual([]);
      expect(labels[0]!.size).toBe(size * 1.125);
      for (const label of labels.slice(0, 2)) expect(label.wordHeight).toBeLessThan(label.size * 1.5);
      const button = page.locator("[data-gradient-play-comparison]");
      await button.scrollIntoViewIfNeeded();
      await expect(button).toBeVisible();
      const panel = (await page.locator("[data-gradient-guided-passage]").boundingBox())!, action = (await button.boundingBox())!;
      expect(action.x).toBeGreaterThanOrEqual(panel.x);
      expect(action.x + action.width).toBeLessThanOrEqual(panel.x + panel.width + 1);
      await page.screenshot({ path: info.outputPath(`typography-${width}-font-${size}.png`), fullPage: true });
    }
  }
});
