import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "wide", width: 960, height: 720 },
  { name: "phone", width: 390, height: 720 }
] as const) {
  test(`${viewport.name} terminal position hands off to the persistent native result`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const evidence = await page.evaluate(async ({ width }) => {
      const runtimeUrl = "/src/rendering/place-value-addition-runtime.ts";
      const sharedDomUrl =
        "/src/rendering/place-value-addition-shared-dom.ts";
      const clockUrl = "/src/reader/runtime/playback-clock.ts";
      const runtime = await import(/* @vite-ignore */ runtimeUrl);
      const sharedDom = await import(/* @vite-ignore */ sharedDomUrl);
      const clock = await import(/* @vite-ignore */ clockUrl);
      const session = runtime.createKpPlaceValueAdditionRuntimeSession();
      const sample = (
        progress: number,
        previousProgress: number,
        sequence: number
      ) => runtime.sampleKpPlaceValueAdditionRuntime({
        session,
        clock: clock.createKpReaderClockSample({
          source: "controls",
          progress,
          previousProgress,
          sequence
        }),
        viewportWidth: width,
        selectedView: "written"
      });
      const dom = sharedDom.createKpPlaceValueAdditionSharedDom({
        document,
        session,
        initialFrame: sample(0, 0, 0)
      });
      const app = document.querySelector<HTMLElement>("#app");
      if (app !== null) app.style.display = "none";
      document.body.append(dom.root);
      Object.assign(document.body.style, {
        margin: "0",
        minHeight: "100vh",
        display: "grid",
        placeItems: "center"
      });
      await document.fonts.ready;
      dom.prepareNativeScenes();

      const finalScene = () => document.querySelector<HTMLElement>(
        '[data-kp-place-value-position-id="decimal-position-2"]' +
        "[data-kp-place-value-hundreds-evaluation]"
      )!;
      const scaffold = dom.writtenRoot as HTMLElement;
      const resultIds = [
        "result.hundreds",
        "result.tens",
        "result.ones"
      ] as const;
      const cell = (id: string) => scaffold.querySelector<HTMLElement>(
        `[data-kp-semantic-entity-id="${id}"]`
      )!;
      const metric = (element: HTMLElement) => {
        const paint = element.querySelector<HTMLElement>(
          ".katex-html .mord"
        ) ?? element.querySelector<HTMLElement>(".katex-html")!;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(paint);
        return {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight
        };
      };
      const owners = () => [
        ...finalScene().querySelectorAll<HTMLElement>(
          "[data-kp-equation-material-owner-id]"
        )
      ].map((owner) => ({
        id: owner.dataset["kpEquationMaterialOwnerId"]!,
        opacity: getComputedStyle(owner).opacity,
        transform: getComputedStyle(owner).transform,
        text: owner.textContent?.trim() ?? ""
      })).sort((left, right) => left.id.localeCompare(right.id));
      const nativeFrame = () => ({
        nodeIds: resultIds.map((id) => cell(id).id),
        visibility: resultIds.map((id) =>
          getComputedStyle(cell(id)).visibility
        ),
        opacity: resultIds.map((id) => getComputedStyle(cell(id)).opacity),
        text: resultIds.map((id) =>
          cell(id).querySelector<HTMLElement>(".katex-html")
            ?.textContent?.trim()
        ).join(""),
        metrics: resultIds.map((id) => [id, metric(cell(id))] as const)
      });

      dom.apply(sample(0.79, 0, 1));
      const forward = owners();
      dom.apply(sample(0.84, 0.79, 2));
      dom.apply(sample(0.79, 0.84, 3));
      const rewind = owners();
      dom.apply(sample(0.87, 0.79, 4));
      const boundary = {
        evaluationDisplay: getComputedStyle(finalScene()).display,
        legacySettlementDisplay: getComputedStyle(
          document.querySelector<HTMLElement>(
            "[data-kp-place-value-native-settlement]"
          )!
        ).display,
        frame: nativeFrame()
      };
      dom.apply(sample(0.9, 0.87, 5));
      const dwellStart = nativeFrame();
      dom.apply(sample(0.96, 0.9, 6));
      const dwellEnd = nativeFrame();
      dom.apply(sample(1, 0.96, 7));
      const endpoint = nativeFrame();

      dom.root.style.inlineSize = `${Math.max(320, width - 120)}px`;
      await new Promise<void>((resolve) => requestAnimationFrame(() =>
        requestAnimationFrame(() => resolve())
      ));
      dom.apply(sample(1, 1, 8));
      const afterResize = nativeFrame();
      dom.apply(sample(0.79, 1, 9));
      dom.apply(sample(0.95, 0.79, 10));
      const replayForward = nativeFrame();
      dom.apply(sample(0.95, 0.95, 11));
      const replaySame = nativeFrame();
      return {
        forward,
        rewind,
        boundary,
        dwellStart,
        dwellEnd,
        endpoint,
        afterResize,
        replayForward,
        replaySame
      };
    }, viewport);

    expect(evidence.forward.length).toBeGreaterThan(0);
    expect(evidence.forward.every(({ opacity }) =>
      opacity === "0" || opacity === "1"
    )).toBe(true);
    expect(evidence.rewind).toEqual(evidence.forward);
    expect(evidence.boundary.evaluationDisplay).toBe("none");
    expect(evidence.boundary.legacySettlementDisplay).toBe("none");
    expect(evidence.boundary.frame.visibility).toEqual([
      "visible",
      "visible",
      "visible"
    ]);
    expect(evidence.boundary.frame.opacity.every(
      (opacity) => Number(opacity) > 0
    )).toBe(true);
    expect(evidence.boundary.frame.text).toBe("434");
    expect(evidence.dwellEnd).toEqual(evidence.dwellStart);
    expect(evidence.endpoint).toEqual(evidence.dwellStart);
    expect(evidence.afterResize.nodeIds).toEqual(evidence.endpoint.nodeIds);
    expect(evidence.afterResize.text).toBe("434");
    expect(evidence.replaySame).toEqual(evidence.replayForward);
    expect(evidence.replayForward.text).toBe("434");
  });
}
