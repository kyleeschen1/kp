import { createCentroidMotion, sampleCentroidMotion, centroidStops, centroidNarration } from "../../animation/centroid-extraction-motion.ts";
import { renderKpTypeScriptTokenTheater } from "../../rendering/typescript-refactor-dom-session.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { renderCentroidNativeCode } from "../../rendering/centroid-native-code-html.ts";
import { centroidReading } from "./centroid-reading.ts";
import { centroidClaims, projectCentroidAttention, validateCentroidClaims } from "./centroid-attention.ts";
import { createKpReaderSemanticFocusService } from "../../reader/runtime/semantic-focus.ts";
import { centroidBeatReading } from "./centroid-beats.ts";
import { mountCentroidTextRail, projectCentroidTextPosition } from "./centroid-text-rail.ts";
import { centroidMotionReading, centroidMotionThought } from "./centroid-motion-reading.ts";
import { mountCentroidFocus } from "./centroid-focus.ts";
import { mountCentroidCopy } from "./centroid-copy.ts";

export function mountCentroidInspection(root: HTMLElement) {
  const require = <T extends HTMLElement>(selector: string) => {
    const node = root.querySelector<T>(selector);
    if (!node) throw new Error(`Missing centroid inspection element ${selector}`);
    return node;
  };
  const plan = createCentroidMotion();
  validateCentroidClaims(plan.artifact);
  const attention = createKpReaderSemanticFocusService([...centroidClaims, ...centroidBeatReading].map(item => item.id));
  if (root.dataset["centroidSourcePin"] !== plan.artifact.sourcePin) throw new Error("Centroid source and motion differ. Regenerate checked evidence before inspection.");
  const open = require<HTMLButtonElement>("[data-centroid-open]");
  const close = require<HTMLButtonElement>("[data-centroid-close]");
  const controls = require<HTMLElement>("[data-centroid-controls]");
  const stage = require<HTMLElement>("[data-centroid-stage]");
  const native = require<HTMLElement>("[data-centroid-native]");
  const seek = require<HTMLInputElement>("[data-centroid-seek]");
  const previous = require<HTMLButtonElement>("[data-centroid-previous]");
  const next = require<HTMLButtonElement>("[data-centroid-next]");
  const output = require<HTMLOutputElement>("[data-centroid-position]");
  const figure = require<HTMLElement>("[data-centroid-evidence]");
  const description = require<HTMLElement>("[data-centroid-attention-description]");
  const claims = centroidClaims.flatMap(claim => [...root.querySelectorAll<HTMLButtonElement>(`[data-centroid-claim="${claim.id}"], [data-centroid-beat-claim="${claim.id}"]`)].map(button => ({ ...claim, button })));
  const beats = centroidBeatReading.map(beat => ({ ...beat, element: require<HTMLElement>(`[data-centroid-beat="${beat.id}"]`) }));
  const beatList = require<HTMLElement>("[data-centroid-beats]");
  const narrative = require<HTMLElement>("ol.centroid-narrative");
  const readingColumn = require<HTMLElement>("div.centroid-reading-column");
  const motionReading = new URL(location.href).searchParams.get("reading") === "motion";
  const thoughts = centroidMotionReading.map(thought => ({ ...thought,
    button: require<HTMLButtonElement>(`[data-centroid-thought="${thought.id}"]`)
  }));
  const reasons = centroidReading.map((reason, index) => ({
    id: reason.id, position: centroidStops[index]!,
    element: require<HTMLElement>(`[data-centroid-reason="${reason.id}"]`),
    button: require<HTMLButtonElement>(`[data-centroid-select="${reason.id}"]`)
  }));
  if (reasons.some((reason, index) => reason.id !== plan.artifact.states[index]?.id)) throw new Error("Centroid reading and native checkpoints differ.");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const clock = createKpReaderTimelinePlaybackClock({ id: "centroid.first-loop", durationMs: 6000 });
  let textRail: ReturnType<typeof mountCentroidTextRail> | undefined;
  let focusCard: ReturnType<typeof mountCentroidFocus> | undefined;
  let disposeCopy: (() => void) | undefined;
  const render = () => {
    const p = clock.getSnapshot().progress;
    focusCard?.render(p);
    const frame = sampleCentroidMotion(plan, p);
    const thought = centroidMotionThought(p);
    for (const item of thoughts) {
      const current = item.id === thought.id;
      item.button.closest("li")!.dataset["current"] = String(current);
      if (current) item.button.setAttribute("aria-current", "step");
      else item.button.removeAttribute("aria-current");
    }
    // Reserve the complete inspection once: native endpoint handoffs must not
    // move the slider or shift the prose below it.
    stage.style.setProperty("--centroid-lines", String(frame.theater.maxLineCount));
    renderKpTypeScriptTokenTheater(stage, frame.theater);
    if (stage.dataset["centroidNativeState"] !== frame.native.id) native.innerHTML = renderCentroidNativeCode(frame.native);
    native.style.opacity = frame.theater.active ? "0" : "1";
    native.style.userSelect = frame.theater.active ? "none" : "text";
    stage.dataset["centroidNativeState"] = frame.native.id;
    const claimId = root.dataset["centroidInspecting"] === "true" ? attention.getSnapshot().objectRefs[0] : undefined;
    const selectedBeat = beats.find(beat => beat.id === claimId);
    const selectedClaims = selectedBeat?.claims ?? (claimId === undefined ? [] : [claimId]);
    // Both native and transit owners receive the same semantic projection;
    // salience never changes their exclusive paint ownership or token geometry.
    stage.querySelectorAll<HTMLElement>("[data-kp-typescript-token-entity-id]").forEach(node => {
      node.dataset["centroidSalience"] = selectedClaims.length === 0 ? "normal" : selectedClaims.some(id => projectCentroidAttention(node.dataset["kpTypescriptTokenEntityId"]!, id) === "focus") ? "focus" : "context";
    });
    claims.forEach(claim => claim.button.setAttribute("aria-pressed", String(claim.id === claimId)));
    beats.forEach(beat => {
      const current = beat.id === (root.dataset["centroidFormat"] === "beats" && textRail ? projectCentroidTextPosition(textRail.getPosition()).beat.id : claimId);
      beat.element.dataset["centroidBeatCurrent"] = String(current);
    });
    const summary = selectedBeat?.text.replaceAll("`", "") ?? claims.find(claim => claim.id === claimId)?.summary ?? "";
    if (description.textContent !== summary) description.textContent = summary;
    root.dataset["centroidProgress"] = String(p);
    seek.value = String(p);
    seek.setAttribute("aria-valuetext", `${Math.round(p * 100)} percent; ${motionReading ? thought.title : centroidNarration[frame.beat]}`);
    output.value = `${frame.beat + 1} / 3`;
    for (const [index, reason] of reasons.entries()) {
      const current = root.dataset["centroidInspecting"] === "true" && index === frame.beat;
      reason.element.dataset["centroidCurrent"] = String(current);
      if (current) reason.button.setAttribute("aria-current", "step");
      else reason.button.removeAttribute("aria-current");
    }
    previous.disabled = p === 0; next.disabled = p === 1;
  };
  const off = clock.subscribe(render);
  const offAttention = attention.subscribe(render);
  const abort = new AbortController(), options = { signal: abort.signal };
  const move = (direction: "forward" | "rewind") => {
    const p = clock.getSnapshot().progress;
    const stopAt = direction === "forward" ? centroidStops.find(stop => stop > p + .00001) ?? 1 : centroidStops.filter(stop => stop < p - .00001).at(-1) ?? 0;
    if (reduced.matches) clock.seek(stopAt);
    else clock.play({ direction, stopAt });
  };
  let entry: { element: HTMLElement; top: number } | undefined;
  const begin = (origin: HTMLElement) => {
    if (root.dataset["centroidInspecting"] !== "true") entry = { element: origin, top: origin.getBoundingClientRect().top };
    root.dataset["centroidInspecting"] = "true";
    controls.hidden = false; stage.hidden = false; open.hidden = true;
    render();
  };
  const formatButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-centroid-format]")];
  const format = (mode: "paragraphs" | "beats") => {
    // Changing the editorial view preserves the clock and focus. If its entry
    // line is hidden, the visible reading column becomes the return anchor.
    if (entry) entry = { element: readingColumn, top: readingColumn.getBoundingClientRect().top };
    narrative.hidden = mode === "beats"; beatList.hidden = mode !== "beats";
    root.dataset["centroidFormat"] = mode;
    textRail?.stop();
    if (mode === "beats") textRail?.sync(clock.getSnapshot().progress);
    formatButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset["centroidFormat"] === mode)));
  };
  formatButtons.forEach(button => button.addEventListener("click", () => {
    format(button.dataset["centroidFormat"] === "beats" ? "beats" : "paragraphs");
    const url = new URL(location.href); url.searchParams.set("reading", root.dataset["centroidFormat"]!);
    history.replaceState(history.state, "", url);
  }, options));
  textRail = mountCentroidTextRail(beatList, pose => {
    begin(beatList); clock.pause();
    attention.clear("keyboard"); attention.clear("pointer"); attention.clear("url");
    attention.set("story", [pose.beat.id]);
    clock.seek(reduced.matches ? reasons.find(reason => reason.id === pose.beat.checkpoint)!.position : pose.codeProgress);
  });
  beats.forEach((beat, index) => {
    beat.element.addEventListener("click", event => {
      if (event.target instanceof Element && !event.target.closest("button, details, a")) textRail!.seek(index);
    }, options);
  });
  open.addEventListener("click", () => { begin(figure.querySelector("figcaption")!); (root.dataset["centroidFormat"] === "beats" ? textRail!.handle : next).focus({ preventScroll: true }); }, options);
  reasons.forEach(reason => {
    reason.button.addEventListener("click", () => { begin(reason.element); clock.seek(reason.position); }, options);
  });
  thoughts.forEach(thought => {
    thought.button.disabled = false;
    thought.button.addEventListener("click", () => {
      begin(figure);
      clock.pause();
      clock.seek(thought.position);
    }, options);
  });
  claims.forEach(claim => {
    claim.button.addEventListener("click", event => {
      const inspecting = root.dataset["centroidInspecting"] === "true";
      const originBeat = claim.button.closest<HTMLElement>("[data-centroid-beat]");
      const beat = beats.find(beat => beat.element === originBeat);
      begin(originBeat ?? reasons[1]!.element);
      if (!inspecting) clock.seek(reasons.find(reason => reason.id === (beat?.checkpoint ?? "extracted"))!.position);
      clock.pause();
      const selected = attention.getSnapshot().objectRefs[0] === claim.id;
      attention.clear("keyboard"); attention.clear("pointer");
      attention.clear("url");
      if (!selected) attention.set(event.detail === 0 ? "keyboard" : "pointer", [claim.id]);
    }, options);
    claim.button.disabled = false;
  });
  root.addEventListener("keydown", event => {
    if (event.key === "Escape") { attention.clear("keyboard"); attention.clear("pointer"); attention.clear("url"); }
  }, options);
  const restore = () => {
    attention.clear("keyboard"); attention.clear("pointer"); attention.clear("url");
    const beat = beats.find(beat => location.hash === `#centroid-${beat.id}`);
    if (beat) { format("beats"); textRail!.seek(beats.indexOf(beat)); return; }
    const reason = reasons.find(reason => location.hash === `#centroid-${reason.id}`);
    if (reason) { begin(reason.element); clock.seek(reason.position, "url"); }
  };
  window.addEventListener("hashchange", restore, options);
  close.addEventListener("click", () => {
    clock.pause(); delete root.dataset["centroidInspecting"];
    textRail?.stop();
    controls.hidden = true; stage.hidden = true; open.hidden = false; render();
    const destination = entry?.element.querySelector<HTMLButtonElement>('[data-centroid-format][aria-pressed="true"], [data-derivation-handle], [data-centroid-select]') ?? (root.dataset["centroidFormat"] === "beats" ? textRail!.handle : open);
    destination.focus({ preventScroll: true });
    if (entry) window.scrollBy({ top: entry.element.getBoundingClientRect().top - entry.top, behavior: "instant" });
    entry = undefined;
  }, options);
  previous.addEventListener("click", () => move("rewind"), options);
  next.addEventListener("click", () => move("forward"), options);
  seek.addEventListener("input", () => clock.seek(Number(seek.value)), options);
  controls.addEventListener("keydown", event => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home" || event.key === "End") clock.seek(event.key === "Home" ? 0 : 1);
    else move(event.key === "ArrowRight" ? "forward" : "rewind");
  }, options);
  const pause = () => { clock.pause(); render(); };
  reduced.addEventListener("change", pause, options);
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); }, options);
  const observer = new IntersectionObserver(entries => { if (!entries[0]?.isIntersecting) pause(); });
  observer.observe(root);
  // Sticky is a bounded layout affordance, never a source of semantic progress.
  // Large fonts or short windows disable it instead of clipping controls.
  const fit = () => { figure.dataset["stickyFit"] = String(figure.getBoundingClientRect().height + 32 < innerHeight); };
  const size = new ResizeObserver(fit); size.observe(figure);
  window.addEventListener("resize", fit, options);
  reasons.forEach(reason => { reason.button.hidden = false; });
  description.hidden = false;
  require<HTMLElement>("[data-centroid-reading-switch]").hidden = false;
  format(new URL(location.href).searchParams.get("reading") === "beats" ? "beats" : "paragraphs");
  render(); open.hidden = false; restore();
  if (motionReading) {
    root.dataset["centroidMotionReading"] = "true";
    readingColumn.hidden = true;
    require<HTMLElement>("[data-centroid-motion-reading]").hidden = false;
    close.hidden = true;
    begin(figure);
  }
  if (new URL(location.href).searchParams.get("reading") === "focus") {
    begin(figure);
    root.dataset["centroidMotionReading"] = "true";
    readingColumn.hidden = true;
    focusCard = mountCentroidFocus(require("[data-centroid-focus]"), stage, {
      progress: () => clock.getSnapshot().progress,
      seek: p => { clock.pause(); clock.seek(p); },
      travel: p => {
        const current = clock.getSnapshot().progress;
        clock.pause();
        if (reduced.matches || p === current) clock.seek(p);
        else clock.play({ direction: p > current ? "forward" : "rewind", stopAt: p });
      }
    });
    figure.hidden = true;
    disposeCopy = mountCentroidCopy(require("[data-centroid-focus]"), stage, () => {
      const p = clock.getSnapshot().progress;
      // A midpoint tie chooses the later complete version, independent of
      // travel direction. No partially introduced syntax becomes source.
      return plan.artifact.states[p < .25 ? 0 : p < .75 ? 1 : 2];
    }, () => {
      const p = clock.getSnapshot().progress;
      const stop = p < .25 ? 0 : p < .75 ? .5 : 1;
      clock.pause();
      if (p === stop) return false;
      clock.seek(stop);
      return true;
    });
  }
  return () => { disposeCopy?.(); focusCard?.dispose(); textRail?.dispose(); abort.abort(); observer.disconnect(); size.disconnect(); offAttention(); attention.dispose(); off(); clock.dispose(); };
}
