import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Locator, Page } from "playwright";

import {
  createKpSemanticAnimationConvergenceVisualPlan,
  type KpSemanticAnimationConvergenceVisualCase,
  type KpSemanticAnimationConvergenceVisualFrame
} from "../src/editor/semantic-animation-convergence-visual-plan.ts";
import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const outputRoot = path.resolve(
  process.env["KP_VISUAL_OUTPUT"] ??
    "tmp/codex/semantic-animation-convergence"
);
const viewport = { width: 1280, height: 900 } as const;
const harness = createKpVisualReviewHarness();
const captures: CaptureRecord[] = [];

interface CaptureRecord {
  readonly id: string;
  readonly topic: string;
  readonly animationId: string;
  readonly canonicalRoute: string;
  readonly canonicalRepresentationId: string;
  readonly surface: KpSemanticAnimationConvergenceVisualCase["surface"];
  readonly frame: KpSemanticAnimationConvergenceVisualFrame;
  readonly observedDirection: string;
  readonly observedProgress: number;
  readonly endpointAuthority: string;
  readonly nativeMarkers: readonly string[];
  readonly screenshot: string;
  readonly sha256: string;
}

await mkdir(outputRoot, { recursive: true });

try {
  const page = await harness.page({ viewport, reducedMotion: "no-preference" });
  for (const visualCase of createKpSemanticAnimationConvergenceVisualPlan()) {
    for (const frame of visualCase.frames) {
      const captured = await captureFrame(page, visualCase, frame);
      captures.push(captured);
      console.log(
        `${captured.topic} ${captured.frame.id} ` +
        `${captured.observedDirection}@${captured.observedProgress.toFixed(3)} ` +
        `${captured.sha256.slice(0, 12)}`
      );
    }
  }
  const reportPath = path.join(outputRoot, "manifest.json");
  await writeFile(
    reportPath,
    `${JSON.stringify({
      schemaVersion: "kp.semantic-animation-convergence-visual.v1",
      viewport,
      captureCount: captures.length,
      captures
    }, null, 2)}\n`,
    "utf8"
  );
  console.log(JSON.stringify({
    output: path.relative(process.cwd(), reportPath),
    topics: new Set(captures.map(({ topic }) => topic)).size,
    captures: captures.length,
    deterministicRecaptures: captures.length,
    nativeEndpointCaptures: captures.filter(
      ({ frame }) => frame.requiresNativeEndpoint
    ).length
  }, null, 2));
} finally {
  await harness.close();
}

async function captureFrame(
  page: Page,
  visualCase: KpSemanticAnimationConvergenceVisualCase,
  frame: KpSemanticAnimationConvergenceVisualFrame
): Promise<CaptureRecord> {
  const { preservation } = visualCase;
  await page.goto("about:blank");
  if (visualCase.surface === "editor-player") {
    await openEditorFrame(page, visualCase, frame);
  } else if (visualCase.surface === "distribution-reader") {
    await openDistributionFrame(page, visualCase, frame);
  } else {
    await openEquationReaderFrame(page, visualCase, frame);
  }
  await page.evaluate(() => document.fonts.ready);
  await settle(page);
  assertCanonicalRoute(page, preservation.canonicalRoute);

  const surface = surfaceFor(page, visualCase.surface);
  await surface.waitFor();
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });
  await settle(page);

  const first = await surface.screenshot({ animations: "disabled" });
  await settle(page);
  const second = await surface.screenshot({ animations: "disabled" });
  const firstHash = sha256(first);
  const secondHash = sha256(second);
  if (firstHash !== secondHash) {
    throw new Error(
      `${preservation.topic} ${frame.id} is nondeterministic: ` +
      `${firstHash} != ${secondHash}`
    );
  }

  const state = await observedState(page, surface, visualCase.surface);
  assertFrameState(visualCase, frame, state);
  const endpointAuthority = preservation.settledEndpointAuthority;
  if (
    frame.requiresNativeEndpoint &&
    endpointAuthority !== "domain-renderer" &&
    state.nativeMarkers.length === 0
  ) {
    throw new Error(
      `${preservation.topic} ${frame.id} lacks a native endpoint marker.`
    );
  }

  const captureId = `${preservation.topic}-${frame.id}`;
  const screenshotPath = path.join(outputRoot, `${captureId}.png`);
  await writeFile(screenshotPath, first);
  return {
    id: captureId,
    topic: preservation.topic,
    animationId: preservation.animationId,
    canonicalRoute: preservation.canonicalRoute,
    canonicalRepresentationId: preservation.canonicalRepresentationId,
    surface: visualCase.surface,
    frame,
    observedDirection: state.direction,
    observedProgress: state.progress,
    endpointAuthority,
    nativeMarkers: state.nativeMarkers,
    screenshot: path.relative(process.cwd(), screenshotPath),
    sha256: firstHash
  };
}

async function openEditorFrame(
  page: Page,
  visualCase: KpSemanticAnimationConvergenceVisualCase,
  frame: KpSemanticAnimationConvergenceVisualFrame
): Promise<void> {
  await page.goto(harness.url(visualCase.preservation.canonicalRoute), {
    waitUntil: "networkidle"
  });
  const player = page.locator("[data-kp-editor-animation-player]");
  await player.waitFor();
  await requireAttribute(
    player,
    "data-kp-editor-animation-id",
    visualCase.preservation.animationId
  );
  await page.waitForFunction(() =>
    document.querySelector<HTMLElement>("[data-kp-editor-animation-player]")
      ?.dataset["kpEditorAnimationHydrated"] === "true"
  );
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  if (frame.direction === "rewind") {
    await player.evaluate((root, values) => {
      const input = root.querySelector<HTMLInputElement>(
        '[data-action="seek-editor-animation"]'
      );
      const rewind = root.querySelector<HTMLButtonElement>(
        '[data-action="rewind-editor-animation"]'
      );
      const pause = root.querySelector<HTMLButtonElement>(
        '[data-action="pause-editor-animation"]'
      );
      if (input === null || rewind === null || pause === null) {
        throw new Error("Editor rewind controls are incomplete.");
      }
      // Keep direction selection and its canonical seek in one browser task.
      // A rendered clock frame between these actions can invalidate measured
      // geometry with an irrelevant transient progress value.
      input.value = String(values.entry);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      rewind.click();
      pause.click();
      input.value = String(values.progress);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, {
      entry: frame.directionEntryProgress,
      progress: frame.progress
    });
    await settle(page);
  } else {
    await scrubber.fill(String(frame.progress));
  }
  await requireAttribute(
    player,
    "data-kp-editor-animation-direction",
    frame.direction
  );
}

async function openEquationReaderFrame(
  page: Page,
  visualCase: KpSemanticAnimationConvergenceVisualCase,
  frame: KpSemanticAnimationConvergenceVisualFrame
): Promise<void> {
  const url = new URL(
    visualCase.preservation.canonicalRoute,
    harness.baseUrl
  );
  url.searchParams.set("kpMotion", "full");
  await page.goto(url.toString(), { waitUntil: "networkidle" });
  await page.locator('body[data-kp-reader-hydrated="true"]').waitFor();
  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  if (frame.direction === "rewind") {
    await fillRange(
      scrubber,
      Math.round(frame.directionEntryProgress * 1_000)
    );
    await fillRange(
      scrubber,
      Math.round(frame.progress * 1_000)
    );
  } else {
    await fillRange(scrubber, Math.round(frame.progress * 1_000));
  }
}

async function openDistributionFrame(
  page: Page,
  visualCase: KpSemanticAnimationConvergenceVisualCase,
  frame: KpSemanticAnimationConvergenceVisualFrame
): Promise<void> {
  const url = new URL(
    visualCase.preservation.canonicalRoute,
    harness.baseUrl
  );
  url.searchParams.set("kpDirection", "forward");
  url.searchParams.set("kpProgress", "0");
  await page.goto(url.toString(), { waitUntil: "networkidle" });
  await page.locator('body[data-kp-reader-hydrated="true"]').waitFor();
  await page.locator('body[data-kp-reader-font-ready="true"]').waitFor();
  const scrubber = page.locator("[data-kp-distribution-scrubber]");
  if (frame.direction === "rewind") {
    await fillRange(
      scrubber,
      Math.round(frame.directionEntryProgress * 1_000)
    );
    await page.getByRole("button", { name: "Factor" }).click();
    await page
      .locator("[data-kp-distribution-stage]")
      .waitFor();
    await fillRange(
      scrubber,
      Math.round(frame.progress * 1_000)
    );
  } else {
    await fillRange(scrubber, Math.round(frame.progress * 1_000));
  }
}

function surfaceFor(
  page: Page,
  surface: KpSemanticAnimationConvergenceVisualCase["surface"]
): Locator {
  switch (surface) {
    case "editor-player":
      // Controls and diagnostics update independently from the authored visual.
      // Gold evidence therefore captures the stage while controller state is
      // asserted separately by observedState.
      return page.locator("[data-kp-editor-animation-stage]");
    case "equation-reader":
      return page.locator("[data-kp-reader-equation-viewport]");
    case "distribution-reader":
      return page.locator("[data-kp-distribution-visual]");
  }
}

async function observedState(
  page: Page,
  surface: Locator,
  kind: KpSemanticAnimationConvergenceVisualCase["surface"]
): Promise<{
  readonly direction: string;
  readonly progress: number;
  readonly nativeMarkers: readonly string[];
}> {
  const visualRoot = await surface.elementHandle();
  if (visualRoot === null) {
    throw new Error("Visual surface disappeared before sampling.");
  }
  return page.evaluate(({ element, surfaceKind }) => {
    const body = document.body;
    const stateOwner = surfaceKind === "editor-player"
      ? document.querySelector<HTMLElement>("[data-kp-editor-animation-player]")
      : surfaceKind === "distribution-reader"
        ? document.querySelector<HTMLElement>("[data-kp-distribution-stage]")
        : body;
    if (stateOwner === null) {
      throw new Error(`Missing ${surfaceKind} state owner.`);
    }
    const direction = surfaceKind === "editor-player"
      ? stateOwner.getAttribute("data-kp-editor-animation-direction") ?? "missing"
      : surfaceKind === "distribution-reader"
        ? stateOwner.getAttribute("data-kp-direction") ?? "missing"
        : body.dataset["kpReaderPlaybackDirection"] ?? "forward";
    const progressValue = surfaceKind === "editor-player"
      ? stateOwner.getAttribute("data-kp-editor-animation-progress")
      : surfaceKind === "distribution-reader"
        ? document.querySelector<HTMLInputElement>(
          "[data-kp-distribution-scrubber]"
        )?.value
        : body.dataset["kpReaderProgress"];
    const progress = Number(progressValue) /
      (surfaceKind === "editor-player" ? 1 : 1_000);
    const nativeMarkers = [element, ...element.querySelectorAll<HTMLElement>("*")]
      .flatMap((node) => [...node.attributes])
      .filter(({ name, value }) =>
        name.includes("native") ||
        value.includes("native") ||
        name.endsWith("-owner")
      )
      .map(({ name, value }) => `${name}=${value}`)
      .filter((value, index, values) => values.indexOf(value) === index)
      .sort();
    return { direction, progress, nativeMarkers };
  }, { element: visualRoot, surfaceKind: kind });
}

function assertFrameState(
  visualCase: KpSemanticAnimationConvergenceVisualCase,
  frame: KpSemanticAnimationConvergenceVisualFrame,
  state: { readonly direction: string; readonly progress: number }
): void {
  const expectedDirection =
    visualCase.surface === "distribution-reader" && frame.direction === "rewind"
      ? "inverse"
      : frame.direction;
  if (state.direction !== expectedDirection) {
    throw new Error(
      `${visualCase.preservation.topic} ${frame.id} expected direction ` +
      `${expectedDirection}; received ${state.direction}.`
    );
  }
  if (Math.abs(state.progress - frame.progress) > 0.002) {
    throw new Error(
      `${visualCase.preservation.topic} ${frame.id} expected progress ` +
      `${frame.progress}; received ${state.progress}.`
    );
  }
}

function assertCanonicalRoute(page: Page, canonicalRoute: string): void {
  const expected = new URL(canonicalRoute, harness.baseUrl);
  const actual = new URL(page.url());
  if (actual.pathname !== expected.pathname) {
    throw new Error(
      `Canonical route changed: expected ${expected.pathname}, received ${actual.pathname}.`
    );
  }
  for (const [key, value] of expected.searchParams) {
    if (actual.searchParams.get(key) !== value) {
      throw new Error(`Canonical route lost ${key}=${value}.`);
    }
  }
}

async function fillRange(locator: Locator, value: number): Promise<void> {
  await locator.evaluate((node, nextValue) => {
    const input = node as HTMLInputElement;
    input.value = String(nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
  await settle(locator.page());
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

async function requireAttribute(
  locator: Locator,
  name: string,
  expected: string
): Promise<void> {
  const actual = await locator.getAttribute(name);
  if (actual !== expected) {
    throw new Error(
      `Expected ${name}=${expected}; received ${String(actual)}.`
    );
  }
}

function sha256(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}
