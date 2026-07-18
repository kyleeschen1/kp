import type { KpTutorialClaimGraph } from "./claim-scene-graphs.ts";

export type KpTutorialProofStatus =
  | "computation"
  | "empirical"
  | "example"
  | "formal"
  | "heuristic"
  | "intuition"
  | "proof-sketch";

export interface KpTutorialModelScope {
  readonly generality: "exact-example" | "generic" | "restricted-family";
  readonly domain: string;
  readonly assumptions: readonly string[];
}

export interface KpTutorialValidity {
  readonly status: "intentional-invalid" | "unverified" | "valid";
  readonly explanation: string;
}

export interface KpTutorialProvenanceRef {
  readonly id: string;
  readonly kind: "computation" | "derivation" | "source";
  readonly label: string;
}

export interface KpTutorialUncertainty {
  readonly kind: "bounded" | "none" | "qualitative";
  readonly statement: string;
}

export interface KpTutorialEpistemicNarration {
  readonly id: string;
  readonly claimId: string;
  readonly text: string;
  readonly proofStatus: KpTutorialProofStatus;
  readonly scope: KpTutorialModelScope;
  readonly validity: KpTutorialValidity;
  readonly provenance: readonly KpTutorialProvenanceRef[];
  readonly uncertainty: KpTutorialUncertainty;
}

export interface KpTutorialEpistemicDiagnostic {
  readonly path: string;
  readonly message: string;
}

export function validateKpTutorialEpistemicNarration(input: {
  readonly claimGraph: KpTutorialClaimGraph;
  readonly narrations: readonly KpTutorialEpistemicNarration[];
}): readonly KpTutorialEpistemicDiagnostic[] {
  const diagnostics: KpTutorialEpistemicDiagnostic[] = [];
  const claimIds = new Set(input.claimGraph.nodes.map(({ id }) => id));
  const narrationIds = new Set<string>();

  input.narrations.forEach((narration, index) => {
    const path = `narrations[${index}]`;
    if (narrationIds.has(narration.id)) {
      diagnostics.push({
        path: `${path}.id`,
        message: `Duplicate narration ${narration.id}.`
      });
    }
    narrationIds.add(narration.id);
    if (!claimIds.has(narration.claimId)) {
      diagnostics.push({
        path: `${path}.claimId`,
        message: `Unknown claim ${narration.claimId}.`
      });
    }
    requireText(narration.text, `${path}.text`, diagnostics);
    requireText(narration.scope.domain, `${path}.scope.domain`, diagnostics);
    requireText(
      narration.validity.explanation,
      `${path}.validity.explanation`,
      diagnostics
    );
    requireText(
      narration.uncertainty.statement,
      `${path}.uncertainty.statement`,
      diagnostics
    );
    if (narration.provenance.length === 0) {
      diagnostics.push({
        path: `${path}.provenance`,
        message: "Epistemic narration requires claim-level provenance."
      });
    }
    if (
      narration.validity.status === "intentional-invalid" &&
      narration.proofStatus === "formal"
    ) {
      diagnostics.push({
        path,
        message: "An intentional invalid state cannot claim formal proof status."
      });
    }
    if (
      narration.scope.generality === "generic" &&
      narration.scope.assumptions.length === 0
    ) {
      diagnostics.push({
        path: `${path}.scope.assumptions`,
        message: "Generic claims must state their assumptions."
      });
    }
  });

  return diagnostics;
}

function requireText(
  value: string,
  path: string,
  diagnostics: KpTutorialEpistemicDiagnostic[]
): void {
  if (value.trim().length === 0) {
    diagnostics.push({ path, message: "Required epistemic text is empty." });
  }
}
