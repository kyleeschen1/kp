import katex from "katex";

import "./glyph-reconciliation-review.css";
import { createKpSolveXGlyphReconciliationCase } from "../animation/semantic-glyph-reconciliation-cases.ts";
import { compileKpGlyphReconciliationCase } from "../animation/semantic-glyph-reconciliation-compiler.ts";

const root = document.querySelector<HTMLElement>("#glyph-experiment");
if (root === null) throw new Error("Glyph experiment root is missing.");

const compiled = await compileKpGlyphReconciliationCase(
  createKpSolveXGlyphReconciliationCase()
);
const matchId = compiled.schedule.motions[0]!.matchId;
root.innerHTML = `
  <article class="glyph-review" data-kp-glyph-review data-kp-progress="0">
    <header>
      <p>Architecture experiment · exemplar 1 of 4</p>
      <h1>Semantic-constrained glyph reconciliation</h1>
      <p>Compare an endpoint crossfade with the new path. The moving glyph is admitted by canonical lineage, measured after notation settlement, and routed by the common clearance scheduler.</p>
    </header>
    <section class="glyph-review__grid">
      <article class="glyph-review__panel">
        <h2>Baseline endpoint transition</h2>
        <p>Native states crossfade; identity is semantically correct but motion is not depicted.</p>
        <div class="glyph-review__viewport">
          <div class="glyph-review__stage">
            <span class="glyph-review__math glyph-review__baseline-source" data-baseline-source>${math("x+3-3=7-3")}</span>
            <span class="glyph-review__math glyph-review__baseline-target" data-baseline-target>${math("x=7-3")}</span>
          </div>
        </div>
      </article>
      <article class="glyph-review__panel">
        <h2>Lineage-constrained reconciliation</h2>
        <p>The semantic continuant moves gradually; settled notation remains native and interactive.</p>
        <div class="glyph-review__viewport">
          <div class="glyph-review__stage" data-new-stage>
            <span class="glyph-review__math glyph-review__source-rest" data-source-rest>${math("+3-3=7-3")}</span>
            <span class="glyph-review__math glyph-review__target-rest" data-target-rest>${math("=7-3")}</span>
            <span class="glyph-review__glyph" data-moving-glyph data-kp-semantic-entity-id="${compiled.input.sourceGlyphs[0]!.entityId}" aria-hidden="true">${math("x")}</span>
          </div>
        </div>
      </article>
    </section>
    <div class="glyph-review__controls">
      <button type="button" data-play>Play</button>
      <input type="range" min="0" max="1000" value="0" aria-label="Animation progress" data-progress>
      <output class="glyph-review__status" data-status>0%</output>
    </div>
    <div class="glyph-review__evidence">
      <span>${compiled.matches.matches.length} semantic match</span>
      <span>${compiled.schedule.motions[0]!.status} route</span>
      <span>${compiled.plan.operationCount + compiled.schedule.operationCount} planning operations</span>
      <span>seek + rewind</span>
      <span>static JS</span>
    </div>
  </article>`;

const review = root.querySelector<HTMLElement>("[data-kp-glyph-review]")!;
const slider = root.querySelector<HTMLInputElement>("[data-progress]")!;
const play = root.querySelector<HTMLButtonElement>("[data-play]")!;
const status = root.querySelector<HTMLOutputElement>("[data-status]")!;
const source = root.querySelector<HTMLElement>("[data-baseline-source]")!;
const target = root.querySelector<HTMLElement>("[data-baseline-target]")!;
const sourceRest = root.querySelector<HTMLElement>("[data-source-rest]")!;
const targetRest = root.querySelector<HTMLElement>("[data-target-rest]")!;
const moving = root.querySelector<HTMLElement>("[data-moving-glyph]")!;
const newStage = root.querySelector<HTMLElement>("[data-new-stage]")!;
let animationFrame: number | undefined;

const playback = compiled.createPlayback({
  supportedMatchIds: new Set([matchId]),
  apply(frame) {
    const x = frame.x * newStage.clientWidth / 640;
    moving.style.transform = `translate(${x}px, ${frame.y}px) translate(-50%, -50%)`;
    moving.style.opacity = String(frame.opacity);
  }
});

function render(progress: number): void {
  const bounded = Math.max(0, Math.min(1, progress));
  slider.value = String(Math.round(bounded * 1000));
  review.dataset["kpProgress"] = String(Math.round(bounded * 1000));
  status.value = `${Math.round(bounded * 100)}%`;
  source.style.opacity = String(1 - bounded);
  target.style.opacity = String(bounded);
  const reflow = Math.min(1, bounded / 0.3);
  sourceRest.style.opacity = String(bounded <= 0.7 ? 1 : Math.max(0, 1 - (bounded - 0.7) / 0.1));
  sourceRest.style.transform = `translateX(${reflow * 20.625}cqw)`;
  targetRest.style.opacity = String(bounded <= 0.8 ? 0 : Math.min(1, (bounded - 0.8) / 0.2));
  targetRest.style.transform = "none";
  playback.seek(Math.max(0, Math.min(1, (bounded - 0.2) / 0.6)));
}

slider.addEventListener("input", () => render(Number(slider.value) / 1000));
play.addEventListener("click", () => {
  if (animationFrame !== undefined) {
    cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
    play.textContent = "Play";
    return;
  }
  const reverse = Number(slider.value) >= 1000;
  const start = performance.now();
  play.textContent = "Pause";
  const tick = (now: number): void => {
    const elapsed = Math.min(1, (now - start) / compiled.input.durationMs);
    render(reverse ? 1 - elapsed : elapsed);
    if (elapsed < 1) animationFrame = requestAnimationFrame(tick);
    else {
      animationFrame = undefined;
      play.textContent = reverse ? "Play" : "Rewind";
    }
  };
  animationFrame = requestAnimationFrame(tick);
});

render(Number(new URL(location.href).searchParams.get("progress") ?? "0") / 1000);
if (import.meta.env.DEV) {
  const { mountKpDevReview } = await import("../dev-review/review-bootstrap.ts");
  mountKpDevReview({
    provider: {
      id: "experiment.glyph-reconciliation",
      matches: () => true,
      capture: () => ({
        semantic: {
          documentId: "experiment.semantic-glyph-reconciliation",
          documentVersion: "1",
          assetId: compiled.input.id,
          progressPermille: Number(review.dataset["kpProgress"] ?? "0"),
          activeTransformationIds: [compiled.input.execution.transformationId],
          focusRefs: [],
          playbackDirection: "forward"
        },
        render: {
          rendererId: "static-js-glyph-reconciliation",
          motionAuthority: "canonical-lineage-plus-bounded-clearance",
          fontReady: document.fonts.status === "loaded",
          ownerIds: [compiled.input.id]
        },
        temporalTrace: [{
          offsetMs: 0,
          progressPermille: Number(review.dataset["kpProgress"] ?? "0"),
          phase: "solve-x-one-to-one"
        }]
      })
    },
    placement: (width) => width >= 881 ? "left-prose-rail" : "captured-moment-sheet"
  });
}

function math(latex: string): string {
  return katex.renderToString(latex, { throwOnError: true });
}
