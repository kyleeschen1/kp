import { writeSourceClipboard } from "../../reader/runtime/source-clipboard.ts";

/** Whole-expression source comes from checked publication, never from KaTeX's
 * visual DOM. This adapter intentionally offers no fragment-to-LaTeX mapping. */
export function mountEquationSourceCopy(root: HTMLElement, currentRow: () => number, pause: () => void, signal: AbortSignal) {
  const equations = [...root.querySelectorAll<HTMLElement>(".energy-derivation-history > li > [data-derivation-latex]")];
  if (equations.length === 0 || equations.some(node => !node.dataset["derivationLatex"])) throw new Error("Missing checked equation copy source");
  const toolbar = document.createElement("div");
  toolbar.className = "energy-derivation-actions";
  toolbar.dataset["equationCopyTools"] = "true";
  toolbar.innerHTML = '<button type="button" data-copy-current-latex title="Copy the nearest complete equation during a move">Copy current LaTeX</button><span role="status" data-equation-copy-status>Select an equation to copy its LaTeX.</span><label data-equation-copy-fallback hidden>Copy LaTeX<textarea readonly rows="3" spellcheck="false"></textarea></label>';
  root.prepend(toolbar);
  const button = toolbar.querySelector<HTMLButtonElement>("button")!;
  const status = toolbar.querySelector<HTMLElement>("[role=status]")!;
  const fallback = toolbar.querySelector<HTMLElement>("label")!;
  const text = toolbar.querySelector<HTMLTextAreaElement>("textarea")!;
  const options = { signal };
  let selected: HTMLElement | undefined;
  const clear = () => {
    selected?.removeAttribute("data-equation-copy-selected"); selected = undefined;
  };
  const choose = (node: HTMLElement) => {
    pause(); clear(); selected = node;
    node.dataset["equationCopySelected"] = "true";
    node.focus({ preventScroll: true });
    const range = document.createRange(); range.selectNodeContents(node);
    const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
    status.textContent = "Whole equation selected. Press Cmd/Ctrl+C to copy LaTeX.";
  };
  equations.forEach((node, index) => {
    node.tabIndex = 0; node.setAttribute("role", "button");
    node.setAttribute("aria-label", `Select equation ${index + 1} to copy LaTeX`);
    node.addEventListener("click", () => choose(node), options);
    node.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(node); }
      if (event.key === "Escape") { clear(); window.getSelection()?.removeAllRanges(); }
    }, options);
    node.addEventListener("copy", event => {
      if (!event.clipboardData) return;
      event.preventDefault(); event.clipboardData.setData("text/plain", node.dataset["derivationLatex"]!);
      status.textContent = "Copied LaTeX.";
    }, options);
  });
  button.addEventListener("click", async () => {
    const node = equations[currentRow()];
    if (!node) throw new Error("Equation copy position is outside the checked view");
    const source = node.dataset["derivationLatex"]!;
    button.disabled = true;
    const result = await writeSourceClipboard(source, signal);
    if (result === "disposed") return;
    button.disabled = false;
    fallback.hidden = result === "copied";
    status.textContent = result === "copied" ? "Copied current equation as LaTeX." : "Clipboard unavailable. Copy the selected LaTeX below.";
    if (result === "manual") { text.value = source; text.focus(); text.select(); }
  }, options);
  root.addEventListener("pointerdown", event => {
    if (event.target instanceof Element && event.target.closest("[data-derivation-handle], [data-derivation-rail]")) {
      if (selected) window.getSelection()?.removeAllRanges();
      clear();
    }
  }, options);
  root.addEventListener("keydown", event => {
    if (event.target instanceof Element && event.target.closest("[data-derivation-handle]") &&
        ["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
      if (selected) window.getSelection()?.removeAllRanges();
      clear();
    }
  }, options);
  signal.addEventListener("abort", () => {
    clear(); toolbar.remove();
    equations.forEach(node => { node.removeAttribute("tabindex"); node.removeAttribute("role"); node.removeAttribute("aria-label"); });
  }, { once: true });
}
