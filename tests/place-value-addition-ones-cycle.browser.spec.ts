import { expect, test } from "@playwright/test";

type KpPlaceValueAdditionBrowserHarnessModule = typeof import(
  "./support/place-value-addition-browser-harness.ts"
);

for (const viewport of [
  { name: "wide", width: 960, height: 720 },
  { name: "phone", width: 390, height: 720 }
] as const) {
  test(`${viewport.name} ones contributions converge at measured total paint`, async ({
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
      const stage = () => harness.operationScene(
        "decimal-position-0",
        "evaluation"
      );
      const midpoint = (
        points: readonly { readonly x: number; readonly y: number }[]
      ) => ({
        x: points.reduce((sum, point) => sum + point.x, 0) /
          points.length,
        y: points.reduce((sum, point) => sum + point.y, 0) /
          points.length
      });
      const measure = () => {
        const owners = harness.materialOwnerElements(stage()).filter((owner) =>
          owner.dataset["kpEquationMaterialSemanticEntityId"]
            ?.startsWith("annotation.decimal-position-0.material.") === true
        );
        const targetDigits = [
          ...stage().querySelectorAll<HTMLElement>(
            '[data-kp-place-value-operation-endpoint="target"] ' +
            '[data-kp-place-value-motion-target-id^=' +
            '"evaluation.ones.total."]'
          )
        ];
        const target = harness.unionPaintMetric(targetDigits).center;
        const source = midpoint(owners.map((owner) =>
          harness.paintMetric(owner).center
        ));
        const maximumDocumentaryOverlapArea = Math.max(
          ...owners.map((owner) => {
            const blockerId = owner.dataset[
              "kpEquationMaterialSemanticEntityId"
            ]?.endsWith(".0")
              ? "digit.second.ones"
              : "digit.first.ones";
            const overlap = harness.overlap(
              harness.paintMetric(owner),
              harness.paintMetric(harness.persistentCell(blockerId))
            );
            return overlap.width * overlap.height;
          })
        );
        const underline = (harness.dom.writtenRoot as HTMLElement)
          .querySelector<HTMLElement>(
            "[data-kp-place-value-underline]"
          )!;
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
            target.y > harness.paintMetric(underline).center.y,
          destinationPolicy:
            harness.session.columnEvaluations[0]!.binding.convergenceAnchor
        };
      };

      const dense = [];
      let previous = 0;
      for (const local of [
        0.56, 0.58, 0.6, 0.62, 0.64, 0.66
      ]) {
        const progress = 0.1 + local * 0.15;
        harness.apply(progress, previous);
        dense.push({ local, ...measure() });
        previous = progress;
      }
      const directProgress = 0.1 + 0.66 * 0.15;
      harness.apply(0.249, previous);
      harness.apply(directProgress, 0.249);
      const rewind = measure();
      harness.apply(directProgress, directProgress);
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
      const exchange = () => harness.operationScene(
        "decimal-position-0",
        "exchange"
      );
      const owner = (annotation: "remainder" | "carry") =>
        harness.materialOwner(
          exchange(),
          `annotation.decimal-position-0.${annotation}`
        );
      const persistent = (id: "result.ones" | "carry.tens") =>
        harness.persistentCell(id);
      const endpointState = () => harness.endpointState([
        "result.ones",
        "carry.tens"
      ]).map(({ id, visibility, ownership }) => ({
        id,
        visibility,
        ownership
      }));
      const documentaryOverlap = (
        moving: ReturnType<typeof harness.paintMetric>
      ) => {
        const documentaryIds = [
          "digit.first.hundreds",
          "digit.first.tens",
          "digit.first.ones",
          "digit.second.hundreds",
          "digit.second.tens",
          "digit.second.ones"
        ];
        return documentaryIds.map((id) => {
          const fixed = harness.paintMetric(harness.persistentCell(id));
          return harness.overlap(moving, fixed);
        });
      };
      const localToGlobal = (local: number) => 0.25 + local * 0.15;
      const transferSamples = [];
      let previous = 0;
      for (const local of [0.599, 0.601]) {
        const progress = localToGlobal(local);
        harness.apply(progress, previous);
        transferSamples.push({
          local,
          stageOwnership:
            exchange().dataset["kpNativeEndpointOwnership"],
          visibleOwners: [
            ...harness.materialOwnerElements(exchange())
          ].filter((element) =>
            getComputedStyle(element).opacity === "1"
          ).length,
          opacities: [
            ...harness.materialOwnerElements(exchange())
          ].map((element) => getComputedStyle(element).opacity),
          endpointState: endpointState()
        });
        previous = progress;
      }

      const route = [];
      for (const local of [
        0.61, 0.66, 0.71, 0.76, 0.81, 0.9, 0.993
      ]) {
        const progress = localToGlobal(local);
        harness.apply(progress, previous);
        const carry = harness.paintMetric(owner("carry"));
        route.push({
          local,
          carry,
          remainder: harness.paintMetric(owner("remainder")),
          documentaryOverlap: documentaryOverlap(carry),
          stageOwnership:
            exchange().dataset["kpNativeEndpointOwnership"],
          endpointState: endpointState()
        });
        previous = progress;
      }
      const carryEndpointBefore = harness.paintMetric(persistent("carry.tens"));
      const resultEndpointBefore = harness.paintMetric(persistent("result.ones"));
      const rewindProgress = localToGlobal(0.76);
      harness.apply(localToGlobal(0.9), previous);
      harness.apply(rewindProgress, localToGlobal(0.9));
      const rewind = {
        carry: harness.paintMetric(owner("carry")),
        remainder: harness.paintMetric(owner("remainder"))
      };

      harness.apply(0.4, previous);
      const boundary = {
        exchangeDisplay: getComputedStyle(exchange()).display,
        endpointState: endpointState(),
        carry: harness.paintMetric(persistent("carry.tens")),
        result: harness.paintMetric(persistent("result.ones"))
      };
      harness.apply(0.4, 0.4);
      const sameBoundary = {
        exchangeDisplay: getComputedStyle(exchange()).display,
        endpointState: endpointState(),
        carry: harness.paintMetric(persistent("carry.tens")),
        result: harness.paintMetric(persistent("result.ones"))
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
