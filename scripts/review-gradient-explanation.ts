import { gradientContourBeats, type GradientStoryBeat, type GradientBeatSlug } from "../src/tutorial/gradient-contour/gradient-contour-story.ts";

// This checks this story's declared reading path, not whether prose teaches it.
const prerequisites: Partial<Record<GradientBeatSlug, readonly GradientBeatSlug[]>> = {
  east: ["height"], north: ["height"], ramp: ["east", "north"],
  "linear-change": ["ramp"], gradient: ["linear-change"],
  "fair-comparison": ["linear-change"], level: ["gradient", "fair-comparison"],
  projection: ["level"], components: ["projection"], across: ["components"],
  "dot-product": ["across"], "general-projection": ["dot-product"],
  magnitude: ["general-projection"], contour: ["general-projection"],
  follow: ["contour"], tangent: ["follow"], local: ["tangent"], prediction: ["local"],
};

export function reviewGradientExplanation(beats: readonly GradientStoryBeat[]) {
  const findings: { location: string; defect: string; repair: string }[] = [];
  const seen = new Set<GradientBeatSlug>();
  for (const beat of beats) {
    const canonical = gradientContourBeats.find(item => item.slug === beat.slug);
    const report = (defect: string, repair: string) => findings.push({ location: beat.slug, defect, repair });
    if (!canonical) { report("Unknown beat reference", "Use an existing story beat."); continue; }
    if (seen.has(beat.slug)) report("Duplicate beat reference", "Keep one occurrence on this reading path.");
    for (const required of prerequisites[beat.slug] ?? []) {
      if (!seen.has(required)) report(`Unavailable declared prerequisite: ${required}`, `Restore ${required} before ${beat.slug}, or review the changed dependency explicitly.`);
    }
    if (beat.evidence !== canonical.evidence) report("Changed evidence binding", `Restore ${canonical.evidence} or review a separate evidence change.`);
    if (!beat.html.trim() || !beat.title.trim()) report("Empty required content", "Restore the title and explanation.");
    if (/katex-error/.test(beat.html)) report("Failed native mathematics", "Repair the source expression through the native renderer.");
    if (canonical.html.includes('<math') && !beat.html.includes('<math')) report("Missing native mathematics", "Restore native mathematics; prose alone does not preserve the declared expression.");
    seen.add(beat.slug);
  }
  for (const beat of gradientContourBeats) {
    if (!seen.has(beat.slug)) findings.push({ location: beat.slug, defect: "Missing required beat", repair: "Restore this explanation on the main reading path." });
  }
  return { scope: "gradient-declared-path" as const, editorialStatus: "not-assessed" as const, findings };
}
