import type { KpAnimationGenerationRequest } from
  "../domain-ir/animation-generation-request.ts";
import {
  createKpAnimationDomainFrontendEvidence,
  type KpAnimationDomainFrontendEvidence
} from "./animation-domain-frontend-evidence.ts";
import { kpAnimationCapabilityPlan } from
  "./cross-domain-animation-capability-plan.ts";

export interface KpAnimationGenerationCapabilityDiagnostic {
  readonly code:
    | "animation-generation.capability.unknown"
    | "animation-generation.capability.domain-mismatch"
    | "animation-generation.frontend.mismatch"
    | "animation-generation.frontend.required";
  readonly path: string;
  readonly message: string;
  readonly repair: string;
}

export function validateKpAnimationGenerationCapabilityPins(
  request: KpAnimationGenerationRequest,
  frontendEvidence: KpAnimationDomainFrontendEvidence =
    createKpAnimationDomainFrontendEvidence()
): readonly KpAnimationGenerationCapabilityDiagnostic[] {
  const diagnostics: KpAnimationGenerationCapabilityDiagnostic[] = [];
  request.capabilityPins.forEach((capabilityId, index) => {
    const capability = kpAnimationCapabilityPlan.entries.find(
      ({ id }) => id === capabilityId
    );
    if (capability === undefined) {
      diagnostics.push(issue(
        "animation-generation.capability.unknown",
        `$.capabilityPins[${index}]`,
        `Unknown capability ${capabilityId}.`,
        "Choose an exact capability ID from the generated coverage catalogue."
      ));
      return;
    }
    if (capability.domain !== request.domain) {
      diagnostics.push(issue(
        "animation-generation.capability.domain-mismatch",
        `$.capabilityPins[${index}]`,
        `${capabilityId} belongs to ${capability.domain}, not ${request.domain}.`,
        "Pin capabilities owned by the selected request domain."
      ));
      return;
    }
    const frontend = capability.requirements.find(
      ({ kind }) => kind === "domain-frontend"
    );
    if (frontend === undefined) return;
    if (frontend.authorityId !== request.source.frontendId) {
      diagnostics.push(issue(
        "animation-generation.frontend.mismatch",
        "$.source.frontendId",
        `${capabilityId} requires ${frontend.authorityId}.`,
        "Route source input through the capability's domain-owned frontend."
      ));
      return;
    }
    const evidence = frontendEvidence.requirements.find((candidate) =>
      candidate.capabilityId === capability.id &&
      candidate.requirementId === frontend.id
    );
    if (evidence?.status !== "matched") diagnostics.push(issue(
      "animation-generation.frontend.required",
      "$.source.frontendId",
      `${frontend.authorityId} is declared but has no exact implementation evidence.`,
      "Provide the domain-owned frontend before compiling this request."
    ));
  });
  return Object.freeze(diagnostics);
}

function issue(
  code: KpAnimationGenerationCapabilityDiagnostic["code"],
  path: string,
  message: string,
  repair: string
): KpAnimationGenerationCapabilityDiagnostic {
  return Object.freeze({ code, path, message, repair });
}
