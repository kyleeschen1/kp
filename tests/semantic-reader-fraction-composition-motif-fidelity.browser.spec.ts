import {
  expect,
  test,
  type Page
} from "@playwright/test";

import {
  compileKpFractionCompositionCancellationPresentationPlan
} from "../src/animation/fraction-composition-cancellation-presentation.ts";
import {
  createKpFractionCompositionEquationAnimationAsset
} from "../src/animation/fraction-composition-equation-adapter.ts";
import type {
  KpEquationVisiblePaintObservation
} from "../src/rendering/equation-visible-paint-overlap.ts";

const animation =
  createKpFractionCompositionEquationAnimationAsset();
const cancellationCases = animation.transformations.flatMap(
  (transformation, phaseIndex) => {
    const plan =
      compileKpFractionCompositionCancellationPresentationPlan(transformation);
    return plan === undefined ? [] : [{
      transformationId: transformation.id,
      phaseIndex,
      plan
    }];
  }
);
const phaseCount = animation.transformations.length;
const samples = [
  0.388, 0.42, 0.55, 0.64, 0.7, 0.75, 0.9, 0.94
] as const;
const viewports = [
  {
    id: "wide",
    size: { width: 1_100, height: 800 },
    layout: "single-row"
  },
  {
    id: "phone",
    size: { width: 390, height: 844 },
    layout: "semantic-two-row-stage"
  }
] as const;

test("fraction cancellation motif fidelity covers actual wide and phone paint", async ({
  browser
}) => {
  test.setTimeout(120_000);
  expect(cancellationCases).toHaveLength(3);

  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: viewport.size });
    const page = await context.newPage();
    try {
      await page.goto(readerRoute(0), { waitUntil: "domcontentloaded" });
      await ready(page);

      for (const candidate of cancellationCases) {
        const evidence =
          new Map<number, Awaited<ReturnType<typeof paintEvidence>>>();
        for (const localProgress of samples) {
          await seek(
            page,
            globalProgress(candidate.phaseIndex, localProgress)
          );
          const observation = await paintEvidence(page);
          expect(observation.transitionId).toBe(candidate.transformationId);
          expect(observation.operationChoreography).toBe(
            "counter-orbit-cancellation"
          );
          expect(observation.layoutPolicy).toBe(viewport.layout);
          expect(observation.fitScale).toBeGreaterThanOrEqual(0.68);
          expect(observation.horizontalOverflow).toBeLessThanOrEqual(1);
          expect(observation.sourceNativeOpacity).toBe(0);
          expect(observation.targetNativeOpacity).toBe(0);
          expect(observation.visualAuthorityCount).toBe(1);
          expect(observation.overlapViolations).toEqual([]);
          evidence.set(localProgress, observation);
        }
        assertActualRoleGeometry(candidate.plan, evidence);

        const first = stablePaintSnapshot(evidence.get(0.55)!);
        await seek(page, globalProgress(candidate.phaseIndex, 0.9));
        await seek(page, globalProgress(candidate.phaseIndex, 0.55));
        expect(stablePaintSnapshot(await paintEvidence(page))).toEqual(first);
      }

      await seek(page, 0);
      await expectNativeEndpoint(page, "source");
      await seek(page, 1_000);
      await expectNativeEndpoint(page, "target");
      await expectReviewCaptureAccessible(page, viewport.id);
    } finally {
      await context.close();
    }
  }
});

function assertActualRoleGeometry(
  plan: typeof cancellationCases[number]["plan"],
  evidence: ReadonlyMap<number, Awaited<ReturnType<typeof paintEvidence>>>
): void {
  const inverseBundles = plan.inverseBundleIds.map((bundleId) =>
    plan.roles.bundles.find(({ id }) => id === bundleId)!
  );
  const atStart = evidence.get(0.42)!;
  const atMiddle = evidence.get(0.55)!;
  const beforeContact = evidence.get(0.64)!;
  const atContact = evidence.get(0.7)!;
  const collapsing = evidence.get(0.75)!;
  const late = evidence.get(0.94)!;
  const startRects = inverseBundles.map((bundle) =>
    bundleRect(atStart, bundle.semanticEntityIds)
  );
  const middleRects = inverseBundles.map((bundle) =>
    bundleRect(atMiddle, bundle.semanticEntityIds)
  );
  const contactRects = inverseBundles.map((bundle) =>
    bundleRect(atContact, bundle.semanticEntityIds)
  );
  assertPointClose(center(contactRects[0]!), center(contactRects[1]!), 1);

  const actualLocal = atMiddle.phaseProgressPermille / 1_000;
  const meetProgress = smooth(windowProgress(actualLocal, 0.42, 0.68));
  const residuals = middleRects.map((bounds, index) => {
    const start = center(startRects[index]!);
    const contact = center(contactRects[index]!);
    const observed = center(bounds);
    return {
      x: observed.x - lerp(start.x, contact.x, meetProgress),
      y: observed.y - lerp(start.y, contact.y, meetProgress)
    };
  });
  expect(Math.hypot(residuals[0]!.x, residuals[0]!.y))
    .toBeGreaterThan(0.25);
  expect(Math.hypot(residuals[1]!.x, residuals[1]!.y))
    .toBeGreaterThan(0.25);
  expect(
    residuals[0]!.x * residuals[1]!.x +
    residuals[0]!.y * residuals[1]!.y
  ).toBeLessThan(-0.0625);

  inverseBundles.forEach((bundle, bundleIndex) => {
    if (bundle.semanticEntityIds.length < 2) return;
    const startVector = relativeEntityVector(
      atStart,
      bundle.semanticEntityIds[0]!,
      bundle.semanticEntityIds[1]!
    );
    for (const observation of [
      atMiddle,
      beforeContact,
      atContact
    ]) {
      assertPointClose(
        relativeEntityVector(
          observation,
          bundle.semanticEntityIds[0]!,
          bundle.semanticEntityIds[1]!
        ),
        startVector,
        0.75
      );
    }
    expect(bundleIndex).toBeLessThan(2);
  });

  const retiringIds = plan.roles.bundles
    .filter(({ role }) =>
      role === "source-material" ||
      role === "catalyst" ||
      role === "artifact"
    )
    .flatMap(({ semanticEntityIds }) => semanticEntityIds);
  for (const entityId of retiringIds) {
    expect(entity(atStart, entityId).opacity).toBe(1);
    expect(entity(atMiddle, entityId).opacity).toBe(1);
    expect(entity(beforeContact, entityId).opacity).toBe(1);
  }
  const collapseOpacities = retiringIds.map((entityId) =>
    entity(collapsing, entityId).opacity
  );
  expect(Math.max(...collapseOpacities)).toBeLessThan(1);
  expect(Math.min(...collapseOpacities)).toBeGreaterThan(0);
  expect(
    Math.max(...collapseOpacities) - Math.min(...collapseOpacities)
  ).toBeLessThan(1e-6);

  const continuantIds = new Set(plan.roles.bundles
    .filter(({ role }) => role === "continuant")
    .flatMap(({ semanticEntityIds }) => semanticEntityIds));
  const observedContinuants = Object.values(late.entities)
    .filter(({ semanticEntityId }) => continuantIds.has(semanticEntityId));
  expect(observedContinuants.length).toBeGreaterThan(0);
  for (const observation of evidence.values()) {
    for (const continuant of Object.values(observation.entities)
      .filter(({ semanticEntityId }) =>
        continuantIds.has(semanticEntityId)
      )) {
      expect(continuant.opacity).toBe(1);
    }
  }
}

async function ready(page: Page): Promise<void> {
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-hydrated",
    "true"
  );
  await expect(
    page.locator("[data-kp-reader-equation-stage]")
  ).toHaveAttribute(
    "data-kp-reader-canonical-equation-session-active",
    "true"
  );
  await page.locator("body").evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
  });
}

async function seek(page: Page, progress: number): Promise<void> {
  await page.locator("[data-kp-reader-attention-scrubber]")
    .evaluate((node, value) => {
      const input = node as HTMLInputElement;
      input.value = String(value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, progress);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    String(progress)
  );
  await page.locator("body").evaluate(() =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )
  );
}

async function paintEvidence(page: Page) {
  return page.locator("body").evaluate(async () => {
    const geometryModule =
      "/src/rendering/native-katex-paint-geometry.ts";
    const overlapModule =
      "/src/rendering/equation-visible-paint-overlap.ts";
    const { measureKpNativeKatexSubtreePaintRect } =
      await import(geometryModule);
    const {
      evaluateKpEquationVisiblePaintCertifiedContacts,
      inspectKpEquationVisiblePaintOverlap
    } = await import(overlapModule);
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-reader-equation-viewport]"
    );
    const transition = document.querySelector<HTMLElement>(
      "[data-kp-reader-transition-active='true']"
    );
    if (stage === null || transition === null) {
      throw new Error("Motif fidelity requires one active equation stage.");
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
    const ownerGroups = new Map<string, {
      semanticEntityId: string;
      rects: Array<{
        left: number;
        top: number;
        width: number;
        height: number;
      }>;
      opacities: number[];
    }>();
    const materialObservations: KpEquationVisiblePaintObservation[] = [];
    for (const owner of transition.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )) {
      const semanticEntityId =
        owner.dataset["kpEquationMaterialSemanticEntityId"];
      const visual = owner.firstElementChild as HTMLElement | null;
      if (semanticEntityId === undefined || visual === null) continue;
      const rect = measureKpNativeKatexSubtreePaintRect(stage, visual);
      if (rect === undefined) continue;
      const group = ownerGroups.get(semanticEntityId) ?? {
        semanticEntityId,
        rects: [],
        opacities: []
      };
      group.rects.push(rect);
      group.opacities.push(effectiveOpacity(owner));
      ownerGroups.set(semanticEntityId, group);
      materialObservations.push({
        ownerId: owner.dataset["kpEquationMaterialOwnerId"] ?? "",
        semanticEntityId,
        semanticContacts: JSON.parse(
          owner.dataset["kpEquationMaterialSemanticContacts"] ?? "[]"
        ),
        authority: "material",
        rect,
        opacity: effectiveOpacity(owner)
      });
    }
    const entities = Object.fromEntries([...ownerGroups].map(
      ([semanticEntityId, group]) => {
        const left = Math.min(...group.rects.map((rect) => rect.left));
        const top = Math.min(...group.rects.map((rect) => rect.top));
        const right = Math.max(...group.rects.map((rect) =>
          rect.left + rect.width
        ));
        const bottom = Math.max(...group.rects.map((rect) =>
          rect.top + rect.height
        ));
        return [semanticEntityId, {
          semanticEntityId,
          rect: {
            left,
            top,
            width: right - left,
            height: bottom - top
          },
          opacity: Math.min(...group.opacities)
        }];
      }
    ));
    const native = [...transition.querySelectorAll<HTMLElement>(
      "[data-kp-reader-native]"
    )];
    const source = native.find(({ dataset }) =>
      dataset["kpReaderNative"] === "source"
    );
    const target = native.find(({ dataset }) =>
      dataset["kpReaderNative"] === "target"
    );
    const fit = transition.querySelector<HTMLElement>(
      "[data-kp-reader-fit-surface]"
    );
    if (source === undefined || target === undefined || fit === null) {
      throw new Error("Motif fidelity lacks endpoint or fit evidence.");
    }
    const sourceNativeOpacity = effectiveOpacity(source);
    const targetNativeOpacity = effectiveOpacity(target);
    const visibleMaterialOwnerCount = materialObservations.filter(
      ({ opacity }) => opacity > 0.01
    ).length;
    const overlap = evaluateKpEquationVisiblePaintCertifiedContacts({
      report: inspectKpEquationVisiblePaintOverlap({
        progress:
          Number(document.body.dataset["kpReaderProgress"]) / 1_000,
        viewportId: `${window.innerWidth}x${window.innerHeight}`,
        observations: materialObservations,
        contactTolerancePx: 0.75
      }),
      contactTolerancePx: 0.75
    });
    const reviewFrame = JSON.parse(
      document.body.dataset["kpReaderReviewFrame"] ?? "[]"
    ) as [number, number, string, string[]];
    return {
      transitionId: transition.dataset["kpReaderTransition"] ?? "",
      operationChoreography:
        fit.dataset["kpNativeKatexOperationChoreography"],
      phaseProgressPermille: reviewFrame[1],
      layoutPolicy: transition.dataset["kpReaderStageLayoutPolicy"],
      fitScale: Number(fit.dataset["kpReaderEquationFitScale"]),
      horizontalOverflow:
        document.documentElement.scrollWidth - window.innerWidth,
      sourceNativeOpacity,
      targetNativeOpacity,
      visualAuthorityCount:
        Number(sourceNativeOpacity > 0.01) +
        Number(targetNativeOpacity > 0.01) +
        Number(visibleMaterialOwnerCount > 0),
      overlapViolations: overlap.violations.map((violation: {
        readonly leftSemanticEntityId: string;
        readonly rightSemanticEntityId: string;
        readonly width: number;
        readonly height: number;
      }) => ({
        left: violation.leftSemanticEntityId,
        right: violation.rightSemanticEntityId,
        width: violation.width,
        height: violation.height
      })),
      entities
    };
  });
}

async function expectNativeEndpoint(
  page: Page,
  endpoint: "source" | "target"
): Promise<void> {
  const active = page.locator(
    "[data-kp-reader-transition-active='true']"
  );
  await expect(
    active.locator(`[data-kp-reader-native="${endpoint}"]`)
  ).toHaveCSS("opacity", "1");
  expect(await active.locator(
    "[data-kp-equation-material-owner-id]"
  ).evaluateAll((elements) => elements.every((element) =>
    Number(getComputedStyle(element).opacity) === 0
  ))).toBe(true);
}

async function expectReviewCaptureAccessible(
  page: Page,
  viewportId: "wide" | "phone"
): Promise<void> {
  await mockReviewInbox(page);
  await page.goto(
    "/canonical-animation-review.html" +
    `?animation=${encodeURIComponent(animation.id)}` +
    (viewportId === "phone" ? "&viewport=phone" : ""),
    { waitUntil: "domcontentloaded" }
  );
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

type Evidence = Awaited<ReturnType<typeof paintEvidence>>;
type EntityEvidence = Evidence["entities"][string];
type Rect = EntityEvidence["rect"];

function entity(evidence: Evidence, semanticEntityId: string): EntityEvidence {
  const result = evidence.entities[semanticEntityId];
  expect(result, `Missing actual paint for ${semanticEntityId}.`).toBeDefined();
  return result!;
}

function bundleRect(
  evidence: Evidence,
  semanticEntityIds: readonly string[]
): Rect {
  return union(semanticEntityIds.map((entityId) =>
    entity(evidence, entityId).rect
  ));
}

function relativeEntityVector(
  evidence: Evidence,
  firstId: string,
  secondId: string
): { readonly x: number; readonly y: number } {
  const first = center(entity(evidence, firstId).rect);
  const second = center(entity(evidence, secondId).rect);
  return { x: second.x - first.x, y: second.y - first.y };
}

function stablePaintSnapshot(evidence: Evidence) {
  return Object.fromEntries(Object.entries(evidence.entities).map(
    ([entityId, observation]) => [entityId, {
      opacity: round(observation.opacity),
      rect: Object.fromEntries(Object.entries(observation.rect).map(
        ([key, value]) => [key, round(value)]
      ))
    }]
  ));
}

function globalProgress(phaseIndex: number, localProgress: number): number {
  return Math.round(
    ((phaseIndex + localProgress) / phaseCount) * 1_000
  );
}

function readerRoute(progress: number): string {
  return "/reader/fraction-composition/?" + new URLSearchParams({
    kpLesson: "lesson.algebra.fraction-composition",
    kpVersion: "1",
    kpProgress: String(progress),
    kpMotion: "full",
    kpProfile: "standard",
    kpFoldMode: "expanded"
  });
}

function union(rects: readonly Rect[]): Rect {
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

function center(rect: Rect): { readonly x: number; readonly y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function assertPointClose(
  left: { readonly x: number; readonly y: number },
  right: { readonly x: number; readonly y: number },
  tolerance: number
): void {
  expect(Math.abs(left.x - right.x)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(left.y - right.y)).toBeLessThanOrEqual(tolerance);
}

function windowProgress(progress: number, start: number, end: number): number {
  return Math.max(0, Math.min(1, (progress - start) / (end - start)));
}

function smooth(value: number): number {
  return value * value * (3 - 2 * value);
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function round(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}
