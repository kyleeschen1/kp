import { createCentroidMotion, sampleCentroidMotion, centroidStops, centroidNarration } from "../../animation/centroid-extraction-motion.ts";
import { renderKpTypeScriptTokenTheater } from "../../rendering/typescript-refactor-dom-session.ts";
import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { renderCentroidNativeCode } from "../../rendering/centroid-native-code-html.ts";
import { centroidReading } from "./centroid-reading.ts";
import { centroidClaims, projectCentroidAttention, validateCentroidClaims } from "./centroid-attention.ts";
import { createKpReaderSemanticFocusService } from "../../reader/runtime/semantic-focus.ts";

export function mountCentroidInspection(root: HTMLElement) {
  const require = <T extends HTMLElement>(selector: string) => {
    const node = root.querySelector<T>(selector);
    if (!node) throw new Error(`Missing centroid inspection element ${selector}`);
    return node;
  };
  const plan = createCentroidMotion();
  validateCentroidClaims(plan.artifact);
  const attention = createKpReaderSemanticFocusService(centroidClaims.map(claim => claim.id));
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
  const claims = centroidClaims.map(claim => ({ ...claim, button: require<HTMLButtonElement>(`[data-centroid-claim="${claim.id}"]`) }));
  const reasons = centroidReading.map((reason, index) => ({
    id: reason.id, position: centroidStops[index]!,
    element: require<HTMLElement>(`[data-centroid-reason="${reason.id}"]`),
    button: require<HTMLButtonElement>(`[data-centroid-select="${reason.id}"]`)
  }));
  if (reasons.some((reason, index) => reason.id !== plan.artifact.states[index]?.id)) throw new Error("Centroid reading and native checkpoints differ.");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const clock = createKpReaderTimelinePlaybackClock({ id: "centroid.first-loop", durationMs: 6000 });
  const render = () => {
    const p = clock.getSnapshot().progress;
    const frame = sampleCentroidMotion(plan, p);
    // Reserve the complete inspection once: native endpoint handoffs must not
    // move the slider or shift the prose below it.
    stage.style.setProperty("--centroid-lines", String(frame.theater.maxLineCount));
    renderKpTypeScriptTokenTheater(stage, frame.theater);
    if (stage.dataset["centroidNativeState"] !== frame.native.id) native.innerHTML = renderCentroidNativeCode(frame.native);
    native.style.opacity = frame.theater.active ? "0" : "1";
    stage.dataset["centroidNativeState"] = frame.native.id;
    const claimId = root.dataset["centroidInspecting"] === "true" ? attention.getSnapshot().objectRefs[0] : undefined;
    // Both native and transit owners receive the same semantic projection;
    // salience never changes their exclusive paint ownership or token geometry.
    stage.querySelectorAll<HTMLElement>("[data-kp-typescript-token-entity-id]").forEach(node => {
      node.dataset["centroidSalience"] = projectCentroidAttention(node.dataset["kpTypescriptTokenEntityId"]!, claimId);
    });
    claims.forEach(claim => claim.button.setAttribute("aria-pressed", String(claim.id === claimId)));
    const summary = claims.find(claim => claim.id === claimId)?.summary ?? "";
    if (description.textContent !== summary) description.textContent = summary;
    root.dataset["centroidProgress"] = String(p);
    seek.value = String(p);
    seek.setAttribute("aria-valuetext", `${Math.round(p * 100)} percent; ${centroidNarration[frame.beat]}`);
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
  open.addEventListener("click", () => { begin(figure.querySelector("figcaption")!); next.focus({ preventScroll: true }); }, options);
  reasons.forEach(reason => {
    reason.button.addEventListener("click", () => { begin(reason.element); clock.seek(reason.position); }, options);
  });
  claims.forEach(claim => {
    claim.button.addEventListener("click", event => {
      const inspecting = root.dataset["centroidInspecting"] === "true";
      begin(reasons[1]!.element);
      if (!inspecting) clock.seek(centroidStops[1]!);
      clock.pause();
      const selected = attention.getSnapshot().objectRefs[0] === claim.id;
      attention.clear("keyboard"); attention.clear("pointer");
      if (!selected) attention.set(event.detail === 0 ? "keyboard" : "pointer", [claim.id]);
    }, options);
    claim.button.disabled = false;
  });
  root.addEventListener("keydown", event => {
    if (event.key === "Escape") { attention.clear("keyboard"); attention.clear("pointer"); }
  }, options);
  const restore = () => {
    const reason = reasons.find(reason => location.hash === `#centroid-${reason.id}`);
    if (reason) { begin(reason.element); clock.seek(reason.position, "url"); }
  };
  window.addEventListener("hashchange", restore, options);
  close.addEventListener("click", () => {
    clock.pause(); delete root.dataset["centroidInspecting"];
    controls.hidden = true; stage.hidden = true; open.hidden = false; render();
    const destination = entry?.element.querySelector<HTMLButtonElement>("[data-centroid-select]") ?? open;
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
  render(); open.hidden = false; restore();
  return () => { abort.abort(); observer.disconnect(); size.disconnect(); offAttention(); attention.dispose(); off(); clock.dispose(); };
}
