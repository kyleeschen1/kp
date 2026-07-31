import { expect, test } from "@playwright/test";

type KpPlaceValueAdditionBrowserHarnessModule = typeof import(
  "./support/place-value-addition-browser-harness.ts"
);

for (const viewport of [
  { name: "wide", width: 960, height: 720 },
  { name: "phone", width: 390, height: 720 }
] as const) {
  test(`${viewport.name} every ordered position reuses persistent motion ownership`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/tests/fixtures/place-value-addition-browser-host.html");
    const evidence = await page.evaluate(async ({ width }) => {
      const harnessUrl =
        "/tests/support/place-value-addition-browser-harness.ts";
      const { createKpPlaceValueAdditionBrowserHarness } =
        await import(/* @vite-ignore */ harnessUrl) as
          KpPlaceValueAdditionBrowserHarnessModule;
      const harness = await createKpPlaceValueAdditionBrowserHarness({
        document,
        viewportWidth: width
      });
      const snapshot = (stage: HTMLElement) =>
        harness.materialOwners(stage).map((owner) => ({
        semanticId: owner.semanticId,
        opacity: owner.opacity,
        transform: owner.transform
      }));

      harness.apply(0.48, 0);
      const secondEvaluation = harness.operationScene(
        "decimal-position-1",
        "evaluation"
      );
      const evaluationForward = snapshot(secondEvaluation);
      const secondPositionState = {
        sceneVisible: harness.isVisible(secondEvaluation),
        materialOwners: harness.materialOwners(secondEvaluation)
          .filter(({ semanticId }) => semanticId.includes(".material.")),
        persistentInputs: [
          "carry.tens",
          "digit.first.tens",
          "digit.second.tens"
        ].map((id) => ({
          id,
          visible: harness.isVisible(harness.persistentCell(id)),
          opacity: getComputedStyle(harness.persistentCell(id)).opacity,
          transform: getComputedStyle(harness.persistentCell(id)).transform
        })),
        priorOutputs: ["result.ones", "carry.tens"].map((id) => ({
          id,
          visible: harness.isVisible(harness.persistentCell(id))
        }))
      };
      harness.apply(0.52, 0.48);
      harness.apply(0.48, 0.52);
      const evaluationRewind = snapshot(secondEvaluation);

      harness.apply(0.635, 0.48);
      const secondExchange = harness.operationScene(
        "decimal-position-1",
        "exchange"
      );
      const exchangeForward = snapshot(secondExchange);
      const inFlightOutputs = ["result.tens", "carry.hundreds"].map(
        (id) => ({
          id,
          visible: harness.isVisible(harness.persistentCell(id))
        })
      );
      harness.apply(0.69, 0.635);
      harness.apply(0.635, 0.69);
      const exchangeRewind = snapshot(secondExchange);

      harness.apply(0.71, 0.635);
      const afterExchange = [
        "carry.tens",
        "result.ones",
        "result.tens",
        "carry.hundreds"
      ].map((id) => ({
        id,
        visible: harness.isVisible(harness.persistentCell(id)),
        opacity: getComputedStyle(harness.persistentCell(id)).opacity
      }));
      const finalEvaluation = harness.operationScene(
        "decimal-position-2",
        "evaluation"
      );

      harness.apply(0.79, 0.71);
      const finalMaterialOwners = harness.materialOwners(finalEvaluation).filter(
        ({ semanticId }) => semanticId.includes(".material.")
      );
      harness.apply(0.87, 0.79);
      const finalState = [
        "carry.tens",
        "carry.hundreds",
        "result.ones",
        "result.tens",
        "result.hundreds"
      ].map((id) => ({
        id,
        visible: harness.isVisible(harness.persistentCell(id)),
        opacity: getComputedStyle(harness.persistentCell(id)).opacity
      }));
      harness.dispose();
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

  test(`${viewport.name} three-contributor fusion keeps one continuous authored route`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/tests/fixtures/place-value-addition-browser-host.html");
    const evidence = await page.evaluate(async ({ width }) => {
      const harnessUrl =
        "/tests/support/place-value-addition-browser-harness.ts";
      const { createKpPlaceValueAdditionBrowserHarness } =
        await import(/* @vite-ignore */ harnessUrl) as
          KpPlaceValueAdditionBrowserHarnessModule;
      const harness = await createKpPlaceValueAdditionBrowserHarness({
        document,
        viewportWidth: width
      });
      const evidence = harness.auditContributorFusionRoute({
        positionId: "decimal-position-1",
        globalStart: 0.4,
        globalEnd: 0.56
      });
      harness.dispose();
      return evidence;
    }, viewport);

    expect(evidence.motif).toBe("source-derived-contributor-fusion-v1");
    expect(evidence.samples.filter(({ offsets }) =>
      offsets.length !== 3 || !offsets.every(Number.isFinite)
    ).map(({ local, offsets }) => ({ local, offsets }))).toEqual([]);
    expect(evidence.samples.every(({ opacities, sourceOpacities }) =>
      opacities.every((opacity, index) =>
        Number(opacity) > 0 || Number(sourceOpacities[index]) > 0
      )
    )).toBe(true);
    expect(evidence.samples.every(({ opacities }) =>
      opacities.every((opacity) => opacity === "0" || opacity === "1")
    )).toBe(true);
    expect(evidence.samples.every(({ fallbackClearances }) =>
      fallbackClearances.every((clearance) => clearance === null)
    )).toBe(true);
    const maximumStep = Math.max(...evidence.samples.slice(1).flatMap(
      (sample, index) => sample.offsets.map((offset, ownerIndex) =>
        Math.abs(offset - evidence.samples[index]!.offsets[ownerIndex]!)
      )
    ));
    expect(maximumStep).toBeLessThan(3.25);
    expect(evidence.samples[0]!.offsets.every(
      (offset) => Math.abs(offset) < 0.001
    )).toBe(true);
    expect(evidence.samples.at(-1)!.offsets.every(
      (offset) => Math.abs(offset) < 0.001
    )).toBe(true);
    expect(evidence.samples[45]!.offsets.map(Math.sign)).toEqual([-1, 1, -1]);
    expect(evidence.samples[45]!.lateralOffsets.map(Math.sign)).toEqual([
      1,
      0,
      0
    ]);
    expect(evidence.samples[74]!.distanceToTarget).toBeLessThanOrEqual(5);
    expect(evidence.rewind.offsets).toEqual(evidence.samples[70]!.offsets);
    expect(evidence.sameFrame).toEqual(evidence.rewind);
  });
}
