import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Locator, Page } from "playwright";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";
import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const animations = Object.freeze([
  {
    id: "animation.operation-evaluation.two-times-one-carrier",
    slug: "two-times-one",
    label: "canonical · 2 × 1 → 2",
    stationaryContextCount: 0
  },
  {
    id: "animation.generated.add-zero",
    slug: "add-zero",
    label: "second caller · x + 0 = 4 → x = 4",
    stationaryContextCount: 2
  }
] as const);
const outputRoot = path.resolve(
  "tmp/codex/carrier-preserving-simplification-checkpoint"
);
const normalSamples = Object.freeze([
  { id: "forward-0", label: "forward 0%", progress: 0 },
  { id: "forward-20", label: "forward 20%", progress: 0.2 },
  { id: "forward-30", label: "forward 30%", progress: 0.3 },
  { id: "forward-40", label: "forward 40%", progress: 0.4 },
  { id: "forward-65", label: "forward 65%", progress: 0.65 },
  { id: "forward-90", label: "forward 90%", progress: 0.9 },
  { id: "forward-100", label: "forward 100%", progress: 1 },
  { id: "rewind-40", label: "rewind to 40%", progress: 0.4 },
  { id: "rewind-0", label: "rewind to 0%", progress: 0 }
] as const);
const reducedSamples = Object.freeze([
  { id: "forward-20", label: "forward request 20%", progress: 0.2 },
  { id: "forward-80", label: "forward request 80%", progress: 0.8 },
  { id: "rewind-20", label: "rewind request 20%", progress: 0.2 }
] as const);
const profiles = Object.freeze([
  {
    id: "wide-dark-normal",
    label: "wide · dark · normal motion",
    viewport: { width: 1_240, height: 760 },
    theme: "dark",
    motion: "normal",
    samples: normalSamples
  },
  {
    id: "wide-light-normal",
    label: "wide · light · normal motion",
    viewport: { width: 1_240, height: 760 },
    theme: "light",
    motion: "normal",
    samples: normalSamples
  },
  {
    id: "phone-dark-normal",
    label: "phone · dark · normal motion",
    viewport: { width: 390, height: 844 },
    theme: "dark",
    motion: "normal",
    samples: normalSamples
  },
  {
    id: "phone-light-normal",
    label: "phone · light · normal motion",
    viewport: { width: 390, height: 844 },
    theme: "light",
    motion: "normal",
    samples: normalSamples
  },
  {
    id: "wide-dark-reduced",
    label: "wide · dark · reduced motion",
    viewport: { width: 1_240, height: 760 },
    theme: "dark",
    motion: "reduced",
    samples: reducedSamples
  },
  {
    id: "wide-light-reduced",
    label: "wide · light · reduced motion",
    viewport: { width: 1_240, height: 760 },
    theme: "light",
    motion: "reduced",
    samples: reducedSamples
  },
  {
    id: "phone-dark-reduced",
    label: "phone · dark · reduced motion",
    viewport: { width: 390, height: 844 },
    theme: "dark",
    motion: "reduced",
    samples: reducedSamples
  },
  {
    id: "phone-light-reduced",
    label: "phone · light · reduced motion",
    viewport: { width: 390, height: 844 },
    theme: "light",
    motion: "reduced",
    samples: reducedSamples
  }
] as const);

interface CaptureEvidence {
  readonly id: string;
  readonly animationId: typeof animations[number]["id"];
  readonly sampleId: string;
  readonly profileId: typeof profiles[number]["id"];
  readonly requestedProgress: number;
  readonly sampledProgress: number;
  readonly visualOwner: string;
  readonly treatment: string;
  readonly carrierTrackId: string;
  readonly removedTrackCount: number;
  readonly stationaryContextCount: number;
  readonly activeEndpointCount: number;
  readonly visibleMaterialOwnerCount: number;
  readonly carrierOpacity: number;
  readonly carrierTransform: string;
  readonly reviewAvailable: boolean;
  readonly accessibleDescription: string;
  readonly file: string;
}

async function capture(): Promise<void> {
  await mkdir(outputRoot, { recursive: true });
  const harness = createKpVisualReviewHarness();
  const items: KpVisualContactSheetItem[] = [];
  const evidence: CaptureEvidence[] = [];

  try {
    for (const profile of profiles) {
      const runtimes = await Promise.all(animations.map(async (animation) => {
        const page = await harness.page({
          viewport: profile.viewport,
          colorScheme: profile.theme,
          reducedMotion: profile.motion === "reduced"
            ? "reduce"
            : "no-preference"
        });
        const url = new URL("/", harness.baseUrl);
        url.searchParams.set("artifact", animation.id);
        url.searchParams.set("theme", profile.theme);
        await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
        const player = page.locator(
          `[data-kp-editor-animation-player]` +
          `[data-kp-editor-animation-id="${animation.id}"]`
        );
        const stage = player.locator(
          "[data-kp-carrier-preserving-simplification-stage]"
        );
        const seek = player.locator('[data-action="seek-editor-animation"]');
        await waitForReady(stage);
        await page.locator("body").waitFor({ state: "attached" });
        if (profile.motion === "reduced") {
          await player.evaluate((element) => {
            element.dataset["kpEditorAnimationAccessibilityMode"] =
              "reduced-motion";
          });
        }
        return { animation, page, stage, seek };
      }));

      // Keep both callers adjacent at every state so human review compares the
      // shared treatment rather than two independent contact-sheet regions.
      for (const sample of profile.samples) {
        for (const runtime of runtimes) {
          const captured = await captureSample({
            ...runtime,
            profile,
            sample
          });
          evidence.push(captured);
          const image = await readFile(path.resolve(captured.file));
          items.push({
            id: captured.id,
            label:
              `${runtime.animation.label} · ${profile.label}` +
              ` · ${sample.label}` +
              ` · sampled ${Math.round(captured.sampledProgress * 100)}%` +
              ` · ${captured.visualOwner}`,
            progress: captured.sampledProgress,
            viewport: profile.viewport,
            file: captured.file,
            dataUrl: `data:image/png;base64,${image.toString("base64")}`
          });
        }
      }
      await Promise.all(runtimes.map(({ page }) => page.close()));
    }

    const htmlSource = buildKpVisualContactSheetHtml(items, {
      title: "Carrier-preserving simplification · two-caller checkpoint",
      columns: 2,
      imageFit: "contain",
      imageHeightPx: 260
    });
    const sheetPage = await harness.page({
      viewport: { width: 1_440, height: 1_000 },
      colorScheme: "dark"
    });
    await sheetPage.setContent(htmlSource, { waitUntil: "load" });
    const sheet = path.join(outputRoot, "contact-sheet.png");
    await sheetPage.screenshot({
      path: sheet,
      fullPage: true,
      animations: "disabled"
    });
    const html = path.join(outputRoot, "index.html");
    await writeFile(html, htmlSource, "utf8");
    const manifest = path.join(outputRoot, "manifest.json");
    await writeFile(manifest, `${JSON.stringify({
      schemaVersion:
        "kp.carrier-preserving-simplification-visual-checkpoint.v1",
      animations: animations.map((animation) => ({
        ...animation,
        livePath: `/?artifact=${animation.id}`
      })),
      profiles: profiles.map(({ samples, ...profile }) => ({
        ...profile,
        samples: [...samples]
      })),
      samples: evidence,
      sheet: path.relative(process.cwd(), sheet),
      html: path.relative(process.cwd(), html)
    }, null, 2)}\n`, "utf8");
    console.log(
      `carrier checkpoint: ${path.relative(process.cwd(), sheet)}`
    );
    console.log(`review sheet: ${path.relative(process.cwd(), html)}`);
    console.log(`manifest: ${path.relative(process.cwd(), manifest)}`);
  } finally {
    await harness.close();
  }
}

async function captureSample(input: {
  readonly animation: typeof animations[number];
  readonly page: Page;
  readonly stage: Locator;
  readonly seek: Locator;
  readonly profile: typeof profiles[number];
  readonly sample: typeof normalSamples[number] | typeof reducedSamples[number];
}): Promise<CaptureEvidence> {
  await input.seek.fill(String(input.sample.progress));
  const expectedProgress = input.profile.motion === "reduced"
    ? input.sample.progress < 0.5 ? 0 : 1
    : input.sample.progress;
  await input.page.waitForFunction(({ expected }) => {
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-carrier-preserving-simplification-stage]"
    );
    return Number(
      stage?.dataset["kpCarrierPreservingSimplificationProgress"]
    ) === expected;
  }, { expected: expectedProgress });
  await input.stage.evaluate(async (root) => {
    await root.ownerDocument.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
  });

  const id = `${input.animation.slug}-${input.profile.id}-${input.sample.id}`;
  const file = path.join(outputRoot, `${id}.png`);
  await input.stage.screenshot({ path: file, animations: "disabled" });
  const state = await input.stage.evaluate((root) => {
    const materialOwners = [...root.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )];
    const carrierTrackId =
      root.dataset["kpCarrierPreservingSimplificationCarrierTrackId"] ?? "";
    const carrier = materialOwners.find((owner) =>
      owner.dataset["kpEquationMaterialOwnerId"] ===
        `native-scene-owner.${carrierTrackId}`
    );
    const rect = root.getBoundingClientRect();
    const doc = root.ownerDocument;
    const shell = doc.querySelector<HTMLElement>("[data-kp-dev-review-shell]");
    return {
      sampledProgress: Number(
        root.dataset["kpCarrierPreservingSimplificationProgress"]
      ),
      visualOwner:
        root.dataset["kpCarrierPreservingSimplificationVisualOwner"] ?? "",
      treatment:
        root.dataset["kpCarrierPreservingSimplificationTreatment"] ?? "",
      carrierTrackId:
        carrierTrackId,
      removedTrackCount: Number(
        root.dataset["kpCarrierPreservingSimplificationRemovedTrackCount"]
      ),
      stationaryContextCount: Number(
        root.dataset[
          "kpCarrierPreservingSimplificationStationaryContextCount"
        ]
      ),
      activeEndpointCount: [...root.querySelectorAll<HTMLElement>(
        ".kp-carrier-preserving-simplification-stage__endpoint"
      )].filter((endpoint) => endpoint.getAttribute("aria-hidden") === "false")
        .length,
      visibleMaterialOwnerCount: materialOwners.filter((owner) =>
        Number(getComputedStyle(owner).opacity) > 0
      ).length,
      carrierOpacity: carrier === undefined
        ? 0
        : Number(getComputedStyle(carrier).opacity),
      carrierTransform: carrier === undefined
        ? "native-endpoint"
        : getComputedStyle(carrier).transform,
      reviewAvailable:
        doc.body.dataset["kpDevReviewReady"] === "true" &&
        shell?.dataset["kpDevReviewAvailable"] === "true",
      accessibleDescription: root.getAttribute("aria-label") ?? "",
      fitsViewport:
        rect.left >= -1 && rect.right <= doc.documentElement.clientWidth + 1 &&
        doc.documentElement.scrollWidth <= doc.documentElement.clientWidth + 1
    };
  });
  if (state.activeEndpointCount !== 1) {
    throw new Error(`${id} must expose exactly one accessible equation.`);
  }
  if (
    state.removedTrackCount !== 2 ||
    state.carrierTrackId.length === 0 ||
    state.treatment !== "identity-withdrawal"
  ) {
    throw new Error(`${id} is missing canonical carrier/owner diagnostics.`);
  }
  if (
    state.stationaryContextCount !== input.animation.stationaryContextCount
  ) {
    throw new Error(`${id} has the wrong stationary-context contract.`);
  }
  if (!state.reviewAvailable) {
    throw new Error(`${id} must expose the live Review launcher.`);
  }
  if (!state.fitsViewport) {
    throw new Error(`${id} overflows its review viewport.`);
  }
  if (state.accessibleDescription.length === 0) {
    throw new Error(`${id} must preserve an accessible static description.`);
  }
  if (
    state.sampledProgress > 0 &&
    state.sampledProgress < 1 &&
    state.carrierOpacity !== 1
  ) {
    throw new Error(`${id} must keep the semantic carrier fully opaque.`);
  }
  const { fitsViewport: _fitsViewport, ...evidence } = state;
  return {
    id,
    animationId: input.animation.id,
    sampleId: input.sample.id,
    profileId: input.profile.id,
    requestedProgress: input.sample.progress,
    ...evidence,
    file: path.relative(process.cwd(), file)
  };
}

async function waitForReady(stage: Locator): Promise<void> {
  await stage.waitFor({ timeout: 15_000 });
  await stage.evaluate((root) => new Promise<void>((resolve, reject) => {
    if (root.dataset["kpCarrierPreservingSimplificationStage"] === "ready") {
      resolve();
      return;
    }
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error(
        root.dataset["kpCarrierPreservingSimplificationError"] ??
        "Timed out preparing carrier-preserving simplification stage."
      ));
    }, 15_000);
    const observer = new MutationObserver(() => {
      if (
        root.dataset["kpCarrierPreservingSimplificationStage"] === "preparing"
      ) return;
      window.clearTimeout(timeout);
      observer.disconnect();
      if (root.dataset["kpCarrierPreservingSimplificationStage"] === "ready") {
        resolve();
      } else {
        reject(new Error(
          root.dataset["kpCarrierPreservingSimplificationError"] ??
          "Carrier-preserving simplification stage failed."
        ));
      }
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-kp-carrier-preserving-simplification-stage"]
    });
  }));
}

await capture();
