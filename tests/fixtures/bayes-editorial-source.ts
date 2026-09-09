import { createBayesDraft } from "../../src/experiments/bayesian-reasoning/draft.ts";

// Synthetic validation input, not learner content or independent model evidence.
export function editorialFixture() {
  const source = createBayesDraft();
  const body = ["The selected share is ", { fact: "posterior" }];
  return { ...source, schemaVersion: "kp.bayes-source.v2", editorial: {
    title: "An authored probability explanation", setup: ["A stipulated population."],
    passages: ["population", "first-branches", "joint-tree", "marginal", "conditioned", "full-population", "reordered"]
      .map(slug => ({ stateId: `${source.model.sourceId}.state.${slug}`, title: slug, body })),
    readings: { full: [body], compact: [body] }, denominator: ["Include both B outcomes."],
    prompts: { prediction: { title: "Predict", body: ["How will the evidence change the prior?"] },
      reconstruction: { title: "Reconstruct", body: ["Which outcomes belong in the denominator?"] } }
  } };
}
