import { expect, test } from "@playwright/test";

import { createCanonicalConceptRoomTrace } from "./fixtures/canonical-concept-room-trace.ts";

const conceptPath = "/concepts/mathematics/linear-equations/solve-with-balance";
const namedTimes = [400, 470, 575, 650, 720, 750] as const;

test.beforeEach(async ({ page }) => {
  const trace = createCanonicalConceptRoomTrace();
  await page.goto(conceptPath);
  await expect(page.locator("[data-kp-concept-room-mounted=true]")).toHaveCount(1);
  await page.evaluate(async (inputTrace) => {
    // @ts-expect-error This absolute specifier is resolved by the browser's Vite server.
    const adapter = await import("/src/app-adapters/linear-equation-balance-svg.ts");
    // @ts-expect-error This absolute specifier is resolved by the browser's Vite server.
    const projection = await import("/src/projections/linear-equation-symbolic.ts");
    const root = document.createElement("div");
    root.id = "balance-division-fixture";
    root.dataset["kpConceptViewport"] = "true";
    root.style.width = "640px";
    root.style.maxWidth = "100%";
    const host = document.createElement("div");
    host.dataset["kpConceptId"] = "mathematics.linear-equations.solve-with-balance";
    host.dataset["kpTheme"] = "kp.concept-room.linear-equation-exemplar.v1";
    host.append(root);
    document.body.append(host);
    const operationWindows = [
      { operationId: inputTrace.operations[0]!.id, startPermille: 0, endPermille: 400 },
      { operationId: inputTrace.operations[1]!.id, startPermille: 400, endPermille: 750 }
    ];
    const controller = adapter.createBalanceSceneController(root, inputTrace, {
      diagramSemanticId: "diagram.balance",
      operationWindows
    });
    const snapshot = (progress: number, focus: readonly string[] = []) => {
      controller.render(progress, focus);
      const symbolic = projection.projectLinearEquationTrace(inputTrace, progress, { operationWindows });
      const scene = root.querySelector<SVGSVGElement>("[data-kp-balance-scene]")!;
      const units = [...scene.querySelectorAll<SVGGElement>("[data-kp-balance-unit]")].map((unit) => {
        const shape = unit.querySelector<SVGRectElement>("[data-kp-balance-object-shape]")!;
        return {
          id: unit.dataset["kpBalanceUnit"] ?? "",
          role: unit.dataset["kpBalanceMotionRole"] ?? "static",
          x: Number(shape.getAttribute("x")),
          y: Number(shape.getAttribute("y")),
          width: Number(shape.getAttribute("width")),
          height: Number(shape.getAttribute("height")),
          operationSemanticId: unit.dataset["kpOperationSemanticId"] ?? ""
        };
      }).sort((left, right) => left.id.localeCompare(right.id));
      return {
        progress,
        phase: scene.dataset["kpBalanceMotionPhase"],
        motionKind: scene.dataset["kpBalanceMotionKind"],
        operationSemanticId: scene.dataset["kpBalanceMotionOperationId"],
        symbolicPhase: symbolic.transition?.phase,
        symbolicOperationSemanticId: symbolic.transition?.operationSemanticId,
        stage: scene.dataset["kpBalanceStage"],
        frameId: scene.dataset["kpFrameId"],
        beamTiltDegrees: Number(scene.dataset["kpBalanceBeamTiltDegrees"]),
        physicalCuttingAllowed: scene.dataset["kpBalancePhysicalCuttingAllowed"],
        roundingAllowed: scene.dataset["kpBalanceRoundingAllowed"],
        sharedRemainderUnitId: scene.dataset["kpBalanceSharedRemainderUnitId"],
        units,
        operationApplicationCount: scene.querySelectorAll("[data-kp-balance-operation-application]").length,
        partitionMotionCount: scene.querySelectorAll("[data-kp-balance-exact-partition]").length,
        partitionGuideCount: scene.querySelectorAll("[data-kp-balance-group-guide]").length,
        selectedGroupIds: [...scene.querySelectorAll<SVGGElement>(
          '[data-kp-balance-partition-selected="true"]'
        )].map((group) => group.dataset["kpBalancePartitionGroup"] ?? ""),
        sharedRemainderLinkCount: scene.querySelectorAll("[data-kp-balance-shared-remainder]").length,
        symbolicHalfCount: scene.querySelectorAll("[data-kp-balance-symbolic-half-share]").length,
        resultCount: scene.querySelectorAll('[data-kp-balance-math-label="result"] .katex').length,
        operationFocused: scene.querySelector("[data-kp-balance-exact-partition]")
          ?.classList.contains("kp-role-focus-primary") ?? false,
        focusedApplicationCount: scene.querySelectorAll(
          "[data-kp-balance-operation-application].kp-role-focus-primary"
        ).length,
        canvasCount: root.querySelectorAll("canvas").length,
        animationElementCount: scene.querySelectorAll("animate, animateTransform").length
      };
    };
    window.__kpBalanceDivision = { snapshot };
  }, trace);
});

test("division phases form two exact groups and keep one remainder whole", async ({ page }) => {
  const snapshots = await page.evaluate((times) => times.map((time) =>
    window.__kpBalanceDivision!.snapshot(time)
  ), [...namedTimes]);

  expect(snapshots.map((snapshot) => snapshot.phase)).toEqual([
    "target", "introduce-operation", "transform", "transform", "settle", "target"
  ]);
  expect(snapshots.map((snapshot) => snapshot.symbolicPhase)).toEqual(
    snapshots.map((snapshot) => snapshot.phase)
  );
  expect(snapshots.map((snapshot) => snapshot.stage)).toEqual([
    "after-subtraction", "after-subtraction", "after-subtraction",
    "after-subtraction", "solved-partition", "solved-partition"
  ]);
  expect(snapshots.map((snapshot) => snapshot.frameId)).toEqual([
    "frame.step.1", "frame.step.1", "frame.step.1", "frame.step.1", "frame.step.2", "frame.step.2"
  ]);
  expect(snapshots.slice(1).every((snapshot) => snapshot.motionKind === "exact-partition" &&
    snapshot.operationSemanticId === "operation.divide-two" &&
    snapshot.symbolicOperationSemanticId === "operation.divide-two")).toBe(true);
  expect(snapshots.slice(1).every((snapshot) => snapshot.beamTiltDegrees === 0 &&
    snapshot.physicalCuttingAllowed === "false" && snapshot.roundingAllowed === "false" &&
    snapshot.sharedRemainderUnitId === "balance.right.unit.4")).toBe(true);

  const partition = snapshots[2]!;
  expect(partition.units).toHaveLength(7);
  expect(partition.units.filter((unit) => unit.role === "partition-assignment-unit")).toHaveLength(6);
  expect(partition.units.filter((unit) => unit.role === "unsplit-shared-remainder")).toEqual([
    expect.objectContaining({
      id: "balance.right.unit.4",
      width: 24,
      height: 24,
      operationSemanticId: "operation.divide-two"
    })
  ]);
  expect(partition.partitionGuideCount).toBe(4);
  expect(partition.symbolicHalfCount).toBe(0);

  const shared = snapshots[3]!;
  expect(shared.sharedRemainderLinkCount).toBe(1);
  expect(shared.symbolicHalfCount).toBe(2);
  expect(shared.units.filter((unit) => unit.id === "balance.right.unit.4")).toHaveLength(1);
  expect(shared.units.filter((unit) => unit.width < 24 || unit.height < 24)).toHaveLength(0);

  const selected = snapshots[4]!;
  expect(selected.selectedGroupIds).toEqual(["balance.partition.0"]);
  expect(selected.resultCount).toBe(1);
  for (const snapshot of snapshots.slice(2, 5)) {
    snapshot.units.forEach((unit, index) => snapshot.units.slice(index + 1).forEach((other) => {
      expect(
        rectanglesOverlap(unit, other),
        `${snapshot.progress}: ${unit.id} overlaps ${other.id}`
      ).toBe(false);
    }));
  }
  expect(snapshots.map((snapshot) => snapshot.operationApplicationCount)).toEqual([0, 2, 2, 2, 2, 0]);
  expect(snapshots.every((snapshot) => snapshot.canvasCount === 0 &&
    snapshot.animationElementCount === 0)).toBe(true);
});

test("division direct seek, rewind, and operation focus are deterministic", async ({ page }) => {
  const result = await page.evaluate((times) => {
    const fixture = window.__kpBalanceDivision!;
    const forward = times.map((time) => fixture.snapshot(time));
    const reverse = [...times].reverse().map((time) => fixture.snapshot(time)).reverse();
    const focused = fixture.snapshot(650, ["operation.divide-two"]);
    return { forward, reverse, focused };
  }, [...namedTimes]);

  expect(result.reverse).toEqual(result.forward);
  expect(result.focused.operationFocused).toBe(true);
  expect(result.focused.focusedApplicationCount).toBe(2);
  expect(result.focused.units).toHaveLength(7);
});

test("reduced motion jumps between whole exact partition checkpoints", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const snapshots = await page.evaluate((times) => times.map((time) =>
    window.__kpBalanceDivision!.snapshot(time)
  ), [...namedTimes]);

  expect(snapshots.every((snapshot) => snapshot.partitionMotionCount === 0)).toBe(true);
  expect(snapshots.map((snapshot) => snapshot.units.length)).toEqual([7, 7, 7, 7, 7, 7]);
  expect(snapshots.slice(0, 4).every((snapshot) => snapshot.symbolicHalfCount === 0 &&
    snapshot.resultCount === 0)).toBe(true);
  expect(snapshots.slice(4).every((snapshot) => snapshot.symbolicHalfCount === 2 &&
    snapshot.resultCount === 1)).toBe(true);
  expect(snapshots.every((snapshot) => snapshot.units
    .filter((unit) => unit.id === "balance.right.unit.4").length === 1)).toBe(true);
});

declare global {
  interface Window {
    __kpBalanceDivision?: {
      snapshot(progress: number, focus?: readonly string[]): DivisionSnapshot;
    };
  }
}

interface DivisionSnapshot {
  progress: number;
  phase: string | undefined;
  motionKind: string | undefined;
  operationSemanticId: string | undefined;
  symbolicPhase: string | undefined;
  symbolicOperationSemanticId: string | undefined;
  stage: string | undefined;
  frameId: string | undefined;
  beamTiltDegrees: number;
  physicalCuttingAllowed: string | undefined;
  roundingAllowed: string | undefined;
  sharedRemainderUnitId: string | undefined;
  units: Array<{
    id: string;
    role: string;
    x: number;
    y: number;
    width: number;
    height: number;
    operationSemanticId: string;
  }>;
  operationApplicationCount: number;
  partitionMotionCount: number;
  partitionGuideCount: number;
  selectedGroupIds: string[];
  sharedRemainderLinkCount: number;
  symbolicHalfCount: number;
  resultCount: number;
  operationFocused: boolean;
  focusedApplicationCount: number;
  canvasCount: number;
  animationElementCount: number;
}

function rectanglesOverlap(
  left: Pick<DivisionSnapshot["units"][number], "x" | "y" | "width" | "height">,
  right: Pick<DivisionSnapshot["units"][number], "x" | "y" | "width" | "height">
): boolean {
  return left.x < right.x + right.width && left.x + left.width > right.x &&
    left.y < right.y + right.height && left.y + left.height > right.y;
}
