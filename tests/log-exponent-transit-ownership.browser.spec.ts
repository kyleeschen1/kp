import { expect, test } from "@playwright/test";

test("log-exponent transit keeps one visible paint owner across native handoff", async ({
  page
}) => {
  await page.goto("/");

  const samples = await page.evaluate(async () => {
    const endpointPath = "/src/rendering/log-exponent-native-endpoints.ts";
    const transitPath = "/src/rendering/log-exponent-transit-session.ts";
    const treePath = "/src/semantic/log-exponent-transformation-tree.ts";
    const fontPath = "/src/rendering/equation-font-readiness.ts";
    const endpointModule = await import(/* @vite-ignore */ endpointPath);
    const transitModule = await import(/* @vite-ignore */ transitPath);
    const treeModule = await import(/* @vite-ignore */ treePath);
    const fontModule = await import(/* @vite-ignore */ fontPath);

    const stage = document.createElement("section");
    stage.style.cssText = [
      "position:fixed",
      "left:60px",
      "top:60px",
      "width:720px",
      "height:260px",
      "display:grid",
      "place-items:center",
      "overflow:hidden",
      "font-size:58px",
      "color:#f3f4f6",
      "background:#0d0e1c"
    ].join(";");
    document.body.append(stage);

    const sourceEndpoint =
      endpointModule.kpCanonicalLogExponentNativeEndpoints[1];
    const targetEndpoint =
      endpointModule.kpCanonicalLogExponentNativeEndpoints[2];
    const sourceRoot = document.createElement("div");
    const targetRoot = document.createElement("div");
    for (const root of [sourceRoot, targetRoot]) {
      root.style.cssText =
        "position:absolute;inset:0;display:grid;place-items:center";
    }
    sourceRoot.innerHTML = sourceEndpoint.nativeHtmlAndMathml;
    targetRoot.innerHTML = targetEndpoint.nativeHtmlAndMathml;
    targetRoot.style.opacity = "0";
    const materialLayer = document.createElement("div");
    materialLayer.dataset["kpEditorEquationMaterialLayer"] = "true";
    materialLayer.style.cssText =
      "position:absolute;inset:0;pointer-events:none";
    stage.append(sourceRoot, targetRoot, materialLayer);

    endpointModule.bindKpLogExponentNativeEndpointOwnership({
      root: sourceRoot,
      endpoint: sourceEndpoint
    });
    endpointModule.bindKpLogExponentNativeEndpointOwnership({
      root: targetRoot,
      endpoint: targetEndpoint
    });
    const fontReadiness = fontModule.createKpEquationFontReadiness(document);
    const source = await endpointModule.settleAndObserveKpLogExponentNativeEndpoint({
      endpointSide: "source",
      stage,
      root: sourceRoot,
      endpoint: sourceEndpoint,
      fontReadiness
    });
    const target = await endpointModule.settleAndObserveKpLogExponentNativeEndpoint({
      endpointSide: "target",
      stage,
      root: targetRoot,
      endpoint: targetEndpoint,
      fontReadiness
    });
    const session = transitModule.createKpLogExponentTransitSession({
      operation: treeModule.kpCanonicalLogExponentTransformationTree.operations[1],
      sourceEndpoint,
      targetEndpoint,
      source,
      target
    });
    const exponentDisposition = session.canonical.reconciliation.dispositions
      .find(({ semanticEntityIds }) =>
        semanticEntityIds.includes("logged.exponent") &&
        semanticEntityIds.includes("extracted.coefficient")
      );
    if (exponentDisposition?.lifecycle !== "persist") {
      throw new Error("Exponent continuity did not compile to one native paint transit.");
    }

    const result = [0, 0.01, 0.5, 0.999, 1].map((progress) => {
      const ownership = session.apply({ progress, direction: "forward" });
      const visibleMaterialOwners = [
        ...stage.querySelectorAll<HTMLElement>(
          "[data-kp-native-katex-scene-owner]"
        )
      ].filter((owner) => Number(getComputedStyle(owner).opacity) > 0).length;
      return {
        progress,
        visualOwner: ownership.visualOwner,
        sourceOpacity: Number(sourceRoot.style.opacity),
        materialOpacity: ownership.materialSceneOpacity,
        targetOpacity: Number(targetRoot.style.opacity),
        visibleMaterialOwners,
        ownerCount:
          ownership.sourceNativeOpacity +
          ownership.materialSceneOpacity +
          ownership.targetNativeOpacity
      };
    });
    session.retire();
    fontReadiness.dispose();
    stage.remove();
    return result;
  });

  expect(samples.map(({ visualOwner }) => visualOwner)).toEqual([
    "source-native",
    "material-scene",
    "material-scene",
    "material-scene",
    "target-native"
  ]);
  expect(samples.every(({ ownerCount }) => ownerCount === 1)).toBe(true);
  expect(samples.map(({ sourceOpacity, materialOpacity, targetOpacity }) =>
    [sourceOpacity, materialOpacity, targetOpacity]
  )).toEqual([
    [1, 0, 0],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [0, 0, 1]
  ]);
  expect(samples[1]!.visibleMaterialOwners).toBeGreaterThan(0);
  expect(samples[2]!.visibleMaterialOwners).toBeGreaterThan(0);
  expect(samples[3]!.visibleMaterialOwners).toBeGreaterThan(0);
});
