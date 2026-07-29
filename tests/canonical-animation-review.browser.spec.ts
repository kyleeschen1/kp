import {
  expect,
  test,
  type FrameLocator,
  type Page
} from "@playwright/test";
import { execFileSync } from "node:child_process";
import type {
  KpDevReviewCreateRequestV2
} from "../protocols/dev-review-v2.ts";
import {
  createKpFoldableDistributionFoldIntent
} from "../src/semantic/foldable-distribution-fold-intent.ts";
import {
  compileKpFoldableDistributionAdaptiveProjection
} from "../src/semantic/foldable-distribution-fold-projection.ts";
import {
  compileKpFoldableDistributionFoldTimeline
} from "../src/semantic/foldable-distribution-fold-timeline.ts";

const radicalId =
  "animation.generated.radical.square-root-as-power";
const splitMergeId = "animation.numerator-split-merge.round-trip";
const foldableDistributionId =
  "animation.foldable-distribution.collect-like-terms";
const fractionCompositionId =
  "animation.fraction-composition.two-thirds-solve";
const exactFractionQuantityId =
  "animation.exact-fraction-quantity.third-plus-sixth";
const operationEvaluationId =
  "animation.operation-evaluation.one-plus-two";
const expectedReviewCommit = execFileSync(
  "git",
  ["rev-parse", "--short=12", "HEAD"],
  { encoding: "utf8" }
).trim();

test.beforeEach(async ({ page }) => {
  await mockReviewInbox(page);
});

test("Animation Library lists all metadata but mounts only the selected host", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const documentRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") {
      documentRequests.push(new URL(request.url()).pathname);
    }
  });

  await page.goto("/canonical-animation-review.html");
  const library = page.locator(
    '[data-kp-animation-library][data-catalog-ready="true"]'
  );
  await expect(library).toBeVisible();
  await expect(page.locator("[data-animation-library-count]")).toHaveText(
    /\d+ animations/
  );
  const catalogCount = Number(
    (await page
      .locator("[data-animation-library-count]")
      .textContent())?.split(" ")[0]
  );
  expect(catalogCount).toBeGreaterThan(29);
  await expect(
    page.locator(
      '[data-animation-library-list] button[data-canonical-format="ported"]'
    ).first()
  ).toContainText("ported");
  await expect(
    page.locator(
      '[data-animation-library-list] button[data-canonical-format="partial"]'
    ).first()
  ).toContainText("partial port");
  await expect.poll(() =>
    page.locator("[data-animation-library-list]").evaluate(
      (element) => element.scrollHeight > element.clientHeight
    )
  ).toBe(true);

  const frame = page.locator("[data-animation-library-frame]");
  await expect(frame).toHaveCount(1);
  await expect(frame).toHaveAttribute("src", "/reader/radical-succession/");
  await page
    .frameLocator("[data-animation-library-frame]")
    .locator("[data-kp-reader-equation-stage]")
    .waitFor();
  expect(
    await inspectSelectedHostLeasePool(page)
  ).toMatchObject({ limit: 2, waiting: 0 });
  expect((await inspectSelectedHostLeasePool(page)).active).toBeLessThanOrEqual(
    1
  );
  expect(
    documentRequests.filter((path) => path.startsWith("/reader/"))
  ).toEqual(["/reader/radical-succession/"]);

  const search = page.locator("[data-animation-library-search]");
  await search.fill("split and merge");
  await expect(page.locator("[data-animation-library-list] button")).toHaveCount(
    1
  );
  await page.locator("[data-animation-library-list] button").click();
  await expect(library).toHaveAttribute("data-animation-id", splitMergeId);
  await expect(frame).toHaveAttribute(
    "src",
    "/reader/split-merge-fractions/"
  );
  await expect(frame).toHaveCount(1);
  await page
    .frameLocator("[data-animation-library-frame]")
    .locator("[data-kp-reader-equation-stage]")
    .waitFor();
  expect((await inspectSelectedHostLeasePool(page)).active).toBeLessThanOrEqual(
    1
  );
  expect(
    documentRequests.filter((path) => path.startsWith("/reader/"))
  ).toEqual([
    "/reader/radical-succession/",
    "/reader/split-merge-fractions/"
  ]);
  await expect(page).toHaveURL(
    new RegExp(`animation=${splitMergeId.replaceAll(".", "\\.")}`)
  );

  await search.fill("Distribute, evaluate, and collect");
  await expect(page.locator("[data-animation-library-list] button")).toHaveCount(
    1
  );
  await page.locator("[data-animation-library-list] button").click();
  await expect(library).toHaveAttribute(
    "data-animation-id",
    foldableDistributionId
  );
  await expect(frame).toHaveAttribute(
    "src",
    "/reader/foldable-distribution/"
  );
  await page
    .frameLocator("[data-animation-library-frame]")
    .locator("[data-kp-reader-equation-stage]")
    .waitFor();
  expect(
    documentRequests.filter((path) => path.startsWith("/reader/"))
  ).toEqual([
    "/reader/radical-succession/",
    "/reader/split-merge-fractions/",
    "/reader/foldable-distribution/"
  ]);
  await expect(page.locator("[data-kp-dev-review-shell]")).toHaveCount(1);
  expect(pageErrors).toEqual([]);
});

test("deep links preserve representation and phone preview without overflow", async ({
  page
}) => {
  const route =
    "/canonical-animation-review.html" +
    `?animation=${encodeURIComponent(radicalId)}` +
    "&representation=library.diagnostic.radical-reconciliation" +
    "&viewport=phone";
  await page.goto(route);

  const library = page.locator("[data-kp-animation-library]");
  await expect(library).toHaveAttribute(
    "data-representation-id",
    "library.diagnostic.radical-reconciliation"
  );
  await expect(
    page.locator("[data-animation-library-frame]")
  ).toHaveAttribute(
    "src",
    /glyph-reconciliation-experiment\.html/
  );
  const viewport = page.locator(
    '[data-animation-library-viewport-shell="phone"]'
  );
  await expect.poll(() =>
    viewport.evaluate((element) => element.getBoundingClientRect().width)
  ).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth -
    document.documentElement.clientWidth
  )).toBeLessThanOrEqual(1);
});

test("operation evaluation opens in the wide focused player host", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_280, height: 900 });
  await page.goto(
    "/canonical-animation-review.html" +
    `?animation=${encodeURIComponent(operationEvaluationId)}`
  );

  const library = page.locator("[data-kp-animation-library]");
  const frameElement = page.locator("[data-animation-library-frame]");
  const frame = page.frameLocator("[data-animation-library-frame]");
  await expect(library).toHaveAttribute(
    "data-representation-id",
    "library.editor.operation-evaluation-focused-host"
  );
  await expect(frameElement).toHaveAttribute(
    "src",
    "/?view=animation-library-host&animation=" +
      "editor-animation.animation.operation-evaluation.one-plus-two"
  );
  await expect(frame.locator(
    "[data-kp-editor-animation-library-host]"
  )).toBeVisible();
  await expect(frame.locator(".editor-shell")).toHaveCount(0);
  await expect(frame.locator(
    "[data-kp-operation-evaluation-reference-comparison]"
  )).toBeVisible();
  await expect(frame.locator("[data-kp-dev-review-shell]")).toHaveCount(0);
  await expect(page.locator("[data-kp-dev-review-shell]")).toHaveCount(1);
  await expect(frameElement).toHaveCount(1);

  const hostWidth = await frame.locator(
    "[data-kp-editor-animation-library]"
  ).evaluate((element) => element.getBoundingClientRect().width);
  expect(hostWidth).toBeGreaterThan(800);
  await expect(frame.locator(
    "[data-kp-operation-evaluation-primary-panel]"
  )).toBeVisible();
  const diagnostic = frame.locator(
    "[data-kp-operation-evaluation-diagnostic]"
  );
  await expect(diagnostic).toHaveAttribute("aria-hidden", "true");
  await frame.locator(
    "[data-action=\"toggle-operation-evaluation-diagnostic\"]"
  ).click();
  await expect(diagnostic).toHaveAttribute("aria-hidden", "false");
  await expect(diagnostic.locator(
    "[data-kp-operation-evaluation-current-panel]"
  )).toBeVisible();
  await expect(diagnostic.locator(
    "[data-kp-operation-evaluation-stage]"
  )).toHaveAttribute("data-kp-operation-evaluation-status", "ready");
});

test("automatic fold schedules certify every product-settlement boundary frame", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_440, height: 1_000 });
  await page.goto(
    "/canonical-animation-review.html" +
    `?animation=${encodeURIComponent(foldableDistributionId)}`
  );
  const frame = page.frameLocator("[data-animation-library-frame]");
  await frame.locator("[data-kp-reader-equation-stage]").waitFor();
  await expect(
    frame.locator("select[data-kp-reader-fold-mode]")
  ).toHaveValue("automatic");

  for (const profile of ["wide", "phone"] as const) {
    await page.locator(
      `[data-animation-library-viewport="${profile}"]`
    ).click();
    await expect(
      page.locator("[data-animation-library-viewport-shell]")
    ).toHaveAttribute("data-animation-library-viewport-shell", profile);
    await settleReviewFrame(frame);

    const projection = compileKpFoldableDistributionAdaptiveProjection({
      intent: createKpFoldableDistributionFoldIntent({ mode: "automatic" }),
      detailBudget: profile === "wide" ? "roomy" : "compact"
    });
    const timeline =
      compileKpFoldableDistributionFoldTimeline(projection);
    const endpoint = timeline.checkpoints["products-evaluated"];
    const startPermille = Math.floor((endpoint - 0.025) * 1_000);
    const endPermille = Math.ceil((endpoint + 0.006) * 1_000);
    const reportedMoment = profile === "wide" ? 461 : 290;
    const samples = [...new Set([
      reportedMoment,
      ...Array.from(
        { length: endPermille - startPermille + 1 },
        (_value, index) => startPermille + index
      )
    ])].sort((left, right) => left - right);

    for (const progress of samples) {
      await seekReviewFrame(frame, progress);
      const evidence = await collectReviewPaintEvidence(frame, progress);
      expect(
        evidence.violations,
        JSON.stringify({ profile, endpoint, progress, evidence })
      ).toEqual([]);
      if (progress === reportedMoment) {
        expect(
          evidence.intersections,
          JSON.stringify({ profile, endpoint, progress, evidence })
        ).toEqual([]);
      }
    }
  }
});

test("phone review capture records the rendered fold boundary, not the outer window", async ({
  page
}) => {
  let request: KpDevReviewCreateRequestV2 | undefined;
  await page.route("**/api/dev/reviews/v2/notes", async (route) => {
    request = route.request().postDataJSON() as KpDevReviewCreateRequestV2;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ...request,
        id: "note.foldable-phone-boundary",
        sequence: 10,
        status: "new"
      })
    });
  });
  await page.setViewportSize({ width: 1_440, height: 1_000 });
  await page.goto(
    "/canonical-animation-review.html" +
    `?animation=${encodeURIComponent(foldableDistributionId)}` +
    "&viewport=phone"
  );
  const frame = page.frameLocator("[data-animation-library-frame]");
  await frame.locator("[data-kp-reader-equation-stage]").waitFor();
  await seekReviewFrame(frame, 290);

  const review = page.locator("[data-kp-dev-review-shell]");
  await review.locator("button.launcher").click();
  await review.locator("textarea").fill(
    "Phone automatic boundary at 29.0 percent."
  );
  await review.locator("button.save").click();
  await expect(review.locator("output.status")).toHaveText("Saved note 10.");

  expect(request?.capture.semantic.progressPermille).toBe(290);
  expect(request?.capture.semantic.animationProgressPermille)
    .toBeGreaterThanOrEqual(0);
  expect(request?.capture.semantic.phaseProgressPermille)
    .toBeGreaterThanOrEqual(0);
  expect(request?.capture.semantic.foldMode).toBe("automatic");
  expect(request?.capture.semantic.activeNodeId).toBeTruthy();
  expect(request?.capture.render.surface?.profile).toBe("phone");
  expect(request?.capture.render.surface?.contentViewport.width)
    .toBeLessThanOrEqual(390);
  expect(request?.capture.render.surface?.shellViewport.width)
    .toBeLessThanOrEqual(390);
});

test("fraction composition loads alone and review capture records its exact folded checkpoint", async ({
  page
}) => {
  let request: KpDevReviewCreateRequestV2 | undefined;
  await page.route("**/api/dev/reviews/v2/notes", async (route) => {
    request = route.request().postDataJSON() as KpDevReviewCreateRequestV2;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ...request,
        id: "note.fraction-composition-phone",
        sequence: 11,
        status: "new"
      })
    });
  });
  const documentRequests: string[] = [];
  page.on("request", (candidate) => {
    if (candidate.resourceType() === "document") {
      documentRequests.push(new URL(candidate.url()).pathname);
    }
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    "/canonical-animation-review.html" +
    `?animation=${encodeURIComponent(fractionCompositionId)}` +
    "&viewport=phone"
  );
  const library = page.locator("[data-kp-animation-library]");
  const frame = page.frameLocator("[data-animation-library-frame]");
  const stage = frame.locator("[data-kp-reader-equation-stage]");
  await expect(library).toHaveAttribute("data-animation-id", fractionCompositionId);
  await expect(library).toHaveAttribute("data-canonical-format", "partial");
  await stage.waitFor();
  await frame.locator("select[data-kp-reader-fold-mode]")
    .selectOption("collapsed");
  await seekReviewFrame(frame, 538);

  const review = page.locator("[data-kp-dev-review-shell]");
  const launcher = review.locator("button.launcher");
  await expect(launcher).toBeVisible();
  const launcherBox = await launcher.boundingBox();
  expect(launcherBox).not.toBeNull();
  expect((launcherBox?.x ?? 0) + (launcherBox?.width ?? 0))
    .toBeLessThanOrEqual(390);
  expect((launcherBox?.y ?? 0) + (launcherBox?.height ?? 0))
    .toBeLessThanOrEqual(844);
  await launcher.click();
  await review.locator("textarea").fill(
    "Fraction composition phone checkpoint capture."
  );
  await review.locator("button.save").click();
  await expect(review.locator("output.status")).toHaveText("Saved note 11.");

  expect(request?.capture.semantic.assetId).toBe(fractionCompositionId);
  expect(request?.capture.semantic.projectionId).toBe(
    "learner-experience.fraction-composition-scroll-lesson." +
    fractionCompositionId
  );
  expect(request?.capture.semantic.checkpointId).toBe(
    "beat.fraction-composition.difference-simplified"
  );
  expect(request?.capture.semantic.progressPermille).toBe(538);
  expect(request?.capture.semantic.animationProgressPermille)
    .toBeGreaterThanOrEqual(0);
  expect(request?.capture.semantic.phaseProgressPermille)
    .toBeGreaterThanOrEqual(0);
  expect(request?.capture.semantic.activePhase).toBeTruthy();
  expect(request?.capture.semantic.activeTransformationIds.length)
    .toBeGreaterThan(0);
  expect(request?.capture.semantic.foldMode).toBe("collapsed");
  expect(request?.capture.semantic.activeNodeId).toBeTruthy();
  expect(request?.capture.render.surface?.profile).toBe("phone");
  expect(request?.capture.render.surface?.contentViewport.width)
    .toBeLessThanOrEqual(390);
  expect(
    documentRequests.filter((path) => path.startsWith("/reader/"))
  ).toEqual(["/reader/fraction-composition/"]);
});

test("exact quantity wrapper capture records the inner checkpoint, phase, view, and fold", async ({
  page
}) => {
  let request: KpDevReviewCreateRequestV2 | undefined;
  await page.route("**/api/dev/reviews/v2/notes", async (route) => {
    request = route.request().postDataJSON() as KpDevReviewCreateRequestV2;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ...request,
        id: "note.exact-fraction-wrapper",
        sequence: 12,
        status: "new"
      })
    });
  });
  await page.goto(
    "/canonical-animation-review.html" +
    `?animation=${encodeURIComponent(exactFractionQuantityId)}` +
    "&viewport=phone"
  );
  const frame = page.frameLocator("[data-animation-library-frame]");
  const player = frame.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${exactFractionQuantityId}"]`
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await player.locator("[data-action=\"seek-editor-animation\"]")
    .fill("0.29");
  await expect.poll(() => player.evaluate((root) => {
    const committed = root.querySelector<HTMLElement>(
      "[data-kp-exact-symbolic-scene]" +
      "[data-kp-prepared-scene-state=\"committed\"]"
    );
    return committed?.dataset["kpExactSymbolicStatus"] === "ready" &&
      committed.dataset["kpExactSymbolicSegment"] ===
        root.dataset["kpExactSymbolicSegment"];
  })).toBe(true);
  await player.locator(
    "[data-kp-exact-active-view=\"number-line\"]"
  ).click();
  await player.locator("[data-kp-exact-fold-mode]")
    .selectOption("pinned");

  const review = page.locator("[data-kp-dev-review-shell]");
  await review.locator("button.launcher").click();
  await review.locator("textarea").fill(
    "Exact quantity canonical-host evidence."
  );
  await review.locator("button.save").click();
  await expect(review.locator("output.status")).toHaveText("Saved note 12.");

  expect(request?.capture.semantic).toMatchObject({
    assetId: exactFractionQuantityId,
    checkpointId: "checkpoint.exact-fraction.refined",
    progressPermille: 290,
    animationProgressPermille: 290,
    phaseProgressPermille: 500,
    projectionId: "number-line",
    activePhase: "action",
    activeTransformationIds: ["beat.exact-fraction.refine-third"],
    foldMode: "pinned"
  });
  expect(request?.capture.render.rendererId).toBe(
    "editor-animation-surface.exact-fraction-quantity.synchronized"
  );
  expect(request?.capture.environment.build.commit).toBe(
    expectedReviewCommit
  );
});

test("foldable distribution review matrix stays canonical in one wide or phone host", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 1_440, height: 1_000 });
  await page.goto(
    "/canonical-animation-review.html" +
    `?animation=${encodeURIComponent(foldableDistributionId)}`
  );
  const library = page.locator("[data-kp-animation-library]");
  const frameElement = page.locator("[data-animation-library-frame]");
  const frame = page.frameLocator("[data-animation-library-frame]");
  await expect(library).toHaveAttribute(
    "data-animation-id",
    foldableDistributionId
  );
  await expect(frameElement).toHaveCount(1);
  await expect(frameElement).toHaveAttribute(
    "src",
    "/reader/foldable-distribution/"
  );
  await frame.locator("[data-kp-reader-equation-stage]").waitFor();
  await frame.locator("select[data-kp-reader-fold-mode]")
    .selectOption("expanded");

  const seek = async (progress: number) => {
    const scrubber = frame.locator(
      "[data-kp-reader-attention-scrubber]"
    );
    await scrubber.evaluate((node, nextValue) => {
      const input = node as HTMLInputElement;
      input.value = String(nextValue);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, progress);
    await expect(frame.locator("body")).toHaveAttribute(
      "data-kp-reader-progress",
      String(progress)
    );
    await expect(frame.locator(
      "[data-kp-reader-accessible-equation] " +
      "[data-kp-reader-accessible-equation-state]:not([hidden])"
    )).toHaveCount(1);
    await frame.locator("body").evaluate(() =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
    );
  };
  const fitSurface = frame.locator(
    "[data-kp-reader-transition-active='true'] " +
    "[data-kp-reader-fit-surface]"
  );

  for (const viewport of ["wide", "phone"] as const) {
    await page.locator(
      `[data-animation-library-viewport="${viewport}"]`
    ).click();
    await expect(
      page.locator("[data-animation-library-viewport-shell]")
    ).toHaveAttribute(
      "data-animation-library-viewport-shell",
      viewport
    );
    await page.waitForTimeout(220);
    await frame.locator("body").evaluate(() =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
    );
    await seek(140);
    await expect(fitSurface).toHaveAttribute(
      "data-kp-native-katex-motion-profile",
      "canonical-copy-fan-out"
    );
    if (viewport === "phone") {
      await expect(
        frame.locator("[data-kp-reader-equation-stage]")
      ).toHaveAttribute(
        "data-kp-reader-fold-layout-policy",
        "semantic-two-row-stage"
      );
    }
    await seek(340);
    await expect(fitSurface).toHaveAttribute(
      "data-kp-native-katex-successor-synthesis-count",
      "2"
    );
    await seek(520);
    await expect(fitSurface).toHaveAttribute(
      "data-kp-native-katex-motion-profile",
      "canonical-semantic-reorder-and-group"
    );
    await seek(644);
    const overlapEvidence = await frame.locator("body").evaluate(
      async () => {
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
        const transition = document.querySelector<HTMLElement>(
          "[data-kp-reader-transition-active='true']"
        );
        if (stage === null || transition === null) {
          throw new Error("Library overlap checkpoint lacks its stage.");
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
        const observations = [
          ...[...transition.querySelectorAll<HTMLElement>(
            "[data-kp-reader-native]"
          )].flatMap((root) => {
            const authority = root.dataset["kpReaderNative"] === "source"
              ? "source-native" as const
              : "target-native" as const;
            return [...root.querySelectorAll<HTMLElement>(
              "[data-kp-reader-equation-anchor-id]"
            )].filter((anchor) =>
              anchor.dataset["kpFoldableEnvelopeId"] === undefined &&
              effectiveOpacity(anchor) > 0.01
            ).flatMap((anchor) => {
              const rect = measureKpNativeKatexSubtreePaintRect(stage, anchor);
              return rect === undefined ? [] : [{
                ownerId:
                  `native:${authority}:${
                    anchor.dataset["kpReaderEquationAnchorId"]
                  }`,
                semanticEntityId: anchor.dataset["kpReaderSelectorId"],
                rowId: anchor.closest<HTMLElement>(
                  "[data-kp-foldable-envelope-id]"
                )?.dataset["kpFoldableEnvelopeId"],
                authority,
                rect,
                opacity: effectiveOpacity(anchor)
              }];
            });
          }),
          ...[...document.querySelectorAll<HTMLElement>(
            "[data-kp-equation-material-owner-id]"
          )].flatMap((owner) => {
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
              ) as Array<{
                id: string;
                ownerIds: [string, string];
                reason:
                  | "native-handoff"
                  | "semantic-fusion"
                  | "semantic-fission"
                  | "semantic-reconciliation"
                  | "typographic-adjacency";
                phase:
                  | "transit"
                  | "fusion-contact"
                  | "native-settlement"
                  | "endpoint-typography";
                maximumOverlapWidthPx: number;
                maximumOverlapHeightPx: number;
              }>,
              authority: "material" as const,
              rect,
              opacity: effectiveOpacity(owner)
            }];
          })
        ];
        const report = inspectKpEquationVisiblePaintOverlap({
          progress: 0.644,
          viewportId: `${window.innerWidth}x${window.innerHeight}`,
          observations,
          contactTolerancePx: 0.75
        });
        return {
          viewportWidth: window.innerWidth,
          stageWidth: stage.getBoundingClientRect().width,
          layoutPolicy: document.querySelector<HTMLElement>(
            "[data-kp-reader-equation-stage]"
          )?.dataset["kpReaderFoldLayoutPolicy"],
          presentationOverlap: (() => {
            if (window.innerWidth > 880) return undefined;
            const stickyVisual = document.querySelector<HTMLElement>(
              "[data-kp-animation-static]"
            );
            const activeBeat = document.querySelector<HTMLElement>(
              "[data-kp-beat-active='true']"
            );
            if (stickyVisual === null || activeBeat === null) {
              throw new Error(
                "Phone overlap checkpoint lacks its sticky visual or active beat."
              );
            }
            const contentRects = [...activeBeat.children]
              .map((element) => element.getBoundingClientRect())
              .filter((rect) => rect.width > 0 && rect.height > 0);
            if (contentRects.length === 0) {
              throw new Error("Active phone beat lacks measurable narrative.");
            }
            const visualRect = stickyVisual.getBoundingClientRect();
            const contentTop = Math.min(...contentRects.map(({ top }) => top));
            const contentLeft = Math.min(...contentRects.map(({ left }) => left));
            const contentRight = Math.max(...contentRects.map(({ right }) => right));
            const horizontallyIntersects =
              contentRight > visualRect.left && contentLeft < visualRect.right;
            return {
              activeBeatId: activeBeat.dataset["kpBeat"],
              anchor: Number(
                document.body.dataset["kpReaderViewportAnchor"]
              ),
              contentTop,
              protectedVisualBottom: visualRect.bottom + 12,
              overlaps:
                horizontallyIntersects &&
                contentTop < visualRect.bottom + 12
            };
          })(),
          report,
          violations: evaluateKpEquationVisiblePaintCertifiedContacts({
            report,
            contactTolerancePx: 0.75
          }).violations
        };
      }
    );
    expect(
      overlapEvidence.violations,
      JSON.stringify({ viewport, overlapEvidence })
    ).toEqual([]);
    expect(
      overlapEvidence.presentationOverlap?.overlaps ?? false,
      JSON.stringify({ viewport, overlapEvidence })
    ).toBe(false);
    await seek(740);
    await expect(fitSurface).toHaveAttribute(
      "data-kp-native-katex-motion-profile",
      "canonical-factoring-fission-fusion"
    );
    await expect(fitSurface).toHaveAttribute(
      "data-kp-native-katex-factoring-synchronization",
      "simultaneous"
    );
    await seek(900);
    await expect(fitSurface).toHaveAttribute(
      "data-kp-native-katex-successor-synthesis-count",
      "2"
    );

    const geometry = await frame.locator("body").evaluate(() => {
      const active = document.querySelector<HTMLElement>(
        "[data-kp-reader-transition-active='true']"
      );
      const fit = active?.querySelector<HTMLElement>(
        "[data-kp-reader-fit-surface]"
      );
      const stage = document.querySelector<HTMLElement>(
        "[data-kp-reader-equation-stage]"
      );
      if (
        active === null ||
        fit === undefined ||
        fit === null ||
        stage === null
      ) {
        throw new Error("Library checkpoint lacks its active fitted stage.");
      }
      const accessible = document.querySelector<HTMLElement>(
        "[data-kp-reader-accessible-equation]"
      );
      return {
        documentOverflow:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
        fitStatus: fit.dataset["kpReaderEquationFitStatus"],
        fitWrapAllowed: fit.dataset["kpReaderEquationWrapAllowed"],
        appliedLayoutMemberCount: active.querySelectorAll(
          '[data-kp-equation-stage-layout-authority="applied-v1"]'
        ).length,
        layoutPolicy: stage.dataset["kpReaderFoldLayoutPolicy"],
        accessibleStateCount: accessible?.querySelectorAll(
          "[data-kp-reader-accessible-equation-state]:not([hidden])"
        ).length ?? 0
      };
    });
    expect(geometry.documentOverflow, JSON.stringify({ viewport, geometry }))
      .toBeLessThanOrEqual(1);
    expect(geometry.fitStatus).not.toBe("overflow");
    expect(geometry.fitWrapAllowed).toBe("false");
    expect(geometry.appliedLayoutMemberCount).toBeGreaterThan(0);
    expect(geometry.accessibleStateCount).toBe(1);
    expect(["single-row", "semantic-two-row-stage"])
      .toContain(geometry.layoutPolicy);
  }

  const review = page.locator("[data-kp-dev-review-shell]");
  await expect(review).toHaveCount(1);
  await expect(review.locator("button.launcher")).toBeVisible();
  const box = await review.locator("button.launcher").boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(
    page.viewportSize()!.height
  );
  expect(pageErrors).toEqual([]);
});

test("one review capture stays reachable while hosts switch and the page scrolls", async ({
  page
}) => {
  let request: KpDevReviewCreateRequestV2 | undefined;
  await page.route("**/api/dev/reviews/v2/notes", async (route) => {
    request = route.request().postDataJSON() as KpDevReviewCreateRequestV2;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ...request,
        id: "note.animation-library",
        sequence: 9,
        status: "new"
      })
    });
  });
  await page.goto("/canonical-animation-review.html");
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-dev-review-ready",
    "true"
  );

  const review = page.locator("[data-kp-dev-review-shell]");
  await expect(review).toHaveCount(1);
  await expect(review).toHaveAttribute(
    "data-kp-dev-review-placement",
    "bottom-right"
  );
  await expect(
    page
      .frameLocator("[data-animation-library-frame]")
      .locator("[data-kp-dev-review-shell]")
  ).toHaveCount(0);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(review.locator("button.launcher")).toBeVisible();
  const launcherBox = await review
    .locator("button.launcher")
    .boundingBox();
  expect(launcherBox).not.toBeNull();
  expect(launcherBox!.y + launcherBox!.height).toBeLessThanOrEqual(
    page.viewportSize()!.height
  );

  await review.locator("button.launcher").click();
  await expect(review.locator("textarea")).toBeEnabled();
  await review.locator("textarea").fill(
    "Keep this review control available while switching hosts."
  );

  await page.locator("[data-animation-library-search]").fill("solve for x");
  await page.locator("[data-animation-library-list] button").click();
  await expect(
    page.locator("[data-kp-animation-library]")
  ).toHaveAttribute(
    "data-animation-id",
    "animation.linear-solve.solve-x"
  );
  await expect(review.locator("textarea")).toHaveValue(
    "Keep this review control available while switching hosts."
  );
  await review.locator("button.save").click();
  await expect(review.locator("output.status")).toHaveText("Saved note 9.");

  expect(request?.capture.semantic.assetId).toBe(
    radicalId
  );
  expect(request?.capture.semantic.projectionId).toBe(
    "library.reader.radical-succession"
  );
  expect(request?.capture.semantic.documentId).toBe(
    "review.animation-library"
  );
  expect(request?.capture.render.surface?.profile).toBe("wide");
  expect(
    request?.capture.render.surface?.contentViewport.width
  ).toBeGreaterThan(880);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(review).toHaveAttribute(
    "data-kp-dev-review-placement",
    "captured-moment-sheet"
  );
});

async function seekReviewFrame(
  frame: FrameLocator,
  progress: number
): Promise<void> {
  const scrubber = frame.locator("[data-kp-reader-attention-scrubber]");
  await scrubber.evaluate((node, nextValue) => {
    const input = node as HTMLInputElement;
    input.value = String(nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, progress);
  await expect(frame.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    String(progress)
  );
  await settleReviewFrame(frame);
}

async function settleReviewFrame(frame: FrameLocator): Promise<void> {
  await frame.locator("body").evaluate(() =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )
  );
}

async function collectReviewPaintEvidence(
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
    const transition = document.querySelector<HTMLElement>(
      "[data-kp-reader-transition-active='true']"
    );
    if (stage === null || transition === null) {
      throw new Error("Review paint census lacks its active stage.");
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
    const observations = [
      ...[...transition.querySelectorAll<HTMLElement>(
        "[data-kp-reader-native]"
      )].flatMap((root) => {
        const authority = root.dataset["kpReaderNative"] === "source"
          ? "source-native" as const
          : "target-native" as const;
        return [...root.querySelectorAll<HTMLElement>(
          "[data-kp-reader-equation-anchor-id]"
        )].filter((anchor) =>
          anchor.dataset["kpFoldableEnvelopeId"] === undefined &&
          effectiveOpacity(anchor) > 0.01
        ).flatMap((anchor) => {
          const rect = measureKpNativeKatexSubtreePaintRect(stage, anchor);
          return rect === undefined ? [] : [{
            ownerId:
              `native:${authority}:${
                anchor.dataset["kpReaderEquationAnchorId"]
              }`,
            semanticEntityId: anchor.dataset["kpReaderSelectorId"],
            authority,
            rect,
            opacity: effectiveOpacity(anchor)
          }];
        });
      }),
      ...[...document.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )].flatMap((owner) => {
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
    const evaluation = evaluateKpEquationVisiblePaintCertifiedContacts({
      report,
      contactTolerancePx: 0.75
    });
    const equationStage = document.querySelector<HTMLElement>(
      "[data-kp-reader-equation-stage]"
    );
    const reviewFrame = JSON.parse(
      document.body.dataset["kpReaderReviewFrame"] ?? "[0,0,\"\",[]]"
    ) as [number, number, string, string[]];
    return {
      semanticProgressPermille: Number(
        document.body.dataset["kpReaderProgress"]
      ),
      animationProgressPermille: reviewFrame[0],
      phaseProgressPermille: reviewFrame[1],
      transitionId: document.body.dataset["kpReaderTransition"],
      activeNodeId: equationStage?.dataset["kpReaderFoldActiveNode"],
      foldMode: equationStage?.dataset["kpReaderFoldMode"],
      foldDetail: equationStage?.dataset["kpReaderFoldPhaseDetail"],
      layoutPolicy: equationStage?.dataset["kpReaderFoldLayoutPolicy"],
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      },
      intersections: report.intersections,
      allowed: evaluation.allowed,
      violations: evaluation.violations
    };
  }, progressPermille);
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

async function inspectSelectedHostLeasePool(page: Page): Promise<{
  readonly limit: number;
  readonly active: number;
  readonly waiting: number;
}> {
  return page
    .frameLocator("[data-animation-library-frame]")
    .locator("body")
    .evaluate(async () => {
      const poolUrl = "/src/rendering/webgl-context-lease-pool.ts";
      const pool = await import(/* @vite-ignore */ poolUrl);
      return pool.inspectKpWebglContextLeasePool(document);
    });
}
