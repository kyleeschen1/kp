import type {
  KpEquationSurfaceCompatibilityCounts
} from "./equation-surface-cost-model.ts";

export interface KpIterationSourceFile {
  readonly path: string;
  readonly source: string;
}

export interface KpEquationIterationEconomics {
  readonly schemaVersion: "kp.equation-iteration-economics.v1";
  readonly equationAuthority: {
    readonly sourceFileCount: number;
    readonly sourceLineCount: number;
    readonly closedSwitchSiteCount: number;
    readonly closedSwitchFiles: readonly string[];
  };
  readonly motifAuthority: {
    readonly functionWrapProfileConsumers: readonly string[];
    readonly functionWrapReceptionConsumers: readonly string[];
  };
  readonly tests: {
    readonly fileCount: number;
    readonly lineCount: number;
    readonly sourceInspectionFiles: readonly string[];
    readonly aggregateCountRatchetFiles: readonly string[];
  };
  readonly verificationScriptCount: number;
  readonly compatibility: KpEquationSurfaceCompatibilityCounts;
}

const CLOSED_SWITCH_PATTERN = /\bswitch\s*\(/gu;
const FUNCTION_WRAP_PROFILE_IMPORT = /function-wrap-motion-profile/u;
const FUNCTION_WRAP_RECEPTION_IMPORT = /function-wrap-reception/u;
const READ_FILE_PATTERN = /\breadFile(?:Sync)?\b/u;
const SOURCE_PATH_LITERAL_PATTERN = /["'`](?:\.\.\/)*src\//u;
const AGGREGATE_COUNT_RATCHET_PATTERN = /\.length\s*,\s*\d+/u;

/**
 * This report is a migration baseline, not a production quality gate. It
 * measures the taxes the approved refactor intends to remove without making
 * source-text shape a permanent architectural authority.
 */
export function compileKpEquationIterationEconomics(input: {
  readonly equationAuthorityFiles: readonly KpIterationSourceFile[];
  readonly allSourceFiles: readonly KpIterationSourceFile[];
  readonly testFiles: readonly KpIterationSourceFile[];
  readonly verificationScriptNames: readonly string[];
  readonly compatibility: KpEquationSurfaceCompatibilityCounts;
}): KpEquationIterationEconomics {
  const closedSwitchFiles = input.equationAuthorityFiles
    .filter(({ source }) => countMatches(source, CLOSED_SWITCH_PATTERN) > 0)
    .map(({ path }) => path)
    .sort();
  return Object.freeze({
    schemaVersion: "kp.equation-iteration-economics.v1" as const,
    equationAuthority: Object.freeze({
      sourceFileCount: input.equationAuthorityFiles.length,
      sourceLineCount: input.equationAuthorityFiles.reduce(
        (total, file) => total + lineCount(file.source),
        0
      ),
      closedSwitchSiteCount: input.equationAuthorityFiles.reduce(
        (total, file) => total + countMatches(file.source, CLOSED_SWITCH_PATTERN),
        0
      ),
      closedSwitchFiles: Object.freeze(closedSwitchFiles)
    }),
    motifAuthority: Object.freeze({
      functionWrapProfileConsumers: Object.freeze(pathsMatching(
        input.allSourceFiles,
        FUNCTION_WRAP_PROFILE_IMPORT
      )),
      functionWrapReceptionConsumers: Object.freeze(pathsMatching(
        input.allSourceFiles,
        FUNCTION_WRAP_RECEPTION_IMPORT
      ))
    }),
    tests: Object.freeze({
      fileCount: input.testFiles.length,
      lineCount: input.testFiles.reduce(
        (total, file) => total + lineCount(file.source),
        0
      ),
      sourceInspectionFiles: Object.freeze(input.testFiles
        .filter(({ source }) =>
          READ_FILE_PATTERN.test(source) && SOURCE_PATH_LITERAL_PATTERN.test(source)
        )
        .map(({ path }) => path)
        .sort()),
      aggregateCountRatchetFiles: Object.freeze(input.testFiles
        .filter(({ path, source }) =>
          /catalog|inventory|manifest/u.test(path) &&
          AGGREGATE_COUNT_RATCHET_PATTERN.test(source)
        )
        .map(({ path }) => path)
        .sort())
    }),
    verificationScriptCount: input.verificationScriptNames.length,
    compatibility: Object.freeze({ ...input.compatibility })
  });
}

function pathsMatching(
  files: readonly KpIterationSourceFile[],
  pattern: RegExp
): string[] {
  return files
    .filter(({ source }) => pattern.test(source))
    .map(({ path }) => path)
    .sort();
}

function countMatches(source: string, pattern: RegExp): number {
  return [...source.matchAll(pattern)].length;
}

function lineCount(source: string): number {
  if (source.length === 0) return 0;
  return source.split(/\r?\n/u).length;
}
