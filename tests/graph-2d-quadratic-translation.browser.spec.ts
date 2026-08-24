import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "../scripts/capture-visual-contact-sheet.ts";

const animationId = "animation.graph-2d.quadratic-translate-right-two";
const adapterId = "adapter.graph-2d.quadratic-translation.svg";
const outputRoot = path.resolve("tmp/codex/graph-2d-translation");
const wide = { width: 1440, height: 1000 } as const;
const phone = { width: 390, height: 844 } as const;
const captures = [
  capture("source", "Source · y = x²", 0, wide),
  capture("quarter", "Translation · half unit right", 0.25, wide),
  capture("midpoint", "Translation · one unit right", 0.5, wide),
  capture("target", "Target · y = (x − 2)²", 1, wide),
  capture("phone-midpoint", "Responsive · midpoint", 0.5, phone)
] as const;

test("the compiled Graph2D route is deterministic responsive native SVG", async ({
  browser,
  baseURL
}) => {
  await mkdir(outputRoot, { recursive: true });
  const items: KpVisualContactSheetItem[] = [];
  const curvePaths = new Map<number, string>();
  const curveIdentityIds = new Set<string>();
  let referenceAxes: readonly string[] | undefined;

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
      await waitForGraph2DPaint(page, entry.progress);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise<void>((resolve) => requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve())
        ));
      });

      const shell = page.locator("[data-kp-animation-catalogue]");
      const player = shell.locator("[data-kp-editor-animation-player]");
      const slot = player.locator(
        '[data-kp-editor-animation-surface-slot="graph"]'
      );
      const graph = slot.locator("[data-kp-editor-graph-svg]");
      const curve = graph.locator("[data-kp-graph2d-quadratic-curve]");
      const points = graph.locator("[data-kp-graph2d-quadratic-point]");
      const stage = shell.locator(".editor-animation-player__stage");

      await expect(shell).toHaveAttribute(
        "data-kp-animation-catalogue-selection",
        animationId
      );
      await expect(shell).toHaveAttribute(
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
        "data-kp-graph2d-quadratic-renderer",
        "renderer.graph-2d.quadratic-translation.svg.v1"
      );
      await expect(graph).toHaveAttribute(
        "data-kp-graph-presentation-profile",
        "kp.graph.function-translation.quadratic.v1"
      );
      await expect(graph).toHaveAttribute(
        "data-kp-graph-text-policy",
        "katex-only"
      );
      await expect(graph.locator("canvas")).toHaveCount(0);
      await expect(graph.locator("text")).toHaveCount(0);
      await expect(graph.locator(
        "[data-kp-graph2d-quadratic-math-label] > [data-kp-latex] > .katex"
      )).toHaveCount(5);
      await expect(curve).toHaveCount(1);
      await expect(points).toHaveCount(3);
      await expect(graph.locator("[data-kp-editor-graph-axis]")).toHaveCount(2);
      await expect(graph.locator("[data-kp-graph2d-quadratic-equation]"))
        .toHaveCount(2);
      await expect(graph).toHaveAttribute(
        "aria-describedby",
        "kp-graph-2d-quadratic-translation-description"
      );

      const observation = await graph.evaluate((node) => {
        const svg = node as SVGSVGElement;
        const curve = svg.querySelector<SVGPathElement>(
          "[data-kp-graph2d-quadratic-curve]"
        );
        const content = svg.querySelector<SVGGElement>(
          "[data-kp-editor-graph-content]"
        );
        const axes = [...svg.querySelectorAll<SVGLineElement>(
          "[data-kp-editor-graph-axis]"
        )].map((axis) => ["x1", "y1", "x2", "y2"]
          .map((attribute) => axis.getAttribute(attribute)).join(","));
        const points = [...svg.querySelectorAll<SVGCircleElement>(
          "[data-kp-graph2d-quadratic-point]"
        )].map((point) => ({
          role: point.dataset["kpGraph2dQuadraticPointRole"],
          x: Number(point.dataset["kpGraphX"]),
          y: Number(point.dataset["kpGraphY"]),
          radius: Number(point.getAttribute("r")),
          fill: getComputedStyle(point).fill
        }));
        return {
          axes,
          curveIdentityId: curve?.dataset["kpSemanticEntityId"] ?? "",
          curvePath: curve?.getAttribute("d") ?? "",
          horizontalShift: Number(
            content?.dataset["kpGraph2dQuadraticHorizontalShift"]
          ),
          points,
          vertexLabelLatex: svg.querySelector<HTMLElement>(
            '[data-kp-graph2d-quadratic-math-label="point-vertex"] ' +
            "[data-kp-latex]"
          )?.dataset["kpLatex"] ?? "",
          description: svg.querySelector("desc")?.textContent ?? "",
          fitsViewport:
            svg.getBoundingClientRect().right <= window.innerWidth + 1 &&
            document.documentElement.scrollWidth <= window.innerWidth + 1
        };
      });
      expect(observation.horizontalShift).toBeCloseTo(entry.progress * 2, 8);
      expect(observation.curveIdentityId).toBe(
        "curve.graph-2d.quadratic-translation.primary"
      );
      expect(observation.description).toContain("axes remain fixed");
      expect(observation.fitsViewport).toBe(true);
      expect(observation.points.map(({ y }) => y)).toEqual([1, 0, 1]);
      expect(observation.points.map(({ radius }) => radius))
        .toEqual([2.5, 3.5, 2.5]);
      expect(observation.points.every(({ fill }) =>
        fill !== "rgb(255, 255, 255)"
      )).toBe(true);
      expect(observation.points.map(({ x }) => x)).toEqual(
        [-1, 0, 1].map((value) => value + entry.progress * 2)
      );
      expect(observation.vertexLabelLatex).toBe(
        `\\operatorname{vertex}\\,(${entry.progress * 2},0)`
      );
      curvePaths.set(entry.progress, observation.curvePath);
      curveIdentityIds.add(observation.curveIdentityId);
      referenceAxes ??= observation.axes;
      expect(observation.axes).toEqual(referenceAxes);

      const imageFile = path.join(outputRoot, `${entry.id}.png`);
      const image = await stage.screenshot({
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

  expect(curvePaths.get(0)).not.toBe(curvePaths.get(0.5));
  expect(curvePaths.get(0.5)).not.toBe(curvePaths.get(1));
  expect(curveIdentityIds).toEqual(new Set([
    "curve.graph-2d.quadratic-translation.primary"
  ]));

  const html = buildKpVisualContactSheetHtml(items, {
    title: "Kinetic Press · Graph2D quadratic translation",
    columns: 2,
    imageFit: "contain"
  });
  await writeFile(path.join(outputRoot, "index.html"), html, "utf8");
  await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify({
    schemaVersion: "kp.graph-2d-quadratic-translation-checkpoint.v1",
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

test("one retained curve survives seek and rewind without a second clock", async ({
  page
}) => {
  await mockReviewQuery(page);
  await page.goto(`/?artifact=${animationId}`);
  await waitForGraph2DPaint(page, 0);
  const player = page.locator("[data-kp-editor-animation-player]");
  const curve = page.locator("[data-kp-graph2d-quadratic-curve]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  await curve.evaluate((node) => node.setAttribute(
    "data-kp-browser-identity-probe",
    "retained-curve"
  ));

  await scrubber.fill("0.5");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "0.5"
  );
  await expect(curve).toHaveAttribute(
    "data-kp-browser-identity-probe",
    "retained-curve"
  );
  await expect(curve).toHaveAttribute(
    "data-kp-graph2d-quadratic-horizontal-shift",
    "1"
  );

  await player.press("End");
  await expect(curve).toHaveAttribute(
    "data-kp-graph2d-quadratic-horizontal-shift",
    "2"
  );
  await player.press("Home");
  await expect(curve).toHaveAttribute(
    "data-kp-graph2d-quadratic-horizontal-shift",
    "0"
  );
  await expect(curve).toHaveAttribute(
    "data-kp-browser-identity-probe",
    "retained-curve"
  );
});

function capture(
  id: string,
  label: string,
  progress: number,
  viewport: { readonly width: number; readonly height: number }
) {
  return { id, label, progress, viewport } as const;
}

async function waitForGraph2DPaint(
  page: import("@playwright/test").Page,
  progress: number
): Promise<void> {
  await page.waitForFunction(({ expectedId, expectedProgress, expectedAdapter }) => {
    const shell = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue]"
    );
    const player = shell?.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player]"
    );
    const slot = shell?.querySelector<HTMLElement>(
      '[data-kp-editor-animation-surface-slot="graph"]'
    );
    return shell?.dataset["kpAnimationCatalogueSelection"] === expectedId &&
      shell.dataset["kpAnimationCatalogueHostOutcome"] === "painted" &&
      player?.dataset["kpEditorAnimationHydrated"] === "true" &&
      Math.abs(Number(player.dataset["kpEditorAnimationProgress"]) -
        expectedProgress) < 0.001 &&
      slot?.dataset["kpEditorAnimationAdapterId"] === expectedAdapter &&
      slot.querySelector("[data-kp-graph2d-quadratic-curve]") !== null;
  }, {
    expectedId: animationId,
    expectedProgress: progress,
    expectedAdapter: adapterId
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
          id: "round.graph-2d-translation",
          sequence: 1,
          label: "Graph2D translation checkpoint",
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
