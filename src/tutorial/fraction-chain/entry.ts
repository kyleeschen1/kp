import "katex/dist/katex.min.css";
import "../../reader/presentation/reasoning-document.css";
import "../../reader/app/canonical-equation-surface.css";
import "../../reader/presentation/equation-passage.css";
import "../../rendering/common-denominator-pressure-surface.css";
import "./style.css";
import source from "../../../examples/algebra/fraction-chain.json";
import { compileFractionChain } from "../../authoring/fraction-chain-compilation.ts";
import { resolveFractionAdditionPresentation } from "../../authoring/fraction-addition-presentation.ts";
import { mountFractionAdditionSurface, mountFractionReductionSurface } from "./native.ts";
import { mountFractionAlignmentSurface } from "./alignment.ts";
import { mountFractionPassage } from "./reader.ts";

const root = document.querySelector<HTMLElement>("[data-fraction-passage]")!;
const status = root.querySelector<HTMLElement>("[data-fraction-status]")!;
const stages = [...root.querySelectorAll<HTMLElement>("[data-fraction-stage]")];
async function mount() {
  const result = compileFractionChain(source);
  if (result.status !== "compiled") throw new Error(result.expected);
  if (root.dataset["sourceRevision"] !== result.compilation.revision) throw new Error("Published fraction source is stale.");
  const presentation = resolveFractionAdditionPresentation(result.compilation, 1);
  const surfaces: { seek(progress: number): unknown; dispose(): void; invalidate?(): void }[] = [];
  try {
    surfaces.push(await mountFractionAlignmentSurface(stages[0]!, result.compilation, 0));
    surfaces.push(await mountFractionAdditionSurface(stages[1]!, presentation, "merge"));
    surfaces.push(await mountFractionAdditionSurface(stages[2]!, presentation, "evaluation"));
    surfaces.push(await mountFractionReductionSurface(stages[3]!, result.compilation, 2));
    mountFractionPassage(root, surfaces);
    root.dataset["fractionReady"] = "true";
  } catch (error) { surfaces.forEach(surface => surface.dispose()); throw error; }
}
void mount().catch(error => { root.dataset["fractionReady"] = "repair"; status.hidden = false;
  status.textContent = `This inspection needs repair. The complete written reasoning remains available. ${error instanceof Error ? error.message : String(error)}`; });
