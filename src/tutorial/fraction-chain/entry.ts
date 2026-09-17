import "katex/dist/katex.min.css";
import "../../reader/app/exemplar.css";
import "./style.css";
import source from "../../../examples/algebra/fraction-chain.json";
import { compileFractionChain } from "../../authoring/fraction-chain-compilation.ts";
import { resolveFractionAdditionPresentation } from "../../authoring/fraction-addition-presentation.ts";
import { mountFractionAdditionSurface, mountFractionReductionSurface } from "./native.ts";

const root = document.querySelector<HTMLElement>("#fraction-chain")!;
const slider = root.querySelector<HTMLInputElement>("[data-fraction-progress]")!;
const status = root.querySelector<HTMLOutputElement>("[data-fraction-status]")!;
const stages = [...root.querySelectorAll<HTMLElement>("[data-fraction-stage]")];
async function mount() {
  const result = compileFractionChain(source);
  if (result.status !== "compiled") throw new Error(result.expected);
  const presentation = resolveFractionAdditionPresentation(result.compilation, 1);
  const sessions: Awaited<ReturnType<typeof mountFractionAdditionSurface>>[] = [];
  try {
    sessions.push(await mountFractionAdditionSurface(stages[0]!, presentation, "merge"));
    sessions.push(await mountFractionAdditionSurface(stages[1]!, presentation, "evaluation"));
    sessions.push(await mountFractionReductionSurface(stages[2]!, result.compilation, 2));
    const render = () => {
      const position = Number(slider.value), index = position <= 1 ? 0 : position <= 2 ? 1 : 2;
      // Both canonical owners are prepared in measurable space. Exactly one
      // becomes visible; authored shared endpoints delimit the operation switch.
      // Compositor descendants own visibility explicitly. An inherited hidden
      // visibility cannot retire them; remove the inactive stage from display.
      stages.forEach((stage, i) => { stage.hidden = i !== index; stage.setAttribute("aria-hidden", String(i !== index)); });
      sessions[index]!.seek(index === 2 ? (position - 2) / 3 : position - index);
      root.dataset["fractionPosition"] = position.toFixed(3);
      status.value = position <= 1 ? "Retain sixths; bring the numerators together." : position <= 2 ? "Add the numerators; keep the denominator."
        : position <= 3 ? "Expose the common factor of three." : position <= 4 ? "Gather three over three as a factor of one." : "Remove the unit factor; retain one half.";
      slider.setAttribute("aria-valuetext", `Step ${position.toFixed(2)} of 5`);
    };
    const resize = () => { sessions.forEach(session => session.invalidate()); render(); };
    slider.oninput = render;
    window.addEventListener("resize", resize);
    window.addEventListener("pagehide", () => { slider.oninput = null; window.removeEventListener("resize", resize); sessions.forEach(session => session.dispose()); }, { once: true });
    render(); slider.disabled = false; root.dataset["fractionReady"] = "true";
  } catch (error) { sessions.forEach(session => session.dispose()); throw error; }
}
void mount().catch(error => { root.dataset["fractionReady"] = "repair"; status.value = `This move needs repair: ${error instanceof Error ? error.message : String(error)}`; });
