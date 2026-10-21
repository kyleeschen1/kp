import { createFlaggedTicketSource } from "../../../domains/probability/binary-joint-model.ts";

export function createBayesDraft() {
  const model = createFlaggedTicketSource();
  return { schemaVersion: "kp.bayes-source.v1", model,
    teaching: { firstEventId: model.events[0]!.id, detailLevel: "complete" } };
}
