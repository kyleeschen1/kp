import {
  expect,
  test,
  type BrowserContext,
  type FrameLocator,
  type Page
} from "@playwright/test";
import type {
  KpDevReviewCreateRequestV2
} from "../protocols/dev-review-v2.ts";

const animationId =
  "animation.fraction-composition.two-thirds-solve";
const pinnedNodeId =
  "evaluation.fraction-composition.subtract-and-simplify";

const viewports = [
  {
    id: "wide",
    outer: { width: 1_440, height: 1_000 },
    layout: "single-row"
  },
  {
    id: "phone",
    outer: { width: 390, height: 844 },
    layout: "semantic-two-row-stage"
  }
] as const;
const foldModes = [
  "expanded",
  "collapsed",
  "automatic",
  "pinned"
] as const;
const deviceScaleFactors = [1, 2] as const;
type KpFractionCompositionVisualViolation =
  Awaited<ReturnType<typeof collectPaintEvidence>>["violations"][number];

test("fraction composition passes the complete Animation Library visual matrix", async ({
  browser
}) => {
  test.setTimeout(240_000);
  const summaries: Array<{
    viewport: string;
    foldMode: string;
    deviceScaleFactor: number;
    sampleCount: number;
  }> = [];
  const matrixViolations: Array<{
    readonly matrix: string;
    readonly violations:
      readonly KpFractionCompositionVisualViolation[];
  }> = [];
  let reviewRequest: KpDevReviewCreateRequestV2 | undefined;
  const contexts = new Map<string, BrowserContext>();

  try {
    for (const viewport of viewports) {
      for (const foldMode of foldModes) {
        for (const deviceScaleFactor of deviceScaleFactors) {
          const contextKey = `${viewport.id}.dpr${deviceScaleFactor}`;
          let context = contexts.get(contextKey);
          if (context === undefined) {
            context = await browser.newContext({
              viewport: viewport.outer,
              deviceScaleFactor
            });
            contexts.set(contextKey, context);
          }
          const page = await context.newPage();
          try {
          const errors: string[] = [];
          page.on("pageerror", (error) => errors.push(error.message));
          await mockReviewInbox(page);
          if (
            viewport.id === "phone" &&
            foldMode === "automatic" &&
            deviceScaleFactor === 2
          ) {
            await page.route(
              "**/api/dev/reviews/v2/notes",
              async (route) => {
                reviewRequest =
                  route.request().postDataJSON() as
                    KpDevReviewCreateRequestV2;
                await route.fulfill({
                  status: 201,
                  contentType: "application/json",
                  body: JSON.stringify({
                    ...reviewRequest,
                    id: "note.fraction-composition-s18-checkpoint",
                    sequence: 18,
                    status: "new"
                  })
                });
              }
            );
          }

          const viewportQuery = viewport.id === "phone"
            ? "&viewport=phone"
            : "";
          await page.goto(
            "/canonical-animation-review.html" +
            `?animation=${encodeURIComponent(animationId)}` +
            viewportQuery,
            { waitUntil: "domcontentloaded" }
          );
          const library = page.locator("[data-kp-animation-library]");
          const frame = page.frameLocator(
            "[data-animation-library-frame]"
          );
          await expect(library).toHaveAttribute(
            "data-animation-id",
            animationId
          );
          await expect(library).toHaveAttribute(
            "data-canonical-format",
            "partial"
          );
          await ready(frame);
          await setFoldMode(frame, foldMode);
          await expect(
            frame.locator("[data-kp-reader-equation-stage]")
          ).toHaveAttribute("data-kp-reader-fold-mode", foldMode);
          if (foldMode === "pinned") {
            await expect(
              frame.locator("[data-kp-reader-equation-stage]")
            ).toHaveAttribute("data-kp-reader-fold-pinned", pinnedNodeId);
          }

          const samples = denseVisualSamples();
          for (const progress of samples) {
            await seek(frame, progress);
            const evidence = await collectPaintEvidence(frame, progress);
            expect(
              evidence.viewport.devicePixelRatio,
              label(viewport.id, foldMode, deviceScaleFactor, progress)
            ).toBe(deviceScaleFactor);
            expect(
              evidence.layoutPolicy,
              label(viewport.id, foldMode, deviceScaleFactor, progress)
            ).toBe(viewport.layout);
            expect(
              evidence.fitScale,
              label(viewport.id, foldMode, deviceScaleFactor, progress)
            ).toBeGreaterThanOrEqual(0.68);
            expect(
              evidence.horizontalOverflow,
              label(viewport.id, foldMode, deviceScaleFactor, progress)
            ).toBeLessThanOrEqual(1);
            if (evidence.violations.length > 0) {
              matrixViolations.push({
                matrix: label(
                  viewport.id,
                  foldMode,
                  deviceScaleFactor,
                  progress
                ),
                violations: evidence.violations
              });
            }
            expect(
              evidence.invalidOpacityOwners,
              label(viewport.id, foldMode, deviceScaleFactor, progress)
            ).toEqual([]);
            expect(
              evidence.nonOpaqueFissionFusionOwners,
              label(viewport.id, foldMode, deviceScaleFactor, progress)
            ).toEqual([]);
            expect(
              evidence.visualAuthorityCount,
              label(viewport.id, foldMode, deviceScaleFactor, progress)
            ).toBe(1);
            expect(
              evidence.sourceNativeOpacity === 0 ||
                evidence.sourceNativeOpacity === 1
            ).toBe(true);
            expect(
              evidence.targetNativeOpacity === 0 ||
                evidence.targetNativeOpacity === 1
            ).toBe(true);
          }

          await seek(frame, 0);
          await expectNativeEndpoint(frame, "source");
          await seek(frame, 1_000);
          await expectNativeEndpoint(frame, "target");
          await expectReviewLauncherInViewport(page);

          if (
            viewport.id === "phone" &&
            foldMode === "automatic" &&
            deviceScaleFactor === 2
          ) {
            await seek(frame, 538);
            const review = page.locator(
              "[data-kp-dev-review-shell]"
            );
            await review.locator("button.launcher").click();
            await review.locator("textarea").fill(
              "Slice 18 canonical fraction composition visual checkpoint."
            );
            await review.locator("button.save").click();
            await expect(review.locator("output.status"))
              .toHaveText("Saved note 18.");
          }

          expect(
            errors,
            label(viewport.id, foldMode, deviceScaleFactor)
          ).toEqual([]);
          summaries.push({
            viewport: viewport.id,
            foldMode,
            deviceScaleFactor,
            sampleCount: samples.length
          });
          } finally {
            await page.close();
          }
        }
      }
    }
  } finally {
    for (const context of contexts.values()) await context.close();
  }

  expect(summaries).toHaveLength(16);
  expect(summaries.every(({ sampleCount }) => sampleCount === 81))
    .toBe(true);
  expect(reviewRequest?.capture.semantic.assetId).toBe(animationId);
  expect(reviewRequest?.capture.semantic.foldMode).toBe("automatic");
  expect(reviewRequest?.capture.semantic.progressPermille).toBe(538);
  expect(reviewRequest?.capture.semantic.animationProgressPermille)
    .toBeGreaterThanOrEqual(0);
  expect(reviewRequest?.capture.semantic.phaseProgressPermille)
    .toBeGreaterThanOrEqual(0);
  expect(reviewRequest?.capture.semantic.activeTransformationIds.length)
    .toBeGreaterThan(0);
  expect(reviewRequest?.capture.render.surface?.profile).toBe("phone");
  expect(
    reviewRequest?.capture.render.surface?.contentViewport.devicePixelRatio
  ).toBe(2);
  const violationSummary = summarizeViolations(matrixViolations);
  // Keep this gate red until generic clearance removes every unrelated
  // contact; a sampled whitelist would only make the visual defect durable.
  expect(violationSummary, JSON.stringify(violationSummary, null, 2))
    .toEqual([]);
});

function denseVisualSamples(): readonly number[] {
  return Object.freeze(
    Array.from({ length: 81 }, (_value, index) =>
      Math.round(index * 12.5)
    )
  );
}

async function ready(frame: FrameLocator): Promise<void> {
  await expect(frame.locator("body")).toHaveAttribute(
    "data-kp-reader-hydrated",
    "true"
  );
  await expect(
    frame.locator("[data-kp-reader-equation-stage]")
  ).toHaveAttribute(
    "data-kp-reader-canonical-equation-session-active",
    "true"
  );
  await frame.locator("body").evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => resolve())
      )
    );
  });
}

async function setFoldMode(
  frame: FrameLocator,
  mode: typeof foldModes[number]
): Promise<void> {
  if (mode === "pinned") {
    await frame.getByRole("button", { name: "Subtract" }).click();
  } else {
    await frame.locator("select[data-kp-reader-fold-mode]")
      .selectOption(mode);
  }
  await frame.locator("body").evaluate(() =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => resolve())
      )
    )
  );
}

async function seek(
  frame: FrameLocator,
  progress: number
): Promise<void> {
  await frame.locator("[data-kp-reader-attention-scrubber]")
    .evaluate((node, value) => {
      const input = node as HTMLInputElement;
      input.value = String(value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, progress);
  await expect(frame.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    String(progress)
  );
  // The exact progress attribute is written by the scheduled reader frame.
  // One subsequent paint is sufficient; a second frame multiplied 1,296
  // times adds no state coverage and can consume the matrix timeout margin.
  await frame.locator("body").evaluate(() =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve())
    )
  );
}

async function collectPaintEvidence(
  frame: FrameLocator,
  progressPermille: number
) {
  return frame.locator("body").evaluate(async (_body, progress) => {
    const overlapModule =
      "/src/rendering/equation-visible-paint-overlap.ts";
    const geometryModule =
      "/src/rendering/native-katex-paint-geometry.ts";
    const {
      evaluateKpEquationVisiblePaintCertifiedContacts,
      inspectKpEquationVisiblePaintOverlap
    } = await import(overlapModule);
    const { measureKpNativeKatexSubtreePaintRect } =
      await import(geometryModule);
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-reader-equation-viewport]"
    );
    const equationStage = document.querySelector<HTMLElement>(
      "[data-kp-reader-equation-stage]"
    );
    const transition = document.querySelector<HTMLElement>(
      "[data-kp-reader-transition-active='true']"
    );
    if (
      stage === null ||
      equationStage === null ||
      transition === null
    ) {
      throw new Error("Visual matrix lacks its active equation stage.");
    }
    const effectiveOpacity = (element: HTMLElement): number => {
      let opacity = 1;
      let current: HTMLElement | null = element;
      while (current !== null) {
        opacity *= Number(getComputedStyle(current).opacity);
        if (current === stage) break;
        current = current.parentElement;
      }
      return opacity;
    };
    const nativeRoots = [
      ...transition.querySelectorAll<HTMLElement>(
        "[data-kp-reader-native]"
      )
    ];
    const sourceRoot = nativeRoots.find(
      ({ dataset }) => dataset["kpReaderNative"] === "source"
    );
    const targetRoot = nativeRoots.find(
      ({ dataset }) => dataset["kpReaderNative"] === "target"
    );
    if (sourceRoot === undefined || targetRoot === undefined) {
      throw new Error("Visual matrix requires both native endpoints.");
    }
    const materialOwners = [
      ...transition.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )
    ];
    const observations = [
      ...nativeRoots.flatMap((root) => {
        const authority = root.dataset["kpReaderNative"] === "source"
          ? "source-native" as const
          : "target-native" as const;
        return [...root.querySelectorAll<HTMLElement>(
          "[data-kp-reader-equation-anchor-id]"
        )].filter((anchor) =>
          anchor.dataset["kpFoldableEnvelopeId"] === undefined &&
          effectiveOpacity(anchor) > 0.01
        ).flatMap((anchor) => {
          const rect = measureKpNativeKatexSubtreePaintRect(
            stage,
            anchor
          );
          return rect === undefined ? [] : [{
            ownerId:
              `native:${authority}:${
                anchor.dataset["kpReaderEquationAnchorId"]
              }`,
            semanticEntityId:
              anchor.dataset["kpReaderSelectorId"],
            rowId: anchor.closest<HTMLElement>(
              "[data-kp-foldable-envelope-id]"
            )?.dataset["kpFoldableEnvelopeId"],
            authority,
            rect,
            opacity: effectiveOpacity(anchor)
          }];
        });
      }),
      ...materialOwners.flatMap((owner) => {
        const visual = owner.firstElementChild as HTMLElement | null;
        const rect = visual === null
          ? undefined
          : measureKpNativeKatexSubtreePaintRect(stage, visual);
        return rect === undefined ? [] : [{
          ownerId:
            owner.dataset["kpEquationMaterialOwnerId"] ?? "",
          semanticEntityId:
            owner.dataset["kpEquationMaterialSemanticEntityId"],
          semanticContacts: JSON.parse(
            owner.dataset["kpEquationMaterialSemanticContacts"] ?? "[]"
          ),
          authority: "material" as const,
          rect,
          opacity: effectiveOpacity(owner)
        }];
      })
    ];
    const report = inspectKpEquationVisiblePaintOverlap({
      progress: progress / 1_000,
      viewportId: `${window.innerWidth}x${window.innerHeight}`,
      observations,
      contactTolerancePx: 0.75
    });
    const contactEvaluation =
      evaluateKpEquationVisiblePaintCertifiedContacts({
        report,
        contactTolerancePx: 0.75
      });
    const ownerEvidence = materialOwners.map((owner) => {
      const opacity = effectiveOpacity(owner);
      const contacts = JSON.parse(
        owner.dataset["kpEquationMaterialSemanticContacts"] ?? "[]"
      ) as Array<{ readonly reason?: string }>;
      return {
        id: owner.dataset["kpEquationMaterialOwnerId"] ?? "",
        opacity,
        hasFissionFusionContact: contacts.some(({ reason }) =>
          reason === "semantic-fission" ||
          reason === "semantic-fusion"
        )
      };
    });
    const sourceNativeOpacity = effectiveOpacity(sourceRoot);
    const targetNativeOpacity = effectiveOpacity(targetRoot);
    const materialOwns =
      sourceNativeOpacity === 0 &&
      targetNativeOpacity === 0 &&
      materialOwners.length > 0;
    const fit = transition.querySelector<HTMLElement>(
      "[data-kp-reader-fit-surface]"
    );
    if (fit === null) {
      throw new Error("Visual matrix active transition lacks fitting.");
    }
    return {
      semanticProgressPermille: Number(
        document.body.dataset["kpReaderProgress"]
      ),
      sourceNativeOpacity,
      targetNativeOpacity,
      materialOwnerCount: materialOwners.length,
      visualAuthorityCount:
        Number(sourceNativeOpacity === 1) +
        Number(targetNativeOpacity === 1) +
        Number(materialOwns),
      invalidOpacityOwners: ownerEvidence
        .filter(({ opacity }) =>
          !Number.isFinite(opacity) || opacity < 0 || opacity > 1
        )
        .map(({ id }) => id),
      nonOpaqueFissionFusionOwners: ownerEvidence
        .filter(({ id, opacity, hasFissionFusionContact }) =>
          id.startsWith("native-scene-owner.track.") &&
          hasFissionFusionContact &&
          Math.abs(opacity - 1) > 1e-6
        )
        .map(({ id }) => id),
      layoutPolicy:
        transition.dataset["kpReaderStageLayoutPolicy"],
      fitScale: Number(
        fit.dataset["kpReaderEquationFitScale"]
      ),
      horizontalOverflow:
        document.documentElement.scrollWidth - window.innerWidth,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      },
      intersections: report.intersections,
      allowed: contactEvaluation.allowed,
      violations: contactEvaluation.violations
    };
  }, progressPermille);
}

async function expectNativeEndpoint(
  frame: FrameLocator,
  owner: "source" | "target"
): Promise<void> {
  const active = frame.locator(
    "[data-kp-reader-transition-active='true']"
  );
  await expect(
    active.locator(`[data-kp-reader-native="${owner}"]`)
  ).toHaveCSS("opacity", "1");
  expect(await active.locator(
    "[data-kp-equation-material-owner-id]"
  ).evaluateAll((elements) => elements.every((element) =>
    Number(getComputedStyle(element).opacity) === 0
  ))).toBe(true);
}

async function expectReviewLauncherInViewport(
  page: Page
): Promise<void> {
  const review = page.locator("[data-kp-dev-review-shell]");
  await expect(review).toHaveCount(1);
  const launcher = review.locator("button.launcher");
  await expect(launcher).toBeVisible();
  const box = await launcher.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
}

async function mockReviewInbox(page: Page): Promise<void> {
  await page.route("**/api/dev/reviews/v2/query", async (route) => {
    await route.fulfill({
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
          id: "round.current",
          sequence: 1,
          label: "Current visual review",
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

function label(
  viewport: string,
  foldMode: string,
  deviceScaleFactor: number,
  progress?: number
): string {
  return [
    viewport,
    foldMode,
    `dpr${deviceScaleFactor}`,
    ...(progress === undefined ? [] : [`p${progress}`])
  ].join("/");
}

function summarizeViolations(
  occurrences: readonly {
    readonly matrix: string;
    readonly violations:
      readonly KpFractionCompositionVisualViolation[];
  }[]
) {
  type SummaryEntry = {
    kind: string;
    leftSemanticEntityId: string | undefined;
    rightSemanticEntityId: string | undefined;
    occurrenceCount: number;
    maximumOverlapWidthPx: number;
    maximumOverlapHeightPx: number;
    matrixSamples: string[];
  };
  const summary = new Map<string, SummaryEntry>();
  for (const occurrence of occurrences) {
    for (const violation of occurrence.violations) {
      const key = [
        violation.kind,
        violation.leftSemanticEntityId ?? violation.leftOwnerId,
        violation.rightSemanticEntityId ?? violation.rightOwnerId
      ].join("|");
      const existing: SummaryEntry = summary.get(key) ?? {
        kind: violation.kind,
        leftSemanticEntityId: violation.leftSemanticEntityId,
        rightSemanticEntityId: violation.rightSemanticEntityId,
        occurrenceCount: 0,
        maximumOverlapWidthPx: 0,
        maximumOverlapHeightPx: 0,
        matrixSamples: []
      };
      existing.occurrenceCount += 1;
      existing.maximumOverlapWidthPx = Math.max(
        existing.maximumOverlapWidthPx,
        violation.width
      );
      existing.maximumOverlapHeightPx = Math.max(
        existing.maximumOverlapHeightPx,
        violation.height
      );
      if (existing.matrixSamples.length < 8) {
        existing.matrixSamples.push(occurrence.matrix);
      }
      summary.set(key, existing);
    }
  }
  return [...summary.values()].sort((left, right) =>
    right.occurrenceCount - left.occurrenceCount ||
    String(left.leftSemanticEntityId).localeCompare(
      String(right.leftSemanticEntityId)
    )
  );
}
