import { expect, test } from "@playwright/test";

test("reader equation fit applies a centered no-wrap transform", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const modulePath = "/src/reader/renderers/equation-responsive-fit.ts";
    const {
      applyKpReaderEquationResponsiveFit,
      planKpReaderEquationResponsiveFit
    } = await import(modulePath);
    document.body.innerHTML = [
      '<div id="stage" style="position:relative;width:180px;height:60px">',
      '<div id="surface" style="position:absolute;width:200px;height:40px">x + 3 - 3 = 7 - 3</div>',
      "</div>"
    ].join("");
    const alignment = {
      id: "alignment.browser",
      kind: "reader-equation-perceptual-alignment-plan",
      layoutSnapshotId: "layout.browser",
      measurementIdentity: {
        revision: 1,
        coordinateSpaceId: "fixture.browser-stage"
      },
      correction: { x: 0, y: 0, rawX: 0, rawY: 0, clamped: false },
      owners: [{
        ownerId: "owner.browser",
        sourceBounds: { left: 0, top: 0, width: 200, height: 40 },
        targetBounds: { left: 0, top: 0, width: 200, height: 40 }
      }]
    };
    const fit = planKpReaderEquationResponsiveFit({
      alignment,
      viewportWidth: 180,
      viewportHeight: 60,
      horizontalPadding: 10,
      verticalPadding: 10,
      minScale: 0.7
    });
    const surface = document.querySelector<HTMLElement>("#surface")!;
    const stage = document.querySelector<HTMLElement>("#stage")!;
    applyKpReaderEquationResponsiveFit(surface, fit);
    const surfaceRect = surface.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    return {
      status: surface.dataset["kpReaderEquationFitStatus"],
      wrapAllowed: surface.dataset["kpReaderEquationWrapAllowed"],
      whiteSpace: surface.style.whiteSpace,
      scale: fit.scale,
      leftInset: surfaceRect.left - stageRect.left,
      rightInset: stageRect.right - surfaceRect.right,
      contentCenterY: surfaceRect.top + 20 * fit.scale - stageRect.top
    };
  });

  expect(result.status).toBe("scaled");
  expect(result.wrapAllowed).toBe("false");
  expect(result.whiteSpace).toBe("nowrap");
  expect(result.scale).toBe(0.8);
  expect(result.leftInset).toBeCloseTo(10, 4);
  expect(result.rightInset).toBeCloseTo(10, 4);
  expect(result.contentCenterY).toBeCloseTo(30, 4);
});
