import "../matrix-column-product/style.css";

const menu = document.querySelector<HTMLSelectElement>("#example-menu")!;
const column = document.querySelector<HTMLSelectElement>("#column-menu")!;
const columnLabel = document.querySelector<HTMLElement>("#column-label")!;
const frame = document.querySelector<HTMLIFrameElement>("#example-frame")!;
let observer: ResizeObserver | undefined;

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
});
