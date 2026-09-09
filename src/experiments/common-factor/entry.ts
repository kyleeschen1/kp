import "../authoring-distribution-focus-card/style.css";
import "../reusable-reasoning/style.css";
import "./style.css";
import { createKpCommonFactorExample } from "../../authoring/common-factor-author-check.ts";
import { prepareKpCommonFactorDraft, exportKpCommonFactorSource, type KpPreparedCommonFactorDraft } from "../../authoring/common-factor-draft.ts";
import { createKpCommonFactorAuthoringSession } from "../../authoring/common-factor-session.ts";
import { renderCommonFactorCard, commonFactorBeats } from "./page.ts";
import { mountCommonFactorNativeSurface } from "./native.ts";
import { createKpFocusDeckCheckpointPlayback } from "../../tutorial/focus-deck-checkpoint-playback.ts";
import { mountKpFocusDeckNativeInput } from "../../tutorial/focus-deck-native-input.ts";
import { bindKpFocusDeckKeyboard } from "../../tutorial/focus-deck-keyboard.ts";
import { resolveKpFocusDeckVisibleBeat } from "../../tutorial/focus-deck-beat-navigation.ts";

const root = document.querySelector<HTMLElement>("#authored-focus-card")!;
const report = (error: unknown) => {
  const output = root.querySelector<HTMLElement>("[data-common-factor-error]")!;
  output.hidden = false; output.textContent = error instanceof Error ? error.message : String(error);
  root.dataset["commonFactorStatus"] = "repair-gap";
};

async function mountCard(container: HTMLElement, draft: KpPreparedCommonFactorDraft) {
  const card = container.querySelector<HTMLElement>("[data-common-factor-card]")!;
  const surface = await mountCommonFactorNativeSurface(card, draft), clock = surface.clock;
  const playback = createKpFocusDeckCheckpointPlayback(clock, [0, 1]);
  const viewport = card.querySelector<HTMLElement>("[data-kp-focus-deck-viewport]")!;
  const slider = card.querySelector<HTMLInputElement>("[data-kp-focus-deck-scrubber]")!;
  const previous = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-previous]")!;
  const next = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-next]")!;
  const replay = card.querySelector<HTMLButtonElement>("[data-kp-focus-deck-replay]")!;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const beats = commonFactorBeats(draft);
  let disposed = false, visible = 0;
  let input: ReturnType<typeof mountKpFocusDeckNativeInput> | undefined;
  viewport.dataset["kpFocusDeckSnapDisabled"] = "true";
  const cancel = () => { input?.cancel(); playback.cancel(); };
  const render = () => {
    if (disposed) return;
    surface.render(reduced.matches);
    const position = playback.position();
    visible = resolveKpFocusDeckVisibleBeat(position, visible, playback.last);
    slider.value = String(position); slider.setAttribute("aria-valuetext", beats[visible]!.title);
    previous.disabled = position <= 0; next.disabled = position >= 1;
    card.dataset["kpFocusDeckActiveBeat"] = beats[visible]!.slug;
    card.querySelector<HTMLOutputElement>("[data-kp-focus-deck-position]")!.value = beats[visible]!.title;
    const counter = card.querySelector<HTMLElement>("[data-common-factor-count]")!;
    counter.textContent = `${visible + 1} / 2`; counter.setAttribute("aria-label", `Beat ${visible + 1} of 2`);
    viewport.querySelectorAll<HTMLElement>("[data-kp-focus-deck-beat]").forEach((item, index) => {
      item.dataset["kpFocusDeckBeatActive"] = String(index === visible);
      if (index === visible) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current");
    });
    if (!input?.ownsTravel()) viewport.scrollLeft = position * viewport.clientWidth;
  };
  const navigate = (step: number) => { cancel(); clock.pause(); surface.prepare(); playback.seek(step, !reduced.matches); };
  const unsubscribe = clock.subscribe(render);
  previous.onclick = () => navigate(0); next.onclick = () => navigate(1);
  replay.onclick = () => { cancel(); clock.seek(0); navigate(1); };
  slider.oninput = () => { cancel(); clock.pause(); clock.seek(Number(slider.value)); };
  const release = () => playback.seek(Math.round(playback.position()), !reduced.matches, true);
  slider.onchange = release; slider.onpointerup = release; slider.onpointercancel = release;
  const unbindKeyboard = bindKpFocusDeckKeyboard({ card, slider, enabled: () => !disposed,
    position: playback.position, checkpointCount: () => 2, navigate });
  input = mountKpFocusDeckNativeInput({ viewport, region: card, enabled: () => !disposed,
    position: playback.position, begin: playback.begin, reduced: () => reduced.matches, interrupt: cancel });
  const resize = () => { if (!disposed) { cancel(); clock.pause(); surface.resize(); render(); } };
  const visibility = () => { if (document.hidden) { cancel(); clock.pause(); } };
  const dispose = () => { if (disposed) return; disposed = true; input?.dispose(); playback.dispose(); unsubscribe(); unbindKeyboard(); surface.dispose();
    previous.onclick = null; next.onclick = null; replay.onclick = null;
    slider.oninput = null; slider.onchange = null; slider.onpointerup = null; slider.onpointercancel = null;
    window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener("change", resize); };
  window.addEventListener("resize", resize); document.addEventListener("visibilitychange", visibility); reduced.addEventListener("change", resize);
  render(); card.dataset["kpFocusCardEnhancement"] = "ready";
  return { card, clock, dispose, render, cancel };
}

async function mount() {
  const initial = prepareKpCommonFactorDraft(createKpCommonFactorExample());
  const display = root.querySelector<HTMLElement>("[data-common-factor-reader]")!;
  const editor = root.querySelector<HTMLTextAreaElement>("[data-reasoning-json]")!;
  const status = root.querySelector<HTMLElement>("[data-reasoning-draft-status]")!;
  const title = root.querySelector<HTMLElement>("[data-common-factor-title]")!;
  const setup = root.querySelector<HTMLElement>("[data-common-factor-setup]")!;
  const summary = root.querySelector<HTMLElement>("[data-common-factor-summary]")!;
  const revision = root.querySelector<HTMLElement>("[data-reasoning-revision]")!;
  let active = await mountCard(display, initial), disposed = false;
  const session = createKpCommonFactorAuthoringSession({ initial,
    prepare: async draft => {
      const staging = document.createElement("div"); staging.className = "common-factor-staging";
      staging.inert = true; staging.setAttribute("aria-hidden", "true"); staging.style.width = `${display.getBoundingClientRect().width}px`;
      staging.innerHTML = renderCommonFactorCard(draft); display.after(staging);
      try { const surface = await mountCard(staging, draft); return { staging, surface, dispose() { surface.dispose(); staging.remove(); } }; }
      catch (error) { staging.remove(); throw error; }
    },
    commit: (prepared, draft) => {
      const previous = active; previous.cancel(); previous.clock.pause();
      display.replaceChildren(...prepared.staging.childNodes); active = prepared.surface;
      prepared.staging.remove(); previous.dispose();
      title.textContent = draft.source.editorial.title; setup.textContent = draft.source.editorial.setup;
      summary.textContent = draft.source.editorial.summary; revision.textContent = draft.revisionId;
      root.dataset["commonFactorRevision"] = draft.revisionId;
    }
  });
  editor.value = exportKpCommonFactorSource(initial);
  editor.oninput = () => { session.invalidate(); status.textContent = "Draft changed. Apply to prepare a new displayed revision."; };
  root.querySelector<HTMLButtonElement>("[data-common-factor-apply]")!.onclick = async () => {
    status.textContent = "Checking and preparing…";
    const result = await session.apply(editor.value);
    if (disposed || result.status === "superseded") return;
    status.dataset["status"] = result.status;
    status.textContent = result.status === "applied" ? "Displayed revision updated." : `${result.diagnostic.code} at ${result.diagnostic.path}: ${result.diagnostic.expected}`;
  };
  root.querySelector<HTMLButtonElement>("[data-common-factor-download]")!.onclick = () => {
    const url = URL.createObjectURL(new Blob([exportKpCommonFactorSource(session.current())], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "common-factor.json"; link.click(); URL.revokeObjectURL(url);
  };
  const dispose = () => { if (disposed) return; disposed = true; session.dispose(); active.dispose(); editor.oninput = null; window.removeEventListener("pagehide", pagehide); };
  const pagehide = (event: PageTransitionEvent) => { if (event.persisted) { active.cancel(); active.clock.pause(); } else dispose(); };
  window.addEventListener("pagehide", pagehide); import.meta.hot?.dispose(dispose);
  root.dataset["commonFactorStatus"] = "ready"; root.dataset["commonFactorRevision"] = initial.revisionId;
}
void mount().catch(report);
