import { expect, test } from "@playwright/test";

type KpPlaceValueAdditionBrowserHarnessModule = typeof import(
  "./support/place-value-addition-browser-harness.ts"
);

for (const viewport of [
  { name: "wide", width: 960, height: 720 },
  { name: "phone", width: 390, height: 720 }
] as const) {
  test(`${viewport.name} terminal position hands off to the persistent native result`, async ({
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
      const finalScene = () => harness.operationScene(
        "decimal-position-2",
        "evaluation"
      );
      const resultIds = [
        "result.hundreds",
        "result.tens",
        "result.ones"
      ] as const;
      const owners = () => harness.materialOwners(finalScene());
      const nativeFrame = () => ({
        nodeIds: resultIds.map((id) => harness.persistentCell(id).id),
        visibility: resultIds.map((id) =>
          getComputedStyle(harness.persistentCell(id)).visibility
        ),
        opacity: resultIds.map((id) =>
          getComputedStyle(harness.persistentCell(id)).opacity
        ),
        text: resultIds.map((id) =>
          harness.persistentCell(id).querySelector<HTMLElement>(".katex-html")
            ?.textContent?.trim()
        ).join(""),
        metrics: resultIds.map((id) => [
          id,
          harness.paintMetric(harness.persistentCell(id))
        ] as const)
      });

      harness.apply(0.79, 0);
      const forward = owners();
      harness.apply(0.84, 0.79);
      harness.apply(0.79, 0.84);
      const rewind = owners();
      harness.apply(0.87, 0.79);
      const boundary = {
        evaluationDisplay: getComputedStyle(finalScene()).display,
        legacySettlementDisplay: getComputedStyle(
          document.querySelector<HTMLElement>(
            "[data-kp-place-value-native-settlement]"
          )!
        ).display,
        frame: nativeFrame()
      };
      harness.apply(0.9, 0.87);
      const dwellStart = nativeFrame();
      harness.apply(0.96, 0.9);
      const dwellEnd = nativeFrame();
      harness.apply(1, 0.96);
      const endpoint = nativeFrame();

      harness.dom.root.style.inlineSize = `${Math.max(320, width - 120)}px`;
      await harness.settleLayout();
      harness.apply(1, 1);
      const afterResize = nativeFrame();
      harness.apply(0.79, 1);
      harness.apply(0.95, 0.79);
      const replayForward = nativeFrame();
      harness.apply(0.95, 0.95);
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
