import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "../scripts/capture-visual-contact-sheet.ts";

const animationId = "animation.programming.typescript-free-shipping-refactor";
const outputRoot = path.resolve("tmp/codex/code-theme");
const wide = { width: 1440, height: 1000 } as const;
const phone = { width: 390, height: 844 } as const;
const captures = [
  capture("dark-fusion", "Dark · threshold rules converge", "dark", 0.42, wide),
  capture("light-orient", "Light · duplicated rule", "light", 0, wide),
  capture("light-focus", "Light · one idea, two copies", "light", 0.16, wide),
  capture("light-fusion", "Light · threshold rules converge", "light", 0.42, wide),
  capture("light-propagation", "Light · helper propagates", "light", 0.59, wide),
  capture("light-settled", "Light · one source of truth", "light", 1, wide),
  capture("light-phone", "Light · price caller · phone", "light", 0.68, phone)
] as const;

test("TypeScript light endpoint is explicit, legible, deterministic, and paint-only", async ({
  browser,
  baseURL
}) => {
  await mkdir(outputRoot, { recursive: true });
  const items: KpVisualContactSheetItem[] = [];
  const fusionSizes = new Map<string, { width: number; height: number }>();

  for (const entry of captures) {
    // Deliberately oppose OS preference: the URL and host are the authority.
    const context = await browser.newContext({
      viewport: entry.viewport,
      colorScheme: entry.theme === "light" ? "dark" : "light"
    });
    const page = await context.newPage();
    try {
      await mockReviewQuery(page);
      const url = new URL("/", baseURL);
      url.searchParams.set("artifact", animationId);
      url.searchParams.set("theme", entry.theme);
      if (entry.progress > 0) url.searchParams.set("playhead", String(entry.progress));
      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await waitForTypeScriptPaint(page, entry.progress);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise<void>((resolve) => requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve())
        ));
      });

      const catalogue = page.locator("[data-kp-animation-catalogue]");
      const player = page.locator("[data-kp-editor-animation-player]");
      const slot = page.locator(
        '[data-kp-editor-animation-surface-slot="programming"]'
      );
      const stage = page.locator("[data-kp-typescript-refactor-stage]");
      await expect(catalogue).toHaveAttribute(
        "data-kp-animation-catalogue-theme",
        entry.theme
      );
      await expect(slot).toHaveAttribute("data-kp-typescript-theme", entry.theme);
      await expect(stage).toHaveAttribute("data-kp-typescript-theme", entry.theme);
      await expect(stage).toHaveAttribute(
        "data-kp-typescript-paint-contract",
        "kp.typescript-refactor-paint-roles.v1"
      );
      await expect(stage.locator("canvas, svg")).toHaveCount(0);
      await expect(stage).toHaveCSS(
        "background-color",
        entry.theme === "light" ? "rgb(251, 250, 247)" : "rgb(13, 14, 28)"
      );
      await expect(slot).toHaveCSS(
        "background-color",
        entry.theme === "light" ? "rgb(251, 250, 247)" : "rgb(13, 14, 28)"
      );

      if (entry.theme === "light") {
        const contrasts = await stage.evaluate((node) => {
          const root = node as HTMLElement;
          const background = getComputedStyle(root).backgroundColor;
          const current = root.querySelector<HTMLElement>(
            '[data-kp-typescript-projection-current="true"]'
          );
          const luminance = (color: string): number => {
            const channels = color.match(/[\d.]+/gu)?.slice(0, 3)
              .map(Number) ?? [];
            if (channels.length !== 3) {
              throw new Error(`Cannot measure color ${color}.`);
            }
            const linear = channels.map((channel) => {
              const normalized = channel / 255;
              return normalized <= 0.04045
                ? normalized / 12.92
                : ((normalized + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * linear[0]! + 0.7152 * linear[1]! +
              0.0722 * linear[2]!;
          };
          const contrast = (foreground: string): number => {
            const foregroundLuminance = luminance(foreground);
            const backgroundLuminance = luminance(background);
            return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
              (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
          };
          const result: Record<string, number> = {};
          current?.querySelectorAll<HTMLElement>(
            "[data-kp-typescript-syntax-kind]"
          ).forEach((token) => {
            const kind = token.dataset["kpTypescriptSyntaxKind"] ?? "";
            result[kind] ??= contrast(getComputedStyle(token).color);
          });
          return result;
        });
        expect(Object.keys(contrasts).length).toBeGreaterThanOrEqual(8);
        for (const value of Object.values(contrasts)) {
          expect(value).toBeGreaterThanOrEqual(4.5);
        }
      }

      if (entry.id === "light-focus") {
        const focused = stage.locator('[data-kp-typescript-focus="true"]').first();
        await expect(focused).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
        expect(await focused.evaluate((node) => getComputedStyle(node).textShadow))
          .not.toBe("none");
      }
      if (entry.id === "light-fusion") {
        const transit = stage.locator('[data-kp-typescript-token-role="transit"]');
        await expect(transit).toHaveCount(6);
        expect(await transit.first().evaluate((node) =>
          getComputedStyle(node).textShadow)).not.toBe("none");
      }
      if (entry.id === "light-orient") {
        await player.focus();
        await expect(stage).toHaveCSS("outline-style", "solid");
        await expect(stage).toHaveCSS("outline-color", "rgb(0, 107, 182)");
      }

      const size = await stage.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });
      if (entry.progress === 0.42) fusionSizes.set(entry.theme, size);
      expect(await page.evaluate(() =>
        document.documentElement.scrollWidth <= window.innerWidth + 1
      )).toBe(true);

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

  expect(fusionSizes.get("light")).toEqual(fusionSizes.get("dark"));
  const html = buildKpVisualContactSheetHtml(items, {
    title: "Kinetic Press · TypeScript code themes",
    columns: 2,
    imageFit: "contain"
  });
  await writeFile(path.join(outputRoot, "index.html"), html, "utf8");
  await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify({
    schemaVersion: "kp.typescript-refactor-code-theme-checkpoint.v1",
    animationId,
    disposition: "Unreviewed",
    promotion: "blocked-on-human-visual-approval",
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

test("the toolbar toggles the complete TypeScript Catalogue at the current frame", async ({
  page,
  baseURL
}) => {
  await mockReviewQuery(page);
  const url = new URL("/", baseURL);
  url.searchParams.set("artifact", animationId);
  url.searchParams.set("theme", "dark");
  url.searchParams.set("playhead", "0.42");
  await page.goto(url.toString(), { waitUntil: "networkidle" });
  await waitForTypeScriptPaint(page, 0.42);

  const catalogue = page.locator("[data-kp-animation-catalogue]");
  const rail = page.locator(".kp-animation-catalogue-shell__rail");
  const search = page.getByRole("searchbox", { name: "Search artifacts" });
  const player = page.locator("[data-kp-editor-animation-player]");
  const slot = page.locator(
    '[data-kp-editor-animation-surface-slot="programming"]'
  );
  const stage = page.locator("[data-kp-typescript-refactor-stage]");
  const toolbar = page.getByRole("complementary", {
    name: "Development tools"
  });
  const themeToggle = toolbar.getByRole("button", { name: "Dark mode" });
  const initialGeometry = await stage.boundingBox();
  const initialProjection = await stage.getAttribute(
    "data-kp-typescript-active-projection"
  );

  await expect(themeToggle).toHaveAttribute("aria-pressed", "true");
  await expect(catalogue).toHaveCSS("background-color", "rgb(13, 14, 28)");
  await expect(rail).toHaveCSS("background-color", "rgb(13, 14, 28)");
  await expect(search).toHaveCSS("background-color", "rgb(17, 20, 36)");
  await expect(stage).toHaveCSS("background-color", "rgb(13, 14, 28)");

  await themeToggle.click();
  await expect(themeToggle).toHaveAttribute("aria-pressed", "false");
  await expect(catalogue).toHaveAttribute(
    "data-kp-animation-catalogue-theme",
    "light"
  );
  await expect(catalogue).toHaveCSS("background-color", "rgb(251, 250, 247)");
  await expect(rail).toHaveCSS("background-color", "rgb(245, 243, 238)");
  await expect(search).toHaveCSS("background-color", "rgb(255, 254, 250)");
  await expect(slot).toHaveAttribute("data-kp-typescript-theme", "light");
  await expect(stage).toHaveAttribute("data-kp-typescript-theme", "light");
  await expect(stage).toHaveCSS("background-color", "rgb(251, 250, 247)");
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0.42");
  await expect(stage).toHaveAttribute(
    "data-kp-typescript-active-projection",
    initialProjection ?? ""
  );
  expect(await stage.boundingBox()).toEqual(initialGeometry);
  expect(new URL(page.url()).searchParams.get("theme")).toBe("light");
  expect(new URL(page.url()).searchParams.get("playhead")).toBe("0.42");

  await themeToggle.click();
  await expect(themeToggle).toHaveAttribute("aria-pressed", "true");
  await expect(catalogue).toHaveAttribute(
    "data-kp-animation-catalogue-theme",
    "dark"
  );
  await expect(rail).toHaveCSS("background-color", "rgb(13, 14, 28)");
  await expect(search).toHaveCSS("background-color", "rgb(17, 20, 36)");
  await expect(slot).toHaveAttribute("data-kp-typescript-theme", "dark");
  await expect(stage).toHaveAttribute("data-kp-typescript-theme", "dark");
  await expect(stage).toHaveCSS("background-color", "rgb(13, 14, 28)");
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0.42");
  expect(await stage.boundingBox()).toEqual(initialGeometry);
  expect(new URL(page.url()).searchParams.get("theme")).toBe("dark");
  expect(new URL(page.url()).searchParams.get("playhead")).toBe("0.42");
});

function capture(
  id: string,
  label: string,
  theme: "dark" | "light",
  progress: number,
  viewport: { readonly width: number; readonly height: number }
) {
  return { id, label, theme, progress, viewport } as const;
}

async function waitForTypeScriptPaint(
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
      shell.querySelector("[data-kp-typescript-refactor-stage]") !== null;
  }, { animationId, progress });
}

async function mockReviewQuery(page: import("@playwright/test").Page): Promise<void> {
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
          id: "round.code-theme",
          sequence: 1,
          label: "Code theme checkpoint",
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
