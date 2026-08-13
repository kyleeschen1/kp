import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "../scripts/capture-visual-contact-sheet.ts";

const animationId = "animation.programming.python-free-shipping-refactor";
const outputRoot = path.resolve("tmp/codex/python-refactor");
const wide = { width: 1440, height: 1000 } as const;
const phone = { width: 390, height: 844 } as const;
const checkpoints = [
  checkpoint("before-wide-000", "Duplicated rule", 0, "projection.python.before", wide),
  checkpoint("duplicates-wide-160", "One idea, two copies", 0.16, "projection.python.before", wide),
  checkpoint("helper-wide-340", "Helper introduced", 0.34, "projection.python.helper-introduced", wide),
  checkpoint("fusion-wide-420", "Threshold rules converge", 0.42, "projection.python.helper-introduced", wide),
  checkpoint("fusion-arrived-wide-450", "Threshold rules arrive", 0.45, "projection.python.helper-introduced", wide),
  checkpoint("cost-motion-wide-590", "Helper propagates to price", 0.59, "projection.python.helper-introduced", wide),
  checkpoint("cost-wide-680", "Price caller replaced", 0.68, "projection.python.cost-replaced", wide),
  checkpoint("message-wide-840", "Message caller replaced", 0.84, "projection.python.final", wide),
  checkpoint("settled-wide-1000", "One source of truth", 1, "projection.python.final", wide),
  checkpoint("cost-phone-680", "Price caller · phone", 0.68, "projection.python.cost-replaced", phone),
  {
    ...checkpoint("cost-reduced-680", "Price caller · reduced motion", 0.68,
      "projection.python.cost-replaced", wide),
    reducedMotion: true
  }
] as const;

test("Python refactor visual checkpoint is deterministic, accessible, and bounded", async ({
  browser,
  baseURL
}) => {
  await mkdir(outputRoot, { recursive: true });
  const items: KpVisualContactSheetItem[] = [];
  let canonicalStageSize: { width: number; height: number } | undefined;

  for (const entry of checkpoints) {
    const context = await browser.newContext({
      viewport: entry.viewport,
      reducedMotion: entry.reducedMotion ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    try {
      await mockReviewQuery(page);
      await installPerformanceProbe(page);
      const url = new URL("/", baseURL);
      url.searchParams.set("artifact", animationId);
      if (entry.progress > 0) url.searchParams.set("playhead", String(entry.progress));
      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await waitForPythonPaint(page, entry.progress);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise<void>((resolve) => requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve())
        ));
      });
      await resetPerformanceProbe(page);
      await exerciseRenderer(page, entry.progress);

      const shell = page.locator("[data-kp-animation-catalogue]");
      const player = shell.locator("[data-kp-editor-animation-player]");
      const slot = player.locator('[data-kp-editor-animation-surface-slot="programming"]');
      const stage = slot.locator("[data-kp-python-refactor-stage]");
      await expect(shell).toHaveAttribute("data-kp-animation-catalogue-selection", animationId);
      await expect(shell.locator("iframe")).toHaveCount(0);
      await expect(slot).toHaveAttribute(
        "data-kp-editor-animation-adapter-id",
        "adapter.programming.python-free-shipping-refactor"
      );
      await expect(slot).toHaveAttribute("data-kp-editor-animation-adapter-status", "ready");
      await expect(stage).toHaveAttribute("data-kp-python-active-projection", entry.projectionId);
      await expect(stage.locator(
        '[data-kp-python-projection-current="true"]:not([aria-hidden="true"])'
      )).toHaveCount(1);
      await expect(stage.locator(
        '[data-kp-python-projection-current="false"][aria-hidden="true"][inert]'
      )).toHaveCount(3);
      await expect(stage.locator("canvas, svg")).toHaveCount(0);
      expect(await shell.evaluate((node) => getComputedStyle(node).backgroundColor))
        .toBe("rgb(13, 14, 28)");
      expect(await stage.evaluate((node) => getComputedStyle(node)
        .getPropertyValue("--kp-code-highlight-background").trim()))
        .toBe("rgb(92 173 255 / 10%)");
      await expect(stage.locator('[data-kp-python-focus="true"]').first())
        .toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(stage.locator('[data-kp-python-focus="false"]').first())
        .toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(stage.locator(
        '[data-kp-python-projection-current="true"] [data-kp-python-syntax-kind="keyword"]'
      ).first()).toHaveCSS("color", "rgb(144, 153, 217)");
      await expect(stage.locator(
        '[data-kp-python-projection-current="true"] [data-kp-python-syntax-kind="function"]'
      ).first()).toHaveCSS("color", "rgb(51, 143, 255)");
      await expect(stage.locator(
        '[data-kp-python-projection-current="true"] [data-kp-python-syntax-kind="number"]'
      ).first()).toHaveCSS("color", "rgb(237, 232, 208)");

      if (entry.progress === 0.42) {
        await expect(stage).toHaveAttribute(
          "data-kp-python-motion-track",
          "motion.python.merge-threshold-rules"
        );
        await expect(stage.locator('[data-kp-python-token-role="transit"]')).toHaveCount(6);
      }
      if (entry.progress === 0.45) {
        const transit = stage.locator('[data-kp-python-token-role="transit"]');
        await expect(transit).toHaveCount(6);
        expect(await transit.evaluateAll((nodes) => nodes.every((node) => {
          const element = node as HTMLElement;
          return element.style.getPropertyValue("--kp-python-token-opacity") === "1" &&
            element.style.getPropertyValue("--kp-python-token-scale") === "1";
        }))).toBe(true);
      }
      if (entry.progress === 0.59) {
        await expect(stage).toHaveAttribute(
          "data-kp-python-motion-track",
          "motion.python.propagate-helper-to-cost"
        );
        await expect(stage.locator('[data-kp-python-token-role="transit"]')).toHaveCount(2);
        await expect(stage.locator(
          '[data-kp-python-token-role="transit"][data-kp-python-token-kind="function"]'
        )).toHaveCSS("color", "rgb(51, 143, 255)");
      }
      if (entry.reducedMotion) {
        await expect(stage).toHaveAttribute("data-kp-python-motion-mode", "reduced");
        await expect(stage.locator('[data-kp-python-token-role="transit"]')).toHaveCount(0);
      }

      const stageSize = await stage.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });
      if (entry.viewport.width === wide.width) {
        canonicalStageSize ??= stageSize;
        expect(stageSize.width).toBeCloseTo(canonicalStageSize.width, 0);
        expect(stageSize.height).toBeCloseTo(canonicalStageSize.height, 0);
      }
      expect(await page.evaluate(() =>
        document.documentElement.scrollWidth <= window.innerWidth + 1
      )).toBe(true);

      const sourceText = await stage.locator(
        '[data-kp-python-projection-current="true"]'
      ).innerText();
      if (entry.progress === 0) expect(sourceText.match(/total >= 50/g)?.length).toBe(2);
      if (entry.progress === 0.34) {
        expect(sourceText.match(/total >= 50/g)?.length).toBe(3);
        expect(sourceText).not.toContain("qualifies_for_free_shipping(total)");
      }
      if (entry.progress === 0.68) {
        expect(sourceText.match(/qualifies_for_free_shipping\(total\)/g)?.length).toBe(1);
      }
      if (entry.progress >= 0.84) {
        expect(sourceText.match(/qualifies_for_free_shipping\(total\)/g)?.length).toBe(2);
      }

      const resources = await page.evaluate(() => performance.getEntriesByType("resource")
        .map(({ name }) => name));
      expect(resources.some((name) =>
        /python-refactor-(?:frontend|semantic-compiler)|scripts\/python|\.py(?:\?|$)/i.test(name)
      )).toBe(false);
      const performanceResult = await readPerformanceProbe(page);
      expect(performanceResult.layoutShift).toBeLessThanOrEqual(0.01);
      expect(performanceResult.maxLongTaskMs).toBeLessThan(100);

      const capture = await page.evaluate(async (providerPath) => {
        const module = await import(providerPath);
        return module.createKpAnimationCatalogueCaptureProvider(document).capture({
          route: new URL(window.location.href),
          capturedAtMs: performance.now(),
          eventTarget: document.body
        });
      }, "/src/dev-review/animation-catalogue-capture-provider.ts");
      expect(capture.semantic).toMatchObject({
        documentId: "animation.catalogue",
        assetId: animationId,
        progressPermille: Math.round(entry.progress * 1000)
      });
      await expect(page.locator("[data-kp-dev-review-shell]")).toHaveCount(1);

      const imageFile = path.join(outputRoot, `${entry.id}.png`);
      const image = await stage.screenshot({ path: imageFile, animations: "disabled" });
      if (entry.progress === 0.59 && entry.viewport.width === wide.width) {
        await page.screenshot({
          path: path.join(outputRoot, "artifact-page-wide-590.png"),
          animations: "disabled"
        });
      }
      items.push({
        id: entry.id,
        label: entry.label,
        progress: entry.progress,
        viewport: entry.viewport,
        file: path.relative(process.cwd(), imageFile),
        dataUrl: `data:image/png;base64,${image.toString("base64")}`
      });
    } finally {
      await context.close();
    }
  }

  const context = await browser.newContext({ viewport: wide });
  const page = await context.newPage();
  try {
    await mockReviewQuery(page);
    await page.goto(`${baseURL}/?artifact=${animationId}&playhead=0.84`, {
      waitUntil: "networkidle"
    });
    await waitForPythonPaint(page, 0.84);
    const player = page.locator("[data-kp-editor-animation-player]");
    await seek(page, 0.34);
    await expect(page.locator("[data-kp-python-refactor-stage]")).toHaveAttribute(
      "data-kp-python-active-projection",
      "projection.python.helper-introduced"
    );
    await player.press("R");
    await seek(page, 0.68);
    await expect(player).toHaveAttribute("data-kp-editor-animation-direction", "rewind");
    await expect(page.locator("[data-kp-python-refactor-stage]")).toHaveAttribute(
      "data-kp-python-active-projection",
      "projection.python.cost-replaced"
    );
  } finally {
    await context.close();
  }

  const html = buildKpVisualContactSheetHtml(items, {
    title: "Kinetic Press · Python threshold refactor",
    columns: 2,
    imageFit: "contain"
  });
  await writeFile(path.join(outputRoot, "index.html"), html, "utf8");
  await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify({
    schemaVersion: "kp.python-refactor-visual-checkpoint.v1",
    animationId,
    disposition: "Unreviewed",
    promotion: "blocked-on-human-visual-approval",
    captures: items.map(({ dataUrl: _dataUrl, ...item }) => item)
  }, null, 2)}\n`, "utf8");
  const sheetContext = await browser.newContext({ viewport: wide });
  const sheetPage = await sheetContext.newPage();
  try {
    await sheetPage.setContent(html, { waitUntil: "load" });
    await sheetPage.screenshot({
      path: path.join(outputRoot, "contact-sheet.png"),
      fullPage: true,
      animations: "disabled"
    });
  } finally {
    await sheetContext.close();
  }
});

function checkpoint(
  id: string,
  label: string,
  progress: number,
  projectionId: string,
  viewport: { readonly width: number; readonly height: number }
) {
  return { id, label, progress, projectionId, viewport, reducedMotion: false } as const;
}

async function waitForPythonPaint(
  page: import("@playwright/test").Page,
  progress: number
): Promise<void> {
  await page.waitForFunction(({ animationId: expectedId, progress: expected }) => {
    const shell = document.querySelector<HTMLElement>("[data-kp-animation-catalogue]");
    const player = shell?.querySelector<HTMLElement>("[data-kp-editor-animation-player]");
    return shell?.dataset["kpAnimationCatalogueSelection"] === expectedId &&
      shell.dataset["kpAnimationCatalogueHostOutcome"] === "painted" &&
      player?.dataset["kpEditorAnimationHydrated"] === "true" &&
      Math.abs(Number(player.dataset["kpEditorAnimationProgress"]) - expected) < 0.001 &&
      shell.querySelector("[data-kp-python-refactor-stage]") !== null;
  }, { animationId, progress });
}

async function seek(page: import("@playwright/test").Page, progress: number): Promise<void> {
  await page.locator('[data-action="seek-editor-animation"]').evaluate((node, value) => {
    const range = node as HTMLInputElement;
    range.value = String(value);
    range.dispatchEvent(new Event("input", { bubbles: true }));
  }, progress);
}

async function exerciseRenderer(
  page: import("@playwright/test").Page,
  progress: number
): Promise<void> {
  const probe = progress < 0.995 ? progress + 0.005 : progress - 0.005;
  await seek(page, probe);
  await waitForPythonPaint(page, probe);
  await seek(page, progress);
  await waitForPythonPaint(page, progress);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() =>
    requestAnimationFrame(() => resolve())
  )));
}

async function installPerformanceProbe(page: import("@playwright/test").Page): Promise<void> {
  await page.addInitScript(() => {
    const scope = window as typeof window & {
      __kpPythonPerformance?: { layoutShift: number; maxLongTaskMs: number };
    };
    scope.__kpPythonPerformance = { layoutShift: 0, maxLongTaskMs: 0 };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (shift.hadRecentInput !== true) {
          scope.__kpPythonPerformance!.layoutShift += shift.value ?? 0;
        }
      }
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        scope.__kpPythonPerformance!.maxLongTaskMs = Math.max(
          scope.__kpPythonPerformance!.maxLongTaskMs,
          entry.duration
        );
      }
    }).observe({ type: "longtask", buffered: true });
  });
}

async function resetPerformanceProbe(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(() => {
    const scope = window as typeof window & {
      __kpPythonPerformance: { layoutShift: number; maxLongTaskMs: number };
    };
    scope.__kpPythonPerformance = { layoutShift: 0, maxLongTaskMs: 0 };
  });
}

async function mockReviewQuery(page: import("@playwright/test").Page): Promise<void> {
  await page.route("**/api/dev/reviews/v2/query", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        query: { scope: "all", limit: 100, detail: "full" },
        counts: {
          lifetime: 0, current: 0, currentNew: 0, historical: 0, matching: 0,
          byStatus: {
            new: 0, discussed: 0, grouped: 0, accepted: 0,
            fixed: 0, verified: 0, dismissed: 0
          }
        },
        rounds: [{
          id: "round.python-visual",
          sequence: 1,
          label: "Python visual checkpoint",
          status: "open",
          synthetic: false,
          noteCount: 0,
          newCount: 0
        }],
        page: { notes: [], hasMore: false }
      })
    });
  });
}

async function readPerformanceProbe(page: import("@playwright/test").Page) {
  return page.evaluate(() => (window as typeof window & {
    __kpPythonPerformance: { layoutShift: number; maxLongTaskMs: number };
  }).__kpPythonPerformance);
}
