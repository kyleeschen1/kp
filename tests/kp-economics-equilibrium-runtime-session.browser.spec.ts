import { expect, test } from "@playwright/test";

test("economics runtime scaffold mounts once and disposes idempotently", async ({
  page
}) => {
  await page.goto("/tutorials/economics/demand-shift/");

  const result = await page.evaluate(async () => {
    const runtimeUrl = "/src/rendering/economics-equilibrium-runtime-session.ts";
    const animationUrl = "/src/animation/economics-equilibrium-adapter.ts";
    const runtimeFrameUrl =
      "/src/animation/economics-equilibrium-runtime-frame.ts";
    const samplerUrl = "/src/animation/runtime-sampler.ts";
    const viewportUrl = "/src/editor/graph-svg-viewport.ts";
    const runtime = await import(/* @vite-ignore */ runtimeUrl);
    const animationModule = await import(/* @vite-ignore */ animationUrl);
    const runtimeFrameModule = await import(/* @vite-ignore */ runtimeFrameUrl);
    const samplerModule = await import(/* @vite-ignore */ samplerUrl);
    const viewportModule = await import(/* @vite-ignore */ viewportUrl);
    const animation = animationModule.createEconomicsEquilibriumAnimationAsset();
    const frame = runtimeFrameModule.sampleKpEconomicsEquilibriumRuntimeFrame({
      animation,
      runtimeFrame: samplerModule.sampleKpAnimationRuntimeFrame({
        animation,
        progress: 0
      })
    });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const content = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.append(content);
    const input = {
      content,
      frame,
      viewport: viewportModule.createKpEditorGraphSvgViewportModel(animation)
    };
    const first = runtime.mountKpEconomicsEquilibriumRuntimeScaffold(input);
    const initialView = first.view;
    const second = runtime.mountKpEconomicsEquilibriumRuntimeScaffold(input);
    const descendants = initialView.querySelectorAll("*").length;
    first.dispose();
    first.dispose();

    return {
      descendants,
      disposedStatus: first.status,
      sameScaffold: first === second,
      sameView: initialView === second.view,
      viewCountAfterDispose: content.querySelectorAll(
        "[data-kp-economics-equilibrium-view]"
      ).length
    };
  });

  expect(result).toEqual({
    descendants: 234,
    disposedStatus: "disposed",
    sameScaffold: true,
    sameView: true,
    viewCountAfterDispose: 0
  });
});
