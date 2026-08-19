import { expect, test, type Page } from "@playwright/test";

import {
  kpFractionEndpointRegressionLimits
} from "../scripts/glyph-reconciliation-endpoint-checkpoints.ts";

interface FractionHandoffOwnershipSample {
  readonly progress: number;
  readonly visualOwner:
    | "source-native"
    | "material-scene"
    | "target-native";
  readonly sourceNativeOpacity: 0 | 1;
  readonly materialSceneOpacity: 0 | 1;
  readonly targetNativeOpacity: 0 | 1;
  readonly visibleMaterialOwnerIds: readonly string[];
  readonly glyphStyleMismatchIds: readonly string[];
  readonly maximumGlyphRectResidualPx: number;
  readonly maximumGlyphBaselineResidualPx: number;
  readonly maximumRuleGeometryResidualPx: number;
}

async function traceFractionHandoff(
  page: Page,
  progresses: readonly number[]
): Promise<readonly FractionHandoffOwnershipSample[]> {
  return page.evaluate((steps) => {
    const trace = (window as unknown as {
      __kpTraceFractionHandoffOwnership: (
        progresses: readonly number[]
      ) => readonly FractionHandoffOwnershipSample[];
    }).__kpTraceFractionHandoffOwnership;
    return trace(steps).map((sample) => ({ ...sample }));
  }, progresses);
}

function expectFractionEndpointRegression(
  trace: readonly FractionHandoffOwnershipSample[]
): void {
  const nearHandoff = trace.find(({ progress }) => progress === 0.999)!;
  expect(nearHandoff.maximumGlyphRectResidualPx).toBeLessThanOrEqual(
    kpFractionEndpointRegressionLimits.maximumGlyphRectResidualPx
  );
  expect(nearHandoff.maximumGlyphBaselineResidualPx).toBeLessThanOrEqual(
    kpFractionEndpointRegressionLimits.maximumGlyphBaselineResidualPx
  );
  expect(nearHandoff.maximumRuleGeometryResidualPx).toBeLessThanOrEqual(
    kpFractionEndpointRegressionLimits.maximumRuleGeometryResidualPx
  );
  expect(nearHandoff.glyphStyleMismatchIds.length).toBeGreaterThan(0);
  expect(trace.every((sample) =>
    sample.sourceNativeOpacity +
    sample.materialSceneOpacity +
    sample.targetNativeOpacity === 1
  )).toBe(true);
}

test("observer measures one explicitly tagged real KaTeX fragment", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
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

test("scene observer enumerates visible KaTeX glyph paint without MathML ink", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const evidence = await page.evaluate(() => {
    const observe = (window as unknown as {
      __kpObserveNativeKatexGlyphPaintAtoms: (input: {
        endpoint: "source";
        stage: HTMLElement;
        root: HTMLElement;
        semanticEntityId: string;
        presentationGroupId: string;
        fontRevision: number;
      }) => readonly {
        id: string;
        visualKey: string;
        paintKind: string;
        sourceElement: HTMLElement;
        rect: { width: number; height: number };
      }[];
    }).__kpObserveNativeKatexGlyphPaintAtoms;
    const stage = document.querySelector<HTMLElement>("[data-fraction-stage]")!;
    const root = document.querySelector<HTMLElement>("[data-fraction-source]")!;
    return observe({
      endpoint: "source",
      stage,
      root,
      semanticEntityId: "entity.fraction.source",
      presentationGroupId: "group.fraction.source",
      fontRevision: 1
    }).map((atom) => ({
      id: atom.id,
      visualKey: atom.visualKey,
      paintKind: atom.paintKind,
      inMathMl: atom.sourceElement.closest(".katex-mathml") !== null,
      width: atom.rect.width,
      height: atom.rect.height
    }));
  });

  expect(evidence.length).toBeGreaterThanOrEqual(5);
  expect(evidence.some(({ visualKey }) => visualKey === "glyph:x")).toBe(true);
  expect(evidence.some(({ visualKey }) => visualKey === "glyph:y")).toBe(true);
  expect(evidence.filter(({ visualKey }) => visualKey === "glyph:2")).toHaveLength(2);
  expect(evidence.every(({ paintKind, inMathMl, width, height }) =>
    paintKind === "glyph" &&
    !inMathMl &&
    width > 0 &&
    height > 0
  )).toBe(true);
});

test("scene observer includes generic fraction rules as structural paint", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const evidence = await page.evaluate(() => {
    const observe = (window as unknown as {
      __kpObserveNativeKatexPaintAtoms: (input: {
        endpoint: "source";
        stage: HTMLElement;
        root: HTMLElement;
        semanticEntityId: string;
        presentationGroupId: string;
        fontRevision: number;
      }) => readonly {
        paintKind: string;
        visualKey: string;
        rect: { width: number; height: number };
      }[];
    }).__kpObserveNativeKatexPaintAtoms;
    return observe({
      endpoint: "source",
      stage: document.querySelector<HTMLElement>("[data-fraction-stage]")!,
      root: document.querySelector<HTMLElement>("[data-fraction-source]")!,
      semanticEntityId: "entity.fraction.source",
      presentationGroupId: "group.fraction.source",
      fontRevision: 1
    }).map(({ paintKind, visualKey, rect }) => ({
      paintKind,
      visualKey,
      width: rect.width,
      height: rect.height
    }));
  });

  const rules = evidence.filter(({ paintKind }) => paintKind === "rule");
  expect(rules).toHaveLength(2);
  expect(rules.every(({ visualKey, width, height }) =>
    visualKey === "rule" && width > height && height > 0
  )).toBe(true);
});

test("scene paint inherits explicit semantic and presentation ownership", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const evidence = await page.evaluate(() => {
    const observe = (window as unknown as {
      __kpObserveNativeKatexPaintAtoms: (input: {
        endpoint: "source";
        stage: HTMLElement;
        root: HTMLElement;
        semanticEntityId: string;
        presentationGroupId: string;
        fontRevision: number;
        requireExplicitOwnership: boolean;
      }) => readonly {
        semanticEntityId: string;
        presentationGroupId: string;
        paintKind: string;
        visualKey: string;
      }[];
    }).__kpObserveNativeKatexPaintAtoms;
    return observe({
      endpoint: "source",
      stage: document.querySelector<HTMLElement>("[data-fraction-stage]")!,
      root: document.querySelector<HTMLElement>("[data-fraction-source]")!,
      semanticEntityId: "forbidden.fallback",
      presentationGroupId: "forbidden.fallback",
      fontRevision: 1,
      requireExplicitOwnership: true
    });
  });

  expect(evidence.every(({ semanticEntityId, presentationGroupId }) =>
    semanticEntityId !== "forbidden.fallback" &&
    presentationGroupId !== "forbidden.fallback"
  )).toBe(true);
  expect(evidence.some(({ semanticEntityId }) =>
    semanticEntityId === "symbol.x"
  )).toBe(true);
  expect(evidence.some(({ semanticEntityId }) =>
    semanticEntityId === "symbol.y"
  )).toBe(true);
  expect(evidence.filter(({ paintKind }) => paintKind === "rule")
    .every(({ semanticEntityId }) =>
      semanticEntityId === "fraction.left" ||
      semanticEntityId === "fraction.right"
    )).toBe(true);
});

test("complete scene observation settles and invalidates by viewport", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const first = await page.evaluate(async () => {
    const settle = (window as unknown as {
      __kpSettleAndObserveNativeKatexRenderedScene: (input: {
        endpoint: "source";
        stage: HTMLElement;
        root: HTMLElement;
        semanticEntityId: string;
        presentationGroupId: string;
        fontReadiness: {
          revision: number;
          whenReady(): Promise<void>;
        };
      }) => Promise<{
        atoms: readonly unknown[];
        groups: readonly unknown[];
        viewportKey: string;
      }>;
    }).__kpSettleAndObserveNativeKatexRenderedScene;
    const scene = await settle({
      endpoint: "source",
      stage: document.querySelector<HTMLElement>("[data-fraction-stage]")!,
      root: document.querySelector<HTMLElement>("[data-fraction-source]")!,
      semanticEntityId: "fraction.expression",
      presentationGroupId: "group.fraction.source",
      fontReadiness: { revision: 7, async whenReady() {} }
    });
    return {
      atoms: scene.atoms.length,
      groups: scene.groups.length,
      viewportKey: scene.viewportKey
    };
  });
  await page.setViewportSize({ width: 390, height: 844 });
  const phoneKey = await page.evaluate(async () => {
    const settle = (window as unknown as {
      __kpSettleAndObserveNativeKatexRenderedScene: (input: {
        endpoint: "source";
        stage: HTMLElement;
        root: HTMLElement;
        semanticEntityId: string;
        presentationGroupId: string;
        fontReadiness: {
          revision: number;
          whenReady(): Promise<void>;
        };
      }) => Promise<{ viewportKey: string }>;
    }).__kpSettleAndObserveNativeKatexRenderedScene;
    return (await settle({
      endpoint: "source",
      stage: document.querySelector<HTMLElement>("[data-fraction-stage]")!,
      root: document.querySelector<HTMLElement>("[data-fraction-source]")!,
      semanticEntityId: "fraction.expression",
      presentationGroupId: "group.fraction.source",
      fontReadiness: { revision: 7, async whenReady() {} }
    })).viewportKey;
  });

  expect(first.atoms).toBeGreaterThanOrEqual(7);
  expect(first.groups).toBeGreaterThanOrEqual(7);
  expect(first.viewportKey).toContain("font-7");
  expect(phoneKey).not.toBe(first.viewportKey);
});

test("endpoint handle factory settles one immutable observation transaction", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const evidence = await page.evaluate(async () => {
    const createHandle = (window as unknown as {
      __kpSettleAndCreateNativeKatexRenderedEndpointHandle: (input: {
        endpoint: "source";
        stage: HTMLElement;
        root: HTMLElement;
        semanticEntityId: string;
        presentationGroupId: string;
        fontReadiness: {
          revision: number;
          whenReady(): Promise<void>;
        };
      }) => Promise<{
        kind: string;
        lifecycle: string;
        observation: { atoms: readonly unknown[]; viewportKey: string };
        revision: { fontRevision: number; viewportKey: string };
      }>;
    }).__kpSettleAndCreateNativeKatexRenderedEndpointHandle;
    const handle = await createHandle({
      endpoint: "source",
      stage: document.querySelector<HTMLElement>("[data-fraction-stage]")!,
      root: document.querySelector<HTMLElement>("[data-fraction-source]")!,
      semanticEntityId: "fraction.expression",
      presentationGroupId: "group.fraction.source",
      fontReadiness: { revision: 11, async whenReady() {} }
    });
    return {
      kind: handle.kind,
      lifecycle: handle.lifecycle,
      atomCount: handle.observation.atoms.length,
      sameViewportKey:
        handle.revision.viewportKey === handle.observation.viewportKey,
      fontRevision: handle.revision.fontRevision,
      frozen: Object.isFrozen(handle) && Object.isFrozen(handle.revision)
    };
  });

  expect(evidence).toEqual({
    kind: "native-katex-rendered-endpoint-handle",
    lifecycle: "renderer-session-ephemeral",
    atomCount: expect.any(Number),
    sameViewportKey: true,
    fontRevision: 11,
    frozen: true
  });
  expect(evidence.atomCount).toBeGreaterThanOrEqual(7);
});

test("live fraction route exposes complete source and target inventories", async ({
  page
}) => {
  for (const viewport of [
    { width: 1440, height: 950 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/glyph-reconciliation-experiment.html?progress=0");
    const review = page.locator('[data-kp-glyph-review][data-kp-ready="true"]');
    await review.waitFor();
    const inventory = await review.evaluate((element) => ({
      sourceAtoms: Number(element.dataset["kpFractionSourceAtomCount"]),
      targetAtoms: Number(element.dataset["kpFractionTargetAtomCount"]),
      sourceGroups: Number(element.dataset["kpFractionSourceGroupCount"]),
      targetGroups: Number(element.dataset["kpFractionTargetGroupCount"])
    }));

    expect(inventory.sourceAtoms).toBeGreaterThanOrEqual(7);
    expect(inventory.targetAtoms).toBeGreaterThanOrEqual(5);
    expect(inventory.sourceGroups).toBeGreaterThanOrEqual(7);
    expect(inventory.targetGroups).toBeGreaterThanOrEqual(6);
    await expect(page.locator("[data-fraction-inventory]")).toContainText(
      "paint atoms inventoried"
    );
  }
});

test("inverse split endpoints inventory one-to-two native structures", async ({
  browser
}) => {
  const viewportKeys: string[] = [];
  for (const profile of [{
    viewport: { width: 1_440, height: 950 },
    deviceScaleFactor: 1
  }, {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2
  }]) {
    const context = await browser.newContext(profile);
    const page = await context.newPage();
    await page.goto("/glyph-reconciliation-experiment.html?progress=0");
    await page.locator(
      '[data-kp-glyph-review][data-kp-ready="true"]'
    ).waitFor();
    const inventories = await page.evaluate(async () => {
      const observe = (window as unknown as {
        __kpSettleAndObserveNativeKatexRenderedScene: (input: {
          endpoint: "source" | "target";
          stage: HTMLElement;
          root: HTMLElement;
          semanticEntityId: string;
          presentationGroupId: string;
          fontReadiness: {
            revision: number;
            whenReady(): Promise<void>;
          };
        }) => Promise<{
          endpoint: "source" | "target";
          atoms: readonly {
            id: string;
            endpoint: "source" | "target";
            semanticEntityId: string;
            presentationGroupId: string;
            paintKind: string;
          }[];
          groups: readonly {
            id: string;
            semanticEntityId: string;
            atomIds: readonly string[];
          }[];
          viewportKey: string;
        }>;
      }).__kpSettleAndObserveNativeKatexRenderedScene;
      const stage = document.querySelector<HTMLElement>(
        '[data-reconciliation-case="fraction-merge"] [data-fraction-stage]'
      )!;
      const merged = stage.querySelector<HTMLElement>(
        "[data-fraction-target]"
      )!;
      const split = stage.querySelector<HTMLElement>(
        "[data-fraction-source]"
      )!;
      merged.style.opacity = "1";
      split.style.opacity = "1";
      const fontReadiness = {
        revision: 1,
        async whenReady() {
          await document.fonts.ready;
        }
      };
      const summarize = async () => {
        const [source, target] = await Promise.all([
          observe({
            endpoint: "source",
            stage,
            root: merged,
            semanticEntityId: "fraction.expression",
            presentationGroupId: "group.fraction.target",
            fontReadiness
          }),
          observe({
            endpoint: "target",
            stage,
            root: split,
            semanticEntityId: "fraction.expression",
            presentationGroupId: "group.fraction.source",
            fontReadiness
          })
        ]);
        return [source, target].map((scene) => ({
          endpoint: scene.endpoint,
          atomIds: scene.atoms.map(({ id }) => id),
          atomCount: scene.atoms.length,
          groupCount: scene.groups.length,
          ruleCount: scene.atoms.filter(({ paintKind }) =>
            paintKind === "rule"
          ).length,
          denominatorCount: scene.atoms.filter(({ semanticEntityId }) =>
            semanticEntityId.includes("denominator")
          ).length,
          owned: scene.atoms.every((atom) =>
            atom.endpoint === scene.endpoint &&
            atom.semanticEntityId.length > 0 &&
            atom.presentationGroupId.length > 0
          ) && scene.groups.every((group) =>
            group.semanticEntityId.length > 0 &&
            group.atomIds.length > 0
          ),
          viewportKey: scene.viewportKey
        }));
      };
      return {
        first: await summarize(),
        repeated: await summarize()
      };
    });

    expect(inventories.first).toEqual(inventories.repeated);
    const [source, target] = inventories.first;
    expect(source).toMatchObject({
      endpoint: "source",
      ruleCount: 1,
      denominatorCount: 1,
      owned: true
    });
    expect(target).toMatchObject({
      endpoint: "target",
      ruleCount: 2,
      denominatorCount: 2,
      owned: true
    });
    expect(new Set(source!.atomIds).size).toBe(source!.atomCount);
    expect(new Set(target!.atomIds).size).toBe(target!.atomCount);
    expect(target!.atomCount).toBeGreaterThan(source!.atomCount);
    viewportKeys.push(source!.viewportKey, target!.viewportKey);
    await context.close();
  }
  expect(new Set(viewportKeys).size).toBe(4);
});

test("radical succession inventories native glyph, rule, and path paint", async ({
  browser
}) => {
  const viewportKeys: string[] = [];
  for (const profile of [{
    viewport: { width: 1_440, height: 950 },
    deviceScaleFactor: 1
  }, {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2
  }]) {
    const context = await browser.newContext(profile);
    const page = await context.newPage();
    await page.goto(
      "/glyph-reconciliation-experiment.html?radicalInventory=1&progress=0"
    );
    const panel = page.locator(
      '[data-radical-inventory][data-kp-radical-inventory-ready="true"]'
    );
    await panel.waitFor();
    const inventory = await page.evaluate(() => {
      const scenes = (window as unknown as {
        __kpRadicalSceneInventory: {
          source: {
            atoms: readonly {
              id: string;
              semanticEntityId: string;
              presentationGroupId: string;
              paintKind: string;
              rect: {
                left: number;
                top: number;
                width: number;
                height: number;
              };
            }[];
            groups: readonly { id: string; atomIds: readonly string[] }[];
            viewportKey: string;
          };
          target: {
            atoms: readonly {
              id: string;
              semanticEntityId: string;
              presentationGroupId: string;
              paintKind: string;
              rect: {
                left: number;
                top: number;
                width: number;
                height: number;
              };
            }[];
            groups: readonly { id: string; atomIds: readonly string[] }[];
            viewportKey: string;
          };
        };
      }).__kpRadicalSceneInventory;
      return [scenes.source, scenes.target].map((scene) => ({
        atomIds: scene.atoms.map(({ id }) => id),
        kinds: scene.atoms.map(({ paintKind }) => paintKind),
        semanticEntityIds: scene.atoms.map(({ semanticEntityId }) =>
          semanticEntityId
        ),
        groupCount: scene.groups.length,
        owned: scene.atoms.every((atom) =>
          atom.semanticEntityId.length > 0 &&
          atom.presentationGroupId.length > 0 &&
          Object.values(atom.rect).every(Number.isFinite) &&
          atom.rect.width > 0 &&
          atom.rect.height > 0
        ) && scene.groups.every(({ atomIds }) => atomIds.length > 0),
        viewportKey: scene.viewportKey
      }));
    });
    const [source, target] = inventory;
    expect(source!.kinds).toContain("glyph");
    expect(source!.kinds).toContain("rule");
    expect(target!.kinds).toContain("glyph");
    expect(target!.kinds).toContain("path");
    expect(source!.semanticEntityIds).toContain(
      "expression.generated.radical.square-root-as-power.power.exponent-denominator"
    );
    expect(target!.semanticEntityIds).toContain(
      "expression.generated.radical.square-root-as-power.radical.radicand"
    );
    expect(target!.semanticEntityIds).toContain(
      "expression.generated.radical.square-root-as-power.radical.radical-hook"
    );
    expect(source!.owned).toBe(true);
    expect(target!.owned).toBe(true);
    expect(new Set(source!.atomIds).size).toBe(source!.atomIds.length);
    expect(new Set(target!.atomIds).size).toBe(target!.atomIds.length);
    viewportKeys.push(source!.viewportKey, target!.viewportKey);
    await context.close();
  }
  expect(new Set(viewportKeys).size).toBe(4);
});

test("radical succession reconciles through existing generic lifecycles", async ({
  page
}) => {
  await page.goto(
    "/glyph-reconciliation-experiment.html?radicalInventory=1&progress=0"
  );
  await page.locator(
    '[data-radical-inventory][data-kp-radical-inventory-ready="true"]'
  ).waitFor();
  const result = await page.evaluate(() => {
    type Disposition = {
      id: string;
      lifecycle: string;
      sourceAtomIds: readonly string[];
      targetAtomIds: readonly string[];
      semanticEntityIds: readonly string[];
    };
    type Reconciliation = {
      source: { atoms: readonly { id: string }[] };
      target: { atoms: readonly { id: string }[] };
      dispositions: readonly Disposition[];
    };
    type Plan = {
      components: readonly {
        lifecycle: string;
        atoms: readonly { atomId: string }[];
      }[];
    };
    const inventory = (window as unknown as {
      __kpRadicalSceneInventory: {
        governedFixtureId: string;
        governedRequestId: string;
        constructionKind: string;
        relations: readonly { relation: string }[];
        reconciliation: Reconciliation;
        permutedReconciliation: Reconciliation;
        plan: Plan;
        reverseReconciliation: Reconciliation;
        reversePlan: Plan;
      };
    }).__kpRadicalSceneInventory;
    const summarize = (reconciliation: Reconciliation, plan: Plan) => ({
      lifecycleCounts: Object.fromEntries(
        ["persist", "merge", "split", "introduce", "eliminate", "unsupported"]
          .map((lifecycle) => [
            lifecycle,
            reconciliation.dispositions.filter((candidate) =>
              candidate.lifecycle === lifecycle
            ).length
          ])
      ),
      sourceIds: reconciliation.source.atoms.map(({ id }) => id).sort(),
      coveredSourceIds: reconciliation.dispositions.flatMap(
        ({ sourceAtomIds }) => sourceAtomIds
      ).sort(),
      targetIds: reconciliation.target.atoms.map(({ id }) => id).sort(),
      coveredTargetIds: reconciliation.dispositions.flatMap(
        ({ targetAtomIds }) => targetAtomIds
      ).sort(),
      componentCount: plan.components.length,
      componentAtomCount: plan.components.flatMap(({ atoms }) => atoms).length,
      dispositions: reconciliation.dispositions
    });
    return {
      governedFixtureId: inventory.governedFixtureId,
      governedRequestId: inventory.governedRequestId,
      constructionKind: inventory.constructionKind,
      relationKinds: inventory.relations.map(({ relation }) => relation),
      forward: summarize(inventory.reconciliation, inventory.plan),
      permutedDispositionIds:
        inventory.permutedReconciliation.dispositions.map(({ id }) => id),
      reverse: summarize(
        inventory.reverseReconciliation,
        inventory.reversePlan
      )
    };
  });

  expect(result.governedFixtureId).toBe(
    "fixture.governed.radical-succession.v1"
  );
  expect(result.governedRequestId).toBe(
    "request.governed.radical-succession.v2"
  );
  expect(result.constructionKind).toBe(
    "verified-governed-canonical-construction"
  );
  expect(result.relationKinds).toEqual([
    "persist",
    "persist",
    "persist"
  ]);
  expect(result.forward.lifecycleCounts).toEqual({
    persist: 1,
    merge: 0,
    split: 0,
    introduce: 1,
    eliminate: 3,
    unsupported: 0
  });
  expect(result.reverse.lifecycleCounts).toEqual({
    persist: 1,
    merge: 0,
    split: 0,
    introduce: 3,
    eliminate: 1,
    unsupported: 0
  });
  expect(result.forward.coveredSourceIds).toEqual(result.forward.sourceIds);
  expect(result.forward.coveredTargetIds).toEqual(result.forward.targetIds);
  expect(result.reverse.coveredSourceIds).toEqual(result.reverse.sourceIds);
  expect(result.reverse.coveredTargetIds).toEqual(result.reverse.targetIds);
  expect(result.forward.componentCount).toBe(5);
  expect(result.forward.componentAtomCount).toBe(6);
  expect(result.reverse.componentCount).toBe(5);
  expect(result.reverse.componentAtomCount).toBe(6);
  expect(result.permutedDispositionIds).toEqual(
    result.forward.dispositions.map(({ id }) => id)
  );
  expect(result.forward.dispositions.some(({ semanticEntityIds }) =>
    semanticEntityIds.includes(
      "expression.generated.radical.square-root-as-power.radical.radical-hook"
    )
  )).toBe(true);
});

test("structural succession overrides fade-only atoms without a new lifecycle", async ({
  browser
}) => {
  for (const reducedMotion of [false, true]) {
    const context = await browser.newContext({
      viewport: { width: 1_100, height: 900 },
      reducedMotion: reducedMotion ? "reduce" : "no-preference"
    });
    const page = await context.newPage();
    await page.goto(
      "/glyph-reconciliation-experiment.html?radicalInventory=1&progress=0"
    );
    await page.locator(
      '[data-radical-inventory][data-kp-radical-inventory-ready="true"]'
    ).waitFor();
    const result = await page.evaluate(() => {
      type Rect = {
        left: number;
        top: number;
        width: number;
        height: number;
      };
      type Track = {
        id: string;
        lifecycle: string;
        startRect: Rect;
        endRect: Rect;
      };
      type Frame = {
        trackId: string;
        rect: Rect;
        opacity: number;
      };
      type Playback = {
        sample(progress: number): readonly Frame[];
        apply(progress: number): {
          visualOwner: string;
          frames: readonly Frame[];
        };
      };
      const inventory = (window as unknown as {
        __kpRadicalSceneInventory: {
          tracks: readonly Track[];
          playback: Playback;
          reversePlayback: Playback;
        };
      }).__kpRadicalSceneInventory;
      const samples = Array.from({ length: 101 }, (_, index) =>
        inventory.playback.sample(index / 100)
      );
      const within = (value: number, left: number, right: number) =>
        value >= Math.min(left, right) - 0.001 &&
        value <= Math.max(left, right) + 0.001;
      const denseFiniteAndBounded = samples.every((frames) =>
        frames.every((frame) => {
          const track = inventory.tracks.find(({ id }) =>
            id === frame.trackId
          )!;
          return Object.values(frame.rect).every(Number.isFinite) &&
            Number.isFinite(frame.opacity) &&
            frame.opacity >= 0 &&
            frame.opacity <= 1 &&
            within(frame.rect.left, track.startRect.left, track.endRect.left) &&
            within(frame.rect.top, track.startRect.top, track.endRect.top) &&
            within(
              frame.rect.width,
              track.startRect.width,
              track.endRect.width
            ) &&
            within(
              frame.rect.height,
              track.startRect.height,
              track.endRect.height
            );
        })
      );
      const direct = inventory.playback.sample(0.73);
      inventory.playback.sample(0.18);
      const soughtAgain = inventory.playback.sample(0.73);
      const reverseDirect = inventory.reversePlayback.sample(0.41);
      inventory.reversePlayback.sample(0.92);
      const reverseSoughtAgain = inventory.reversePlayback.sample(0.41);

      const sourceFrame = inventory.playback.apply(0);
      const middleFrame = inventory.playback.apply(0.5);
      const stage = document.querySelector<HTMLElement>(
        "[data-radical-stage]"
      )!;
      const canvas = stage.querySelector<HTMLCanvasElement>(
        "[data-kp-native-katex-structural-succession]"
      );
      const owners = [...stage.querySelectorAll<HTMLElement>(
        "[data-kp-native-katex-scene-owner]"
      )];
      const targetFrame = inventory.playback.apply(1);
      const rewoundFrame = inventory.playback.apply(0);
      const replayedMiddleFrame = inventory.playback.apply(0.5);

      return {
        mediaReduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
        denseFiniteAndBounded,
        directStable: JSON.stringify(direct) === JSON.stringify(soughtAgain),
        reverseStable:
          JSON.stringify(reverseDirect) === JSON.stringify(reverseSoughtAgain),
        sourceFrame,
        middleFrame,
        targetFrame,
        rewoundFrame,
        replayedMiddleStable:
          JSON.stringify(middleFrame.frames) ===
          JSON.stringify(replayedMiddleFrame.frames),
        strategy:
          stage.dataset["kpNativeKatexStructuralSuccessionStrategy"],
        status: stage.dataset["kpNativeKatexStructuralSuccessionStatus"],
        canvasVisible: canvas?.style.opacity === "1",
        visibleOwnerCount: owners.filter((owner) =>
          Number(owner.style.opacity) > 0
        ).length,
        sourceNativeOpacity: Number(
          getComputedStyle(
            stage.querySelector<HTMLElement>(
              "[data-radical-source-object]"
            )!
          ).opacity
        )
      };
    });

    expect(result.mediaReduced).toBe(reducedMotion);
    expect(result.denseFiniteAndBounded).toBe(true);
    expect(result.directStable).toBe(true);
    expect(result.reverseStable).toBe(true);
    expect(result.replayedMiddleStable).toBe(true);
    expect(result.sourceFrame.visualOwner).toBe("source-native");
    expect(result.middleFrame.visualOwner).toBe(
      reducedMotion ? "source-native" : "material-scene"
    );
    expect(result.targetFrame.visualOwner).toBe("target-native");
    expect(result.rewoundFrame.visualOwner).toBe("source-native");
    expect(result.strategy).toBe(
      reducedMotion ? "checkpoint-settlement" : "solid-mask-succession"
    );
    expect(result.status).toBe(reducedMotion ? "unavailable" : "ready");
    expect(result.canvasVisible).toBe(!reducedMotion);
    expect(result.visibleOwnerCount).toBe(reducedMotion ? 0 : 1);
    expect(result.sourceNativeOpacity).toBe(reducedMotion ? 1 : 0);
    await context.close();
  }
});

test("governed radical exemplar keeps one visual and native semantic owner", async ({
  browser
}) => {
  for (const profile of [{
    viewport: { width: 1_440, height: 950 },
    reducedMotion: "no-preference" as const
  }, {
    viewport: { width: 390, height: 844 },
    reducedMotion: "no-preference" as const
  }, {
    viewport: { width: 1_440, height: 950 },
    reducedMotion: "reduce" as const
  }, {
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce" as const
  }]) {
    const context = await browser.newContext(profile);
    const page = await context.newPage();
    await page.goto(
      "/glyph-reconciliation-experiment.html?radicalInventory=1&progress=0"
    );
    const panel = page.locator(
      '[data-radical-inventory][data-kp-radical-inventory-ready="true"]'
    );
    const source = panel.locator("[data-radical-source]");
    const target = panel.locator("[data-radical-target]");
    const stage = panel.locator("[data-radical-stage]");
    const slider = panel.locator("[data-radical-progress]");
    const play = panel.locator("[data-radical-play]");
    await panel.waitFor();

    await expect(panel).toHaveAttribute(
      "data-kp-radical-visual-owner",
      "source-native"
    );
    await expect(stage).toHaveAttribute(
      "data-kp-radical-semantic-owner",
      "source-native"
    );
    await expect(source).toHaveAttribute("aria-hidden", "false");
    await expect(target).toHaveAttribute("aria-hidden", "true");
    expect(await source.locator(
      '[data-kp-semantic-selector-id][tabindex="0"]'
    ).count()).toBeGreaterThan(0);

    await slider.fill("500");
    await slider.dispatchEvent("input");
    await expect(panel).toHaveAttribute(
      "data-kp-radical-visual-owner",
      profile.reducedMotion === "reduce"
        ? "source-native"
        : "material-scene"
    );
    await expect(stage).toHaveAttribute(
      "data-kp-radical-semantic-owner",
      profile.reducedMotion === "reduce"
        ? "source-native"
        : "stage-description"
    );
    await expect(source).toHaveAttribute(
      "aria-hidden",
      profile.reducedMotion === "reduce" ? "false" : "true"
    );
    await expect(target).toHaveAttribute("aria-hidden", "true");
    const transit = await stage.evaluate((element) => {
      const owners = [...element.querySelectorAll<HTMLElement>(
        "[data-kp-native-katex-scene-owner]"
      )];
      const visible = owners.filter((owner) => Number(owner.style.opacity) > 0);
      const canvas = element.querySelector<HTMLCanvasElement>(
        "[data-kp-native-katex-structural-succession]"
      );
      return {
        visibleOwnerCount: visible.length,
        allInert: owners.every((owner) =>
          owner.hasAttribute("inert") &&
          owner.getAttribute("aria-hidden") === "true"
        ),
        canvasVisible: canvas?.style.opacity === "1",
        canvasHasArea:
          canvas !== null && canvas.width > 0 && canvas.height > 0,
        canvasPointerEvents:
          canvas === null ? null : getComputedStyle(canvas).pointerEvents,
        strategy:
          element.dataset["kpNativeKatexStructuralSuccessionStrategy"],
        status: element.dataset["kpNativeKatexStructuralSuccessionStatus"],
        overflow:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      };
    });
    expect(transit).toMatchObject({
      allInert: true,
      canvasVisible: profile.reducedMotion !== "reduce",
      canvasHasArea: profile.reducedMotion !== "reduce",
      canvasPointerEvents:
        profile.reducedMotion === "reduce" ? null : "none",
      strategy: profile.reducedMotion === "reduce"
        ? "checkpoint-settlement"
        : "solid-mask-succession",
      status: profile.reducedMotion === "reduce" ? "unavailable" : "ready",
      overflow: 0
    });
    expect(transit.visibleOwnerCount).toBe(
      profile.reducedMotion === "reduce" ? 0 : 1
    );

    await slider.fill("999");
    await slider.dispatchEvent("input");
    await expect(panel).toHaveAttribute(
      "data-kp-radical-visual-owner",
      profile.reducedMotion === "reduce"
        ? "source-native"
        : "material-scene"
    );
    await slider.fill("1000");
    await slider.dispatchEvent("input");
    await expect(panel).toHaveAttribute(
      "data-kp-radical-visual-owner",
      "target-native"
    );
    await expect(stage).toHaveAttribute(
      "data-kp-radical-semantic-owner",
      "target-native"
    );
    await expect(source).toHaveAttribute("aria-hidden", "true");
    await expect(target).toHaveAttribute("aria-hidden", "false");
    expect(await target.locator(
      '[data-kp-semantic-selector-id][tabindex="0"]'
    ).count()).toBeGreaterThan(0);
    expect(await target.locator(
      "[data-kp-semantic-selector-id][title]"
    ).count()).toBeGreaterThan(0);
    expect(await stage.locator(
      '[data-kp-native-katex-scene-owner][style*="opacity: 0"]'
    ).count()).toBeGreaterThan(0);

    await slider.fill("0");
    await slider.dispatchEvent("input");
    await play.click();
    await expect(panel).toHaveAttribute(
      "data-kp-radical-visual-owner",
      "target-native",
      { timeout: profile.reducedMotion === "reduce" ? 500 : 2_500 }
    );
    await play.click();
    await expect(panel).toHaveAttribute(
      "data-kp-radical-visual-owner",
      "source-native",
      { timeout: profile.reducedMotion === "reduce" ? 500 : 2_500 }
    );
    await context.close();
  }
});

test("live fraction scene exposes continuously sampled structural rule tracks", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  const review = page.locator('[data-kp-glyph-review][data-kp-ready="true"]');
  await review.waitFor();
  const samples = await page.evaluate(() => {
    const sample = (window as unknown as {
      __kpSampleFractionSceneTracks: (progress: number) => readonly {
        paintKind: string;
        sizingMode: string;
        rect: { left: number; top: number; width: number; height: number };
      }[];
    }).__kpSampleFractionSceneTracks;
    return [0, 0.5, 1].map((progress) =>
      sample(progress).filter(({ paintKind }) => paintKind === "rule")
    );
  });

  expect(samples.every((frames) => frames.length === 2)).toBe(true);
  expect(samples[1]!.every(({ sizingMode }) =>
    sizingMode === "rule-length"
  )).toBe(true);
  for (let index = 0; index < 2; index += 1) {
    const start = samples[0]![index]!.rect;
    const middle = samples[1]![index]!.rect;
    const end = samples[2]![index]!.rect;
    expect(middle.left).toBeGreaterThanOrEqual(
      Math.min(start.left, end.left) - 0.01
    );
    expect(middle.left).toBeLessThanOrEqual(
      Math.max(start.left, end.left) + 0.01
    );
    expect(middle.width).toBeGreaterThanOrEqual(
      Math.min(start.width, end.width) - 0.01
    );
    expect(middle.width).toBeLessThanOrEqual(
      Math.max(start.width, end.width) + 0.01
    );
  }
});

test("full fraction scene has one exclusive visual owner through handoff", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const ownership = await page.evaluate(() => {
    const apply = (window as unknown as {
      __kpApplyFractionSceneFrame: (progress: number) => {
        visualOwner: string;
        sourceNativeOpacity: number;
        materialSceneOpacity: number;
        targetNativeOpacity: number;
        frames: readonly { opacity: number }[];
      };
    }).__kpApplyFractionSceneFrame;
    return [0, 0.5, 1].map((progress) => {
      const frame = apply(progress);
      const stage = document.querySelector<HTMLElement>(
        "[data-fraction-stage]"
      )!;
      const materialOwners = [...stage.querySelectorAll<HTMLElement>(
        "[data-kp-native-katex-scene-owner]"
      )];
      return {
        ...frame,
        sourceOpacity: stage.querySelector<HTMLElement>(
          "[data-fraction-source]"
        )!.style.opacity,
        targetOpacity: stage.querySelector<HTMLElement>(
          "[data-fraction-target]"
        )!.style.opacity,
        materialOwnerCount: materialOwners.length,
        inertOwners: materialOwners.filter((owner) =>
          owner.hasAttribute("inert") &&
          owner.getAttribute("aria-hidden") === "true"
        ).length,
        visibleMaterialOwners: materialOwners.filter((owner) =>
          Number(owner.style.opacity) > 0
        ).length
      };
    });
  });

  expect(ownership.map(({ visualOwner }) => visualOwner)).toEqual([
    "source-native",
    "material-scene",
    "target-native"
  ]);
  expect(ownership.map((frame) => [
    frame.sourceNativeOpacity,
    frame.materialSceneOpacity,
    frame.targetNativeOpacity
  ])).toEqual([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ]);
  expect(ownership.map(({ sourceOpacity, targetOpacity }) => [
    sourceOpacity,
    targetOpacity
  ])).toEqual([
    ["1", "0"],
    ["0", "0"],
    ["0", "1"]
  ]);
  expect(ownership[1]!.materialOwnerCount).toBe(
    ownership[1]!.frames.length
  );
  expect(ownership[1]!.inertOwners).toBe(
    ownership[1]!.materialOwnerCount
  );
  expect(ownership[1]!.visibleMaterialOwners).toBeGreaterThan(0);
  expect(ownership[0]!.visibleMaterialOwners).toBe(0);
  expect(ownership[2]!.visibleMaterialOwners).toBe(0);
});

test("full-scene playback direct seek is stateless through reverse application", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const snapshots = await page.evaluate(() => {
    const apply = (window as unknown as {
      __kpApplyFractionSceneFrame: (progress: number) => unknown;
    }).__kpApplyFractionSceneFrame;
    const stage = document.querySelector<HTMLElement>("[data-fraction-stage]")!;
    return [0.37, 0.82, 0.37].map((progress) => {
      apply(progress);
      return [...stage.querySelectorAll<HTMLElement>(
        "[data-kp-native-katex-scene-owner]"
      )].map((owner) => ({
        id: owner.dataset["kpEquationMaterialOwnerId"],
        left: owner.style.left,
        top: owner.style.top,
        width: owner.style.width,
        height: owner.style.height,
        opacity: owner.style.opacity
      }));
    });
  });

  expect(snapshots[0]).toEqual(snapshots[2]);
  expect(snapshots[0]).not.toEqual(snapshots[1]);
});

test("glyph handoff microscope is repeatable across viewport and DPR", async ({
  browser
}) => {
  for (const profile of [
    {
      id: "wide",
      viewport: { width: 1_440, height: 950 },
      deviceScaleFactor: 1
    },
    {
      id: "phone-dpr2",
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2
    }
  ]) {
    const context = await browser.newContext({
      viewport: profile.viewport,
      deviceScaleFactor: profile.deviceScaleFactor
    });
    const page = await context.newPage();
    await page.goto("/glyph-reconciliation-experiment.html?progress=859");
    await page.locator(
      '[data-kp-glyph-review][data-kp-ready="true"]'
    ).waitFor();
    const evidence = await page.evaluate(() => {
      const measure = (window as unknown as {
        __kpMeasureFractionGlyphHandoff: (progress: number) => {
          observations: readonly {
            id: string;
            side: "material" | "native-target";
            paintAtomId: string;
            semanticEntityId: string;
            paintKind: string;
            rect: {
              left: number;
              top: number;
              width: number;
              height: number;
            };
            baselineY: number | null;
            wrapperTransform: string;
            paintFingerprint: string;
            styleFingerprint: string;
            opacity: number;
          }[];
        };
      }).__kpMeasureFractionGlyphHandoff;
      const snapshot = (progress: number) => measure(progress).observations.map(
        (observation) => ({ ...observation })
      );
      return {
        before: snapshot(0.999),
        repeated: snapshot(0.999),
        native: snapshot(1)
      };
    });

    expect(evidence.before).toEqual(evidence.repeated);
    expect(evidence.before.length).toBeGreaterThanOrEqual(10);
    expect(evidence.before.every(({ paintKind }) =>
      paintKind === "glyph"
    )).toBe(true);
    expect(evidence.before.every((observation) =>
      Number.isFinite(observation.rect.left) &&
      Number.isFinite(observation.rect.top) &&
      observation.rect.width > 0 &&
      observation.rect.height > 0 &&
      Number.isFinite(observation.baselineY) &&
      observation.wrapperTransform.length > 0 &&
      observation.paintFingerprint.startsWith("glyph:") &&
      observation.styleFingerprint.includes("font-family:")
    )).toBe(true);
    const byCorrelation = evidence.before.reduce((groups, observation) => {
      const id = observation.id.replace(/\.(material|native)$/, "");
      groups.set(id, [...(groups.get(id) ?? []), observation]);
      return groups;
    }, new Map<string, typeof evidence.before>());
    expect([...byCorrelation.values()].every((pair) =>
      pair.length === 2 &&
      pair[0]!.paintAtomId === pair[1]!.paintAtomId &&
      pair[0]!.semanticEntityId === pair[1]!.semanticEntityId &&
      pair[0]!.paintFingerprint === pair[1]!.paintFingerprint
    )).toBe(true);
    expect(evidence.before.filter(({ side, opacity }) =>
      side === "native-target" && opacity > 0
    )).toHaveLength(0);
    expect(evidence.before.some(({ side, opacity }) =>
      side === "material" && opacity > 0
    )).toBe(true);
    expect(evidence.native.filter(({ side, opacity }) =>
      side === "material" && opacity > 0
    )).toHaveLength(0);
    expect(evidence.native.filter(({ side, opacity }) =>
      side === "native-target" && opacity > 0
    ).length).toBeGreaterThan(0);
    await context.close();
  }
});

test("structural handoff microscope measures generic rule geometry", async ({
  browser
}) => {
  for (const profile of [
    {
      viewport: { width: 1_440, height: 950 },
      deviceScaleFactor: 1
    },
    {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2
    }
  ]) {
    const context = await browser.newContext({
      viewport: profile.viewport,
      deviceScaleFactor: profile.deviceScaleFactor
    });
    const page = await context.newPage();
    await page.goto("/glyph-reconciliation-experiment.html?progress=859");
    await page.locator(
      '[data-kp-glyph-review][data-kp-ready="true"]'
    ).waitFor();
    const evidence = await page.evaluate(() => {
      const measure = (window as unknown as {
        __kpMeasureFractionRuleHandoff: (progress: number) => {
          observations: readonly {
            id: string;
            side: "material" | "native-target";
            paintAtomId: string;
            semanticEntityId: string;
            paintKind: string;
            rect: {
              left: number;
              top: number;
              width: number;
              height: number;
            };
            baselineY: number | null;
            wrapperTransform: string;
            clipPath: string;
            paintFingerprint: string;
            styleFingerprint: string;
            opacity: number;
            ruleGeometry: {
              axis: "horizontal" | "vertical";
              left: number;
              top: number;
              width: number;
              thickness: number;
            };
          }[];
        };
      }).__kpMeasureFractionRuleHandoff;
      const snapshot = (progress: number) => measure(progress).observations.map(
        (observation) => ({ ...observation })
      );
      return {
        before: snapshot(0.999),
        repeated: snapshot(0.999),
        native: snapshot(1)
      };
    });

    expect(evidence.before).toEqual(evidence.repeated);
    expect(evidence.before.length).toBeGreaterThanOrEqual(4);
    expect(evidence.before.every((observation) =>
      observation.paintKind === "rule" &&
      observation.baselineY === null &&
      observation.wrapperTransform.length > 0 &&
      observation.clipPath.length > 0 &&
      observation.paintFingerprint === "rule" &&
      observation.styleFingerprint.includes("border-") &&
      observation.ruleGeometry.axis === "horizontal" &&
      observation.ruleGeometry.width > 0 &&
      observation.ruleGeometry.thickness > 0 &&
      Number.isFinite(observation.ruleGeometry.left) &&
      Number.isFinite(observation.ruleGeometry.top)
    )).toBe(true);
    const byCorrelation = evidence.before.reduce((groups, observation) => {
      const id = observation.id.replace(/\.(material|native)$/, "");
      groups.set(id, [...(groups.get(id) ?? []), observation]);
      return groups;
    }, new Map<string, typeof evidence.before>());
    expect([...byCorrelation.values()].every((pair) =>
      pair.length === 2 &&
      pair[0]!.paintAtomId === pair[1]!.paintAtomId &&
      pair[0]!.semanticEntityId === pair[1]!.semanticEntityId &&
      pair[0]!.paintFingerprint === pair[1]!.paintFingerprint
    )).toBe(true);
    expect(evidence.before.filter(({ side, opacity }) =>
      side === "native-target" && opacity > 0
    )).toHaveLength(0);
    expect(evidence.native.filter(({ side, opacity }) =>
      side === "material" && opacity > 0
    )).toHaveLength(0);
    expect(evidence.native.filter(({ side, opacity }) =>
      side === "native-target" && opacity > 0
    ).length).toBeGreaterThan(0);
    await context.close();
  }
});

test("dense handoff telemetry covers every correlated source material and target atom", async ({
  browser
}) => {
  const progresses = [0.96, 0.97, 0.98, 0.99, 0.995, 0.999, 1];
  for (const profile of [
    {
      viewport: { width: 1_440, height: 950 },
      deviceScaleFactor: 1
    },
    {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2
    }
  ]) {
    const context = await browser.newContext({
      viewport: profile.viewport,
      deviceScaleFactor: profile.deviceScaleFactor
    });
    const page = await context.newPage();
    const snapshot = async () => page.evaluate((denseProgresses) => {
      const measure = (window as unknown as {
        __kpMeasureFractionCorrelatedHandoff: (progress: number) => {
          observations: readonly {
            id: string;
            side: "native-source" | "material" | "native-target";
            paintAtomId: string;
            semanticEntityId: string;
            paintKind: string;
            rect: {
              left: number;
              top: number;
              width: number;
              height: number;
            };
            baselineY: number | null;
            wrapperTransform: string;
            wrapperFingerprint: string;
            clipPath: string;
            paintFingerprint: string;
            styleFingerprint: string;
            opacity: number;
            ruleGeometry?: {
              axis: "horizontal" | "vertical";
              left: number;
              top: number;
              width: number;
              thickness: number;
            };
          }[];
        };
      }).__kpMeasureFractionCorrelatedHandoff;
      return denseProgresses.map((progress) => ({
        progress,
        observations: measure(progress).observations.map((observation) => ({
          ...observation
        }))
      }));
    }, progresses);
    const load = async () => {
      await page.goto("/glyph-reconciliation-experiment.html?progress=859");
      await page.evaluate(async () => document.fonts.ready);
      await page.locator(
        '[data-kp-glyph-review][data-kp-ready="true"]'
      ).waitFor();
      return snapshot();
    };
    const first = await load();
    await page.setViewportSize({
      width: profile.viewport.width - 1,
      height: profile.viewport.height
    });
    await page.setViewportSize(profile.viewport);
    const resized = await load();

    expect(first).toEqual(resized);
    for (const sample of first) {
      const groups = sample.observations.reduce((result, observation) => {
        const id = observation.id.replace(/\.(source|material|native)$/, "");
        result.set(id, [...(result.get(id) ?? []), observation]);
        return result;
      }, new Map<string, typeof sample.observations>());
      expect(groups.size).toBeGreaterThanOrEqual(7);
      expect([...groups.values()].every((observations) =>
        observations.length === 3 &&
        observations.some(({ side }) => side === "native-source") &&
        observations.some(({ side }) => side === "material") &&
        observations.some(({ side }) => side === "native-target")
      )).toBe(true);
      expect(sample.observations.every((observation) =>
        observation.semanticEntityId.length > 0 &&
        observation.paintAtomId.length > 0 &&
        observation.paintFingerprint.length > 0 &&
        observation.styleFingerprint.length > 0 &&
        observation.wrapperTransform.length > 0 &&
        observation.wrapperFingerprint.length > 0 &&
        observation.clipPath.length > 0 &&
        Object.values(observation.rect).every(Number.isFinite) &&
        (
          observation.paintKind !== "glyph" ||
          Number.isFinite(observation.baselineY)
        ) &&
        (
          observation.paintKind !== "rule" ||
          (
            observation.ruleGeometry !== undefined &&
            observation.ruleGeometry.width > 0 &&
            observation.ruleGeometry.thickness > 0
          )
        )
      )).toBe(true);
    }
    await context.close();
  }
});

test("target-style realization keeps ordinary clone paint inert and native DOM untouched", async ({
  browser
}) => {
  for (const profile of [
    {
      viewport: { width: 1_440, height: 950 },
      reducedMotion: "no-preference" as const
    },
    {
      viewport: { width: 1_440, height: 950 },
      reducedMotion: "reduce" as const
    },
    {
      viewport: { width: 390, height: 844 },
      reducedMotion: "no-preference" as const
    },
    {
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce" as const
    }
  ]) {
    const context = await browser.newContext(profile);
    const page = await context.newPage();
    await page.goto("/glyph-reconciliation-experiment.html?progress=999");
    await page.evaluate(async () => document.fonts.ready);
    await page.locator(
      '[data-kp-glyph-review][data-kp-ready="true"]'
    ).waitFor();
    const evidence = await page.evaluate(() => {
      const api = (window as unknown as {
        __kpApplyFractionSceneFrame: (progress: number) => unknown;
        __kpMeasureFractionCorrelatedHandoff: (progress: number) => {
          observations: readonly {
            id: string;
            side: "native-source" | "material" | "native-target";
            paintKind: string;
            rect: {
              left: number;
              top: number;
              width: number;
              height: number;
            };
            baselineY: number | null;
            styleFingerprint: string;
          }[];
        };
        __kpRealizeFractionTypographyHandoff: (progress: number) => {
          ownership: {
            visualOwner: string;
            sourceNativeOpacity: number;
            materialSceneOpacity: number;
            targetNativeOpacity: number;
          };
          plan: {
            model: string;
            entries: readonly {
              id: string;
              materialOwnerId: string;
              paintKind: string;
              model: string;
              targetStyleFingerprint: string;
            }[];
          };
          styleFrame: {
            progress: number;
            entries: readonly {
              id: string;
              translateX: number;
              translateY: number;
              scaleX: number;
              scaleY: number;
            }[];
          };
          realization: {
            realizedIds: readonly string[];
            deferredIds: readonly string[];
            deferred: readonly {
              id: string;
              disposition: string;
            }[];
            nativeMutationCount: number;
          };
        };
      });
      api.__kpApplyFractionSceneFrame(0.999);
      const realize = api.__kpRealizeFractionTypographyHandoff;
      const source = document.querySelector<HTMLElement>(
        "[data-fraction-source]"
      )!;
      const target = document.querySelector<HTMLElement>(
        "[data-fraction-target]"
      )!;
      const sourceBefore = source.outerHTML;
      const targetBefore = target.outerHTML;
      realize(0.999);
      const second = realize(0.999);
      const owners = second.plan.entries.flatMap((entry) => {
        if (!second.realization.realizedIds.includes(entry.id)) return [];
        const owner = document.querySelector<HTMLElement>(
          `[data-kp-equation-material-owner-id="${
            CSS.escape(entry.materialOwnerId)
          }"]`
        )!;
        const visual = owner.firstElementChild as HTMLElement;
        const rect = owner.getBoundingClientRect();
        const forbiddenAuthority = [
          visual,
          ...visual.querySelectorAll<HTMLElement>("*")
        ].flatMap((element) => [
          "id",
          "role",
          "tabindex",
          "href",
          "contenteditable",
          "aria-label",
          "aria-hidden",
          "data-kp-motion-id",
          "data-kp-semantic-entity-id",
          "data-kp-presentation-group-id"
        ].filter((attribute) => element.hasAttribute(attribute)));
        return [{
          id: entry.id,
          paintKind: entry.paintKind,
          model: entry.model,
          targetStyleFingerprint: entry.targetStyleFingerprint,
          visualRevision:
            owner.dataset["kpEquationMaterialVisualRevision"] ?? null,
          inert: owner.hasAttribute("inert"),
          ariaHidden: owner.getAttribute("aria-hidden"),
          forbiddenAuthority,
          rect: {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
          },
          fontSize: getComputedStyle(visual).fontSize
        }];
      });
      const progresses = [0.96, 0.97, 0.98, 0.99, 0.999, 1];
      const sample = (progress: number) => {
        const result = realize(progress);
        return {
          progress,
          ownership: result.ownership,
          styleFrame: result.styleFrame
        };
      };
      const forward = progresses.map(sample);
      const reverse = [...progresses].reverse().map(sample).reverse();
      const endpointGroups =
        api.__kpMeasureFractionCorrelatedHandoff(0.999).observations.reduce(
          (groups, observation) => {
            const id = observation.id.replace(
              /\.(source|material|native)$/,
              ""
            );
            groups.set(id, [...(groups.get(id) ?? []), observation]);
            return groups;
          },
          new Map<string, Array<{
            id: string;
            side: "native-source" | "material" | "native-target";
            paintKind: string;
            rect: {
              left: number;
              top: number;
              width: number;
              height: number;
            };
            baselineY: number | null;
            styleFingerprint: string;
          }>>()
        );
      const endpointResiduals = [...endpointGroups.values()].flatMap(
        (observations) => {
          const material = observations.find(({ side }) =>
            side === "material"
          )!;
          const native = observations.find(({ side }) =>
            side === "native-target"
          )!;
          if (material.paintKind !== "glyph") return [];
          return [{
            styleMatches:
              material.styleFingerprint === native.styleFingerprint,
            rect: Math.max(
              ...Object.keys(material.rect).map((key) =>
                Math.abs(
                  material.rect[key as keyof typeof material.rect] -
                  native.rect[key as keyof typeof native.rect]
                )
              )
            ),
            baseline:
              material.baselineY === null || native.baselineY === null
                ? Number.POSITIVE_INFINITY
                : Math.abs(material.baselineY - native.baselineY)
          }];
        }
      );
      return {
        sourceUnchanged: source.outerHTML === sourceBefore,
        targetUnchanged: target.outerHTML === targetBefore,
        planModel: second.plan.model,
        nativeMutationCount: second.realization.nativeMutationCount,
        realizedIds: second.realization.realizedIds,
        deferredIds: second.realization.deferredIds,
        deferred: second.realization.deferred,
        forward,
        reverse,
        endpointResiduals,
        owners
      };
    });

    expect(evidence.planModel).toBe("target-style-reverse-flip");
    expect(evidence.nativeMutationCount).toBe(0);
    expect(evidence.sourceUnchanged).toBe(true);
    expect(evidence.targetUnchanged).toBe(true);
    expect(evidence.realizedIds.length).toBeGreaterThan(0);
    expect(evidence.deferredIds.length).toBeGreaterThan(0);
    expect(evidence.deferred.every(({ disposition }) =>
      disposition === "preserve-structural-paint"
    )).toBe(true);
    expect(evidence.reverse).toEqual(evidence.forward);
    expect(evidence.forward.map(({ ownership }) => ownership.visualOwner))
      .toEqual([
        "material-scene",
        "material-scene",
        "material-scene",
        "material-scene",
        "material-scene",
        "target-native"
      ]);
    expect(evidence.forward.every(({ ownership, styleFrame }) =>
      ownership.sourceNativeOpacity +
        ownership.materialSceneOpacity +
        ownership.targetNativeOpacity === 1 &&
      styleFrame.entries.every((entry) =>
        Object.entries(entry).every(([key, value]) =>
          key === "id" ||
          (typeof value === "number" && Number.isFinite(value))
        ) &&
        !("opacity" in entry)
      )
    )).toBe(true);
    expect(evidence.forward.at(-1)?.styleFrame.entries.every((entry) =>
      entry.translateX === 0 &&
      entry.translateY === 0 &&
      entry.scaleX === 1 &&
      entry.scaleY === 1
    )).toBe(true);
    expect(evidence.endpointResiduals.every((residual) =>
      residual.styleMatches &&
      residual.rect < 0.2 &&
      residual.baseline < 0.1
    )).toBe(true);
    expect(evidence.owners.every((owner) =>
      owner.paintKind === "glyph" &&
      owner.model === "target-style-reverse-flip" &&
      owner.visualRevision?.startsWith("target:") &&
      owner.inert &&
      owner.ariaHidden === "true" &&
      owner.forbiddenAuthority.length === 0 &&
      owner.targetStyleFingerprint.includes(`font-size:${owner.fontSize}`) &&
      Object.values(owner.rect).every(Number.isFinite) &&
      owner.rect.width > 0 &&
      owner.rect.height > 0
    )).toBe(true);
    await context.close();
  }
});

test("target glyph paint follows the full scene without a late size snap", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.evaluate(async () => document.fonts.ready);
  await page.locator(
    '[data-kp-glyph-review][data-kp-ready="true"]'
  ).waitFor();
  const evidence = await page.evaluate(async () => {
    const realize = (window as unknown as {
      __kpRealizeFractionTypographyHandoff: (progress: number) => {
        plan: {
          entries: readonly {
            id: string;
            materialOwnerId: string;
          }[];
        };
        styleFrame: {
          entries: readonly {
            id: string;
            scaleX: number;
            scaleY: number;
          }[];
        };
      };
      __kpMeasureFractionCorrelatedHandoff: (progress: number) => {
        observations: readonly {
          id: string;
          side: "native-source" | "material" | "native-target";
          semanticEntityId: string;
          element: HTMLElement;
        }[];
      };
    }).__kpRealizeFractionTypographyHandoff;
    const measure = (window as unknown as {
      __kpMeasureFractionCorrelatedHandoff: (progress: number) => {
        observations: readonly {
          id: string;
          side: "native-source" | "material" | "native-target";
          semanticEntityId: string;
          element: HTMLElement;
        }[];
      };
    }).__kpMeasureFractionCorrelatedHandoff;
    const moduleUrl = "/src/rendering/native-katex-paint-geometry.ts";
    const measureTextInkRect = (
      await import(/* @vite-ignore */ moduleUrl)
    ).measureKpNativeKatexTextInkRect;
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-glyph-review]"
    )!;
    // This gate exists to catch visible handoff motion. A Range rectangle is
    // a line box and can remain aligned while the glyph ink itself jumps.
    const paintRect = (element: HTMLElement) =>
      measureTextInkRect(stage, element);
    return [
      0.001,
      0.25,
      0.5,
      0.75,
      0.959,
      0.96,
      0.961,
      0.999
    ].map((progress) => {
      const result = realize(progress);
      const observations = measure(progress).observations;
      const entities = [
        "operator.add",
        "symbol.x",
        "symbol.y"
      ].map((entity) => {
        const entry = result.plan.entries.find(({ id }) =>
          id.includes(entity)
        )!;
        const owner = document.querySelector<HTMLElement>(
          `[data-kp-equation-material-owner-id="${
            CSS.escape(entry.materialOwnerId)
          }"]`
        )!;
        const visual = owner.firstElementChild as HTMLElement;
        const rect = owner.getBoundingClientRect();
        const style = result.styleFrame.entries.find(({ id }) =>
          id === entry.id
        )!;
        const correlated = observations.filter(({ semanticEntityId }) =>
          semanticEntityId === entity
        );
        const material = correlated.find(({ side }) => side === "material")!;
        const native = correlated.find(({ side }) =>
          side === (progress === 0.001 ? "native-source" : "native-target")
        );
        const materialPaintRect = paintRect(material.element);
        const nativePaintRect = native === undefined
          ? undefined
          : paintRect(native.element);
        const paintResidual = native === undefined
          ? undefined
          : Math.max(
            Math.abs(materialPaintRect.left - nativePaintRect!.left),
            Math.abs(materialPaintRect.top - nativePaintRect!.top)
          );
        const fontSize = getComputedStyle(visual).fontSize;
        return {
          entity,
          visualRevision:
            owner.dataset["kpEquationMaterialVisualRevision"] ?? "",
          fontSize,
          effectiveFontSize: Number.parseFloat(fontSize) * style.scaleY,
          width: rect.width,
          height: rect.height,
          scaleX: style.scaleX,
          scaleY: style.scaleY,
          paintResidual
        };
      });
      return { progress, entities };
    });
  });

  const values = (entity: string, key: "width" | "height") =>
    evidence.map((frame) =>
      frame.entities.find((candidate) => candidate.entity === entity)![key]
    );
  expect(evidence.every((frame) =>
    frame.entities.every(({ visualRevision }) =>
      visualRevision.startsWith("target:")
    )
  )).toBe(true);
  expect(evidence.every((frame) =>
    frame.entities.every(({ fontSize }) => fontSize === "46.0768px")
  )).toBe(true);
  expect(evidence.every((frame) =>
    frame.entities.every(({ scaleX, scaleY }) =>
      Math.abs(scaleX - scaleY) < 1e-9
    )
  )).toBe(true);
  expect(evidence[0]!.entities.every(({ paintResidual }) =>
    paintResidual !== undefined && paintResidual < 0.2
  )).toBe(true);
  expect(evidence.at(-1)!.entities.every(({ paintResidual }) =>
    paintResidual !== undefined && paintResidual < 0.2
  )).toBe(true);
  const plusWidths = values("operator.add", "width");
  const plusFontSizes = evidence.map((frame) =>
    frame.entities.find(({ entity }) => entity === "operator.add")!
      .effectiveFontSize
  );
  expect(Math.abs(plusFontSizes[0]! - 65.824)).toBeLessThan(0.05);
  expect(Math.abs(plusFontSizes.at(-1)! - 46.0768)).toBeLessThan(0.05);
  expect(plusFontSizes.every((size, index) =>
    index === 0 || size <= plusFontSizes[index - 1]! + 0.001
  )).toBe(true);
  expect(plusWidths[0]).toBeGreaterThan(plusWidths.at(-1)!);
  expect(plusWidths.every((width, index) =>
    index === 0 || width <= plusWidths[index - 1]! + 0.01
  )).toBe(true);
  for (const entity of ["symbol.x", "symbol.y"]) {
    expect(evidence.every((frame) =>
      Math.abs(
        frame.entities.find((candidate) => candidate.entity === entity)!
          .scaleX - 1
      ) < 1e-9
    )).toBe(true);
    for (const key of ["width", "height"] as const) {
      const sizes = values(entity, key);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThan(0.1);
    }
  }
  for (const entity of ["operator.add", "symbol.x", "symbol.y"]) {
    const before = evidence[4]!.entities.find((candidate) =>
      candidate.entity === entity
    )!;
    const boundary = evidence[5]!.entities.find((candidate) =>
      candidate.entity === entity
    )!;
    expect(Math.abs(before.width - boundary.width)).toBeLessThan(0.1);
    expect(Math.abs(before.height - boundary.height)).toBeLessThan(0.1);
  }
});

test("handoff ownership trace is atomic and seek-direction independent", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=859");
  await page.locator(
    '[data-kp-glyph-review][data-kp-ready="true"]'
  ).waitFor();
  const progresses = [0.96, 0.99, 0.999, 1] as const;
  const evidence = {
    forward: await traceFractionHandoff(page, progresses),
    reverse: [...await traceFractionHandoff(
      page,
      [...progresses].reverse()
    )].reverse()
  };

  expect(evidence.forward).toEqual(evidence.reverse);
  expect(evidence.forward.map(({ visualOwner }) => visualOwner)).toEqual([
    "material-scene",
    "material-scene",
    "material-scene",
    "target-native"
  ]);
  expect(evidence.forward.map((sample) =>
    sample.sourceNativeOpacity +
    sample.materialSceneOpacity +
    sample.targetNativeOpacity
  )).toEqual([1, 1, 1, 1]);
  expect(evidence.forward.slice(0, -1).every((sample) =>
    sample.sourceNativeOpacity === 0 &&
    sample.materialSceneOpacity === 1 &&
    sample.targetNativeOpacity === 0 &&
    sample.visibleMaterialOwnerIds.length > 0
  )).toBe(true);
  expect(evidence.forward.at(-1)).toMatchObject({
    sourceNativeOpacity: 0,
    materialSceneOpacity: 0,
    targetNativeOpacity: 1,
    visibleMaterialOwnerIds: []
  });
  expect(evidence.forward.every((sample) =>
    sample.glyphStyleMismatchIds.some((id) => id.includes("operator.add"))
  )).toBe(true);
  expect(evidence.forward[2]!.maximumGlyphRectResidualPx).toBeLessThan(0.2);
  expect(evidence.forward[2]!.maximumGlyphBaselineResidualPx).toBeGreaterThan(
    1
  );
  expect(evidence.forward[2]!.maximumRuleGeometryResidualPx).toBeLessThan(0.2);
});

test("endpoint regression matrix survives DPR, resize, seek, and replay", async ({
  browser
}) => {
  for (const profile of [{
    viewport: { width: 1_440, height: 950 },
    resizedViewport: { width: 1_120, height: 820 },
    deviceScaleFactor: 1
  }, {
    viewport: { width: 390, height: 844 },
    resizedViewport: { width: 430, height: 900 },
    deviceScaleFactor: 2
  }]) {
    const context = await browser.newContext({
      viewport: profile.viewport,
      deviceScaleFactor: profile.deviceScaleFactor
    });
    const page = await context.newPage();
    await page.goto("/glyph-reconciliation-experiment.html?progress=859");
    await page.locator(
      '[data-kp-glyph-review][data-kp-ready="true"]'
    ).waitFor();
    await page.evaluate(async () => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.status)).toBe("loaded");

    const steps = [0.96, 0.99, 0.999, 1] as const;
    const direct = await traceFractionHandoff(page, steps);
    const repeated = await traceFractionHandoff(page, steps);
    const reverse = [...await traceFractionHandoff(
      page,
      [...steps].reverse()
    )].reverse();
    expect(direct).toEqual(repeated);
    expect(direct).toEqual(reverse);
    expectFractionEndpointRegression(direct);

    const replay = await traceFractionHandoff(
      page,
      [0, 0.999, 1, 0, 0.999, 1]
    );
    expect(replay.slice(0, 3)).toEqual(replay.slice(3));
    expect(replay.map(({ visualOwner }) => visualOwner)).toEqual([
      "source-native",
      "material-scene",
      "target-native",
      "source-native",
      "material-scene",
      "target-native"
    ]);

    await page.setViewportSize(profile.resizedViewport);
    await page.reload();
    await page.locator(
      '[data-kp-glyph-review][data-kp-ready="true"]'
    ).waitFor();
    await page.evaluate(async () => document.fonts.ready);
    const resized = await traceFractionHandoff(page, steps);
    expect(resized).toEqual(await traceFractionHandoff(page, steps));
    expectFractionEndpointRegression(resized);
    await context.close();
  }
});

test("visible fraction card renders the complete moving scene on its shared clock", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=250");
  const review = page.locator('[data-kp-glyph-review][data-kp-ready="true"]');
  await review.waitFor();
  const fraction = page.locator('[data-reconciliation-case="fraction-merge"]');
  const slider = fraction.locator("[data-progress]");
  const snapshot = async () => fraction.evaluate((card) =>
    [...card.querySelectorAll<HTMLElement>(
      "[data-kp-native-katex-scene-owner]"
    )].map((owner) => ({
      id: owner.dataset["kpEquationMaterialOwnerId"],
      role: owner.dataset["kpEquationMaterialFragmentRole"],
      left: owner.style.left,
      top: owner.style.top,
      width: owner.style.width,
      opacity: owner.style.opacity,
      transform: owner.style.transform
    }))
  );
  const early = await snapshot();
  await slider.evaluate((element: HTMLInputElement) => {
    element.value = "750";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const late = await snapshot();

  await expect(review).toHaveAttribute(
    "data-kp-fraction-visual-owner",
    "material-scene"
  );
  await expect(fraction.locator("[data-fraction-source]")).toHaveCSS(
    "opacity",
    "0"
  );
  await expect(fraction.locator("[data-fraction-target]")).toHaveCSS(
    "opacity",
    "0"
  );
  expect(early.length).toBeGreaterThan(5);
  expect(early.map(({ id }) => id)).toEqual(late.map(({ id }) => id));
  expect(early.filter((frame, index) => {
    const next = late[index]!;
    return frame.left !== next.left ||
      frame.top !== next.top ||
      frame.width !== next.width ||
      frame.opacity !== next.opacity ||
      frame.transform !== next.transform;
  }).length).toBeGreaterThan(4);
  expect(early.filter(({ role }) => role?.startsWith("rule:"))).toHaveLength(2);
});

test("fraction native endpoints share one stable equation anchor", async ({
  page
}) => {
  for (const viewport of [
    { width: 1440, height: 950 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/glyph-reconciliation-experiment.html?progress=0");
    await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
    const anchors = await page.locator(
      '[data-reconciliation-case="fraction-merge"]'
    ).evaluate((card) => {
      const source = card.querySelector<HTMLElement>("[data-fraction-source]")!;
      const target = card.querySelector<HTMLElement>("[data-fraction-target]")!;
      const sourceRect = source.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      return {
        sourceTop: getComputedStyle(source).top,
        targetTop: getComputedStyle(target).top,
        sourceAnchorY: sourceRect.top + sourceRect.height / 2,
        targetAnchorY: targetRect.top + targetRect.height / 2
      };
    });

    expect(anchors.sourceTop).toBe(anchors.targetTop);
    expect(anchors.sourceAnchorY).toBeCloseTo(anchors.targetAnchorY, 1);
  }
});

test("observer rejects missing and duplicate explicit motion nodes", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
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
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
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
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
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

test("material clone uses the exact KaTeX subtree without semantic authority", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const result = await page.evaluate(async () => {
    const stage = document.querySelector<HTMLElement>(
      '[data-reconciliation-case="solve-x"] [data-case-stage]'
    )!;
    const renderedX = stage.querySelector<HTMLElement>(
      "[data-case-source] .mord.mathnormal"
    )!;
    renderedX.dataset["kpMotionId"] = "motion.solve-x.clone-x";
    renderedX.id = "semantic-x";
    renderedX.setAttribute("role", "math");
    renderedX.setAttribute("aria-label", "semantic x");
    renderedX.tabIndex = 0;
    const layer = document.createElement("span");
    layer.dataset["kpEditorEquationMaterialLayer"] = "true";
    stage.append(layer);
    // @ts-expect-error Vite resolves browser-side source modules.
    const observer = await import("/src/rendering/native-katex-fragment-observer.ts");
    // @ts-expect-error Vite resolves browser-side source modules.
    const compositor = await import("/src/rendering/native-katex-glyph-compositor.ts");
    const observation = observer.observeKpNativeKatexFragments({
      stage,
      bindings: [{
        id: "fragment.solve-x.clone-x",
        semanticEntityId: "entity.x",
        motionId: "motion.solve-x.clone-x",
        glyphKey: "x"
      }],
      fontRevision: 1
    }).fragments[0]!;
    const clone = compositor.createKpNativeKatexFragmentClone({
      stage,
      ownerId: "owner.solve-x.clone-x",
      observation
    });
    const sourceStyle = getComputedStyle(renderedX);
    return {
      text: clone.visualElement.textContent,
      className: clone.visualElement.className,
      fontFamily: clone.visualElement.style.fontFamily,
      sourceFontFamily: sourceStyle.fontFamily,
      fontSize: clone.visualElement.style.fontSize,
      sourceFontSize: sourceStyle.fontSize,
      cloneMotionId: clone.visualElement.dataset["kpMotionId"] ?? null,
      cloneId: clone.visualElement.id,
      cloneRole: clone.visualElement.getAttribute("role"),
      cloneLabel: clone.visualElement.getAttribute("aria-label"),
      cloneTabIndex: clone.visualElement.getAttribute("tabindex"),
      ownerAriaHidden: clone.ownerElement.getAttribute("aria-hidden"),
      ownerInert: clone.ownerElement.inert,
      ownerPointerEvents: clone.ownerElement.style.pointerEvents
    };
  });

  expect(result.text).toBe("x");
  expect(result.className).toContain("mathnormal");
  expect(result.fontFamily).toBe(result.sourceFontFamily);
  expect(result.fontSize).toBe(result.sourceFontSize);
  expect(result.cloneMotionId).toBeNull();
  expect(result.cloneId).toBe("");
  expect(result.cloneRole).toBeNull();
  expect(result.cloneLabel).toBeNull();
  expect(result.cloneTabIndex).toBeNull();
  expect(result.ownerAriaHidden).toBe("true");
  expect(result.ownerInert).toBe(true);
  expect(result.ownerPointerEvents).toBe("none");
});

test("source, clone, and target have exactly one visual owner", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const frames = await page.evaluate(async () => {
    const stage = document.querySelector<HTMLElement>(
      '[data-reconciliation-case="solve-x"] [data-case-stage]'
    )!;
    const sourceX = stage.querySelector<HTMLElement>(
      "[data-case-source] .mord.mathnormal"
    )!;
    const targetX = stage.querySelector<HTMLElement>(
      "[data-case-target] .mord.mathnormal"
    )!;
    sourceX.dataset["kpMotionId"] = "motion.solve-x.owner-source";
    targetX.dataset["kpMotionId"] = "motion.solve-x.owner-target";
    const layer = document.createElement("span");
    layer.dataset["kpEditorEquationMaterialLayer"] = "true";
    stage.append(layer);
    // @ts-expect-error Vite resolves browser-side source modules.
    const observer = await import("/src/rendering/native-katex-fragment-observer.ts");
    // @ts-expect-error Vite resolves browser-side source modules.
    const compositor = await import("/src/rendering/native-katex-glyph-compositor.ts");
    const observed = observer.observeKpNativeKatexFragments({
      stage,
      bindings: [{
        id: "fragment.owner.source",
        semanticEntityId: "entity.source.x",
        motionId: "motion.solve-x.owner-source",
        glyphKey: "x"
      }, {
        id: "fragment.owner.target",
        semanticEntityId: "entity.target.x",
        motionId: "motion.solve-x.owner-target",
        glyphKey: "x"
      }],
      fontRevision: 1
    }).fragments;
    const clone = compositor.createKpNativeKatexFragmentClone({
      stage,
      ownerId: "owner.solve-x.exclusive",
      observation: observed[0]!
    });
    return [0, 0.001, 0.5, 0.999, 1].map((progress) => ({
      progress,
      ...compositor.applyKpNativeKatexGlyphOwnership({
        clone,
        source: observed[0]!,
        target: observed[1]!,
        progress
      })
    }));
  });

  expect(frames.map(({ visualOwner }) => visualOwner)).toEqual([
    "source-native",
    "clone-transit",
    "clone-transit",
    "clone-transit",
    "target-native"
  ]);
  for (const frame of frames) {
    expect(
      frame.sourceNativeOpacity +
      frame.cloneOpacity +
      frame.targetNativeOpacity
    ).toBe(1);
    expect([
      frame.sourceNativeOpacity,
      frame.cloneOpacity,
      frame.targetNativeOpacity
    ].filter((opacity) => opacity === 1)).toHaveLength(1);
  }
});

test("generic many-to-one frame converges exact native fragments without substitution", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const result = await page.evaluate(async () => {
    const stage = document.querySelector<HTMLElement>(
      '[data-reconciliation-case="solve-x"] [data-case-stage]'
    )!;
    const firstSource = stage.querySelector<HTMLElement>("[data-case-source]")!;
    const target = stage.querySelector<HTMLElement>("[data-case-target]")!;
    const secondSource = firstSource.cloneNode(true) as HTMLElement;
    secondSource.removeAttribute("data-case-source");
    secondSource.style.left = `${parseFloat(firstSource.style.left) + 120}px`;
    secondSource.dataset["kpMotionId"] = "motion.merge.source-b";
    firstSource.dataset["kpMotionId"] = "motion.merge.source-a";
    target.dataset["kpMotionId"] = "motion.merge.target";
    stage.append(secondSource);
    // @ts-expect-error Vite resolves browser-side source modules.
    const observer = await import("/src/rendering/native-katex-fragment-observer.ts");
    // @ts-expect-error Vite resolves browser-side source modules.
    const compositor = await import("/src/rendering/native-katex-glyph-compositor.ts");
    type BrowserObservation = {
      id: string;
      semanticEntityId: string;
      motionId: string;
      glyphKey: string;
      sourceElement: HTMLElement;
      rect: { left: number; top: number; width: number; height: number };
      styleFingerprint: string;
      fontRevision: number;
    };
    const observed = observer.observeKpNativeKatexFragments({
      stage,
      bindings: [{
        id: "fragment.merge.source-a",
        semanticEntityId: "entity.merge.source-a",
        motionId: "motion.merge.source-a",
        glyphKey: "x"
      }, {
        id: "fragment.merge.source-b",
        semanticEntityId: "entity.merge.source-b",
        motionId: "motion.merge.source-b",
        glyphKey: "x"
      }, {
        id: "fragment.merge.target",
        semanticEntityId: "entity.merge.target",
        motionId: "motion.merge.target",
        glyphKey: "x"
      }],
      fontRevision: 1
    }).fragments as BrowserObservation[];
    const clones = compositor.createKpNativeKatexFragmentClones({
      stage,
      fragments: observed.slice(0, 2).map((observation, index) => ({
        ownerId: `owner.merge.${index}`,
        observation
      }))
    }) as {
      ownerElement: HTMLElement;
      visualElement: HTMLElement;
    }[];
    const frames = [0, 0.5, 1].map((progress) =>
      compositor.applyKpNativeKatexManyToOneFrame({
        clones,
        sources: observed.slice(0, 2),
        target: observed[2]!,
        progress
      })
    );
    return {
      owners: frames.map(({ visualOwner }) => visualOwner),
      endpointDelta: frames[2]!.targetHandoffDeltaPx,
      sourceTexts: observed.slice(0, 2).map(({ sourceElement }) =>
        sourceElement.textContent
      ),
      cloneTexts: clones.map(({ visualElement }) => visualElement.textContent),
      targetText: target.textContent,
      endpointCloneOpacities: clones.map(({ ownerElement }) =>
        Number(ownerElement.style.opacity)
      ),
      targetOpacity: Number(target.style.opacity)
    };
  });

  expect(result.owners).toEqual([
    "source-natives",
    "clone-transit",
    "target-native"
  ]);
  expect(result.endpointDelta).toBe(0);
  expect(result.sourceTexts).toEqual([
    result.targetText,
    result.targetText
  ]);
  expect(result.cloneTexts).toEqual(result.sourceTexts);
  expect(result.endpointCloneOpacities).toEqual([0, 0]);
  expect(result.targetOpacity).toBe(1);
});

test("generic one-to-many frame separates exact target fragments without transit substitution", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const result = await page.evaluate(async () => {
    const stage = document.querySelector<HTMLElement>(
      '[data-reconciliation-case="solve-x"] [data-case-stage]'
    )!;
    const source = stage.querySelector<HTMLElement>("[data-case-source]")!;
    const firstTarget = stage.querySelector<HTMLElement>("[data-case-target]")!;
    const secondTarget = firstTarget.cloneNode(true) as HTMLElement;
    secondTarget.removeAttribute("data-case-target");
    secondTarget.style.left = `${parseFloat(firstTarget.style.left) + 120}px`;
    source.dataset["kpMotionId"] = "motion.split.source";
    firstTarget.dataset["kpMotionId"] = "motion.split.target-a";
    secondTarget.dataset["kpMotionId"] = "motion.split.target-b";
    stage.append(secondTarget);
    // @ts-expect-error Vite resolves browser-side source modules.
    const observer = await import("/src/rendering/native-katex-fragment-observer.ts");
    // @ts-expect-error Vite resolves browser-side source modules.
    const compositor = await import("/src/rendering/native-katex-glyph-compositor.ts");
    const observed = observer.observeKpNativeKatexFragments({
      stage,
      bindings: [{
        id: "fragment.split.source",
        semanticEntityId: "entity.split.source",
        motionId: "motion.split.source",
        glyphKey: "x"
      }, {
        id: "fragment.split.target-a",
        semanticEntityId: "entity.split.target-a",
        motionId: "motion.split.target-a",
        glyphKey: "x"
      }, {
        id: "fragment.split.target-b",
        semanticEntityId: "entity.split.target-b",
        motionId: "motion.split.target-b",
        glyphKey: "x"
      }],
      fontRevision: 1
    }).fragments;
    const clones = compositor.createKpNativeKatexFragmentClones({
      stage,
      fragments: [{
        ownerId: "owner.split.target-a",
        observation: observed[1]!
      }, {
        ownerId: "owner.split.target-b",
        observation: observed[2]!
      }]
    }) as {
      ownerElement: HTMLElement;
      visualElement: HTMLElement;
    }[];
    const frames = [0, 0.5, 1].map((progress: number) =>
      compositor.applyKpNativeKatexOneToManyFrame({
        clones,
        source: observed[0]!,
        targets: observed.slice(1),
        progress
      })
    ) as { visualOwner: string; targetHandoffDeltaPx: number }[];
    return {
      owners: frames.map((frame) => frame.visualOwner),
      endpointDelta: frames[2]!.targetHandoffDeltaPx,
      cloneTexts: clones.map(({ visualElement }) => visualElement.textContent),
      targetTexts: [firstTarget.textContent, secondTarget.textContent],
      sourceOpacity: Number(source.style.opacity),
      targetOpacities: [
        Number(firstTarget.style.opacity),
        Number(secondTarget.style.opacity)
      ]
    };
  });

  expect(result.owners).toEqual([
    "source-native",
    "clone-transit",
    "target-natives"
  ]);
  expect(result.endpointDelta).toBe(0);
  expect(result.cloneTexts).toEqual(result.targetTexts);
  expect(result.sourceOpacity).toBe(0);
  expect(result.targetOpacities).toEqual([1, 1]);
});

test("moving clone meets native target within one CSS pixel without typography drift", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const result = await page.evaluate(async () => {
    const stage = document.querySelector<HTMLElement>(
      '[data-reconciliation-case="solve-x"] [data-case-stage]'
    )!;
    const sourceX = stage.querySelector<HTMLElement>(
      "[data-case-source] .mord.mathnormal"
    )!;
    const targetX = stage.querySelector<HTMLElement>(
      "[data-case-target] .mord.mathnormal"
    )!;
    sourceX.dataset["kpMotionId"] = "motion.solve-x.handoff-source";
    targetX.dataset["kpMotionId"] = "motion.solve-x.handoff-target";
    const layer = document.createElement("span");
    layer.dataset["kpEditorEquationMaterialLayer"] = "true";
    stage.append(layer);
    // @ts-expect-error Vite resolves browser-side source modules.
    const observer = await import("/src/rendering/native-katex-fragment-observer.ts");
    // @ts-expect-error Vite resolves browser-side source modules.
    const compositor = await import("/src/rendering/native-katex-glyph-compositor.ts");
    const observed = observer.observeKpNativeKatexFragments({
      stage,
      bindings: [{
        id: "fragment.handoff.source",
        semanticEntityId: "entity.source.x",
        motionId: "motion.solve-x.handoff-source",
        glyphKey: "x"
      }, {
        id: "fragment.handoff.target",
        semanticEntityId: "entity.target.x",
        motionId: "motion.solve-x.handoff-target",
        glyphKey: "x"
      }],
      fontRevision: 1
    }).fragments;
    const clone = compositor.createKpNativeKatexFragmentClone({
      stage,
      ownerId: "owner.solve-x.handoff",
      observation: observed[0]!
    });
    const before = compositor.applyKpNativeKatexGlyphFrame({
      clone,
      source: observed[0]!,
      target: observed[1]!,
      progress: 0.999999
    });
    const atTarget = compositor.applyKpNativeKatexGlyphFrame({
      clone,
      source: observed[0]!,
      target: observed[1]!,
      progress: 1
    });
    const stageRect = stage.getBoundingClientRect();
    const ownerRect = clone.ownerElement.getBoundingClientRect();
    const visualRect = clone.visualElement.getBoundingClientRect();
    const targetRect = targetX.getBoundingClientRect();
    const scaleX = stageRect.width / stage.offsetWidth;
    const scaleY = stageRect.height / stage.offsetHeight;
    const ownerDelta = Math.max(
      Math.abs(ownerRect.left - targetRect.left) / scaleX,
      Math.abs(ownerRect.top - targetRect.top) / scaleY,
      Math.abs(ownerRect.width - targetRect.width) / scaleX,
      Math.abs(ownerRect.height - targetRect.height) / scaleY
    );
    const visualDelta = Math.max(
      Math.abs(visualRect.left - targetRect.left) / scaleX,
      Math.abs(visualRect.top - targetRect.top) / scaleY,
      Math.abs(visualRect.width - targetRect.width) / scaleX,
      Math.abs(visualRect.height - targetRect.height) / scaleY
    );
    return {
      beforeDelta: before.targetHandoffDeltaPx,
      atTargetDelta: atTarget.targetHandoffDeltaPx,
      ownerDelta,
      visualDelta,
      sourceFingerprint: observed[0]!.styleFingerprint,
      targetFingerprint: observed[1]!.styleFingerprint,
      visualOwner: atTarget.visualOwner
    };
  });

  expect(result.beforeDelta).toBeLessThan(0.01);
  expect(result.atTargetDelta).toBe(0);
  expect(result.ownerDelta).toBeLessThanOrEqual(1);
  expect(result.visualDelta).toBeLessThanOrEqual(1);
  expect(result.sourceFingerprint).toBe(result.targetFingerprint);
  expect(result.visualOwner).toBe("target-native");
});

test("persistent context reflows continuously while only local context departs", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const result = await page.evaluate(async () => {
    // @ts-expect-error Vite resolves browser-side source modules.
    const compositor = await import("/src/rendering/native-katex-glyph-compositor.ts");
    const stage = document.querySelector<HTMLElement>(
      '[data-reconciliation-case="solve-x"] [data-case-stage]'
    )!;
    const sourceEquation = stage.querySelector<HTMLElement>(
      "[data-case-source]"
    )!;
    const targetEquation = stage.querySelector<HTMLElement>(
      "[data-case-target]"
    )!;
    const persistent = document.createElement("span");
    persistent.textContent = "= 7 − 3";
    const departing = document.createElement("span");
    departing.textContent = "+ 3 − 3";
    stage.append(persistent, departing);
    const samples = [0, 0.25, 0.5, 0.75, 1].map((progress) =>
      compositor.applyKpNativeKatexContextReflow({
        persistentElement: persistent,
        persistentSourceRect: {
          left: 300,
          top: 100,
          width: 80,
          height: 24
        },
        persistentTargetRect: {
          left: 210,
          top: 100,
          width: 80,
          height: 24
        },
        departingElements: [departing],
        reflowProgress: progress,
        departureProgress: progress
      })
    );
    return {
      samples,
      sourceEquationOpacity: sourceEquation.style.opacity,
      targetEquationOpacity: targetEquation.style.opacity,
      persistentOpacity: persistent.style.opacity
    };
  });

  expect(result.samples.map(({ translateX }) => translateX)).toEqual([
    0,
    -14.0625,
    -45,
    -75.9375,
    -90
  ]);
  expect(result.samples.map(({ departingOpacity }) => departingOpacity)).toEqual([
    1,
    0.84375,
    0.5,
    0.15625,
    0
  ]);
  expect(result.persistentOpacity).toBe("");
  expect(result.sourceEquationOpacity).toBe("1");
  expect(result.targetEquationOpacity).toBe("0");
});

test("solve-x exemplar moves one real x without crossfade or character substitution", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const samples = await page.evaluate(() => {
    const review = document.querySelector<HTMLElement>(
      "[data-kp-glyph-review]"
    )!;
    const slider = document.querySelector<HTMLInputElement>("[data-progress]")!;
    const source = document.querySelector<HTMLElement>("[data-case-source]")!;
    const target = document.querySelector<HTMLElement>("[data-case-target]")!;
    const context = document.querySelector<HTMLElement>("[data-case-context]")!;
    const departing = document.querySelector<HTMLElement>(
      "[data-case-departing]"
    )!;
    const owner = document.querySelector<HTMLElement>(
      "[data-kp-native-katex-fragment-clone]"
    )!;
    const visual = owner.firstElementChild as HTMLElement;
    return [0, 250, 500, 750, 1000].map((progress) => {
      slider.value = String(progress);
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      const rect = owner.getBoundingClientRect();
      return {
        progress,
        visualOwner: review.dataset["kpVisualOwner"],
        sourceText: source.textContent,
        targetText: target.textContent,
        cloneText: visual.textContent,
        sourceOpacity: Number(source.style.opacity),
        cloneOpacity: Number(owner.style.opacity),
        targetOpacity: Number(target.style.opacity),
        cloneLeft: rect.left,
        cloneTop: rect.top,
        contextOpacity: context.style.opacity,
        departingOpacity: Number(departing.style.opacity)
      };
    });
  });

  expect(samples.map(({ visualOwner }) => visualOwner)).toEqual([
    "source-native",
    "source-native",
    "clone-transit",
    "clone-transit",
    "target-native"
  ]);
  expect(samples.map(({ cloneLeft }) => cloneLeft)).toEqual(
    [...samples.map(({ cloneLeft }) => cloneLeft)].sort((a, b) => a - b)
  );
  for (const sample of samples) {
    expect(sample.sourceText).toMatch(/^x+$/);
    expect(sample.targetText).toMatch(/^x+$/);
    expect(sample.cloneText).toMatch(/^x+$/);
    expect(
      sample.sourceOpacity + sample.cloneOpacity + sample.targetOpacity
    ).toBe(1);
    expect(sample.contextOpacity).toBe("");
    expect(sample.cloneTop).toBeCloseTo(samples[0]!.cloneTop, 1);
  }
  expect(samples[1]!.departingOpacity).toBe(0);
});

test("inverse fraction exemplar uses one full-scene split sampler", async ({
  page
}) => {
  await page.goto(
    "/glyph-reconciliation-experiment.html?fractionDirection=split&progress=0"
  );
  const review = page.locator('[data-kp-glyph-review][data-kp-ready="true"]');
  await review.waitFor();
  const fraction = page.locator('[data-reconciliation-case="fraction-split"]');
  const merged = fraction.locator("[data-fraction-target]");
  const split = fraction.locator("[data-fraction-source]");
  const stage = fraction.locator("[data-fraction-stage]");
  const slider = fraction.locator("[data-progress]");
  const targetDenominators = split.locator(
    '[data-kp-motion-id^="motion.fraction.source-denominator"]'
  );
  const sceneOwners = fraction.locator("[data-kp-native-katex-scene-owner]");

  await expect(fraction.locator("[data-fraction-title]")).toHaveText(
    "Split one native fraction across its sum"
  );
  await expect(review).toHaveAttribute("data-kp-fraction-direction", "split");
  await expect(merged).toHaveAttribute("aria-hidden", "false");
  await expect(split).toHaveAttribute("aria-hidden", "true");
  await expect(stage).toHaveAttribute(
    "data-kp-fraction-semantic-owner",
    "source-native"
  );
  const samples = await page.evaluate(() => {
    const sample = (window as unknown as {
      __kpSampleFractionSceneTracks: (progress: number) => readonly {
        lifecycle: string;
        paintKind: string;
        sizingMode: string;
        rect: { left: number; top: number; width: number; height: number };
        opacity: number;
      }[];
    }).__kpSampleFractionSceneTracks;
    const progresses = [0, 0.25, 0.5, 0.75, 1];
    return {
      forward: progresses.map(sample),
      reverse: [...progresses].reverse().map(sample).reverse()
    };
  });
  expect(samples.forward).toEqual(samples.reverse);
  const splitTracks = samples.forward[0]!.filter(({ lifecycle }) =>
    lifecycle === "split"
  );
  expect(splitTracks.length).toBeGreaterThanOrEqual(4);
  expect(splitTracks.some(({ paintKind, sizingMode }) =>
    paintKind === "rule" && sizingMode === "rule-length"
  )).toBe(true);
  expect(samples.forward.flat()
    .filter(({ lifecycle }) => lifecycle === "split")
    .every(({ opacity }) => opacity === 1)).toBe(true);
  expect(samples.forward.flat().every(({ rect, opacity }) =>
    Object.values(rect).every(Number.isFinite) &&
    Number.isFinite(opacity)
  )).toBe(true);
  const styleEvidence = await page.evaluate(() => {
    const api = window as unknown as {
      __kpRealizeFractionTypographyHandoff: (progress: number) => {
        ownership: { visualOwner: string };
        styleFrame: {
          entries: readonly {
            id: string;
            translateX: number;
            translateY: number;
            scaleX: number;
            scaleY: number;
          }[];
        };
        realization: {
          deferred: readonly { disposition: string }[];
        };
      };
      __kpMeasureFractionCorrelatedHandoff: (progress: number) => {
        observations: readonly {
          id: string;
          side: "native-source" | "material" | "native-target";
          paintKind: string;
          baselineY: number | null;
          styleFingerprint: string;
        }[];
      };
    };
    const progresses = [0.96, 0.98, 0.999, 1];
    const sample = (progress: number) => {
      const result = api.__kpRealizeFractionTypographyHandoff(progress);
      return {
        progress,
        visualOwner: result.ownership.visualOwner,
        styleFrame: result.styleFrame,
        deferred: result.realization.deferred
      };
    };
    const forward = progresses.map(sample);
    const reverse = [...progresses].reverse().map(sample).reverse();
    const groups =
      api.__kpMeasureFractionCorrelatedHandoff(0.999).observations.reduce(
        (result, observation) => {
          const id = observation.id.replace(
            /\.(source|material|native)$/,
            ""
          );
          result.set(id, [...(result.get(id) ?? []), observation]);
          return result;
        },
        new Map<string, Array<{
          id: string;
          side: "native-source" | "material" | "native-target";
          paintKind: string;
          baselineY: number | null;
          styleFingerprint: string;
        }>>()
      );
    return {
      forward,
      reverse,
      glyphResiduals: [...groups.values()].flatMap((observations) => {
        const material = observations.find(({ side }) => side === "material")!;
        const native = observations.find(({ side }) =>
          side === "native-target"
        )!;
        if (material.paintKind !== "glyph") return [];
        return [{
          styleMatches:
            material.styleFingerprint === native.styleFingerprint,
          baseline:
            material.baselineY === null || native.baselineY === null
              ? Number.POSITIVE_INFINITY
              : Math.abs(material.baselineY - native.baselineY)
        }];
      })
    };
  });
  expect(styleEvidence.reverse).toEqual(styleEvidence.forward);
  expect(styleEvidence.forward.map(({ visualOwner }) => visualOwner)).toEqual([
    "material-scene",
    "material-scene",
    "material-scene",
    "target-native"
  ]);
  expect(styleEvidence.forward.at(-1)?.styleFrame.entries.every((entry) =>
    entry.translateX === 0 &&
    entry.translateY === 0 &&
    entry.scaleX === 1 &&
    entry.scaleY === 1
  )).toBe(true);
  expect(styleEvidence.forward.slice(0, -1).every(({ deferred }) =>
    deferred.every(({ disposition }) =>
      disposition === "preserve-structural-paint"
    )
  )).toBe(true);
  expect(styleEvidence.glyphResiduals.every((residual) =>
    residual.styleMatches && residual.baseline < 0.1
  )).toBe(true);

  await slider.fill("500");
  await slider.dispatchEvent("input");
  await expect(merged).toHaveAttribute("aria-hidden", "true");
  await expect(split).toHaveAttribute("aria-hidden", "true");
  expect(await sceneOwners.count()).toBeGreaterThan(5);
  await expect(sceneOwners.first()).toHaveAttribute("inert", "");
  await expect(stage).toHaveAttribute(
    "data-kp-fraction-semantic-owner",
    "stage-description"
  );

  await slider.fill("1000");
  await slider.dispatchEvent("input");
  await expect(merged).toHaveAttribute("aria-hidden", "true");
  await expect(split).toHaveAttribute("aria-hidden", "false");
  await expect(targetDenominators).toHaveCount(2);
  await expect(targetDenominators.nth(0)).toHaveAttribute(
    "data-kp-semantic-selector-id",
    "equation.numerator-split-merge.split.left.fraction.denominator.2"
  );
  await expect(targetDenominators.nth(1)).toHaveAttribute(
    "data-kp-semantic-selector-id",
    "equation.numerator-split-merge.split.right.fraction.denominator.2"
  );
  await expect(targetDenominators.nth(0)).toHaveAttribute("tabindex", "0");
  await expect(targetDenominators.nth(1)).toHaveAttribute("tabindex", "0");
  await fraction.locator("[data-fraction-cloze]").click();
  await expect(targetDenominators.nth(0)).toHaveAttribute(
    "data-kp-cloze-hidden",
    "true"
  );
  await expect(targetDenominators.nth(1)).toHaveAttribute(
    "data-kp-cloze-hidden",
    "true"
  );
  expect(await sceneOwners.evaluateAll((elements) =>
    elements.every((element) =>
      !element.hasAttribute("data-kp-semantic-selector-id") &&
      !element.hasAttribute("tabindex") &&
      element.hasAttribute("inert")
    )
  )).toBe(true);

  await slider.fill("0");
  await slider.dispatchEvent("input");
  await expect(merged).toHaveAttribute("aria-hidden", "false");
  await expect(split).toHaveAttribute("aria-hidden", "true");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await review.waitFor();
  await page.locator('[data-reconciliation-case="fraction-split"] [data-progress]')
    .fill("1000");
  await page.locator('[data-reconciliation-case="fraction-split"] [data-progress]')
    .dispatchEvent("input");
  await expect(
    page.locator('[data-reconciliation-case="fraction-split"] [data-fraction-source]')
  ).toHaveAttribute("aria-hidden", "false");
});

test("fraction merge settles one native denominator with Cloze authority", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=1000");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const fraction = page.locator('[data-reconciliation-case="fraction-merge"]');
  const target = fraction.locator(
    '[data-kp-motion-id="motion.fraction.target-denominator"]'
  );
  const sceneOwners = fraction.locator("[data-kp-native-katex-scene-owner]");

  await expect(fraction).toHaveCount(1);
  expect(await sceneOwners.count()).toBeGreaterThan(5);
  await expect(target).toHaveText("2");
  await expect(target).toHaveAttribute(
    "data-kp-semantic-selector-id",
    "equation.numerator-split-merge.combined.fraction.denominator.2"
  );
  await expect(target).toHaveAttribute("tabindex", "0");
  await expect(sceneOwners.first()).toHaveAttribute("aria-hidden", "true");
  expect(await sceneOwners.evaluateAll((elements) =>
    elements.every((element) =>
      !element.hasAttribute("data-kp-semantic-selector-id") &&
      !element.hasAttribute("tabindex") &&
      element.hasAttribute("inert")
    )
  )).toBe(true);

  await fraction.locator("[data-fraction-cloze]").click();
  await expect(target).toHaveAttribute("data-kp-cloze-hidden", "true");
  await expect(target).toHaveClass(/glyph-exemplar__cloze-hidden/);
  await expect(fraction.locator("[data-fraction-cloze]")).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

test("fraction semantic affordances remain native through seek and rewind", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const fraction = page.locator('[data-reconciliation-case="fraction-merge"]');
  const source = fraction.locator("[data-fraction-source]");
  const targetRoot = fraction.locator("[data-fraction-target]");
  const target = fraction.locator(
    '[data-kp-motion-id="motion.fraction.target-denominator"]'
  );
  const stage = fraction.locator("[data-fraction-stage]");
  const slider = fraction.locator("[data-progress]");

  await expect(source).toHaveAttribute("aria-hidden", "false");
  await expect(source).not.toHaveAttribute("inert", "");
  await expect(targetRoot).toHaveAttribute("aria-hidden", "true");
  await expect(targetRoot).toHaveAttribute("inert", "");
  await expect(stage).toHaveAttribute(
    "data-kp-fraction-semantic-owner",
    "source-native"
  );

  await slider.fill("500");
  await slider.dispatchEvent("input");
  await expect(source).toHaveAttribute("aria-hidden", "true");
  await expect(targetRoot).toHaveAttribute("aria-hidden", "true");
  await expect(source).toHaveAttribute("inert", "");
  await expect(targetRoot).toHaveAttribute("inert", "");
  await expect(target).toHaveAttribute("tabindex", "-1");
  await expect(stage).toHaveAttribute(
    "data-kp-fraction-semantic-owner",
    "stage-description"
  );
  await expect(stage).toHaveAttribute("aria-label", /Transforming/);

  await slider.fill("1000");
  await slider.dispatchEvent("input");
  await expect(source).toHaveAttribute("aria-hidden", "true");
  await expect(source).toHaveAttribute("inert", "");
  await expect(targetRoot).toHaveAttribute("aria-hidden", "false");
  await expect(targetRoot).not.toHaveAttribute("inert", "");
  await expect(target).toHaveAttribute("tabindex", "0");
  await target.focus();
  await expect(target).toBeFocused();

  await fraction.locator("[data-fraction-cloze]").click();
  await slider.fill("0");
  await slider.dispatchEvent("input");
  await slider.fill("1000");
  await slider.dispatchEvent("input");
  await expect(target).toHaveClass(/glyph-exemplar__cloze-hidden/);
  await expect(target).toHaveAttribute("data-kp-cloze-hidden", "true");
  await expect(target).toHaveAttribute("tabindex", "0");
});

test("plus-minus split preserves live branch choice through seek and rewind", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=1000");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const branch = page.locator(
    '[data-reconciliation-case="plus-minus-branch"]'
  );
  const minus = branch.locator('[data-kp-branch-id="minus"]');
  const plus = branch.locator('[data-kp-branch-id="plus"]');
  const clones = branch.locator("[data-kp-native-katex-fragment-clone]");
  const slider = page.locator("[data-progress]").first();

  await expect(clones).toHaveCount(2);
  await expect(minus).toHaveAttribute("tabindex", "0");
  await expect(plus).toHaveAttribute("tabindex", "0");
  await expect(minus).toHaveAttribute(
    "data-kp-annotation",
    "Negative quadratic root branch"
  );
  expect(await clones.evaluateAll((elements) =>
    elements.every((element) =>
      element.getAttribute("aria-hidden") === "true" &&
      !element.hasAttribute("data-kp-branch-id")
    )
  )).toBe(true);

  await branch.locator('[data-branch-choice="minus"]').click();
  await expect(branch.locator('[data-branch-choice="minus"]')).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(branch.locator('[data-branch-target="minus"]')).toHaveAttribute(
    "aria-hidden",
    "false"
  );
  await expect(branch.locator('[data-branch-target="plus"]')).toHaveAttribute(
    "aria-hidden",
    "true"
  );

  await slider.fill("0");
  await slider.dispatchEvent("input");
  await slider.fill("1000");
  await slider.dispatchEvent("input");
  await expect(branch.locator('[data-branch-choice="minus"]')).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(branch.locator('[data-branch-target="plus"]')).toHaveAttribute(
    "aria-hidden",
    "true"
  );
  await expect(minus).toHaveAttribute("tabindex", "0");
  await expect(plus).toHaveAttribute("tabindex", "-1");
});

test("crowded quadratic uses the same bounded schedule at wide and phone widths", async ({
  page
}) => {
  for (const viewport of [
    { width: 1440, height: 950 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/glyph-reconciliation-experiment.html?progress=500");
    await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
    const evidence = await page.evaluate(() => {
      const review = document.querySelector<HTMLElement>(
        "[data-kp-glyph-review]"
      )!;
      const caseElement = document.querySelector<HTMLElement>(
        '[data-reconciliation-case="crowded-quadratic"]'
      )!;
      const stage = caseElement.querySelector<HTMLElement>(
        "[data-crowded-stage]"
      )!;
      const stageRect = stage.getBoundingClientRect();
      const protectedInk = caseElement.querySelector<HTMLElement>(
        '[data-kp-motion-id="motion.crowded.source-plus-minus"]'
      )!.getBoundingClientRect();
      const cloneRects = [
        ...caseElement.querySelectorAll<HTMLElement>(
          "[data-kp-native-katex-fragment-clone]"
        )
      ].map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          ariaHidden: element.getAttribute("aria-hidden")
        };
      });
      return {
        routeStatuses: review.dataset["kpCrowdedRouteStatuses"]?.split(","),
        disposition: review.dataset["kpCrowdedDisposition"],
        dispositionReason: review.dataset["kpCrowdedDispositionReason"],
        protectedOpacity: getComputedStyle(
          caseElement.querySelector<HTMLElement>(
            '[data-kp-motion-id="motion.crowded.source-plus-minus"]'
          )!
        ).opacity,
        protectedInk: {
          left: protectedInk.left,
          top: protectedInk.top,
          right: protectedInk.right,
          bottom: protectedInk.bottom
        },
        cloneRects,
        stageRect: {
          left: stageRect.left,
          top: stageRect.top,
          right: stageRect.right,
          bottom: stageRect.bottom
        },
        overflow:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      };
    });

    expect(evidence.routeStatuses).toHaveLength(3);
    expect(evidence.routeStatuses?.every((status) =>
      status === "clearance-route" || status === "settle"
    )).toBe(true);
    expect(evidence.disposition).toBe("checkpoint-settlement");
    expect(evidence.dispositionReason).toBe("blocked-geometry");
    expect(evidence.protectedOpacity).toBe("1");
    expect(evidence.overflow).toBeLessThanOrEqual(1);
    expect(evidence.cloneRects.every((rect) =>
      rect.left >= evidence.stageRect.left - 1 &&
      rect.right <= evidence.stageRect.right + 1 &&
      rect.top >= evidence.stageRect.top - 1 &&
      rect.bottom <= evidence.stageRect.bottom + 1 &&
      rect.ariaHidden === "true"
    ), JSON.stringify({ viewport, evidence })).toBe(true);
  }

  await page.locator("[data-progress]").first().fill("1000");
  await page.locator("[data-progress]").first().dispatchEvent("input");
  await expect(page.locator(
    '[data-reconciliation-case="crowded-quadratic"] ' +
    '[data-kp-motion-id="motion.crowded.target-result"]'
  )).toHaveText("1");
});

test("compound trace depicts every operation and restores its paused parent", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=371");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const trace = page.locator("[data-compound-trace]");
  const slider = page.locator("[data-progress]").first();
  const operations = trace.locator("[data-trace-operation]");

  await expect(operations).toHaveCount(10);
  await trace.locator("[data-trace-inspect]").click();
  await expect(trace).toHaveAttribute("data-trace-mode", "full-detail");
  await expect(trace).toHaveAttribute("data-trace-parent-progress", "0.371");
  await expect(slider).toBeDisabled();
  await expect(trace.locator("[data-trace-detail-operation]")).toHaveCount(10);

  await trace.locator("[data-trace-inspect]").click();
  await expect(trace).toHaveAttribute("data-trace-mode", "compressed");
  await expect(trace).toHaveAttribute("data-trace-restore-exact", "true");
  await expect(slider).toHaveValue("371");
  await expect(slider).toBeEnabled();

  await trace.locator("[data-trace-play]").click();
  await expect(trace).toHaveAttribute("data-trace-completed-cycles", "1", {
    timeout: 4_000
  });
  await expect(trace.locator(
    '[data-trace-operation][data-trace-state="complete"]'
  )).toHaveCount(10);
});

test("compound scene composes native states through one generic material owner", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    "/glyph-reconciliation-experiment.html" +
    "?compoundScene=1&compoundProgress=371"
  );
  const trace = page.locator(
    '[data-compound-trace][data-compound-scene-ready="true"]'
  );
  await trace.waitFor();
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const scrubber = trace.locator("[data-compound-progress]");
  const snapshot = async () => trace.evaluate((element) => {
    const stage = element.querySelector<HTMLElement>(
      "[data-compound-stage]"
    )!;
    const stageRect = stage.getBoundingClientRect();
    const owners = [...stage.querySelectorAll<HTMLElement>(
      "[data-kp-native-katex-scene-owner]"
    )];
    const visibleOwners = owners.filter((owner) =>
      Number(owner.style.opacity) > 0
    );
    const nativeStates = [...stage.querySelectorAll<HTMLElement>(
      "[data-compound-state-id]"
    )];
    return {
      progress: element.getAttribute("data-compound-scene-progress"),
      index: element.getAttribute("data-compound-scene-index"),
      localProgress: element.getAttribute(
        "data-compound-scene-local-progress"
      ),
      visualOwner: element.getAttribute(
        "data-compound-scene-visual-owner"
      ),
      visibleOwnerCount: visibleOwners.length,
      materialOwnersInert: owners.every((owner) =>
        owner.hasAttribute("inert") &&
        owner.getAttribute("aria-hidden") === "true"
      ),
      accessibleNativeStateCount: nativeStates.filter((state) =>
        state.getAttribute("aria-hidden") !== "true"
      ).length,
      stateCount: nativeStates.length,
      contained: visibleOwners.every((owner) => {
        const rect = owner.getBoundingClientRect();
        return rect.left >= stageRect.left - 1 &&
          rect.right <= stageRect.right + 1 &&
          rect.top >= stageRect.top - 1 &&
          rect.bottom <= stageRect.bottom + 1;
      }),
      overflow:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    };
  });

  expect(await snapshot()).toMatchObject({
    progress: "371",
    visualOwner: "material-scene",
    materialOwnersInert: true,
    accessibleNativeStateCount: 0,
    stateCount: 11,
    contained: true,
    overflow: 0
  });
  expect((await snapshot()).visibleOwnerCount).toBeGreaterThan(0);

  await scrubber.fill("437");
  await scrubber.dispatchEvent("input");
  const direct = await snapshot();
  await scrubber.fill("800");
  await scrubber.dispatchEvent("input");
  await scrubber.fill("437");
  await scrubber.dispatchEvent("input");
  expect(await snapshot()).toEqual(direct);

  await trace.locator("[data-trace-inspect]").click();
  await expect(trace).toHaveAttribute("data-trace-parent-progress", "0.437");
  await trace.locator("[data-trace-inspect]").click();
  await expect(trace).toHaveAttribute("data-trace-restore-exact", "true");
  await expect(scrubber).toHaveValue("437");

  await scrubber.fill("1000");
  await scrubber.dispatchEvent("input");
  await trace.locator("[data-trace-play]").click();
  await expect(trace).toHaveAttribute("data-compound-scene-progress", "0", {
    timeout: 4_000
  });
  await expect(trace).toHaveAttribute(
    "data-compound-scene-visual-owner",
    "source-native"
  );
  expect(await snapshot()).toMatchObject({
    visibleOwnerCount: 0,
    accessibleNativeStateCount: 1,
    contained: true,
    overflow: 0
  });
});

test("compound scene reduced motion settles and rewinds without transit", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(
    "/glyph-reconciliation-experiment.html?compoundScene=1&compoundProgress=0"
  );
  const trace = page.locator(
    '[data-compound-trace][data-compound-scene-ready="true"]'
  );
  await trace.waitFor();
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const play = trace.locator("[data-trace-play]");

  await play.click();
  await expect(trace).toHaveAttribute("data-compound-scene-progress", "1000");
  await expect(trace).toHaveAttribute(
    "data-compound-scene-visual-owner",
    "target-native"
  );
  await expect(trace.locator(
    '[data-compound-state-id]:not([aria-hidden="true"])'
  )).toHaveCount(1);
  await expect(trace.locator(
    '[data-kp-native-katex-scene-owner][style*="opacity: 1"]'
  )).toHaveCount(0);

  await play.click();
  await expect(trace).toHaveAttribute("data-compound-scene-progress", "0");
  await expect(trace).toHaveAttribute(
    "data-compound-scene-visual-owner",
    "source-native"
  );
});

test("every equation card exposes synchronized local playback controls", async ({
  page
}) => {
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  const review = page.locator('[data-kp-glyph-review][data-kp-ready="true"]');
  await review.waitFor();
  const cards = page.locator("[data-reconciliation-case]");
  const controls = cards.locator("[data-playback-controls]");
  const sliders = controls.locator("[data-progress]");
  const playButtons = controls.locator("[data-play]");
  const statuses = controls.locator("[data-status]");

  await expect(cards).toHaveCount(4);
  await expect(controls).toHaveCount(4);
  await expect(sliders).toHaveCount(4);
  await expect(playButtons).toHaveCount(4);
  await expect(statuses).toHaveCount(4);

  await sliders.nth(1).fill("500");
  await sliders.nth(1).dispatchEvent("input");
  await expect(review).toHaveAttribute("data-kp-progress", "500");
  for (let index = 0; index < 4; index += 1) {
    await expect(sliders.nth(index)).toHaveValue("500");
    await expect(statuses.nth(index)).toHaveText("50%");
  }

  await playButtons.nth(3).click();
  for (let index = 0; index < 4; index += 1) {
    await expect(sliders.nth(index)).toHaveValue("1000", { timeout: 1_500 });
    await expect(playButtons.nth(index)).toHaveText("Rewind");
  }
});

test("reduced motion uses exact endpoint settlement without transit", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/glyph-reconciliation-experiment.html?progress=0");
  const review = page.locator('[data-kp-glyph-review][data-kp-ready="true"]');
  await review.waitFor();

  await page.locator("[data-play]").first().click();
  await expect(review).toHaveAttribute("data-kp-progress", "1000");
  await expect(review).toHaveAttribute("data-kp-visual-owner", "target-native");
  await expect(page.locator("[data-progress]").first()).toHaveValue("1000");

  const trace = page.locator("[data-compound-trace]");
  await trace.locator("[data-trace-play]").click();
  await expect(trace).toHaveAttribute("data-trace-completed-cycles", "1");
  await expect(trace.locator(
    '[data-trace-operation][data-trace-state="complete"]'
  )).toHaveCount(10);
});

test("phone branch equations remain fully inside their presentation stage", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/glyph-reconciliation-experiment.html?progress=500");
  await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
  const geometry = await page.locator(
    '[data-reconciliation-case="plus-minus-branch"]'
  ).evaluate((caseElement) => {
    const stage = caseElement.querySelector<HTMLElement>(
      "[data-branch-stage]"
    )!.getBoundingClientRect();
    const targets = [
      ...caseElement.querySelectorAll<HTMLElement>("[data-branch-target]")
    ].map((element) => element.getBoundingClientRect());
    return {
      stage: { left: stage.left, right: stage.right },
      targets: targets.map(({ left, right }) => ({ left, right }))
    };
  });

  expect(geometry.targets.every(({ left, right }) =>
    left >= geometry.stage.left - 1 && right <= geometry.stage.right + 1
  ), JSON.stringify(geometry)).toBe(true);
});
