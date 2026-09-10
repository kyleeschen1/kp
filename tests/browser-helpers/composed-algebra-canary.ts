import { checkKpComposedAlgebraProof } from "../../src/authoring/composed-algebra-proof.ts";
import { resolveKpComposedAlgebraPresentation } from "../../src/authoring/composed-algebra-presentation.ts";
import { mountCanonicalComposedAlgebraOperation, mountCanonicalComposedAlgebraPresentation } from "../../src/experiments/common-factor/native.ts";
import { renderKpFocusDeckScaffold } from "../../src/tutorial/focus-deck-scaffold.ts";

/** Static imports keep verifier and consumer in one Vite module revision.
 * Importing each authority URL independently can fork its private mint on HMR. */
export async function mountComposedAlgebraCanary(value: unknown, step: 0 | 1 | "chain") {
  const binding = resolveKpComposedAlgebraPresentation(checkKpComposedAlgebraProof(value));
  const wrapper = document.createElement("section");
  wrapper.innerHTML = renderKpFocusDeckScaffold({ id: "composed-canary", ariaLabel: "Composed algebra", activeBeatSlug: "start",
    beats: [{ slug: "start", title: "Before", html: "<p>Follow one verified deduction.</p>" }, { slug: "end", title: "After", html: "<p>The whole factor persists.</p>" }],
    stageHtml: '<div class="kp-focus-deck__stage" data-distribution-stage></div>', rootAttributes: { "data-kp-reasoning-card": true } });
  document.querySelector("#authored-focus-card")!.append(wrapper);
  const card = wrapper.firstElementChild as HTMLElement; card.id = "composed-canary";
  const surface = await (step === "chain" ? mountCanonicalComposedAlgebraPresentation(card, binding) : mountCanonicalComposedAlgebraOperation(card, binding, step));
  const slider = card.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
  slider.max = String(surface.checkpoints.last); slider.step = "any";
  slider.addEventListener("input", () => { surface.clock.seek(surface.checkpoints.progressAt(Number(slider.value))); surface.render(false);
    card.dataset["composedStep"] = String(surface.checkpoints.positionAt(surface.clock.getSnapshot().progress)); });
  surface.render(false);
  window.addEventListener("pagehide", () => surface.dispose(), { once: true });
  return binding.steps[0].plan.factoringMotifBinding;
}
