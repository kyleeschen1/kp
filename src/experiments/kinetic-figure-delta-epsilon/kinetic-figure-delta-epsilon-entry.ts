import "katex/dist/katex.min.css";
import "../../styles.css";
import "./kinetic-figure-delta-epsilon.css";

import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import { applyKpSemanticVisualDomTheme } from
  "../../rendering/semantic-visual-dom-theme.ts";
import { createKpReaderTimelinePlaybackClock } from
  "../../reader/runtime/timeline-playback-clock.ts";
import {
  projectKpFocusDeckControl,
  renderKpFocusDeckControlIcon
} from "../../tutorial/focus-deck-control-icons.ts";
import {
  adjacentKpDeltaEpsilonFocusDeckBeat,
  kpDeltaEpsilonEntityIds,
  kpDeltaEpsilonFocusDeckBeats,
  kpDeltaEpsilonFocusDeckHash,
  kpDeltaEpsilonMotionStartProgress,
  readKpDeltaEpsilonFocusDeckBeat,
  readKpDeltaEpsilonFocusDeckBeatFromHash,
  sampleKpDeltaEpsilonFocusDeckFrame,
  type KpDeltaEpsilonFocusDeckBeat,
  type KpDeltaEpsilonFocusDeckBeatId,
  type KpDeltaEpsilonFocusDeckFrame,
  type KpDeltaEpsilonFocusDeckLens
} from "./kinetic-figure-delta-epsilon-model.ts";

const durationMs = 4_600;
const progressTolerance = 0.001;
const viewport = Object.freeze({
  width: 640,
  height: 360,
  left: 54,
  right: 24,
  top: 26,
  bottom: 42,
  xMin: -0.2,
  xMax: 2.2,
  yMin: 0,
  yMax: 3.6
});

export interface KpDeltaEpsilonKineticFigureSession {
  dispose(): void;
}

export function mountKpDeltaEpsilonKineticFigure(input: {
  readonly root: HTMLElement;
}): KpDeltaEpsilonKineticFigureSession {
  applyKpSemanticVisualDomTheme({ root: input.root, theme: "light" });
  input.root.innerHTML = renderPage();
  const deck = requiredElement<HTMLElement>(
    input.root,
    "[data-kp-delta-epsilon-focus-deck]"
  );
  const compactStepsMedia = window.matchMedia("(max-width: 44rem)");
  const reducedMotionMedia = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  const stepsToggle = requiredElement<HTMLButtonElement>(
    deck,
    "[data-kp-focus-deck-steps-toggle]"
  );
  const playback = requiredElement<HTMLElement>(
    deck,
    "[data-kp-delta-epsilon-playback]"
  );
  const playButton = requiredElement<HTMLButtonElement>(
    playback,
    "[data-kp-delta-epsilon-play]"
  );
  const scrubber = requiredElement<HTMLInputElement>(
    playback,
    "[data-kp-delta-epsilon-scrubber]"
  );
  const clock = createKpReaderTimelinePlaybackClock({
    id: "clock.focus-deck.delta-epsilon-limit.v1",
    durationMs,
    initialProgress: 0,
    ownerWindow: window
  });
  let active = readKpDeltaEpsilonFocusDeckBeatFromHash(window.location.hash);
  let lens = readLens(window.location.search);
  let disposed = false;

  const projectStepsDisclosure = (expanded: boolean): void => {
    const effectiveExpanded = compactStepsMedia.matches ? expanded : true;
    deck.dataset["kpFocusDeckStepsExpanded"] = String(effectiveExpanded);
    stepsToggle.disabled = !compactStepsMedia.matches;
    stepsToggle.setAttribute("aria-expanded", String(effectiveExpanded));
  };

  const projectFrame = (frame: KpDeltaEpsilonFocusDeckFrame): void => {
    deck.dataset["kpDeltaEpsilonProgress"] = frame.progress.toFixed(4);
    deck.dataset["kpDeltaEpsilonPhase"] = frame.phase;
    deck.dataset["kpDeltaEpsilonActiveLens"] = frame.lens;
    for (const entityId of kpDeltaEpsilonEntityIds) {
      deck.querySelectorAll<HTMLElement>(
        `[data-kp-delta-epsilon-entity="${entityId}"]`
      ).forEach((element) => {
        element.dataset["kpSemanticSalienceLevel"] =
          frame.entitySalience[entityId];
      });
    }

    projectPresence(deck, "epsilon-band", frame.epsilonBandPresent);
    projectPresence(deck, "delta-window", frame.deltaWindowPresent);
    projectPresence(deck, "sample-point", frame.samplePointPresent);
    projectPresence(deck, "distance-relation", frame.relationPresent);
    projectPresence(deck, "formal-definition", frame.definitionPresent);

    const epsilonTop = mapY(2 + frame.epsilonRadius);
    const epsilonBottom = mapY(2 - frame.epsilonRadius);
    setRect(requiredElement<SVGRectElement>(
      deck,
      "[data-kp-delta-epsilon-epsilon-band]"
    ), viewport.left, epsilonTop, plotWidth(), epsilonBottom - epsilonTop);
    const deltaLeft = mapX(1 - frame.deltaRadius);
    const deltaRight = mapX(1 + frame.deltaRadius);
    setRect(requiredElement<SVGRectElement>(
      deck,
      "[data-kp-delta-epsilon-delta-window]"
    ), deltaLeft, viewport.top, deltaRight - deltaLeft, plotHeight());

    const sampleX = mapX(frame.sampleX);
    const sampleY = mapY(frame.sampleY);
    const sample = requiredElement<SVGCircleElement>(
      deck,
      "[data-kp-delta-epsilon-sample-point]"
    );
    sample.setAttribute("cx", format(sampleX));
    sample.setAttribute("cy", format(sampleY));
    const verticalGuide = requiredElement<SVGLineElement>(
      deck,
      "[data-kp-delta-epsilon-sample-guide-x]"
    );
    setLine(verticalGuide, sampleX, mapY(0), sampleX, sampleY);
    const horizontalGuide = requiredElement<SVGLineElement>(
      deck,
      "[data-kp-delta-epsilon-sample-guide-y]"
    );
    setLine(horizontalGuide, mapX(0), sampleY, sampleX, sampleY);

    scrubber.value = String(frame.progress);
    requiredElement<HTMLOutputElement>(
      playback,
      "[data-kp-delta-epsilon-progress-label]"
    ).value = `${Math.round(
      range(frame.progress, kpDeltaEpsilonMotionStartProgress, 1) * 100
    )}%`;
    projectPlaybackControl();
  };

  const projectPlaybackControl = (): void => {
    const status = clock.getStatus();
    const progress = clock.getSnapshot().progress;
    const playing = status === "playing";
    const replay = !playing && progress >= 1 - progressTolerance;
    projectKpFocusDeckControl({
      button: playButton,
      iconId: playing ? "pause" : replay ? "replay" : "play",
      accessibleLabel: playing
        ? "Pause transformation"
        : replay
          ? "Replay transformation"
          : progress > kpDeltaEpsilonMotionStartProgress + progressTolerance
            ? "Resume transformation"
            : "Play transformation"
    });
  };

  const projectLens = (): void => {
    deck.querySelectorAll<HTMLButtonElement>("[data-kp-delta-epsilon-lens]")
      .forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset["kpDeltaEpsilonLens"] === lens)
        );
      });
  };

  const projectBeat = (beat: KpDeltaEpsilonFocusDeckBeat): void => {
    deck.dataset["kpFocusDeckActiveBeat"] = beat.id;
    deck.querySelectorAll<HTMLDetailsElement>("[data-kp-focus-deck-beat]")
      .forEach((details) => {
        const selected = details.dataset["kpFocusDeckBeat"] === beat.id;
        details.open = selected;
        details.dataset["kpFocusDeckBeatActive"] = String(selected);
      });
    deck.querySelectorAll<HTMLButtonElement>("[data-kp-focus-deck-select]")
      .forEach((button) => {
        if (button.dataset["kpFocusDeckSelect"] === beat.id) {
          button.setAttribute("aria-current", "step");
        } else {
          button.removeAttribute("aria-current");
        }
      });
    const index = kpDeltaEpsilonFocusDeckBeats.findIndex(
      ({ id }) => id === beat.id
    );
    requiredElement<HTMLButtonElement>(
      deck,
      "[data-kp-focus-deck-previous]"
    ).disabled = index === 0;
    requiredElement<HTMLButtonElement>(
      deck,
      "[data-kp-focus-deck-next]"
    ).disabled = index === kpDeltaEpsilonFocusDeckBeats.length - 1;
    requiredElement<HTMLOutputElement>(
      deck,
      "[data-kp-focus-deck-position]"
    ).value = `Step ${beat.ordinal} of ${kpDeltaEpsilonFocusDeckBeats.length}`;
    playback.setAttribute("aria-hidden", String(!beat.ownsMotion));
    projectLens();
  };

  const updateLocation = (
    historyMode: "none" | "push" | "replace"
  ): void => {
    if (historyMode === "none") return;
    const url = new URL(window.location.href);
    url.hash = kpDeltaEpsilonFocusDeckHash(active.id);
    if (lens === "context") url.searchParams.delete("lens");
    else url.searchParams.set("lens", lens);
    if (url.href === window.location.href) return;
    if (historyMode === "push") history.pushState(null, "", url);
    else history.replaceState(null, "", url);
  };

  const select = (
    beat: KpDeltaEpsilonFocusDeckBeat,
    options: {
      readonly animate?: boolean;
      readonly history?: "none" | "push" | "replace";
    } = {}
  ): void => {
    active = beat;
    projectBeat(active);
    if (
      active.ownsMotion &&
      options.animate !== false &&
      !reducedMotionMedia.matches
    ) {
      clock.seek(kpDeltaEpsilonMotionStartProgress);
      clock.play({ direction: "forward", stopAt: active.progress });
    } else {
      clock.seek(active.progress, options.history === "none" ? "url" : "controls");
    }
    updateLocation(options.history ?? "push");
  };

  const selectAdjacent = (direction: -1 | 1): void => {
    const next = adjacentKpDeltaEpsilonFocusDeckBeat({
      beatId: active.id,
      direction
    });
    if (next.id !== active.id) select(next);
  };

  const handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("[data-kp-focus-deck-steps-toggle]") !== null) {
      projectStepsDisclosure(
        deck.dataset["kpFocusDeckStepsExpanded"] !== "true"
      );
      return;
    }
    const beatId = target?.closest<HTMLElement>("[data-kp-focus-deck-select]")
      ?.dataset["kpFocusDeckSelect"];
    if (isBeatId(beatId)) {
      select(readKpDeltaEpsilonFocusDeckBeat(beatId));
      if (compactStepsMedia.matches) projectStepsDisclosure(false);
      return;
    }
    const requestedLens = target?.closest<HTMLElement>(
      "[data-kp-delta-epsilon-lens]"
    )?.dataset["kpDeltaEpsilonLens"];
    if (requestedLens === "context" || requestedLens === "inspect") {
      lens = requestedLens;
      projectLens();
      projectFrame(sampleKpDeltaEpsilonFocusDeckFrame({
        beatId: active.id,
        lens,
        progress: clock.getSnapshot().progress
      }));
      updateLocation("replace");
      return;
    }
    if (target?.closest("[data-kp-focus-deck-previous]") !== null) {
      selectAdjacent(-1);
      return;
    }
    if (target?.closest("[data-kp-focus-deck-next]") !== null) {
      selectAdjacent(1);
      return;
    }
    if (target?.closest("[data-kp-delta-epsilon-play]") !== null) {
      if (clock.getStatus() === "playing") {
        clock.pause();
        projectPlaybackControl();
        return;
      }
      if (reducedMotionMedia.matches) {
        clock.seek(1);
        return;
      }
      if (clock.getSnapshot().progress >= 1 - progressTolerance) {
        clock.seek(kpDeltaEpsilonMotionStartProgress);
      }
      clock.play({ direction: "forward", stopAt: 1 });
    }
  };

  const handleInput = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    if (!event.target.matches("[data-kp-delta-epsilon-scrubber]")) return;
    clock.seek(Number(event.target.value));
  };

  const handleToggle = (event: Event): void => {
    const details = event.target instanceof HTMLDetailsElement
      ? event.target
      : null;
    const beatId = details?.dataset["kpFocusDeckBeat"];
    if (!details?.open || !isBeatId(beatId) || beatId === active.id) return;
    // Native find can reveal collapsed prose; reflect that reveal as a direct
    // semantic seek rather than leaving prose and the figure out of sync.
    select(readKpDeltaEpsilonFocusDeckBeat(beatId), {
      animate: false,
      history: "replace"
    });
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target instanceof HTMLInputElement) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectAdjacent(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      selectAdjacent(1);
    }
  };

  const restoreLocation = (): void => {
    active = readKpDeltaEpsilonFocusDeckBeatFromHash(window.location.hash);
    lens = readLens(window.location.search);
    projectBeat(active);
    clock.seek(active.progress, "url");
  };
  const handleCompactStepsChange = (): void => projectStepsDisclosure(false);
  const unsubscribe = clock.subscribe((sample) => projectFrame(
    sampleKpDeltaEpsilonFocusDeckFrame({
      beatId: active.id,
      lens,
      progress: sample.progress
    })
  ));

  deck.addEventListener("click", handleClick);
  deck.addEventListener("input", handleInput);
  deck.addEventListener("toggle", handleToggle, true);
  deck.addEventListener("keydown", handleKeyDown);
  window.addEventListener("popstate", restoreLocation);
  window.addEventListener("hashchange", restoreLocation);
  compactStepsMedia.addEventListener("change", handleCompactStepsChange);
  projectStepsDisclosure(false);
  projectBeat(active);
  clock.seek(active.progress, "url");

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      deck.removeEventListener("click", handleClick);
      deck.removeEventListener("input", handleInput);
      deck.removeEventListener("toggle", handleToggle, true);
      deck.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", restoreLocation);
      window.removeEventListener("hashchange", restoreLocation);
      compactStepsMedia.removeEventListener("change", handleCompactStepsChange);
      unsubscribe();
      clock.dispose();
    }
  };
}

function renderPage(): string {
  return `<main class="kp-delta-epsilon-page">
    <article class="kp-delta-epsilon-article">
      <header class="kp-delta-epsilon-page__header">
        <p class="kp-delta-epsilon-eyebrow">Focus Deck · Limits</p>
        <h1>Why a limit ignores the hole</h1>
      </header>
      <section class="kp-delta-epsilon-deck" data-kp-delta-epsilon-focus-deck data-kp-focus-deck-active-beat="read-limit" data-kp-focus-deck-steps-expanded="false" data-kp-delta-epsilon-active-lens="context" aria-label="Delta epsilon limit Focus Deck">
        <header class="kp-delta-epsilon-deck__header">
          <span>Kinetic Figure</span>
          <div class="kp-delta-epsilon-lens" role="group" aria-label="Figure detail lens">
            <button type="button" data-kp-delta-epsilon-lens="context" aria-pressed="true">Context</button>
            <button type="button" data-kp-delta-epsilon-lens="inspect" aria-pressed="false">Inspect</button>
          </div>
        </header>
        <div class="kp-delta-epsilon-deck__body">
          <nav class="kp-delta-epsilon-steps" aria-label="Figure steps">
            <header><button type="button" data-kp-focus-deck-steps-toggle aria-controls="kp-delta-epsilon-step-list" aria-expanded="false">
              <span>Steps</span>
              <output data-kp-focus-deck-position>Step 1 of ${kpDeltaEpsilonFocusDeckBeats.length}</output>
              <span class="kp-delta-epsilon-steps__mark" aria-hidden="true">▾</span>
            </button></header>
            <ol id="kp-delta-epsilon-step-list">
              ${kpDeltaEpsilonFocusDeckBeats.map((beat, index) => `<li>
                <button type="button" data-kp-focus-deck-select="${beat.id}"${index === 0 ? ' aria-current="step"' : ""}>
                  <span aria-hidden="true">${beat.ordinal}</span><span>${beat.label}</span>
                </button>
              </li>`).join("")}
            </ol>
          </nav>
          <div class="kp-delta-epsilon-deck__main">
            <figure class="kp-delta-epsilon-figure">
              <figcaption class="kp-delta-epsilon-visually-hidden">A punctured linear graph relates an epsilon output band to an equal delta input window.</figcaption>
              <div class="kp-delta-epsilon-stage">
                ${renderGraph()}
                <div class="kp-delta-epsilon-statement">
                  <div data-kp-delta-epsilon-entity="curve">${renderLatexToHtml("\\displaystyle \\lim_{x\\to 1}\\frac{x^2-1}{x-1}=2", { displayMode: false })}</div>
                  <div data-kp-delta-epsilon-entity="distance-relation" data-kp-presence="false">${renderLatexToHtml("\\left|f(x)-2\\right|=\\left|x-1\\right|", { displayMode: false })}</div>
                  <div data-kp-delta-epsilon-entity="formal-definition" data-kp-presence="false">${renderLatexToHtml("\\begin{gathered}\\forall\\varepsilon>0,\\;\\text{choose }\\delta=\\varepsilon\\\\0<|x-1|<\\delta\\;\\Longrightarrow\\;|f(x)-2|<\\varepsilon\\end{gathered}", { displayMode: false })}</div>
                </div>
                <div class="kp-delta-epsilon-playback" data-kp-delta-epsilon-playback aria-hidden="true">
                  <button type="button" data-kp-delta-epsilon-play aria-label="Play transformation" title="Play transformation">${renderKpFocusDeckControlIcon("play")}</button>
                  <label><span>Transformation progress</span><input type="range" min="${kpDeltaEpsilonMotionStartProgress}" max="1" step="0.001" value="${kpDeltaEpsilonMotionStartProgress}" data-kp-delta-epsilon-scrubber aria-label="Scrub transformation progress"/><output data-kp-delta-epsilon-progress-label>0%</output></label>
                </div>
              </div>
            </figure>
            <div class="kp-delta-epsilon-narrative" aria-label="Current explanation">
              ${kpDeltaEpsilonFocusDeckBeats.map((beat, index) => `<details data-kp-focus-deck-beat="${beat.id}"${index === 0 ? " open" : ""}>
                <summary class="kp-delta-epsilon-visually-hidden" tabindex="-1" aria-hidden="true">${beat.label}</summary>
                <div class="kp-delta-epsilon-copy">${renderBeatCopy(beat.id)}</div>
              </details>`).join("")}
            </div>
            <footer class="kp-delta-epsilon-navigation">
              <button type="button" data-kp-focus-deck-previous aria-label="Previous step" title="Previous step" disabled>${renderKpFocusDeckControlIcon("previous")}</button>
              <button type="button" data-kp-focus-deck-next aria-label="Next step" title="Next step">${renderKpFocusDeckControlIcon("next")}</button>
            </footer>
          </div>
        </div>
      </section>
    </article>
  </main>`;
}

function renderGraph(): string {
  const lineStart = [mapX(viewport.xMin), mapY(viewport.xMin + 1)];
  const lineEnd = [mapX(viewport.xMax), mapY(viewport.xMax + 1)];
  return `<svg class="kp-delta-epsilon-graph" viewBox="0 0 ${viewport.width} ${viewport.height}" role="img" aria-labelledby="kp-delta-epsilon-graph-title kp-delta-epsilon-graph-description">
    <title id="kp-delta-epsilon-graph-title">The graph of a function with a removable hole at x equals one</title>
    <desc id="kp-delta-epsilon-graph-description">The function follows the line y equals x plus one away from a hole at one comma two. Horizontal epsilon and vertical delta neighborhoods contract together.</desc>
    <rect class="kp-delta-epsilon-graph__band kp-delta-epsilon-graph__band--epsilon" data-kp-delta-epsilon-epsilon-band data-kp-delta-epsilon-entity="epsilon-band" data-kp-presence="false"/>
    <rect class="kp-delta-epsilon-graph__band kp-delta-epsilon-graph__band--delta" data-kp-delta-epsilon-delta-window data-kp-delta-epsilon-entity="delta-window" data-kp-presence="false"/>
    <g class="kp-delta-epsilon-graph__axes" data-kp-delta-epsilon-entity="curve">
      <line x1="${viewport.left}" y1="${format(mapY(0))}" x2="${viewport.width - viewport.right}" y2="${format(mapY(0))}"/>
      <line x1="${format(mapX(0))}" y1="${viewport.top}" x2="${format(mapX(0))}" y2="${viewport.height - viewport.bottom}"/>
    </g>
    <line class="kp-delta-epsilon-graph__curve" data-kp-delta-epsilon-entity="curve" x1="${format(lineStart[0]!)}" y1="${format(lineStart[1]!)}" x2="${format(lineEnd[0]!)}" y2="${format(lineEnd[1]!)}"/>
    <g class="kp-delta-epsilon-graph__sample" data-kp-delta-epsilon-entity="sample-point" data-kp-presence="false">
      <line data-kp-delta-epsilon-sample-guide-x/>
      <line data-kp-delta-epsilon-sample-guide-y/>
      <circle data-kp-delta-epsilon-sample-point r="3.5"/>
    </g>
    <circle class="kp-delta-epsilon-graph__hole" data-kp-delta-epsilon-entity="hole" cx="${format(mapX(1))}" cy="${format(mapY(2))}" r="5"/>
    ${mathLabel("x", viewport.width - 46, mapY(0) + 8, 28, 26, "axis-x")}
    ${mathLabel("f(x)", mapX(0) + 8, viewport.top + 2, 54, 28, "axis-y")}
    ${mathLabel("a=1", mapX(1) - 34, viewport.height - 34, 68, 28, "a")}
    ${mathLabel("L=2", mapX(0) + 6, mapY(2) - 17, 68, 30, "limit")}
    <g data-kp-delta-epsilon-entity="epsilon-band" data-kp-presence="false">${mathLabel("\\varepsilon", viewport.width - 62, mapY(2) - 15, 36, 30, "epsilon")}</g>
    <g data-kp-delta-epsilon-entity="delta-window" data-kp-presence="false">${mathLabel("\\delta", mapX(1) - 18, viewport.top + 4, 36, 30, "delta")}</g>
  </svg>`;
}

function renderBeatCopy(beatId: KpDeltaEpsilonFocusDeckBeatId): string {
  switch (beatId) {
    case "read-limit":
      return `<p>The quotient is undefined at ${inline("x=1")}, yet its nearby values follow ${inline("f(x)=x+1")}. The limit asks what those nearby outputs approach.</p>`;
    case "inspect-hole":
      return `<p>The open circle marks the excluded point. The condition ${inline("0<|x-1|")} deliberately looks around the hole, not at it.</p>`;
    case "set-output-challenge":
      return `<p>First choose any output tolerance ${inline("\\varepsilon>0")}. Success means forcing the graph into ${inline("|f(x)-2|<\\varepsilon")}.</p>`;
    case "choose-input-window":
      return `<p>Now restrict the input with ${inline("0<|x-1|<\\delta")}. The vertical window must be narrow enough to keep the corresponding outputs inside the horizontal band.</p>`;
    case "reintegrate-proof":
      return `<p>Away from the hole, ${inline("f(x)=x+1")}, so ${inline("|f(x)-2|=|x-1|")}. Choosing ${inline("\\delta=\\varepsilon")} makes the input condition deliver the output condition.</p>`;
  }
}

function mathLabel(
  latex: string,
  x: number,
  y: number,
  width: number,
  height: number,
  role: string
): string {
  return `<foreignObject class="kp-delta-epsilon-graph__math" data-kp-delta-epsilon-math-label="${role}" x="${format(x)}" y="${format(y)}" width="${width}" height="${height}" aria-hidden="true"><div xmlns="http://www.w3.org/1999/xhtml">${renderLatexToHtml(latex, { displayMode: false })}</div></foreignObject>`;
}

function inline(latex: string): string {
  return renderLatexToHtml(latex, { displayMode: false });
}

function projectPresence(
  root: ParentNode,
  entityId: string,
  present: boolean
): void {
  root.querySelectorAll<HTMLElement>(
    `[data-kp-delta-epsilon-entity="${entityId}"]`
  ).forEach((element) => {
    element.dataset["kpPresence"] = String(present);
  });
}

function readLens(search: string): KpDeltaEpsilonFocusDeckLens {
  return new URLSearchParams(search).get("lens") === "inspect"
    ? "inspect"
    : "context";
}

function isBeatId(value: string | undefined):
value is KpDeltaEpsilonFocusDeckBeatId {
  return kpDeltaEpsilonFocusDeckBeats.some(({ id }) => id === value);
}

function mapX(x: number): number {
  return viewport.left + (x - viewport.xMin) /
    (viewport.xMax - viewport.xMin) * plotWidth();
}

function mapY(y: number): number {
  return viewport.height - viewport.bottom - (y - viewport.yMin) /
    (viewport.yMax - viewport.yMin) * plotHeight();
}

function plotWidth(): number {
  return viewport.width - viewport.left - viewport.right;
}

function plotHeight(): number {
  return viewport.height - viewport.top - viewport.bottom;
}

function setRect(
  rect: SVGRectElement,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  rect.setAttribute("x", format(x));
  rect.setAttribute("y", format(y));
  rect.setAttribute("width", format(width));
  rect.setAttribute("height", format(height));
}

function setLine(
  line: SVGLineElement,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  line.setAttribute("x1", format(x1));
  line.setAttribute("y1", format(y1));
  line.setAttribute("x2", format(x2));
  line.setAttribute("y2", format(y2));
}

function range(value: number, start: number, end: number): number {
  return Math.max(0, Math.min(1, (value - start) / (end - start)));
}

function format(value: number): string {
  return String(Math.round(value * 1_000) / 1_000);
}

function requiredElement<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Missing ${selector}.`);
  return element;
}
