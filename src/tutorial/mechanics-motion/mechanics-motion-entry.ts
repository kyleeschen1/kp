import "../../document-base.css";
import "../../rendering/focus-card-runtime.css";
import "../focus-deck-scaffold.css";
import "./mechanics-motion.css";
import { motionObservationExample } from "../../semantic/motion-observation.ts";
import { renderKpFocusDeckScaffold } from "../focus-deck-scaffold.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { createKpFocusDeckCheckpointPlayback } from "../focus-deck-checkpoint-playback.ts";
import { mountKpFocusDeckNativeInput } from "../focus-deck-native-input.ts";
import { bindKpFocusDeckKeyboard } from "../focus-deck-keyboard.ts";
import { applyKpSemanticVisualDomTheme } from "../../rendering/semantic-visual-dom-theme.ts";
import { checkMotionLesson, sampleMotionLesson } from "./mechanics-motion-sequence.ts";
import { renderMotionStage, mountMotionStage, motionRepresentation } from "./mechanics-motion-stage.ts";

const root = document.querySelector<HTMLElement>("#motion-app");
if (!root) throw new Error("Missing mechanics-motion host.");
const checked = checkMotionLesson(motionObservationExample);
if (checked.status !== "checked") throw new Error(`${checked.path}: ${checked.expected}`);
const lesson = checked.lesson;
// Theme the owner of the inherited stage aliases, not only its descendant.
applyKpSemanticVisualDomTheme({ root: root.closest<HTMLElement>(".motion-page") ?? root, theme: "light" });
root.innerHTML = renderKpFocusDeckScaffold({ id: "mechanics-motion", ariaLabel: "How do we describe motion?",
  activeBeatSlug: lesson.beats[0]!.slug, beats: lesson.beats.map(beat => ({ slug: beat.slug, title: beat.title, html: `<p>${beat.body}</p>` })),
  headerTrailingHtml: `<span data-motion-count>1 / ${lesson.beats.length}</span>`, stageHtml: renderMotionStage(lesson), replayHidden: false });
const get = <T extends Element>(selector: string): T => { const element = root.querySelector<T>(selector); if (!element) throw new Error(`Missing motion control ${selector}`); return element; };
const card = get<HTMLElement>("[data-kp-focus-deck]"), viewport = get<HTMLElement>("[data-kp-focus-deck-viewport]");
const shell = document.createElement("div"); shell.className = "motion-passage-shell";
get(".kp-focus-deck__card").prepend(shell); shell.append(viewport);
viewport.dataset["kpFocusDeckSnapDisabled"] = "true";
// Native scroll geometry remains the shared input transport. One stationary
// reading surface above it owns attention; it is never a second playhead.
const reading = document.createElement("section"); reading.className = "motion-reading kp-focus-deck__narrative";
reading.setAttribute("aria-label", "Current explanation");
reading.innerHTML = `<div class="kp-focus-deck__passage-page"><span data-motion-role data-kp-focus-deck-type="meta"></span><strong data-motion-title></strong><p data-motion-reading></p><p class="motion-cue" data-motion-cue></p></div>`;
shell.append(reading);
viewport.setAttribute("aria-hidden", "true"); viewport.tabIndex = -1;
const slider = get<HTMLInputElement>("[data-kp-focus-deck-scrubber]"), previous = get<HTMLButtonElement>("[data-kp-focus-deck-previous]"), next = get<HTMLButtonElement>("[data-kp-focus-deck-next]"), replay = get<HTMLButtonElement>("[data-kp-focus-deck-replay]");
const clock = createKpReaderTimelinePlaybackClock({ id: "clock.mechanics-motion", durationMs: 2400 * (lesson.beats.length - 1) });
const playback = createKpFocusDeckCheckpointPlayback(clock, lesson.checkpoints), stage = mountMotionStage(get("[data-motion-stage]"), lesson);
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let disposed = false, input: ReturnType<typeof mountKpFocusDeckNativeInput> | undefined;
const cancel = () => { input?.cancel(); playback.cancel(); clock.pause(); };
const render = () => {
  if (disposed) return;
  const frame = sampleMotionLesson(lesson, clock.getSnapshot().progress);
  stage.project(frame);
  const text = (selector: string, value: string) => { const el = get(selector); if (el.textContent !== value) el.textContent = value; };
  text("[data-motion-title]", frame.beat.title); text("[data-motion-reading]", frame.beat.body); text("[data-motion-cue]", frame.beat.cue);
  text("[data-motion-role]", frame.role); text("[data-motion-count]", frame.fraction);
  card.dataset["kpFocusDeckActiveBeat"] = frame.beat.slug; card.dataset["motionPhase"] = frame.attention.phaseKind;
  card.dataset["motionStep"] = String(frame.position); card.dataset["motionOperation"] = frame.operationId;
  slider.value = String(frame.position); slider.setAttribute("aria-valuetext", `${frame.fraction}: ${frame.beat.title}`);
  get<HTMLOutputElement>("[data-kp-focus-deck-position]").value = `${frame.fraction}: ${frame.beat.title}`;
  previous.disabled = frame.position <= 0; next.disabled = frame.position >= playback.last;
  if (!input?.ownsTravel()) viewport.scrollLeft = frame.position * viewport.clientWidth;
};
const navigate = (step: number) => { cancel(); playback.seek(step, !reduced.matches); };
const unsubscribe = clock.subscribe(render);
previous.onclick = () => navigate(Math.max(0, Math.ceil(playback.position()) - 1));
next.onclick = () => navigate(Math.min(playback.last, Math.floor(playback.position()) + 1));
replay.onclick = () => { cancel(); playback.seek(0); navigate(playback.last); };
slider.oninput = () => { cancel(); playback.seek(Number(slider.value)); };
const settle = () => playback.seek(Math.round(playback.position()), !reduced.matches, true);
slider.onchange = settle; slider.onpointerup = settle; slider.onpointercancel = settle;
const unbindKeyboard = bindKpFocusDeckKeyboard({ card, slider, enabled: () => !disposed, position: playback.position, checkpointCount: () => lesson.beats.length, navigate });
input = mountKpFocusDeckNativeInput({ viewport, region: card, enabled: () => !disposed, position: playback.position,
  begin: playback.begin, reduced: () => reduced.matches, interrupt: cancel });
const resize = () => { cancel(); render(); }, visibility = () => { if (document.hidden) cancel(); };
window.addEventListener("resize", resize); document.addEventListener("visibilitychange", visibility); reduced.addEventListener("change", resize);
const dispose = () => {
  if (disposed) return; disposed = true; input?.dispose(); playback.dispose(); unsubscribe(); unbindKeyboard(); stage.dispose(); clock.dispose();
  window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener("change", resize); window.removeEventListener("pagehide", pagehide);
};
const pagehide = (event: PageTransitionEvent) => { if (!event.persisted) dispose(); else cancel(); };
window.addEventListener("pagehide", pagehide);
if (import.meta.hot) import.meta.hot.dispose(dispose);
render(); card.dataset["kpFocusCardEnhancement"] = "ready"; card.dataset["motionRepresentation"] = motionRepresentation.id;

const table = document.querySelector<HTMLElement>("[data-motion-table]");
if (table) table.innerHTML = `<table><caption>The observed record (original zero)</caption><thead><tr><th scope="col">Time (s)</th><th scope="col">Position (m)</th></tr></thead><tbody>${lesson.compiled.record.value.observations.map(o => `<tr><td>${o.time}</td><td>${o.position}</td></tr>`).join("")}</tbody></table>`;
