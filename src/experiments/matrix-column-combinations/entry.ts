import "./style.css";
import "../matrix-example-page.css";
import { createKpReaderLatestSessionHandoff } from "../../reader/runtime/latest-session-handoff.ts";
import { loadColumnPage } from "./page.ts";
import { mountColumnPlayer } from "./player.ts";
import { readColumnProgress, columnProgressHash, sameColumnSelection } from "./location.ts";

const root = document.querySelector<HTMLElement>("#comb-player")!;
const handoff = createKpReaderLatestSessionHandoff();
type Active = { url: URL; page: Awaited<ReturnType<typeof loadColumnPage>>; player: ReturnType<typeof mountColumnPlayer> };
let active: Active | undefined;
let disposed = false;
let navigating = false;

function settle(progress: number) {
  if (!active || disposed || navigating) return;
  active.url.hash = columnProgressHash(progress);
  if (location.href !== active.url.href) history.replaceState(null, "", active.url);
  for (const link of root.querySelectorAll<HTMLAnchorElement>("[data-column-navigation] a")) {
    const url = new URL(link.href); url.hash = active.url.hash;
    // Keep embedding and other host-owned query state when comparing columns.
    for (const [key, value] of active.url.searchParams) if (key !== "column") url.searchParams.set(key, value);
    link.href = url.href;
    link.setAttribute("aria-current", url.searchParams.get("column") === String(active.page.scene.column) ? "true" : "false");
  }
}

function showError(error: unknown) {
  const message = `The column combination could not be prepared: ${error instanceof Error ? error.message : String(error)}`;
  root.setAttribute("aria-busy", "false");
  if (!active) { root.dataset["gap"] = "true"; root.textContent = message; return; }
  // A failed selection leaves the previous source, controls and location usable.
  settle(active.player.progress());
  let alert = root.querySelector<HTMLElement>("[data-load-error]");
  if (!alert) { alert = document.createElement("p"); alert.dataset["loadError"] = "true"; alert.setAttribute("role", "alert"); root.prepend(alert); }
  alert.textContent = message;
}

function install(page: Active["page"], url: URL, progress: number) {
  root.innerHTML = page.html;
  document.documentElement.toggleAttribute("data-embedded", url.searchParams.has("embedded"));
  document.querySelector("h1")!.textContent = page.scene.title; document.title = page.scene.title;
  document.querySelector("#matrix-story > p")!.textContent = page.introduction;
  let player: ReturnType<typeof mountColumnPlayer> | undefined;
  player = mountColumnPlayer(root, page.scene, progress, value => {
    if (active && active.player === player) settle(value);
  });
  active = { page, url, player };
  root.dataset["sourceId"] = page.scene.env.product.id;
  delete root.dataset["gap"]; root.dataset["ready"] = "true";
  root.dataset["column"] = String(page.scene.column); root.setAttribute("aria-busy", "false");
}

async function navigate(url: URL, push: boolean) {
  if (disposed) return;
  const token = handoff.issue();
  const focus = document.activeElement instanceof HTMLAnchorElement && root.contains(document.activeElement)
    ? document.activeElement : undefined;
  if (push && active) settle(active.player.progress());
  navigating = true;
  active?.player.pause();
  root.setAttribute("aria-busy", "true");
  try {
    const progress = readColumnProgress(url.hash);
    if (active && sameColumnSelection(active.url, url)) {
      handoff.commit(token, () => {
        if (push) history.pushState(null, "", url);
        navigating = false;
        active!.url = url; active!.player.seek(progress);
        root.querySelector("[data-load-error]")?.remove(); root.setAttribute("aria-busy", "false");
      });
      return;
    }
    const page = await loadColumnPage(url);
    await document.fonts.ready;
    handoff.commit(token, () => {
      if (disposed) return;
      const restoreFocus = focus && document.activeElement === focus;
      const previous = active && { page: active.page, url: active.url, progress: active.player.progress() };
      active?.player.dispose(); active = undefined;
      try {
        install(page, url, progress);
        if (push) history.pushState(null, "", url);
        navigating = false; settle(progress);
        if (restoreFocus) [...root.querySelectorAll<HTMLAnchorElement>("a")].find(link => link.textContent === focus.textContent)?.focus({ preventScroll: true });
      } catch (error) {
        // Preparation needs connected native endpoints. If it fails after the
        // old view was released, restore its exact known source and held state.
        if (previous) {
          try { install(previous.page, previous.url, previous.progress); }
          catch { active = undefined; delete root.dataset["ready"]; }
        }
        navigating = false; showError(error);
      }
    });
  } catch (error) { handoff.commit(token, () => { navigating = false; showError(error); }); }
}

const click = (event: MouseEvent) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
  if (!link || link.target || link.hasAttribute("download")) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname) return;
  if (active?.url.searchParams.has("embedded")) url.searchParams.set("embedded", active.url.searchParams.get("embedded")!);
  if (link.closest("[data-column-navigation]") && active) url.hash = columnProgressHash(active.player.progress());
  event.preventDefault(); void navigate(url, true);
};
const restore = () => { void navigate(new URL(location.href), false); };
const pagehide = (event: PageTransitionEvent) => {
  handoff.invalidate();
  if (event.persisted) { navigating = false; active?.player.pause(); root.setAttribute("aria-busy", "false"); }
  else dispose();
};
const pageshow = (event: PageTransitionEvent) => { if (event.persisted) { active?.player.prepare(); restore(); } };
function dispose() {
  if (disposed) return; disposed = true;
  handoff.invalidate(); active?.player.dispose(); active = undefined;
  root.removeEventListener("click", click);
  window.removeEventListener("popstate", restore); window.removeEventListener("hashchange", restore);
  window.removeEventListener("pagehide", pagehide); window.removeEventListener("pageshow", pageshow);
}
root.addEventListener("click", click);
window.addEventListener("popstate", restore); window.addEventListener("hashchange", restore);
window.addEventListener("pagehide", pagehide); window.addEventListener("pageshow", pageshow);
import.meta.hot?.dispose(dispose);
restore();
