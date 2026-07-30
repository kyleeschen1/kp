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
