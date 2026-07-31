import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "wide", width: 960, height: 720 },
  { name: "phone", width: 390, height: 720 }
] as const) {
  test(`${viewport.name} ones contributions converge at measured total paint`, async ({
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

      const stage = () => document.querySelector<HTMLElement>(
        "[data-kp-place-value-ones-evaluation]"
      )!;
      const center = (rect: DOMRect) => ({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
      const midpoint = (
        points: readonly { readonly x: number; readonly y: number }[]
      ) => ({
        x: points.reduce((sum, point) => sum + point.x, 0) /
          points.length,
        y: points.reduce((sum, point) => sum + point.y, 0) /
          points.length
      });
      const measure = () => {
        const owners = [
          ...stage().querySelectorAll<HTMLElement>(
            "[data-kp-equation-material-owner-id]"
          )
        ].filter((owner) =>
          owner.dataset["kpEquationMaterialSemanticEntityId"]
            ?.startsWith("annotation.ones.material.") === true
        );
        const targetDigits = [
          ...stage().querySelectorAll<HTMLElement>(
            '[data-kp-place-value-operation-endpoint="target"] ' +
            '[data-kp-place-value-motion-target-id^=' +
            '"evaluation.ones.total."]'
          )
        ];
        const targetRects = targetDigits.map((digit) =>
          digit.getBoundingClientRect()
        );
        const targetBounds = {
          left: Math.min(...targetRects.map(({ left }) => left)),
          right: Math.max(...targetRects.map(
            ({ left, width: rectWidth }) => left + rectWidth
          )),
          top: Math.min(...targetRects.map(({ top }) => top)),
          bottom: Math.max(...targetRects.map(
            ({ top, height }) => top + height
          ))
        };
        const target = {
          x: (targetBounds.left + targetBounds.right) / 2,
          y: (targetBounds.top + targetBounds.bottom) / 2
        };
        const source = midpoint(owners.map((owner) =>
          center(owner.getBoundingClientRect())
        ));
        const maximumDocumentaryOverlapArea = Math.max(
          ...owners.map((owner) => {
            const blockerId = owner.dataset[
              "kpEquationMaterialSemanticEntityId"
            ]?.endsWith(".0")
              ? "digit.second.ones"
              : "digit.first.ones";
            const moving = owner.getBoundingClientRect();
            const blocker = (dom.writtenRoot as HTMLElement)
              .querySelector<HTMLElement>(
                `[data-kp-semantic-entity-id="${blockerId}"]`
              )!.getBoundingClientRect();
            const overlapWidth = Math.max(0, Math.min(
              moving.right,
              blocker.right
            ) - Math.max(moving.left, blocker.left));
            const overlapHeight = Math.max(0, Math.min(
              moving.bottom,
              blocker.bottom
            ) - Math.max(moving.top, blocker.top));
            return overlapWidth * overlapHeight;
          })
        );
        const underline = (dom.writtenRoot as HTMLElement)
          .querySelector<HTMLElement>(
            "[data-kp-place-value-underline]"
          )!.getBoundingClientRect();
        return {
          source,
          target,
          distance: Math.hypot(
            source.x - target.x,
            source.y - target.y
          ),
          sourceOpacities: owners.map((owner) =>
            getComputedStyle(owner).opacity
          ),
          maximumDocumentaryOverlapArea,
          targetBelowRule:
            target.y > underline.top + underline.height / 2,
          destinationPolicy:
            session.onesEvaluation.binding.convergenceAnchor
        };
      };

      const dense = [];
      let previous = 0;
      for (const [sequence, local] of [
        0.56, 0.58, 0.6, 0.62, 0.64, 0.66
      ].entries()) {
        const progress = 0.1 + local * 0.15;
        dom.apply(sample(progress, previous, sequence + 1));
        dense.push({ local, ...measure() });
        previous = progress;
      }
      const directProgress = 0.1 + 0.66 * 0.15;
      dom.apply(sample(0.249, previous, 20));
      dom.apply(sample(directProgress, 0.249, 21));
      const rewind = measure();
      dom.apply(sample(directProgress, directProgress, 22));
      const sameFrame = measure();

      return { dense, rewind, sameFrame };
    }, viewport);

    expect(evidence.dense.at(-1)?.destinationPolicy).toBe(
      "target-destination"
    );
    expect(evidence.dense.at(-1)?.distance).toBeLessThanOrEqual(5);
    expect(evidence.dense.at(-1)?.targetBelowRule).toBe(true);
    expect(evidence.dense.every(({ sourceOpacities }) =>
      sourceOpacities.every((opacity) => opacity === "1")
    )).toBe(true);
    expect(evidence.dense.every(({ maximumDocumentaryOverlapArea }) =>
      maximumDocumentaryOverlapArea <= 0.75
    )).toBe(true);
    expect(evidence.rewind.distance).toBeLessThanOrEqual(5);
    expect(evidence.sameFrame).toEqual(evidence.rewind);
  });

  test(`${viewport.name} ones carry stays opaque through its measured arch`, async ({
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
      const geometryUrl =
        "/src/rendering/native-katex-paint-geometry.ts";
      const runtime = await import(/* @vite-ignore */ runtimeUrl);
      const sharedDom = await import(/* @vite-ignore */ sharedDomUrl);
      const clock = await import(/* @vite-ignore */ clockUrl);
      const geometry = await import(/* @vite-ignore */ geometryUrl);
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

      const exchange = () => document.querySelector<HTMLElement>(
        "[data-kp-place-value-ones-exchange]"
      )!;
      const owner = (annotation: "remainder" | "carry") =>
        exchange().querySelector<HTMLElement>(
          "[data-kp-equation-material-semantic-entity-id=" +
          `"annotation.ones.${annotation}"]`
        )!;
      const persistent = (id: "result.ones" | "carry.tens") =>
        (dom.writtenRoot as HTMLElement).querySelector<HTMLElement>(
          `[data-kp-semantic-entity-id="${id}"]`
        )!;
      const paint = (element: HTMLElement) => {
        const visual = element.firstElementChild;
        return (
          element.matches(".mord, .katex-html")
            ? element
            : element.querySelector<HTMLElement>(".katex-html .mord") ??
              element.querySelector<HTMLElement>(".katex-html") ??
              (
                visual instanceof HTMLElement &&
                visual.matches(".mord, .katex-html")
                  ? visual
                  : element
              )
        );
      };
      const metric = (element: HTMLElement) => {
        const rect =
          geometry.measureKpNativeKatexSubtreePaintRect(
            dom.root,
            element
          ) ?? paint(element).getBoundingClientRect();
        const style = getComputedStyle(paint(element));
        return {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          center: {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          },
          opacity: getComputedStyle(element).opacity,
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight
        };
      };
      const endpointState = () => [
        persistent("result.ones"),
        persistent("carry.tens")
      ].map((element) => ({
        id: element.dataset["kpSemanticEntityId"],
        visibility: getComputedStyle(element).visibility,
        ownership: element.dataset["kpNativeEndpointOwnership"]
      }));
      const documentaryOverlap = (moving: ReturnType<typeof metric>) => {
        const documentaryIds = [
          "digit.first.hundreds",
          "digit.first.tens",
          "digit.first.ones",
          "digit.second.hundreds",
          "digit.second.tens",
          "digit.second.ones"
        ];
        return documentaryIds.map((id) => {
          const fixed = metric(
            (dom.writtenRoot as HTMLElement)
              .querySelector<HTMLElement>(
                `[data-kp-semantic-entity-id="${id}"]`
              )!
          );
          return {
            width: Math.max(0, Math.min(
              moving.left + moving.width,
              fixed.left + fixed.width
            ) - Math.max(moving.left, fixed.left)),
            height: Math.max(0, Math.min(
              moving.top + moving.height,
              fixed.top + fixed.height
            ) - Math.max(moving.top, fixed.top))
          };
        });
      };
      const localToGlobal = (local: number) => 0.25 + local * 0.15;
      const transferSamples = [];
      let previous = 0;
      for (const [sequence, local] of [0.599, 0.601].entries()) {
        const progress = localToGlobal(local);
        dom.apply(sample(progress, previous, sequence + 1));
        transferSamples.push({
          local,
          stageOwnership:
            exchange().dataset["kpNativeEndpointOwnership"],
          visibleOwners: [
            ...exchange().querySelectorAll<HTMLElement>(
              "[data-kp-equation-material-owner-id]"
            )
          ].filter((element) =>
            getComputedStyle(element).opacity === "1"
          ).length,
          opacities: [
            ...exchange().querySelectorAll<HTMLElement>(
              "[data-kp-equation-material-owner-id]"
            )
          ].map((element) => getComputedStyle(element).opacity),
          endpointState: endpointState()
        });
        previous = progress;
      }

      const route = [];
      for (const [sequence, local] of [
        0.61, 0.66, 0.71, 0.76, 0.81, 0.9, 0.993
      ].entries()) {
        const progress = localToGlobal(local);
        dom.apply(sample(progress, previous, 10 + sequence));
        const carry = metric(owner("carry"));
        route.push({
          local,
          carry,
          remainder: metric(owner("remainder")),
          documentaryOverlap: documentaryOverlap(carry),
          stageOwnership:
            exchange().dataset["kpNativeEndpointOwnership"],
          endpointState: endpointState()
        });
        previous = progress;
      }
      const carryEndpointBefore = metric(persistent("carry.tens"));
      const resultEndpointBefore = metric(persistent("result.ones"));
      const rewindProgress = localToGlobal(0.76);
      dom.apply(sample(localToGlobal(0.9), previous, 28));
      dom.apply(sample(rewindProgress, localToGlobal(0.9), 29));
      const rewind = {
        carry: metric(owner("carry")),
        remainder: metric(owner("remainder"))
      };

      dom.apply(sample(0.4, previous, 30));
      const boundary = {
        exchangeDisplay: getComputedStyle(exchange()).display,
        endpointState: endpointState(),
        carry: metric(persistent("carry.tens")),
        result: metric(persistent("result.ones"))
      };
      dom.apply(sample(0.4, 0.4, 31));
      const sameBoundary = {
        exchangeDisplay: getComputedStyle(exchange()).display,
        endpointState: endpointState(),
        carry: metric(persistent("carry.tens")),
        result: metric(persistent("result.ones"))
      };

      return {
        transferSamples,
        route,
        rewind,
        carryEndpointBefore,
        resultEndpointBefore,
        boundary,
        sameBoundary
      };
    }, viewport);

    for (const sample of evidence.transferSamples) {
      expect(sample.stageOwnership).toBe("transit");
      expect(sample.visibleOwners).toBeGreaterThan(0);
      expect(sample.opacities.every((opacity) =>
        opacity === "0" || opacity === "1"
      )).toBe(true);
      expect(sample.endpointState.every(({ visibility, ownership }) =>
        visibility === "hidden" && ownership === "transit"
      )).toBe(true);
    }
    expect(evidence.route.every(({ carry, remainder, stageOwnership }) =>
      carry.opacity === "1" &&
      remainder.opacity === "1" &&
      stageOwnership === "transit"
    )).toBe(true);
    expect(evidence.route.every(({ endpointState }) =>
      endpointState.every(({ visibility, ownership }) =>
        visibility === "hidden" && ownership === "transit"
      )
    )).toBe(true);
    expect(
      evidence.route.every(({ documentaryOverlap }) =>
        documentaryOverlap.every(({ width, height }) =>
          width <= 0.75 || height <= 0.75
        )
      ),
      JSON.stringify(evidence.route.map(({ local, documentaryOverlap }) => ({
        local,
        documentaryOverlap
      })))
    ).toBe(true);

    const routeStart = evidence.route[0]!.carry.center;
    const routeEnd = evidence.route.at(-1)!.carry.center;
    const lineDistance = (
      point: { readonly x: number; readonly y: number }
    ) => {
      const dx = routeEnd.x - routeStart.x;
      const dy = routeEnd.y - routeStart.y;
      return Math.abs(
        dy * point.x - dx * point.y +
        routeEnd.x * routeStart.y -
        routeEnd.y * routeStart.x
      ) / Math.hypot(dx, dy);
    };
    expect(Math.max(...evidence.route.slice(1, -1).map(({ carry }) =>
      lineDistance(carry.center)
    ))).toBeGreaterThan(2);

    const last = evidence.route.at(-1)!;
    const forwardAtRewind = evidence.route.find(
      ({ local }) => local === 0.76
    )!;
    expect(evidence.rewind).toEqual({
      carry: forwardAtRewind.carry,
      remainder: forwardAtRewind.remainder
    });
    for (const [moving, endpoint] of [
      [last.carry, evidence.carryEndpointBefore],
      [last.remainder, evidence.resultEndpointBefore]
    ] as const) {
      const endpointEvidence = JSON.stringify({ moving, endpoint });
      expect(Math.abs(moving.left - endpoint.left), endpointEvidence)
        .toBeLessThanOrEqual(0.5);
      expect(Math.abs(moving.top - endpoint.top), endpointEvidence)
        .toBeLessThanOrEqual(0.5);
      expect(Math.abs(moving.width - endpoint.width), endpointEvidence)
        .toBeLessThanOrEqual(0.5);
      expect(Math.abs(moving.height - endpoint.height), endpointEvidence)
        .toBeLessThanOrEqual(0.5);
      expect(moving.fontFamily).toBe(endpoint.fontFamily);
      expect(moving.fontSize).toBe(endpoint.fontSize);
      expect(moving.fontWeight).toBe(endpoint.fontWeight);
    }
    expect(evidence.boundary.exchangeDisplay).toBe("none");
    expect(evidence.boundary.endpointState.every(
      ({ visibility, ownership }) =>
        visibility === "visible" && ownership === "native-endpoint"
    )).toBe(true);
    expect(evidence.sameBoundary).toEqual(evidence.boundary);
  });
}
