import { expect, test } from "@playwright/test";
import type {
  KpPlaceValueAdditionNavigationSession
} from "../src/rendering/place-value-addition-navigation.ts";
import type {
  KpPlaceValueAdditionSharedDom
} from "../src/rendering/place-value-addition-shared-dom.ts";

for (const viewport of [
  { name: "wide", width: 960, height: 720 },
  { name: "phone", width: 390, height: 720 }
] as const) {
  test(`${viewport.name} outline and repeated scrub preserve one stable scene`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const evidence = await page.evaluate(async ({ width }) => {
      const navigationUrl =
        "/src/rendering/place-value-addition-navigation.ts";
      const sharedDomUrl =
        "/src/rendering/place-value-addition-shared-dom.ts";
      const navigationModule = await import(
        /* @vite-ignore */ navigationUrl
      );
      const sharedDom = await import(/* @vite-ignore */ sharedDomUrl);
      const navigation =
        navigationModule.createKpPlaceValueAdditionNavigationSession({
          viewportWidth: width,
          selectedView: "written"
        }) as KpPlaceValueAdditionNavigationSession;
      const dom = sharedDom.createKpPlaceValueAdditionSharedDom({
        document,
        session: navigation.runtime,
        initialFrame: navigation.frame
      }) as KpPlaceValueAdditionSharedDom;
      const app = document.querySelector<HTMLElement>("#app");
      if (app !== null) app.style.display = "none";
      document.body.append(dom.root);
      await document.fonts.ready;

      const writtenHost = dom.root.querySelector<HTMLElement>(
        '[data-kp-place-value-view="written"]'
      )!;
      const signature = () => {
        const activeStages = [...writtenHost.children]
          .filter((node): node is HTMLElement =>
            node instanceof HTMLElement &&
            getComputedStyle(node).display !== "none"
          );
        const stage = activeStages[0]!;
        const persistentComposite =
          activeStages.length === 2 &&
          activeStages.some((candidate) =>
            candidate.hasAttribute("data-kp-place-value-written-ownership")
          ) &&
          activeStages.some((candidate) =>
            candidate.hasAttribute("data-kp-place-value-written-overlay")
          );
        const endpoints = [
          ...(stage.hasAttribute("data-kp-place-value-operation-endpoint") ||
              stage.hasAttribute("data-kp-place-value-written-projection")
            ? [stage]
            : []),
          ...stage.querySelectorAll<HTMLElement>(
            "[data-kp-place-value-operation-endpoint]"
          )
        ];
        return {
          // One persistent scaffold plus one proxy-only overlay is one logical
          // scene; neither child is a competing full-scene implementation.
          activeStageCount: persistentComposite ? 1 : activeStages.length,
          stageMarker:
            Object.keys(stage.dataset)
              .filter((key) =>
                key.startsWith("kpPlaceValue") &&
                key !== "kpPlaceValueOperationEndpoint"
              )
              .sort(),
          endpointOpacities: endpoints.map((endpoint) =>
            getComputedStyle(endpoint).opacity
          ),
          owners: [
            ...stage.querySelectorAll<HTMLElement>(
              "[data-kp-equation-material-owner-id]"
            )
          ].map((owner) => ({
            id: owner.dataset["kpEquationMaterialOwnerId"]!,
            opacity: getComputedStyle(owner).opacity,
            transform: getComputedStyle(owner).transform,
            text: owner.textContent?.trim() ?? ""
          })).sort((left, right) => left.id.localeCompare(right.id))
        };
      };

      const anchors = navigation.outlineAnchors.map((anchor) => {
        const frame = navigation.seekOutline(anchor.id);
        dom.apply(frame);
        return {
          id: anchor.id,
          progress: frame.clock.progressPermille,
          state: frame.stableState.id,
          beatProgress: frame.beatProgress,
          signature: signature()
        };
      });

      dom.apply(navigation.sampleProgress({
        progress: 0.325,
        source: "controls"
      }));
      const first = signature();
      dom.apply(navigation.sampleProgress({
        progress: 0.82,
        source: "controls"
      }));
      dom.apply(navigation.sampleProgress({
        progress: 0.04,
        source: "controls"
      }));
      dom.apply(navigation.sampleProgress({
        progress: 0.325,
        source: "controls"
      }));
      const replay = signature();

      const beforeFold = signature();
      const frameBeforeFold = navigation.frame;
      navigation.toggleFold("evaluation.place-value.ones");
      dom.apply(navigation.frame);
      const afterFold = signature();

      return {
        authority: navigation.playbackAuthority,
        controls: navigation.transportControls,
        anchors,
        first,
        replay,
        beforeFold,
        afterFold,
        foldKeptFrame: frameBeforeFold === navigation.frame,
        finalProgress: navigation.frame.clock.progressPermille
      };
    }, viewport);

    expect(evidence.authority).toBe("editor-animation-player");
    expect(evidence.controls).toEqual(["toggle"]);
    expect(evidence.anchors.map(({ progress }) => progress)).toEqual([
      0,
      100,
      400,
      710,
      1_000
    ]);
    for (const anchor of evidence.anchors) {
      expect(anchor.signature.activeStageCount).toBe(1);
      expect(anchor.signature.endpointOpacities).toContain("1");
      expect(
        anchor.signature.owners
          .filter(({ opacity }) => opacity === "1")
      ).toHaveLength(0);
      expect(anchor.signature.owners.every(({ opacity }) =>
        opacity === "0" || opacity === "1"
      )).toBe(true);
      if (anchor.progress !== 1_000) {
        expect(anchor.beatProgress).toBe(0);
      }
    }
    expect(evidence.replay).toEqual(evidence.first);
    expect(evidence.afterFold).toEqual(evidence.beforeFold);
    expect(evidence.foldKeptFrame).toBe(true);
    expect(evidence.finalProgress).toBe(325);
  });
}
