import "../matrix-example-page.css";
import { applyMatrixConfig, readMatrixConfig, observeMatrixConfig, type MatrixExampleConfig } from "./config.ts";

const menu = document.querySelector<HTMLSelectElement>("#example-menu")!;
const column = document.querySelector<HTMLSelectElement>("#column-menu")!;
const columnLabel = document.querySelector<HTMLElement>("#column-label")!;
const frame = document.querySelector<HTMLIFrameElement>("#example-frame")!;
let observer: ResizeObserver | undefined;
let stopChildConfig: (() => void) | undefined;
let config = readMatrixConfig(document);
const layout = document.querySelector<HTMLButtonElement>("#layout-toggle")!;
const spacing = document.querySelector<HTMLButtonElement>("#spacing-toggle")!;
const motion = document.querySelector<HTMLButtonElement>("#motion-toggle")!;
const reset = document.querySelector<HTMLButtonElement>("#config-reset")!;
const theme = document.querySelector<HTMLButtonElement>('#theme-toggle')!;
const configure = (next: MatrixExampleConfig) => {
  config = next;
  layout.setAttribute("aria-pressed", String(config.layout === "side"));
  spacing.setAttribute("aria-pressed", String(config.spacing === "roomy"));
  motion.setAttribute("aria-pressed", String(config.motion === "steps"));
  theme.setAttribute('aria-pressed', String(config.theme === 'light'));
  applyMatrixConfig(document, config);
  if (frame.contentDocument) applyMatrixConfig(frame.contentDocument, config);
};
layout.onclick = () => configure({ ...config, layout: config.layout === "side" ? "stacked" : "side" });
spacing.onclick = () => configure({ ...config, spacing: config.spacing === "roomy" ? "compact" : "roomy" });
motion.onclick = () => configure({ ...config, motion: config.motion === "steps" ? "animate" : "steps" });
theme.onclick = () => configure({ ...config, theme: config.theme === 'dark' ? 'light' : 'dark' });
reset.onclick = () => configure({ layout: "stacked", spacing: "compact", motion: "animate", theme: 'light' });

// Keep one live child document: replacing it disposes the previous player's
// clock and listeners, and its history changes cannot change the host URL.
const select = () => {
  observer?.disconnect();
  stopChildConfig?.();
  const dot = menu.value === "dot";
  const passage = menu.value === "dot-passage";
  const rectangular = menu.value === 'rectangular';
  columnLabel.hidden = dot || passage || rectangular;
  frame.title = `${menu.selectedOptions[0]!.textContent} animation`;
  frame.src = rectangular ? '../rectangular-product/' : passage ? "../dot-product-passage/" : dot ? "../matrix-column-product/" :
    `../matrix-column-combinations/?embedded=1&example=${menu.value}&column=${column.value}`;
};
frame.onload = () => {
  observer?.disconnect();
  stopChildConfig?.();
  const body = frame.contentDocument?.body;
  if (!body) return;
  applyMatrixConfig(body.ownerDocument, config);
  // A player-side theme toggle must not leave the menu and outer page stale.
  stopChildConfig = observeMatrixConfig(body.ownerDocument, next => {
    if (next.theme !== config.theme) configure(next);
  });
  const resize = () => { frame.style.height = `${Math.ceil(body.getBoundingClientRect().height + 100)}px`; };
  observer = new ResizeObserver(resize);
  observer.observe(body);
  resize();
};
menu.onchange = select;
column.onchange = select;
import.meta.hot?.dispose(() => {
  observer?.disconnect();
  stopChildConfig?.();
  menu.onchange = null; column.onchange = null; frame.onload = null;
  layout.onclick = null; spacing.onclick = null; motion.onclick = null; reset.onclick = null; theme.onclick = null;
});
