import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpExactFractionQuantityRuntimeSession,
  sampleKpExactFractionQuantityRuntime
} from "../src/rendering/exact-fraction-quantity-runtime.ts";
import {
  certifyKpExactFractionQuantityResponsiveLayout,
  checkKpExactFractionQuantityResponsiveLayout,
  isKpExactFractionQuantityResponsiveLayout
} from "../src/reader/runtime/exact-fraction-quantity-responsive-layout.ts";
import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../src/reader/compiler/exact-fraction-quantity-preservation-manifest.ts";

test("review viewports certify wide grid and phone focus without overlap", () => {
  const runtimeFrame = frame(0.5);
  for (const viewport of manifest.presentation.reviewViewports) {
    const layout = certifyKpExactFractionQuantityResponsiveLayout({
      runtimeFrame,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      deviceScaleFactor: viewport.deviceScaleFactor,
      activeView: "fraction-bar"
    });

    assert.ok(isKpExactFractionQuantityResponsiveLayout(layout));
    assert.deepEqual(checkKpExactFractionQuantityResponsiveLayout(layout), []);
    assert.equal(layout.readabilityFloorSatisfied, true);
    assert.ok(layout.slots.every(({ mathFontPx }) =>
      mathFontPx >= manifest.presentation.minimumMathFontPx
    ));
    assert.ok(layout.slots.every(({ scale }) => scale === 1));
    assert.equal(
      layout.slots.filter(({ visibility }) => visibility === "visible").length,
      viewport.width >= 760 ? 4 : 1
    );
  }
});

test("phone switching changes only the active projection and preserves focus", () => {
  const runtimeFrame = frame(0.18);
  const layouts = manifest.viewObligations.map((activeView) =>
    certifyKpExactFractionQuantityResponsiveLayout({
      runtimeFrame,
      viewportWidth: 390,
      viewportHeight: 844,
      activeView
    })
  );
  const expectedFocus = runtimeFrame.projection.selectionCorrespondences
    .filter(({ focused }) => focused)
    .map(({ selectionId }) => selectionId);

  assert.deepEqual(
    layouts.map(({ activeView }) => activeView),
    manifest.viewObligations
  );
  for (const layout of layouts) {
    const visible = layout.slots.filter(
      ({ visibility }) => visibility === "visible"
    );
    assert.equal(visible.length, 1);
    assert.equal(visible[0]?.view, layout.activeView);
    assert.deepEqual(
      visible[0]?.semanticFocusSelectionIds,
      expectedFocus
    );
    assert.equal(layout.viewSwitcherVisible, true);
    assert.deepEqual(layout.viewOrder, manifest.viewObligations);
  }
});

test("wide slots and intrinsic content remain centered and contained", () => {
  const layout = certifyKpExactFractionQuantityResponsiveLayout({
    runtimeFrame: frame(0.72),
    viewportWidth: 1_100,
    viewportHeight: 800,
    deviceScaleFactor: 2
  });

  assert.equal(layout.mode, "wide-grid");
  for (const slot of layout.slots) {
    assert.ok(
      Math.abs(
        center(slot.rect, "x") - center(slot.contentRect, "x")
      ) < 1e-9
    );
    assert.ok(
      Math.abs(
        center(slot.rect, "y") - center(slot.contentRect, "y")
      ) < 1e-9
    );
  }
});

test("resize and DPR changes invalidate measurement without changing semantics", () => {
  const runtimeFrame = frame(0.72);
  const base = certifyKpExactFractionQuantityResponsiveLayout({
    runtimeFrame,
    viewportWidth: 390,
    viewportHeight: 844,
    deviceScaleFactor: 1,
    activeView: "number-line"
  });
  const dpr = certifyKpExactFractionQuantityResponsiveLayout({
    runtimeFrame,
    viewportWidth: 390,
    viewportHeight: 844,
    deviceScaleFactor: 2,
    activeView: "number-line"
  });
  const resized = certifyKpExactFractionQuantityResponsiveLayout({
    runtimeFrame,
    viewportWidth: 420,
    viewportHeight: 844,
    deviceScaleFactor: 1,
    activeView: "number-line"
  });

  assert.notEqual(
    base.measurementInvalidationKey,
    dpr.measurementInvalidationKey
  );
  assert.notEqual(
    base.measurementInvalidationKey,
    resized.measurementInvalidationKey
  );
  assert.deepEqual(
    base.slots[0]?.semanticFocusSelectionIds,
    dpr.slots[0]?.semanticFocusSelectionIds
  );
});

test("layout classifier rejects overlap, clipping, unreadable type, and scaling", () => {
  const layout = certifyKpExactFractionQuantityResponsiveLayout({
    runtimeFrame: frame(0.5),
    viewportWidth: 1_100,
    viewportHeight: 800
  });
  const first = layout.slots[0]!;
  const second = layout.slots[1]!;
  const corrupted = {
    ...layout,
    slots: Object.freeze([
      {
        ...first,
        contentRect: {
          ...first.contentRect,
          left: -20
        },
        mathFontPx: 12,
        scale: 0.5 as 1
      },
      {
        ...second,
        rect: first.rect,
        contentRect: first.contentRect
      },
      ...layout.slots.slice(2)
    ])
  };

  assert.deepEqual(
    checkKpExactFractionQuantityResponsiveLayout(corrupted)
      .map(({ code }) => code),
    [
      "layout.overlap",
      "layout.clipping",
      "layout.readability-floor",
      "layout.scale"
    ]
  );
});

function frame(progress: number) {
  return sampleKpExactFractionQuantityRuntime({
    session: createKpExactFractionQuantityRuntimeSession(),
    clock: { direction: "forward", progress }
  });
}

function center(
  rect: { readonly left: number; readonly top: number; readonly width: number; readonly height: number },
  axis: "x" | "y"
): number {
  return axis === "x"
    ? rect.left + rect.width / 2
    : rect.top + rect.height / 2;
}
