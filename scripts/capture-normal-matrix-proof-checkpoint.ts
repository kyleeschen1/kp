import type { AddressInfo } from "node:net";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";
import { createServer } from "vite";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";
import {
  createKpVisualReviewHarness,
  type KpVisualReviewHarness
} from "./visual-review-harness.ts";

const outputRoot = path.resolve(
  "tmp/codex/normal-matrix-proof-checkpoint"
);
const defaultBaseUrl = "http://127.0.0.1:4194";
const articlePath = "/learn/math/normal-matrices/";
const reviewPath = "/learn/math/normal-matrices/review/";
const desktop = {
  viewport: { width: 1_280, height: 900 },
  colorScheme: "dark"
} as const;
const phone = {
  viewport: { width: 390, height: 844 },
  colorScheme: "dark"
} as const;

interface CaptureEvidence {
  readonly id: string;
  readonly label: string;
  readonly url: string;
  readonly timeMs: number;
  readonly checkpoint: string;
  readonly phase: string;
  readonly mode: "motion" | "static" | "review";
  readonly viewport: { readonly width: number; readonly height: number };
  readonly file: string;
}

/**
 * This packet is disposable review evidence. It deliberately drives only the
 * public URL and native seek event so capture code cannot become proof truth.
 */
export async function captureKpNormalMatrixProofCheckpoint() {
  await mkdir(outputRoot, { recursive: true });
  const harness = await createHarness();
  const items: KpVisualContactSheetItem[] = [];
  const evidence: CaptureEvidence[] = [];
  try {
    await harness.start();
    await captureMotion({
      harness,
      items,
      evidence,
      id: "desktop-article-statement",
      label: "Article · searchable theorem statement",
      url: articleUrl(harness.baseUrl, { checkpoint: "statement" }),
      expectedTimeMs: 0,
      expectedCheckpoint: "statement",
      profile: desktop,
      capture: "viewport"
    });
    await captureMotion({
      harness,
      items,
      evidence,
      id: "desktop-cycle-a-act",
      label: "Cycle A · row and column become one product entry",
      url: articleUrl(harness.baseUrl, {
        checkpoint: "row-column-norms"
      }),
      expectedTimeMs: 5_500,
      expectedCheckpoint: "row-column-norms",
      expectedPhase: "act",
      profile: desktop,
      capture: "stage"
    });
    await captureMotion({
      harness,
      items,
      evidence,
      id: "desktop-norm-equation-focus",
      label: "Direct re-entry · unmatched row remainder",
      url: articleUrl(harness.baseUrl, {
        checkpoint: "norm-equation",
        hash: "kp-ref:normal-proof/matrix/row-remainder"
      }),
      expectedTimeMs: 7_200,
      expectedCheckpoint: "norm-equation",
      expectedFocus: "normal-proof/matrix/row-remainder",
      profile: desktop,
      capture: "stage"
    });
    await captureMotion({
      harness,
      items,
      evidence,
      id: "desktop-cycle-b-act",
      label: "Cycle B · matched terms force the remainder to zero",
      url: articleUrl(harness.baseUrl, { checkpoint: "norm-equation" }),
      expectedTimeMs: 9_000,
      expectedCheckpoint: "norm-equation",
      expectedPhase: "act",
      profile: desktop,
      capture: "stage"
    });
    await captureMotion({
      harness,
      items,
      evidence,
      id: "desktop-recursion",
      label: "Endpoint · block diagonal form returns the proof to B",
      url: articleUrl(harness.baseUrl, { checkpoint: "recursion" }),
      expectedTimeMs: 12_000,
      expectedCheckpoint: "recursion",
      profile: desktop,
      capture: "stage"
    });
    await captureStatic({
      harness,
      items,
      evidence,
      id: "desktop-static-norm-equation",
      label: "Static comparison · same norm equation and semantic focus",
      url: articleUrl(harness.baseUrl, {
        checkpoint: "norm-equation",
        evidence: "static",
        hash: "kp-ref:normal-proof/matrix/row-remainder"
      }),
      expectedCheckpoint: "norm-equation",
      expectedFocus: "normal-proof/matrix/row-remainder",
      profile: desktop
    });
    await captureMotion({
      harness,
      items,
      evidence,
      id: "phone-recursion",
      label: "Phone · complete recursive endpoint at 390 px",
      url: articleUrl(harness.baseUrl, { checkpoint: "recursion" }),
      expectedTimeMs: 12_000,
      expectedCheckpoint: "recursion",
      profile: phone,
      capture: "stage"
    });
    await capturePrompt({ harness, items, evidence });

    const htmlSource = buildKpVisualContactSheetHtml(items, {
      title: "Kinetic Press · normal-matrix Proof Memory checkpoint",
      columns: 2,
      imageFit: "contain"
    });
    const html = path.join(outputRoot, "index.html");
    await writeFile(html, htmlSource, "utf8");
    const sheetPage = await harness.page({
      viewport: { width: 1_440, height: 1_000 }
    });
    await sheetPage.setContent(htmlSource, { waitUntil: "load" });
    const sheet = path.join(outputRoot, "contact-sheet.png");
    await sheetPage.screenshot({
      path: sheet,
      fullPage: true,
      animations: "disabled"
    });
    const manifest = path.join(outputRoot, "manifest.json");
    await writeFile(manifest, `${JSON.stringify({
      schemaVersion: "kp.normal-matrix-proof-checkpoint.v1",
      disposition: "Unreviewed",
      imagesAreDisposable: true,
      articlePath,
      reviewPath,
      captures: evidence,
      contactSheet: path.relative(process.cwd(), sheet),
      contactSheetHtml: path.relative(process.cwd(), html)
    }, null, 2)}\n`, "utf8");
    return { captures: evidence.length, html, manifest, sheet };
  } finally {
    await harness.close();
  }
}

async function captureMotion(input: {
  readonly harness: KpVisualReviewHarness;
  readonly items: KpVisualContactSheetItem[];
  readonly evidence: CaptureEvidence[];
  readonly id: string;
  readonly label: string;
  readonly url: URL;
  readonly expectedTimeMs: number;
  readonly expectedCheckpoint: string;
  readonly expectedPhase?: string;
  readonly expectedFocus?: string;
  readonly profile: typeof desktop | typeof phone;
  readonly capture: "stage" | "viewport";
}): Promise<void> {
  const page = await input.harness.page(input.profile);
  await page.goto(input.url.toString(), { waitUntil: "domcontentloaded" });
  const stage = page.locator("[data-kp-normal-proof-stage]");
  // Even the prose overview activates the real lazy boundary before capture;
  // the camera then returns to the theorem rather than fabricating readiness.
  await stage.scrollIntoViewIfNeeded();
  await page.locator("[data-kp-normal-proof-publication]").waitFor();
  await page.waitForFunction(() =>
    document.querySelector("[data-kp-normal-proof-publication]")
      ?.getAttribute("data-kp-normal-proof-capability") === "ready"
  );
  await stage.waitFor();
  if (input.expectedTimeMs !== Number(
    await stage.getAttribute("data-kp-normal-proof-time-ms")
  )) {
    await stage.evaluate((node, timeMs) => {
      node.dispatchEvent(new CustomEvent("kp:normal-proof-seek", {
        detail: { timeMs }
      }));
    }, input.expectedTimeMs);
  }
  await page.waitForFunction(({ timeMs, checkpoint, phase, focus }) => {
    const node = document.querySelector<HTMLElement>(
      "[data-kp-normal-proof-stage]"
    );
    return node?.dataset["kpNormalProofTimeMs"] === String(timeMs) &&
      node.dataset["kpNormalProofActiveCheckpoint"] === checkpoint &&
      (phase === undefined ||
        node.dataset["kpNormalProofAttentionPhase"] === phase) &&
      (focus === undefined ||
        node.dataset["kpNormalProofFocusAddress"] === focus);
  }, {
    timeMs: input.expectedTimeMs,
    checkpoint: input.expectedCheckpoint,
    phase: input.expectedPhase,
    focus: input.expectedFocus
  });
  await settle(page);
  if (input.capture === "viewport") {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await settle(page);
  }
  await assertNoOverflow(page, input.id);
  await recordCapture({
    page,
    target: input.capture === "stage" ? stage : undefined,
    items: input.items,
    evidence: input.evidence,
    id: input.id,
    label: input.label,
    url: input.url.toString(),
    timeMs: input.expectedTimeMs,
    checkpoint: input.expectedCheckpoint,
    phase: input.expectedPhase ?? "settled",
    mode: "motion",
    viewport: input.profile.viewport
  });
}

async function captureStatic(input: {
  readonly harness: KpVisualReviewHarness;
  readonly items: KpVisualContactSheetItem[];
  readonly evidence: CaptureEvidence[];
  readonly id: string;
  readonly label: string;
  readonly url: URL;
  readonly expectedCheckpoint: string;
  readonly expectedFocus: string;
  readonly profile: typeof desktop;
}): Promise<void> {
  const page = await input.harness.page(input.profile);
  await page.goto(input.url.toString(), { waitUntil: "domcontentloaded" });
  const stage = page.locator("[data-kp-normal-proof-stage]");
  await stage.scrollIntoViewIfNeeded();
  await page.locator("html[data-kp-normal-proof-evidence=\"static\"]").waitFor();
  await page.waitForFunction(({ checkpoint, focus }) => {
    const node = document.querySelector<HTMLElement>(
      "[data-kp-normal-proof-stage]"
    );
    return node?.dataset["kpNormalProofActiveCheckpoint"] === checkpoint &&
      node.dataset["kpNormalProofFocusAddress"] === focus &&
      !document.querySelector("[data-kp-normal-proof-session]");
  }, {
    checkpoint: input.expectedCheckpoint,
    focus: input.expectedFocus
  });
  await settle(page);
  await assertNoOverflow(page, input.id);
  await recordCapture({
    page,
    target: stage,
    items: input.items,
    evidence: input.evidence,
    id: input.id,
    label: input.label,
    url: input.url.toString(),
    timeMs: 7_200,
    checkpoint: input.expectedCheckpoint,
    phase: "settled",
    mode: "static",
    viewport: input.profile.viewport
  });
}

async function capturePrompt(input: {
  readonly harness: KpVisualReviewHarness;
  readonly items: KpVisualContactSheetItem[];
  readonly evidence: CaptureEvidence[];
}): Promise<void> {
  const page = await input.harness.page(desktop);
  const url = new URL(
    `${reviewPath}#review-predict-row-remainder`,
    input.harness.baseUrl
  );
  await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
  const prompt = page.locator(
    '[data-kp-normal-proof-prompt="predict-row-remainder"]'
  );
  await prompt.scrollIntoViewIfNeeded();
  await prompt.evaluate((node) => {
    (node as HTMLDetailsElement).open = true;
  });
  await settle(page);
  await assertNoOverflow(page, "review-predict-row-remainder");
  await recordCapture({
    page,
    target: prompt,
    items: input.items,
    evidence: input.evidence,
    id: "review-predict-row-remainder",
    label: "Prompt entry · predict r, reveal, then return to proof context",
    url: url.toString(),
    timeMs: 7_200,
    checkpoint: "norm-equation",
    phase: "rehearsal",
    mode: "review",
    viewport: desktop.viewport
  });
}

async function recordCapture(input: {
  readonly page: import("playwright").Page;
  readonly target?: import("playwright").Locator;
  readonly items: KpVisualContactSheetItem[];
  readonly evidence: CaptureEvidence[];
  readonly id: string;
  readonly label: string;
  readonly url: string;
  readonly timeMs: number;
  readonly checkpoint: string;
  readonly phase: string;
  readonly mode: CaptureEvidence["mode"];
  readonly viewport: CaptureEvidence["viewport"];
}): Promise<void> {
  const file = path.join(outputRoot, `${input.id}.png`);
  if (input.target === undefined) {
    await input.page.screenshot({
      path: file,
      fullPage: false,
      animations: "disabled"
    });
  } else {
    await input.target.screenshot({ path: file, animations: "disabled" });
  }
  const relativeFile = path.relative(process.cwd(), file);
  const image = await readFile(file);
  input.items.push({
    id: input.id,
    label: input.label,
    progress: input.timeMs,
    viewport: input.viewport,
    file: relativeFile,
    dataUrl: `data:image/png;base64,${image.toString("base64")}`
  });
  input.evidence.push({
    id: input.id,
    label: input.label,
    url: input.url,
    timeMs: input.timeMs,
    checkpoint: input.checkpoint,
    phase: input.phase,
    mode: input.mode,
    viewport: input.viewport,
    file: relativeFile
  });
}

function articleUrl(
  baseUrl: string,
  input: {
    readonly checkpoint: string;
    readonly evidence?: "static";
    readonly hash?: string;
  }
): URL {
  const url = new URL(articlePath, baseUrl);
  url.searchParams.set("checkpoint", input.checkpoint);
  if (input.evidence !== undefined) {
    url.searchParams.set("evidence", input.evidence);
  }
  if (input.hash !== undefined) url.hash = input.hash;
  return url;
}

async function createHarness(): Promise<KpVisualReviewHarness> {
  const requestedBaseUrl = process.env["KP_VISUAL_BASE_URL"] ?? defaultBaseUrl;
  if (await isReachable(new URL(articlePath, requestedBaseUrl))) {
    return createKpVisualReviewHarness({ baseUrl: requestedBaseUrl });
  }
  return createKpVisualReviewHarness({
    adapters: {
      startServer: async () => {
        const vite = await createServer({
          configFile: path.resolve("vite.public-normal-matrices.config.ts"),
          logLevel: "error"
        });
        await vite.listen();
        const address = vite.httpServer?.address();
        if (address === null || address === undefined ||
            typeof address === "string") {
          await vite.close();
          throw new Error("Normal-proof review server has no TCP address.");
        }
        const serverBaseUrl = addressUrl(address);
        return { baseUrl: serverBaseUrl, close: () => vite.close() };
      },
      launchBrowser: () => chromium.launch({ headless: true })
    }
  });
}

function addressUrl(address: AddressInfo): string {
  const host = address.address === "::" ? "127.0.0.1" : address.address;
  return `http://${host}:${address.port}`;
}

async function isReachable(url: URL): Promise<boolean> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(1_000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function settle(page: import("playwright").Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  ));
}

async function assertNoOverflow(
  page: import("playwright").Page,
  id: string
): Promise<void> {
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - window.innerWidth
  );
  if (overflow > 1) {
    throw new Error(`${id} overflowed its viewport by ${overflow}px.`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const result = await captureKpNormalMatrixProofCheckpoint();
  console.log(JSON.stringify({
    captures: result.captures,
    html: path.relative(process.cwd(), result.html),
    manifest: path.relative(process.cwd(), result.manifest),
    sheet: path.relative(process.cwd(), result.sheet)
  }, null, 2));
}
