import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  KP_CROSS_DOMAIN_GALLERY_COLLECTION
} from "../src/editor/cross-domain-gallery-collection.ts";
import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "../scripts/capture-visual-contact-sheet.ts";

const outputRoot = path.resolve("tmp/codex/cross-domain-gallery");
const wide = { width: 1440, height: 1000 } as const;
const phone = { width: 390, height: 844 } as const;
const executableCases = KP_CROSS_DOMAIN_GALLERY_COLLECTION.cases.filter(
  (entry) => entry.status === "executable"
);
const captures = [
  capture(executableCases[0]!, 0.52, wide),
  capture(executableCases[1]!, 0.5, wide),
  capture(executableCases[2]!, 0.5, wide),
  capture(executableCases[3]!, 0.5, wide),
  capture(executableCases[0]!, 0.52, phone, true)
] as const;

test("the gallery toggle presents four governed artifacts and one typed gap", async ({
  browser,
  baseURL
}) => {
  await mkdir(outputRoot, { recursive: true });
  const items: KpVisualContactSheetItem[] = [];

  for (const entry of captures) {
    const context = await browser.newContext({ viewport: entry.viewport });
    const page = await context.newPage();
    try {
      await mockReviewQuery(page);
      const url = new URL("/", baseURL);
      url.searchParams.set("artifact", entry.galleryCase.animationId);
      url.searchParams.set("playhead", String(entry.progress));
      url.searchParams.set("theme", "light");
      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await waitForPaint(page, entry.galleryCase.animationId, entry.progress);
      await page.evaluate(async () => document.fonts.ready);

      const catalogue = page.locator("[data-kp-animation-catalogue]");
      const collection = catalogue.locator(
        "[data-kp-cross-domain-gallery-collection]"
      );
      const disclosure = catalogue.locator(
        "[data-kp-cross-domain-gallery-disclosure]"
      );
      const player = catalogue.locator("[data-kp-editor-animation-player]");
      await player.evaluate((element) => {
        element.setAttribute("data-kp-gallery-toggle-identity", "retained");
      });
      if (entry.openRail) {
        await catalogue.getByRole("button", { name: "Artifacts" }).click();
        await expect(catalogue.locator(
          'aside[aria-label="Artifact catalogue"]'
        )).toBeVisible();
      }
      await expect(collection).toBeVisible();
      await expect(collection).not.toHaveAttribute("open", "");
      await expect(catalogue).toHaveAttribute(
        "data-kp-cross-domain-gallery-open",
        "false"
      );
      await expect(disclosure).toHaveCount(0);
      if (entry === captures[0]) {
        const imageFile = path.join(outputRoot, "catalogue-default.png");
        const image = await catalogue.screenshot({
          path: imageFile,
          animations: "disabled"
        });
        items.push({
          id: "catalogue-default",
          label: "Catalogue default · gallery closed",
          progress: entry.progress,
          viewport: entry.viewport,
          file: path.relative(process.cwd(), imageFile),
          dataUrl: `data:image/png;base64,${image.toString("base64")}`
        });
      }
      await collection.locator("summary").click();
      await expect(collection).toHaveAttribute("open", "");
      await expect(catalogue).toHaveAttribute(
        "data-kp-cross-domain-gallery-open",
        "true"
      );
      await expect(player).toHaveAttribute(
        "data-kp-gallery-toggle-identity",
        "retained"
      );
      await expect(collection.locator(
        '[data-kp-cross-domain-gallery-status="executable"]'
      )).toHaveCount(4);
      await expect(collection.locator(
        '[data-kp-cross-domain-gallery-status="repair-required"]'
      )).toHaveCount(1);
      await expect(collection).toContainText("intentionally refused");
      await expect(disclosure).toHaveAttribute(
        "data-kp-cross-domain-gallery-disclosure",
        entry.galleryCase.caseId
      );
      await expect(disclosure).toHaveAttribute(
        "data-kp-cross-domain-gallery-frontend",
        entry.galleryCase.frontendId
      );
      await expect(disclosure).toContainText(entry.galleryCase.teachingIntent);
      await expect(disclosure.locator("a")).toHaveAttribute(
        "href",
        entry.galleryCase.href
      );

      const imageFile = path.join(outputRoot, `${entry.id}.png`);
      const image = await catalogue.screenshot({
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

  const html = buildKpVisualContactSheetHtml(items, {
    title: "Kinetic Press · governed cross-domain gallery",
    columns: 2,
    imageFit: "contain"
  });
  await writeFile(path.join(outputRoot, "index.html"), html, "utf8");
  await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify({
    schemaVersion: "kp.cross-domain-gallery-checkpoint.v1",
    collectionId: KP_CROSS_DOMAIN_GALLERY_COLLECTION.id,
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

test("collection links select in place while the typed gap remains non-executable", async ({
  page
}) => {
  await mockReviewQuery(page);
  const first = executableCases[0]!;
  const graph2D = executableCases[2]!;
  const documentRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") {
      documentRequests.push(request.url());
    }
  });
  await page.goto(`${first.href}&theme=light`);
  await waitForPaint(page, first.animationId, 0);
  const catalogue = page.locator("[data-kp-animation-catalogue]");
  const collection = catalogue.locator(
    "[data-kp-cross-domain-gallery-collection]"
  );
  const disclosure = catalogue.locator(
    "[data-kp-cross-domain-gallery-disclosure]"
  );
  const player = catalogue.locator("[data-kp-editor-animation-player]");
  await expect(collection).not.toHaveAttribute("open", "");
  await expect(disclosure).toHaveCount(0);
  await player.evaluate((element) => {
    element.setAttribute("data-kp-gallery-toggle-identity", "retained");
  });
  await collection.locator("summary").click();
  await expect(player).toHaveAttribute(
    "data-kp-gallery-toggle-identity",
    "retained"
  );
  await collection.locator(
    `[data-kp-cross-domain-gallery-case="${graph2D.caseId}"] a`
  ).click();
  await waitForPaint(page, graph2D.animationId, 0);
  await expect(catalogue).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    graph2D.animationId
  );
  expect(documentRequests).toHaveLength(1);
  await expect(collection).toHaveAttribute("open", "");
  await expect(disclosure).toHaveAttribute(
    "data-kp-cross-domain-gallery-disclosure",
    graph2D.caseId
  );
  await expect(catalogue.locator(
    '[data-kp-cross-domain-gallery-status="repair-required"] a'
  )).toHaveCount(0);
  await expect(catalogue.locator(
    "[data-kp-animation-catalogue-review-dock]"
  )).toHaveCount(1);
  await collection.locator("summary").click();
  await expect(collection).not.toHaveAttribute("open", "");
  await expect(disclosure).toHaveCount(0);
});

function capture(
  galleryCase: (typeof executableCases)[number],
  progress: number,
  viewport: { readonly width: number; readonly height: number },
  openRail = false
) {
  return {
    id: `${galleryCase.domainLabel.toLocaleLowerCase()}${openRail
      ? "-phone"
      : ""}`,
    label: `${galleryCase.domainLabel} · ${galleryCase.title}`,
    galleryCase,
    progress,
    viewport,
    openRail
  } as const;
}

async function waitForPaint(
  page: import("@playwright/test").Page,
  animationId: string,
  progress: number
): Promise<void> {
  await page.waitForFunction(({ expectedId, expectedProgress }) => {
    const catalogue = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue]"
    );
    const player = catalogue?.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player]"
    );
    return catalogue?.dataset["kpAnimationCatalogueSelection"] === expectedId &&
      catalogue.dataset["kpAnimationCatalogueHostOutcome"] === "painted" &&
      player?.dataset["kpEditorAnimationHydrated"] === "true" &&
      Math.abs(Number(player.dataset["kpEditorAnimationProgress"]) -
        expectedProgress) < 0.001;
  }, { expectedId: animationId, expectedProgress: progress });
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
          id: "round.cross-domain-gallery",
          sequence: 1,
          label: "Cross-domain gallery checkpoint",
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
