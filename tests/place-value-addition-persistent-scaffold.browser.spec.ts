import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "wide", width: 960, height: 720 },
  { name: "phone", width: 390, height: 720 }
] as const) {
  test(`${viewport.name} one written scaffold remains mounted through every beat`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/tests/fixtures/place-value-addition-browser-host.html");
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
      await dom.prepareNativeScenesWhenReady();

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

  test(`${viewport.name} documentary marks persist through seek and rewind`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/tests/fixtures/place-value-addition-browser-host.html");
    const evidence = await page.evaluate(async ({ width }) => {
      const runtimeUrl =
        "/src/rendering/place-value-addition-runtime.ts";
      const sharedDomUrl =
        "/src/rendering/place-value-addition-shared-dom.ts";
      const clockUrl = "/src/reader/runtime/playback-clock.ts";
      const referenceUrl =
        "/src/reader/compiler/place-value-addition-visual-reference.ts";
      const runtime = await import(/* @vite-ignore */ runtimeUrl);
      const sharedDom = await import(/* @vite-ignore */ sharedDomUrl);
      const clock = await import(/* @vite-ignore */ clockUrl);
      const { kpPlaceValueAdditionVisualReference: reference } =
        await import(/* @vite-ignore */ referenceUrl);
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
      await dom.prepareNativeScenesWhenReady();

      const written = dom.writtenRoot as HTMLElement;
      const documentary = [
        ...written.querySelectorAll<HTMLElement>(
          '[data-kp-place-value-role="addend-digit"], ' +
          '[data-kp-place-value-role="operator"], ' +
          "[data-kp-place-value-underline]"
        )
      ];
      const nodeById = new Map(documentary.map((element) => [
        element.dataset["kpSemanticEntityId"]!,
        element
      ] as const));
      const initialGeometry = new Map(documentary.map((element) => {
        const rect = element.getBoundingClientRect();
        return [element.dataset["kpSemanticEntityId"]!, {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        }] as const;
      }));
      const permilleSamples = [...new Set([
        ...Array.from({ length: 41 }, (_, index) => index * 25),
        ...reference.review.denseBoundariesPermille
      ])].sort((left, right) => left - right);
      const capture = (permille: number) => ({
        permille,
        cells: documentary.map((element) => {
          const id = element.dataset["kpSemanticEntityId"]!;
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          const initial = initialGeometry.get(id)!;
          return {
            id,
            sameNode: nodeById.get(id) === element,
            connected: element.isConnected,
            visibility: style.visibility,
            opacity: Number(style.opacity),
            transform: style.transform,
            geometryDelta: Math.max(
              Math.abs(rect.left - initial.left),
              Math.abs(rect.top - initial.top),
              Math.abs(rect.width - initial.width),
              Math.abs(rect.height - initial.height)
            )
          };
        })
      });
      const applySequence = (order: readonly number[], sequenceStart: number) => {
        const frames = new Map<number, ReturnType<typeof capture>>();
        let previousPermille = order[0] ?? 0;
        for (const [offset, permille] of order.entries()) {
          dom.apply(sample(
            permille / 1_000,
            previousPermille / 1_000,
            sequenceStart + offset
          ));
          frames.set(permille, capture(permille));
          previousPermille = permille;
        }
        return permilleSamples.map((permille) => frames.get(permille)!);
      };
      const forward = applySequence(permilleSamples, 1);
      const rewind = applySequence([...permilleSamples].reverse(), 100);
      const directOrder = permilleSamples.filter((_, index) => index % 2 === 0)
        .concat(
          permilleSamples.filter((_, index) => index % 2 === 1).reverse()
        );
      const direct = applySequence(directOrder, 200);
      return { forward, rewind, direct };
    }, viewport);

    expect(evidence.forward).toEqual(evidence.rewind);
    expect(evidence.forward).toEqual(evidence.direct);
    const ids = evidence.forward[0]!.cells.map(({ id }) => id);
    expect(ids).toHaveLength(8);
    for (const frame of evidence.forward) {
      for (const cell of frame.cells) {
        expect(cell.sameNode, `${cell.id} at ${frame.permille}`).toBe(true);
        expect(cell.connected, `${cell.id} at ${frame.permille}`).toBe(true);
        expect(cell.visibility, `${cell.id} at ${frame.permille}`).toBe(
          "visible"
        );
        expect(cell.transform, `${cell.id} at ${frame.permille}`).toBe("none");
        expect(cell.geometryDelta, `${cell.id} at ${frame.permille}`)
          .toBeLessThanOrEqual(0.5);
        expect(cell.opacity, `${cell.id} at ${frame.permille}`)
          .toBeGreaterThan(0);
      }
    }
    for (const id of ids) {
      const opacities = evidence.forward.map((frame) =>
        frame.cells.find((cell) => cell.id === id)!.opacity
      );
      if (id === "operator.add" || id === "rule.addition.underline") {
        expect(opacities.every((opacity) => opacity === 1)).toBe(true);
      } else {
        expect(opacities.every((opacity, index) =>
          index === 0 || opacity <= opacities[index - 1]! + 0.0001
        )).toBe(true);
        expect(opacities[0]).toBe(1);
        expect(opacities.at(-1)).toBeCloseTo(0.38, 4);
      }
    }
  });
}
