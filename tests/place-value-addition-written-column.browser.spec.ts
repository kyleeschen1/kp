import { expect, test, type Page } from "@playwright/test";

type Endpoint = "initial" | "settled";

interface RootMetric {
  readonly id: string;
  readonly row: string;
  readonly column: string;
  readonly visibility: string;
  readonly opacity: string;
  readonly transform: string;
  readonly fontFamily: string;
  readonly fontSize: string;
  readonly fontWeight: string;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly centerX: number;
  readonly baseline: number;
}

interface StageMetric {
  readonly stage: {
    readonly left: number;
    readonly right: number;
    readonly width: number;
    readonly centerX: number;
  };
  readonly viewportWidth: number;
  readonly roots: readonly RootMetric[];
  readonly underline: {
    readonly left: number;
    readonly right: number;
    readonly width: number;
  };
}

for (const viewport of [
  { name: "wide", width: 960, height: 720 },
  { name: "phone", width: 390, height: 720 }
] as const) {
  test(`${viewport.name} written endpoints retain native geometry`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    const initial = await mountAndMeasure(page, "initial");
    const settled = await mountAndMeasure(page, "settled");

    expect(initial.stage.left).toBeGreaterThanOrEqual(0);
    expect(initial.stage.right).toBeLessThanOrEqual(viewport.width);
    expect(initial.stage.width).toBeLessThanOrEqual(viewport.width);
    expect(
      Math.abs(initial.stage.centerX - initial.viewportWidth / 2)
    ).toBeLessThanOrEqual(0.5);

    expect(initial.roots).toHaveLength(12);
    expect(settled.roots).toHaveLength(12);
    for (const source of initial.roots) {
      const target = settled.roots.find(({ id }) => id === source.id);
      expect(target, `missing settled root ${source.id}`).toBeDefined();
      expect(Math.abs(source.left - target!.left)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(source.top - target!.top)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(source.width - target!.width)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(source.height - target!.height)).toBeLessThanOrEqual(0.5);
      expect(source.fontFamily).toBe(target!.fontFamily);
      expect(source.fontSize).toBe(target!.fontSize);
      expect(source.fontWeight).toBe(target!.fontWeight);
      expect(source.opacity).toBe("1");
      expect(target!.opacity).toBe("1");
      expect(source.transform).toBe("none");
      expect(target!.transform).toBe("none");
    }

    expect(
      initial.roots.filter(({ visibility }) => visibility === "visible")
    ).toHaveLength(7);
    expect(
      settled.roots.filter(({ visibility }) => visibility === "visible")
    ).toHaveLength(12);
    expect(settled.underline.width).toBeGreaterThan(100);
    expect(settled.underline.left).toBeLessThan(
      requireRoot(settled, "operator.add").left + 0.5
    );
    expect(settled.underline.right).toBeGreaterThan(
      requireRoot(settled, "digit.second.ones").left +
        requireRoot(settled, "digit.second.ones").width -
        0.5
    );

    assertColumnCenters(settled);
    assertRowBaselines(settled, "first-addend");
    assertRowBaselines(settled, "second-addend");
    assertRowBaselines(settled, "result");

    const addend = requireRoot(settled, "digit.first.hundreds");
    const result = requireRoot(settled, "result.hundreds");
    const carry = requireRoot(settled, "carry.hundreds");
    expect(result.fontFamily).toBe(addend.fontFamily);
    expect(result.fontSize).toBe(addend.fontSize);
    expect(Number.parseFloat(carry.fontSize)).toBeLessThan(
      Number.parseFloat(addend.fontSize)
    );
  });

  test(`${viewport.name} base-ten view reuses SVG nodes across seeking`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const evidence = await page.evaluate(async () => {
      const projectionUrl =
        "/src/rendering/place-value-addition-base-ten-projection.ts";
      const domUrl =
        "/src/rendering/place-value-addition-base-ten-dom.ts";
      const { compileKpPlaceValueBaseTenProjection } =
        await import(/* @vite-ignore */ projectionUrl);
      const { createKpPlaceValueBaseTenDomProjection } =
        await import(/* @vite-ignore */ domUrl);
      const projection = compileKpPlaceValueBaseTenProjection();
      const dom = createKpPlaceValueBaseTenDomProjection({
        document,
        projection
      });
      const root = dom.root as SVGSVGElement;
      const app = document.querySelector<HTMLElement>("#app");
      if (app !== null) app.style.display = "none";
      document.body.append(root);
      Object.assign(document.body.style, {
        margin: "0",
        minHeight: "100vh",
        display: "grid",
        placeItems: "center"
      });
      const originalNodes = new Map(dom.blockElements);
      const sample = (stateId: string) => {
        dom.setState(stateId);
        const visible = [
          ...root.querySelectorAll<SVGRectElement>(
            '[data-kp-base-ten-visible="true"]'
          )
        ];
        const rootRect = root.getBoundingClientRect();
        return {
          stateId: dom.stateId(),
          visibleCount: visible.length,
          allCount: dom.blockElements.size,
          reused: [...dom.blockElements].every(([id, element]) =>
            originalNodes.get(id) === element
          ),
          opacityOne: [...dom.blockElements.values()].every((element) =>
            getComputedStyle(element).opacity === "1"
          ),
          contained: visible.every((element) => {
            const rect = element.getBoundingClientRect();
            // The SVG uses a one-device-pixel non-scaling stroke, so painted
            // bounds may extend half a pixel past the mathematical viewBox.
            return rect.left >= rootRect.left - 1 &&
              rect.right <= rootRect.right + 1 &&
              rect.top >= rootRect.top - 1 &&
              rect.bottom <= rootRect.bottom + 1;
          }),
          rootWidth: rootRect.width,
          viewportWidth: window.innerWidth
        };
      };
      return [
        sample("state.place-value.established"),
        sample("state.place-value.ones-exchanged"),
        sample("state.place-value.settled"),
        sample("state.place-value.established")
      ];
    });

    expect(evidence.map(({ visibleCount }) => visibleCount)).toEqual([
      29, 20, 11, 29
    ]);
    expect(evidence.map(({ stateId }) => stateId)).toEqual([
      "state.place-value.established",
      "state.place-value.ones-exchanged",
      "state.place-value.settled",
      "state.place-value.established"
    ]);
    expect(evidence.every(({ allCount }) => allCount === 31)).toBe(true);
    expect(evidence.every(({ reused }) => reused)).toBe(true);
    expect(evidence.every(({ opacityOne }) => opacityOne)).toBe(true);
    expect(evidence.every(({ contained }) => contained)).toBe(true);
    expect(
      evidence.every(({ rootWidth, viewportWidth }) =>
        rootWidth <= viewportWidth
      )
    ).toBe(true);
  });

  test(`${viewport.name} shared session switches views without remounting`, async ({
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
        sequence: number,
        selectedView: "written" | "base-ten" = "written"
      ) => runtime.sampleKpPlaceValueAdditionRuntime({
        session,
        clock: clock.createKpReaderClockSample({
          source: "controls",
          progress,
          previousProgress,
          sequence
        }),
        viewportWidth: width,
        selectedView
      });
      const initial = sample(0, 0, 0);
      const dom = sharedDom.createKpPlaceValueAdditionSharedDom({
        document,
        session,
        initialFrame: initial
      });
      const app = document.querySelector<HTMLElement>("#app");
      if (app !== null) app.style.display = "none";
      document.body.append(dom.root);
      const writtenRoot = dom.writtenRoot as HTMLElement;
      const baseTenRoot = dom.baseTenRoot as SVGSVGElement;
      const writtenCells = [
        ...writtenRoot.querySelectorAll<HTMLElement>(
          "[data-kp-place-value-native-root]"
        )
      ];
      const baseTenBlocks = [
        ...baseTenRoot.querySelectorAll<SVGRectElement>(
          "[data-kp-base-ten-block]"
        )
      ];
      const samples = width >= 881
        ? [
            sample(0.325, 0, 1),
            sample(0.635, 0.325, 2),
            sample(0.325, 0.635, 3)
          ]
        : [
            sample(0.325, 0, 1, "base-ten"),
            sample(0.635, 0.325, 2, "written"),
            sample(0.325, 0.635, 3, "base-ten")
          ];
      for (const frame of samples) dom.apply(frame);
      return {
        rendererSessionCount: document.querySelectorAll(
          "[data-kp-place-value-shared-session]"
        ).length,
        writtenCells: writtenCells.length,
        baseTenBlocks: baseTenBlocks.length,
        writtenReused: writtenCells.every((element) =>
          element.isConnected
        ),
        blocksReused: baseTenBlocks.every((element) =>
          element.isConnected
        ),
        mountedViewCount: dom.root.querySelectorAll(
          "[data-kp-place-value-view]"
        ).length,
        visibleViewCount: [
          ...document.querySelectorAll<HTMLElement>(
            "[data-kp-place-value-view]"
          )
        ].filter((element) =>
          getComputedStyle(element).display !== "none"
        ).length,
        direction: dom.root.dataset["kpPlaceValueClockDirection"],
        sequence: dom.root.dataset["kpPlaceValueClockSequence"]
      };
    }, viewport);

    expect(evidence.rendererSessionCount).toBe(1);
    expect(evidence.writtenCells).toBe(12);
    expect(evidence.baseTenBlocks).toBe(31);
    expect(evidence.writtenReused).toBe(true);
    expect(evidence.blocksReused).toBe(true);
    expect(evidence.mountedViewCount).toBe(2);
    expect(evidence.visibleViewCount).toBe(viewport.width >= 881 ? 2 : 1);
    expect(evidence.direction).toBe("rewind");
    expect(evidence.sequence).toBe("3");
  });

  test(`${viewport.name} ones evaluation is opaque, aligned, and reversible`, async ({
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

      const writtenRoot = dom.writtenRoot as HTMLElement;
      const initialGeometry = new Map(
        [
          "digit.first.ones",
          "digit.second.ones",
          "operator.add"
        ].map((id) => {
          const element = writtenRoot.querySelector<HTMLElement>(
            `[data-kp-semantic-entity-id="${id}"]`
          )!;
          const rect = element.getBoundingClientRect();
          return [id, {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
          }] as const;
        })
      );
      const evaluation = () => document.querySelector<HTMLElement>(
        "[data-kp-place-value-ones-evaluation]"
      )!;
      const ownerSignature = () => [
        ...evaluation().querySelectorAll<HTMLElement>(
          "[data-kp-equation-material-owner-id]"
        )
      ].map((owner) => ({
        id: owner.dataset["kpEquationMaterialOwnerId"]!,
        semantic:
          owner.dataset["kpEquationMaterialSemanticEntityId"] ?? "",
        opacity: getComputedStyle(owner).opacity,
        transform: getComputedStyle(owner).transform,
        text: owner.textContent?.trim() ?? ""
      })).sort((left, right) => left.id.localeCompare(right.id));

      dom.apply(sample(0.1, 0, 1));
      const sourceGeometry = new Map(
        [
          ...evaluation().querySelectorAll<HTMLElement>(
            '[data-kp-place-value-operation-endpoint="source"] ' +
            "[data-kp-place-value-native-root]"
          )
        ].filter((element) =>
          initialGeometry.has(element.dataset["kpSemanticEntityId"] ?? "")
        ).map((element) => {
          const rect = element.getBoundingClientRect();
          return [element.dataset["kpSemanticEntityId"]!, {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
          }] as const;
        })
      );

      dom.apply(sample(0.175, 0.1, 2));
      const forward = ownerSignature();
      const midpoint = {
        phaseId: evaluation().dataset["kpOperationEvaluationPhaseId"],
        direction:
          evaluation().dataset["kpOperationEvaluationDirection"],
        endpointOpacities: [
          ...evaluation().querySelectorAll<HTMLElement>(
            "[data-kp-place-value-operation-endpoint]"
          )
        ].map((element) => getComputedStyle(element).opacity),
        visibleOwnerTexts: forward
          .filter(({ opacity }) => opacity === "1")
          .map(({ text }) => text)
      };

      dom.apply(sample(0.249, 0.175, 3));
      dom.apply(sample(0.175, 0.249, 4));
      const rewind = ownerSignature();

      dom.apply(sample(0.25, 0.175, 5));
      const exchangeEndpoint = document.querySelector<HTMLElement>(
        "[data-kp-place-value-ones-exchange]"
      )!;
      const endpoint = {
        sourceOpacity: getComputedStyle(
          exchangeEndpoint.querySelector<HTMLElement>(
            '[data-kp-place-value-operation-endpoint="source"]'
          )!
        ).opacity,
        targetOpacity: getComputedStyle(
          exchangeEndpoint.querySelector<HTMLElement>(
            '[data-kp-place-value-operation-endpoint="target"]'
          )!
        ).opacity,
        visibleEvaluationDigits: [
          ...exchangeEndpoint.querySelectorAll<HTMLElement>(
            '[data-kp-place-value-operation-endpoint="source"] ' +
            "[data-kp-place-value-evaluation-digit]"
          )
        ].map((element) => ({
          column: element.dataset["kpPlaceValueColumn"],
          text:
            element.querySelector<HTMLElement>(".katex-html")
              ?.textContent?.trim() ?? ""
        }))
      };
      return {
        initialGeometry: [...initialGeometry],
        sourceGeometry: [...sourceGeometry],
        forward,
        rewind,
        midpoint,
        endpoint,
        programId:
          evaluation().dataset["kpOperationEvaluationProgramId"]
      };
    }, viewport);

    expect(evidence.programId).toBe(
      "kp.executable-program.operation-evaluation"
    );
    expect(evidence.sourceGeometry).toHaveLength(3);
    for (const [id, initial] of evidence.initialGeometry) {
      const source = evidence.sourceGeometry.find(
        ([sourceId]) => sourceId === id
      )?.[1];
      expect(source, `missing source geometry ${id}`).toBeDefined();
      expect(Math.abs(source!.left - initial.left)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(source!.top - initial.top)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(source!.width - initial.width)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(source!.height - initial.height)).toBeLessThanOrEqual(
        0.5
      );
    }
    expect(evidence.forward.length).toBeGreaterThan(0);
    expect(
      evidence.forward.every(({ opacity }) =>
        opacity === "0" || opacity === "1"
      )
    ).toBe(true);
    expect(
      evidence.forward.some(({ opacity, transform }) =>
        opacity === "1" && transform !== "none"
      )
    ).toBe(true);
    expect(evidence.midpoint.endpointOpacities.every((opacity) =>
      opacity === "0" || opacity === "1"
    )).toBe(true);
    expect(evidence.midpoint.direction).toBe("forward");
    expect(evidence.midpoint.phaseId).toBeTruthy();
    expect(
      evidence.midpoint.visibleOwnerTexts.join("")
    ).toContain("8");
    expect(
      evidence.midpoint.visibleOwnerTexts.join("")
    ).toContain("6");
    expect(
      evidence.midpoint.visibleOwnerTexts.join("")
    ).toContain("+");
    expect(evidence.rewind).toEqual(evidence.forward);
    expect(evidence.endpoint.sourceOpacity).toBe("1");
    expect(evidence.endpoint.targetOpacity).toBe("0");
    expect(evidence.endpoint.visibleEvaluationDigits).toEqual([
      { column: "tens", text: "1" },
      { column: "ones", text: "4" }
    ]);
  });

  test(`${viewport.name} ones exchange carries opaque identity across both views`, async ({
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
        sequence: number,
        selectedView: "written" | "base-ten" = "written"
      ) => runtime.sampleKpPlaceValueAdditionRuntime({
        session,
        clock: clock.createKpReaderClockSample({
          source: "controls",
          progress,
          previousProgress,
          sequence
        }),
        viewportWidth: width,
        selectedView
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

      const evaluation = () => document.querySelector<HTMLElement>(
        "[data-kp-place-value-ones-evaluation]"
      )!;
      const exchange = () => document.querySelector<HTMLElement>(
        "[data-kp-place-value-ones-exchange]"
      )!;
      const tensEvaluation = () => document.querySelector<HTMLElement>(
        "[data-kp-place-value-tens-evaluation]"
      )!;
      const paintMetric = (element: HTMLElement) => {
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
      const ownerSignature = () => [
        ...exchange().querySelectorAll<HTMLElement>(
          "[data-kp-equation-material-owner-id]"
        )
      ].map((owner) => ({
        id: owner.dataset["kpEquationMaterialOwnerId"]!,
        role: owner.dataset["kpEquationMaterialFragmentRole"] ?? "",
        opacity: getComputedStyle(owner).opacity,
        transform: getComputedStyle(owner).transform,
        text: owner.textContent?.trim() ?? ""
      })).sort((left, right) => left.id.localeCompare(right.id));
      const baseTenSignature = () => [
        ...document.querySelectorAll<SVGRectElement>(
          "[data-kp-base-ten-block]"
        )
      ].map((block) => ({
        id: block.dataset["kpBaseTenBlock"]!,
        visible: block.dataset["kpBaseTenVisible"],
        x: block.getAttribute("x"),
        y: block.getAttribute("y"),
        width: block.getAttribute("width"),
        height: block.getAttribute("height")
      })).sort((left, right) => left.id.localeCompare(right.id));
      const transferState = () => ({
        written:
          exchange().dataset["kpIdentityTransferOccurred"],
        baseTen: document.querySelector<SVGSVGElement>(
          "[data-kp-place-value-base-ten-projection]"
        )!.dataset["kpBaseTenExchangeTransferOccurred"]
      });

      dom.apply(sample(0.175, 0, 1));
      const evaluationTarget = evaluation().querySelector<HTMLElement>(
        '[data-kp-place-value-operation-endpoint="target"]'
      )!;
      const evaluationMaterial = evaluation().querySelector<HTMLElement>(
        "[data-kp-editor-equation-material-layer]"
      )!;
      evaluationTarget.style.opacity = "1";
      evaluationMaterial.style.visibility = "hidden";
      const evaluationEndpoint = [
        "evaluation.ones.total.tens",
        "evaluation.ones.total.ones"
      ].map((id) => paintMetric(
        evaluationTarget.querySelector<HTMLElement>(
          `[data-kp-semantic-entity-id="${id}"]`
        )!
      ));

      dom.apply(sample(0.25, 0.175, 2));
      const exchangeSource = [
        ...exchange().querySelectorAll<HTMLElement>(
          '[data-kp-place-value-operation-endpoint="source"] ' +
          "[data-kp-place-value-evaluation-digit]"
        )
      ].map(paintMetric);

      dom.apply(sample(0.325, 0.25, 3));
      const writtenForward = ownerSignature();
      dom.apply(sample(0.37, 0.325, 4));
      dom.apply(sample(0.325, 0.37, 5));
      const writtenRewind = ownerSignature();

      dom.apply(sample(0.325, 0.325, 6, "base-ten"));
      const baseTenForward = baseTenSignature();
      dom.apply(sample(0.37, 0.325, 7, "base-ten"));
      dom.apply(sample(0.325, 0.37, 8, "base-ten"));
      const baseTenRewind = baseTenSignature();

      dom.apply(sample(0.339, 0.325, 9));
      const beforeWritten = transferState().written;
      dom.apply(sample(0.339, 0.339, 10, "base-ten"));
      const before = {
        written: beforeWritten,
        baseTen: transferState().baseTen,
        blocks: baseTenSignature()
      };
      dom.apply(sample(0.34, 0.339, 11));
      const afterWritten = transferState().written;
      dom.apply(sample(0.34, 0.34, 12, "base-ten"));
      const after = {
        written: afterWritten,
        baseTen: transferState().baseTen,
        blocks: baseTenSignature()
      };

      dom.apply(sample(0.4, 0.34, 13));
      const endpointSource = exchange().querySelector<HTMLElement>(
        '[data-kp-place-value-operation-endpoint="source"]'
      )!;
      const endpointTarget = exchange().querySelector<HTMLElement>(
        '[data-kp-place-value-operation-endpoint="target"]'
      )!;
      const carry = endpointTarget.querySelector<HTMLElement>(
        '[data-kp-semantic-entity-id="carry.tens"]'
      )!;
      const result = endpointTarget.querySelector<HTMLElement>(
        '[data-kp-semantic-entity-id="result.ones"]'
      )!;
      const successorSource = tensEvaluation().querySelector<HTMLElement>(
        '[data-kp-place-value-operation-endpoint="source"]'
      )!;
      return {
        evaluationEndpoint,
        exchangeSource,
        writtenForward,
        writtenRewind,
        baseTenForward,
        baseTenRewind,
        before,
        after,
        endpoint: {
          sourceOpacity: getComputedStyle(endpointSource).opacity,
          targetOpacity: getComputedStyle(endpointTarget).opacity,
          exchangeDisplay: getComputedStyle(exchange()).display,
          successorDisplay: getComputedStyle(tensEvaluation()).display,
          successorSourceOpacity: getComputedStyle(successorSource).opacity,
          successorCarryText:
            successorSource.querySelector<HTMLElement>(
              '[data-kp-semantic-entity-id="carry.tens"] .katex-html'
            )?.textContent?.trim(),
          successorResultText:
            successorSource.querySelector<HTMLElement>(
              '[data-kp-semantic-entity-id="result.ones"] .katex-html'
            )?.textContent?.trim(),
          carryText:
            carry.querySelector<HTMLElement>(".katex-html")
              ?.textContent?.trim(),
          resultText:
            result.querySelector<HTMLElement>(".katex-html")
              ?.textContent?.trim(),
          carryFontSize: paintMetric(carry).fontSize,
          resultFontSize: paintMetric(result).fontSize
        }
      };
    }, viewport);

    expect(evidence.exchangeSource).toHaveLength(2);
    for (const [index, prior] of evidence.evaluationEndpoint.entries()) {
      const source = evidence.exchangeSource[index]!;
      expect(Math.abs(source.left - prior.left)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(source.top - prior.top)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(source.width - prior.width)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(source.height - prior.height)).toBeLessThanOrEqual(0.5);
      expect(source.fontFamily).toBe(prior.fontFamily);
      expect(source.fontSize).toBe(prior.fontSize);
      expect(source.fontWeight).toBe(prior.fontWeight);
    }
    expect(evidence.writtenForward.length).toBeGreaterThan(0);
    expect(evidence.writtenForward.every(({ opacity }) =>
      opacity === "0" || opacity === "1"
    )).toBe(true);
    expect(evidence.writtenForward.some(({ opacity, transform }) =>
      opacity === "1" && transform !== "none"
    )).toBe(true);
    expect(
      evidence.writtenForward
        .filter(({ opacity }) => opacity === "1")
        .map(({ text }) => text)
        .join("")
    ).toContain("1");
    expect(
      evidence.writtenForward
        .filter(({ opacity }) => opacity === "1")
        .map(({ text }) => text)
        .join("")
    ).toContain("4");
    expect(evidence.writtenRewind).toEqual(evidence.writtenForward);
    expect(evidence.baseTenRewind).toEqual(evidence.baseTenForward);
    expect(evidence.before.written).toBe("false");
    expect(evidence.before.baseTen).toBe("false");
    expect(evidence.after.written).toBe("true");
    expect(evidence.after.baseTen).toBe("true");

    const consumed = (blocks: typeof evidence.before.blocks) =>
      blocks.filter(({ id }) =>
        id.startsWith("block.first.ones.") ||
        id === "block.second.ones.0" ||
        id === "block.second.ones.1"
      );
    const produced = (blocks: typeof evidence.before.blocks) =>
      blocks.find(({ id }) => id === "block.exchange.ones-to-tens")!;
    expect(consumed(evidence.before.blocks).every(
      ({ visible }) => visible === "true"
    )).toBe(true);
    expect(produced(evidence.before.blocks).visible).toBe("false");
    expect(consumed(evidence.after.blocks).every(
      ({ visible }) => visible === "false"
    )).toBe(true);
    expect(produced(evidence.after.blocks).visible).toBe("true");
    expect(evidence.endpoint.sourceOpacity).toBe("0");
    // Exact boundaries belong to the successor beat. The completed result
    // must therefore be opaque in the tens source, not in the retired scene.
    expect(evidence.endpoint.targetOpacity).toBe("0");
    expect(evidence.endpoint.exchangeDisplay).toBe("none");
    expect(evidence.endpoint.successorDisplay).toBe("grid");
    expect(evidence.endpoint.successorSourceOpacity).toBe("1");
    expect(evidence.endpoint.successorCarryText).toBe("1");
    expect(evidence.endpoint.successorResultText).toBe("4");
    expect(evidence.endpoint.carryText).toBe("1");
    expect(evidence.endpoint.resultText).toBe("4");
    expect(Number.parseFloat(evidence.endpoint.carryFontSize)).toBeLessThan(
      Number.parseFloat(evidence.endpoint.resultFontSize)
    );
  });
}

async function mountAndMeasure(
  page: Page,
  endpoint: Endpoint
): Promise<StageMetric> {
  await page.goto("/");
  await page.evaluate(async (selectedEndpoint) => {
    const projectionUrl =
      "/src/reader/compiler/place-value-addition-written-column-projection.ts";
    const rendererUrl =
      "/src/rendering/place-value-addition-written-column-dom.ts";
    const { compileKpPlaceValueWrittenColumnProjection } =
      await import(/* @vite-ignore */ projectionUrl);
    const { renderKpPlaceValueWrittenColumnElement } =
      await import(/* @vite-ignore */ rendererUrl);
    const stage = renderKpPlaceValueWrittenColumnElement({
      document,
      projection: compileKpPlaceValueWrittenColumnProjection(),
      endpoint: selectedEndpoint
    });
    document
      .querySelector("[data-kp-place-value-written-projection]")
      ?.remove();
    const app = document.querySelector<HTMLElement>("#app");
    if (app !== null) app.style.display = "none";
    document.body.append(stage);
    Object.assign(document.body.style, {
      margin: "0",
      minHeight: "100vh",
      display: "grid",
      placeItems: "center"
    });
    await document.fonts.ready;
  }, endpoint);
  await page.waitForTimeout(50);
  return page.evaluate(() => {
    const stageRoot = document.querySelector<HTMLElement>(
      "[data-kp-place-value-written-projection]"
    )!;
    const stage = stageRoot.querySelector<HTMLElement>(
      "[data-kp-place-value-grid]"
    )!;
    const stageRect = stage.getBoundingClientRect();
    const roots = [
      ...stage.querySelectorAll<HTMLElement>(
        "[data-kp-place-value-native-root]"
      )
    ].map((root): RootMetric => {
      const paint =
        root.querySelector<HTMLElement>(".katex-html .mord") ??
        root.querySelector<HTMLElement>(".katex-html")!;
      const style = getComputedStyle(paint);
      const rect = root.getBoundingClientRect();
      const marker = document.createElement("span");
      marker.style.cssText =
        "display:inline-block;width:0;height:0;border:0;" +
        "padding:0;margin:0;vertical-align:baseline";
      root.append(marker);
      const baseline = marker.getBoundingClientRect().top;
      marker.remove();
      return {
        id: root.dataset["kpSemanticEntityId"]!,
        row: root.dataset["kpPlaceValueRow"]!,
        column: root.dataset["kpPlaceValueColumn"]!,
        visibility: root.dataset["kpVisibility"]!,
        opacity: getComputedStyle(root).opacity,
        transform: getComputedStyle(root).transform,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
        baseline
      };
    });
    const underline = stage.querySelector<HTMLElement>(
      "[data-kp-place-value-underline]"
    )!.getBoundingClientRect();
    return {
      stage: {
        left: stageRect.left,
        right: stageRect.right,
        width: stageRect.width,
        centerX: stageRect.left + stageRect.width / 2
      },
      viewportWidth: window.innerWidth,
      roots,
      underline: {
        left: underline.left,
        right: underline.right,
        width: underline.width
      }
    };
  });
}

function requireRoot(metric: StageMetric, id: string): RootMetric {
  const root = metric.roots.find((candidate) => candidate.id === id);
  expect(root, `missing root ${id}`).toBeDefined();
  return root!;
}

function assertColumnCenters(metric: StageMetric): void {
  for (const column of ["hundreds", "tens", "ones"]) {
    const centers = metric.roots
      .filter((root) => root.column === column)
      .map(({ centerX }) => centerX);
    expect(Math.max(...centers) - Math.min(...centers)).toBeLessThanOrEqual(0.5);
  }
}

function assertRowBaselines(metric: StageMetric, row: string): void {
  const baselines = metric.roots
    .filter((root) => root.row === row)
    .map(({ baseline }) => baseline);
  expect(Math.max(...baselines) - Math.min(...baselines)).toBeLessThanOrEqual(
    0.75
  );
}
