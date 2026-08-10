export const kpCanonicalEquationHostProvenanceSchema =
  "kp.canonical-equation-host-provenance.v1" as const;

/**
 * An animation id identifies semantic content, not the approved way to present
 * it. This lock names the reader runtime and descriptor that jointly own the
 * certified host so consumers cannot silently substitute a generic renderer.
 */
export interface KpCanonicalEquationHostProvenance {
  readonly kind: "kp-canonical-equation-host-provenance";
  readonly schemaVersion: typeof kpCanonicalEquationHostProvenanceSchema;
  readonly animationId: string;
  readonly representation: Readonly<{
    id: string;
    kind: "reader";
    href: `/${string}`;
    role: "canonical-host";
  }>;
  readonly runtime: Readonly<{
    family: "reader-canonical-equation";
    lessonDescriptorId: string;
  }>;
}

export function defineKpCanonicalEquationHostProvenance(
  input: KpCanonicalEquationHostProvenance
): KpCanonicalEquationHostProvenance {
  if (
    input.animationId.length === 0 ||
    input.representation.id.length === 0 ||
    input.runtime.lessonDescriptorId.length === 0 ||
    !input.representation.href.startsWith("/")
  ) {
    throw new Error("Canonical equation host provenance must be complete.");
  }
  return Object.freeze({
    ...input,
    representation: Object.freeze({ ...input.representation }),
    runtime: Object.freeze({ ...input.runtime })
  });
}
