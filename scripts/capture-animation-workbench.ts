import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium, type Page } from "playwright";

const baseUrl =
  process.env["KP_VISUAL_BASE_URL"] ?? "http://127.0.0.1:8000";
const outputRoot = path.resolve(
  process.env["KP_VISUAL_OUTPUT"] ??
    "tmp/codex/animation-workbench-checkpoint"
);
const profiles = [
  { id: "wide", viewport: { width: 1440, height: 1000 } },
  { id: "narrow", viewport: { width: 390, height: 844 } }
] as const;
const exemplars = [
  {
    id: "radical",
    animationId: "animation.generated.radical.square-root-as-power",
    query: "radical",
    progress: 0.5,
    expectedPlayerCount: 1
  },
  {
    id: "derivative",
    animationId: "animation.derivative-rules.tangent-graph",
    query: "tangent",
    progress: 0.5,
    expectedPlayerCount: 1
  },
  {
    id: "quadratic-planned",
    animationId: "animation.algebra.quadratic.solution-branching",
    query: "solution branching",
    progress: 0,
    expectedPlayerCount: 0
  }
] as const;

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const captures: {
  id: string;
  file: string;
  animationId: string;
  profile: string;
  viewport: { width: number; height: number };
  playerCount: number;
  lifecycleFacetCount: number;
  representationCount: number;
  reviewState: string;
  reviewCaptureCount: number;
  reviewCapturePlacement: string;
  horizontalOverflowPx: number;
}[] = [];

try {
  for (const exemplar of exemplars) {
    for (const profile of profiles) {
      const page = await browser.newPage({ viewport: profile.viewport });
      try {
        const url = new URL("/", baseUrl);
        url.searchParams.set("view", "animation-workbench");
        url.searchParams.set("q", exemplar.query);
        url.searchParams.set(
          "workbenchAnimation",
          exemplar.animationId
        );
        await page.goto(url.toString(), { waitUntil: "networkidle" });
        await page.evaluate(async () => document.fonts.ready);
        await page
          .locator(
            `[data-kp-animation-workbench-selection="${exemplar.animationId}"]`
          )
          .waitFor();
        await settleReview(page);
        await page.waitForFunction(
          () => document.body.dataset["kpDevReviewReady"] === "true"
        );
        const reviewCapture = page.locator(
          "[data-kp-dev-review-shell]"
        );
        const reviewCaptureCount = await reviewCapture.count();
        if (reviewCaptureCount !== 1) {
          throw new Error(
            `${exemplar.animationId} expected one review capture control, received ${reviewCaptureCount}.`
          );
        }

        const players = page.locator("[data-kp-editor-animation-player]");
        const playerCount = await players.count();
        if (playerCount !== exemplar.expectedPlayerCount) {
          throw new Error(
            `${exemplar.animationId} expected ${exemplar.expectedPlayerCount} player(s), received ${playerCount}.`
          );
        }
        if (playerCount === 1) {
          await players.first().waitFor();
          await page.waitForFunction(() =>
            document.querySelector<HTMLElement>(
              "[data-kp-editor-animation-player]"
            )?.dataset["kpEditorAnimationHydrated"] === "true"
          );
          await players
            .first()
            .locator('[data-action="seek-editor-animation"]')
            .fill(String(exemplar.progress));
          await settleFrames(page);
        }

        const horizontalOverflowPx = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth
        );
        if (horizontalOverflowPx > 1) {
          throw new Error(
            `${exemplar.animationId} ${profile.id} overflows horizontally by ${horizontalOverflowPx}px.`
          );
        }
        const id = `${exemplar.id}-${profile.id}`;
        const file = path.join(outputRoot, `${id}.png`);
        await page.screenshot({
          path: file,
          fullPage: true,
          animations: "disabled"
        });
        captures.push({
          id,
          file: path.relative(process.cwd(), file),
          animationId: exemplar.animationId,
          profile: profile.id,
          viewport: profile.viewport,
          playerCount,
          lifecycleFacetCount: await page
            .locator("[data-kp-animation-workbench-lifecycle-facet]")
            .count(),
          representationCount: await page
            .locator("[data-kp-representation-id]")
            .count(),
          reviewState:
            (await page
              .locator("[data-kp-animation-workbench-review]")
              .getAttribute("data-review-state")) ?? "missing",
          reviewCaptureCount,
          reviewCapturePlacement:
            (await reviewCapture.getAttribute(
              "data-kp-dev-review-placement"
            )) ?? "missing",
          horizontalOverflowPx
        });
      } finally {
        await page.close();
      }
    }
  }

  const contactSheet = await renderContactSheet(captures);
  const manifest = path.join(outputRoot, "manifest.json");
  await writeFile(
    manifest,
    `${JSON.stringify(
      {
        schemaVersion: "kp.animation-workbench-checkpoint.v1",
        baseUrl,
        captures,
        contactSheet: path.relative(process.cwd(), contactSheet)
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  console.log(
    JSON.stringify(
      {
        outputRoot: path.relative(process.cwd(), outputRoot),
        captures: captures.length,
        contactSheet: path.relative(process.cwd(), contactSheet),
        reviewStates: [...new Set(captures.map(({ reviewState }) => reviewState))]
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}

async function settleReview(page: Page): Promise<void> {
  await page
    .waitForFunction(() => {
      const state = document.querySelector<HTMLElement>(
        "[data-kp-animation-workbench-review]"
      )?.dataset["reviewState"];
      return state !== undefined && state !== "loading";
    }, undefined, { timeout: 5_000 })
    .catch(() => undefined);
}

async function settleFrames(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve())
        )
      )
  );
}

async function renderContactSheet(
  items: readonly (typeof captures)[number][]
): Promise<string> {
  const cards = await Promise.all(
    items.map(async (item) => {
      const image = await readFile(path.resolve(item.file));
      return `<figure>
        <img src="data:image/png;base64,${image.toString("base64")}" alt="${escapeHtml(item.id)}">
        <figcaption><strong>${escapeHtml(item.id)}</strong><code>${escapeHtml(item.animationId)}</code><span>${item.viewport.width}×${item.viewport.height} · ${item.playerCount} player · ${item.representationCount} representations · review ${escapeHtml(item.reviewState)} · capture ${escapeHtml(item.reviewCapturePlacement)}</span></figcaption>
      </figure>`;
    })
  );
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 }
  });
  try {
    await page.setContent(`<!doctype html>
      <html><head><meta charset="utf-8"><style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 32px; background: #f4f1ea; color: #17211d; font-family: ui-sans-serif, system-ui, sans-serif; }
        header { margin-bottom: 24px; }
        h1 { margin: 0 0 6px; font-size: 30px; }
        header p { margin: 0; color: #5e6a64; }
        main { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
        figure { margin: 0; overflow: hidden; border: 1px solid #cfc9bd; border-radius: 12px; background: white; }
        img { display: block; width: 100%; height: 620px; object-fit: contain; object-position: top center; background: #f6f3eb; }
        figcaption { display: grid; gap: 5px; padding: 13px 15px; border-top: 1px solid #e2ddd3; }
        figcaption code, figcaption span { color: #647069; font-size: 11px; overflow-wrap: anywhere; }
      </style></head><body>
        <header><h1>Semantic Animation Workbench</h1><p>Control-plane checkpoint · radical, derivative, and planned quadratic · wide and narrow</p></header>
        <main>${cards.join("")}</main>
      </body></html>`);
    const file = path.join(outputRoot, "contact-sheet.png");
    await page.screenshot({
      path: file,
      fullPage: true,
      animations: "disabled"
    });
    return file;
  } finally {
    await page.close();
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
