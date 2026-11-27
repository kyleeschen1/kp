import type { matrixProduct } from "../../math/matrix-product.ts";
import { MatrixColumnGap } from "../matrix-column-product/environment.ts";
import { columnExampleFromVectorProduct } from "./model.ts";
import { columnCardHtml } from "./view.ts";
import { calculationLatex } from "./presentation.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { mountColumnPlayer } from "./player.ts";
import { prepareColumnFonts } from "./fonts.ts";
import "./embed.css";

export { prepareColumnFonts as prepareColumnExplanationFonts };
const mounts = new WeakSet<HTMLElement>();

/** Hosts load fonts before mounting connected native endpoints. Revision,
 * persistence and replacement remain with the caller, not this presentation. */
export function mountColumnExplanation(root: HTMLElement, product: ReturnType<typeof matrixProduct>,
  progress: number, onSettled: (progress: number) => void): ReturnType<typeof mountColumnPlayer> {
  if (!root.isConnected) throw new MatrixColumnGap("Attach the explanation host before measuring native endpoints.");
  if (mounts.has(root)) throw new MatrixColumnGap("Dispose this host's explanation before replacing it.");
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) throw new MatrixColumnGap("Explanation progress must be between 0 and 1.");
  const scene = columnExampleFromVectorProduct(product);
  const container = root.ownerDocument.createElement("div");
  container.className = "matrix-player kp-column-explanation";
  container.dataset["sourceId"] = product.id;
  container.setAttribute("aria-label", scene.title);
  container.innerHTML = columnCardHtml(scene) +
    `<details><summary>Read the calculation</summary><div class="comb-static">${renderLatexToHtml(calculationLatex(scene), { output: "htmlAndMathml" })}</div></details>`;
  root.append(container);
  mounts.add(root);
  let player: ReturnType<typeof mountColumnPlayer>;
  try { player = mountColumnPlayer(container, scene, progress, onSettled); }
  catch (error) { container.remove(); mounts.delete(root); throw error; }
  let disposed = false;
  const live = () => { if (disposed) throw new MatrixColumnGap("This explanation has been disposed."); };
  return {
    pause() { live(); player.pause(); },
    progress() { live(); return player.progress(); },
    seek(value) { live(); player.seek(value); },
    prepare() { live(); player.prepare(); },
    dispose() {
      if (disposed) return;
      disposed = true; player.dispose(); container.remove(); mounts.delete(root);
    }
  };
}
