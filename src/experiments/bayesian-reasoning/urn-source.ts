/** Original binary example: choose an urn uniformly, then draw one ball.
 * Urn A is one-quarter red; urn B is three-quarters red (otherwise blue).
 * This is ordinary author data, not a second renderer or probability engine. */
export function createUrnBayesDraft() {
  return { schemaVersion: "kp.bayes-source.v1", model: {
    kind: "prior-likelihoods", sourceId: "probability.two-urns.v1",
    events: [{ id: "urn-a", label: "Selected urn A", complementLabel: "Selected urn B" },
      { id: "red", label: "Drew red", complementLabel: "Drew blue" }],
    prior: "1/2", likelihoods: ["1/4", "3/4"]
  }, teaching: { firstEventId: "red", detailLevel: "key-steps" } };
}
