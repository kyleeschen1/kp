import type { KpClaimSceneGraphBundle } from "./claim-scene-graphs.ts";
import type { KpHermeneuticTutorialModule } from "./hermeneutic-module.ts";

export const kpInterpretivePhaseOrder = [
  "establish-whole",
  "isolate-part",
  "relate",
  "reintegrate"
] as const;

export type KpInterpretivePhaseKind =
  (typeof kpInterpretivePhaseOrder)[number];

export interface KpInterpretivePhase {
  readonly id: string;
  readonly kind: KpInterpretivePhaseKind;
  readonly claimIds: readonly string[];
  readonly checkpointIds: readonly string[];
  readonly focusBindingIds: readonly string[];
}

export interface KpInterpretiveCycle {
  readonly id: string;
  readonly title: string;
  readonly phases: readonly KpInterpretivePhase[];
}

export interface KpInterpretiveCycleDiagnostic {
  readonly path: string;
  readonly message: string;
}

export function validateKpInterpretiveCycle(input: {
  readonly cycle: KpInterpretiveCycle;
  readonly module: KpHermeneuticTutorialModule;
  readonly graphBundle: KpClaimSceneGraphBundle;
}): readonly KpInterpretiveCycleDiagnostic[] {
  const diagnostics: KpInterpretiveCycleDiagnostic[] = [];
  const claimIds = new Set(input.graphBundle.claimGraph.nodes.map(({ id }) => id));
  const checkpointIds = new Set(input.module.checkpoints.map(({ id }) => id));
  const bindingIds = new Set(input.graphBundle.bindings.map(({ id }) => id));

  if (input.cycle.phases.length !== kpInterpretivePhaseOrder.length) {
    diagnostics.push({
      path: "phases",
      message: "An interpretive cycle must declare exactly four phases."
    });
  }

  input.cycle.phases.forEach((phase, index) => {
    if (phase.kind !== kpInterpretivePhaseOrder[index]) {
      diagnostics.push({
        path: `phases[${index}].kind`,
        message: `Expected ${kpInterpretivePhaseOrder[index] ?? "no phase"}.`
      });
    }
    requireRefs(phase.claimIds, claimIds, `phases[${index}].claimIds`, diagnostics);
    requireRefs(
      phase.checkpointIds,
      checkpointIds,
      `phases[${index}].checkpointIds`,
      diagnostics
    );
    requireRefs(
      phase.focusBindingIds,
      bindingIds,
      `phases[${index}].focusBindingIds`,
      diagnostics
    );

    if (phase.claimIds.length === 0 || phase.checkpointIds.length === 0) {
      diagnostics.push({
        path: `phases[${index}]`,
        message: "Every phase must name an authored claim and checkpoint."
      });
    }
  });

  return diagnostics;
}

function requireRefs(
  refs: readonly string[],
  known: ReadonlySet<string>,
  path: string,
  diagnostics: KpInterpretiveCycleDiagnostic[]
): void {
  refs.forEach((ref, index) => {
    if (!known.has(ref)) {
      diagnostics.push({
        path: `${path}[${index}]`,
        message: `Unknown authored reference ${ref}.`
      });
    }
  });
}
