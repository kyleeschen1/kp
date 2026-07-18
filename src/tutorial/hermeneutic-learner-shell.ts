import type { KpTutorialClaimPacedFrame } from "./claim-paced-timeline.ts";
import type { KpHermeneuticTutorialModule } from "./hermeneutic-module.ts";

export interface KpHermeneuticLearnerShellInput {
  readonly module: KpHermeneuticTutorialModule;
  readonly frame: KpTutorialClaimPacedFrame;
  readonly graphHtml: string;
  readonly equationHtml: string;
  readonly claimText: string;
  readonly narrationText: string;
  readonly branchActive: boolean;
}

export function renderKpHermeneuticLearnerShell(
  input: KpHermeneuticLearnerShellInput
): string {
  const progress = String(input.frame.progress);
  return `<article class="kp-hermeneutic-tutorial" data-kp-hermeneutic-tutorial="${escapeHtml(input.module.id)}" data-kp-motion-profile="full" data-kp-tutorial-clock="${escapeHtml(input.module.clockId)}" data-kp-tutorial-progress="${progress}" data-kp-active-claim="${escapeHtml(input.frame.activeClaimId)}" data-kp-active-checkpoint="${escapeHtml(input.frame.activeCheckpointId)}">
  <style>${learnerShellCss}</style>
  <header class="kp-hermeneutic-header">
    <p class="kp-hermeneutic-kicker">Part ↔ whole</p>
    <h1>${escapeHtml(input.module.title)}</h1>
  </header>
  <div class="kp-hermeneutic-stage">
    <section class="kp-hermeneutic-graph" aria-label="Graph view" data-kp-tutorial-view="graph">${input.graphHtml}</section>
    <aside class="kp-hermeneutic-rail" aria-live="polite" data-kp-tutorial-view="claim-rail">
      <p class="kp-hermeneutic-claim">${escapeHtml(input.claimText)}</p>
      <div class="kp-hermeneutic-equation" data-kp-tutorial-view="equation">${input.equationHtml}</div>
      <p class="kp-hermeneutic-narration">${escapeHtml(input.narrationText)}</p>
    </aside>
  </div>
  <nav class="kp-hermeneutic-controls" aria-label="Tutorial playback">
    <button type="button" data-kp-tutorial-action="rewind" aria-label="Rewind tutorial">↶</button>
    <button type="button" data-kp-tutorial-action="play" aria-label="Play or pause tutorial">Play</button>
    <label><span>Timeline</span><input type="range" min="0" max="1" step="0.001" value="${progress}" data-kp-tutorial-action="scrub" /></label>
    <button type="button" data-kp-tutorial-action="inspect-part">Inspect part</button>
    <button type="button" data-kp-tutorial-action="inspect-whole">Return to whole</button>
    <button type="button" data-kp-tutorial-action="rejoin"${input.branchActive ? "" : " disabled"}>Rejoin</button>
  </nav>
</article>`;
}

const learnerShellCss = `
.kp-hermeneutic-tutorial{--kp-paper:#f7f3e8;--kp-ink:#16231d;--kp-accent:#df7047;background:var(--kp-paper);color:var(--kp-ink);border:1px solid color-mix(in srgb,var(--kp-ink) 18%,transparent);border-radius:18px;padding:clamp(14px,2vw,24px);overflow:clip;font-family:Inter,system-ui,sans-serif}
.kp-hermeneutic-header h1{font:600 clamp(1.4rem,3vw,2.3rem)/1.05 Georgia,serif;margin:.15rem 0 1rem}.kp-hermeneutic-kicker{color:var(--kp-accent);font-size:.72rem;font-weight:800;letter-spacing:.16em;margin:0;text-transform:uppercase}
.kp-hermeneutic-stage{display:grid;grid-template-columns:minmax(0,2fr) minmax(16rem,1fr);gap:clamp(12px,2vw,24px);align-items:stretch;overflow:clip}.kp-hermeneutic-graph,.kp-hermeneutic-rail{min-width:0;overflow:clip}.kp-hermeneutic-graph{background:#fffaf0;border-radius:14px;min-height:360px;padding:10px}.kp-hermeneutic-rail{align-content:center;border-left:2px solid color-mix(in srgb,var(--kp-accent) 45%,transparent);display:grid;gap:1rem;padding:1rem 0 1rem 1.25rem}.kp-hermeneutic-claim{font:600 1.15rem/1.4 Georgia,serif;margin:0}.kp-hermeneutic-narration{line-height:1.5;margin:0;opacity:.72}
.kp-hermeneutic-controls{align-items:center;display:flex;flex-wrap:wrap;gap:.55rem;margin-top:1rem;overflow:clip}.kp-hermeneutic-controls button{background:#fffaf0;border:1px solid color-mix(in srgb,var(--kp-ink) 22%,transparent);border-radius:999px;color:inherit;padding:.48rem .8rem}.kp-hermeneutic-controls label{align-items:center;display:flex;flex:1 1 15rem;gap:.5rem}.kp-hermeneutic-controls input{width:100%}
@media(max-width:760px){.kp-hermeneutic-stage{grid-template-columns:1fr}.kp-hermeneutic-rail{border-left:0;border-top:2px solid color-mix(in srgb,var(--kp-accent) 45%,transparent);padding:1rem 0 0}}
@media(prefers-reduced-motion:reduce){.kp-hermeneutic-tutorial *{scroll-behavior:auto!important;transition-duration:.001ms!important}}
`;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
