import {
  compileKpExecutableMotifContinuity
} from "../../src/animation/motifs/executable-motif-continuity-compiler.ts";
import type {
  KpVerifiedExecutableSuccessorMotifProgram
} from "../../src/animation/motifs/executable-successor-motif-program.ts";
import type {
  KpVerifiedPerceptualContinuityContract
} from "../../src/animation/perceptual-continuity-contract.ts";

declare const program: KpVerifiedExecutableSuccessorMotifProgram;
declare const contract: KpVerifiedPerceptualContinuityContract;

compileKpExecutableMotifContinuity({
  program,
  contract,
  topology: "bounded-semantic-contact-co-presence",
  // @ts-expect-error Continuity callers cannot replace program phases.
  phases: []
});

compileKpExecutableMotifContinuity({
  program,
  contract,
  topology: "bounded-semantic-contact-co-presence",
  // @ts-expect-error Continuity callers cannot author renderer timing.
  durationMs: 500
});

const result = compileKpExecutableMotifContinuity({
  program,
  contract,
  topology: "bounded-semantic-contact-co-presence"
});
if (result.status === "compiled") {
  // @ts-expect-error Compiled continuity carries no opacity authority.
  result.continuityProgram.opacity;
  // @ts-expect-error Compiled continuity carries no DOM authority.
  result.continuityProgram.selector;
}
