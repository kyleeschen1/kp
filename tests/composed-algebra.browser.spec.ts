import { test, expect } from "@playwright/test";
import source from "../src/authoring/examples/composed-algebra-primary.json" with { type: "json" };

test("compound factoring uses the canonical native compositor with one owner per compound", async ({ page }, info) => {
  test.setTimeout(120_000);
  await page.goto("/experiments/reusable-reasoning/?example=common-factor");
  await expect(page.locator("#authored-focus-card")).toHaveAttribute("data-common-factor-status", "ready", { timeout: 90_000 });
  // Exercise the production mount, not a test renderer or a hand-assembled plan.
  // The opt-in canary leaves the M1a review host untouched during discovery.
  const roles = await page.evaluate(async value => {
    const proofPath = "/src/authoring/composed-algebra-proof.ts", presentationPath = "/src/authoring/composed-algebra-presentation.ts",
      mountPath = "/src/experiments/common-factor/native.ts";
    const proof = await import(/* @vite-ignore */ proofPath) as typeof import("../src/authoring/composed-algebra-proof.ts");
    const bindings = await import(/* @vite-ignore */ presentationPath) as typeof import("../src/authoring/composed-algebra-presentation.ts");
    const mounts = await import(/* @vite-ignore */ mountPath) as typeof import("../src/experiments/common-factor/native.ts");
    const binding = bindings.resolveKpComposedAlgebraPresentation(proof.checkKpComposedAlgebraProof(value));
    const scaffoldPath = "/src/tutorial/focus-deck-scaffold.ts";
    const { renderKpFocusDeckScaffold } = await import(/* @vite-ignore */ scaffoldPath) as typeof import("../src/tutorial/focus-deck-scaffold.ts");
    const wrapper = document.createElement("section");
    wrapper.innerHTML = renderKpFocusDeckScaffold({ id: "composed-canary", ariaLabel: "Compound factoring", activeBeatSlug: "start",
      beats: [{ slug: "start", title: "Two multiples", html: "<p>Factor the shared compound.</p>" }, { slug: "end", title: "One compound", html: "<p>The whole factor persists.</p>" }],
      stageHtml: '<div class="kp-focus-deck__stage" data-distribution-stage></div>',
      rootAttributes: { "data-kp-reasoning-card": true } });
    document.querySelector("#authored-focus-card")!.append(wrapper);
    const card = wrapper.firstElementChild as HTMLElement; card.id = "composed-canary";
    const surface = await mounts.mountCanonicalComposedAlgebraOperation(card, binding, 0);
    const slider = card.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
    slider.max = "1"; slider.step = "any";
    slider.addEventListener("input", () => { surface.clock.seek(Number(slider.value)); surface.render(false); });
    surface.render(false);
    window.addEventListener("pagehide", () => surface.dispose(), { once: true });
    return binding.steps[0].plan.factoringMotifBinding;
  }, source);
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
