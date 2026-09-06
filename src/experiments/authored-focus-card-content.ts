import { renderKpFocusDeckScaffold } from "./focus-deck-scaffold.ts";

// Presentation content is shared by static output and browser enhancement;
// verified equation state is supplied separately by the domain build path.
export const kpAuthoredDistributionBeats = [
  { slug: "factored", title: "One factor, two terms", html: "<p>The fraction multiplies the whole sum. Follow the same factor as it reaches both terms.</p>" },
  { slug: "distributed", title: "Multiply both terms", html: "<p>Each term now has the factor two-thirds. Distribution changes the structure, not the value of the expression.</p>" }
] as const;
export const kpAuthoredSimplificationBeats = [
  { slug: "source", title: "Multiplying by one", html: "<p>Multiplying by one leaves the value unchanged. Follow the first two.</p>" },
  { slug: "target", title: "The same two remains", html: "<p>The multiplication sign and one withdraw. The original two remains the carrier of the result.</p>" }
] as const;

export function renderKpAuthoredFocusCard(kind: "distribution" | "simplification", stageHtml: string, staticOutput = false) {
  const distribution = kind === "distribution";
  const beats = distribution ? kpAuthoredDistributionBeats : kpAuthoredSimplificationBeats;
  return renderKpFocusDeckScaffold({ id: `authoring-${kind}`,
    ariaLabel: distribution ? "Distribute a fractional factor" : "Two times one simplifies to two",
    activeBeatSlug: beats[0].slug, beats, stageHtml, replayHidden: false,
    headerTrailingHtml: distribution ? "<span>One factor · two terms</span>" : "",
    rootAttributes: { [`data-kp-authoring-${kind}-card`]: staticOutput ? "static" : "preparing",
      "data-kp-focus-card-enhancement": staticOutput ? "static" : "preparing",
      "data-kp-focus-deck-static": String(staticOutput) }
  });
}
