import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import type { PilotView } from "./model.ts";
import { SECTION_IDS, sectionEquation, type SectionState } from "./section.ts";

export const SECTION_CONTROLS = `
  <section id="section-controls" aria-label="Saddle cross-section" hidden>
    <div class="controls">
      <label><span>Plane <var>y</var> = <var>c</var></span><input id="section-y" type="range" min="-3" max="3" step="0.01" value="1" aria-label="Slice position"><output id="section-y-value">1.00</output></label>
      <button id="section-sweep">Sweep slice</button>
      <button id="section-inspect">Inspect in 2D</button>
    </div>
    <p class="section-equation" data-entity-id="${SECTION_IDS.equation}"><span>On this plane, </span><output id="section-equation"></output></p>
    <div class="controls inspection-control">
      <label><span>3D</span><input id="section-inspection" type="range" min="0" max="1" step="0.001" value="0" aria-label="Planar inspection progress"><span>2D</span></label>
      <span id="section-description">Follow the highlighted curve into its own plane.</span>
    </div>
  </section>`;

export function createSectionControls(options: {
  readonly host: HTMLElement;
  readonly read: () => PilotView;
  readonly update: (section: SectionState) => void;
  readonly beforeChange: () => void;
  readonly reduced: () => boolean;
  readonly available: () => boolean;
}) {
  const find = <T extends HTMLElement>(selector: string): T => {
    const element = options.host.querySelector<T>(selector);
    if (!element) throw new Error(`Missing section control ${selector}`);
    return element;
  };
  const y = find<HTMLInputElement>("#section-y"), progress = find<HTMLInputElement>("#section-inspection");
  const sweep = find<HTMLButtonElement>("#section-sweep"), inspect = find<HTMLButtonElement>("#section-inspect");
  const listeners = new AbortController();
  const scan = createKpReaderTimelinePlaybackClock({ id: "saddle-section:scan", durationMs: 7000, initialProgress: (options.read().section.y + 3) / 6 });
  const turn = createKpReaderTimelinePlaybackClock({ id: "saddle-section:inspection", durationMs: 1600, initialProgress: options.read().section.inspection });
  let destination: 0 | 1 = 1;
  function sync(): void {
    const view = options.read(), section = view.section;
    y.value = String(section.y); progress.value = String(section.inspection);
    find<HTMLOutputElement>("#section-y-value").value = section.y.toFixed(2);
    find<HTMLOutputElement>("#section-equation").value = sectionEquation(section.y, view.denominator);
    sweep.textContent = scan.getStatus() === "playing" ? "Pause slice" : "Sweep slice";
    sweep.disabled = !options.available();
    inspect.textContent = (turn.getStatus() === "playing" ? destination === 1 : section.inspection > 0) ? "Return to 3D" : "Inspect in 2D";
    find("#section-description").textContent = section.inspection === 1
      ? "Same curve, x and z coordinates. Return restores your camera angle."
      : section.inspection === 0 ? "Follow the highlighted curve into its own plane."
      : "The source stays fixed while we turn toward its section.";
    progress.setAttribute("aria-valuetext", section.inspection === 1 ? "2D section" : section.inspection === 0 ? "Saved 3D view" : `${Math.round(section.inspection * 100)}% toward 2D`);
  }
  const update = (part: Partial<SectionState>) => { options.update({ ...options.read().section, ...part }); sync(); };
  scan.subscribe((sample) => update({ y: sample.progress * 6 - 3 }));
  turn.subscribe((sample) => update({ inspection: sample.progress }));
  function pause(): void { scan.pause(); turn.pause(); sync(); }
  const listen = (element: HTMLElement, event: string, handler: () => void) => element.addEventListener(event, handler, { signal: listeners.signal });
  listen(y, "input", () => {
    const value = Number(y.value);
    options.beforeChange(); scan.seek((value + 3) / 6);
  });
  listen(progress, "input", () => {
    const value = Number(progress.value);
    options.beforeChange(); scan.pause(); turn.seek(value);
  });
  listen(sweep, "click", () => {
    options.beforeChange(); turn.pause();
    if (scan.getStatus() === "playing") { scan.pause(); sync(); return; }
    if (options.reduced()) { scan.seek(scan.getSnapshot().progress < 1 ? 1 : 0); return; }
    if (scan.getSnapshot().progress === 1) scan.seek(0);
    scan.play({ direction: "forward", stopAt: 1 }); sync();
  });
  listen(inspect, "click", () => {
    options.beforeChange(); scan.pause();
    destination = turn.getStatus() === "playing" ? (destination === 1 ? 0 : 1) : turn.getSnapshot().progress === 0 ? 1 : 0;
    if (options.reduced() || !options.available()) { turn.seek(destination); return; }
    turn.play({ direction: destination === 1 ? "forward" : "rewind", stopAt: destination }); sync();
  });
  sync();
  return {
    sync, pause, reset: () => { pause(); turn.seek(0); },
    inspect: () => ({ scan: scan.getStatus(), turn: turn.getStatus() }),
    dispose: () => { listeners.abort(); scan.dispose(); turn.dispose(); }
  };
}
