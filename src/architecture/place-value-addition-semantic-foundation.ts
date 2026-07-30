import {
  createKpPlaceValueAdditionPresentationPlan,
  isKpPlaceValueAdditionPresentationPlan,
  isKpPlaceValuePresentationProgram,
  type KpPlaceValueAdditionPresentationPlan
} from "../animation/place-value-addition-presentation-plan.ts";
import {
  isKpPlaceValueAdditionTrace,
  kpPlaceValueAdditionTrace,
  type KpPlaceValueAdditionTrace
} from "../semantic/place-value-addition-trace.ts";

declare const kpVerifiedPlaceValueSemanticFoundationBrand: unique symbol;

const sealedSemanticFoundationCertificates = new WeakSet<object>();

export type KpPlaceValueSemanticFoundationIssueCode =
  | "foundation.trace-authority"
  | "foundation.presentation-authority"
  | "foundation.beat-coverage"
  | "foundation.program-authority"
  | "foundation.missing-catalyst"
  | "foundation.non-opaque-motion"
  | "foundation.decorative-only-motif"
  | "foundation.false-promotion";

export interface KpPlaceValueSemanticFoundationIssue {
  readonly code: KpPlaceValueSemanticFoundationIssueCode;
  readonly path: string;
  readonly message: string;
}

export interface KpVerifiedPlaceValueSemanticFoundation {
  readonly schemaVersion: "kp.verified-place-value-semantic-foundation.v1";
  readonly animationId: "animation.place-value-addition.278-plus-156";
  readonly status: "ready-for-projection";
  readonly promotionStatus: "not-promoted";
  readonly trace: KpPlaceValueAdditionTrace;
  readonly presentation: KpPlaceValueAdditionPresentationPlan;
  readonly remainingGates: readonly [
    "written-column-projection",
    "base-ten-projection",
    "shared-runtime",
    "browser-and-product-integration",
    "human-perceptual-review"
  ];
  readonly [kpVerifiedPlaceValueSemanticFoundationBrand]: true;
}

export function certifyKpPlaceValueSemanticFoundation():
KpVerifiedPlaceValueSemanticFoundation {
  const trace = kpPlaceValueAdditionTrace;
  const presentation = createKpPlaceValueAdditionPresentationPlan(trace);
  const issues = checkKpPlaceValueSemanticFoundation({
    trace,
    presentation
  });
  if (issues.length > 0) {
    throw new Error(issues.map(({ message }) => message).join("\n"));
  }
  // This certificate deliberately stops at projection readiness. It is not
  // catalog or release authority, so semantic success cannot recreate the
  // recurring false-"ported" bug before browser and human evidence exists.
  const certificate = Object.freeze({
    schemaVersion: "kp.verified-place-value-semantic-foundation.v1" as const,
    animationId:
      "animation.place-value-addition.278-plus-156" as const,
    status: "ready-for-projection" as const,
    promotionStatus: "not-promoted" as const,
    trace,
    presentation,
    remainingGates: Object.freeze([
      "written-column-projection",
      "base-ten-projection",
      "shared-runtime",
      "browser-and-product-integration",
      "human-perceptual-review"
    ] as const)
  });
  sealedSemanticFoundationCertificates.add(certificate);
  return certificate as unknown as KpVerifiedPlaceValueSemanticFoundation;
}

export function checkKpPlaceValueSemanticFoundation(input: {
  readonly trace: unknown;
  readonly presentation: unknown;
  readonly claimedCanonicalFormat?: "legacy" | "partial" | "ported" | undefined;
}): readonly KpPlaceValueSemanticFoundationIssue[] {
  const issues: KpPlaceValueSemanticFoundationIssue[] = [];
  if (!isKpPlaceValueAdditionTrace(input.trace)) {
    issue(
      issues,
      "foundation.trace-authority",
      "trace",
      "Place-value projection requires compiler-owned trace authority."
    );
  }
  if (!isKpPlaceValueAdditionPresentationPlan(input.presentation)) {
    issue(
      issues,
      "foundation.presentation-authority",
      "presentation",
      "Place-value projection requires compiler-owned presentation authority."
    );
  }

  const traceBeats = objectArrayProperty(input.trace, "beats");
  const presentationBeats = objectArrayProperty(input.presentation, "beats");
  const traceBeatIds = traceBeats.map((beat) => stringProperty(beat, "id"));
  const presentationBeatIds = presentationBeats.map(
    (beat) => stringProperty(beat, "beatId")
  );
  if (
    traceBeatIds.length !== 7 ||
    presentationBeatIds.length !== traceBeatIds.length ||
    presentationBeatIds.some((id, index) => id !== traceBeatIds[index])
  ) {
    issue(
      issues,
      "foundation.beat-coverage",
      "presentation.beats",
      "Presentation must bind the seven trace beats in exact order."
    );
  }

  presentationBeats.forEach((beat, beatIndex) => {
    const programs = objectArrayProperty(beat, "programs");
    if (
      programs.length === 0 ||
      programs.some((program) =>
        stringProperty(program, "kind") === undefined &&
        stringProperty(program, "motifLabel") !== undefined
      )
    ) {
      issue(
        issues,
        "foundation.decorative-only-motif",
        `presentation.beats[${beatIndex}].programs`,
        "A decorative motif label cannot replace an executable program."
      );
    }
    programs.forEach((program, programIndex) => {
      const path =
        `presentation.beats[${beatIndex}].programs[${programIndex}]`;
      if (!isKpPlaceValuePresentationProgram(program)) {
        issue(
          issues,
          "foundation.program-authority",
          path,
          "Every place-value presentation program must carry compiler authority."
        );
      }
      if (stringProperty(program, "opacityPolicy") !== "opaque") {
        issue(
          issues,
          "foundation.non-opaque-motion",
          `${path}.opacityPolicy`,
          "Place-value motion cannot use fade or partial-opacity fallback."
        );
      }
      if (
        stringProperty(program, "kind") === "operation-evaluation" &&
        stringProperty(program, "catalystId") !== "operator.add"
      ) {
        issue(
          issues,
          "foundation.missing-catalyst",
          `${path}.catalystId`,
          "Operation evaluation must include the plus catalyst."
        );
      }
    });
  });

  if (input.claimedCanonicalFormat === "ported") {
    issue(
      issues,
      "foundation.false-promotion",
      "claimedCanonicalFormat",
      "Semantic foundation evidence cannot claim ported status."
    );
  }
  return Object.freeze(issues.map((candidate) => Object.freeze(candidate)));
}

export function isKpVerifiedPlaceValueSemanticFoundation(
  value: unknown
): value is KpVerifiedPlaceValueSemanticFoundation {
  return typeof value === "object" &&
    value !== null &&
    sealedSemanticFoundationCertificates.has(value);
}

function objectArrayProperty(
  value: unknown,
  key: string
): readonly unknown[] {
  if (typeof value !== "object" || value === null) {
    return [];
  }
  const candidate = (value as Record<string, unknown>)[key];
  return Array.isArray(candidate) ? candidate : [];
}

function stringProperty(value: unknown, key: string): string | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "string" ? candidate : undefined;
}

function issue(
  issues: KpPlaceValueSemanticFoundationIssue[],
  code: KpPlaceValueSemanticFoundationIssueCode,
  path: string,
  message: string
): void {
  issues.push({ code, path, message });
}
