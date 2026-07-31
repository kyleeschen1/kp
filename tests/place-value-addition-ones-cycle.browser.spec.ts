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
}
