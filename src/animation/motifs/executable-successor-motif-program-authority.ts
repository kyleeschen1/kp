import type {
  KpExecutableSuccessorMotifProgramDraft,
  KpVerifiedExecutableSuccessorMotifProgram
} from "./executable-successor-motif-program.ts";

const verifiedPrograms = new WeakSet<object>();

/**
 * Registers a deeply frozen program after either exhaustive validation or
 * closed canonical construction. Architecture checks keep this nominal mint
 * out of ordinary authoring and reader code.
 */
export function registerKpVerifiedExecutableSuccessorMotifProgramAuthority(
  program: KpExecutableSuccessorMotifProgramDraft
): KpVerifiedExecutableSuccessorMotifProgram {
  verifiedPrograms.add(program);
  return program as KpVerifiedExecutableSuccessorMotifProgram;
}

export function isKpVerifiedExecutableSuccessorMotifProgram(
  value: unknown
): value is KpVerifiedExecutableSuccessorMotifProgram {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    verifiedPrograms.has(value)
  );
}
