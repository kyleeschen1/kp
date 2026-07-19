import { expect, test } from "@playwright/test";

import { createCanonicalConceptRoomTrace } from "./fixtures/canonical-concept-room-trace.ts";

const conceptPath = "/concepts/mathematics/linear-equations/solve-with-balance";
const namedTimes = [0, 40, 200, 350, 400, 470, 575, 680, 750, 1000] as const;

test.beforeEach(async ({ page }) => {
  const trace = createCanonicalConceptRoomTrace();
  await page.goto(conceptPath);
  await expect(page.locator("[data-kp-concept-room-mounted=true]")).toHaveCount(1);
  await page.evaluate(async (inputTrace) => {
    // @ts-expect-error This absolute specifier is resolved by the browser's Vite server.
    const projection = await import("/src/projections/linear-equation-symbolic.ts");
    // @ts-expect-error This absolute specifier is resolved by the browser's Vite server.
    const adapter = await import("/src/app-adapters/linear-equation-symbolic-stage.ts");
    const root = document.createElement("div");
    root.id = "symbolic-conformance-fixture";
    root.dataset["kpConceptViewport"] = "true";
    root.style.width = "640px";
    root.style.maxWidth = "100%";
    const host = document.createElement("div");
    host.dataset["kpConceptId"] = "mathematics.linear-equations.solve-with-balance";
    host.dataset["kpTheme"] = "kp.concept-room.linear-equation-exemplar.v1";
    host.append(root);
    document.body.append(host);
    const stage = adapter.createLinearEquationSymbolicStage(root);
    const options = { operationWindows: [
      { operationId: inputTrace.operations[0]!.id, startPermille: 0, endPermille: 400 },
      { operationId: inputTrace.operations[1]!.id, startPermille: 400, endPermille: 750 }
    ] };
    const render = async (progress: number) => {
      await stage.render(projection.projectLinearEquationTrace(inputTrace, progress, options));
    };
    const snapshot = async (progress: number) => {
      await render(progress);
      const rootBox = root.getBoundingClientRect();
      const tokens = [...root.querySelectorAll<HTMLElement>("[data-kp-symbolic-token]")]
        .flatMap((token) => {
          const style = getComputedStyle(token);
          const box = token.getBoundingClientRect();
          if (style.display === "none" || box.width === 0 || box.height === 0 || Number(style.opacity) <= 0.001) return [];
          const layer = token.closest<HTMLElement>("[data-kp-symbolic-stage-layer]");
          return [{
            id: token.dataset["kpSymbolicToken"] ?? "",
            continuantId: token.dataset["kpContinuantId"] ?? "",
            role: token.dataset["kpSymbolicMotionRole"] ?? "native",
            layer: layer?.dataset["kpSymbolicStageLayer"] ?? "native",
            opacity: Math.round(Number(style.opacity) * 1000) / 1000,
            left: Math.round((box.left - rootBox.left) * 10) / 10,
            top: Math.round((box.top - rootBox.top) * 10) / 10,
            width: Math.round(box.width * 10) / 10,
            height: Math.round(box.height * 10) / 10
          }];
        })
        .sort((left, right) => `${left.layer}:${left.id}`.localeCompare(`${right.layer}:${right.id}`));
      const motionStage = root.querySelector<HTMLElement>("[data-kp-symbolic-motion-stage]");
      return {
        progress,
        frameId: root.querySelector<HTMLElement>("[data-kp-symbolic-equation]")?.dataset["kpFrameId"],
        phase: motionStage?.dataset["kpSymbolicMotionPhase"] ?? root.dataset["kpSymbolicMotionState"],
        choreography: motionStage?.dataset["kpSymbolicChoreography"] ?? "native",
        tokens,
        totalTokenCount: root.querySelectorAll("[data-kp-symbolic-token]").length,
        canvasCount: root.querySelectorAll("canvas").length
      };
    };
    window.__kpSymbolicConformance = { render, snapshot, root };
  }, trace);
});

test("named phases preserve identities and settle to exact native endpoints", async ({ page }) => {
  const snapshots = await page.evaluate(async (times) => {
    const fixture = window.__kpSymbolicConformance!;
    const snapshots = [];
    for (const time of times) snapshots.push(await fixture.snapshot(time));
    return snapshots;
  }, [...namedTimes]);

  expect(snapshots.map(({ phase, choreography }) => [phase, choreography])).toEqual([
    ["source", "native"],
    ["introduce-operation", "subtract-both-sides"],
    ["transform", "subtract-both-sides"],
    ["settle", "subtract-both-sides"],
    ["target", "native"],
    ["introduce-operation", "divide-both-sides"],
    ["transform", "divide-both-sides"],
    ["settle", "divide-both-sides"],
    ["target", "native"],
    ["target", "native"]
  ]);
  expect(snapshots.filter((snapshot) => [0, 400, 750, 1000].includes(snapshot.progress))
    .map((snapshot) => snapshot.frameId)).toEqual([
      "frame.initial", "frame.step.1", "frame.step.2", "frame.step.2"
    ]);

  const subtract = snapshots.find((snapshot) => snapshot.progress === 200)!;
  expect(subtract.tokens.filter((token) => token.role === "persistent-material")
    .map((token) => token.continuantId).sort()).toEqual(["relation.equals", "term.two-x"]);
  const divide = snapshots.find((snapshot) => snapshot.progress === 575)!;
  expect(divide.tokens.some((token) => token.role === "persistent-equality" &&
    token.continuantId === "relation.equals")).toBe(true);
  expect(divide.tokens.filter((token) => token.role === "exact-fraction-persistent")).toHaveLength(1);
});

test("direct seek and rewind are deterministic within opacity and DOM budgets", async ({ page }) => {
  const result = await page.evaluate(async (times) => {
    const fixture = window.__kpSymbolicConformance!;
    const forward: Awaited<ReturnType<typeof fixture.snapshot>>[] = [];
    const durations: number[] = [];
    for (let time = 0; time <= 750; time += 25) {
      const start = performance.now();
      const snapshot = await fixture.snapshot(time);
      durations.push(performance.now() - start);
      if (snapshot.tokens.some((token) => token.opacity < 0 || token.opacity > 1)) {
        throw new Error(`Out-of-bounds token opacity at ${time}.`);
      }
      if (snapshot.totalTokenCount > 40 || snapshot.canvasCount !== 0) {
        throw new Error(`Symbolic stage exceeded its DOM or canvas budget at ${time}.`);
      }
    }
    for (const time of times) forward.push(await fixture.snapshot(time));
    const reverse = [];
    for (const time of [...times].reverse()) reverse.push(await fixture.snapshot(time));
    return {
      forward,
      reverse: reverse.reverse(),
      maximumDuration: Math.max(...durations),
      totalDuration: durations.reduce((sum, duration) => sum + duration, 0)
    };
  }, [...namedTimes]);

  expect(result.reverse).toEqual(result.forward);
  expect(result.maximumDuration).toBeLessThan(250);
  expect(result.totalDuration).toBeLessThan(2500);
});

test("resize and reduced motion preserve semantic checkpoints", async ({ page }) => {
  const root = page.locator("#symbolic-conformance-fixture");
  const before = await page.evaluate(() => window.__kpSymbolicConformance!.snapshot(575));
  await root.evaluate((element) => { (element as HTMLElement).style.width = "390px"; });
  await expect(root).toHaveAttribute("data-kp-symbolic-measurement-state", "invalidated");
  const after = await page.evaluate(() => window.__kpSymbolicConformance!.snapshot(575));
  const semanticSignature = (snapshot: typeof before) => snapshot.tokens.map(({ id, continuantId, role, opacity }) =>
    ({ id, continuantId, role, opacity })
  );
  expect(semanticSignature(after)).toEqual(semanticSignature(before));
  expect(await root.evaluate((element) => {
    const rootBox = element.getBoundingClientRect();
    return [...element.querySelectorAll<HTMLElement>("[data-kp-symbolic-stage-layer=overlay] [data-kp-symbolic-token]")]
      .filter((token) => Number(getComputedStyle(token).opacity) > 0.001)
      .every((token) => {
        const box = token.getBoundingClientRect();
        return box.width === 0 || (box.left >= rootBox.left - 1 && box.right <= rootBox.right + 1);
      });
  })).toBe(true);

  await page.emulateMedia({ reducedMotion: "reduce" });
  const reduced = await page.evaluate(async () => {
    const fixture = window.__kpSymbolicConformance!;
    const snapshots = [];
    for (const time of [0, 400, 750, 1000]) snapshots.push(await fixture.snapshot(time));
    return snapshots;
  });
  expect(reduced.map((snapshot) => snapshot.frameId)).toEqual([
    "frame.initial", "frame.step.1", "frame.step.2", "frame.step.2"
  ]);
  expect(reduced.every((snapshot) => snapshot.choreography === "native")).toBe(true);
});

declare global {
  interface Window {
    __kpSymbolicConformance?: {
      render(progress: number): Promise<void>;
      snapshot(progress: number): Promise<{
        progress: number;
        frameId: string | undefined;
        phase: string | undefined;
        choreography: string;
        tokens: Array<{
          id: string;
          continuantId: string;
          role: string;
          layer: string;
          opacity: number;
          left: number;
          top: number;
          width: number;
          height: number;
        }>;
        totalTokenCount: number;
        canvasCount: number;
      }>;
      root: HTMLElement;
    };
  }
}
