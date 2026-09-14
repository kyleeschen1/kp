import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import type { mountMomentumEnergyDerivationSession } from "../../rendering/momentum-energy-derivation-session.ts";

/** Page scroll never owns derivation progress. One shared-clock instance owns
 * the active move; completed lines are static historical records, not copies
 * participating in that move's semantic fan-out. */
export function enhanceEnergyDerivation(root: HTMLElement) {
  const get = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const stage = get<HTMLElement>("[data-derivation-stage]");
  const rows = [...root.querySelectorAll<HTMLElement>("[data-derivation-row]")];
  const clock = createKpReaderTimelinePlaybackClock({ id: "energy.derivation.clock", durationMs: 2200 });
  const abort = new AbortController(), opts = { signal: abort.signal };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let session: Awaited<ReturnType<typeof mountMomentumEnergyDerivationSession>> | undefined;
  let selected = 0, tracing = false, loading = false, generation = 0;
  const previous = get<HTMLButtonElement>("[data-derivation-previous]"), next = get<HTMLButtonElement>("[data-derivation-next]");
  const slider = get<HTMLInputElement>("input"), count = get<HTMLOutputElement>("[data-derivation-count]");
  const status = get<HTMLElement>("[data-derivation-status]");
  const project = () => {
    const p = clock.getSnapshot().progress;
    if (!tracing || !session) return;
    session.apply(p);
    root.dataset["move"] = String(selected); root.dataset["progress"] = String(p);
    root.dataset["playing"] = String(clock.getStatus() === "playing");
    rows.forEach((row, i) => {
      // History becomes visible only after the working expression departs.
      row.dataset["historical"] = String(i < selected || (i === selected && p > .25));
      row.dataset["visibleEquation"] = String(i < selected || (i === selected && p > .25));
      const reason = row.querySelector<HTMLElement>("[data-derivation-reason]");
      if (reason) reason.hidden = true;
    });
    slider.value = String(p);
    count.value = `${selected + (p === 1 ? 1 : 0)} / 3 moves${p > 0 && p < 1 ? " · in progress" : ""}`;
    previous.disabled = selected === 0 && p === 0;
    next.disabled = selected === 2 && p === 1;
    next.textContent = clock.getStatus() === "playing" ? "Pause" : p === 1 ? "Next move" : "Next";
  };
  clock.subscribe(project);
  const retire = () => { generation++; session?.dispose(); session = undefined; };
  const read = () => {
    clock.pause(); retire(); tracing = false; loading = false;
    root.dataset["tracing"] = "false"; stage.hidden = true;
    rows.forEach(row => { row.hidden = false; delete row.dataset["historical"]; delete row.dataset["visibleEquation"]; const reason = row.querySelector<HTMLElement>("[data-derivation-reason]"); if (reason) reason.hidden = false; });
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
      rows.forEach((row, i) => {
        row.hidden = i > index + 1;
        const reason = row.querySelector<HTMLElement>("[data-derivation-reason]");
        if (reason) reason.hidden = true;
      });
      const cue = get<HTMLElement>("[data-derivation-cue]");
      cue.replaceChildren(...[...get<HTMLElement>(`[data-derivation-reason="${index}"]`).childNodes].map(node => node.cloneNode(true)));
      cue.hidden = false;
      const template = get<HTMLTemplateElement>(`[data-derivation-template="${index}"]`);
      stage.replaceChildren(template.content.cloneNode(true)); stage.hidden = false;
      stage.style.top = `${rows[index]!.offsetTop}px`;
      const target = get<HTMLElement>("[data-derivation-target]");
      target.style.top = `${rows[index + 1]!.offsetTop - rows[index]!.offsetTop}px`;
      const created = await mountMomentumEnergyDerivationSession(stage, createEnergyDerivationPlan(checked.model), index);
      if (token !== generation) { created.dispose(); return; }
      session = created; loading = false; status.hidden = true;
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
  slider.addEventListener("input", () => { if (!loading) clock.seek(Number(slider.value)); }, opts);
  const pause = () => { clock.pause(); project(); };
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
