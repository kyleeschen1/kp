import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "../scripts/capture-visual-contact-sheet.ts";
import {
  kpPythonRefactorDarkOpticalEndpoint,
  kpPythonRefactorLightOpticalEndpoint
} from "../src/rendering/python-refactor-optical-theme.ts";
import { kpPythonRefactorPaintRoleContract } from
  "../src/rendering/python-refactor-paint-role-contract.ts";
import {
  kpTypeScriptRefactorDarkOpticalEndpoint,
  kpTypeScriptRefactorLightOpticalEndpoint
} from "../src/rendering/typescript-refactor-optical-theme.ts";
import { kpTypeScriptRefactorPaintRoleContract } from
  "../src/rendering/typescript-refactor-paint-role-contract.ts";

const outputRoot = path.resolve("tmp/codex/cross-language-code-theme");
const viewport = { width: 1440, height: 1000 } as const;
const captures = [
  capture("typescript-dark-fusion", "TypeScript · dark · convergence",
    "typescript", "dark", 0.42),
  capture("python-dark-fusion", "Python · dark · convergence",
    "python", "dark", 0.42),
  capture("typescript-light-fusion", "TypeScript · light · convergence",
    "typescript", "light", 0.42),
  capture("python-light-fusion", "Python · light · convergence",
    "python", "light", 0.42),
  capture("typescript-light-settled", "TypeScript · light · settled",
    "typescript", "light", 1),
  capture("python-light-settled", "Python · light · settled",
    "python", "light", 1)
] as const;

test("TypeScript and Python expose one reviewable optical boundary", async ({
  browser,
  baseURL,
  browserName
}) => {
  const emitReviewArtifacts = browserName === "chromium";
  if (emitReviewArtifacts) await mkdir(outputRoot, { recursive: true });
  const comparison = compareLocalContracts();
  expect(comparison.families).toBe("exact-match");
  expect(comparison.typescriptOnlyRoles).toEqual(["syntax.property"]);
  expect(comparison.pythonOnlyRoles).toEqual([]);
  expect(comparison.darkEndpointDifferences).toEqual([]);
  expect(comparison.lightEndpointDifferences).toEqual([]);

  const items: KpVisualContactSheetItem[] = [];
  const geometry = new Map<string, { width: number; height: number }>();
  for (const entry of captures) {
    // URL theme authority deliberately opposes the simulated OS preference.
    const context = await browser.newContext({
      viewport,
      colorScheme: entry.theme === "light" ? "dark" : "light"
    });
    const page = await context.newPage();
    try {
      await mockReviewQuery(page);
      const url = new URL("/", baseURL);
      url.searchParams.set("artifact", artifactId(entry.language));
      url.searchParams.set("theme", entry.theme);
      url.searchParams.set("playhead", String(entry.progress));
      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await waitForPaint(page, entry.language, entry.progress);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise<void>((resolve) => requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve())
        ));
      });

      const stage = page.locator(stageSelector(entry.language));
      await expect(stage).toHaveAttribute(
        themeAttribute(entry.language),
        entry.theme
      );
      await expect(stage).toHaveAttribute(
        contractAttribute(entry.language),
        contractId(entry.language)
      );
      await expect(stage).toHaveAttribute(
        "data-kp-code-optical-profile",
        "kp.code-source-dom-optical-profile.v1"
      );
      await expect(stage.locator("canvas, svg")).toHaveCount(0);
      await expect(stage).toHaveCSS(
        "background-color",
        entry.theme === "light" ? "rgb(251, 250, 247)" : "rgb(13, 14, 28)"
      );

      const box = await stage.boundingBox();
      expect(box).not.toBeNull();
      geometry.set(`${entry.language}.${entry.theme}`, {
        width: box!.width,
        height: box!.height
      });
      if (emitReviewArtifacts) {
        const imageFile = path.join(outputRoot, `${entry.id}.png`);
        const image = await stage.screenshot({
          path: imageFile,
          animations: "disabled"
        });
        items.push({
          id: entry.id,
          label: entry.label,
          progress: entry.progress,
          viewport,
          file: path.relative(process.cwd(), imageFile),
          dataUrl: `data:image/png;base64,${image.toString("base64")}`
        });
      }
    } finally {
      await context.close();
    }
  }

  expect(geometry.get("typescript.light")).toEqual(
    geometry.get("typescript.dark")
  );
  expect(geometry.get("python.light")).toEqual(geometry.get("python.dark"));

  if (!emitReviewArtifacts) return;
  const html = buildKpVisualContactSheetHtml(items, {
    title: "Kinetic Press · cross-language code themes",
    columns: 2,
    imageFit: "contain"
  });
  await writeFile(path.join(outputRoot, "index.html"), html, "utf8");
  await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify({
    schemaVersion: "kp.cross-language-code-theme-checkpoint.v1",
    disposition: "Approved",
    canonicalReference: "animation.programming.typescript-free-shipping-refactor",
    pressureCaller: "animation.programming.python-free-shipping-refactor",
    promotion: "promoted-kp.code-source-dom-optical-profile.v1",
    comparison,
    captures: items.map(({ dataUrl: _dataUrl, ...item }) => item)
  }, null, 2)}\n`, "utf8");

  const sheetContext = await browser.newContext({ viewport });
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

function compareLocalContracts() {
  const typescriptRoles = kpTypeScriptRefactorPaintRoleContract.slots
    .map(({ id }) => id);
  const pythonRoles = kpPythonRefactorPaintRoleContract.slots.map(({ id }) => id);
  return {
    families: arraysEqual(
      kpTypeScriptRefactorPaintRoleContract.families,
      kpPythonRefactorPaintRoleContract.families
    ) ? "exact-match" : "different",
    commonRoleCount: typescriptRoles.filter((role) =>
      pythonRoles.includes(role)).length,
    typescriptOnlyRoles: typescriptRoles.filter((role) =>
      !pythonRoles.includes(role)),
    pythonOnlyRoles: pythonRoles.filter((role) =>
      !typescriptRoles.includes(role)),
    darkEndpointDifferences: compareEndpoints(
      kpTypeScriptRefactorDarkOpticalEndpoint.properties,
      kpPythonRefactorDarkOpticalEndpoint.properties,
      pythonRoles
    ),
    lightEndpointDifferences: compareEndpoints(
      kpTypeScriptRefactorLightOpticalEndpoint.properties,
      kpPythonRefactorLightOpticalEndpoint.properties,
      pythonRoles
    )
  } as const;
}

function compareEndpoints(
  typescript: Readonly<Record<string, string>>,
  python: Readonly<Record<string, string>>,
  commonRoles: readonly string[]
): string[] {
  return commonRoles.filter((role) => normalizeValue(
    typescript[`--kp-typescript-paint-${role.replaceAll(".", "-")}`] ?? ""
  ) !== normalizeValue(
    python[`--kp-python-paint-${role.replaceAll(".", "-")}`] ?? ""
  ));
}

function normalizeValue(value: string): string {
  return value.replaceAll(
    /--kp-(?:typescript|python)-focus-shadow-alpha/gu,
    "--kp-code-focus-shadow-alpha"
  );
}

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) =>
    value === right[index]);
}

function capture(
  id: string,
  label: string,
  language: "typescript" | "python",
  theme: "dark" | "light",
  progress: number
) {
  return { id, label, language, theme, progress } as const;
}

function artifactId(language: "typescript" | "python"): string {
  return language === "typescript"
    ? "animation.programming.typescript-free-shipping-refactor"
    : "animation.programming.python-free-shipping-refactor";
}

function stageSelector(language: "typescript" | "python"): string {
  return language === "typescript"
    ? "[data-kp-typescript-refactor-stage]"
    : "[data-kp-python-refactor-stage]";
}

function themeAttribute(language: "typescript" | "python"): string {
  return language === "typescript"
    ? "data-kp-typescript-theme"
    : "data-kp-python-theme";
}

function contractAttribute(language: "typescript" | "python"): string {
  return language === "typescript"
    ? "data-kp-typescript-paint-contract"
    : "data-kp-python-paint-contract";
}

function contractId(language: "typescript" | "python"): string {
  return language === "typescript"
    ? kpTypeScriptRefactorPaintRoleContract.id
    : kpPythonRefactorPaintRoleContract.id;
}

async function waitForPaint(
  page: import("@playwright/test").Page,
  language: "typescript" | "python",
  progress: number
): Promise<void> {
  await page.waitForFunction((input) => {
    const shell = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue]"
    );
    const player = shell?.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player]"
    );
    return shell?.dataset["kpAnimationCatalogueSelection"] === input.animationId &&
      shell.dataset["kpAnimationCatalogueHostOutcome"] === "painted" &&
      player?.dataset["kpEditorAnimationHydrated"] === "true" &&
      Math.abs(Number(player.dataset["kpEditorAnimationProgress"]) -
        input.progress) < 0.001 &&
      shell.querySelector(input.selector) !== null;
  }, {
    animationId: artifactId(language),
    progress,
    selector: stageSelector(language)
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
          id: "round.cross-language-code-theme",
          sequence: 1,
          label: "Cross-language code theme checkpoint",
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
