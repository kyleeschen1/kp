import { expect, test } from "@playwright/test";
import type {
  KpPlaceValueAdditionNavigationSession
} from "../src/rendering/place-value-addition-navigation.ts";
import type {
  KpPlaceValueAdditionResponsiveSurface
} from "../src/rendering/place-value-addition-responsive-surface.ts";
import type {
  KpDevReviewCaptureProvider
} from "../src/dev-review/capture-provider.ts";
import {
  kpDevReviewNoteV2Schema
} from "../protocols/dev-review-v2-schema.ts";

const placeValueBrowserHostPath =
  "/tests/fixtures/place-value-addition-browser-host.html";

for (const viewport of [
  { name: "wide", width: 1180, height: 800 },
  { name: "phone", width: 320, height: 700 }
] as const) {
  test(`${viewport.name} responsive surface is centered readable and uncrowded`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await page.goto(placeValueBrowserHostPath);
    const evidence = await page.evaluate(async ({ width, height, name }) => {
      const navigationUrl =
        "/src/rendering/place-value-addition-navigation.ts";
      const surfaceUrl =
        "/src/rendering/place-value-addition-responsive-surface.ts";
      const overlapUrl =
        "/src/rendering/equation-visible-paint-overlap.ts";
      const geometryUrl =
        "/src/rendering/native-katex-paint-geometry.ts";
      const navigationModule = await import(
        /* @vite-ignore */ navigationUrl
      );
      const surfaceModule = await import(/* @vite-ignore */ surfaceUrl);
      const overlap = await import(/* @vite-ignore */ overlapUrl);
      const geometry = await import(/* @vite-ignore */ geometryUrl);
      const navigation =
        navigationModule.createKpPlaceValueAdditionNavigationSession({
          viewportWidth: width,
          selectedView: "written"
        }) as KpPlaceValueAdditionNavigationSession;
      const surface =
        surfaceModule.createKpPlaceValueAdditionResponsiveSurface({
          document,
          navigation
        }) as KpPlaceValueAdditionResponsiveSurface;
      const app = document.querySelector<HTMLElement>("#app");
      if (app !== null) app.style.display = "none";
      Object.assign(document.body.style, {
        margin: "0",
        minHeight: "100vh",
        display: "grid",
        placeItems: "center"
      });
      surface.root.style.inlineSize = `${width - 16}px`;
      document.body.append(surface.root);
      await document.fonts.ready;
      await surface.shared.prepareNativeScenesWhenReady();

      const writtenHost = surface.shared.root.querySelector<HTMLElement>(
        '[data-kp-place-value-view="written"]'
      )!;
      const effectiveOpacity = (
        element: HTMLElement,
        boundary: HTMLElement
      ): number => {
        let opacity = 1;
        let current: HTMLElement | null = element;
        while (current !== null) {
          opacity *= Number(getComputedStyle(current).opacity);
          if (current === boundary) break;
          current = current.parentElement;
        }
        return opacity;
      };
      const activeStage = (): HTMLElement => {
        const stages = [...writtenHost.children].filter(
          (node): node is HTMLElement =>
            node instanceof HTMLElement &&
            getComputedStyle(node).display !== "none"
        );
        const persistentComposite =
          stages.length === 2 &&
          stages.some((stage) =>
            stage.hasAttribute("data-kp-place-value-written-ownership")
          ) &&
          stages.some((stage) =>
            stage.hasAttribute("data-kp-place-value-written-overlay")
          );
        if (persistentComposite) {
          // The scaffold and its absolute proxy layer are one logical stage.
          return writtenHost;
        }
        if (stages.length !== 1) {
          throw new Error(
            `Expected one logical active stage, received ${stages.length}.`
          );
        }
        return stages[0]!;
      };
      const inspect = (progress: number) => {
        const stage = activeStage();
        const persistent = stage.querySelector<HTMLElement>(
          "[data-kp-place-value-written-ownership]"
        );
        const endpoint = persistent ?? [
          ...(stage.hasAttribute("data-kp-place-value-written-projection")
            ? [stage]
            : []),
          ...stage.querySelectorAll<HTMLElement>(
            "[data-kp-place-value-operation-endpoint]"
          )
        ].find((candidate) =>
          effectiveOpacity(candidate, stage) > 0.01
        ) ?? stage;
        const grid = endpoint.querySelector<HTMLElement>(
          "[data-kp-place-value-grid]"
        )!;
        const stageRect = stage.getBoundingClientRect();
        const writtenRect = writtenHost.getBoundingClientRect();
        const gridRect = grid.getBoundingClientRect();
        const paintScopes = stage === writtenHost
          ? [...writtenHost.children].filter(
              (node): node is HTMLElement =>
                node instanceof HTMLElement &&
                getComputedStyle(node).display !== "none"
            )
          : [stage];
        const observations = [
          ...paintScopes.flatMap((scope) => [
            ...scope.querySelectorAll<HTMLElement>(
              "[data-kp-place-value-native-root]" +
              "[data-kp-semantic-entity-id]"
            )
          ]).flatMap((root) => {
            const opacity = effectiveOpacity(root, stage);
            if (
              opacity <= 0.01 ||
              getComputedStyle(root).visibility === "hidden"
            ) {
              return [];
            }
            const rect =
              geometry.measureKpNativeKatexSubtreePaintRect(stage, root);
            if (rect === undefined) return [];
            const ownerEndpoint = root.closest<HTMLElement>(
              "[data-kp-place-value-operation-endpoint]"
            )?.dataset["kpPlaceValueOperationEndpoint"];
            const authority =
              ownerEndpoint === "target"
                ? "target-native" as const
                : "source-native" as const;
            return [{
              ownerId:
                root.dataset["kpEquationPaintOwnerId"] ??
                (
                  `native:${ownerEndpoint ?? "persistent"}:` +
                  `${root.dataset["kpSemanticEntityId"]}`
                ),
              semanticEntityId: root.dataset["kpSemanticEntityId"],
              semanticContacts: JSON.parse(
                root.dataset["kpEquationSemanticContacts"] ?? "[]"
              ),
              rowId: root.dataset["kpPlaceValueRow"],
              authority,
              rect,
              opacity
            }];
          }),
          ...paintScopes.flatMap((scope) => [
            ...scope.querySelectorAll<HTMLElement>(
              "[data-kp-equation-material-owner-id]"
            )
          ]).flatMap((owner) => {
            const visual = owner.firstElementChild;
            const opacity = effectiveOpacity(owner, stage);
            if (!(visual instanceof HTMLElement) || opacity <= 0.01) {
              return [];
            }
            const rect =
              geometry.measureKpNativeKatexSubtreePaintRect(stage, visual);
            if (rect === undefined) return [];
            return [{
              ownerId: owner.dataset["kpEquationMaterialOwnerId"] ?? "",
              semanticEntityId:
                owner.dataset["kpEquationMaterialSemanticEntityId"],
              semanticContacts: JSON.parse(
                owner.dataset["kpEquationMaterialSemanticContacts"] ?? "[]"
              ),
              authority: "material" as const,
              rect,
              opacity
            }];
          })
        ];
        const report = overlap.inspectKpEquationVisiblePaintOverlap({
          progress,
          viewportId: `${name}-${width}x${height}`,
          observations,
          contactTolerancePx: 0.75
        });
        const contacts =
          overlap.evaluateKpEquationVisiblePaintCertifiedContacts({
            report,
            contactTolerancePx: 0.75
          });
        const left = Math.min(...observations.map(
          ({ rect }: { rect: { left: number } }) => rect.left
        ));
        const right = Math.max(...observations.map(
          ({ rect }: { rect: { left: number; width: number } }) =>
            rect.left + rect.width
        ));
        return {
          progress,
          activeStageCount: 1,
          fontSize: Number.parseFloat(getComputedStyle(grid).fontSize),
          centerDelta:
            Math.abs(
              gridRect.left + gridRect.width / 2 -
              (writtenRect.left + writtenRect.width / 2)
            ),
          overflow:
            Math.max(
              0,
              writtenRect.left - stageRect.left - left,
              right - (writtenRect.right - stageRect.left)
            ),
          observationCount: report.observationCount,
          overlapPassed: contacts.passed,
          violationCount: contacts.violations.length,
          violations: contacts.violations.map(
            (violation: {
              leftOwnerId: string;
              rightOwnerId: string;
              leftSemanticContacts?: unknown;
              rightSemanticContacts?: unknown;
              width: number;
              height: number;
            }) => ({
              left: violation.leftOwnerId,
              right: violation.rightOwnerId,
              leftContacts: violation.leftSemanticContacts,
              rightContacts: violation.rightSemanticContacts,
              width: violation.width,
              height: violation.height
            })
          )
        };
      };

      const samples = [];
      const progressSamples = [...new Set([
        ...Array.from({ length: 41 }, (_, index) => index / 40),
        0, 0.1, 0.175, 0.249, 0.25, 0.325, 0.399, 0.4,
        0.48, 0.559, 0.56, 0.635, 0.709, 0.71, 0.79,
        0.869, 0.87, 0.96, 1
      ])].sort((left, right) => left - right);
      for (const progress of progressSamples) {
        surface.apply(navigation.sampleProgress({
          progress,
          source: "controls"
        }));
        try {
          samples.push(inspect(progress));
        } catch (error) {
          throw new Error(
            `Responsive paint inspection failed at ${progress}: ` +
            `${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      const rootRect = surface.root.getBoundingClientRect();
      const outlineBefore = surface.outlineRoot.getBoundingClientRect();
      surface.outlineRoot.scrollTop = surface.outlineRoot.scrollHeight;
      const outlineAfter = surface.outlineRoot.getBoundingClientRect();
      return {
        mode: surface.root.dataset["kpPlaceValueResponsiveMode"],
        fit: surface.root.dataset["kpPlaceValueEquationFit"],
        motionGeometry:
          surface.root.dataset["kpPlaceValueMotionGeometry"],
        reviewOwner: surface.root.dataset["kpReviewAccessOwner"],
        root: {
          left: rootRect.left,
          right: rootRect.right,
          top: rootRect.top,
          bottom: rootRect.bottom
        },
        outline: {
          overflowY: getComputedStyle(surface.outlineRoot).overflowY,
          clientHeight: surface.outlineRoot.clientHeight,
          scrollHeight: surface.outlineRoot.scrollHeight,
          scrollTop: surface.outlineRoot.scrollTop,
          fixedPositionDescendants: [
            ...surface.root.querySelectorAll<HTMLElement>("*")
          ].filter((element) => {
            const position = getComputedStyle(element).position;
            return position === "fixed" || position === "sticky";
          }).length,
          rectStable:
            outlineBefore.left === outlineAfter.left &&
            outlineBefore.top === outlineAfter.top
        },
        samples
      };
    }, viewport);

    expect(evidence.mode).toBe(
      viewport.name === "wide" ? "wide-both" : "phone-selected"
    );
    expect(evidence.fit).toBe("intrinsic-native-no-wrap");
    expect(evidence.motionGeometry).toBe("viewport-independent");
    expect(evidence.reviewOwner).toBe(
      "external-animation-library-review"
    );
    expect(evidence.root.left).toBeGreaterThanOrEqual(0);
    expect(evidence.root.right).toBeLessThanOrEqual(viewport.width);
    expect(evidence.root.top).toBeGreaterThanOrEqual(0);
    expect(evidence.root.bottom).toBeLessThanOrEqual(viewport.height);
    expect(evidence.outline.overflowY).toBe("auto");
    expect(evidence.outline.scrollHeight).toBeGreaterThan(
      evidence.outline.clientHeight
    );
    expect(evidence.outline.scrollTop).toBeGreaterThan(0);
    expect(evidence.outline.fixedPositionDescendants).toBe(0);
    expect(evidence.outline.rectStable).toBe(true);
    for (const sample of evidence.samples) {
      expect(sample.activeStageCount).toBe(1);
      expect(sample.fontSize).toBeGreaterThanOrEqual(32);
      expect(sample.centerDelta).toBeLessThanOrEqual(1);
      expect(sample.overflow).toBeLessThanOrEqual(1);
      expect(sample.observationCount).toBeGreaterThan(0);
      expect(
        sample.overlapPassed,
        JSON.stringify(sample)
      ).toBe(true);
      expect(sample.violationCount).toBe(0);
    }
  });
}

test("responsive layout is invariant in CSS pixels at DPR 1 and 2", async ({
  browser
}) => {
  const snapshots = [];
  for (const deviceScaleFactor of [1, 2]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 700 },
      deviceScaleFactor
    });
    const page = await context.newPage();
    await page.goto(
      "http://127.0.0.1:4173/tests/fixtures/place-value-addition-browser-host.html"
    );
    snapshots.push(await page.evaluate(async () => {
      const navigationUrl =
        "/src/rendering/place-value-addition-navigation.ts";
      const surfaceUrl =
        "/src/rendering/place-value-addition-responsive-surface.ts";
      const navigationModule = await import(
        /* @vite-ignore */ navigationUrl
      );
      const surfaceModule = await import(/* @vite-ignore */ surfaceUrl);
      const navigation =
        navigationModule.createKpPlaceValueAdditionNavigationSession({
          viewportWidth: 390,
          selectedView: "written"
        }) as KpPlaceValueAdditionNavigationSession;
      const surface =
        surfaceModule.createKpPlaceValueAdditionResponsiveSurface({
          document,
          navigation
        }) as KpPlaceValueAdditionResponsiveSurface;
      const app = document.querySelector<HTMLElement>("#app");
      if (app !== null) app.style.display = "none";
      document.body.append(surface.root);
      await document.fonts.ready;
      await surface.shared.prepareNativeScenesWhenReady();
      surface.apply(navigation.seekOutline("outline.place-value.tens"));
      const written = surface.root.querySelector<HTMLElement>(
        '[data-kp-place-value-view="written"]'
      )!;
      const grid = written.querySelector<HTMLElement>(
        '[data-kp-place-value-written-ownership="persistent-documentary"] ' +
        "[data-kp-place-value-grid]"
      )!;
      const rect = grid.getBoundingClientRect();
      return {
        devicePixelRatio: window.devicePixelRatio,
        width: rect.width,
        height: rect.height,
        fontSize: getComputedStyle(grid).fontSize
      };
    }));
    await context.close();
  }

  expect(snapshots.map(({ devicePixelRatio }) => devicePixelRatio))
    .toEqual([1, 2]);
  expect(Math.abs(snapshots[0]!.width - snapshots[1]!.width))
    .toBeLessThanOrEqual(0.25);
  expect(Math.abs(snapshots[0]!.height - snapshots[1]!.height))
    .toBeLessThanOrEqual(0.25);
  expect(snapshots[0]!.fontSize).toBe(snapshots[1]!.fontSize);
});

test("accessibility keyboard and Review metadata share the sealed frame", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto(placeValueBrowserHostPath);
  const initial = await page.evaluate(async () => {
    const navigationUrl =
      "/src/rendering/place-value-addition-navigation.ts";
    const surfaceUrl =
      "/src/rendering/place-value-addition-responsive-surface.ts";
    const reviewUrl =
      "/src/dev-review/editor-animation-library-capture-provider.ts";
    const reviewBootstrapUrl =
      "/src/dev-review/editor-animation-library-review-bootstrap.ts";
    const toolbarUrl =
      "/src/dev-toolbar/development-toolbar-bootstrap.ts";
    const navigationModule = await import(
      /* @vite-ignore */ navigationUrl
    );
    const surfaceModule = await import(
      /* @vite-ignore */ surfaceUrl
    );
    const reviewModule = await import(
      /* @vite-ignore */ reviewUrl
    );
    const reviewBootstrapModule = await import(
      /* @vite-ignore */ reviewBootstrapUrl
    );
    const toolbarModule = await import(
      /* @vite-ignore */ toolbarUrl
    );
    const navigation =
      navigationModule.createKpPlaceValueAdditionNavigationSession({
        viewportWidth: 390,
        selectedView: "written"
      }) as KpPlaceValueAdditionNavigationSession;
    const surface =
      surfaceModule.createKpPlaceValueAdditionResponsiveSurface({
        document,
        navigation
      }) as KpPlaceValueAdditionResponsiveSurface;
    document.querySelector(
      "[data-kp-editor-animation-library]"
    )?.remove();
    const library = document.createElement("main");
    library.dataset["kpEditorAnimationLibrary"] = "";
    const player = document.createElement("article");
    player.dataset["kpEditorAnimationPlayer"] = "";
    player.dataset["kpEditorAnimationId"] =
      "animation.place-value-addition.278-plus-156";
    player.dataset["kpEditorAnimationDescriptorId"] =
      "editor-animation.animation.place-value-addition.278-plus-156";
    player.dataset["kpEditorAnimationDirection"] = "forward";
    const stage = document.createElement("section");
    stage.dataset["kpEditorAnimationStage"] = "";
    stage.dataset["kpEditorAnimationSurface"] =
      "editor-animation-surface.place-value-addition";
    stage.append(surface.root);
    player.append(stage);
    library.append(player);
    document.body.append(library);
    await surface.shared.prepareNativeScenesWhenReady();
    surface.apply(navigation.sampleProgress({
      progress: 0.635,
      source: "controls"
    }));

    const provider =
      reviewModule.createKpEditorAnimationLibraryCaptureProvider(
        document
      ) as KpDevReviewCaptureProvider;
    const captured = await provider.capture({
      route: new URL(location.href),
      capturedAtMs: performance.now(),
      eventTarget: null
    });
    toolbarModule.mountKpDevelopmentToolbar(window);
    reviewBootstrapModule.mountKpEditorAnimationLibraryDevReview(window);
    return {
      visualAriaHidden:
        surface.shared.root.getAttribute("aria-hidden"),
      transcriptSteps: surface.transcriptRoot.querySelectorAll(
        "[data-kp-place-value-transcript-step]"
      ).length,
      currentTranscript: surface.transcriptRoot.querySelector(
        "[data-kp-place-value-transcript-step][aria-current=\"step\"]"
      )?.getAttribute("data-kp-place-value-transcript-step"),
      mathmlCount: surface.accessibleStateRoot.querySelectorAll(
        ".katex-mathml"
      ).length,
      viewControlsDisplay:
        getComputedStyle(surface.viewControlsRoot).display,
      review: captured
    };
  });

  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-dev-review-ready",
    "true",
    { timeout: 15_000 }
  );

  expect(initial.visualAriaHidden).toBe("true");
  expect(initial.transcriptSteps).toBe(7);
  expect(initial.currentTranscript).toBe(
    "beat.place-value.exchange-tens"
  );
  expect(initial.mathmlCount).toBe(1);
  expect(initial.viewControlsDisplay).toBe("flex");
  expect(initial.review.semantic).toMatchObject({
    assetId: "animation.place-value-addition.278-plus-156",
    progressPermille: 635,
    animationProgressPermille: 635,
    phaseProgressPermille: 500,
    projectionId: "written",
    checkpointId: "checkpoint.place-value.4",
    activeTransformationIds: ["beat.place-value.exchange-tens"],
    activePhase: "action",
    foldMode: "automatic",
    layoutPolicy: "phone-selected"
  });
  expect(initial.review.semantic.focusRefs.length).toBeGreaterThan(0);
  expect(initial.review.render.surface?.contentViewport).toMatchObject({
    width: 390,
    height: 700
  });

  const baseTen = page.locator(
    "button[data-kp-place-value-view-button=\"base-ten\"]"
  );
  await baseTen.focus();
  await baseTen.press("Enter");
  await expect(baseTen).toBeFocused();
  await expect(baseTen).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-kp-place-value-responsive-surface]"))
    .toHaveAttribute(
      "data-kp-place-value-active-representation",
      "base-ten"
    );

  const tens = page.locator(
    "button[data-kp-place-value-outline-anchor=\"outline.place-value.tens\"]"
  );
  await tens.focus();
  await tens.press("Enter");
  await expect(tens).toBeFocused();
  await expect(tens).toHaveAttribute("aria-current", "step");
  await expect(page.locator("[data-kp-place-value-responsive-surface]"))
    .toHaveAttribute("data-kp-place-value-progress-permille", "400");
  await expect(
    page.locator("[data-kp-place-value-transcript-step][aria-current=\"step\"]")
  ).toHaveAttribute(
    "data-kp-place-value-transcript-step",
    "beat.place-value.evaluate-tens"
  );
  await expect(
    page.locator(
      "[data-kp-place-value-responsive-surface] " +
      "[data-kp-dev-review-shell]"
    )
  ).toHaveCount(0);

  const review = page.locator("[data-kp-dev-review-shell]");
  const toolbar = page.locator("[data-kp-dev-toolbar]");
  await expect(toolbar.getByRole("button", { name: "Review" })).toBeVisible();
  await toolbar.getByRole("button", { name: "Review" }).click();
  await review.locator("textarea").fill(
    "Place-value Review round-trip proof."
  );
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/dev/reviews/v2/notes") &&
    response.request().method() === "POST"
  );
  await review.locator("button.save").click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  const note = kpDevReviewNoteV2Schema.parse(await response.json());
  expect(note.capture.semantic).toMatchObject({
    assetId: "animation.place-value-addition.278-plus-156",
    progressPermille: 400,
    animationProgressPermille: 400,
    phaseProgressPermille: 0,
    projectionId: "base-ten",
    checkpointId: "checkpoint.place-value.3",
    activeTransformationIds: ["beat.place-value.evaluate-tens"],
    activePhase: "setup",
    foldMode: "automatic",
    layoutPolicy: "phone-selected"
  });
  expect(note.capture.render.surface?.profile).toBe("phone");
  expect(note.capture.render.surface?.contentViewport).toMatchObject({
    width: 390,
    height: 700
  });
});
