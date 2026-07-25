import { expect, test } from "@playwright/test";

test("observer measures one explicitly tagged real KaTeX fragment", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.evaluate(async () => document.fonts.ready);
  const observed = await page.evaluate(async () => {
    const stage = document.querySelector<HTMLElement>(
      '[data-reconciliation-case="solve-x"] [data-case-stage]'
    )!;
    const renderedX = stage.querySelector<HTMLElement>(
      "[data-case-source] .mord.mathnormal"
    )!;
    renderedX.dataset["kpMotionId"] = "motion.solve-x.x";
    const observeKpNativeKatexFragments = (
      window as unknown as {
        __kpObserveNativeKatexFragments: (input: {
          stage: HTMLElement;
          bindings: readonly {
            id: string;
            semanticEntityId: string;
            motionId: string;
            glyphKey: string;
          }[];
          fontRevision: number;
        }) => {
          lifecycle: string;
          fragments: readonly {
            sourceElement: HTMLElement;
            rect: { left: number; width: number; height: number };
            styleFingerprint: string;
          }[];
        };
      }
    ).__kpObserveNativeKatexFragments;
    const batch = observeKpNativeKatexFragments({
      stage,
      bindings: [{
        id: "fragment.solve-x.x",
        semanticEntityId: "equation.solve-x.before.x",
        motionId: "motion.solve-x.x",
        glyphKey: "x"
      }],
      fontRevision: 1
    });
    const fragment = batch.fragments[0]!;
    return {
      lifecycle: batch.lifecycle,
      text: fragment.sourceElement.textContent,
      className: fragment.sourceElement.className,
      rect: fragment.rect,
      styleFingerprint: fragment.styleFingerprint
    };
  });

  expect(observed.lifecycle).toBe("renderer-session");
  expect(observed.text).toBe("x");
  expect(observed.className).toContain("mathnormal");
  expect(observed.rect.width).toBeGreaterThan(0);
  expect(observed.rect.height).toBeGreaterThan(0);
  expect(observed.rect.left).toBeGreaterThanOrEqual(0);
  expect(observed.styleFingerprint).toContain("font-family:");
});

test("observer rejects missing and duplicate explicit motion nodes", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  const messages = await page.evaluate(async () => {
    const stage = document.querySelector<HTMLElement>(
      '[data-reconciliation-case="solve-x"] [data-case-stage]'
    )!;
    const observeKpNativeKatexFragments = (
      window as unknown as {
        __kpObserveNativeKatexFragments: (input: {
          stage: HTMLElement;
          bindings: readonly {
            id: string;
            semanticEntityId: string;
            motionId: string;
            glyphKey: string;
          }[];
          fontRevision: number;
        }) => unknown;
      }
    ).__kpObserveNativeKatexFragments;
    const binding = {
      id: "fragment.solve-x.x",
      semanticEntityId: "entity.x",
      motionId: "motion.ambiguous",
      glyphKey: "x"
    };
    const capture = (): string => {
      try {
        observeKpNativeKatexFragments({
          stage,
          bindings: [binding],
          fontRevision: 0
        });
        return "";
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    };
    const missing = capture();
    const nodes = stage.querySelectorAll<HTMLElement>(".mord.mathnormal");
    nodes[0]!.dataset["kpMotionId"] = binding.motionId;
    nodes[1]!.dataset["kpMotionId"] = binding.motionId;
    return { missing, duplicate: capture() };
  });

  expect(messages.missing).toContain("resolved to 0");
  expect(messages.duplicate).toContain("resolved to 2");
});

test("stage-local fragment geometry is stable under stage scaling", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  const measurements = await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>(
      '[data-reconciliation-case="solve-x"] [data-case-stage]'
    )!;
    const renderedX = stage.querySelector<HTMLElement>(
      "[data-case-source] .mord.mathnormal"
    )!;
    renderedX.dataset["kpMotionId"] = "motion.solve-x.scaled-x";
    const observe = (
      window as unknown as {
        __kpObserveNativeKatexFragments: (input: {
          stage: HTMLElement;
          bindings: readonly {
            id: string;
            semanticEntityId: string;
            motionId: string;
            glyphKey: string;
          }[];
          fontRevision: number;
        }) => {
          fragments: readonly {
            rect: { left: number; top: number; width: number; height: number };
          }[];
        };
      }
    ).__kpObserveNativeKatexFragments;
    const read = () => observe({
      stage,
      bindings: [{
        id: "fragment.solve-x.scaled-x",
        semanticEntityId: "entity.x",
        motionId: "motion.solve-x.scaled-x",
        glyphKey: "x"
      }],
      fontRevision: 0
    }).fragments[0]!.rect;
    const normal = read();
    stage.style.transformOrigin = "0 0";
    stage.style.transform = "scale(1.5)";
    const scaled = read();
    return { normal, scaled };
  });

  for (const key of ["left", "top", "width", "height"] as const) {
    expect(measurements.scaled[key]).toBeCloseTo(
      measurements.normal[key],
      4
    );
  }
});

test("settled observation waits for fonts and rejects consecutive-frame drift", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  const result = await page.evaluate(async () => {
    const stage = document.querySelector<HTMLElement>(
      '[data-reconciliation-case="solve-x"] [data-case-stage]'
    )!;
    const renderedX = stage.querySelector<HTMLElement>(
      "[data-case-source] .mord.mathnormal"
    )!;
    renderedX.dataset["kpMotionId"] = "motion.solve-x.settled-x";
    const settle = (
      window as unknown as {
        __kpSettleAndObserveNativeKatexFragments: (input: {
          stage: HTMLElement;
          bindings: readonly {
            id: string;
            semanticEntityId: string;
            motionId: string;
            glyphKey: string;
          }[];
          fontReadiness: {
            status: "ready";
            revision: number;
            whenReady(): Promise<void>;
            subscribe(): () => void;
            dispose(): void;
          };
        }) => Promise<{
          fragments: readonly {
            fontRevision: number;
            rect: { width: number };
          }[];
        }>;
      }
    ).__kpSettleAndObserveNativeKatexFragments;
    const binding = [{
      id: "fragment.solve-x.settled-x",
      semanticEntityId: "entity.x",
      motionId: "motion.solve-x.settled-x",
      glyphKey: "x"
    }];
    const fontReadiness = {
      status: "ready" as const,
      revision: 7,
      whenReady: async () => document.fonts.ready.then(() => undefined),
      subscribe: () => () => undefined,
      dispose: () => undefined
    };
    const stable = await settle({
      stage,
      bindings: binding,
      fontReadiness
    });
    const originalRect = renderedX.getBoundingClientRect.bind(renderedX);
    let reads = 0;
    renderedX.getBoundingClientRect = () => {
      const rect = originalRect();
      reads += 1;
      return DOMRect.fromRect({
        x: rect.x,
        y: rect.y,
        width: rect.width + reads,
        height: rect.height
      });
    };
    let drift = "";
    try {
      await settle({ stage, bindings: binding, fontReadiness });
    } catch (error) {
      drift = error instanceof Error ? error.message : String(error);
    }
    return {
      fontRevision: stable.fragments[0]!.fontRevision,
      width: stable.fragments[0]!.rect.width,
      drift
    };
  });

  expect(result.fontRevision).toBe(7);
  expect(result.width).toBeGreaterThan(0);
  expect(result.drift).toContain("did not settle");
});
