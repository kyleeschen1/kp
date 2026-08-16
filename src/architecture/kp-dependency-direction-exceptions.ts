import type {
  KpDependencyCouplingKind,
  KpModuleDependencyReference
} from "./kp-dependency-direction-policy.ts";

export type KpDependencyRetirementOwner = never;

export type KpDependencyRetirementSlice = never;

export interface KpDependencyDirectionException {
  readonly id: string;
  readonly importer: string;
  readonly target: string;
  readonly kind: KpDependencyCouplingKind;
  readonly owner: KpDependencyRetirementOwner;
  readonly retireWhen: string;
  readonly plannedSlice: KpDependencyRetirementSlice;
}

export const kpDependencyDirectionExceptions: readonly KpDependencyDirectionException[] =
  Object.freeze([]);

const exceptionByEdge = new Map(
  kpDependencyDirectionExceptions.map((entry) => [
    kpDependencyDirectionExceptionKey(entry),
    entry
  ])
);

export function resolveKpDependencyDirectionException(
  reference: Pick<KpModuleDependencyReference, "importer" | "target" | "kind">
): KpDependencyDirectionException | undefined {
  return exceptionByEdge.get(kpDependencyDirectionExceptionKey(reference));
}

export function kpDependencyDirectionExceptionKey(
  reference: Pick<KpModuleDependencyReference, "importer" | "target" | "kind">
): string {
  return `${reference.kind}:${reference.importer}->${reference.target}`;
}
