import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "../scripts/capture-visual-contact-sheet.ts";

const animationId = "animation.graph-3d.saddle-denominator-four-to-eight";
const adapterId = "editor-animation-surface.graph.webgl-3d-saddle";
const outputRoot = path.resolve("tmp/codex/graph-3d-saddle");
const wide = { width: 1440, height: 1000 } as const;
const phone = { width: 390, height: 844 } as const;
const captures = [
  capture("source", "Source · denominator 4", 0, wide),
  capture("quarter", "Flattening · denominator 5", 0.25, wide),
  capture("midpoint", "Flattening · denominator 6", 0.5, wide),
  capture("target", "Target · denominator 8", 1, wide),
  capture("phone-midpoint", "Responsive · denominator 6", 0.5, phone)
] as const;

test("the compiled Graph3D route paints one fixed-camera saddle responsively", async ({
  browser,
  baseURL
}) => {
  await mkdir(outputRoot, { recursive: true });
  const items: KpVisualContactSheetItem[] = [];
  const surfaceShapes = new Map<number, string>();
  const surfaceIdentityIds = new Set<string>();
  const cameraStateIds = new Set<string>();

  for (const entry of captures) {
    const context = await browser.newContext({ viewport: entry.viewport });
    const page = await context.newPage();
    try {
      await mockReviewQuery(page);
      const url = new URL("/", baseURL);
      url.searchParams.set("artifact", animationId);
      if (entry.progress > 0) {
        url.searchParams.set("playhead", String(entry.progress));
      }
      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await waitForGraph3DPaint(page, entry.progress);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise<void>((resolve) => requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve())
        ));
      });

      const catalogue = page.locator("[data-kp-animation-catalogue]");
      const player = catalogue.locator("[data-kp-editor-animation-player]");
      const slot = player.locator(
        '[data-kp-editor-animation-surface-slot="graph"]'
      );
      const stage = slot.locator("[data-kp-graph-3d-saddle-paint]");
      const shell = stage.locator(".graph-webgl");
      const fallback = shell.locator(".graph-webgl__fallback");
      const fallbackGraph = fallback.locator(".graph-svg--3d");
      const labels = stage.locator(".kp-graph-3d-saddle-label");
      const expectedDenominator = 4 + entry.progress * 4;

      await expect(catalogue).toHaveAttribute(
        "data-kp-animation-catalogue-selection",
        animationId
      );
      await expect(catalogue).toHaveAttribute(
        "data-kp-animation-catalogue-host-outcome",
        "painted"
      );
      await expect(player).toHaveAttribute(
        "data-kp-editor-animation-pack-id",
        "graph"
      );
      await expect(slot).toHaveAttribute(
        "data-kp-editor-animation-adapter-id",
        adapterId
      );
      await expect(slot).toHaveAttribute(
        "data-kp-editor-graph-3d-contract",
        "kp.editor-animation.graph-3d-saddle-host.v1"
      );
      await expect(slot).toHaveAttribute(
        "data-kp-editor-graph-3d-runtime-protocol",
        "kp.graph-3d-runtime-protocol.v1"
      );
      await expect(stage).toHaveAttribute(
        "data-kp-saddle-denominator",
        formatNumber(expectedDenominator)
      );
      await expect(stage).toHaveAttribute(
        "data-kp-camera-state",
        "camera.graph-3d.saddle-parameter.fixed"
      );
      await expect(shell).toHaveAttribute(
        "data-kp-editor-graph-3d-capability",
        "ready"
      );
      await expect(shell).toHaveAttribute("data-kp-webgl-status", "ready");
      await expect(shell.locator("canvas")).toHaveCount(1);
      await expect(labels).toHaveCount(5);
      await expect(stage.locator(".kp-graph-3d-saddle-label .katex"))
        .toHaveCount(5);
      await expect(fallback.locator("text")).toHaveCount(0);
      await expect(fallbackGraph).toHaveAttribute(
        "data-kp-camera-azimuth-degrees",
        "35"
      );
      await expect(fallbackGraph).toHaveAttribute(
        "data-kp-surface-x-sample-count",
        "21"
      );
      await expect(fallbackGraph).toHaveAttribute(
        "data-kp-surface-y-sample-count",
        "21"
      );

      const observation = await stage.evaluate((node) => {
        const surface = node.querySelector<SVGGElement>(
          '.graph-webgl__fallback [data-kp-type="surface-3d"]'
        );
        const quad = node.querySelector<SVGPolygonElement>(
          ".graph-webgl__fallback .graph-surface__quad"
        );
        const rect = node.getBoundingClientRect();
        return {
          cameraStateId: (node as HTMLElement).dataset["kpCameraState"] ?? "",
          denominator: Number(
            (node as HTMLElement).dataset["kpSaddleDenominator"]
          ),
          fitsViewport:
            rect.left >= -1 && rect.right <= window.innerWidth + 1 &&
            document.documentElement.scrollWidth <= window.innerWidth + 1,
          surfaceIdentityId: surface?.dataset["kpObject"] ?? "",
          surfaceShape: quad?.getAttribute("points") ?? ""
        };
      });
      expect(observation.denominator).toBeCloseTo(expectedDenominator, 8);
      expect(observation.fitsViewport).toBe(true);
      expect(observation.surfaceShape.length).toBeGreaterThan(0);
      surfaceShapes.set(entry.progress, observation.surfaceShape);
      surfaceIdentityIds.add(observation.surfaceIdentityId);
      cameraStateIds.add(observation.cameraStateId);

      const imageFile = path.join(outputRoot, `${entry.id}.png`);
      const image = await catalogue.locator(
        ".editor-animation-player__stage"
      ).screenshot({
        path: imageFile,
        animations: "disabled"
      });
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

  expect(surfaceShapes.get(0)).not.toBe(surfaceShapes.get(0.5));
  expect(surfaceShapes.get(0.5)).not.toBe(surfaceShapes.get(1));
  expect(surfaceIdentityIds).toEqual(new Set([
    "surface.graph-3d.saddle-parameter.primary"
  ]));
  expect(cameraStateIds).toEqual(new Set([
    "camera.graph-3d.saddle-parameter.fixed"
  ]));

  const html = buildKpVisualContactSheetHtml(items, {
    title: "Kinetic Press · Graph3D saddle parameter transition",
    columns: 2,
    imageFit: "contain"
  });
  await writeFile(path.join(outputRoot, "index.html"), html, "utf8");
  await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify({
    schemaVersion: "kp.graph-3d-saddle-parameter-checkpoint.v1",
    animationId,
    disposition: "Awaiting human review",
    captures: items.map(({ dataUrl: _dataUrl, ...item }) => item)
  }, null, 2)}\n`, "utf8");
  const sheetContext = await browser.newContext({ viewport: wide });
  const sheet = await sheetContext.newPage();
  try {
    await sheet.setContent(html, { waitUntil: "load" });
    await sheet.screenshot({
      path: path.join(outputRoot, "contact-sheet.png"),
      fullPage: true,
      animations: "disabled"
    });
  } finally {
    await sheetContext.close();
  }
});

test("the retained saddle seeks rewinds and releases its WebGL lease", async ({
  page
}) => {
  await mockReviewQuery(page);
  await page.goto(`/?artifact=${animationId}`);
  await waitForGraph3DPaint(page, 0);
  const player = page.locator("[data-kp-editor-animation-player]");
  const stage = player.locator("[data-kp-graph-3d-saddle-paint]");
  const shell = stage.locator(".graph-webgl");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  await stage.evaluate((node) => node.setAttribute(
    "data-kp-browser-identity-probe",
    "retained-saddle"
  ));
  expect(await activeLeaseCount(page)).toBe(1);

  await scrubber.fill("0.5");
  await expect(stage).toHaveAttribute("data-kp-saddle-denominator", "6");
  await expect(stage).toHaveAttribute(
    "data-kp-browser-identity-probe",
    "retained-saddle"
  );
  await expect(shell).toHaveAttribute("data-kp-webgl-transition", "sampled");

  await player.press("End");
  await expect(stage).toHaveAttribute("data-kp-saddle-denominator", "8");
  await player.press("Home");
  await expect(stage).toHaveAttribute("data-kp-saddle-denominator", "4");
  await expect(stage).toHaveAttribute(
    "data-kp-browser-identity-probe",
    "retained-saddle"
  );

  await shell.locator(".graph-webgl__canvas").evaluate((canvas) => {
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  });
  await expect(shell).toHaveAttribute("data-kp-webgl-status", "fallback");
  await expect(shell.locator(".graph-webgl__fallback")).toBeVisible();
  await expect(shell.locator(".graph-webgl__canvas")).toBeHidden();
  await expect(stage.locator(".kp-graph-3d-saddle-label .katex"))
    .toHaveCount(5);
  expect(await activeLeaseCount(page)).toBe(0);
});

function capture(
  id: string,
  label: string,
  progress: number,
  viewport: { readonly width: number; readonly height: number }
) {
  return { id, label, progress, viewport } as const;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

async function waitForGraph3DPaint(
  page: import("@playwright/test").Page,
  progress: number
): Promise<void> {
  await page.waitForFunction(({ expectedId, expectedProgress, expectedAdapter }) => {
    const catalogue = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue]"
    );
    const player = catalogue?.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player]"
    );
    const slot = player?.querySelector<HTMLElement>(
      '[data-kp-editor-animation-surface-slot="graph"]'
    );
    const shell = slot?.querySelector<HTMLElement>(".graph-webgl");
    return catalogue?.dataset["kpAnimationCatalogueSelection"] === expectedId &&
      catalogue.dataset["kpAnimationCatalogueHostOutcome"] === "painted" &&
      player?.dataset["kpEditorAnimationHydrated"] === "true" &&
      Math.abs(Number(player.dataset["kpEditorAnimationProgress"]) -
        expectedProgress) < 0.001 &&
      slot?.dataset["kpEditorAnimationAdapterId"] === expectedAdapter &&
      shell?.dataset["kpWebglStatus"] === "ready";
  }, {
    expectedId: animationId,
    expectedProgress: progress,
    expectedAdapter: adapterId
  });
}

async function activeLeaseCount(
  page: import("@playwright/test").Page
): Promise<number> {
  return page.evaluate(async () => {
    const modulePath = "/src/rendering/webgl-context-lease-pool.ts";
    const pool = await import(/* @vite-ignore */ modulePath) as typeof import(
      "../src/rendering/webgl-context-lease-pool.ts"
    );
    return pool.inspectKpWebglContextLeasePool(document).active;
  });
}

async function mockReviewQuery(
  page: import("@playwright/test").Page
): Promise<void> {
  await page.route("**/api/dev/reviews/v2/query", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        query: { scope: "all", limit: 100, detail: "full" },
        counts: {
          lifetime: 0,
          current: 0,
          currentNew: 0,
          historical: 0,
          matching: 0,
          byStatus: {
            new: 0,
            discussed: 0,
            grouped: 0,
            accepted: 0,
            fixed: 0,
            verified: 0,
            dismissed: 0
          }
        },
        rounds: [{
          id: "round.graph-3d-saddle",
          sequence: 1,
          label: "Graph3D saddle checkpoint",
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
