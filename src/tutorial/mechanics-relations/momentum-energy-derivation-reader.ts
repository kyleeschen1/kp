import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import type { mountMomentumEnergyDerivationSession } from "../../rendering/momentum-energy-derivation-session.ts";
import { energyDerivationFocus, sampleEnergyDerivationPresentation, resolveEnergyDerivationPosition } from "./energy-derivation-presentation.ts";

/** Page scroll never owns derivation progress. One shared-clock instance owns
 * the active move; completed lines are static historical records, not copies
 * participating in that move's semantic fan-out. */
export function enhanceEnergyDerivation(root: HTMLElement) {
  const get = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const stage = get<HTMLElement>("[data-derivation-stage]");
  const rows = [...root.querySelectorAll<HTMLElement>("[data-derivation-row]")];
  const clock = createKpReaderTimelinePlaybackClock({ id: "energy.derivation.clock", durationMs: 4400 });
  const abort = new AbortController(), opts = { signal: abort.signal };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let session: Awaited<ReturnType<typeof mountMomentumEnergyDerivationSession>> | undefined;
  let selected = 0, tracing = false, loading = false, generation = 0;
  let pendingSeek: number | undefined, seeking = false;
  let sourceTop = 0, rowDistance = 0;
  let anchors = [{ x: 0, y: 0 }, { x: 0, y: 0 }], pointerEnd = 0;
  const cue = get<HTMLElement>("[data-derivation-cue]");
  const pointer = root.querySelector<SVGSVGElement>("[data-derivation-pointer]")!;
  const previous = get<HTMLButtonElement>("[data-derivation-previous]"), next = get<HTMLButtonElement>("[data-derivation-next]");
  const slider = get<HTMLInputElement>("input"), count = get<HTMLOutputElement>("[data-derivation-count]");
  const status = get<HTMLElement>("[data-derivation-status]");
  const project = () => {
    const p = clock.getSnapshot().progress;
    if (!tracing || !session) return;
    const frame = sampleEnergyDerivationPresentation(p);
    // The host relocates one intact scene. Internal native/material ownership
    // remains exclusively compositor-owned, with co-located algebra endpoints.
    stage.style.transform = `translateY(${sourceTop + rowDistance * frame.carry}px)`;
    session.apply(frame.algebra);
    root.dataset["phase"] = frame.phase;
    root.dataset["algebraProgress"] = String(frame.algebra);
    cue.style.visibility = frame.callout ? "visible" : "hidden";
    pointer.toggleAttribute("hidden", !frame.callout || frame.phase === "act");
    const anchor = anchors[frame.algebra === 1 ? 1 : 0]!;
    pointer.querySelector("path")!.setAttribute("d", `M ${anchor.x} ${anchor.y} H ${pointerEnd}`);
    pointer.querySelector("circle")!.setAttribute("cx", String(anchor.x));
    pointer.querySelector("circle")!.setAttribute("cy", String(anchor.y));
    root.dataset["move"] = String(selected); root.dataset["progress"] = String(p);
    root.dataset["playing"] = String(clock.getStatus() === "playing");
    rows.forEach((row, i) => {
      const past = i < selected || (i === selected && frame.carry > .8);
      row.dataset["traceRole"] = past ? "historical" : i > selected + 1 || (i === selected + 1 && p === 0) ? "prospective" : "live";
      // A preview yields before the live expression enters its slot. It is a
      // prospective record, not another mathematical or material paint owner.
      row.dataset["visibleEquation"] = String(past || i > selected + 1 || (i === selected + 1 && p === 0));
    });
    const position = selected + p;
    root.dataset["derivationProgress"] = String(position);
    if (!seeking) slider.value = String(position);
    slider.setAttribute("aria-valuetext", Number.isInteger(position) ? `Equation ${position + 1}, ${position} of 3 moves completed` : `Move ${selected + 1} of 3, ${Math.round(p * 100)} percent`);
    root.querySelectorAll<HTMLButtonElement>("[data-derivation-checkpoint]").forEach(button => {
      if (Number(button.dataset["derivationCheckpoint"]) === position) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    count.value = `${selected + (p === 1 ? 1 : 0)} / 3 moves${p > 0 && p < 1 ? " · in progress" : ""}`;
    previous.disabled = selected === 0 && p === 0;
    next.disabled = selected === 2 && p === 1;
    next.textContent = clock.getStatus() === "playing" ? "Pause" : p === 1 ? "Next move" : "Next";
  };
  clock.subscribe(project);
  const retire = () => { generation++; session?.dispose(); session = undefined; };
  const read = () => {
    pendingSeek = undefined; clock.pause(); retire(); tracing = false; loading = false;
    root.dataset["tracing"] = "false"; stage.hidden = true;
    rows.forEach(row => { row.hidden = false; delete row.dataset["traceRole"]; delete row.dataset["visibleEquation"]; });
    get("[data-derivation-notes]").hidden = false; get("[data-derivation-key]").hidden = true; pointer.setAttribute("hidden", "");
    get("[data-derivation-cue]").hidden = true;
    get("[data-derivation-navigation]").hidden = true; get("[data-derivation-trace]").hidden = false;
    get("[data-derivation-scrub]").hidden = true; count.value = "";
  };
  async function mount(index: number, progress: number) {
    clock.pause(); retire(); const token = generation; loading = true;
    status.hidden = false; status.textContent = "Preparing this move…";
    try {
      const [{ mountMomentumEnergyDerivationSession }, { createEnergyDerivationPlan }, domain] = await Promise.all([
        import("../../rendering/momentum-energy-derivation-session.ts"),
        import("../../semantic/momentum-energy-derivation-plan.ts"),
        import("../../../domains/public-api.ts")
      ]);
      if (token !== generation) return;
      const checked = domain.checkMomentumEnergyDerivation(domain.momentumEnergyDerivationSource);
      if (checked.status !== "checked") throw new Error(checked.code);
      selected = index; tracing = true;
      root.dataset["tracing"] = "true";
      rows.forEach(row => { row.hidden = false; });
      get("[data-derivation-notes]").hidden = true; get("[data-derivation-key]").hidden = false;
      cue.replaceChildren(...[...get<HTMLElement>(`[data-derivation-reason="${index}"]`).childNodes].map(node => node.cloneNode(true)));
      cue.hidden = false;
      const template = get<HTMLTemplateElement>(`[data-derivation-template="${index}"]`);
      stage.replaceChildren(template.content.cloneNode(true)); stage.hidden = false;
      stage.style.top = "0px"; stage.style.transform = "none";
      sourceTop = rows[index]!.offsetTop;
      rowDistance = rows[index + 1]!.offsetTop - sourceTop;
      const target = get<HTMLElement>("[data-derivation-target]");
      target.style.top = "0px";
      const created = await mountMomentumEnergyDerivationSession(stage, createEnergyDerivationPlan(checked.model), index);
      if (token !== generation) { created.dispose(); return; }
      session = created;
      const stageRect = stage.getBoundingClientRect();
      const focus = energyDerivationFocus[index]!;
      anchors = [focus.source, focus.target].map(id => {
        const element = stage.querySelector<HTMLElement>(`[data-kp-semantic-entity-id="${id}"]`);
        if (!element) throw new Error(`Missing derivation callout target ${id}`);
        const box = element.getBoundingClientRect();
        return { x: box.right - stageRect.left + 3, y: sourceTop + rowDistance + box.top + box.height / 2 - stageRect.top };
      });
      pointerEnd = stageRect.width;
      cue.style.setProperty("--derivation-cue-top", `${sourceTop + rowDistance}px`);
      loading = false; status.hidden = true;
      get("[data-derivation-navigation]").hidden = false; get("[data-derivation-trace]").hidden = true;
      get("[data-derivation-scrub]").hidden = false;
      clock.seek(progress); project();
    } catch (error) {
      if (token !== generation) return;
      read(); root.dataset["repair"] = "true"; status.hidden = false;
      status.textContent = "This animation needs repair. The complete derivation is still available below.";
      console.error("Energy derivation repair", error);
    }
  }
  const play = (direction: "forward" | "rewind") => {
    if (reduced.matches) clock.seek(direction === "forward" ? 1 : 0);
    else clock.play({ direction, stopAt: direction === "forward" ? 1 : 0 });
    project();
  };
  get("[data-derivation-trace]").addEventListener("click", () => { if (!loading) void mount(0, 0); }, opts);
  next.addEventListener("click", async () => {
    if (loading) return;
    if (clock.getStatus() === "playing") { clock.pause(); project(); return; }
    if (clock.getSnapshot().progress === 1 && selected < 2) await mount(selected + 1, 0);
    if (session) play("forward");
  }, opts);
  previous.addEventListener("click", async () => {
    if (loading) return;
    if (clock.getSnapshot().progress === 0 && selected > 0) await mount(selected - 1, 1);
    if (session) play("rewind");
  }, opts);
  get("[data-derivation-replay]").addEventListener("click", () => { if (session && !loading) { clock.seek(0); play("forward"); } }, opts);
  get("[data-derivation-read]").addEventListener("click", read, opts);
  // Serialize native scene replacement and coalesce gesture samples. Dropping
  // input while loading makes backwards gestures appear to lock at boundaries.
  async function seekDerivation(position: number) {
    resolveEnergyDerivationPosition(position);
    clock.pause(); pendingSeek = position; slider.value = String(position);
    if (seeking) return;
    seeking = true;
    try {
      while (pendingSeek !== undefined && tracing) {
        const requested = pendingSeek; pendingSeek = undefined;
        const destination = resolveEnergyDerivationPosition(requested);
        if (session && !loading && destination.move === selected) clock.seek(destination.progress);
        else await mount(destination.move, destination.progress);
      }
    } finally { seeking = false; project(); }
  }
  slider.addEventListener("input", () => { void seekDerivation(Number(slider.value)); }, opts);
  root.querySelectorAll<HTMLButtonElement>("[data-derivation-checkpoint]").forEach(button => {
    button.addEventListener("click", () => { void seekDerivation(Number(button.dataset["derivationCheckpoint"])); }, opts);
  });
  const pause = () => { clock.pause(); project(); };
  // Expanding the justification is a request to read, not a race against the
  // automatic act phase. Continue with the existing Next control afterward.
  cue.addEventListener("toggle", event => { if (event.target instanceof HTMLDetailsElement && event.target.open) pause(); }, { ...opts, capture: true });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); }, opts);
  reduced.addEventListener("change", pause, opts);
  const visibility = new IntersectionObserver(entries => { if (!entries[0]?.isIntersecting) pause(); }); visibility.observe(root);
  // Our own cue/control disclosure changes height. Only available width
  // invalidates equation geometry; rebuilding on height could interrupt Next.
  let width = root.getBoundingClientRect().width;
  const resize = new ResizeObserver(entries => {
    const nextWidth = entries[0]?.contentRect.width;
    if (nextWidth === undefined || Math.abs(nextWidth - width) < .5) return;
    width = nextWidth;
    if (tracing && session && !loading) void mount(selected, clock.getSnapshot().progress);
  }); resize.observe(root);
  window.addEventListener("pagehide", event => { pause(); if (!event.persisted) { retire(); visibility.disconnect(); resize.disconnect(); abort.abort(); clock.dispose(); } }, opts);
  get("[data-derivation-controls]").hidden = false;
}
