import { expect, test } from "@playwright/test";
import type {
  KpPlaceValueAdditionNavigationSession
} from "../src/rendering/place-value-addition-navigation.ts";
import type {
  KpPlaceValueAdditionResponsiveSurface
} from "../src/rendering/place-value-addition-responsive-surface.ts";

for (const viewport of [
  { name: "wide", width: 1180, height: 800 },
  { name: "phone", width: 320, height: 700 }
] as const) {
  test(`${viewport.name} responsive surface is centered readable and uncrowded`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
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
        if (stages.length !== 1) {
          throw new Error(`Expected one active stage, received ${stages.length}.`);
        }
        return stages[0]!;
      };
      const inspect = (progress: number) => {
        const stage = activeStage();
        const endpoint = [
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
        const observations = [
          ...[...stage.querySelectorAll<HTMLElement>(
            "[data-kp-place-value-native-root]" +
            "[data-kp-semantic-entity-id]"
          )].flatMap((root) => {
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
                `native:${authority}:` +
                `${root.dataset["kpSemanticEntityId"]}`,
              semanticEntityId: root.dataset["kpSemanticEntityId"],
              rowId: root.dataset["kpPlaceValueRow"],
              authority,
              rect,
              opacity
            }];
          }),
          ...[...stage.querySelectorAll<HTMLElement>(
            "[data-kp-equation-material-owner-id]"
          )].flatMap((owner) => {
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
              width: number;
              height: number;
            }) => ({
              left: violation.leftOwnerId,
              right: violation.rightOwnerId,
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
        samples.push(inspect(progress));
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
    await page.goto("http://127.0.0.1:4173/");
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
      surface.apply(navigation.seekOutline("outline.place-value.tens"));
      const written = surface.root.querySelector<HTMLElement>(
        '[data-kp-place-value-view="written"]'
      )!;
      const active = [...written.children].find(
        (node) =>
          node instanceof HTMLElement &&
          getComputedStyle(node).display !== "none"
      ) as HTMLElement;
      const grid = active.querySelector<HTMLElement>(
        '[data-kp-place-value-operation-endpoint="source"] ' +
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
