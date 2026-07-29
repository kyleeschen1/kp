import { expect, test, type Locator } from "@playwright/test";

const descriptorId =
  "editor-animation.animation.operation-evaluation.one-plus-two";
const animationId =
  "animation.operation-evaluation.one-plus-two";

interface NaturalPlaybackFrame {
  readonly progress: number;
  readonly mappedProgress: number;
  readonly status: string;
  readonly direction: string;
  readonly boundarySide: string;
  readonly visibleOwnerCount: number;
  readonly nonBinaryOpacityCount: number;
  readonly visiblePaintRect?: {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
  } | undefined;
}

test("one plus two mounts through the lazy verified compositor adapter", async ({
  page
}) => {
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const slot = player.locator(
    "[data-kp-editor-animation-surface-slot=\"equation\"]"
  );
  const stage = slot.locator("[data-kp-operation-evaluation-stage]");

  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-pack-id",
    "operation-evaluation"
  );
  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.operation-evaluation.canonical-native-katex"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-status",
    "ready"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-presentation-mode",
    "verified-motion"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-transfer-topology",
    "shared-zero-area-junction"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-native-katex-successor-synthesis-count",
    "1"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-canonical-native-katex-session-factory",
    "shared-v1"
  );
});

test("one plus two direct seek and rewind share one exact pose", async ({
  page
}) => {
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-operation-evaluation-stage]");
  const scrubber = player.locator(
    "[data-action=\"seek-editor-animation\"]"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-status",
    "ready"
  );

  await scrubber.fill("0.25");
  await expect(player).toHaveAttribute(
    "data-kp-operation-evaluation-mapped-progress",
    "0.25"
  );
  const forwardOwners = await ownerPoses(stage);

  await player.locator(
    "[data-action=\"rewind-editor-animation\"]"
  ).click();
  await player.locator(
    "[data-action=\"toggle-editor-animation\"]"
  ).click();
  await expect(player).toHaveAttribute(
    "data-kp-operation-evaluation-direction",
    "rewind"
  );
  await scrubber.fill("0.75");
  await expect(player).toHaveAttribute(
    "data-kp-operation-evaluation-mapped-progress",
    "0.25"
  );
  const rewindOwners = await ownerPoses(stage);

  expect(rewindOwners).toEqual(forwardOwners);
  await scrubber.fill("0.3");
  await expect(player).toHaveAttribute(
    "data-kp-operation-evaluation-mapped-progress",
    "0.7"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-boundary-side",
    "junction"
  );
});

for (const viewport of [
  { id: "wide", width: 1180, height: 900 },
  { id: "phone", width: 360, height: 800 }
] as const) {
  test(`one plus two natural playback is continuous on ${viewport.id}`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await page.goto(`/?animation=${descriptorId}`);
    const player = page.locator(
      `[data-kp-editor-animation-player]` +
      `[data-kp-editor-animation-id="${animationId}"]`
    );
    const stage = player.locator("[data-kp-operation-evaluation-stage]");
    const toggle = player.locator(
      "[data-action=\"toggle-editor-animation\"]"
    );
    const scrubber = player.locator(
      "[data-action=\"seek-editor-animation\"]"
    );
    await expect(stage).toHaveAttribute(
      "data-kp-operation-evaluation-status",
      "ready"
    );
    await player.locator(
      "[data-kp-editor-animation-accessibility-control]"
    ).selectOption("full-motion");
    await installNaturalPlaybackTrace(player);

    const sourceRaster = await stage.screenshot();
    await toggle.click();
    await expect(player).toHaveAttribute(
      "data-kp-editor-animation-status",
      "complete",
      { timeout: 8_000 }
    );
    await expect(player).toHaveAttribute(
      "data-kp-editor-animation-progress",
      "1"
    );
    const trace = await readNaturalPlaybackTrace(player);
    expect(trace.length).toBeGreaterThan(20);
    expect(trace.some(({ boundarySide }) => boundarySide === "source")).toBe(
      true
    );
    expect(trace.some(({ boundarySide }) => boundarySide === "target")).toBe(
      true
    );
    expect(trace.every(({ direction }) => direction === "forward")).toBe(true);
    expect(trace.every(({ nonBinaryOpacityCount }) =>
      nonBinaryOpacityCount === 0
    )).toBe(true);
    expect(trace.some(({ visibleOwnerCount }) => visibleOwnerCount > 0)).toBe(
      true
    );
    for (let index = 1; index < trace.length; index += 1) {
      expect(trace[index]!.progress + 1e-9).toBeGreaterThanOrEqual(
        trace[index - 1]!.progress
      );
    }
    const completedRegionStart = trace.findIndex(
      ({ progress }) => progress > 0.95
    );
    expect(completedRegionStart).toBeGreaterThanOrEqual(0);
    expect(
      trace.slice(completedRegionStart).some(({ progress }) => progress === 0)
    ).toBe(false);
    expect(
      maximumSignificantPaintStep(trace, viewport.width)
    ).toBeLessThanOrEqual(0.12);

    const finalRaster = await stage.screenshot();
    await page.evaluate(async () => {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve())
        )
      );
    });
    const heldRaster = await stage.screenshot();
    expect(heldRaster.equals(finalRaster)).toBe(true);
    expect(finalRaster.equals(sourceRaster)).toBe(false);

    const completedTraceLength = trace.length;
    await toggle.click();
    await expect(player).toHaveAttribute(
      "data-kp-editor-animation-status",
      "playing"
    );
    await expect.poll(async () =>
      Number(await player.getAttribute("data-kp-editor-animation-progress"))
    ).toBeLessThan(0.35);
    const replayTrace = await readNaturalPlaybackTrace(player);
    expect(replayTrace.length).toBeGreaterThan(completedTraceLength);
    expect(
      replayTrace.slice(completedTraceLength).some(({ progress }) =>
        progress < 0.35
      )
    ).toBe(true);
    await toggle.click();
    await scrubber.fill("1");
    const directEndpointRaster = await stage.screenshot();
    expect(directEndpointRaster.equals(finalRaster)).toBe(true);

    const stageBounds = await stage.boundingBox();
    const slotBounds = await player.locator(
      "[data-kp-editor-animation-surface-slot=\"equation\"]"
    ).boundingBox();
    expect(stageBounds).not.toBeNull();
    expect(slotBounds).not.toBeNull();
    expect(stageBounds!.x).toBeGreaterThanOrEqual(slotBounds!.x - 0.5);
    expect(stageBounds!.y).toBeGreaterThanOrEqual(slotBounds!.y - 0.5);
    expect(stageBounds!.x + stageBounds!.width).toBeLessThanOrEqual(
      slotBounds!.x + slotBounds!.width + 0.5
    );
    expect(stageBounds!.y + stageBounds!.height).toBeLessThanOrEqual(
      slotBounds!.y + slotBounds!.height + 0.5
    );

    const oldPlayer = await player.elementHandle();
    await page.locator('[data-action="set-editor-animation"]').selectOption({
      index: 0
    });
    await expect(page.locator(
      "[data-kp-operation-evaluation-stage]"
    )).toHaveCount(0);
    expect(await oldPlayer?.isVisible()).toBe(false);
    await oldPlayer?.dispose();
  });
}

test("one plus two boundary samples retain opaque font-stable paint", async ({
  page
}) => {
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-operation-evaluation-stage]");
  const scrubber = player.locator(
    "[data-action=\"seek-editor-animation\"]"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-status",
    "ready"
  );

  const samples = [];
  for (const progress of [0, 0.699, 0.7, 0.701, 1]) {
    await scrubber.fill(String(progress));
    await expect(player).toHaveAttribute(
      "data-kp-operation-evaluation-mapped-progress",
      String(progress)
    );
    samples.push(await paintBoundarySample(stage));
  }
  expect(samples.map(({ boundarySide }) => boundarySide)).toEqual([
    "source",
    "source",
    "junction",
    "target",
    "target"
  ]);
  expect(samples.every(({ nonBinaryOpacityCount }) =>
    nonBinaryOpacityCount === 0
  )).toBe(true);
  expect(samples.every(({ fontFingerprints }) =>
    fontFingerprints.every((fingerprint) =>
      fingerprint.includes("KaTeX")
    )
  )).toBe(true);
  expect(samples[0]!.nativeSourceVisible).toBe(true);
  expect(samples[4]!.nativeTargetVisible).toBe(true);
  expect(samples[0]!.visibleMaterialOwnerCount).toBe(0);
  expect(samples[4]!.visibleMaterialOwnerCount).toBe(0);
});

test("Review can capture the one plus two Animation Library moment", async ({
  page
}) => {
  await page.goto(`/?animation=${descriptorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  await expect(player.locator(
    "[data-kp-operation-evaluation-stage]"
  )).toHaveAttribute(
    "data-kp-operation-evaluation-status",
    "ready"
  );
  const review = page.locator("[data-kp-dev-review-shell]");
  await expect(review.locator("button.launcher")).toBeVisible();
  await review.locator("button.launcher").click();
  await review.locator("textarea").fill(
    "Operation evaluation Review capture wiring proof."
  );
  await expect(review.locator(".meta")).toContainText("wide");
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/dev/reviews/v2/notes") &&
    response.request().method() === "POST"
  );
  await review.locator("button.save").click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  const note = await response.json() as {
    capture: {
      semantic: {
        assetId?: string;
      };
    };
  };
  expect(note.capture.semantic.assetId).toBe(animationId);
});

async function ownerPoses(
  stage: Locator
): Promise<readonly string[]> {
  return stage.locator(
    "[data-kp-equation-material-owner-id]"
  ).evaluateAll((owners) => owners.map((owner) => {
    const element = owner as HTMLElement;
    return [
      element.dataset["kpEquationMaterialFragmentRole"],
      element.style.opacity,
      element.style.transform
    ].join("|");
  }).sort());
}

async function installNaturalPlaybackTrace(player: Locator): Promise<void> {
  await player.evaluate((element) => {
    const host = element as HTMLElement & {
      __kpOperationEvaluationTrace?: NaturalPlaybackFrame[];
    };
    host.__kpOperationEvaluationTrace = [];
    host.addEventListener("kp-editor-animation-frame", () => {
      const stage = host.querySelector<HTMLElement>(
        "[data-kp-operation-evaluation-stage]"
      );
      if (stage === null) return;
      const paint = observeVisiblePaint(stage);
      host.__kpOperationEvaluationTrace!.push({
        progress: Number(host.dataset["kpEditorAnimationProgress"]),
        mappedProgress: Number(
          host.dataset["kpOperationEvaluationMappedProgress"]
        ),
        status: host.dataset["kpEditorAnimationStatus"] ?? "",
        direction: host.dataset["kpOperationEvaluationDirection"] ?? "",
        boundarySide:
          stage.dataset["kpOperationEvaluationBoundarySide"] ?? "",
        visibleOwnerCount: paint.visibleOwnerCount,
        nonBinaryOpacityCount: paint.nonBinaryOpacityCount,
        ...(paint.visiblePaintRect === undefined
          ? {}
          : { visiblePaintRect: paint.visiblePaintRect })
      });
    });

    function observeVisiblePaint(root: HTMLElement): {
      readonly visibleOwnerCount: number;
      readonly nonBinaryOpacityCount: number;
      readonly visiblePaintRect?: {
        readonly left: number;
        readonly top: number;
        readonly right: number;
        readonly bottom: number;
      } | undefined;
    } {
      const candidates = [
        ...root.querySelectorAll<HTMLElement>(
          "[data-kp-operation-evaluation-source]," +
          "[data-kp-operation-evaluation-target]," +
          "[data-kp-equation-material-owner-id]"
        )
      ];
      const visible = candidates.flatMap((candidate) => {
        const style = getComputedStyle(candidate);
        const opacity = Number(style.opacity);
        const rect = candidate.getBoundingClientRect();
        const painted =
          style.visibility !== "hidden" &&
          style.display !== "none" &&
          opacity > 0.01 &&
          rect.width * rect.height > 0.01;
        return painted ? [{ opacity, rect }] : [];
      });
      const nonBinaryOpacityCount = candidates.filter((candidate) => {
        const opacity = Number(getComputedStyle(candidate).opacity);
        return Math.abs(opacity) > 1e-6 &&
          Math.abs(opacity - 1) > 1e-6;
      }).length;
      if (visible.length === 0) {
        return {
          visibleOwnerCount: 0,
          nonBinaryOpacityCount
        };
      }
      return {
        visibleOwnerCount: visible.length,
        nonBinaryOpacityCount,
        visiblePaintRect: {
          left: Math.min(...visible.map(({ rect }) => rect.left)),
          top: Math.min(...visible.map(({ rect }) => rect.top)),
          right: Math.max(...visible.map(({ rect }) => rect.right)),
          bottom: Math.max(...visible.map(({ rect }) => rect.bottom))
        }
      };
    }
  });
}

async function readNaturalPlaybackTrace(
  player: Locator
): Promise<readonly NaturalPlaybackFrame[]> {
  return player.evaluate((element) =>
    (element as HTMLElement & {
      __kpOperationEvaluationTrace?: NaturalPlaybackFrame[];
    }).__kpOperationEvaluationTrace ?? []
  );
}

function maximumSignificantPaintStep(
  trace: readonly NaturalPlaybackFrame[],
  viewportWidth: number
): number {
  let maximum = 0;
  for (let index = 1; index < trace.length; index += 1) {
    const previous = trace[index - 1]!.visiblePaintRect;
    const current = trace[index]!.visiblePaintRect;
    if (previous === undefined || current === undefined) continue;
    const previousArea =
      (previous.right - previous.left) * (previous.bottom - previous.top);
    const currentArea =
      (current.right - current.left) * (current.bottom - current.top);
    // Near a certified zero-area junction, position is visually irrelevant;
    // the opaque material is intentionally shrinking into or emerging from it.
    if (Math.min(previousArea, currentArea) < 4) continue;
    const previousX = (previous.left + previous.right) / 2;
    const currentX = (current.left + current.right) / 2;
    maximum = Math.max(maximum, Math.abs(currentX - previousX) / viewportWidth);
  }
  return maximum;
}

async function paintBoundarySample(stage: Locator): Promise<{
  readonly boundarySide: string;
  readonly nonBinaryOpacityCount: number;
  readonly fontFingerprints: readonly string[];
  readonly materialOwnerCount: number;
  readonly visibleMaterialOwnerCount: number;
  readonly nativeSourceVisible: boolean;
  readonly nativeTargetVisible: boolean;
}> {
  return stage.evaluate((element) => {
    const root = element as HTMLElement;
    const source = root.querySelector<HTMLElement>(
      "[data-kp-operation-evaluation-source]"
    )!;
    const target = root.querySelector<HTMLElement>(
      "[data-kp-operation-evaluation-target]"
    )!;
    const material = [
      ...root.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )
    ];
    const candidates = [source, target, ...material];
    return {
      boundarySide:
        root.dataset["kpOperationEvaluationBoundarySide"] ?? "",
      nonBinaryOpacityCount: candidates.filter((candidate) => {
        const opacity = Number(getComputedStyle(candidate).opacity);
        return Math.abs(opacity) > 1e-6 &&
          Math.abs(opacity - 1) > 1e-6;
      }).length,
      fontFingerprints: candidates.flatMap((candidate) => {
        const paint = candidate.querySelector<HTMLElement>(".katex") ??
          candidate.firstElementChild as HTMLElement | null ??
          candidate;
        const style = getComputedStyle(paint);
        const rect = candidate.getBoundingClientRect();
        return Number(style.opacity) > 0.01 &&
          rect.width * rect.height > 0.01
          ? [[
              style.fontFamily,
              style.fontSize,
              style.fontStyle,
              style.fontWeight
            ].join("|")]
          : [];
      }),
      materialOwnerCount: material.length,
      visibleMaterialOwnerCount: material.filter((owner) => {
        const style = getComputedStyle(owner);
        const rect = owner.getBoundingClientRect();
        return Number(style.opacity) > 0.01 &&
          rect.width * rect.height > 0.01;
      }).length,
      nativeSourceVisible: Number(getComputedStyle(source).opacity) > 0.99,
      nativeTargetVisible: Number(getComputedStyle(target).opacity) > 0.99
    };
  });
}
