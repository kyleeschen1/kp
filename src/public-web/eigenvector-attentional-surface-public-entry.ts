import {
  createKpEigenvectorExperienceState,
  updateKpEigenvectorExperience,
  type KpEigenvectorExperienceEvent,
  type KpEigenvectorExperienceState
} from "../tutorial/eigenvector-attentional-surface/eigenvector-experience-state.ts";
import { projectKpEigenvectorDiagramEndpoint } from
  "../tutorial/eigenvector-attentional-surface/eigenvector-diagram.ts";
import {
  createKpEigenvectorTransitionPlan,
  sampleKpEigenvectorTransition,
  type KpEigenvectorMotionFrame
} from "../tutorial/eigenvector-attentional-surface/eigenvector-motion.ts";
import { projectKpEigenvectorAttentionCss } from
  "../tutorial/eigenvector-attentional-surface/eigenvector-attention.ts";
import {
  enhanceKpEigenvectorScrollSelection,
  kpEigenvectorReadingLineRatio,
  kpEigenvectorScrubDistanceRatio,
  type KpEigenvectorScrollProjection
} from "../tutorial/eigenvector-attentional-surface/eigenvector-scroll-selection.ts";
import {
  parseKpEigenvectorBeatHash,
  projectKpEigenvectorEndpoint,
  type KpEigenvectorBeatId,
  type KpEigenvectorEquationForm
} from "../tutorial/eigenvector-attentional-surface/eigenvector-endpoints.ts";
import {
  sampleKpEigenvectorScalarTransition
} from "../tutorial/eigenvector-attentional-surface/eigenvector-manipulation.ts";
import {
  projectKpEigenvectorSvgPoint
} from "../tutorial/eigenvector-attentional-surface/eigenvector-svg-geometry.ts";
import type { KpEigenvectorPoint } from
  "../tutorial/eigenvector-attentional-surface/eigenvector-math.ts";
import {
  renderKpEigenvectorTransportHtml
} from "../tutorial/eigenvector-attentional-surface/eigenvector-transport.ts";
import type { KpEigenvectorPredictionChoiceId } from
  "../tutorial/eigenvector-attentional-surface/eigenvector-prediction.ts";
import {
  decodeKpEigenvectorLocation,
  encodeKpEigenvectorLocation,
  paintKpEigenvectorDirectFocus
} from "../tutorial/eigenvector-attentional-surface/eigenvector-url.ts";

const root = document.querySelector<HTMLElement>("[data-kp-eigenvector-public]");
const stage = root?.querySelector<HTMLElement>(
  "[data-kp-eigenvector-endpoint]"
) ?? null;
const vectorLayer = root?.querySelector<SVGGElement>(
  ".kp-eigenvector-stage__vectors"
) ?? null;
const invariantLine = root?.querySelector<SVGLineElement>(
  ".kp-eigenvector-stage__invariant-line"
) ?? null;
const transportHost = root?.querySelector<HTMLElement>(
  "[data-kp-eigenvector-transport-host]"
) ?? null;
const announcer = root?.querySelector<HTMLElement>(
  "[data-kp-eigenvector-announcer]"
) ?? null;

if (root !== null && stage !== null && vectorLayer !== null &&
    invariantLine !== null && transportHost !== null) {
  let locationState = decodeKpEigenvectorLocation(window.location.href);
  let state = createKpEigenvectorExperienceState(locationState.beatId);
  let scalarAnimationFrame: number | undefined;
  let scalarAnimationRevision = 0;
  let renderedScalarOutput: KpEigenvectorPoint = state.scalar.output;
  let acceptsScrollProjection = false;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  root.style.setProperty(
    "--kp-eigen-reading-line",
    `${kpEigenvectorReadingLineRatio * 100}vh`
  );
  root.style.setProperty(
    "--kp-eigen-scrub-distance",
    `${kpEigenvectorScrubDistanceRatio * 100}vh`
  );

  const renderState = (nextState: KpEigenvectorExperienceState): void => {
    const endpoint = projectKpEigenvectorEndpoint(nextState.beatId);
    root.dataset["kpCurrentBeat"] = nextState.beatId;
    stage.dataset["kpEigenvectorEndpoint"] = nextState.beatId;
    stage.dataset["kpAttentionalOwner"] = endpoint.attentionalOwner;
    for (const [name, value] of Object.entries(projectKpEigenvectorAttentionCss({
      beatId: nextState.beatId,
      theme: "dark"
    }))) {
      root.style.setProperty(name, value);
    }
    for (const passage of root.querySelectorAll<HTMLElement>(
      "[data-kp-eigenvector-passage]"
    )) {
      const active = passage.dataset["kpEigenvectorPassage"] ===
        nextState.beatId;
      passage.classList.toggle("is-active", active);
      if (active) passage.setAttribute("aria-current", "step");
      else passage.removeAttribute("aria-current");
    }
    transportHost.innerHTML = renderKpEigenvectorTransportHtml(
      nextState.beatId
    );
    renderInteractionText(nextState);
    paintKpEigenvectorDirectFocus(root, locationState.focusObjectId);
  };

  const applyEvent = (
    event: KpEigenvectorExperienceEvent,
    history: "none" | "push" | "replace" = "none"
  ): void => {
    const update = updateKpEigenvectorExperience(state, event);
    state = update.state;
    renderState(state);
    for (const effect of update.effects) {
      if (effect.type === "announce" && announcer !== null) {
        announcer.textContent = effect.text;
      }
    }
    writeLocation(history);
  };

  const cancelScalarMotion = (): void => {
    scalarAnimationRevision += 1;
    if (scalarAnimationFrame !== undefined) {
      cancelAnimationFrame(scalarAnimationFrame);
      scalarAnimationFrame = undefined;
    }
  };

  /** Direct navigation is one complete projection and one synchronous paint. */
  const paintEndpoint = (beatId: KpEigenvectorBeatId): void => {
    cancelScalarMotion();
    const plan = createKpEigenvectorTransitionPlan(beatId, beatId);
    paintMotionFrame(sampleKpEigenvectorTransition({
      plan,
      progress: 1,
      reducedMotion: reducedMotion.matches
    }));
    if (beatId === "reveal-the-eigenspace") {
      paintScalarOutput(state.scalar.output);
    }
  };

  const paintMotionFrame = (sourceFrame: KpEigenvectorMotionFrame): void => {
    const frame = projectScalarStateIntoFrame(sourceFrame);
    const activeIds = new Set(frame.vectors.map(({ id }) => id));
    for (const line of vectorLayer.querySelectorAll<SVGLineElement>(
      "[data-kp-representation]"
    )) {
      const id = line.dataset["kpRepresentation"];
      if (id !== undefined && !activeIds.has(id)) {
        line.style.setProperty("--kp-eigen-presence", "0");
      }
    }
    for (const vector of frame.vectors) {
      const line = ensureVectorLine(
        vector.id,
        vector.semanticObjectId,
        vector.role
      );
      const [x2, y2] = projectKpEigenvectorSvgPoint(vector.coordinates);
      line.setAttribute("x2", String(x2));
      line.setAttribute("y2", String(y2));
      line.style.setProperty("--kp-eigen-presence", String(vector.presence));
      if (vector.id === "diagram.eigenvector-demo/vector/2v") {
        renderedScalarOutput = vector.coordinates;
      }
    }
    invariantLine.style.setProperty(
      "--kp-eigen-presence",
      String(frame.invariantLineProgress)
    );
    paintEquationFrame(frame);
    stage.dataset["kpEigenvectorEndpoint"] = frame.toBeatId;
    stage.dataset["kpTransitionProgress"] = String(frame.rawProgress);
    paintKpEigenvectorDirectFocus(root, locationState.focusObjectId);
  };

  const projectScalarStateIntoFrame = (
    frame: KpEigenvectorMotionFrame
  ): KpEigenvectorMotionFrame => {
    const scalarId = "diagram.eigenvector-demo/vector/2v";
    if (frame.fromBeatId !== "reveal-the-eigenspace" &&
        frame.toBeatId !== "reveal-the-eigenspace") {
      return frame;
    }
    const fromVector = projectKpEigenvectorDiagramEndpoint(frame.fromBeatId)
      .vectors.find(({ id }) => id === scalarId);
    const toVector = projectKpEigenvectorDiagramEndpoint(frame.toBeatId)
      .vectors.find(({ id }) => id === scalarId);
    const from = frame.fromBeatId === "reveal-the-eigenspace"
      ? state.scalar.output
      : fromVector?.displayed;
    const to = frame.toBeatId === "reveal-the-eigenspace"
      ? state.scalar.output
      : toVector?.displayed;
    if (from === undefined && to === undefined) return frame;
    const source = from ?? to!;
    const target = to ?? from!;
    const coordinates: KpEigenvectorPoint = frame.rawProgress === 0
      ? source
      : frame.rawProgress === 1
        ? target
        : [
            source[0] + (target[0] - source[0]) * frame.easedProgress,
            source[1] + (target[1] - source[1]) * frame.easedProgress
          ];
    return {
      ...frame,
      vectors: frame.vectors.map((vector) =>
        vector.id === scalarId ? { ...vector, coordinates } : vector
      )
    };
  };

  const ensureVectorLine = (
    id: string,
    semanticObjectId: string,
    role: "context" | "persistent" | "scalar-multiple"
  ): SVGLineElement => {
    const existing = [...vectorLayer.querySelectorAll<SVGLineElement>(
      "[data-kp-representation]"
    )].find((line) => line.dataset["kpRepresentation"] === id);
    if (existing !== undefined) return existing;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const [x1, y1] = projectKpEigenvectorSvgPoint([0, 0]);
    line.setAttribute("x1", String(x1));
    line.setAttribute("y1", String(y1));
    line.setAttribute("x2", String(x1));
    line.setAttribute("y2", String(y1));
    line.setAttribute("data-kp-representation", id);
    line.setAttribute("data-kp-semantic-object", semanticObjectId);
    line.setAttribute(
      "class",
      `kp-eigenvector-stage__vector kp-eigenvector-stage__vector--${role}`
    );
    const marker = root.querySelector<SVGMarkerElement>("marker");
    if (marker !== null) line.setAttribute("marker-end", `url(#${marker.id})`);
    vectorLayer.append(line);
    if (semanticObjectId === locationState.focusObjectId) {
      line.setAttribute("data-kp-direct-focus", "true");
    }
    return line;
  };

  const paintEquationFrame = (frame: KpEigenvectorMotionFrame): void => {
    const presences = new Map<KpEigenvectorEquationForm, number>();
    const setPresence = (
      form: KpEigenvectorEquationForm,
      presence: number
    ): void => {
      if (form === "none") return;
      presences.set(form, Math.max(presences.get(form) ?? 0, presence));
    };
    setPresence(frame.equation.fromForm, frame.equation.fromPresence);
    setPresence(frame.equation.toForm, frame.equation.toPresence);
    for (const equation of root.querySelectorAll<HTMLElement>(
      "[data-kp-equation-form]"
    )) {
      const form = equation.dataset["kpEquationForm"] as
        KpEigenvectorEquationForm | undefined;
      const presence = form === undefined ? 0 : presences.get(form) ?? 0;
      equation.hidden = presence <= 0;
      equation.style.opacity = String(presence);
    }
  };

  const renderInteractionText = (
    current: KpEigenvectorExperienceState
  ): void => {
    const feedback = root.querySelector<HTMLElement>(
      "[data-kp-eigenvector-prediction-feedback]"
    );
    if (feedback !== null) {
      feedback.textContent = current.prediction?.feedback ?? "";
    }
    const coefficient = root.querySelector<HTMLElement>(
      "[data-kp-eigenvector-coefficient-output]"
    );
    if (coefficient !== null) {
      coefficient.textContent = String(current.scalar.coefficient);
    }
    const scalarFeedback = root.querySelector<HTMLElement>(
      "[data-kp-eigenvector-scalar-feedback]"
    );
    if (scalarFeedback !== null) {
      scalarFeedback.textContent = current.scalar.explanation;
    }
  };

  const paintScalarOutput = (output: KpEigenvectorPoint): void => {
    const scalarLine = ensureVectorLine(
      "diagram.eigenvector-demo/vector/2v",
      "eigenvector-demo/vector/v",
      "scalar-multiple"
    );
    const [x2, y2] = projectKpEigenvectorSvgPoint(output);
    scalarLine.setAttribute("x2", String(x2));
    scalarLine.setAttribute("y2", String(y2));
    scalarLine.style.setProperty("--kp-eigen-presence", "1");
    renderedScalarOutput = output;
  };

  const retargetScalar = (
    from: KpEigenvectorPoint,
    to: KpEigenvectorPoint
  ): void => {
    cancelScalarMotion();
    const revision = scalarAnimationRevision;
    const durationMs = reducedMotion.matches ? 0 : 240;
    if (durationMs === 0) {
      paintScalarOutput(to);
      return;
    }
    const startedAt = performance.now();
    const tick = (now: number): void => {
      if (revision !== scalarAnimationRevision) return;
      const frame = sampleKpEigenvectorScalarTransition({
        from,
        to,
        progress: Math.min(1, (now - startedAt) / durationMs)
      });
      paintScalarOutput(frame.output);
      if (!frame.settled) scalarAnimationFrame = requestAnimationFrame(tick);
      else scalarAnimationFrame = undefined;
    };
    scalarAnimationFrame = requestAnimationFrame(tick);
  };

  const writeLocation = (mode: "none" | "push" | "replace"): void => {
    locationState = { ...locationState, beatId: state.beatId };
    if (mode === "none") return;
    const href = encodeKpEigenvectorLocation(
      window.location.href,
      locationState
    );
    if (href === window.location.href) return;
    window.history[mode === "push" ? "pushState" : "replaceState"](
      null,
      "",
      href
    );
  };

  const directSelect = (
    beatId: KpEigenvectorBeatId,
    history: "none" | "push" | "replace"
  ): void => {
    applyEvent({ type: "select-beat", beatId }, history);
    paintEndpoint(beatId);
  };

  const restoreLocation = (): void => {
    const restored = decodeKpEigenvectorLocation(window.location.href);
    locationState = restored;
    document.getElementById(restored.beatId)?.scrollIntoView({
      behavior: "auto",
      block: "start"
    });
    directSelect(restored.beatId, "none");
  };

  const paintScrollProjection = (
    projection: KpEigenvectorScrollProjection
  ): void => {
    cancelScalarMotion();
    if (state.beatId !== projection.toBeatId) {
      applyEvent(
        { type: "select-beat", beatId: projection.toBeatId },
        "replace"
      );
    }
    const plan = createKpEigenvectorTransitionPlan(
      projection.fromBeatId,
      projection.toBeatId
    );
    paintMotionFrame(sampleKpEigenvectorTransition({
      plan,
      progress: projection.progress,
      reducedMotion: reducedMotion.matches
    }));
    if (projection.settled && projection.toBeatId === "reveal-the-eigenspace") {
      paintScalarOutput(state.scalar.output);
    }
  };

  root.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const transport = target?.closest<HTMLAnchorElement>(
      "[data-kp-eigenvector-previous], [data-kp-eigenvector-next]"
    );
    if (transport !== null && transport !== undefined) {
      event.preventDefault();
      const beatId = parseKpEigenvectorBeatHash(transport.hash);
      if (beatId === undefined) return;
      document.getElementById(beatId)?.scrollIntoView({
        behavior: "auto",
        block: "start"
      });
      directSelect(beatId, "push");
      return;
    }
    const prediction = target?.closest<HTMLButtonElement>(
      "[data-kp-eigenvector-prediction-choice]"
    );
    if (prediction !== null && prediction !== undefined) {
      const choice = prediction.dataset["kpEigenvectorPredictionChoice"];
      const choiceId = (["maps-to-6v", "maps-to-3v", "changes-direction"] as const)
        .find((candidate) => candidate === choice);
      if (choiceId !== undefined) {
        applyEvent({
          type: "answer-prediction",
          choiceId: choiceId satisfies KpEigenvectorPredictionChoiceId
        }, "push");
        paintEndpoint(state.beatId);
      }
    }
  });

  root.addEventListener("input", (event) => {
    const input = event.target instanceof HTMLInputElement &&
      event.target.matches("[data-kp-eigenvector-scalar-input]")
      ? event.target
      : null;
    if (input === null) return;
    const enteringManipulation = state.beatId !== "reveal-the-eigenspace";
    const from = renderedScalarOutput;
    applyEvent({
      type: "set-scalar",
      coefficient: Number(input.value)
    }, "replace");
    if (enteringManipulation) {
      paintEndpoint(state.beatId);
      paintScalarOutput(from);
    }
    retargetScalar(from, state.scalar.output);
  });

  renderState(state);
  paintEndpoint(state.beatId);
  const hashBeatId = parseKpEigenvectorBeatHash(window.location.hash);
  if (hashBeatId !== undefined) {
    document.getElementById(hashBeatId)?.scrollIntoView({
      behavior: "auto",
      block: "start"
    });
  }
  enhanceKpEigenvectorScrollSelection({
    root,
    viewportHeight: () => window.innerHeight,
    reducedMotion: () => reducedMotion.matches,
    onProjection: (projection) => {
      if (!acceptsScrollProjection) return;
      paintScrollProjection(projection);
    }
  });
  acceptsScrollProjection = true;
  window.addEventListener("popstate", restoreLocation);
  window.addEventListener("hashchange", restoreLocation);
}
