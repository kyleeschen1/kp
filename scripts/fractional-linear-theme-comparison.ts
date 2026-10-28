import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { Page } from "playwright";

// A diagnostic-only override is loaded before enhancement. Changing the theme
// after material capture would compare stale clones rather than the palettes.
const paperCss = `
body[data-kp-reader-palette="nocturne"] {
  color-scheme: light;
  --kp-tutorial-background: #f7f5ee;
  --kp-tutorial-foreground: #222936;
  --kp-tutorial-text-secondary: #465463;
  --kp-tutorial-text-muted: #78818b;
  --kp-tutorial-card: #fffefa;
  --kp-tutorial-card-raised: #efebe1;
  --kp-tutorial-border: #d8d7cf;
  --kp-tutorial-gold: #876000;
  --kp-tutorial-blue: #305db2;
}
html:has(> body[data-kp-reader-palette="nocturne"]) {
  background: #f7f5ee; color-scheme: light;
}`;

export async function compareFractionalReaderThemes(page: Page, baseUrl: string, outputRoot: string) {
  let theme: "nocturne" | "paper" = "nocturne";
  // Vite inlines CSS @imports into the linked page sheet.
  const routePattern = "**/src/reader/app/exemplar.css*";
  await page.route(routePattern, async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response,
      body: `${await response.text()}${theme === "paper" ? paperCss : ""}` });
  });
  const samples: (Awaited<ReturnType<typeof inspectPaint>> & {
    readonly theme: "nocturne" | "paper";
    readonly progress: number;
  })[] = [];
  try {
    for (theme of ["nocturne", "paper"] as const) {
      for (const progress of [417, 470, 750, 780, 790, 800, 833, 875, 917, 950, 960, 965, 970, 975, 980, 990, 1000]) {
        const url = new URL("/reader/solve-fractional-linear/", baseUrl);
        url.searchParams.set("kpLesson", "lesson.solve-x.fractional-linear");
        url.searchParams.set("kpVersion", "1");
        url.searchParams.set("kpProgress", String(progress));
        await page.goto(url.toString(), { waitUntil: "networkidle" });
        await page.waitForFunction((requested) =>
          Number(document.body.dataset["kpReaderProgress"]) === requested, progress);
        await page.evaluate(async () => {
          await document.fonts.ready;
          await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        });
        const sample = await inspectPaint(page);
        assertEvaluationPaint(sample);
        const expectedBackground = theme === "paper" ? "rgb(247, 245, 238)" : "rgb(18, 24, 38)";
        if (sample.background !== expectedBackground) {
          throw new Error(`Expected ${theme} background ${expectedBackground}, received ${sample.background}`);
        }
        samples.push({ theme, progress, ...sample });
        await page.locator("[data-kp-reader-equation-stage]").screenshot({
          path: path.join(outputRoot, `${theme}-${progress}.png`)
        });
      }
    }
  } finally {
    await page.unroute(routePattern);
  }
  const differences = samples.filter((sample) => sample.theme === "nocturne").flatMap((dark) => {
    const light = samples.find((sample) => sample.theme === "paper" && sample.progress === dark.progress)!;
    const paintSignature = (sample: typeof dark) => sample.glyphs.map(({ color: _color, ...glyph }) => glyph);
    return JSON.stringify(paintSignature(dark)) === JSON.stringify(paintSignature(light))
      ? [] : [{ progress: dark.progress, reason: "Non-color paint or geometry differs between themes" }];
  });
  const reportPath = path.join(outputRoot, "theme-comparison.json");
  await writeFile(reportPath, `${JSON.stringify({ samples, differences }, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ report: reportPath, samples: samples.length, differences }, null, 2)}\n`);
  if (differences.length > 0) {
    throw new Error("Theme comparison changed non-color paint or geometry; inspect the paired samples.");
  }
}

export async function assertFractionalEvaluationPaint(page: Page): Promise<void> {
  assertEvaluationPaint(await inspectPaint(page));
}

function assertEvaluationPaint(sample: Awaited<ReturnType<typeof inspectPaint>>) {
  if (!sample.transitionId.includes(".simplify-right-")) return;
  if (sample.executedProgram !== "kp.executable-program.operation-evaluation" ||
      sample.presentationMode !== "verified-motion" || sample.legacyFragments !== 0) {
    throw new Error(`${sample.transitionId} bypassed the registered evaluation compositor`);
  }
  // The registered evaluation keeps opaque carriers and retires their geometry.
  // A translucent source/result crossfade is the regression, not brief contact.
  for (const glyph of sample.glyphs) {
    if (glyph.opacity > 0 && glyph.opacity < 1) {
      throw new Error(`${sample.transitionId} paints translucent ${glyph.role} ${glyph.text}`);
    }
  }
}

export async function inspectPaint(page: Page) {
  return page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>("[data-kp-reader-equation-stage]")!;
    const roots = stage.querySelectorAll<HTMLElement>([
      "[data-kp-reader-equation-material-fragment-id]",
      "[data-kp-equation-material-owner-id]",
      "[data-kp-reader-equation-anchor-id]"
    ].join(","));
    const glyphs = [...roots].flatMap((root) => {
      const id = root.dataset["kpReaderEquationMaterialFragmentId"] ??
        root.dataset["kpEquationMaterialOwnerId"] ?? root.dataset["kpReaderEquationAnchorId"]!;
      const role = root.hasAttribute("data-kp-reader-equation-anchor-id") ? "native" : "material";
      return [root, ...root.querySelectorAll<HTMLElement>("span")]
        .filter((node) => node.childElementCount === 0 && /[^\s\u200b]/.test(node.textContent ?? ""))
        .map((node) => {
          const style = getComputedStyle(node);
          let opacity = 1;
          const filters: string[] = [];
          for (let ancestor: HTMLElement | null = node; ancestor !== null; ancestor = ancestor.parentElement) {
            const inherited = getComputedStyle(ancestor);
            opacity *= inherited.display === "none" ? 0 : Number(inherited.opacity);
            if (inherited.filter !== "none") filters.push(inherited.filter);
          }
          if (style.visibility !== "visible") opacity = 0;
          const rect = node.getBoundingClientRect();
          const transition = node.closest<HTMLElement>("[data-kp-reader-transition]");
          return { id, role, text: node.textContent, opacity,
            transitionId: transition?.dataset["kpReaderTransition"] ?? null,
            transitionActive: transition?.dataset["kpReaderTransitionActive"] ?? null,
            color: style.color, font: style.fontFamily, weight: style.fontWeight,
            size: style.fontSize, stroke: style.getPropertyValue("-webkit-text-stroke-width"),
            shadow: style.textShadow, filters,
            x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        });
    });
    return {
      transitionId: document.body.dataset["kpReaderTransition"] ?? "",
      executedProgram: stage.querySelector<HTMLElement>("[data-kp-executed-motif-program-id]")
        ?.dataset["kpExecutedMotifProgramId"] ?? null,
      presentationMode: stage.querySelector<HTMLElement>("[data-kp-reader-canonical-equation-presentation-mode]")
        ?.dataset["kpReaderCanonicalEquationPresentationMode"] ?? null,
      legacyFragments: stage.querySelectorAll("[data-kp-reader-equation-material-fragment-id]").length,
      background: getComputedStyle(document.body).backgroundColor,
      surface: getComputedStyle(stage).backgroundColor, glyphs };
  });
}
