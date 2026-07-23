import {
  selectKpActiveApprovedPlan,
  type KpWorkbenchPlanRevisionNode
} from "./semantic-animation-workbench-roadmap-authority.ts";

const planRevisionModules = import.meta.glob(
  "../../docs/theseus/nodes/plan-revisions/*.json",
  {
    eager: true,
    import: "default"
  }
);

export function discoverKpActiveApprovedPlan():
  KpWorkbenchPlanRevisionNode {
  // The file set is discovered at build time so activating v7 cannot leave a
  // version-pinned Workbench import silently reading v6.
  return selectKpActiveApprovedPlan(
    Object.values(planRevisionModules) as KpWorkbenchPlanRevisionNode[]
  );
}
