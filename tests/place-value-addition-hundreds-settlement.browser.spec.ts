import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "wide", width: 960, height: 720 },
  { name: "phone", width: 390, height: 720 }
] as const) {
  test(`${viewport.name} hundreds evaluation settles native 434 without a stale frame`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const evidence = await page.evaluate(async ({ width }) => {
      const runtimeUrl =
        "/src/rendering/place-value-addition-runtime.ts";
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

      const tensExchange = () => document.querySelector<HTMLElement>(
        "[data-kp-place-value-tens-exchange]"
      )!;
      const hundredsEvaluation = () =>
        document.querySelector<HTMLElement>(
          "[data-kp-place-value-hundreds-evaluation]"
        )!;
      const settlement = () => document.querySelector<HTMLElement>(
        "[data-kp-place-value-native-settlement]"
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
      const roots = (
        stage: HTMLElement,
        endpoint: "source" | "target",
        ids: readonly string[]
      ) => ids.map((id) => [
        id,
        metric(stage.querySelector<HTMLElement>(
          `[data-kp-place-value-operation-endpoint="${endpoint}"] ` +
          `[data-kp-semantic-entity-id="${id}"]`
        )!)
      ] as const);
      const nativeRoots = (
        stage: HTMLElement,
        ids: readonly string[]
      ) => ids.map((id) => [
        id,
        metric(stage.querySelector<HTMLElement>(
          `[data-kp-semantic-entity-id="${id}"]`
        )!)
      ] as const);
      const owners = (stage: HTMLElement) => [
        ...stage.querySelectorAll<HTMLElement>(
          "[data-kp-equation-material-owner-id]"
        )
      ].map((owner) => ({
        id: owner.dataset["kpEquationMaterialOwnerId"]!,
        opacity: getComputedStyle(owner).opacity,
        transform: getComputedStyle(owner).transform,
        text: owner.textContent?.trim() ?? ""
      })).sort((left, right) => left.id.localeCompare(right.id));
      const nativeFrame = () => ({
        opacity: getComputedStyle(settlement()).opacity,
        display: getComputedStyle(settlement()).display,
        text: resultIds.map((id) =>
          settlement().querySelector<HTMLElement>(
            `[data-kp-semantic-entity-id="${id}"] .katex-html`
          )?.textContent?.trim()
        ).join("")
      });

      dom.apply(sample(0.65, 0, 1));
      const priorTarget = tensExchange().querySelector<HTMLElement>(
        '[data-kp-place-value-operation-endpoint="target"]'
      )!;
      priorTarget.style.opacity = "1";
      tensExchange().querySelector<HTMLElement>(
        "[data-kp-editor-equation-material-layer]"
      )!.style.visibility = "hidden";
      const stableIds = [
        "operator.add",
        "digit.first.hundreds",
        "digit.second.hundreds",
        "carry.hundreds",
        "result.tens",
        "result.ones"
      ] as const;
      const priorEndpoint = roots(
        tensExchange(),
        "target",
        stableIds
      );

      dom.apply(sample(0.71, 0.65, 2));
      const evaluationSource = roots(
        hundredsEvaluation(),
        "source",
        stableIds
      );
      dom.apply(sample(0.79, 0.71, 3));
      const forward = owners(hundredsEvaluation());
      dom.apply(sample(0.84, 0.79, 4));
      dom.apply(sample(0.79, 0.84, 5));
      const rewind = owners(hundredsEvaluation());

      const evaluationTarget =
        hundredsEvaluation().querySelector<HTMLElement>(
          '[data-kp-place-value-operation-endpoint="target"]'
        )!;
      evaluationTarget.style.opacity = "1";
      hundredsEvaluation().querySelector<HTMLElement>(
        "[data-kp-editor-equation-material-layer]"
      )!.style.visibility = "hidden";
      const resultIds = [
        "result.hundreds",
        "result.tens",
        "result.ones"
      ] as const;
      const evaluatedResult = roots(
        hundredsEvaluation(),
        "target",
        resultIds
      );

      dom.apply(sample(0.87, 0.79, 6));
      const settlementSource = nativeRoots(
        settlement(),
        resultIds
      );
      const boundary = {
        evaluationDisplay: getComputedStyle(
          hundredsEvaluation()
        ).display,
        settlementDisplay: getComputedStyle(settlement()).display
      };

      dom.apply(sample(0.9, 0.87, 7));
      const dwellStart = nativeFrame();
      dom.apply(sample(0.96, 0.9, 8));
      const dwellEnd = nativeFrame();
      dom.apply(sample(1, 0.96, 9));
      const settlementTargetRoot = settlement();
      const endpoint = {
        targetOpacity: getComputedStyle(settlementTargetRoot).opacity,
        text: resultIds.map((id) =>
          settlementTargetRoot.querySelector<HTMLElement>(
            `[data-kp-semantic-entity-id="${id}"] .katex-html`
          )?.textContent?.trim()
        ).join(""),
        metrics: nativeRoots(settlement(), resultIds)
      };

      dom.root.style.inlineSize =
        `${Math.max(320, width - 120)}px`;
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve())
        )
      );
      dom.apply(sample(1, 1, 10));
      const afterResize = {
        opacity: getComputedStyle(settlement()).opacity,
        text: nativeFrame().text,
        metrics: nativeRoots(settlement(), resultIds)
      };

      dom.apply(sample(0.79, 1, 11));
      dom.apply(sample(0.95, 0.79, 12));
      const replayForward = nativeFrame();
      dom.apply(sample(0.95, 0.95, 13));
      const replaySame = nativeFrame();

      return {
        priorEndpoint,
        evaluationSource,
        forward,
        rewind,
        evaluatedResult,
        settlementSource,
        boundary,
        dwellStart,
        dwellEnd,
        endpoint,
        afterResize,
        replayForward,
        replaySame
      };
    }, viewport);

    for (const [id, prior] of evidence.priorEndpoint) {
      const current = evidence.evaluationSource.find(
        ([candidateId]) => candidateId === id
      )?.[1];
      expect(current, `missing hundreds source ${id}`).toBeDefined();
      expect(Math.abs(current!.left - prior.left)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(current!.top - prior.top)).toBeLessThanOrEqual(0.5);
      expect(current!.fontFamily).toBe(prior.fontFamily);
      expect(current!.fontSize).toBe(prior.fontSize);
      expect(current!.fontWeight).toBe(prior.fontWeight);
    }
    expect(evidence.forward.every(({ opacity }) =>
      opacity === "0" || opacity === "1"
    )).toBe(true);
    const materialText = evidence.forward
      .filter(({ opacity }) => opacity === "1")
      .map(({ text }) => text)
      .join("");
    for (const glyph of ["1", "2", "+"]) {
      expect(materialText).toContain(glyph);
    }
    expect(evidence.forward.some(({ opacity, transform }) =>
      opacity === "1" && transform !== "none"
    )).toBe(true);
    expect(evidence.rewind).toEqual(evidence.forward);

    for (const [id, prior] of evidence.evaluatedResult) {
      const current = evidence.settlementSource.find(
        ([candidateId]) => candidateId === id
      )?.[1];
      expect(current, `missing settlement source ${id}`).toBeDefined();
      expect(Math.abs(current!.left - prior.left)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(current!.top - prior.top)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(current!.width - prior.width)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(current!.height - prior.height)).toBeLessThanOrEqual(0.5);
      expect(current!.fontFamily).toBe(prior.fontFamily);
      expect(current!.fontSize).toBe(prior.fontSize);
      expect(current!.fontWeight).toBe(prior.fontWeight);
    }
    expect(evidence.boundary.evaluationDisplay).toBe("none");
    expect(evidence.boundary.settlementDisplay).toBe("grid");
    for (const frame of [
      evidence.dwellStart,
      evidence.dwellEnd,
      evidence.replayForward,
      evidence.replaySame
    ]) {
      expect(frame.opacity).toBe("1");
      expect(frame.display).toBe("grid");
      expect(frame.text).toBe("434");
    }
    expect(evidence.replaySame).toEqual(evidence.replayForward);
    expect(evidence.endpoint.targetOpacity).toBe("1");
    expect(evidence.endpoint.text).toBe("434");
    expect(evidence.afterResize.opacity).toBe("1");
    expect(evidence.afterResize.text).toBe("434");
    for (const [id, prior] of evidence.settlementSource) {
      const current = evidence.endpoint.metrics.find(
        ([candidateId]) => candidateId === id
      )?.[1];
      expect(current, `missing native endpoint ${id}`).toBeDefined();
      expect(Math.abs(current!.left - prior.left)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(current!.top - prior.top)).toBeLessThanOrEqual(0.5);
      expect(current!.fontFamily).toBe(prior.fontFamily);
      expect(current!.fontSize).toBe(prior.fontSize);
      expect(current!.fontWeight).toBe(prior.fontWeight);
    }
    for (const [id, prior] of evidence.endpoint.metrics) {
      const current = evidence.afterResize.metrics.find(
        ([candidateId]) => candidateId === id
      )?.[1];
      expect(current, `missing resized endpoint ${id}`).toBeDefined();
      expect(current!.fontFamily).toBe(prior.fontFamily);
      expect(current!.fontSize).toBe(prior.fontSize);
      expect(current!.fontWeight).toBe(prior.fontWeight);
    }
  });
}
