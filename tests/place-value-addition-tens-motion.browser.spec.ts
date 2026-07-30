import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "wide", width: 960, height: 720 },
  { name: "phone", width: 390, height: 720 }
] as const) {
  test(`${viewport.name} tens evaluation and exchange reuse canonical motion`, async ({
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

      const onesExchange = () => document.querySelector<HTMLElement>(
        "[data-kp-place-value-ones-exchange]"
      )!;
      const tensEvaluation = () => document.querySelector<HTMLElement>(
        "[data-kp-place-value-tens-evaluation]"
      )!;
      const tensExchange = () => document.querySelector<HTMLElement>(
        "[data-kp-place-value-tens-exchange]"
      )!;
      const hundredsEvaluation = () =>
        document.querySelector<HTMLElement>(
          "[data-kp-place-value-hundreds-evaluation]"
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
      const blocks = () => [
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

      dom.apply(sample(0.325, 0, 1));
      const priorTarget = onesExchange().querySelector<HTMLElement>(
        '[data-kp-place-value-operation-endpoint="target"]'
      )!;
      priorTarget.style.opacity = "1";
      onesExchange().querySelector<HTMLElement>(
        "[data-kp-editor-equation-material-layer]"
      )!.style.visibility = "hidden";
      const stableIds = [
        "operator.add",
        "digit.first.hundreds",
        "digit.first.tens",
        "digit.second.hundreds",
        "digit.second.tens",
        "carry.tens",
        "result.ones"
      ] as const;
      const priorEndpoint = roots(
        onesExchange(),
        "target",
        stableIds
      );

      dom.apply(sample(0.4, 0.325, 2));
      const evaluationSource = roots(
        tensEvaluation(),
        "source",
        stableIds
      );

      dom.apply(sample(0.48, 0.4, 3));
      const evaluationForward = owners(tensEvaluation());
      dom.apply(sample(0.52, 0.48, 4));
      dom.apply(sample(0.48, 0.52, 5));
      const evaluationRewind = owners(tensEvaluation());

      const evaluationTarget = tensEvaluation().querySelector<HTMLElement>(
        '[data-kp-place-value-operation-endpoint="target"]'
      )!;
      evaluationTarget.style.opacity = "1";
      tensEvaluation().querySelector<HTMLElement>(
        "[data-kp-editor-equation-material-layer]"
      )!.style.visibility = "hidden";
      const evaluatedTotal = [
        "evaluation.tens.total.hundreds",
        "evaluation.tens.total.tens"
      ].map((id) => metric(
        evaluationTarget.querySelector<HTMLElement>(
          `[data-kp-semantic-entity-id="${id}"]`
        )!
      ));

      dom.apply(sample(0.56, 0.48, 6));
      const exchangeSource = [
        ...tensExchange().querySelectorAll<HTMLElement>(
          '[data-kp-place-value-operation-endpoint="source"] ' +
          "[data-kp-place-value-evaluation-digit]"
        )
      ].map(metric);

      dom.apply(sample(0.635, 0.56, 7));
      const exchangeForward = owners(tensExchange());
      dom.apply(sample(0.69, 0.635, 8));
      dom.apply(sample(0.635, 0.69, 9));
      const exchangeRewind = owners(tensExchange());
      dom.apply(sample(0.635, 0.635, 10, "base-ten"));
      const blocksForward = blocks();
      dom.apply(sample(0.69, 0.635, 11, "base-ten"));
      dom.apply(sample(0.635, 0.69, 12, "base-ten"));
      const blocksRewind = blocks();

      dom.apply(sample(0.649, 0.635, 13));
      const beforeWritten =
        tensExchange().dataset["kpIdentityTransferOccurred"];
      dom.apply(sample(0.649, 0.649, 14, "base-ten"));
      const before = {
        written: beforeWritten,
        baseTen: document.querySelector<SVGSVGElement>(
          "[data-kp-place-value-base-ten-projection]"
        )!.dataset["kpBaseTenExchangeTransferOccurred"],
        blocks: blocks()
      };
      dom.apply(sample(0.65, 0.649, 15));
      const afterWritten =
        tensExchange().dataset["kpIdentityTransferOccurred"];
      dom.apply(sample(0.65, 0.65, 16, "base-ten"));
      const after = {
        written: afterWritten,
        baseTen: document.querySelector<SVGSVGElement>(
          "[data-kp-place-value-base-ten-projection]"
        )!.dataset["kpBaseTenExchangeTransferOccurred"],
        blocks: blocks()
      };

      dom.apply(sample(0.71, 0.65, 17));
      const target = tensExchange().querySelector<HTMLElement>(
        '[data-kp-place-value-operation-endpoint="target"]'
      )!;
      const carry = target.querySelector<HTMLElement>(
        '[data-kp-semantic-entity-id="carry.hundreds"]'
      )!;
      const result = target.querySelector<HTMLElement>(
        '[data-kp-semantic-entity-id="result.tens"]'
      )!;
      const successorSource =
        hundredsEvaluation().querySelector<HTMLElement>(
          '[data-kp-place-value-operation-endpoint="source"]'
        )!;
      return {
        priorEndpoint,
        evaluationSource,
        evaluationForward,
        evaluationRewind,
        evaluatedTotal,
        exchangeSource,
        exchangeForward,
        exchangeRewind,
        blocksForward,
        blocksRewind,
        before,
        after,
        endpoint: {
          sourceOpacity: getComputedStyle(
            tensExchange().querySelector<HTMLElement>(
              '[data-kp-place-value-operation-endpoint="source"]'
            )!
          ).opacity,
          targetOpacity: getComputedStyle(target).opacity,
          exchangeDisplay: getComputedStyle(tensExchange()).display,
          successorDisplay: getComputedStyle(
            hundredsEvaluation()
          ).display,
          successorSourceOpacity:
            getComputedStyle(successorSource).opacity,
          successorCarryText:
            successorSource.querySelector<HTMLElement>(
              '[data-kp-semantic-entity-id="carry.hundreds"] .katex-html'
            )?.textContent?.trim(),
          successorTensText:
            successorSource.querySelector<HTMLElement>(
              '[data-kp-semantic-entity-id="result.tens"] .katex-html'
            )?.textContent?.trim(),
          successorOnesText:
            successorSource.querySelector<HTMLElement>(
              '[data-kp-semantic-entity-id="result.ones"] .katex-html'
            )?.textContent?.trim(),
          carryText:
            carry.querySelector<HTMLElement>(".katex-html")
              ?.textContent?.trim(),
          resultText:
            result.querySelector<HTMLElement>(".katex-html")
              ?.textContent?.trim(),
          onesText:
            target.querySelector<HTMLElement>(
              '[data-kp-semantic-entity-id="result.ones"] .katex-html'
            )?.textContent?.trim(),
          plusVisible:
            target.querySelector<HTMLElement>(
              '[data-kp-semantic-entity-id="operator.add"]'
            )?.dataset["kpVisibility"],
          carryFontSize: metric(carry).fontSize,
          resultFontSize: metric(result).fontSize
        }
      };
    }, viewport);

    expect(evidence.evaluationSource).toHaveLength(
      evidence.priorEndpoint.length
    );
    for (const [id, prior] of evidence.priorEndpoint) {
      const current = evidence.evaluationSource.find(
        ([candidateId]) => candidateId === id
      )?.[1];
      expect(current, `missing tens source ${id}`).toBeDefined();
      expect(Math.abs(current!.left - prior.left)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(current!.top - prior.top)).toBeLessThanOrEqual(0.5);
      expect(current!.fontFamily).toBe(prior.fontFamily);
      expect(current!.fontSize).toBe(prior.fontSize);
      expect(current!.fontWeight).toBe(prior.fontWeight);
    }
    expect(evidence.evaluationForward.every(({ opacity }) =>
      opacity === "0" || opacity === "1"
    )).toBe(true);
    const evaluationText = evidence.evaluationForward
      .filter(({ opacity }) => opacity === "1")
      .map(({ text }) => text)
      .join("");
    for (const glyph of ["1", "7", "5", "+"]) {
      expect(evaluationText).toContain(glyph);
    }
    expect(evidence.evaluationRewind).toEqual(evidence.evaluationForward);

    expect(evidence.exchangeSource).toHaveLength(2);
    for (const [index, prior] of evidence.evaluatedTotal.entries()) {
      const current = evidence.exchangeSource[index]!;
      expect(Math.abs(current.left - prior.left)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(current.top - prior.top)).toBeLessThanOrEqual(0.5);
      expect(current.fontFamily).toBe(prior.fontFamily);
      expect(current.fontSize).toBe(prior.fontSize);
      expect(current.fontWeight).toBe(prior.fontWeight);
    }
    expect(evidence.exchangeForward.every(({ opacity }) =>
      opacity === "0" || opacity === "1"
    )).toBe(true);
    expect(evidence.exchangeForward.some(({ opacity, transform }) =>
      opacity === "1" && transform !== "none"
    )).toBe(true);
    expect(evidence.exchangeRewind).toEqual(evidence.exchangeForward);
    expect(evidence.blocksRewind).toEqual(evidence.blocksForward);
    expect(evidence.before.written).toBe("false");
    expect(evidence.before.baseTen).toBe("false");
    expect(evidence.after.written).toBe("true");
    expect(evidence.after.baseTen).toBe("true");

    const consumed = (blocks: typeof evidence.before.blocks) =>
      blocks.filter(({ id }) =>
        id.startsWith("block.first.tens.") ||
        id === "block.second.tens.0" ||
        id === "block.second.tens.1" ||
        id === "block.exchange.ones-to-tens"
      );
    const produced = (blocks: typeof evidence.before.blocks) =>
      blocks.find(({ id }) => id === "block.exchange.tens-to-hundreds")!;
    expect(consumed(evidence.before.blocks)).toHaveLength(10);
    expect(consumed(evidence.before.blocks).every(
      ({ visible }) => visible === "true"
    )).toBe(true);
    expect(produced(evidence.before.blocks).visible).toBe("false");
    expect(consumed(evidence.after.blocks).every(
      ({ visible }) => visible === "false"
    )).toBe(true);
    expect(produced(evidence.after.blocks).visible).toBe("true");
    expect(evidence.endpoint.sourceOpacity).toBe("0");
    expect(evidence.endpoint.targetOpacity).toBe("0");
    expect(evidence.endpoint.exchangeDisplay).toBe("none");
    expect(evidence.endpoint.successorDisplay).toBe("grid");
    expect(evidence.endpoint.successorSourceOpacity).toBe("1");
    expect(evidence.endpoint.successorCarryText).toBe("1");
    expect(evidence.endpoint.successorTensText).toBe("3");
    expect(evidence.endpoint.successorOnesText).toBe("4");
    expect(evidence.endpoint.carryText).toBe("1");
    expect(evidence.endpoint.resultText).toBe("3");
    expect(evidence.endpoint.onesText).toBe("4");
    expect(evidence.endpoint.plusVisible).toBe("visible");
    expect(Number.parseFloat(evidence.endpoint.carryFontSize)).toBeLessThan(
      Number.parseFloat(evidence.endpoint.resultFontSize)
    );
  });
}
