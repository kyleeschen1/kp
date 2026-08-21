import type {
  KpEvenPositiveInversePowerDraft,
  KpOddInversePowerDraft,
  KpVerifiedInversePowerOperation
} from "../../src/semantic/inverse-power-operation.ts";

declare const evenPositive: KpEvenPositiveInversePowerDraft;
declare const odd: KpOddInversePowerDraft;

// @ts-expect-error Only the semantic verifier may mint proof authority.
const forgedAuthority: KpVerifiedInversePowerOperation = evenPositive;
void forgedAuthority;

const missingNegative: KpEvenPositiveInversePowerDraft = {
  ...evenPositive,
  solutionSet: {
    ...evenPositive.solutionSet,
    // @ts-expect-error Even positive inversion has literal multiplicity two.
    multiplicity: 1,
    // @ts-expect-error Even positive inversion requires plus and minus branches.
    branches: [evenPositive.solutionSet.branches[0]],
    candidateAudit: {
      ...evenPositive.solutionSet.candidateAudit,
      // @ts-expect-error The audit must account for both accepted branches.
      acceptedBranchIds: [evenPositive.solutionSet.branches[0].id]
    }
  }
};
void missingNegative;

const falseOddSplit: KpOddInversePowerDraft = {
  ...odd,
  // @ts-expect-error Odd inversion cannot declare a two-branch even-root set.
  solutionSet: evenPositive.solutionSet
};
void falseOddSplit;
