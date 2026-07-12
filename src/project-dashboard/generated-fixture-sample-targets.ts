import type { GeneratedLinearSolveTutorialFixture } from "../semantic/generated-algebra-tutorial-fixture.ts";
import { generatedLinearSolveTutorialCardSampleId } from "../tutorial/generated-linear-solve-card-sample.ts";
import type { ProjectDashboardSampleTarget } from "./model.ts";

const linearSolveTutorialCardManifestId = "tutorial.linear-solve.card";
const linearSolveTutorialCardLayoutId = "layout.sample.linear-solve-synchronized-panel";
const linearSolveTutorialCardClockId = "solve-x-shared-clock";

export function createGeneratedLinearSolveTutorialCardSampleTarget(
  fixture: GeneratedLinearSolveTutorialFixture
): ProjectDashboardSampleTarget {
  return {
    kind: "tutorial-card",
    label: `Open ${lowerFirst(fixture.title)} tutorial card`,
    sampleId: generatedLinearSolveTutorialCardSampleId(fixture.id),
    manifestId: linearSolveTutorialCardManifestId,
    layoutId: linearSolveTutorialCardLayoutId,
    sharedClockId: linearSolveTutorialCardClockId,
    // Generated fixtures currently share the live-card runtime; this selects the semantic variant.
    fixtureId: fixture.id
  };
}

function lowerFirst(value: string): string {
  return value.length === 0 ? value : `${value[0]?.toLowerCase()}${value.slice(1)}`;
}
