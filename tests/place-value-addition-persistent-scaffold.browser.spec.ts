import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "wide", width: 960, height: 720 },
  { name: "phone", width: 390, height: 720 }
] as const) {
  test(`${viewport.name} one written scaffold remains mounted through every beat`, async ({
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
      await document.fonts.ready;

      const written = dom.writtenRoot as HTMLElement;
      const roots = [
        ...written.querySelectorAll<HTMLElement>(
          "[data-kp-place-value-native-root]"
        )
      ];
      const underline = written.querySelector<HTMLElement>(
        "[data-kp-place-value-underline]"
      )!;
      const samples = [
        0, 0.1, 0.25, 0.4, 0.56, 0.71, 0.87, 1
      ];
      const frames = samples.map((progress, index) => {
        dom.apply(sample(
          progress,
          samples[Math.max(0, index - 1)]!,
          index + 1
        ));
        return {
          progress,
          display: getComputedStyle(written).display,
          connected: written.isConnected &&
            underline.isConnected &&
            roots.every((root) => root.isConnected),
          rootCount: document.querySelectorAll(
            "[data-kp-place-value-written-projection]" +
            "[data-kp-place-value-written-ownership=" +
            '"persistent-documentary"]'
          ).length,
          identity: roots.map((root) => root)
        };
      });
      return {
        conformance:
          written.dataset["kpPersistentWorkspaceConformance"],
        rootCount: roots.length,
        frames: frames.map(({ identity: _identity, ...frame }) => ({
          ...frame,
          sameRoots: frames[0]!.identity.every(
            (root, rootIndex) => root === roots[rootIndex]
          )
        }))
      };
    }, viewport);

    expect(evidence.conformance).toBe(
      "trace.place-value-addition.278-plus-156"
    );
    expect(evidence.rootCount).toBe(12);
    for (const frame of evidence.frames) {
      expect(frame.display).toBe("grid");
      expect(frame.connected).toBe(true);
      expect(frame.rootCount).toBe(1);
      expect(frame.sameRoots).toBe(true);
    }
  });
}
