import { expect, test } from "@playwright/test";

test("material junction premeasures once and returns exact ownership to native geometry", async ({
  page
}) => {
  await page.goto("/");

  const result = await page.evaluate(async () => {
    const plannerPath = "/src/animation/material-junction.ts";
    const adapterPath = "/src/rendering/equation-material-junction-dom.ts";
    const planner = await import(/* @vite-ignore */ plannerPath);
    const adapter = await import(/* @vite-ignore */ adapterPath);
    const stage = document.createElement("div");
    stage.style.cssText = [
      "position:fixed",
      "left:40px",
      "top:40px",
      "width:420px",
      "height:160px",
      "font:32px KaTeX_Main, serif"
    ].join(";");
    document.body.append(stage);

    const createToken = (text: string, left: number, top: number) => {
      const token = document.createElement("span");
      token.textContent = text;
      token.style.cssText = `position:absolute;left:${left}px;top:${top}px`;
      stage.append(token);
      return token;
    };
    const numerator = createToken("1", 20, 15);
    const denominator = createToken("2", 20, 65);
    const hookNative = createToken("√", 260, 52);
    const overbarNative = createToken("―", 292, 46);
    const hookMaterial = hookNative.cloneNode(true) as HTMLElement;
    const overbarMaterial = overbarNative.cloneNode(true) as HTMLElement;
    stage.append(hookMaterial, overbarMaterial);

    let layoutReads = 0;
    const elements = new Map<string, HTMLElement>([
      ["numerator", numerator],
      ["denominator", denominator],
      ["hook", hookNative],
      ["overbar", overbarNative]
    ]);
    const originals = new Map<HTMLElement, () => DOMRect>();
    for (const element of [stage, ...elements.values()]) {
      const original = element.getBoundingClientRect.bind(element);
      originals.set(element, original);
      element.getBoundingClientRect = () => {
        layoutReads += 1;
        return original();
      };
    }

    const measurements = adapter.measureKpMaterialJunctionDomGeometry({
      stage,
      elements
    });
    const readsAfterMeasurement = layoutReads;
    const plan = planner.createKpMaterialJunctionPlan({
      id: "browser.radical-junction",
      ownershipMode: "fission-fusion",
      sourceAnnotations: [
        { id: "numerator", semanticRole: "exponent-numerator", selectorIds: ["numerator"], propagationRank: 0 },
        { id: "denominator", semanticRole: "exponent-denominator", selectorIds: ["denominator"], propagationRank: 1 }
      ],
      targetAnnotations: [
        { id: "hook", semanticRole: "radical-hook", selectorIds: ["hook"], propagationRank: 0 },
        { id: "overbar", semanticRole: "radical-overbar", selectorIds: ["overbar"], propagationRank: 1 }
      ],
      lineages: [{
        id: "lineage.notation",
        sourceAnnotationIds: ["numerator", "denominator"],
        targetAnnotationIds: ["hook", "overbar"]
      }],
      measurements,
      anchorPolicy: "target-opposite-corner",
      pathFamily: "opposite-corner"
    });
    const sources = new Map<string, HTMLElement>([
      ["numerator", numerator],
      ["denominator", denominator]
    ]);
    const targets = new Map([
      ["hook", { material: hookMaterial, native: hookNative }],
      ["overbar", { material: overbarMaterial, native: overbarNative }]
    ]);

    for (const progress of [0.2, 0.6, 0.7, 0.9]) {
      adapter.applyKpMaterialJunctionDomFrame({
        stage,
        frame: planner.sampleKpMaterialJunction({ plan, progress }),
        sources,
        targets
      });
    }
    const readsAfterSampling = layoutReads;
    const activePhase = stage.dataset["kpMaterialJunctionPhase"];
    const activeMaterialTransform = hookMaterial.style.translate;
    const activeNativeOpacity = hookNative.style.opacity;

    adapter.applyKpMaterialJunctionDomFrame({
      stage,
      frame: planner.sampleKpMaterialJunction({
        plan,
        progress: 1,
        targetGeometryResidualPx: { hook: 0, overbar: 0 }
      }),
      sources,
      targets
    });
    const settled = {
      phase: stage.dataset["kpMaterialJunctionPhase"],
      nativeOpacity: hookNative.style.opacity,
      nativeTranslate: hookNative.style.translate,
      nativeScale: hookNative.style.scale,
      materialOpacity: hookMaterial.style.opacity
    };
    stage.remove();

    return {
      readsAfterMeasurement,
      readsAfterSampling,
      activePhase,
      activeMaterialTransform,
      activeNativeOpacity,
      settled
    };
  });

  expect(result.readsAfterMeasurement).toBe(5);
  expect(result.readsAfterSampling).toBe(result.readsAfterMeasurement);
  expect(result.activePhase).toBe("recognize");
  expect(result.activeMaterialTransform).not.toBe("");
  expect(result.activeNativeOpacity).toBe("0");
  expect(result.settled).toEqual({
    phase: "settled",
    nativeOpacity: "",
    nativeTranslate: "",
    nativeScale: "",
    materialOpacity: "0"
  });
});
