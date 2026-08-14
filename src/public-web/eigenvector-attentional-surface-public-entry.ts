import {
  createKpEigenvectorExperienceState,
  updateKpEigenvectorExperience,
  type KpEigenvectorExperienceEvent,
  type KpEigenvectorExperienceState
} from "../tutorial/eigenvector-attentional-surface/eigenvector-experience-state.ts";
import {
  createKpEigenvectorTransitionPlan,
  sampleKpEigenvectorTransition,
  type KpEigenvectorMotionFrame
} from "../tutorial/eigenvector-attentional-surface/eigenvector-motion.ts";
import { projectKpEigenvectorAttentionCss } from
  "../tutorial/eigenvector-attentional-surface/eigenvector-attention.ts";
import {
  enhanceKpEigenvectorScrollSelection
} from "../tutorial/eigenvector-attentional-surface/eigenvector-scroll-selection.ts";
import {
  parseKpEigenvectorBeatHash,
  projectKpEigenvectorEndpoint,
  type KpEigenvectorBeatId,
  type KpEigenvectorEquationForm
} from "../tutorial/eigenvector-attentional-surface/eigenvector-endpoints.ts";
import { projectKpEigenvectorSvgPoint } from
  "../tutorial/eigenvector-attentional-surface/eigenvector-svg-geometry.ts";
import {
  renderKpEigenvectorTransportHtml
} from "../tutorial/eigenvector-attentional-surface/eigenvector-transport.ts";
import type { KpEigenvectorPredictionChoiceId } from
  "../tutorial/eigenvector-attentional-surface/eigenvector-prediction.ts";

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
  let state = createKpEigenvectorExperienceState();
  let animationFrame: number | undefined;
  let animationRevision = 0;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
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
    renderInteractionState(nextState);
  };

  const dispatch = (event: KpEigenvectorExperienceEvent): void => {
    const update = updateKpEigenvectorExperience(state, event);
    state = update.state;
    renderState(state);
    for (const effect of update.effects) {
      if (effect.type === "announce") {
        if (announcer !== null) announcer.textContent = effect.text;
      } else {
        runTransition(effect.fromBeatId, effect.toBeatId);
      }
    }
  };

  const runTransition = (
    fromBeatId: KpEigenvectorBeatId,
    toBeatId: KpEigenvectorBeatId
  ): void => {
    if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
    const revision = ++animationRevision;
    const plan = createKpEigenvectorTransitionPlan(fromBeatId, toBeatId);
    const duration = reducedMotion.matches ? 0 : plan.durationMs;
    if (duration === 0) {
      paintMotionFrame(sampleKpEigenvectorTransition({
        plan,
        progress: 1,
        reducedMotion: reducedMotion.matches
      }));
      return;
    }
    const startedAt = performance.now();
    const tick = (now: number): void => {
      if (revision !== animationRevision) return;
      const progress = Math.min(1, (now - startedAt) / duration);
      paintMotionFrame(sampleKpEigenvectorTransition({ plan, progress }));
      if (progress < 1) animationFrame = requestAnimationFrame(tick);
      else animationFrame = undefined;
    };
    animationFrame = requestAnimationFrame(tick);
  };

  const paintMotionFrame = (frame: KpEigenvectorMotionFrame): void => {
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
      const line = ensureVectorLine(vector.id, vector.semanticObjectId,
        vector.role);
      const [x2, y2] = projectKpEigenvectorSvgPoint(vector.coordinates);
      line.setAttribute("x2", String(x2));
      line.setAttribute("y2", String(y2));
      line.style.setProperty("--kp-eigen-presence", String(vector.presence));
    }
    invariantLine.style.setProperty(
      "--kp-eigen-presence",
      String(frame.invariantLineProgress)
    );
    paintEquation(frame.equation.fromForm, frame.equation.fromPresence);
    paintEquation(frame.equation.toForm, frame.equation.toPresence);
    if (frame.settled) settleEquations(frame.equation.toForm);
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
    line.setAttribute("class", `kp-eigenvector-stage__vector kp-eigenvector-stage__vector--${role}`);
    const marker = root.querySelector<SVGMarkerElement>("marker");
    if (marker !== null) line.setAttribute("marker-end", `url(#${marker.id})`);
    vectorLayer.append(line);
    return line;
  };

  const paintEquation = (
    form: KpEigenvectorEquationForm,
    presence: number
  ): void => {
    if (form === "none") return;
    const equation = root.querySelector<HTMLElement>(
      `[data-kp-equation-form="${form}"]`
    );
    if (equation === null) return;
    equation.hidden = presence <= 0;
    equation.style.opacity = String(presence);
  };

  const settleEquations = (form: KpEigenvectorEquationForm): void => {
    for (const equation of root.querySelectorAll<HTMLElement>(
      "[data-kp-equation-form]"
    )) {
      const visible = equation.dataset["kpEquationForm"] === form;
      equation.hidden = !visible;
      equation.style.opacity = visible ? "1" : "0";
    }
  };

  const renderInteractionState = (
    current: KpEigenvectorExperienceState
  ): void => {
    const feedback = root.querySelector<HTMLElement>(
      "[data-kp-eigenvector-prediction-feedback]"
    );
    if (feedback !== null) feedback.textContent = current.prediction?.feedback ?? "";
    const coefficient = root.querySelector<HTMLElement>(
      "[data-kp-eigenvector-coefficient-output]"
    );
    if (coefficient !== null) coefficient.textContent =
      String(current.scalar.coefficient);
    const scalarFeedback = root.querySelector<HTMLElement>(
      "[data-kp-eigenvector-scalar-feedback]"
    );
    if (scalarFeedback !== null) scalarFeedback.textContent =
      current.scalar.explanation;
    if (current.beatId === "reveal-the-eigenspace") {
      const scalarLine = ensureVectorLine(
        "diagram.eigenvector-demo/vector/2v",
        "eigenvector-demo/vector/v",
        "scalar-multiple"
      );
      const [x2, y2] = projectKpEigenvectorSvgPoint(current.scalar.output);
      scalarLine.setAttribute("x2", String(x2));
      scalarLine.setAttribute("y2", String(y2));
      scalarLine.style.setProperty("--kp-eigen-presence", "1");
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
      dispatch({ type: "select-beat", beatId });
      document.getElementById(beatId)?.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "center"
      });
      return;
    }
    const prediction = target?.closest<HTMLButtonElement>(
      "[data-kp-eigenvector-prediction-choice]"
    );
    if (prediction !== null && prediction !== undefined) {
      const choice = prediction.dataset["kpEigenvectorPredictionChoice"];
      const choiceId = (["maps-to-6v", "maps-to-3v", "changes-direction"] as const)
        .find((candidate) => candidate === choice);
      if (choiceId !== undefined) dispatch({
        type: "answer-prediction",
        choiceId: choiceId satisfies KpEigenvectorPredictionChoiceId
      });
    }
  });

  root.addEventListener("input", (event) => {
    const input = event.target instanceof HTMLInputElement &&
      event.target.matches("[data-kp-eigenvector-scalar-input]")
      ? event.target
      : null;
    if (input !== null) dispatch({
      type: "set-scalar",
      coefficient: Number(input.value)
    });
  });

  renderState(state);
  settleEquations(projectKpEigenvectorEndpoint(state.beatId).equation);
  enhanceKpEigenvectorScrollSelection({
    root,
    viewportHeight: () => window.innerHeight,
    onBeatSelected: (beatId) => dispatch({ type: "select-beat", beatId })
  });
}
