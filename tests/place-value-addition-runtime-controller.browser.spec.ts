import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "wide", width: 1180, height: 800 },
  { name: "phone", width: 320, height: 700 }
] as const) {
  test(`${viewport.name} runtime controller coalesces, suspends, and releases resources`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const evidence = await page.evaluate(async ({ width }) => {
      const nextPaint = async (): Promise<void> => {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve())
          );
        });
      };
      const controllerUrl =
        "/src/rendering/place-value-addition-runtime-controller.ts";
      const controllerModule = await import(
        /* @vite-ignore */ controllerUrl
      );
      const frameDurations: number[] = [];
      const controller =
        controllerModule.createKpPlaceValueAdditionRuntimeController({
          document,
          viewportWidth: width,
          frameClock: {
            request(callback: FrameRequestCallback) {
              return requestAnimationFrame((timestamp) => {
                const startedAt = performance.now();
                callback(timestamp);
                frameDurations.push(performance.now() - startedAt);
              });
            },
            cancel: (requestId: number) =>
              cancelAnimationFrame(requestId)
          }
        });
      const beforeMount = controller.inspect();
      const app = document.querySelector<HTMLElement>("#app");
      if (app !== null) app.style.display = "none";
      const host = document.createElement("main");
      host.style.inlineSize = `${width}px`;
      document.body.append(host);
      const surface = controller.mount(host);
      await document.fonts.ready;
      const afterMount = controller.inspect();

      const burstStartedAt = performance.now();
      for (let index = 0; index < 1_000; index += 1) {
        controller.requestProgress({
          progress: index === 999 ? 0.73125 : (index % 997) / 997,
          source: "scroll"
        });
      }
      const burstScheduleDurationMs = performance.now() - burstStartedAt;
      await nextPaint();
      const afterBurst = controller.inspect();

      controller.requestProgress({
        progress: 0.73125,
        source: "autoplay"
      });
      await nextPaint();
      const afterExactRepeat = controller.inspect();

      // Rounded permille is review telemetry only; this adjacent value must
      // remain a distinct paint sample.
      controller.requestProgress({
        progress: 0.73126,
        source: "scroll"
      });
      await nextPaint();
      const afterSubPermille = controller.inspect();

      controller.setSuspended(true);
      const beforeHiddenBurst = controller.inspect();
      for (let index = 0; index < 500; index += 1) {
        controller.requestProgress({
          progress: index === 499 ? 0.42637 : index / 500,
          source: "scroll"
        });
      }
      await nextPaint();
      const whileHidden = controller.inspect();
      controller.setSuspended(false);
      await nextPaint();
      const afterResume = controller.inspect();

      document.body.style.minBlockSize = "4000px";
      const scrollObserved = new Promise<boolean>((resolve) => {
        window.addEventListener("scroll", () => resolve(true), { once: true });
        setTimeout(() => resolve(false), 1_000);
      });
      const scrollBurstStartedAt = performance.now();
      for (let index = 0; index < 2_000; index += 1) {
        controller.requestProgress({
          progress: index === 1_999 ? 0.81234 : (index % 991) / 991,
          source: "scroll"
        });
      }
      window.scrollTo(0, 900);
      const scrollBurstScheduleDurationMs =
        performance.now() - scrollBurstStartedAt;
      const didObserveScroll = await scrollObserved;
      await nextPaint();
      const afterScrollBurst = controller.inspect();

      const retainedRoot = surface.root;
      controller.requestProgress({ progress: 0.2, source: "autoplay" });
      controller.dispose();
      await nextPaint();
      const afterDispose = controller.inspect();
      return {
        beforeMount,
        afterMount,
        afterBurst,
        afterExactRepeat,
        afterSubPermille,
        beforeHiddenBurst,
        whileHidden,
        afterResume,
        afterScrollBurst,
        afterDispose,
        burstScheduleDurationMs,
        scrollBurstScheduleDurationMs,
        didObserveScroll,
        scrollY,
        frameDurations,
        maxFrameDurationMs: Math.max(0, ...frameDurations),
        retainedRootConnected: retainedRoot.isConnected,
        retainedRootStatus:
          retainedRoot.dataset["kpPlaceValueRuntimeControllerStatus"],
        retainedWebglLeaseCount:
          retainedRoot.dataset["kpPlaceValueWebglLeaseCount"],
        retainedRendererCount:
          retainedRoot.dataset["kpPlaceValueRendererSessionActiveCount"]
      };
    }, viewport);

    expect(evidence.beforeMount.status).toBe("idle");
    expect(evidence.beforeMount.mountCount).toBe(0);
    expect(evidence.beforeMount.rendererSessionActiveCount).toBe(0);
    expect(evidence.afterMount.status).toBe("mounted");
    expect(evidence.afterMount.sampleCount).toBe(1);
    expect(evidence.afterMount.applyCount).toBe(1);
    expect(evidence.afterMount.rendererSessionActiveCount).toBe(1);
    expect(evidence.afterMount.nativeScenePreparationCount).toBe(1);
    expect(evidence.afterMount.nativeScenePreparationDurationMs)
      .toBeLessThan(1_000);

    expect(evidence.afterBurst.lastAppliedProgress).toBe(0.73125);
    expect(evidence.afterBurst.sampleCount).toBe(2);
    expect(evidence.afterBurst.applyCount).toBe(2);
    expect(evidence.afterBurst.coalescedRequestCount).toBe(999);
    expect(evidence.afterBurst.scheduler?.framePlanCount).toBe(1);
    expect(evidence.afterExactRepeat.sampleCount).toBe(2);
    expect(evidence.afterExactRepeat.applyCount).toBe(2);
    expect(evidence.afterExactRepeat.repeatedFrameReuseCount).toBe(1);
    expect(evidence.afterSubPermille.sampleCount).toBe(3);
    expect(evidence.afterSubPermille.applyCount).toBe(3);

    expect(evidence.whileHidden.sampleCount)
      .toBe(evidence.beforeHiddenBurst.sampleCount);
    expect(evidence.whileHidden.applyCount)
      .toBe(evidence.beforeHiddenBurst.applyCount);
    expect(evidence.whileHidden.hiddenRequestCount).toBe(500);
    expect(evidence.whileHidden.scheduler?.pending).toBe(false);
    expect(evidence.afterResume.lastAppliedProgress).toBe(0.42637);
    expect(evidence.afterResume.sampleCount)
      .toBe(evidence.beforeHiddenBurst.sampleCount + 1);
    expect(evidence.afterResume.applyCount)
      .toBe(evidence.beforeHiddenBurst.applyCount + 1);

    expect(evidence.didObserveScroll).toBe(true);
    expect(evidence.scrollY).toBeGreaterThan(0);
    expect(evidence.afterScrollBurst.lastAppliedProgress).toBe(0.81234);
    expect(evidence.burstScheduleDurationMs).toBeLessThan(150);
    expect(evidence.scrollBurstScheduleDurationMs).toBeLessThan(200);
    expect(
      evidence.maxFrameDurationMs,
      `frame durations: ${evidence.frameDurations.join(", ")}; ` +
      `plan max: ${evidence.afterScrollBurst.maximumPlanDurationMs}; ` +
      `apply max: ${evidence.afterScrollBurst.maximumApplyDurationMs}`
    ).toBeLessThan(80);
    expect(evidence.afterScrollBurst.maximumApplyDurationMs)
      .toBeLessThan(80);

    expect(evidence.afterDispose.status).toBe("disposed");
    expect(evidence.afterDispose.rendererSessionActiveCount).toBe(0);
    expect(evidence.afterDispose.webglLeaseCount).toBe(0);
    expect(evidence.afterDispose.scheduler?.disposed).toBe(true);
    expect(evidence.afterDispose.scheduler?.pending).toBe(false);
    expect(evidence.retainedRootConnected).toBe(false);
    expect(evidence.retainedRootStatus).toBe("disposed");
    expect(evidence.retainedWebglLeaseCount).toBe("0");
    expect(evidence.retainedRendererCount).toBe("0");
  });
}

test("rapid seeking and direct seeking produce the same visible frame", async ({
  page
}) => {
  await page.setViewportSize({ width: 1180, height: 800 });
  await page.goto("/");
  const evidence = await page.evaluate(async () => {
    const controllerUrl =
      "/src/rendering/place-value-addition-runtime-controller.ts";
    const controllerModule = await import(/* @vite-ignore */ controllerUrl);
    const app = document.querySelector<HTMLElement>("#app");
    if (app !== null) app.style.display = "none";
    const hostA = document.createElement("section");
    const hostB = document.createElement("section");
    document.body.append(hostA, hostB);
    const indirect =
      controllerModule.createKpPlaceValueAdditionRuntimeController({
        document,
        viewportWidth: 1180
      });
    const direct =
      controllerModule.createKpPlaceValueAdditionRuntimeController({
        document,
        viewportWidth: 1180
      });
    indirect.mount(hostA);
    direct.mount(hostB);
    await document.fonts.ready;

    indirect.renderProgressNow({ progress: 0.2, source: "controls" });
    indirect.renderProgressNow({ progress: 0.78, source: "controls" });
    indirect.renderProgressNow({ progress: 0.54125, source: "controls" });
    direct.renderProgressNow({ progress: 0.54125, source: "controls" });

    const fingerprint = (root: HTMLElement) =>
      [...root.querySelectorAll<HTMLElement | SVGElement>("*")]
        .filter((element) => {
          const style = getComputedStyle(element);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            Number(style.opacity) <= 0.001 ||
            element.getClientRects().length === 0
          ) return false;
          let ancestor = element.parentElement;
          while (ancestor !== null && ancestor !== root) {
            const ancestorStyle = getComputedStyle(ancestor);
            if (
              ancestorStyle.display === "none" ||
              ancestorStyle.visibility === "hidden" ||
              Number(ancestorStyle.opacity) <= 0.001
            ) return false;
            ancestor = ancestor.parentElement;
          }
          return true;
        })
        .map((element) => {
          const style = getComputedStyle(element);
          const normalizedTransform = style.transform.replace(
            /-?\d+(?:\.\d+)?/g,
            (value) => Number(value).toFixed(3)
          );
          return {
            tag: element.tagName,
            semanticEntityId:
              element.getAttribute("data-kp-semantic-entity-id"),
            materialOwnerId:
              element.getAttribute("data-kp-equation-material-owner-id"),
            blockId: element.getAttribute("data-kp-base-ten-block"),
            text:
              element.childElementCount === 0
                ? element.textContent?.trim() ?? ""
                : "",
            transform: normalizedTransform,
            opacity: style.opacity,
            x: element.getAttribute("x"),
            y: element.getAttribute("y"),
            width: element.getAttribute("width"),
            height: element.getAttribute("height")
          };
        });
    const indirectRoot = indirect.root as HTMLElement;
    const directRoot = direct.root as HTMLElement;
    const result = {
      indirectDirection:
        indirectRoot.querySelector<HTMLElement>(
          "[data-kp-place-value-shared-session]"
        )?.dataset["kpPlaceValueClockDirection"],
      directDirection:
        directRoot.querySelector<HTMLElement>(
          "[data-kp-place-value-shared-session]"
        )?.dataset["kpPlaceValueClockDirection"],
      indirect: fingerprint(indirectRoot),
      direct: fingerprint(directRoot)
    };
    indirect.dispose();
    direct.dispose();
    return result;
  });

  expect(evidence.indirectDirection).toBe("rewind");
  expect(evidence.directDirection).toBe("forward");
  expect(evidence.indirect).toEqual(evidence.direct);
});
