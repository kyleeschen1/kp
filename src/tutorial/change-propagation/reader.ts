import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { createKpReaderSemanticFocusService } from "../../reader/runtime/semantic-focus.ts";
import { mountKpFocusDeckNativeInput } from "../focus-deck-native-input.ts";
import { bindKpFocusDeckKeyboard } from "../focus-deck-keyboard.ts";
import { navigateKpFocusDeckPlayback } from "../focus-deck-playback.ts";
import { boundKpFocusDeckTravel, settleKpFocusDeckTravel } from "../focus-deck-continuous-navigation.ts";
import { changeSteps, compileChangeSource, projectChange, type ChangeModel } from "./model.ts";
import { bindChangePaint } from "./paint.ts";

function required<T extends Element>(selector: string, parent: ParentNode = document): T {
  const value = parent.querySelector<T>(selector);
  if (!value) throw new Error(`Change propagation is missing ${selector}.`);
  return value;
}

function mount(root: HTMLElement, model: ChangeModel, restore = false) {
  const abort = new AbortController(), { signal } = abort;
  const viewport = required<HTMLElement>("[data-kp-focus-deck-viewport]", root);
  const slider = required<HTMLInputElement>("[data-kp-focus-deck-scrubber]", root);
  const xInput = required<HTMLInputElement>("[data-change-x]", root), hInput = required<HTMLInputElement>("[data-change-h]", root);
  const previous = required<HTMLButtonElement>("[data-kp-focus-deck-previous]", root), next = required<HTMLButtonElement>("[data-kp-focus-deck-next]", root);
  const panels = Array.from(viewport.querySelectorAll<HTMLElement>("[data-kp-focus-deck-beat]"));
  const entities = changeSteps.map(id => required<HTMLElement>(`[data-change-entity="${id}"]`, root));
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clock = createKpReaderTimelinePlaybackClock({ id: "change-propagation", durationMs: 7200, ownerWindow: window });
  const focus = createKpReaderSemanticFocusService(changeSteps);
  const paint = bindChangePaint(root, model);
  const position = () => clock.getSnapshot().progress * 4;
  let x = model.source.x, h = model.source.h;
  let urlTimer: number | undefined;
  const persist = () => {
    window.clearTimeout(urlTimer);
    urlTimer = window.setTimeout(() => {
      const params = new URLSearchParams({ step: String(position()), x: String(x), h: String(h) });
      history.replaceState(null, "", `#${params}`);
    }, 250);
  };
  root.dataset["kpFocusDeckStatic"] = "false";
  required<HTMLElement>("[data-change-controls]", root).hidden = false;
  viewport.dataset["kpFocusDeckSnapDisabled"] = "true";
  function render() {
    const p = position(), index = Math.round(p), id = changeSteps[index]!;
    paint(projectChange(model, x, h, p));
    focus.set("story", [id]);
    // Resolved scene focus is paint-only; the native math and layout persist.
    const selected = focus.getSnapshot().objectRefs;
    entities.forEach((node, i) => { node.dataset["focused"] = String(selected.includes(changeSteps[i]!)); });
    slider.value = String(p);
    slider.setAttribute("aria-valuetext", `Step ${index + 1} of 5: ${model.source.steps[index]!.title}`);
    root.dataset["kpFocusDeckActiveBeat"] = id;
    panels.forEach((panel, i) => {
      panel.dataset["kpFocusDeckBeatActive"] = String(i === index);
      panel.setAttribute("aria-hidden", String(i !== index));
      if (i === index) panel.setAttribute("aria-current", "page"); else panel.removeAttribute("aria-current");
    });
    if (!native.ownsTravel()) viewport.scrollLeft = p * viewport.clientWidth;
    previous.disabled = p === 0; next.disabled = p === 4;
    required<HTMLOutputElement>("[data-kp-focus-deck-position]", root).textContent = slider.getAttribute("aria-valuetext");
    root.setAttribute("data-change-position", String(p));
    persist();
  }
  function navigate(target: number) {
    native.cancel();
    navigateKpFocusDeckPlayback(clock, { kind: "play-transition", target: boundKpFocusDeckTravel(target, 4) / 4, motion: reduced() ? "reduced" : "full" });
  }
  const native = mountKpFocusDeckNativeInput({ viewport, region: root, enabled: () => true, position, reduced,
    interrupt: () => { clock.pause(); }, unownedPosition: position,
    begin() {
      const origin = Math.round(position()); let last = position();
      return {
        update(p) { last = boundKpFocusDeckTravel(p, 4); clock.seek(last / 4); },
        finish(_now, animate) {
          const target = settleKpFocusDeckTravel({ position: last, origin, lastCheckpoint: 4, direction: last - origin, committed: Math.abs(last - origin) > .15 });
          navigateKpFocusDeckPlayback(clock, { kind: "settle-gesture", target: target / 4, durationMs: 260, motion: animate ? "full" : "reduced" });
        }, cancel() { clock.pause(); }
      };
    }
  });
  const unbindKeyboard = bindKpFocusDeckKeyboard({ card: root, slider, enabled: () => true, position, checkpointCount: () => 5, navigate });
  previous.addEventListener("click", () => navigate(Math.ceil(position()) - 1), { signal });
  next.addEventListener("click", () => navigate(Math.floor(position()) + 1), { signal });
  slider.addEventListener("input", () => { native.cancel(); clock.seek(Number(slider.value) / 4); }, { signal });
  xInput.addEventListener("input", () => { x = Number(xInput.value); render(); }, { signal });
  hInput.addEventListener("input", () => { h = Number(hInput.value); render(); }, { signal });
  required("[data-change-zero]", root).addEventListener("click", () => { x = 0; xInput.value = "0"; render(); }, { signal });
  required("[data-change-reset]", root).addEventListener("click", () => {
    x = model.source.x; h = model.source.h; xInput.value = String(x); hInput.value = String(h);
    native.cancel(); clock.seek(0);
  }, { signal });
  const unsubscribe = clock.subscribe(render);
  const resize = new ResizeObserver(render); resize.observe(viewport);
  function restorePosition() {
    const params = new URLSearchParams(location.hash.slice(1));
    const read = (key: string, fallback: number, low: number, high: number) => {
      const raw = params.get(key), value = raw === null ? fallback : Number(raw);
      return Number.isFinite(value) && value >= low && value <= high ? value : fallback;
    };
    x = read("x", model.source.x, -2, 2); h = read("h", model.source.h, -.5, .5);
    xInput.value = String(x); hInput.value = String(h);
    native.cancel(); clock.seek(read("step", 0, 0, 4) / 4, "url");
  }
  if (restore) restorePosition(); else render();
  window.addEventListener("hashchange", restorePosition, { signal });
  document.addEventListener("visibilitychange", () => { if (document.hidden) clock.pause(); }, { signal });
  return () => { window.clearTimeout(urlTimer); abort.abort(); native.dispose(); unbindKeyboard(); unsubscribe(); resize.disconnect(); focus.dispose(); clock.dispose(); };
}

const encoded: unknown = JSON.parse(required("#change-source-bytes").textContent ?? "null");
if (typeof encoded !== "string") throw new Error("Missing selected change-propagation source.");
const initial = compileChangeSource(encoded);
if (initial.status !== "checked") throw new Error(`${initial.path}: ${initial.message}`);
let dispose = mount(required(".change-card"), initial.model, true);
required<HTMLElement>("[data-change-author]").hidden = false;
const editor = required<HTMLTextAreaElement>("#change-source"), diagnostic = required<HTMLElement>("[data-change-diagnostic]");
const apply = required<HTMLButtonElement>("[data-change-apply]");
apply.addEventListener("click", async () => {
  const bytes = editor.value, result = compileChangeSource(bytes);
  if (result.status !== "checked") { diagnostic.textContent = `${result.path}: ${result.message} The previous card is unchanged.`; return; }
  apply.disabled = true;
  try {
    // Editing pays for KaTeX authoring lazily; ordinary reading uses the native
    // math HTML already produced by the publication compiler.
    const { renderChangePublication } = await import("./view.ts");
    const template = document.createElement("template"); template.innerHTML = renderChangePublication(result.model, bytes);
    const card = required<HTMLElement>(".change-card", template.content);
    const reading = required<HTMLElement>(".change-reading-source", template.content);
    dispose(); required("[data-change-host]").replaceChildren(card);
    required(".change-reading-source").replaceWith(reading);
    required("h1").textContent = result.model.source.title;
    document.title = `${result.model.source.title} · Kinetic Press`;
    dispose = mount(card, result.model);
    diagnostic.textContent = "Preview updated from this source. Functions and derivatives were checked; prose remains author-supplied. Download to keep this draft.";
  } catch (error) { diagnostic.textContent = `Preview failed: ${error instanceof Error ? error.message : String(error)}`; }
  finally { apply.disabled = false; }
});
required("[data-change-download]").addEventListener("click", () => {
  const url = URL.createObjectURL(new Blob([editor.value], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = "change-propagation.json"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
window.addEventListener("pagehide", event => { if (!event.persisted) dispose(); });
if (import.meta.hot) import.meta.hot.dispose(() => dispose());
