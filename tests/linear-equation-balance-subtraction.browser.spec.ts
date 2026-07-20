import { expect, test } from "@playwright/test";

import { createCanonicalConceptRoomTrace } from "./fixtures/canonical-concept-room-trace.ts";

const conceptPath = "/concepts/mathematics/linear-equations/solve-with-balance";
const namedTimes = [0, 40, 200, 350, 400] as const;

test.beforeEach(async ({ page }) => {
  const trace = createCanonicalConceptRoomTrace();
  await page.goto(conceptPath);
  await expect(page.locator("[data-kp-concept-room-mounted=true]")).toHaveCount(1);
  await page.evaluate(async (inputTrace) => {
    // @ts-expect-error This absolute specifier is resolved by the browser's Vite server.
    const adapter = await import("/src/app-adapters/linear-equation-balance-svg.ts");
    const root = document.createElement("div");
    root.id = "balance-subtraction-fixture";
    root.dataset["kpConceptViewport"] = "true";
    root.style.width = "640px";
    root.style.maxWidth = "100%";
    const host = document.createElement("div");
    host.dataset["kpConceptId"] = "mathematics.linear-equations.solve-with-balance";
    host.dataset["kpTheme"] = "kp.concept-room.linear-equation-exemplar.v1";
    host.append(root);
    document.body.append(host);
    const controller = adapter.createBalanceSceneController(root, inputTrace, {
      diagramSemanticId: "diagram.balance",
      operationWindows: [
        { operationId: inputTrace.operations[0]!.id, startPermille: 0, endPermille: 400 },
        { operationId: inputTrace.operations[1]!.id, startPermille: 400, endPermille: 750 }
      ]
    });
    const snapshot = (progress: number, focus: readonly string[] = []) => {
      controller.render(progress, focus);
      const scene = root.querySelector<SVGSVGElement>("[data-kp-balance-scene]")!;
      const box = (element: SVGGraphicsElement) => {
        const bounds = element.getBoundingClientRect();
        return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom };
      };
      const motionUnits = [...scene.querySelectorAll<SVGGElement>(
        '[data-kp-balance-motion-role="matched-removal-unit"]'
      )].map((unit) => ({
        id: unit.dataset["kpBalanceUnit"] ?? "",
        pairId: unit.dataset["kpBalanceRemovalPair"] ?? "",
        pairIndex: Number(unit.dataset["kpBalanceRemovalPairIndex"]),
        side: unit.closest<SVGGElement>("[data-kp-balance-motion-side]")?.dataset["kpBalanceMotionSide"] ?? "",
        operationSemanticId: unit.dataset["kpOperationSemanticId"] ?? "",
        translationX: Number(unit.dataset["kpBalanceTranslationX"] ?? "0"),
        translationY: Number(unit.dataset["kpBalanceTranslationY"] ?? "0"),
        opacity: Number(unit.getAttribute("opacity") ?? "1"),
        focused: unit.classList.contains("kp-role-focus-primary"),
        bounds: box(unit)
      })).sort((left, right) => left.id.localeCompare(right.id));
      const beam = scene.querySelector<SVGLineElement>("[data-kp-balance-beam]")!;
      return {
        progress,
        phase: scene.dataset["kpBalanceMotionPhase"],
        operationSemanticId: scene.dataset["kpBalanceMotionOperationId"],
        beamTiltDegrees: Number(scene.dataset["kpBalanceBeamTiltDegrees"]),
        beamY: [beam.getAttribute("y1"), beam.getAttribute("y2")],
        frameId: scene.dataset["kpFrameId"],
        stage: scene.dataset["kpBalanceStage"],
        motionUnits,
        persistentBounds: [...scene.querySelectorAll<SVGGElement>(
          '[data-kp-balance-motion-role="persistent-balance-unit"]'
        )].map(box),
        operationApplications: [...scene.querySelectorAll<SVGElement>(
          "[data-kp-balance-operation-application]"
        )].map((node) => ({
          operationSemanticId: node.dataset["kpOperationSemanticId"],
          side: node.dataset["kpBalanceSide"],
          focused: node.classList.contains("kp-role-focus-primary")
        })),
        visibleUnitCount: [...scene.querySelectorAll<SVGGElement>("[data-kp-balance-unit]")]
          .filter((unit) => Number(unit.getAttribute("opacity") ?? "1") > .001).length,
        totalUnitCount: scene.querySelectorAll("[data-kp-balance-unit]").length,
        matchedRemovalCount: scene.querySelectorAll("[data-kp-balance-matched-removal]").length,
        animationElementCount: scene.querySelectorAll("animate, animateTransform").length,
        canvasCount: root.querySelectorAll("canvas").length
      };
    };
    window.__kpBalanceSubtraction = { snapshot };
  }, trace);
});

test("named phases remove exactly three synchronized pairs while the beam stays level", async ({ page }) => {
  const snapshots = await page.evaluate((times) => times.map((time) =>
    window.__kpBalanceSubtraction!.snapshot(time)
  ), [...namedTimes]);

  expect(snapshots.map((snapshot) => snapshot.phase)).toEqual([
    "source", "introduce-operation", "transform", "settle", "target"
  ]);
  expect(snapshots.map((snapshot) => snapshot.stage)).toEqual([
    "initial", "initial", "initial", "after-subtraction", "after-subtraction"
  ]);
  expect(snapshots.map((snapshot) => snapshot.frameId)).toEqual([
    "frame.initial", "frame.initial", "frame.initial", "frame.step.1", "frame.step.1"
  ]);
  expect(snapshots.every((snapshot) => snapshot.operationSemanticId === "operation.subtract-three"))
    .toBe(true);
  expect(snapshots.every((snapshot) => snapshot.beamTiltDegrees === 0)).toBe(true);
  expect(snapshots.every((snapshot) => snapshot.beamY[0] === snapshot.beamY[1])).toBe(true);
  expect(snapshots.every((snapshot) => snapshot.canvasCount === 0 &&
    snapshot.animationElementCount === 0 && snapshot.totalUnitCount <= 13)).toBe(true);

  const transform = snapshots[2]!;
  expect(transform.motionUnits).toHaveLength(6);
  expect(transform.operationApplications).toEqual([
    { operationSemanticId: "operation.subtract-three", side: "left", focused: false },
    { operationSemanticId: "operation.subtract-three", side: "right", focused: false }
  ]);
  const pairs = new Map<string, typeof transform.motionUnits>();
  for (const unit of transform.motionUnits) {
    pairs.set(unit.pairId, [...(pairs.get(unit.pairId) ?? []), unit]);
  }
  expect([...pairs.keys()].sort()).toEqual([
    "balance.removal-pair.0", "balance.removal-pair.1", "balance.removal-pair.2"
  ]);
  for (const units of pairs.values()) {
    expect(units).toHaveLength(2);
    expect(units.map((unit) => unit.side).sort()).toEqual(["left", "right"]);
    expect(new Set(units.map((unit) => unit.pairIndex)).size).toBe(1);
    expect(new Set(units.map((unit) => unit.operationSemanticId))).toEqual(
      new Set(["operation.subtract-three"])
    );
    const [left, right] = [...units].sort((a, b) => a.side.localeCompare(b.side));
    expect(left!.translationX).toBeCloseTo(-right!.translationX, 6);
    expect(left!.translationY).toBeCloseTo(right!.translationY, 6);
    expect(left!.opacity).toBeCloseTo(right!.opacity, 6);
  }
  expect(transform.motionUnits.every((moving) => transform.persistentBounds.every((persistent) =>
    !rectanglesOverlap(moving.bounds, persistent)
  ))).toBe(true);
  expect(snapshots[0]!.visibleUnitCount).toBe(13);
  expect(snapshots[4]!.visibleUnitCount).toBe(7);
});

test("direct seek, rewind, and operation focus are deterministic", async ({ page }) => {
  const result = await page.evaluate((times) => {
    const fixture = window.__kpBalanceSubtraction!;
    const forward = times.map((time) => fixture.snapshot(time));
    const reverse = [...times].reverse().map((time) => fixture.snapshot(time)).reverse();
    const focused = fixture.snapshot(200, ["operation.subtract-three"]);
    return { forward, reverse, focused };
  }, [...namedTimes]);

  expect(result.reverse).toEqual(result.forward);
  expect(result.focused.motionUnits).toHaveLength(6);
  expect(result.focused.motionUnits.every((unit) => unit.focused)).toBe(true);
  expect(result.focused.operationApplications).toHaveLength(2);
  expect(result.focused.operationApplications.every((application) => application.focused)).toBe(true);
});

test("reduced motion preserves exact semantic checkpoints without interpolated geometry", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const snapshots = await page.evaluate((times) => times.map((time) =>
    window.__kpBalanceSubtraction!.snapshot(time)
  ), [...namedTimes]);

  expect(snapshots.map((snapshot) => snapshot.phase)).toEqual([
    "source", "introduce-operation", "transform", "settle", "target"
  ]);
  expect(snapshots.every((snapshot) => snapshot.matchedRemovalCount === 0)).toBe(true);
  expect(snapshots.every((snapshot) => snapshot.motionUnits.length === 0)).toBe(true);
  expect(snapshots.map((snapshot) => snapshot.visibleUnitCount)).toEqual([13, 13, 13, 7, 7]);
  expect(snapshots.every((snapshot) => snapshot.canvasCount === 0 &&
    snapshot.animationElementCount === 0)).toBe(true);
});

declare global {
  interface Window {
    __kpBalanceSubtraction?: {
      snapshot(progress: number, focus?: readonly string[]): {
        progress: number;
        phase: string | undefined;
        operationSemanticId: string | undefined;
        beamTiltDegrees: number;
        beamY: Array<string | null>;
        frameId: string | undefined;
        stage: string | undefined;
        motionUnits: Array<{
          id: string;
          pairId: string;
          pairIndex: number;
          side: string;
          operationSemanticId: string;
          translationX: number;
          translationY: number;
          opacity: number;
          focused: boolean;
          bounds: Bounds;
        }>;
        persistentBounds: Bounds[];
        operationApplications: Array<{
          operationSemanticId: string | undefined;
          side: string | undefined;
          focused: boolean;
        }>;
        visibleUnitCount: number;
        totalUnitCount: number;
        matchedRemovalCount: number;
        animationElementCount: number;
        canvasCount: number;
      };
    };
  }
}

interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function rectanglesOverlap(left: Bounds, right: Bounds): boolean {
  return left.left < right.right - .5 && left.right > right.left + .5 &&
    left.top < right.bottom - .5 && left.bottom > right.top + .5;
}
