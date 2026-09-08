import { checkBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";

export const bayesTrialTask = "Author a stipulated parcel-inspection problem using prior-likelihoods. sourceId probability.inspection-trial.v1. A: id damaged, label Damaged parcel, complementLabel Undamaged parcel. B: id flagged, label Flagged inspection, complementLabel Unflagged inspection. P(A)=1/10; P(B|A)=4/5; P(B|not A)=1/5. Branch on flagged first and choose key-steps detail. Ask the supported P(A|B), without adding fields or inventing geometry.";

/** Local assessment only. Valid compilation alone is not task fulfillment. */
export function assessBayesTrial(sourceJson: string) {
  const result = checkBayesDraft(sourceJson);
  if (result.status !== "compiled") return { compiled: false, fulfilled: false, diagnostic: result.diagnostic };
  const { model, teaching, tree, trace, revisionId } = result.draft;
  const expectedEvents = [{ id: "damaged", label: "Damaged parcel", complementLabel: "Undamaged parcel" },
    { id: "flagged", label: "Flagged inspection", complementLabel: "Unflagged inspection" }];
  const raw: unknown = JSON.parse(sourceJson);
  const priorForm = !!raw && typeof raw === "object" && "model" in raw && !!raw.model &&
    typeof raw.model === "object" && "kind" in raw.model && raw.model.kind === "prior-likelihoods";
  const masses = model.outcomes.map(outcome => `${outcome.mass.numerator}/${outcome.mass.denominator}`);
  const fulfilled = priorForm && model.sourceId === "probability.inspection-trial.v1" &&
    JSON.stringify(model.events) === JSON.stringify(expectedEvents) &&
    JSON.stringify(masses) === JSON.stringify(["2/25", "1/50", "9/50", "18/25"]) &&
    teaching.firstEventId === "flagged" && teaching.detailLevel === "key-steps";
  return { compiled: true, fulfilled, revisionId, masses, checkpoints: trace.states.length,
    posterior: `${tree.query.value.numerator}/${tree.query.value.denominator}`,
    mechanism: result.draft.notation.mechanism };
}

export function injectBayesTrialFault(sourceJson: string): string {
  // Inject only into a checked object, so malformed external input cannot cause
  // an unlocated property-write failure in the evaluation harness.
  const checked = checkBayesDraft(sourceJson);
  if (checked.status !== "compiled") throw new Error(checked.diagnostic.expected);
  const source = JSON.parse(checked.draft.sourceText);
  source.teaching.durationMs = 900;
  return JSON.stringify(source);
}
