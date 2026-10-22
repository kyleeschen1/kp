import "./argument.css";
import { recoveringInput } from "../../../content/authoring/linear-algebra/recovering-input.ts";
import { inspections } from "./argument.ts";
import { argumentHtml } from "./argument-view.ts";
import { prepareInspection } from "./argument-inspection.ts";
import { createKpReaderLatestSessionHandoff } from "../../reader/runtime/latest-session-handoff.ts";
import { holdDisclosureViewportAnchor } from "../../reader/runtime/disclosure-viewport-anchor.ts";
import { encodeKpHtmlAttribute as escape } from "../../rendering/html-output-encoding.ts";

type Player = ReturnType<Awaited<ReturnType<typeof prepareInspection>>["mount"]>;
type OpenInspection = { id: string; button: HTMLButtonElement; panel: HTMLElement; returnTop: number } & (
  | { state: "loading" }
  | { state: "failed" }
  | { state: "ready"; player: Player }
);

/** One visible inspection owns one live player. Closing preserves only its
 * semantic progress; paint, clocks and listeners are released, not hidden. */
export function mountMatrixArgument(root: HTMLElement) {
  const source = recoveringInput, items = inspections(source), saved = new Map<string, number>();
  const handoff = createKpReaderLatestSessionHandoff();
  const lifetime = new AbortController();
  const main = root.closest("main")!;
  main.classList.add("kp-reasoning-document");
  document.querySelector("h1")!.textContent = source.title; document.title = source.title;
  document.querySelector("#matrix-story > p")!.textContent = source.introduction;
  root.innerHTML = argumentHtml(source); root.dataset["argument"] = source.id;
  root.setAttribute("aria-busy", "false"); root.dataset["ready"] = "true";
  let active: OpenInspection | undefined, disposed = false;
  let anchor: ReturnType<typeof holdDisclosureViewportAnchor> | undefined;
  const close = (returnToClaim: boolean) => {
    handoff.invalidate();
    const previous = active; active = undefined;
    if (!previous) return;
    if (returnToClaim) anchor = holdDisclosureViewportAnchor(previous.button, lifetime.signal);
    if (previous.state === "ready") {
      saved.set(previous.id, previous.player.progress()); previous.player.dispose();
    }
    previous.panel.replaceChildren(); previous.panel.hidden = true;
    previous.panel.removeAttribute("aria-busy"); delete previous.panel.dataset["ready"];
    previous.button.setAttribute("aria-expanded", "false");
    delete root.dataset["activeInspection"];
    if (returnToClaim) {
      anchor?.retarget(previous.button, previous.returnTop);
      previous.button.focus({ preventScroll: true });
    }
  };
  const open = async (button: HTMLButtonElement) => {
    if (disposed) return;
    const id = button.dataset["inspect"]!, item = items.find(item => item.id === id);
    if (!item) return;
    if (active?.id === id) { close(true); return; }
    // Anchor the new question before removing an earlier inspection above it.
    anchor = holdDisclosureViewportAnchor(button, lifetime.signal);
    const returnTop = button.getBoundingClientRect().top;
    close(false);
    const panel = root.querySelector<HTMLElement>(`[data-inspection="${id}"]`)!;
    const pending: OpenInspection = { id, button, panel, returnTop, state: "loading" };
    active = pending; const token = handoff.issue();
    panel.hidden = false; panel.setAttribute("aria-busy", "true");
    panel.innerHTML = '<p role="status">Preparing the inspection…</p><button data-return>Return to the argument</button>';
    button.setAttribute("aria-expanded", "true"); root.dataset["activeInspection"] = id;
    try {
      const prepared = await prepareInspection(item);
      handoff.commit(token, () => {
        if (disposed) return;
        panel.innerHTML = `<p>${escape(item.context)}</p>` + prepared.html + '<div class="energy-derivation-actions"><button data-return>Return to the argument</button></div>';
        const player = prepared.mount(panel, saved.get(id) ?? 0, progress => saved.set(id, progress));
        active = { ...pending, state: "ready", player };
        panel.setAttribute("aria-busy", "false"); panel.dataset["ready"] = "true";
        anchor?.refresh();
      });
    } catch (error) {
      // A mount failure consumes the handoff token. The active object still
      // identifies this attempt; a later request or disposal must never be
      // overwritten by an older import/font rejection.
      if (disposed || active !== pending) return;
      active = { ...pending, state: "failed" };
      panel.replaceChildren(); const alert = document.createElement("p");
      alert.setAttribute("role", "alert"); alert.textContent = String(error); panel.append(alert);
      const back = document.createElement("button"); back.dataset["return"] = "true"; back.textContent = "Return to the argument"; panel.append(back);
      panel.setAttribute("aria-busy", "false");
    }
  };
  const click = (event: MouseEvent) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("button") : null;
    if (!button) return;
    if (button.hasAttribute("data-inspect")) void open(button);
    else if (button.hasAttribute("data-return")) close(true);
  };
  const keydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && active && event.target instanceof Node && (active.panel.contains(event.target) || event.target === active.button)) {
      event.preventDefault(); close(true);
    }
  };
  const pagehide = (event: PageTransitionEvent) => {
    if (event.persisted) { if (active?.state === "ready") active.player.pause(); else close(false); }
    else dispose();
  };
  const pageshow = (event: PageTransitionEvent) => { if (event.persisted && active?.state === "ready") active.player.prepare(); };
  const dispose = () => {
    if (disposed) return; disposed = true; close(false); lifetime.abort(); anchor?.release();
    root.removeEventListener("click", click); root.removeEventListener("keydown", keydown);
    window.removeEventListener("pagehide", pagehide); window.removeEventListener("pageshow", pageshow);
    delete root.dataset["ready"];
  };
  root.addEventListener("click", click); root.addEventListener("keydown", keydown);
  window.addEventListener("pagehide", pagehide); window.addEventListener("pageshow", pageshow);
  // Native fragment navigation may precede asynchronously loaded prose.
  if (location.hash) root.querySelector(`#${CSS.escape(location.hash.slice(1))}`)?.scrollIntoView();
  return dispose;
}
