export interface KpLinearEquationSymbolicStoryLike {
  readonly id: string;
  readonly animationId: "linear-equation-solve-x";
  readonly title: string;
  readonly summary: string;
  readonly beats: readonly {
    readonly id: string;
    readonly title: string;
    readonly progressPermille: number;
    readonly focus: readonly string[];
    readonly segments: readonly {
      readonly text: string;
      readonly semanticRef?: string;
    }[];
  }[];
}

export function renderLinearEquationSymbolicStory(
  story: KpLinearEquationSymbolicStoryLike,
  activeBeatId = story.beats[0]?.id
): HTMLElement {
  const region = document.createElement("section");
  region.dataset["kpSymbolicStory"] = story.id;
  region.setAttribute("aria-labelledby", "kp-symbolic-story-title");

  const explanation = document.createElement("article");
  explanation.dataset["kpSymbolicStoryExplanation"] = "true";
  const title = document.createElement("h2");
  title.id = "kp-symbolic-story-title";
  title.textContent = story.title;
  const summary = document.createElement("p");
  summary.dataset["kpSymbolicStorySummary"] = "true";
  summary.textContent = story.summary;
  explanation.append(title, summary);

  const beats = document.createElement("div");
  beats.dataset["kpSymbolicStoryBeats"] = "true";
  story.beats.forEach((beat) => {
    const section = document.createElement("section");
    section.id = `story-${beat.id}`;
    section.dataset["kpSymbolicStoryBeat"] = beat.id;
    section.dataset["kpSymbolicStoryProgressPermille"] = String(beat.progressPermille);
    const active = beat.id === activeBeatId;
    section.dataset["kpSymbolicStoryActive"] = String(active);
    section.dataset["kpSemanticRefs"] = beat.focus.join(" ");
    if (active) section.setAttribute("aria-current", "step");
    const heading = document.createElement("h3");
    heading.textContent = beat.title;
    const copy = document.createElement("p");
    beat.segments.forEach((segment) => {
      if (segment.semanticRef === undefined) {
        copy.append(document.createTextNode(segment.text));
        return;
      }
      const linked = document.createElement("span");
      linked.dataset["kpSymbolicStorySemanticRef"] = segment.semanticRef;
      linked.textContent = segment.text;
      copy.append(linked);
    });
    section.append(heading, copy);
    beats.append(section);
  });
  explanation.append(beats);

  const stage = document.createElement("section");
  stage.dataset["kpSymbolicStoryVisual"] = "true";
  stage.setAttribute("aria-label", "Kinetic equation");
  const animationHost = document.createElement("div");
  animationHost.dataset["kpSymbolicStoryAnimationHost"] = "true";
  stage.append(animationHost);
  region.append(explanation, stage);
  return region;
}
