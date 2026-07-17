import {
  createKpWitnessedAnnihilationBinding
} from "../animation/witnessed-annihilation.ts";
import {
  createKpEquationWitnessedAnnihilationPlan,
  sampleKpEquationWitnessedAnnihilation,
  sampleKpEquationWitnessedAnnihilationRelation
} from "./equation-witnessed-annihilation.ts";
import {
  registerKpEquationWitnessedAnnihilationRuntime
} from "./equation-witnessed-annihilation-runtime.ts";

registerKpEquationWitnessedAnnihilationRuntime({
  createBinding: createKpWitnessedAnnihilationBinding,
  createPlan: createKpEquationWitnessedAnnihilationPlan,
  sample: sampleKpEquationWitnessedAnnihilation,
  sampleRelation: sampleKpEquationWitnessedAnnihilationRelation
});
