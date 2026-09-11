import type { KpComposedAlgebraPresentationV2 } from "../../authoring/composed-algebra-presentation-v2.ts";
import type { KpComposedAlgebraSubexplanation } from "../composed-algebra/subexplanations.ts";
import type { mountComposedAlgebraCardV2 } from "../composed-algebra/card.ts";
import { projectComposedAlgebraPromptsV2, captureComposedAlgebraPositionV2, resolveComposedAlgebraPositionV2 } from "../composed-algebra/practice.ts";

export const algebraIntuitionPracticeButtons = '<button type="button" data-composed-practice="prediction">Predict</button><button type="button" data-composed-practice="reconstruction">Reconstruct</button>';
export const algebraIntuitionPracticePanel = `<section data-composed-practice-panel hidden aria-label="Algebra self-check"><h2 data-composed-prompt-title></h2><p data-composed-prompt></p>
  <p>All symbols are real scalars. Preserve product and addend order.</p><label>Your working (self-check, not automatic grading)<textarea data-composed-working rows="3"></textarea></label>
  <div class="reasoning-toolbar"><button type="button" data-composed-reveal>Compare with the verified answer</button><button type="button" data-composed-return>Return to reading</button></div><p data-composed-answer hidden></p></section>`;

type Surface = Awaited<ReturnType<typeof mountComposedAlgebraCardV2>>;
type SavedVisibility = [HTMLElement, HTMLElement["hidden"]];
export function bindAlgebraIntuitionPractice(root: HTMLElement, current: () => {
  draft: KpComposedAlgebraPresentationV2; surface: Surface; reference: KpComposedAlgebraSubexplanation | undefined;
}, invalidate: () => void) {
  const panel = root.querySelector<HTMLElement>("[data-composed-practice-panel]")!, answer = panel.querySelector<HTMLElement>("[data-composed-answer]")!;
  let active: { draft: KpComposedAlgebraPresentationV2; surface: Surface; position: ReturnType<typeof captureComposedAlgebraPositionV2>;
    prompt: ReturnType<typeof projectComposedAlgebraPromptsV2>[number]; hidden: SavedVisibility[]; origin: HTMLElement; scrollY: number } | undefined;
  function close() {
    if (!active) return;
    const saved = active; active = undefined; panel.hidden = true;
    saved.hidden.forEach(([element, hidden]) => { element.hidden = hidden; });
    saved.surface.practice(); saved.surface.clock.seek(resolveComposedAlgebraPositionV2(saved.draft, saved.position));
    saved.origin.focus({ preventScroll: true }); window.scrollTo({ top: saved.scrollY, behavior: "instant" });
  }
  function click(event: MouseEvent) {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLElement>("[data-composed-practice]");
    if (!button || !root.contains(button)) return;
    close(); invalidate();
    const { draft, surface, reference } = current();
    const prompt = projectComposedAlgebraPromptsV2(draft, reference).find(item => item.kind === button.dataset["composedPractice"]);
    if (!prompt) throw new Error("Unknown practice mode.");
    surface.cancel(); surface.clock.pause();
    const hidden: SavedVisibility[] = [...root.querySelectorAll<HTMLElement>("[data-composed-reading-output], [data-composed-reading-toolbar], [data-composed-subexplanations], [data-composed-summary], [data-composed-setup], [data-reasoning-editor], [data-composed-intuition-answer], [data-composed-intuition-return], [data-composed-intuition-practice]")].map(element => [element, element.hidden]);
    active = { draft, surface, prompt, hidden, origin: button, scrollY: window.scrollY, position: captureComposedAlgebraPositionV2(draft, surface.clock.getSnapshot().progress) };
    hidden.forEach(([element]) => { element.hidden = true; }); panel.hidden = false;
    panel.querySelector<HTMLElement>("[data-composed-prompt-title]")!.textContent = prompt.card.title;
    panel.querySelector<HTMLElement>("[data-composed-prompt]")!.textContent = prompt.card.prompt;
    const working = panel.querySelector<HTMLTextAreaElement>("[data-composed-working]")!; working.value = "";
    answer.hidden = true; answer.textContent = ""; surface.practice(prompt.card.prompt); working.focus();
  }
  root.addEventListener("click", click);
  const reveal = panel.querySelector<HTMLButtonElement>("[data-composed-reveal]")!, back = panel.querySelector<HTMLButtonElement>("[data-composed-return]")!;
  reveal.onclick = () => { if (!active) return; answer.hidden = false; answer.textContent = `${active.prompt.answerLatex}. ${active.prompt.answerExplanation}`; active.surface.reveal(active.prompt.answerStep); };
  back.onclick = close;
  return { close, dispose() { close(); root.removeEventListener("click", click); reveal.onclick = null; back.onclick = null; } };
}
