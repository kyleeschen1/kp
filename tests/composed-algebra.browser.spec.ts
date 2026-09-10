import { test, expect } from "@playwright/test";
import source from "../src/authoring/examples/composed-algebra-primary.json" with { type: "json" };
import { kpEquationSettlementTolerancePx } from "../src/animation/equation-shared-presentation-policy.ts";

async function mountCanary(page: import("@playwright/test").Page, step: 0 | 1 | "chain") {
  await page.goto("/experiments/reusable-reasoning/?example=common-factor");
  await expect(page.locator("#authored-focus-card")).toHaveAttribute("data-common-factor-status", "ready", { timeout: 90_000 });
  // Exercise the production mount, not a test renderer or a hand-assembled plan.
  // The opt-in canary leaves the M1a review host untouched during discovery.
  return page.evaluate(async ({ value, step }) => {
    const path = "/tests/browser-helpers/composed-algebra-canary.ts";
    const { mountComposedAlgebraCanary } = await import(/* @vite-ignore */ path) as typeof import("./browser-helpers/composed-algebra-canary.ts");
    return mountComposedAlgebraCanary(value, step);
  }, { value: source, step });
}

test("compound factoring uses the canonical native compositor with one owner per compound", async ({ page }, info) => {
  test.setTimeout(120_000);
  const roles = await mountCanary(page, 0);
  const card = page.locator("#composed-canary");
  const poses = new Map<number, unknown>();
  for (const p of [0, .01, .18, .37, .68, .99, 1, .99, .37, .01, 0]) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, value) => {
      (node as HTMLInputElement).value = String(value); node.dispatchEvent(new Event("input"));
    }, p);
    await expect(card).toHaveAttribute("data-common-factor-progress", String(p));
    if (p > 0 && p < 1) {
      const groups = card.locator('[data-kp-equation-material-fragment-role^="group:factoring-"]');
      await expect(groups).toHaveCount(3);
      const pose = await groups.evaluateAll(nodes => nodes.map(node => ({
        id: node.getAttribute("data-kp-equation-material-semantic-entity-id"), text: node.textContent,
        opacity: getComputedStyle(node).opacity, transform: (node as HTMLElement).style.transform,
        x: node.getBoundingClientRect().x, y: node.getBoundingClientRect().y
      })));
      for (const owner of pose) expect(owner.text?.replaceAll(/\s/g, "")).toBe("(x+3)");
      if (poses.has(p)) expect(pose).toEqual(poses.get(p)); else poses.set(p, pose);
    }
    await card.screenshot({ path: info.outputPath(`compound-${p}.png`) });
  }
  async function ink(progress: number, entityIds: readonly string[]) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, p) => {
      (node as HTMLInputElement).value = String(p); node.dispatchEvent(new Event("input"));
    }, progress);
    return card.evaluate(async (root, ids) => {
      const path = "/src/rendering/native-katex-paint-geometry.ts";
      const { measureKpNativeKatexSubtreePaintRect } = await import(/* @vite-ignore */ path) as typeof import("../src/rendering/native-katex-paint-geometry.ts");
      const stage = root.querySelector<HTMLElement>("[data-kp-reader-fit-surface]")!;
      const opacity = (node: HTMLElement) => {
        let value = 1;
        for (let parent: HTMLElement | null = node; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          if (style.visibility === "hidden" || style.display === "none") return 0;
          value *= Number(style.opacity); if (parent === root) break;
        }
        return value;
      };
      return ids.map(id => {
        const native = [...stage.querySelectorAll<HTMLElement>(`[data-kp-reader-native] [data-kp-semantic-entity-id="${id}"]`)];
        const material = [...stage.querySelectorAll<HTMLElement>(`[data-kp-equation-material-semantic-entity-id="${id}"]`)].map(owner => owner.firstElementChild as HTMLElement);
        const visible = [...native, ...material].filter(node => opacity(node) > .99);
        return { id, count: visible.length, rect: visible[0] ? measureKpNativeKatexSubtreePaintRect(stage, visible[0]) : undefined };
      });
    }, entityIds);
  }
  for (const [native, material, ids] of [[0, .000001, roles.factorCopyIds], [1, .999999, [roles.commonFactorId]]] as const) {
    const before = await ink(native, ids), after = await ink(material, ids);
    before.forEach((item, index) => {
      expect(item.count).toBe(1); expect(after[index]!.count).toBe(1);
      expect(item.rect).toBeDefined(); expect(after[index]!.rect).toBeDefined();
      for (const key of ["left", "top", "width", "height"] as const)
        expect(Math.abs(item.rect![key] - after[index]!.rect![key]), `${item.id} ${key}`).toBeLessThan(.1);
    });
  }
});

test("contextual sum uses certified ink-glyph evaluation while compound context persists", async ({ page }, info) => {
  await mountCanary(page, 1);
  const card = page.locator("#composed-canary"), stage = card.locator("[data-kp-reader-fit-surface]");
  const poses = new Map<number, unknown>();
  let contextShape: readonly { x: number; y: number; width: number; height: number }[] | undefined;
  for (const p of [0, .01, .25, .5, .75, .99, 1, .75, .5, .01, 0]) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, value) => {
      (node as HTMLInputElement).value = String(value); node.dispatchEvent(new Event("input"));
    }, p);
    await expect(card).toHaveAttribute("data-common-factor-progress", String(p));
    if (p > 0 && p < 1) {
      await expect(stage).toHaveAttribute("data-kp-operation-evaluation-family", "contributor-fusion");
      const context = stage.locator('[data-kp-equation-material-semantic-entity-id$=".paint.factor"]');
      const pose = await context.evaluateAll(async nodes => {
        const path = "/src/rendering/native-katex-paint-geometry.ts";
        const { measureKpNativeKatexSubtreePaintRect } = await import(/* @vite-ignore */ path) as typeof import("../src/rendering/native-katex-paint-geometry.ts");
        return nodes.map(node => {
          const stage = node.closest<HTMLElement>("[data-kp-reader-fit-surface]")!;
          const rect = measureKpNativeKatexSubtreePaintRect(stage, node.firstElementChild as HTMLElement);
          if (!rect) throw new Error("Missing unchanged-context ink.");
          return { text: node.textContent, opacity: getComputedStyle(node).opacity, rect };
        }).sort((a, b) => a.rect.left - b.rect.left);
      });
      expect(pose.length).toBeGreaterThan(0);
      expect(pose.map(p => p.text).join("").replaceAll(/\s/g, "")).toBe("(x+3)");
      expect(pose.every(item => item.opacity === "1")).toBe(true);
      const shape = pose.map(item => ({ x: item.rect.left - pose[0]!.rect.left, y: item.rect.top - pose[0]!.rect.top,
        width: item.rect.width, height: item.rect.height }));
      if (contextShape) shape.forEach((item, i) => {
        for (const key of ["x", "y", "width", "height"] as const) expect(Math.abs(item[key] - contextShape![i]![key])).toBeLessThan(.1);
      }); else contextShape = shape;
      if (poses.has(p)) expect(pose).toEqual(poses.get(p)); else poses.set(p, pose);
    }
    await card.screenshot({ path: info.outputPath(`evaluation-${p}.png`) });
  }
});

test("one canonical chain retains native geometry across the shared checkpoint and direct reverse", async ({ page }, info) => {
  await mountCanary(page, "chain");
  const card = page.locator("#composed-canary");
  await expect(card.locator("[data-kp-canonical-equation-host]")).toHaveCount(1);
  await expect(card.locator("[data-kp-reader-transition]")).toHaveCount(2);
  const samples = new Map<number, Awaited<ReturnType<typeof capture>>>();
  async function capture(position: number) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, value) => {
      (node as HTMLInputElement).value = String(value); node.dispatchEvent(new Event("input"));
    }, position);
    await expect.poll(async () => Number(await card.getAttribute("data-composed-step"))).toBeCloseTo(position, 8);
    const active = card.locator('[data-kp-reader-transition-active="true"]');
    await expect(active).toHaveCount(1);
    return active.evaluate(async root => {
      const path = "/src/rendering/native-katex-paint-geometry.ts";
      const { measureKpNativeKatexPaintAtomRect } = await import(/* @vite-ignore */ path) as typeof import("../src/rendering/native-katex-paint-geometry.ts");
      const scenePath = "/src/rendering/native-katex-rendered-scene.ts";
      const { observeKpNativeKatexPaintAtoms } = await import(/* @vite-ignore */ scenePath) as typeof import("../src/rendering/native-katex-rendered-scene.ts");
      const stage = root.querySelector<HTMLElement>("[data-kp-reader-fit-surface]")!;
      const visible = observeKpNativeKatexPaintAtoms({ stage, root: stage, endpoint: "source", semanticEntityId: "canary", presentationGroupId: "canary", fontRevision: 0 }).filter(atom => {
        let opacity = 1;
        for (let parent: HTMLElement | null = atom.sourceElement; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          if (style.visibility === "hidden" || style.display === "none") return false;
          opacity *= Number(style.opacity); if (parent === root) break;
        }
        return opacity > .99;
      });
      const rects = visible.map(atom => measureKpNativeKatexPaintAtomRect(stage, atom));
      const left = Math.min(...rects.map(rect => rect.left)), top = Math.min(...rects.map(rect => rect.top));
      return { text: visible.map(atom => atom.sourceElement.textContent).sort(), atoms: visible.map((atom, i) => ({ text: atom.sourceElement.textContent, rect: rects[i] })), left, top,
        width: Math.max(...rects.map(rect => rect.left + rect.width)) - left,
        height: Math.max(...rects.map(rect => rect.top + rect.height)) - top };
    });
  }
  for (const p of [0, .37, .999999, 1, 1.000001, 1.5, 2, 1.000001, 1, .999999, 0]) {
    const sample = await capture(p);
    if (samples.has(p)) {
      expect(sample.text).toEqual(samples.get(p)!.text);
      for (const key of ["left", "top", "width", "height"] as const) expect(Math.abs(sample[key] - samples.get(p)![key])).toBeLessThan(.001);
    } else samples.set(p, sample);
    await card.screenshot({ path: info.outputPath(`chain-${p}.png`) });
  }
  for (const p of [.999999, 1.000001]) for (const key of ["left", "top", "width", "height"] as const)
    expect(Math.abs(samples.get(p)![key] - samples.get(1)![key]), JSON.stringify({ checkpoint: p, key, before: samples.get(p), after: samples.get(1) })).toBeLessThan(kpEquationSettlementTolerancePx);
  // Exact stops have one native owner, never native plus re-exposed ink material.
  expect(samples.get(1)!.text).toHaveLength(10);
  expect(samples.get(2)!.text).toHaveLength(6);
});
