/** The scaffold owns the card; the existing host retains the clock and the
 * single stage node. Navigation never remounts or recreates the code renderer. */
export function mountCodeFocus(root: HTMLElement, stage: HTMLElement, host: {
  progress(): number;
  seek(progress: number): void;
  travel(progress: number): void;
}, presentation: {
  card: HTMLElement; slot: HTMLElement; note: HTMLElement;
  thoughts: readonly { id: string; title: string }[];
  thought(progress: number): { id: string; title: string };
  stops: readonly number[];
}) {
  const element = <T extends HTMLElement>(selector: string) => {
    const node = root.querySelector<T>(selector);
    if (!node) throw new Error(`Missing code focus element ${selector}`);
    return node;
  };
  const { card, slot } = presentation;
  const stops = presentation.stops;
  if (!stops.length || stops.some((p, i) => !Number.isFinite(p) || p < 0 || p > 1 || (i > 0 && p < stops[i - 1]!))) throw new Error("Invalid code focus checkpoints");
  const scrubber = element<HTMLInputElement>("[data-kp-focus-deck-scrubber]");
  const previous = element<HTMLButtonElement>("[data-kp-focus-deck-previous]");
  const next = element<HTMLButtonElement>("[data-kp-focus-deck-next]");
  const status = element<HTMLOutputElement>("[data-kp-focus-deck-position]");
  const panels = presentation.thoughts.map(thought => ({ ...thought,
    panel: element<HTMLElement>(`[data-kp-focus-deck-beat="${thought.id}"]`)
  }));
  const originalParent = stage.parentNode!, originalNext = stage.nextSibling;
  panels.forEach(item => { item.panel.tabIndex = 0; });
  slot.append(stage);
  stage.dataset["codeFocusStage"] = "true";
  stage.tabIndex = 0;
  stage.setAttribute("role", "region");
  stage.setAttribute("aria-label", "Code transformation; scroll to inspect all lines");
  scrubber.max = "1"; scrubber.step = ".001";
  scrubber.setAttribute("aria-label", "Scrub the code transformation");
  const abort = new AbortController(), options = { signal: abort.signal };
  const move = (forward: boolean) => host.travel(forward
    ? stops.find(p => p > host.progress() + .00001) ?? 1
    : stops.filter(p => p < host.progress() - .00001).at(-1) ?? 0);
  previous.addEventListener("click", () => move(false), options);
  next.addEventListener("click", () => move(true), options);
  scrubber.addEventListener("input", () => host.seek(Number(scrubber.value)), options);
  scrubber.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home" || event.key === "End") host.seek(event.key === "Home" ? 0 : 1);
    else move(event.key === "ArrowRight" || event.key === "ArrowUp");
  }, options);
  const render = (p: number) => {
    const thought = presentation.thought(p);
    if (!panels.some(panel => panel.id === thought.id)) throw new Error("Code focus thought has no published panel");
    card.dataset["kpFocusDeckActiveBeat"] = thought.id;
    for (const item of panels) {
      const active = item.id === thought.id;
      item.panel.dataset["kpFocusDeckBeatActive"] = String(active);
      item.panel.setAttribute("aria-hidden", String(!active));
      if (active) item.panel.setAttribute("aria-current", "page");
      else item.panel.removeAttribute("aria-current");
      item.panel.inert = !active;
    }
    scrubber.value = String(p);
    scrubber.setAttribute("aria-valuetext", thought.title);
    if (status.value !== thought.title) status.value = thought.title;
    previous.disabled = p === 0; next.disabled = p === 1;
  };
  const fit = () => {
    // Reserve prose and controls first. A short viewport scrolls the existing
    // code surface; font enlargement never scales its glyphs or clips its ends.
    const chrome = card.getBoundingClientRect().height - stage.getBoundingClientRect().height;
    const available = innerHeight - 32 - chrome;
    card.dataset["centroidFit"] = available < 96 ? "reading" : "bounded";
    stage.style.maxHeight = available < 96 ? "none" : `${Math.floor(available)}px`;
    presentation.note.textContent = available < 96
      ? "Reading layout: scroll the page to explore the code at this text size."
      : "Drag to inspect. Click code to settle, then drag to select. Scroll within the code when needed.";
  };
  root.hidden = false;
  render(host.progress());
  const resize = new ResizeObserver(fit);
  resize.observe(card); resize.observe(element("[data-kp-focus-deck-viewport]"));
  window.addEventListener("resize", fit, options);
  fit();
  return { render, dispose() {
    abort.abort(); resize.disconnect();
    originalParent.insertBefore(stage, originalNext);
    stage.style.removeProperty("max-height"); stage.removeAttribute("tabindex");
    delete stage.dataset["codeFocusStage"];
    stage.removeAttribute("role"); stage.removeAttribute("aria-label");
  } };
}
