export type KpKatexStructuralArtifactKind =
  | "fraction-bar"
  | "radical-line"
  | "radical-tail"
  | "accent-line"
  | "left-delimiter"
  | "right-delimiter";

export interface KpKatexStructuralArtifactBindingSpec {
  readonly artifactSelectorId: string;
  readonly ownerSelectorId: string;
  readonly kind: KpKatexStructuralArtifactKind;
  readonly occurrence?: number | undefined;
  readonly expectedText?: string | undefined;
}

export interface KpKatexStructuralTokenRef {
  readonly tokenId: string;
  readonly text: string;
  readonly signature: string;
}

export interface KpResolvedKatexStructuralArtifactBinding {
  readonly artifactSelectorId: string;
  readonly ownerSelectorId: string;
  readonly kind: KpKatexStructuralArtifactKind;
  readonly motionId: string;
  readonly tokenId: string;
}

export interface KpKatexStructuralArtifactBindingDiagnostic {
  readonly code: "katex-artifact.invalid-spec" | "katex-artifact.token-not-found";
  readonly message: string;
  readonly artifactSelectorId: string;
}

export interface KpKatexStructuralArtifactBindingResult {
  readonly bindings: readonly KpResolvedKatexStructuralArtifactBinding[];
  readonly diagnostics: readonly KpKatexStructuralArtifactBindingDiagnostic[];
}

export function resolveKpKatexStructuralArtifactBindings(input: {
  readonly stateId: string;
  readonly specs: readonly KpKatexStructuralArtifactBindingSpec[];
  readonly tokens: readonly KpKatexStructuralTokenRef[];
}): KpKatexStructuralArtifactBindingResult {
  const bindings: KpResolvedKatexStructuralArtifactBinding[] = [];
  const diagnostics: KpKatexStructuralArtifactBindingDiagnostic[] = [];
  const selectorIds = new Set<string>();
  const claimedTokenIds = new Set<string>();

  for (const spec of input.specs) {
    const problem = validateSpec(spec, selectorIds);
    selectorIds.add(spec.artifactSelectorId);
    if (problem !== undefined) {
      diagnostics.push({
        code: "katex-artifact.invalid-spec",
        message: problem,
        artifactSelectorId: spec.artifactSelectorId
      });
      continue;
    }

    const candidates = input.tokens.filter((token) =>
      !claimedTokenIds.has(token.tokenId) && tokenMatchesArtifact(token, spec)
    );
    const token = candidates[spec.occurrence ?? 0];
    if (token === undefined) {
      diagnostics.push({
        code: "katex-artifact.token-not-found",
        message:
          `KaTeX artifact ${spec.artifactSelectorId} (${spec.kind}) did not match occurrence ${spec.occurrence ?? 0}.`,
        artifactSelectorId: spec.artifactSelectorId
      });
      continue;
    }

    claimedTokenIds.add(token.tokenId);
    bindings.push({
      artifactSelectorId: spec.artifactSelectorId,
      ownerSelectorId: spec.ownerSelectorId,
      kind: spec.kind,
      motionId: `${input.stateId}.${spec.artifactSelectorId}`,
      tokenId: token.tokenId
    });
  }

  return { bindings, diagnostics };
}

function validateSpec(
  spec: KpKatexStructuralArtifactBindingSpec,
  selectorIds: ReadonlySet<string>
): string | undefined {
  if (!safeId(spec.artifactSelectorId) || !safeId(spec.ownerSelectorId)) {
    return `KaTeX artifact ${spec.artifactSelectorId} requires safe artifact and owner selector ids.`;
  }
  if (selectorIds.has(spec.artifactSelectorId)) {
    return `KaTeX artifact selector ${spec.artifactSelectorId} is bound more than once.`;
  }
  if (!Number.isInteger(spec.occurrence ?? 0) || (spec.occurrence ?? 0) < 0) {
    return `KaTeX artifact ${spec.artifactSelectorId} occurrence must be a non-negative integer.`;
  }
  if (
    (spec.kind === "left-delimiter" || spec.kind === "right-delimiter") &&
    (spec.expectedText === undefined || spec.expectedText.length === 0)
  ) {
    return `KaTeX delimiter artifact ${spec.artifactSelectorId} requires expectedText.`;
  }
  return undefined;
}

function tokenMatchesArtifact(
  token: KpKatexStructuralTokenRef,
  spec: KpKatexStructuralArtifactBindingSpec
): boolean {
  switch (spec.kind) {
    case "fraction-bar": return token.text === "structural:frac-line";
    case "radical-line": return token.text === "structural:sqrt-line";
    case "radical-tail": return token.text === "structural:hide-tail";
    case "accent-line": return token.text === "structural:overline-line";
    case "left-delimiter":
      return token.text === spec.expectedText && token.signature.includes("mopen");
    case "right-delimiter":
      return token.text === spec.expectedText && token.signature.includes("mclose");
  }
}

function safeId(value: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(value);
}
