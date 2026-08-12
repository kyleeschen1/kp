import {
  KP_SCHEME_FACTORIAL_DOCUMENT_ID,
  parseKpSchemeFactorialSource
} from "./scheme-factorial-parser.ts";
import {
  KP_SCHEME_FACTORIAL_SOURCE
} from "./scheme-factorial-source-model.ts";
import {
  defineKpSchemeTrace,
  type KpSchemeTrace
} from "./scheme-factorial-trace.ts";

export interface KpSchemeFactorialTraceArtifact {
  readonly schemaVersion: "kp.scheme-factorial-trace-artifact.v1";
  readonly source: {
    readonly documentId: typeof KP_SCHEME_FACTORIAL_DOCUMENT_ID;
    readonly text: typeof KP_SCHEME_FACTORIAL_SOURCE;
  };
  readonly compiler: {
    readonly id: "kp.scheme-factorial-evaluator";
    readonly version: "1";
    readonly maxTransitions: number;
  };
  readonly trace: KpSchemeTrace;
}

export function defineKpSchemeFactorialTraceArtifact(
  input: KpSchemeFactorialTraceArtifact
): KpSchemeFactorialTraceArtifact {
  if (input.schemaVersion !== "kp.scheme-factorial-trace-artifact.v1") {
    throw new Error("Unsupported Scheme factorial trace artifact schema.");
  }
  if (input.source.documentId !== KP_SCHEME_FACTORIAL_DOCUMENT_ID ||
      input.source.text !== KP_SCHEME_FACTORIAL_SOURCE) {
    throw new Error("Scheme factorial trace artifact source is not canonical.");
  }
  if (input.compiler.id !== "kp.scheme-factorial-evaluator" ||
      input.compiler.version !== "1" ||
      !Number.isSafeInteger(input.compiler.maxTransitions) ||
      input.compiler.maxTransitions <= 0) {
    throw new Error("Scheme factorial trace artifact compiler is invalid.");
  }
  const trace = defineKpSchemeTrace(
    parseKpSchemeFactorialSource(input.source.text),
    input.trace
  );
  return Object.freeze({
    ...input,
    source: Object.freeze({ ...input.source }),
    compiler: Object.freeze({ ...input.compiler }),
    trace
  });
}
