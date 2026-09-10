import { test, expect } from "@playwright/test";
import source from "../src/authoring/examples/composed-algebra-primary.json" with { type: "json" };
import product from "../src/authoring/examples/composed-algebra-product.json" with { type: "json" };
import { kpEquationSettlementTolerancePx } from "../src/animation/equation-shared-presentation-policy.ts";
import { buildComposedAlgebraEdition } from "../scripts/build-composed-algebra-edition.ts";
import { fileURLToPath } from "node:url";

for (const width of [1280, 390]) test(`primary combined review at ${width}px`, async ({ page }, info) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/experiments/reusable-reasoning/?example=composed-algebra");
  const root = page.locator("#authored-focus-card");
  await expect(root).toHaveAttribute("data-composed-status", "ready", { timeout: 90_000 });
  const card = root.locator("[data-composed-reader] [data-composed-card]");
  for (const position of [0, .37, 1, 1.5, 2]) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, p) => {
      (node as HTMLInputElement).value = String(p); node.dispatchEvent(new Event("input"));
    }, position);
    await expect(card).toHaveAttribute("data-composed-step", String(position));
    const bounds = await card.evaluate(node => {
      const header = node.querySelector(".kp-focus-deck__header")!.getBoundingClientRect();
      const passage = node.querySelector("[data-kp-focus-deck-viewport]")!.getBoundingClientRect();
      return { headerBottom: header.bottom, passageTop: passage.top,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    expect(bounds.passageTop).toBeGreaterThanOrEqual(bounds.headerBottom);
    expect(bounds.overflow).toBeLessThanOrEqual(1);
    await card.screenshot({ path: info.outputPath(`card-${position}.png`) });
  }
  await root.locator("[data-composed-reading]").selectOption("compact");
  await page.screenshot({ path: info.outputPath("compact-page.png"), fullPage: true });
  await root.locator('[data-composed-practice="prediction"]').click();
  await page.screenshot({ path: info.outputPath("practice.png"), fullPage: true });
  await root.locator("[data-composed-return]").click();
  const edition = buildComposedAlgebraEdition(fileURLToPath(new URL("../src/authoring/examples/composed-algebra-primary.json", import.meta.url)));
  const response = await page.goto(`/tmp/codex/composed-algebra-editions/${edition.directory.split("/").at(-1)}/index.html`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("[data-composed-publication-revision]")).toHaveAttribute("data-composed-publication-revision", edition.revisionId);
  await expect(page.locator("math")).toHaveCount(8); await expect(page.locator("[data-kp-focus-deck-scrubber]")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("static-edition.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("readings and practice share the displayed revision and return to exact chain position", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/experiments/reusable-reasoning/?example=composed-algebra");
  const root = page.locator("#authored-focus-card");
  await expect(root).toHaveAttribute("data-composed-status", "ready", { timeout: 90_000 });
  const card = root.locator("[data-composed-reader] [data-composed-card]"), reading = root.locator("[data-composed-reading-output]");
  const revision = await root.getAttribute("data-composed-revision");
  await expect(reading).toHaveAttribute("data-revision", revision!);
  for (const mode of ["compact", "full"]) {
    await root.locator("[data-composed-reading]").selectOption(mode);
    await expect(reading.locator("math")).toHaveCount(3);
    await expect(reading).toContainText("may be zero");
  }
  await card.locator("[data-kp-focus-deck-scrubber]").evaluate(node => {
    (node as HTMLInputElement).value = "1.37"; node.dispatchEvent(new Event("input"));
  });
  const progress = await card.getAttribute("data-common-factor-progress");
  for (const kind of ["prediction", "reconstruction"]) {
    const origin = root.locator(`[data-composed-practice="${kind}"]`);
    await origin.click();
    await expect(root.locator("[data-composed-practice-panel]")).toBeVisible();
    await expect(reading).toBeHidden(); await expect(root.locator("[data-reasoning-editor]")).toBeHidden();
    await expect(root.locator("[data-composed-answer]")).toBeHidden();
    await expect(card.locator("[data-kp-focus-deck-viewport]")).toContainText(kind === "prediction" ? "unevaluated sum" : "Reconstruct both steps");
    await root.locator("[data-composed-reveal]").click();
    await expect(root.locator("[data-composed-answer]")).toContainText(kind === "prediction" ? source.states[1]!.latex : source.states[2]!.latex);
    await expect(card).toHaveAttribute("data-common-factor-state", source.states[kind === "prediction" ? 1 : 2]!.id, { timeout: 10_000 });
    await root.locator("[data-composed-return]").click();
    await expect(card).toHaveAttribute("data-common-factor-progress", progress!);
    await expect(card).toHaveAttribute("data-composed-step", "1.37");
    await expect(origin).toBeFocused(); await expect(reading).toBeVisible();
    await expect(root).toHaveAttribute("data-composed-revision", revision!);
  }
  await root.locator("[data-reasoning-editor] summary").click();
  const edited = structuredClone(source); edited.editorial.summary = "Updated editorial summary for the same verified chain.";
  await root.locator("[data-reasoning-json]").fill(JSON.stringify(edited)); await root.locator("[data-composed-apply]").click();
  await expect(root.locator("[data-reasoning-draft-status]")).toHaveAttribute("data-status", "applied", { timeout: 90_000 });
  const next = await root.getAttribute("data-composed-revision"); expect(next).not.toBe(revision);
  await expect(reading).toHaveAttribute("data-revision", next!); await expect(reading).toContainText(edited.editorial.summary);
});

test("three-stop controls animate adjacent operations and reverse gestures without independent prose travel", async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/experiments/reusable-reasoning/?example=composed-algebra");
  await expect(page.locator("#authored-focus-card")).toHaveAttribute("data-composed-status", "ready", { timeout: 90_000 });
  const card = page.locator("[data-composed-reader] [data-composed-card]"), slider = card.locator("[data-kp-focus-deck-scrubber]");
  await expect(slider).toHaveAttribute("max", "2");
  await expect(card.locator("[data-kp-focus-deck-beat]")).toHaveCount(3);
  const position = async () => Number(await card.getAttribute("data-composed-step"));
  for (const step of [1, 2]) {
    await card.locator("[data-kp-focus-deck-next]").click();
    await expect.poll(position).toBeGreaterThan(step - 1); expect(await position()).toBeLessThan(step);
    await expect(card).toHaveAttribute("data-composed-step", String(step), { timeout: 10_000 });
    await expect(card.locator("[data-composed-count]")).toHaveText(`${step + 1} / 3`);
    await expect(card.locator('[data-kp-focus-deck-beat][aria-current="page"]')).toHaveAttribute("data-kp-focus-deck-beat", source.states[step]!.id);
  }
  await slider.focus(); await page.keyboard.press("ArrowLeft");
  await expect.poll(position).toBeLessThan(2); expect(await position()).toBeGreaterThan(1);
  await expect(card).toHaveAttribute("data-composed-step", "1", { timeout: 10_000 });
  await card.locator("[data-distribution-stage]").hover();
  await page.mouse.wheel(-420, 0);
  await expect(card).toHaveAttribute("data-composed-step", "0", { timeout: 10_000 });
  await page.mouse.wheel(420, 0);
  await expect(card).toHaveAttribute("data-composed-step", "1", { timeout: 10_000 });
  await page.mouse.wheel(-420, 0);
  await expect(card).toHaveAttribute("data-composed-step", "0", { timeout: 10_000 });
  // The fraction/prose are sampled in the same clock callback, not after settling.
  const immediate = await slider.evaluate(node => {
    (node as HTMLInputElement).value = "1.6"; node.dispatchEvent(new Event("input"));
    const root = node.closest("[data-composed-card]")!;
    return { count: root.querySelector("[data-composed-count]")!.textContent,
      active: root.querySelector('[aria-current="page"]')!.getAttribute("data-kp-focus-deck-beat") };
  });
  expect(immediate).toEqual({ count: "3 / 3", active: source.states[2]!.id });
  await slider.dispatchEvent("change"); await expect(card).toHaveAttribute("data-composed-step", "2", { timeout: 10_000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await card.locator("[data-kp-focus-deck-previous]").click();
  await expect(card).toHaveAttribute("data-composed-step", "1");
  await expect(card.locator("[data-composed-count]")).toHaveText("2 / 3");
});

test("composed authoring applies one coherent prepared revision and preserves it on repair gaps", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/experiments/reusable-reasoning/?example=composed-algebra");
  const root = page.locator("#authored-focus-card"), card = root.locator("[data-composed-reader] [data-composed-card]");
  await expect(root).toHaveAttribute("data-composed-status", "ready", { timeout: 90_000 });
  const first = await root.getAttribute("data-composed-revision");
  await root.locator("summary").click();
  const editor = root.locator("[data-reasoning-json]"), status = root.locator("[data-reasoning-draft-status]");
  const edited = structuredClone(source); edited.editorial.title = "Count a revised shared unit";
  edited.states[0]!.latex = "2(x+4)+3(x+4)"; edited.states[1]!.latex = "(2+3)(x+4)"; edited.states[2]!.latex = "5(x+4)";
  await editor.fill(JSON.stringify(edited));
  await expect(root).toHaveAttribute("data-composed-revision", first!);
  await root.locator("[data-composed-apply]").click();
  await expect(status).toHaveAttribute("data-status", "applied", { timeout: 90_000 });
  await expect(root.locator("[data-composed-title]")).toHaveText(edited.editorial.title);
  const revision = await root.getAttribute("data-composed-revision"); expect(revision).not.toBe(first);
  await expect(root.locator("[data-reasoning-revision]")).toHaveText(revision!);
  await expect(card).toHaveAttribute("data-canonical-presentation-revision", revision!);
  await expect(page.locator(".common-factor-staging")).toHaveCount(0);
  await card.locator("[data-kp-focus-deck-scrubber]").evaluate(node => {
    (node as HTMLInputElement).value = "1"; node.dispatchEvent(new Event("input"));
  });
  await expect(card).toHaveAttribute("data-composed-step", "1");
  await expect(card.locator("[data-composed-count]")).toHaveText("2 / 3");
  await editor.fill("{}"); await root.locator("[data-composed-apply]").click();
  await expect(status).toHaveAttribute("data-status", "repair-gap");
  await expect(root).toHaveAttribute("data-composed-revision", revision!);
  await expect(card).toHaveAttribute("data-composed-step", "1");
  const downloaded = page.waitForEvent("download"); await root.locator("[data-composed-download]").click();
  const stream = await (await downloaded).createReadStream();
  let json = ""; for await (const chunk of stream!) json += chunk.toString();
  expect(JSON.parse(json)).toEqual(edited);
});

async function mountCanary(page: import("@playwright/test").Page, step: 0 | 1 | "chain", value = source) {
  await page.goto("/experiments/reusable-reasoning/?example=common-factor");
  await expect(page.locator("#authored-focus-card")).toHaveAttribute("data-common-factor-status", /^(ready|repair-gap)$/, { timeout: 90_000 });
  expect((await page.locator("#authored-focus-card [role=alert]").allTextContents()).filter(Boolean)).toEqual([]);
  await expect(page.locator("#authored-focus-card")).toHaveAttribute("data-common-factor-status", "ready", { timeout: 90_000 });
  // Exercise the production mount, not a test renderer or a hand-assembled plan.
  // The opt-in canary leaves the M1a review host untouched during discovery.
  return page.evaluate(async ({ value, step }) => {
    const path = "/tests/browser-helpers/composed-algebra-canary.ts";
    const { mountComposedAlgebraCanary } = await import(/* @vite-ignore */ path) as typeof import("./browser-helpers/composed-algebra-canary.ts");
    return mountComposedAlgebraCanary(value, step);
  }, { value, step });
}

test("source-only product caller traverses both canonical operations and reverses without glue", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await mountCanary(page, "chain", product);
  const card = page.locator("#composed-canary");
  const poses = new Map<number, { text: string | null; opacity: string; transform: string;
    rect: { x: number; y: number; width: number; height: number } }[]>();
  for (const position of [0, .37, .68, .99, 1, 1.5, 2, 1.5, .68, .37, 1, 0]) {
    await card.locator("[data-kp-focus-deck-scrubber]").evaluate((node, p) => {
      (node as HTMLInputElement).value = String(p); node.dispatchEvent(new Event("input"));
    }, position);
    await expect.poll(async () => Number(await card.getAttribute("data-composed-step"))).toBeCloseTo(position, 8);
    const active = card.locator('[data-kp-reader-transition-active="true"]');
    await expect(active).toHaveCount(1);
    const pose = await active.locator('[data-kp-equation-material-fragment-role^="group:factoring-"]').evaluateAll(nodes =>
      nodes.map(node => {
        const rect = node.getBoundingClientRect(), stage = node.closest('[data-kp-reader-fit-surface]')!.getBoundingClientRect();
        // Screenshots may scroll the document; ownership geometry is stage-local.
        return { text: node.textContent, opacity: getComputedStyle(node).opacity,
          transform: (node as HTMLElement).style.transform,
          rect: { x: rect.x - stage.x, y: rect.y - stage.y, width: rect.width, height: rect.height } };
      }));
    if (position > 0 && position < 1) {
      expect(pose).toHaveLength(3);
      expect(pose.every(owner => owner.text?.includes("x") && owner.text.includes("y"))).toBe(true);
    }
    const previous = poses.get(position);
    if (previous) {
      expect(pose).toHaveLength(previous.length);
      pose.forEach((owner, index) => {
        const before = previous[index]!;
        expect([owner.text, owner.opacity, owner.transform]).toEqual([before.text, before.opacity, before.transform]);
        for (const key of ["x", "y", "width", "height"] as const)
          expect(Math.abs(owner.rect[key] - before.rect[key])).toBeLessThan(.001);
      });
    } else poses.set(position, pose);
    await card.screenshot({ path: info.outputPath(`product-${position}.png`) });
  }
  expect(errors).toEqual([]);
});

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

test("factoring occupancy cannot disappear with ownership partitioning", async ({ page }) => {
  await mountCanary(page, 0);
  const result = await page.evaluate(async value => {
    const path = "/tests/browser-helpers/composed-algebra-canary.ts";
    const { probeOmittedFactoringOccupancy } = await import(/* @vite-ignore */ path) as typeof import("./browser-helpers/composed-algebra-canary.ts");
    return probeOmittedFactoringOccupancy(value);
  }, source);
  expect(result.isolatedIntersections).toBe(0);
  expect(result.combinedIntersections).toBeGreaterThan(0);
  expect(result.uninspectedPublicationRejected).toBe(true);
  expect(result.after).toEqual(result.before); // Inspection may not rewrite the motif.
  expect(result.handoff[0]).toHaveLength(2); expect(result.handoff[1]).toHaveLength(1);
  const received = result.handoff[1]![0]!;
  for (const contributor of result.handoff[0]!) {
    expect(contributor.focus).toEqual(received.focus);
    for (const key of ["left", "top", "width", "height"] as const)
      expect(Math.abs(contributor.rect![key] - received.rect![key])).toBeLessThan(.1);
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
  // Revisit interior frames after crossing both ownership and operation boundaries.
  // A stable outer rectangle alone can conceal displaced or duplicated inner ink.
  for (const p of [0, .37, .68, .9, .999999, 1, 1.000001, 1.25, 1.5, 2,
    .68, 1.25, .37, 1.5, .9, 1.000001, 1, .999999, 0]) {
    const sample = await capture(p);
    if (samples.has(p)) {
      expect(sample.text).toEqual(samples.get(p)!.text);
      for (const key of ["left", "top", "width", "height"] as const) expect(Math.abs(sample[key] - samples.get(p)![key])).toBeLessThan(.001);
      const previous = samples.get(p)!.atoms;
      expect(sample.atoms).toHaveLength(previous.length);
      sample.atoms.forEach((atom, index) => {
        expect(atom.text).toBe(previous[index]!.text);
        const beforeRect = previous[index]!.rect;
        if (!atom.rect || !beforeRect) throw new Error("Replay requires measured ink for every visible atom.");
        for (const key of ["left", "top", "width", "height"] as const)
          expect(Math.abs(atom.rect[key] - beforeRect[key]), `replay ${p} atom ${index} ${key}`).toBeLessThan(.001);
      });
    } else samples.set(p, sample);
    await card.screenshot({ path: info.outputPath(`chain-${p}.png`) });
  }
  for (const p of [.999999, 1.000001]) for (const key of ["left", "top", "width", "height"] as const)
    expect(Math.abs(samples.get(p)![key] - samples.get(1)![key]), JSON.stringify({ checkpoint: p, key, before: samples.get(p), after: samples.get(1) })).toBeLessThan(kpEquationSettlementTolerancePx);
  // Exact stops have one native owner, never native plus re-exposed ink material.
  expect(samples.get(1)!.text).toHaveLength(10);
  expect(samples.get(2)!.text).toHaveLength(6);
});
