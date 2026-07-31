import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "wide", width: 960, height: 720 },
  { name: "phone", width: 390, height: 720 }
] as const) {
  test(`${viewport.name} every ordered position reuses persistent motion ownership`, async ({
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

      const scaffold = () => document.querySelector<HTMLElement>(
        '[data-kp-place-value-written-ownership="persistent-documentary"]'
      )!;
      const cell = (id: string) => scaffold().querySelector<HTMLElement>(
        `[data-kp-semantic-entity-id="${id}"]`
      )!;
      const scene = (positionId: string, operation: string) =>
        document.querySelector<HTMLElement>(
          `[data-kp-place-value-position-id="${positionId}"]` +
          `[data-kp-${operation}]`
        )!;
      const visible = (element: HTMLElement) =>
        getComputedStyle(element).visibility !== "hidden" &&
        getComputedStyle(element).display !== "none" &&
        Number(getComputedStyle(element).opacity) > 0;
      const owners = (stage: HTMLElement) => [
        ...stage.querySelectorAll<HTMLElement>(
          "[data-kp-equation-material-owner-id]"
        )
      ].map((owner) => ({
        semanticId: owner.dataset["kpEquationMaterialSemanticEntityId"]!,
        opacity: getComputedStyle(owner).opacity,
        transform: getComputedStyle(owner).transform,
        text: owner.textContent?.trim() ?? ""
      })).sort((left, right) =>
        left.semanticId.localeCompare(right.semanticId)
      );
      const snapshot = (stage: HTMLElement) => owners(stage).map((owner) => ({
        semanticId: owner.semanticId,
        opacity: owner.opacity,
        transform: owner.transform
      }));

      dom.apply(sample(0.48, 0, 1));
      const secondEvaluation = scene(
        "decimal-position-1",
        "place-value-tens-evaluation"
      );
      const evaluationForward = snapshot(secondEvaluation);
      const secondPositionState = {
        sceneVisible: visible(secondEvaluation),
        materialOwners: owners(secondEvaluation).filter(({ semanticId }) =>
          semanticId.includes(".material.")
        ),
        persistentInputs: [
          "carry.tens",
          "digit.first.tens",
          "digit.second.tens"
        ].map((id) => ({
          id,
          visible: visible(cell(id)),
          opacity: getComputedStyle(cell(id)).opacity,
          transform: getComputedStyle(cell(id)).transform
        })),
        priorOutputs: ["result.ones", "carry.tens"].map((id) => ({
          id,
          visible: visible(cell(id))
        }))
      };
      dom.apply(sample(0.52, 0.48, 2));
      dom.apply(sample(0.48, 0.52, 3));
      const evaluationRewind = snapshot(secondEvaluation);

      dom.apply(sample(0.635, 0.48, 4));
      const secondExchange = scene(
        "decimal-position-1",
        "place-value-tens-exchange"
      );
      const exchangeForward = snapshot(secondExchange);
      const inFlightOutputs = ["result.tens", "carry.hundreds"].map(
        (id) => ({ id, visible: visible(cell(id)) })
      );
      dom.apply(sample(0.69, 0.635, 5));
      dom.apply(sample(0.635, 0.69, 6));
      const exchangeRewind = snapshot(secondExchange);

      dom.apply(sample(0.71, 0.635, 7));
      const afterExchange = [
        "carry.tens",
        "result.ones",
        "result.tens",
        "carry.hundreds"
      ].map((id) => ({
        id,
        visible: visible(cell(id)),
        opacity: getComputedStyle(cell(id)).opacity
      }));
      const finalEvaluation = scene(
        "decimal-position-2",
        "place-value-hundreds-evaluation"
      );

      dom.apply(sample(0.79, 0.71, 8));
      const finalMaterialOwners = owners(finalEvaluation).filter(
        ({ semanticId }) => semanticId.includes(".material.")
      );
      dom.apply(sample(0.87, 0.79, 9));
      const finalState = [
        "carry.tens",
        "carry.hundreds",
        "result.ones",
        "result.tens",
        "result.hundreds"
      ].map((id) => ({
        id,
        visible: visible(cell(id)),
        opacity: getComputedStyle(cell(id)).opacity
      }));
      dom.dispose();
      return {
        evaluationForward,
        evaluationRewind,
        secondPositionState,
        exchangeForward,
        exchangeRewind,
        inFlightOutputs,
        afterExchange,
        finalMaterialOwners,
        finalState
      };
    }, viewport);

    expect(evidence.secondPositionState.sceneVisible).toBe(true);
    expect(evidence.secondPositionState.materialOwners).toHaveLength(3);
    expect(evidence.secondPositionState.materialOwners.every(
      ({ opacity }) => opacity === "0" || opacity === "1"
    )).toBe(true);
    expect(evidence.secondPositionState.persistentInputs.every(
      ({ visible, opacity, transform }) =>
        visible && Number(opacity) > 0 && transform === "none"
    )).toBe(true);
    expect(evidence.secondPositionState.priorOutputs.every(
      ({ visible }) => visible
    )).toBe(true);
    expect(evidence.evaluationRewind).toEqual(evidence.evaluationForward);
    expect(evidence.exchangeForward.length).toBeGreaterThan(0);
    expect(evidence.exchangeRewind).toEqual(evidence.exchangeForward);
    expect(evidence.inFlightOutputs.every(({ visible }) => !visible)).toBe(
      true
    );
    expect(evidence.afterExchange.every(({ visible }) => visible)).toBe(true);
    expect(evidence.finalMaterialOwners).toHaveLength(3);
    expect(evidence.finalState.every(({ visible }) => visible)).toBe(true);
    expect(evidence.finalState.every(({ opacity }) => Number(opacity) > 0)).toBe(
      true
    );
  });
}
