import { renderLatexToHtml } from "../rendering/katex-adapter.ts";
import { createKpFtcFiniteQuotientProbe } from "./ftc-epistemic-probe.ts";
import { sampleKpFtcTutorialRuntime, type KpFtcTutorialRuntimeFrame } from "./ftc-runtime.ts";
import type { KpFtcFunctionLensId } from "./ftc-function-lens.ts";
import { renderKpHermeneuticLearnerShell } from "./hermeneutic-learner-shell.ts";
import { createKpFtcTutorialDefinition } from "./ftc-tutorial-module.ts";

export interface KpFtcTutorialSurfaceState {
  readonly progress: number;
  readonly direction: "forward" | "rewind";
  readonly lensId: KpFtcFunctionLensId;
  readonly upperBound: number;
  readonly branchActive: boolean;
}

const defaultState: KpFtcTutorialSurfaceState = {
  progress: 0,
  direction: "forward",
  lensId: "quadratic",
  upperBound: 2,
  branchActive: false
};

export function renderKpFtcTutorialSurface(
  state: Partial<KpFtcTutorialSurfaceState> = {}
): string {
  const resolved = { ...defaultState, ...state };
  return `<section data-kp-ftc-tutorial-host data-kp-motion-profile="full" data-kp-ftc-direction="${resolved.direction}" data-kp-ftc-lens="${resolved.lensId}" data-kp-ftc-upper-bound="${resolved.upperBound}" data-kp-ftc-branch-active="${resolved.branchActive}">${renderInner(resolved)}</section>`;
}

export function hydrateKpFtcTutorialSurfaces(root: ParentNode): void {
  root
    .querySelectorAll<HTMLElement>("[data-kp-ftc-tutorial-host]")
    .forEach((host) => hydrateHost(host));
}

function hydrateHost(host: HTMLElement): void {
  if (host.dataset["kpFtcHydrated"] === "true") return;
  host.dataset["kpFtcHydrated"] = "true";
  let playing = false;
  let lastTime = 0;
  let animationFrame = 0;

  const currentState = (): KpFtcTutorialSurfaceState => ({
    progress: Number(
      host.querySelector<HTMLElement>("[data-kp-hermeneutic-tutorial]")
        ?.dataset["kpTutorialProgress"] ?? 0
    ),
    direction:
      host.dataset["kpFtcDirection"] === "rewind" ? "rewind" : "forward",
    lensId: lensId(host.dataset["kpFtcLens"]),
    upperBound: Number(host.dataset["kpFtcUpperBound"] ?? 2),
    branchActive: host.dataset["kpFtcBranchActive"] === "true"
  });
  const update = (patch: Partial<KpFtcTutorialSurfaceState>) => {
    const next = { ...currentState(), ...patch };
    host.dataset["kpFtcDirection"] = next.direction;
    host.dataset["kpFtcLens"] = next.lensId;
    host.dataset["kpFtcUpperBound"] = String(next.upperBound);
    host.dataset["kpFtcBranchActive"] = String(next.branchActive);
    host.innerHTML = renderInner(next);
  };
  const stop = () => {
    playing = false;
    cancelAnimationFrame(animationFrame);
  };
  const tick = (time: number) => {
    if (!playing) return;
    if (lastTime === 0) lastTime = time;
    const state = currentState();
    const definition = createKpFtcTutorialDefinition();
    const delta = (time - lastTime) / definition.timeline.durationMs;
    lastTime = time;
    const progress = Math.min(1, state.progress + delta);
    update({ progress });
    if (progress >= 1) {
      stop();
      return;
    }
    animationFrame = requestAnimationFrame(tick);
  };

  host.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.dataset["kpTutorialAction"] === "scrub") {
      stop();
      update({ progress: Number(target.value) });
    }
    if (target.dataset["kpFtcAction"] === "upper-bound") {
      stop();
      update({ upperBound: Number(target.value), branchActive: true });
    }
  });
  host.addEventListener("change", (event) => {
    const target = event.target;
    if (
      target instanceof HTMLSelectElement &&
      target.dataset["kpFtcAction"] === "lens"
    ) {
      stop();
      update({ lensId: lensId(target.value), branchActive: true });
    }
  });
  host.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const action = target.closest<HTMLElement>("[data-kp-tutorial-action]")
      ?.dataset["kpTutorialAction"];
    switch (action) {
      case "play":
        if (playing) {
          stop();
        } else {
          playing = true;
          lastTime = 0;
          animationFrame = requestAnimationFrame(tick);
        }
        return;
      case "rewind": {
        stop();
        const state = currentState();
        update({
          direction: state.direction === "forward" ? "rewind" : "forward",
          progress: 1 - state.progress
        });
        return;
      }
      case "inspect-part":
        stop();
        update({ progress: 0.34 });
        return;
      case "inspect-whole":
        stop();
        update({ progress: 0 });
        return;
      case "rejoin":
        stop();
        update({ lensId: "quadratic", upperBound: 2, branchActive: false });
        return;
    }
  });
}

function renderInner(state: KpFtcTutorialSurfaceState): string {
  const definition = createKpFtcTutorialDefinition();
  const frame = sampleKpFtcTutorialRuntime(state);
  const pacedFrame = {
    timelineId: definition.timeline.id,
    clockId: definition.timeline.clockId,
    progress: state.progress,
    beat: state.progress * definition.timeline.beatCount,
    elapsedMs: state.progress * definition.timeline.durationMs,
    activeClaimId: frame.activeClaimId,
    activeCheckpointId: frame.activeCheckpointId,
    localProgress: frame.claimLocalProgress
  };
  const shell = renderKpHermeneuticLearnerShell({
    module: definition.module,
    frame: pacedFrame,
    graphHtml: renderGraph(frame, state),
    equationHtml: `<div data-kp-ftc-equation-stage="${escapeHtml(frame.equationStage)}" data-kp-ftc-proof-status="${escapeHtml(frame.proofStatus)}">${renderLatexToHtml(frame.equationLatex)}</div>`,
    claimText: frame.claimText,
    narrationText: frame.narrationText,
    branchActive: state.branchActive
  });

  return `${shell}${renderProbe(frame)}`;
}

function renderGraph(
  frame: KpFtcTutorialRuntimeFrame,
  state: KpFtcTutorialSurfaceState
): string {
  const width = 680;
  const height = 420;
  const padding = { left: 54, right: 24, top: 24, bottom: 46 };
  const project = ([x, y]: readonly [number, number]) => [
    padding.left +
      ((x - frame.accumulator.xDomain[0]) /
        (frame.accumulator.xDomain[1] - frame.accumulator.xDomain[0])) *
        (width - padding.left - padding.right),
    height -
      padding.bottom -
      ((y - frame.accumulator.yDomain[0]) /
        (frame.accumulator.yDomain[1] - frame.accumulator.yDomain[0])) *
        (height - padding.top - padding.bottom)
  ] as const;
  const convergenceVisible = [
    "claim.ftc.finite-strip",
    "claim.ftc.convergence",
    "claim.ftc.quotient",
    "claim.ftc.identity"
  ].includes(frame.activeClaimId);
  const boundsVisible = frame.activeClaimId === "claim.ftc.convergence";
  const curve = path(frame.accumulator.curvePoints.map(project));
  const area = polygon(frame.accumulator.areaPolygon.map(project));
  const strip = polygon(frame.convergence.strip.stripPolygon.map(project));
  const lower = polygon(frame.convergence.strip.lowerRectangle.map(project));
  const upper = polygon(frame.convergence.strip.upperRectangle.map(project));
  const upperBound = frame.accumulator.upperBoundSegment.map(project);
  const xPosition = project([frame.accumulator.upperBound, 0])[0];

  return `<div class="kp-ftc-graph-wrap" data-kp-ftc-graph-stage="${escapeHtml(frame.equationStage)}">
    <div class="kp-ftc-graph-controls">
      <label>Function lens<select data-kp-ftc-action="lens">
        ${option("quadratic", "t²", state.lensId)}${option("affine", "1 + t", state.lensId)}${option("sine-offset", "1 + sin t", state.lensId)}
      </select></label>
      <label>target x <input data-kp-ftc-action="upper-bound" type="range" min="0.75" max="2.25" step="0.25" value="${state.upperBound}" /></label>
    </div>
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="kp-ftc-graph-title kp-ftc-graph-description" data-kp-ftc-graph>
      <title id="kp-ftc-graph-title">Accumulated area and finite added strip</title>
      <desc id="kp-ftc-graph-description">A stable graph of the curated function. The filled area ends at x; a narrowing strip and honest bounding rectangles explain the difference quotient.</desc>
      <defs>
        <linearGradient id="kp-ftc-area-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ef936d" stop-opacity=".8"/><stop offset="1" stop-color="#f6d9a7" stop-opacity=".45"/></linearGradient>
        <filter id="kp-ftc-focus-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#9e3d24" flood-opacity=".28"/></filter>
      </defs>
      <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" class="kp-ftc-axis" data-kp-selector="ftc.graph.axes"/>
      <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" class="kp-ftc-axis"/>
      <path d="${area}" class="kp-ftc-area" data-kp-selector="ftc.graph.accumulated-area"/>
      <path d="${strip}" class="kp-ftc-strip" data-kp-selector="ftc.graph.added-strip" opacity="${convergenceVisible ? 1 : 0}"/>
      <path d="${upper}" class="kp-ftc-bound kp-ftc-bound--upper" opacity="${boundsVisible ? 0.28 : 0}"/>
      <path d="${lower}" class="kp-ftc-bound kp-ftc-bound--lower" opacity="${boundsVisible ? 0.42 : 0}"/>
      <path d="${curve}" class="kp-ftc-curve" data-kp-selector="ftc.graph.integrand-curve"/>
      <line x1="${upperBound[0]![0]}" y1="${upperBound[0]![1]}" x2="${upperBound[1]![0]}" y2="${upperBound[1]![1]}" class="kp-ftc-upper-bound" data-kp-selector="ftc.graph.upper-bound"/>
      <text x="${xPosition}" y="${height - 18}" text-anchor="middle" class="kp-ftc-label">x</text>
      <text x="${width - padding.right}" y="${height - 18}" text-anchor="end" class="kp-ftc-label">t</text>
      <text x="${padding.left + 8}" y="${padding.top + 12}" class="kp-ftc-label">f(t)</text>
    </svg>
    <style>
      .kp-ftc-graph-wrap{display:grid;gap:.55rem;height:100%;overflow:clip}.kp-ftc-graph-controls{display:flex;gap:1rem;justify-content:flex-end;flex-wrap:wrap}.kp-ftc-graph-controls label{align-items:center;display:flex;font-size:.75rem;font-weight:700;gap:.4rem}.kp-ftc-graph-controls select{max-width:8rem}.kp-ftc-graph-wrap svg{display:block;height:auto;max-height:410px;overflow:visible;width:100%}.kp-ftc-axis{stroke:#758078;stroke-width:1.5}.kp-ftc-area{fill:url(#kp-ftc-area-gradient);stroke:#df7047;stroke-width:1.5;transition:d .09s linear}.kp-ftc-strip{fill:#e65f43;filter:url(#kp-ftc-focus-shadow);stroke:#8b2e22;stroke-width:2;transform-box:fill-box;transform-origin:center;transition:d .09s linear,opacity .22s ease}.kp-ftc-bound{stroke-width:1.5;transition:d .09s linear,opacity .2s ease}.kp-ftc-bound--upper{fill:#6b9fdb;stroke:#32618f}.kp-ftc-bound--lower{fill:#75b984;stroke:#397446}.kp-ftc-curve{fill:none;stroke:#172d25;stroke-linecap:round;stroke-linejoin:round;stroke-width:4}.kp-ftc-upper-bound{stroke:#9e3d24;stroke-dasharray:5 4;stroke-width:2.5;transition:x1 .09s linear,x2 .09s linear,y2 .09s linear}.kp-ftc-label{fill:#33473f;font:600 15px Inter,system-ui,sans-serif}@media(prefers-reduced-motion:no-preference){[data-kp-motion-profile=full] .kp-ftc-strip{animation:kp-ftc-breathe 2.6s ease-in-out infinite alternate}@keyframes kp-ftc-breathe{to{filter:url(#kp-ftc-focus-shadow);transform:scale(1.012,.985)}}}
    </style>
  </div>`;
}

function renderProbe(frame: KpFtcTutorialRuntimeFrame): string {
  if (frame.activeClaimId !== "claim.ftc.convergence") return "";
  const probe = createKpFtcFiniteQuotientProbe();
  return `<details class="kp-ftc-probe" data-kp-ftc-epistemic-probe="${probe.id}"><summary>${escapeHtml(probe.prompt)} <span>Optional</span></summary><ul>${probe.options.map((option) => `<li data-kp-probe-validity="${option.validity}"><strong>${escapeHtml(option.label)}</strong><p>${escapeHtml(option.interpretation)}</p></li>`).join("")}</ul></details>`;
}

function path(points: readonly (readonly [number, number])[]): string {
  return points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${round(x)} ${round(y)}`)
    .join(" ");
}

function polygon(points: readonly (readonly [number, number])[]): string {
  return `${path(points)} Z`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function option(
  value: KpFtcFunctionLensId,
  label: string,
  selected: KpFtcFunctionLensId
): string {
  return `<option value="${value}"${value === selected ? " selected" : ""}>${label}</option>`;
}

function lensId(value: string | undefined): KpFtcFunctionLensId {
  return value === "affine" || value === "sine-offset" ? value : "quadratic";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
