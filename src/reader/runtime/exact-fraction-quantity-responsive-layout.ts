import {
  kpExactFractionQuantityLayoutPolicy as layoutPolicy
} from "../../semantic/exact-fraction-quantity-layout-policy.ts";
import type {
  KpExactFractionQuantityRuntimeFrame
} from "../../rendering/exact-fraction-quantity-runtime.ts";
import type {
  KpExactFractionQuantityViewKind
} from "../../semantic/exact-fraction-quantity-view-obligations.ts";

declare const kpExactFractionResponsiveLayoutBrand: unique symbol;

const sealedLayouts = new WeakSet<object>();

export interface KpExactFractionQuantityLayoutRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface KpExactFractionQuantityViewSlot {
  readonly view: KpExactFractionQuantityViewKind;
  readonly visibility: "visible" | "inactive";
  readonly rect: KpExactFractionQuantityLayoutRect;
  readonly contentRect: KpExactFractionQuantityLayoutRect;
  readonly contentPolicy: "intrinsic-contain";
  readonly scale: 1;
  readonly mathFontPx: number;
  readonly semanticFocusSelectionIds: readonly string[];
}

export interface KpExactFractionQuantityResponsiveLayout {
  readonly schemaVersion:
    "kp.exact-fraction-quantity-responsive-layout.v1";
  readonly revisionKey: string;
  readonly measurementInvalidationKey: string;
  readonly mode: "wide-grid" | "phone-focus";
  readonly viewport: {
    readonly width: number;
    readonly height: number;
    readonly deviceScaleFactor: number;
  };
  readonly stageRect: KpExactFractionQuantityLayoutRect;
  readonly activeView: KpExactFractionQuantityViewKind;
  readonly viewSwitcherVisible: boolean;
  readonly viewOrder: readonly KpExactFractionQuantityViewKind[];
  readonly slots: readonly KpExactFractionQuantityViewSlot[];
  readonly minimumMathFontPx: number;
  readonly readabilityFloorSatisfied: true;
  readonly wrapPolicy: "no-arbitrary-wrap";
  readonly [kpExactFractionResponsiveLayoutBrand]: true;
}

export interface KpExactFractionQuantityLayoutIssue {
  readonly code:
    | "layout.duplicate-view"
    | "layout.missing-view"
    | "layout.active-view-mismatch"
    | "layout.overlap"
    | "layout.clipping"
    | "layout.readability-floor"
    | "layout.scale";
  readonly message: string;
}

export function certifyKpExactFractionQuantityResponsiveLayout(input: {
  readonly runtimeFrame: KpExactFractionQuantityRuntimeFrame;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly deviceScaleFactor?: number | undefined;
  readonly activeView?: KpExactFractionQuantityViewKind | undefined;
}): KpExactFractionQuantityResponsiveLayout {
  const viewport = normalizeViewport(input);
  const viewOrder =
    layoutPolicy.viewObligations;
  const activeView = input.activeView ?? "symbolic";
  if (!viewOrder.includes(activeView)) {
    throw new Error(`Unknown exact-fraction active view ${activeView}.`);
  }
  const focusSelectionIds = Object.freeze(
    input.runtimeFrame.projection.selectionCorrespondences
      .filter(({ focused }) => focused)
      .map(({ selectionId }) => selectionId)
  );
  const mode: KpExactFractionQuantityResponsiveLayout["mode"] =
    viewport.width >= layoutPolicy.wideMinWidthPx
      ? "wide-grid"
      : "phone-focus";
  const stageRect = mode === "wide-grid"
    ? Object.freeze({
        left: 24,
        top: 96,
        width: viewport.width - 48,
        height: viewport.height - 128
      })
    : Object.freeze({
        left: 16,
        top: 112,
        width: viewport.width - 32,
        height: viewport.height - 176
      });
  if (stageRect.width <= 0 || stageRect.height <= 0) {
    throw new Error("Exact-fraction viewport has no readable stage space.");
  }
  const slots = mode === "wide-grid"
    ? wideSlots(stageRect, viewOrder, focusSelectionIds)
    : phoneSlots(stageRect, viewOrder, activeView, focusSelectionIds);
  const draft = {
    schemaVersion: "kp.exact-fraction-quantity-responsive-layout.v1" as const,
    revisionKey:
      `layout.exact-fraction.${mode}.${viewport.width}x${viewport.height}.` +
      `${activeView}`,
    measurementInvalidationKey:
      `measure.exact-fraction.${viewport.width}x${viewport.height}` +
      `@${viewport.deviceScaleFactor}.${mode}.${activeView}`,
    mode,
    viewport,
    stageRect,
    activeView,
    viewSwitcherVisible: mode === "phone-focus",
    viewOrder: Object.freeze([...viewOrder]),
    slots,
    minimumMathFontPx: layoutPolicy.minimumMathFontPx,
    readabilityFloorSatisfied: true as const,
    wrapPolicy: "no-arbitrary-wrap" as const
  };
  const issues = checkKpExactFractionQuantityResponsiveLayout(draft);
  if (issues.length > 0) {
    throw new Error(issues.map(({ message }) => message).join("\n"));
  }
  const layout = Object.freeze(draft);
  sealedLayouts.add(layout);
  return layout as KpExactFractionQuantityResponsiveLayout;
}

export function isKpExactFractionQuantityResponsiveLayout(
  value: unknown
): value is KpExactFractionQuantityResponsiveLayout {
  return typeof value === "object" &&
    value !== null &&
    sealedLayouts.has(value);
}

export function checkKpExactFractionQuantityResponsiveLayout(
  layout: Omit<
    KpExactFractionQuantityResponsiveLayout,
    typeof kpExactFractionResponsiveLayoutBrand
  >
): readonly KpExactFractionQuantityLayoutIssue[] {
  const issues: KpExactFractionQuantityLayoutIssue[] = [];
  const expectedViews =
    layoutPolicy.viewObligations;
  const actualViews = layout.slots.map(({ view }) => view);
  if (new Set(actualViews).size !== actualViews.length) {
    issues.push(issue(
      "layout.duplicate-view",
      "Responsive exact-fraction layout repeats a view slot."
    ));
  }
  for (const view of expectedViews) {
    if (!actualViews.includes(view)) {
      issues.push(issue(
        "layout.missing-view",
        `Responsive exact-fraction layout is missing ${view}.`
      ));
    }
  }
  const visible = layout.slots.filter(
    ({ visibility }) => visibility === "visible"
  );
  if (
    layout.mode === "phone-focus" &&
    (
      visible.length !== 1 ||
      visible[0]?.view !== layout.activeView ||
      !layout.viewSwitcherVisible
    )
  ) {
    issues.push(issue(
      "layout.active-view-mismatch",
      "Phone layout must expose exactly its deterministic active view."
    ));
  }
  if (
    layout.mode === "wide-grid" &&
    (visible.length !== expectedViews.length || layout.viewSwitcherVisible)
  ) {
    issues.push(issue(
      "layout.active-view-mismatch",
      "Wide layout must expose all four views without a focus switcher."
    ));
  }
  for (let left = 0; left < visible.length; left += 1) {
    for (let right = left + 1; right < visible.length; right += 1) {
      if (rectsOverlap(visible[left]!.rect, visible[right]!.rect)) {
        issues.push(issue(
          "layout.overlap",
          `${visible[left]!.view} overlaps ${visible[right]!.view}.`
        ));
      }
    }
  }
  for (const slot of visible) {
    if (
      !contains(layout.stageRect, slot.rect) ||
      !contains(slot.rect, slot.contentRect)
    ) {
      issues.push(issue(
        "layout.clipping",
        `${slot.view} escapes its certified responsive bounds.`
      ));
    }
    if (slot.mathFontPx < layout.minimumMathFontPx) {
      issues.push(issue(
        "layout.readability-floor",
        `${slot.view} falls below the mathematical readability floor.`
      ));
    }
    if (slot.scale !== 1) {
      issues.push(issue(
        "layout.scale",
        `${slot.view} cannot use global shrink-to-fit.`
      ));
    }
  }
  return Object.freeze(issues);
}

function wideSlots(
  stage: KpExactFractionQuantityLayoutRect,
  views: readonly KpExactFractionQuantityViewKind[],
  focusSelectionIds: readonly string[]
): readonly KpExactFractionQuantityViewSlot[] {
  const gap = 16;
  const width = (stage.width - gap) / 2;
  const height = (stage.height - gap) / 2;
  return Object.freeze(views.map((view, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const rect = Object.freeze({
      left: stage.left + column * (width + gap),
      top: stage.top + row * (height + gap),
      width,
      height
    });
    return slot(view, "visible", rect, focusSelectionIds, 24);
  }));
}

function phoneSlots(
  stage: KpExactFractionQuantityLayoutRect,
  views: readonly KpExactFractionQuantityViewKind[],
  activeView: KpExactFractionQuantityViewKind,
  focusSelectionIds: readonly string[]
): readonly KpExactFractionQuantityViewSlot[] {
  return Object.freeze(views.map((view) =>
    slot(
      view,
      view === activeView ? "visible" : "inactive",
      stage,
      focusSelectionIds,
      22
    )
  ));
}

function slot(
  view: KpExactFractionQuantityViewKind,
  visibility: KpExactFractionQuantityViewSlot["visibility"],
  rect: KpExactFractionQuantityLayoutRect,
  focusSelectionIds: readonly string[],
  mathFontPx: number
): KpExactFractionQuantityViewSlot {
  return Object.freeze({
    view,
    visibility,
    rect,
    contentRect: centeredContentRect(view, rect),
    contentPolicy: "intrinsic-contain",
    scale: 1,
    mathFontPx,
    semanticFocusSelectionIds: focusSelectionIds
  });
}

function centeredContentRect(
  view: KpExactFractionQuantityViewKind,
  slotRect: KpExactFractionQuantityLayoutRect
): KpExactFractionQuantityLayoutRect {
  const aspectRatio = view === "partitioned-circle" ? 1.5 : 3;
  const maximumWidth = view === "partitioned-circle"
    ? 300
    : view === "symbolic" ? 420 : 480;
  const maximumHeight = view === "symbolic" ? 120 : 260;
  const availableWidth = Math.max(0, slotRect.width - 32);
  const availableHeight = Math.max(0, slotRect.height - 32);
  const width = Math.min(
    availableWidth,
    maximumWidth,
    availableHeight * aspectRatio
  );
  const height = view === "symbolic"
    ? Math.min(maximumHeight, availableHeight, 100)
    : width / aspectRatio;
  return Object.freeze({
    left: slotRect.left + (slotRect.width - width) / 2,
    top: slotRect.top + (slotRect.height - height) / 2,
    width,
    height
  });
}

function normalizeViewport(input: {
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly deviceScaleFactor?: number | undefined;
}) {
  const deviceScaleFactor = input.deviceScaleFactor ?? 1;
  if (
    !Number.isFinite(input.viewportWidth) ||
    !Number.isFinite(input.viewportHeight) ||
    !Number.isFinite(deviceScaleFactor) ||
    input.viewportWidth <= 0 ||
    input.viewportHeight <= 0 ||
    deviceScaleFactor <= 0
  ) {
    throw new Error("Exact-fraction responsive viewport must be positive.");
  }
  return Object.freeze({
    width: input.viewportWidth,
    height: input.viewportHeight,
    deviceScaleFactor
  });
}

function rectsOverlap(
  left: KpExactFractionQuantityLayoutRect,
  right: KpExactFractionQuantityLayoutRect
): boolean {
  return Math.min(left.left + left.width, right.left + right.width) >
      Math.max(left.left, right.left) + 1e-9 &&
    Math.min(left.top + left.height, right.top + right.height) >
      Math.max(left.top, right.top) + 1e-9;
}

function contains(
  outer: KpExactFractionQuantityLayoutRect,
  inner: KpExactFractionQuantityLayoutRect
): boolean {
  const epsilon = 1e-9;
  return inner.left >= outer.left - epsilon &&
    inner.top >= outer.top - epsilon &&
    inner.left + inner.width <= outer.left + outer.width + epsilon &&
    inner.top + inner.height <= outer.top + outer.height + epsilon;
}

function issue(
  code: KpExactFractionQuantityLayoutIssue["code"],
  message: string
): KpExactFractionQuantityLayoutIssue {
  return Object.freeze({ code, message });
}
