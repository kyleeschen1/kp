import { requirePreparedBayesDraft, type PreparedBayesDraft } from "./draft.ts";
import { projectBayesReading } from "./readings.ts";
import { projectBayesPrompts } from "./prompts.ts";
import { extractBayesDenominator } from "./extraction.ts";

/** The card and edition assemble the same revision's projections here. Keep
 * their markup and interactive lifecycle separate; v1 defaults stay in owners. */
export function projectBayesLessonViews(draft: PreparedBayesDraft) {
  requirePreparedBayesDraft(draft);
  return Object.freeze({ full: projectBayesReading(draft, "full"),
    compact: projectBayesReading(draft, "compact"),
    context: extractBayesDenominator(draft, 4), prompts: projectBayesPrompts(draft) });
}
