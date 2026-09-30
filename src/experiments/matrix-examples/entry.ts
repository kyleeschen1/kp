import "../matrix-column-product/style.css";
import { applyMatrixConfig, readMatrixConfig, type MatrixExampleConfig } from "./config.ts";

const menu = document.querySelector<HTMLSelectElement>("#example-menu")!;
const column = document.querySelector<HTMLSelectElement>("#column-menu")!;
const columnLabel = document.querySelector<HTMLElement>("#column-label")!;
const frame = document.querySelector<HTMLIFrameElement>("#example-frame")!;
let observer: ResizeObserver | undefined;
let config = readMatrixConfig(document);
const layout = document.querySelector<HTMLButtonElement>("#layout-toggle")!;
const spacing = document.querySelector<HTMLButtonElement>("#spacing-toggle")!;
const motion = document.querySelector<HTMLButtonElement>("#motion-toggle")!;
const reset = document.querySelector<HTMLButtonElement>("#config-reset")!;
const configure = (next: MatrixExampleConfig) => {
  config = next;
  layout.setAttribute("aria-pressed", String(config.layout === "side"));
  spacing.setAttribute("aria-pressed", String(config.spacing === "roomy"));
  motion.setAttribute("aria-pressed", String(config.motion === "steps"));
  applyMatrixConfig(document, config);
  if (frame.contentDocument) applyMatrixConfig(frame.contentDocument, config);
};
layout.onclick = () => configure({ ...config, layout: config.layout === "side" ? "stacked" : "side" });
spacing.onclick = () => configure({ ...config, spacing: config.spacing === "roomy" ? "compact" : "roomy" });
motion.onclick = () => configure({ ...config, motion: config.motion === "steps" ? "animate" : "steps" });
reset.onclick = () => configure({ layout: "stacked", spacing: "compact", motion: "animate" });

// Keep one live child document: replacing it disposes the previous player's
// clock and listeners, and its history changes cannot change the host URL.
const select = () => {
  observer?.disconnect();
  const dot = menu.value === "dot";
  columnLabel.hidden = dot;
  frame.title = `${menu.selectedOptions[0]!.textContent} animation`;
  frame.src = dot ? "../matrix-column-product/" :
    `../matrix-column-combinations/?embedded=1&example=${menu.value}&column=${column.value}`;
};
frame.onload = () => {
  observer?.disconnect();
  const body = frame.contentDocument?.body;
  if (!body) return;
  applyMatrixConfig(body.ownerDocument, config);
  const resize = () => { frame.style.height = `${Math.ceil(body.getBoundingClientRect().height + 100)}px`; };
  observer = new ResizeObserver(resize);
  observer.observe(body);
  resize();
};
menu.onchange = select;
column.onchange = select;
import.meta.hot?.dispose(() => {
  observer?.disconnect();
  menu.onchange = null; column.onchange = null; frame.onload = null;
  layout.onclick = null; spacing.onclick = null; motion.onclick = null; reset.onclick = null;
});
