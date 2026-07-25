import katex from "katex";

import "./glyph-reconciliation-review.css";
import {
  createKpCrowdedQuadraticGlyphReconciliationCase,
  createKpFractionMergeGlyphReconciliationCase,
  createKpQuadraticPlusMinusGlyphReconciliationCase,
  createKpSolveXGlyphReconciliationCase
} from "../animation/semantic-glyph-reconciliation-cases.ts";
import {
  compileKpGlyphReconciliationCase,
  type KpCompiledGlyphReconciliationCase
} from "../animation/semantic-glyph-reconciliation-compiler.ts";
import {
  observeKpNativeKatexFragments
} from "../rendering/native-katex-fragment-observer.ts";

interface ReviewCase {
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly sourceLatex: string;
  readonly targetLatex: string;
  readonly affordances: readonly string[];
  readonly compiled: KpCompiledGlyphReconciliationCase;
  readonly trace?: readonly string[] | undefined;
}

const root = document.querySelector<HTMLElement>("#glyph-experiment");
if (root === null) throw new Error("Glyph experiment root is missing.");

const crowdedViewport = innerWidth <= 760 ? "phone" : "wide";
const compiledCases = await Promise.all([
  compileKpGlyphReconciliationCase(createKpSolveXGlyphReconciliationCase()),
  compileKpGlyphReconciliationCase(createKpFractionMergeGlyphReconciliationCase()),
  compileKpGlyphReconciliationCase(
    createKpQuadraticPlusMinusGlyphReconciliationCase()
  ),
  compileKpGlyphReconciliationCase(
    createKpCrowdedQuadraticGlyphReconciliationCase(crowdedViewport)
  )
]);
const cases: readonly ReviewCase[] = [
  {
    id: "solve-x",
    eyebrow: "1 · one-to-one",
    title: "Persistent x clears the cancellation",
    description:
      "The x keeps semantic identity while the surrounding expression settles into its native target.",
    sourceLatex: "x+3-3=7-3",
    targetLatex: "x=7-3",
    affordances: ["hover", "annotation", "seek + rewind"],
    compiled: compiledCases[0]!
  },
  {
    id: "fraction-merge",
    eyebrow: "2 · many-to-one",
    title: "Two denominators merge",
    description:
      "Both source 2s visibly converge on one native denominator; the settled selector remains a valid Cloze target.",
    sourceLatex: "\\frac{a}{2}+\\frac{b}{2}",
    targetLatex: "\\frac{a+b}{2}",
    affordances: ["Cloze: denominator", "hover", "seek + rewind"],
    compiled: compiledCases[1]!
  },
  {
    id: "plus-minus",
    eyebrow: "3 · one-to-many",
    title: "Plus-minus opens two branches",
    description:
      "One semantic branch origin splits into stable minus and plus descendants without flattening the branch model.",
    sourceLatex: "x=\\pm\\sqrt{d}",
    targetLatex: "\\begin{aligned}x_-&=-\\sqrt{d}\\\\x_+&=+\\sqrt{d}\\end{aligned}",
    affordances: ["branch −", "branch +", "seek + rewind"],
    compiled: compiledCases[2]!
  },
  {
    id: "crowded-quadratic",
    eyebrow: `4 · crowded ${crowdedViewport}`,
    title: "Discriminant clears protected ink",
    description:
      "The same scheduler routes or honestly settles the discriminant merge while preserving the nearby plus-minus.",
    sourceLatex: "x=\\frac{-b\\pm\\sqrt{25-24}}{2a}",
    targetLatex: "x=\\frac{-b\\pm\\sqrt{1}}{2a}",
    affordances: ["responsive", "compressed trace", "drill-down"],
    trace: [
      "Read the discriminant components 25, −, and 24.",
      "Preserve the independent plus-minus branch origin.",
      "Merge the discriminant lineage into the exact radicand 1.",
      "Settle into native notation and retain branch interaction."
    ],
    compiled: compiledCases[3]!
  }
];

root.innerHTML = `
  <article class="glyph-review" data-kp-glyph-review data-kp-progress="0">
    <header>
      <p>Architecture experiment · complete four-case checkpoint</p>
      <h1>Semantic-constrained glyph reconciliation</h1>
      <p>One semantic-lineage matcher and one bounded geometry scheduler handle persistence, merge, split, and crowded responsive notation. Scrub once to compare the full family.</p>
    </header>
    <div class="glyph-review__controls">
      <button type="button" data-play>Play all</button>
      <input type="range" min="0" max="1000" value="0" aria-label="Animation progress for all four cases" data-progress>
      <output class="glyph-review__status" data-status>0%</output>
    </div>
    <section class="glyph-review__cases" aria-label="Four reconciliation pressure cases">
      ${cases.map(caseMarkup).join("")}
    </section>
    <div class="glyph-review__evidence">
      <span>4 semantic shapes</span>
      <span>1 matcher</span>
      <span>1 bounded scheduler</span>
      <span>0 operation-specific policies</span>
      <span>static JS</span>
      <span>headless-capable</span>
    </div>
  </article>`;

const review = root.querySelector<HTMLElement>("[data-kp-glyph-review]")!;
const slider = root.querySelector<HTMLInputElement>("[data-progress]")!;
const play = root.querySelector<HTMLButtonElement>("[data-play]")!;
const status = root.querySelector<HTMLOutputElement>("[data-status]")!;
let animationFrame: number | undefined;

const runtimes = cases.map((reviewCase) => {
  const card = root.querySelector<HTMLElement>(
    `[data-reconciliation-case="${reviewCase.id}"]`
  )!;
  const stage = card.querySelector<HTMLElement>("[data-case-stage]")!;
  const source = card.querySelector<HTMLElement>("[data-case-source]")!;
  const target = card.querySelector<HTMLElement>("[data-case-target]")!;
  const moving = new Map(
    [...card.querySelectorAll<HTMLElement>("[data-motion-id]")].map(
      (element) => [element.dataset["motionId"]!, element]
    )
  );
  const playback = reviewCase.compiled.createPlayback({
    supportedMatchIds: new Set(reviewCase.compiled.schedule.motions.map(
      ({ matchId }) => matchId
    )),
    apply(frame) {
      const element = moving.get(frame.matchId);
      if (element === undefined) return;
      const viewport = reviewCase.compiled.input.viewport;
      const x = (frame.x - viewport.x) / viewport.width * stage.clientWidth;
      const y = (frame.y - viewport.y) / viewport.height * stage.clientHeight;
      element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      element.style.opacity = String(frame.opacity);
      element.dataset["settled"] = String(frame.settled);
    }
  });
  return { reviewCase, source, target, moving, playback };
});

function render(progress: number): void {
  const bounded = Math.max(0, Math.min(1, progress));
  slider.value = String(Math.round(bounded * 1000));
  review.dataset["kpProgress"] = String(Math.round(bounded * 1000));
  status.value = `${Math.round(bounded * 100)}%`;
  runtimes.forEach(({ reviewCase, source, target, moving, playback }) => {
    const motionProgress = clamp((bounded - 0.12) / 0.7);
    source.style.opacity = String(1 - clamp((bounded - 0.08) / 0.22) * 0.82);
    target.style.opacity = String(clamp((bounded - 0.72) / 0.2));
    playback.seek(motionProgress);
    const motionEnvelope = Math.min(
      clamp((bounded - 0.06) / 0.12),
      1 - clamp((bounded - 0.86) / 0.12)
    );
    moving.forEach((element, matchId) => {
      const frameOpacity = Number(element.style.opacity || "1");
      element.style.opacity = String(frameOpacity * motionEnvelope);
      const targetGlyph = targetGlyphForMotion(reviewCase.compiled, matchId);
      if (bounded > 0.58 && targetGlyph !== undefined) {
        element.textContent = targetGlyph;
      } else {
        element.textContent =
          sourceGlyphForMotion(reviewCase.compiled, matchId) ?? "•";
      }
    });
  });
}

slider.addEventListener("input", () => render(Number(slider.value) / 1000));
play.addEventListener("click", () => {
  if (animationFrame !== undefined) {
    cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
    play.textContent = "Play all";
    return;
  }
  const reverse = Number(slider.value) >= 1000;
  const start = performance.now();
  const durationMs = Math.max(...cases.map(({ compiled }) =>
    compiled.input.durationMs
  ));
  play.textContent = "Pause";
  const tick = (now: number): void => {
    const elapsed = Math.min(1, (now - start) / durationMs);
    render(reverse ? 1 - elapsed : elapsed);
    if (elapsed < 1) animationFrame = requestAnimationFrame(tick);
    else {
      animationFrame = undefined;
      play.textContent = reverse ? "Play all" : "Rewind all";
    }
  };
  animationFrame = requestAnimationFrame(tick);
});

root.querySelectorAll<HTMLButtonElement>("[data-trace-toggle]").forEach(
  (button) => {
    button.addEventListener("click", () => {
      const trace = document.querySelector<HTMLOListElement>(
        `#${button.getAttribute("aria-controls")}`
      );
      if (trace === null) return;
      trace.hidden = !trace.hidden;
      button.setAttribute("aria-expanded", String(!trace.hidden));
      button.textContent = trace.hidden ? "Inspect compressed steps" : "Hide steps";
    });
  }
);

render(Number(new URL(location.href).searchParams.get("progress") ?? "0") / 1000);
if (import.meta.env.DEV) {
  Object.assign(window, {
    __kpObserveNativeKatexFragments: observeKpNativeKatexFragments
  });
  const { mountKpDevReview } = await import("../dev-review/review-bootstrap.ts");
  mountKpDevReview({
    provider: {
      id: "experiment.glyph-reconciliation",
      matches: () => true,
      capture: () => ({
        semantic: {
          documentId: "experiment.semantic-glyph-reconciliation",
          documentVersion: "1",
          assetId: "experiment.semantic-glyph-reconciliation.four-case",
          progressPermille: Number(review.dataset["kpProgress"] ?? "0"),
          activeTransformationIds: cases.map(
            ({ compiled }) => compiled.input.execution.transformationId
          ),
          focusRefs: [],
          playbackDirection: "forward"
        },
        render: {
          rendererId: "static-js-glyph-reconciliation",
          motionAuthority: "canonical-lineage-plus-bounded-clearance",
          fontReady: document.fonts.status === "loaded",
          ownerIds: cases.map(({ compiled }) => compiled.input.id)
        },
        temporalTrace: cases.map(({ id }, index) => ({
          offsetMs: index,
          progressPermille: Number(review.dataset["kpProgress"] ?? "0"),
          phase: id
        }))
      })
    },
    placement: (width) =>
      width >= 881 ? "left-prose-rail" : "captured-moment-sheet"
  });
}

function caseMarkup(reviewCase: ReviewCase): string {
  const operations =
    reviewCase.compiled.plan.operationCount +
    reviewCase.compiled.schedule.operationCount;
  return `
    <article class="glyph-review__case" data-reconciliation-case="${reviewCase.id}">
      <div class="glyph-review__case-copy">
        <p class="glyph-review__eyebrow">${reviewCase.eyebrow}</p>
        <h2>${reviewCase.title}</h2>
        <p>${reviewCase.description}</p>
      </div>
      <div class="glyph-review__viewport">
        <div class="glyph-review__stage" data-case-stage>
          <span class="glyph-review__math glyph-review__source" data-case-source>${math(reviewCase.sourceLatex)}</span>
          <span class="glyph-review__math glyph-review__target" data-case-target>${math(reviewCase.targetLatex)}</span>
          ${reviewCase.compiled.schedule.motions.map((motion) => `
            <span class="glyph-review__moving" data-motion-id="${motion.matchId}" data-kp-semantic-motion aria-hidden="true"></span>
          `).join("")}
        </div>
      </div>
      <div class="glyph-review__case-evidence">
        <span>${reviewCase.compiled.schedule.motions.length} glyph route${reviewCase.compiled.schedule.motions.length === 1 ? "" : "s"}</span>
        <span>${operations} operations</span>
        ${reviewCase.affordances.map((item) => `<span>${item}</span>`).join("")}
      </div>
      ${reviewCase.trace === undefined ? "" : `
        <button class="glyph-review__trace-toggle" type="button" aria-expanded="false" aria-controls="${reviewCase.id}-trace" data-trace-toggle>Inspect compressed steps</button>
        <ol class="glyph-review__trace" id="${reviewCase.id}-trace" hidden>
          ${reviewCase.trace.map((step) => `<li>${step}</li>`).join("")}
        </ol>
      `}
    </article>`;
}

function sourceGlyphForMotion(
  compiled: KpCompiledGlyphReconciliationCase,
  matchId: string
): string | undefined {
  const direct = compiled.matches.matches.find(({ id }) => id === matchId);
  if (direct !== undefined) {
    return compiled.input.sourceGlyphs.find(
      ({ id }) => id === direct.sourceGlyphId
    )?.glyphKey;
  }
  const group = compiled.matches.multiplicity.find(({ id }) =>
    matchId.startsWith(`${id}.`)
  );
  if (group === undefined) return undefined;
  const index = Number(matchId.slice(group.id.length + 1));
  const sourceId =
    group.kind === "merge" ? group.sourceGlyphIds[index] : group.sourceGlyphIds[0];
  return compiled.input.sourceGlyphs.find(({ id }) => id === sourceId)?.glyphKey;
}

function targetGlyphForMotion(
  compiled: KpCompiledGlyphReconciliationCase,
  matchId: string
): string | undefined {
  const direct = compiled.matches.matches.find(({ id }) => id === matchId);
  if (direct !== undefined) {
    return compiled.input.targetGlyphs.find(
      ({ id }) => id === direct.targetGlyphId
    )?.glyphKey;
  }
  const group = compiled.matches.multiplicity.find(({ id }) =>
    matchId.startsWith(`${id}.`)
  );
  if (group === undefined) return undefined;
  const index = Number(matchId.slice(group.id.length + 1));
  const targetId =
    group.kind === "split" ? group.targetGlyphIds[index] : group.targetGlyphIds[0];
  return compiled.input.targetGlyphs.find(({ id }) => id === targetId)?.glyphKey;
}

function math(latex: string): string {
  return katex.renderToString(latex, { throwOnError: true });
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
