import derivativeControl from "../../docs/theseus/nodes/next-actions/next-action.kp.editor.derivative-tangent-animation-v0.json" with {
  type: "json"
};
import radicalControl from "../../docs/theseus/nodes/next-actions/next-action.kp.editor.exponent-radical-visible-animations-v0.json" with {
  type: "json"
};
import workbenchRun from "../../docs/theseus/nodes/run-contracts/run-contract.kp.semantic-animation-workbench-v2.json" with {
  type: "json"
};
import {
  createKpEditorAnimationLibrary
} from "./animation-library.ts";
import {
  createKpLearnerExperienceLibrary
} from "./learner-experience-library.ts";
import {
  projectKpAnimationCatalogToWorkbench
} from "./semantic-animation-workbench-catalog-adapter.ts";
import {
  createKpCanonicalAnimationIdentity
} from "./semantic-animation-workbench-identity.ts";
import {
  compileKpSemanticAnimationWorkbenchIndex,
  type KpSemanticAnimationWorkbenchIndex
} from "./semantic-animation-workbench-index.ts";
import {
  projectKpAnimationRepresentations
} from "./semantic-animation-workbench-representation-adapter.ts";
import {
  createKpAnimationWorkbenchSeedCohort
} from "./semantic-animation-workbench-seeds.ts";
import {
  projectKpAnimationTheseusState
} from "./semantic-animation-workbench-theseus-adapter.ts";

export function createKpSemanticAnimationWorkbenchIndex():
  KpSemanticAnimationWorkbenchIndex {
  const seeds = createKpAnimationWorkbenchSeedCohort();
  const descriptors = createKpEditorAnimationLibrary();
  const catalogEntries = projectKpAnimationCatalogToWorkbench({
    descriptors,
    seeds
  });
  const theseus = projectKpAnimationTheseusState([
    {
      animationId: seeds[0]!.animationId,
      node: radicalControl
    },
    {
      animationId: seeds[1]!.animationId,
      node: derivativeControl
    },
    {
      animationId: seeds[2]!.animationId,
      node: workbenchRun,
      sliceId: "s22"
    }
  ]);

  return compileKpSemanticAnimationWorkbenchIndex({
    catalogEntries,
    plannedIdentities: [
      createKpCanonicalAnimationIdentity({ seed: seeds[2]! })
    ],
    representations: projectKpAnimationRepresentations({
      catalogEntries,
      descriptors,
      learnerExperiences: createKpLearnerExperienceLibrary()
    }),
    theseus
  });
}
