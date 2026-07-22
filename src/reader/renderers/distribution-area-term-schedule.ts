import {
  createKpIndexedProgressSchedule,
  kpParallel,
  type KpIndexedProgressSchedule
} from "../../animation/indexed-progress-schedule.ts";

export type KpDistributionAreaTermLaneId = "left" | "right";

export function createKpDistributionAreaTermSchedule(): KpIndexedProgressSchedule<KpDistributionAreaTermLaneId> {
  return createKpIndexedProgressSchedule({
    id: "schedule.distribution-area.terms.parallel",
    ids: ["left", "right"],
    strategy: kpParallel()
  });
}
