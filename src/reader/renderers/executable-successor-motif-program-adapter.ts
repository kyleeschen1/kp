import type {
  KpExecutableSuccessorMotifPhase,
  KpExecutableSuccessorMotifPhaseEffect,
  KpExecutableSuccessorMotifProgramDraft,
  KpExecutableSuccessorMotifSemanticRole,
  KpVerifiedExecutableSuccessorMotifProgram
} from "../../animation/motifs/executable-successor-motif-program.ts";
import {
  isKpVerifiedExecutableSuccessorMotifProgram
} from "../../animation/motifs/executable-successor-motif-program-validator.ts";
import type {
  KpFissionFusionPlan
} from "../../animation/fission-fusion.ts";
import type {
  KpNativeKatexSuccessorSynthesisIntent
} from "../../rendering/native-katex-successor-synthesis.ts";

type KpVerifiedProgramOf<
  Kind extends KpExecutableSuccessorMotifProgramDraft["kind"]
> = KpVerifiedExecutableSuccessorMotifProgram &
  Extract<KpExecutableSuccessorMotifProgramDraft, { readonly kind: Kind }>;

const kpExecutableSuccessorMotifProgramRouteAuthority = Symbol(
  "kp.executable-successor-motif-program-route"
);
const verifiedProgramRoutes = new WeakSet<object>();
const programRoutes = new WeakMap<
  KpVerifiedExecutableSuccessorMotifProgram,
  KpExecutableSuccessorMotifProgramRoute
>();

export type KpExecutableSuccessorMotifPrimitiveRoute =
  | "native-katex-successor-synthesis"
  | "fission-fusion:fission"
  | "fission-fusion:fusion";

export interface KpExecutableSuccessorMotifProgramRoute {
  readonly kind: "executable-successor-motif-program-route";
  readonly programId: string;
  readonly programVersion: string;
  readonly programKind:
    KpExecutableSuccessorMotifProgramDraft["kind"];
  readonly primitiveRoute: KpExecutableSuccessorMotifPrimitiveRoute;
  readonly [kpExecutableSuccessorMotifProgramRouteAuthority]: true;
}

export type KpExecutableSuccessorMotifProgramAdapterInput =
  | {
      readonly kind: "operation-evaluation";
      readonly program: KpVerifiedProgramOf<"operation-evaluation">;
      readonly direction: "forward" | "rewind";
      readonly primitive: {
        readonly kind: "native-katex-successor-synthesis";
        readonly intents: readonly [
          KpNativeKatexSuccessorSynthesisIntent,
          ...KpNativeKatexSuccessorSynthesisIntent[]
        ];
      };
    }
  | {
      readonly kind: "identity-fission";
      readonly program: KpVerifiedProgramOf<"identity-fission">;
      readonly direction: "forward" | "rewind";
      readonly primitive: {
        readonly kind: "fission-fusion";
        readonly plan: KpFissionFusionPlan & {
          readonly mode: "fission";
        };
      };
    }
  | {
      readonly kind: "identity-fusion";
      readonly program: KpVerifiedProgramOf<"identity-fusion">;
      readonly direction: "forward" | "rewind";
      readonly primitive: {
        readonly kind: "fission-fusion";
        readonly plan: KpFissionFusionPlan & {
          readonly mode: "fusion";
        };
      };
    };

export interface KpExecutableSuccessorMotifPhaseTelemetryEntry {
  readonly id: string;
  readonly effect: KpExecutableSuccessorMotifPhaseEffect;
  readonly requiredRoles:
    readonly KpExecutableSuccessorMotifSemanticRole[];
  readonly executionOrdinal: number;
  readonly state: "pending" | "active" | "complete";
  readonly progress: number;
}

export interface KpExecutableSuccessorMotifPhaseTelemetry {
  readonly kind: "executable-successor-motif-phase-telemetry";
  readonly programId: string;
  readonly programVersion: string;
  readonly programKind:
    KpExecutableSuccessorMotifProgramDraft["kind"];
  readonly direction: "forward" | "rewind";
  readonly progress: number;
  readonly activePhaseId: string;
  readonly phases: readonly KpExecutableSuccessorMotifPhaseTelemetryEntry[];
}

interface KpExecutableSuccessorMotifProgramAdapterDispatchBase {
  readonly kind: "executable-successor-motif-program-adapter-dispatch";
  readonly route: KpExecutableSuccessorMotifProgramRoute;
  readonly programId: string;
  readonly programVersion: string;
  readonly programKind:
    KpExecutableSuccessorMotifProgramDraft["kind"];
  readonly direction: "forward" | "rewind";
  readonly phaseOrder: readonly string[];
  readonly samplePhaseTelemetry:
    (progress: number) => KpExecutableSuccessorMotifPhaseTelemetry;
}

export type KpExecutableSuccessorMotifProgramAdapterDispatch =
  | (KpExecutableSuccessorMotifProgramAdapterDispatchBase & {
      readonly programKind: "operation-evaluation";
      readonly primitive: {
        readonly kind: "native-katex-successor-synthesis";
        readonly intents: readonly [
          KpNativeKatexSuccessorSynthesisIntent,
          ...KpNativeKatexSuccessorSynthesisIntent[]
        ];
      };
    })
  | (KpExecutableSuccessorMotifProgramAdapterDispatchBase & {
      readonly programKind: "identity-fission";
      readonly primitive: {
        readonly kind: "fission-fusion";
        readonly plan: KpFissionFusionPlan & {
          readonly mode: "fission";
        };
      };
    })
  | (KpExecutableSuccessorMotifProgramAdapterDispatchBase & {
      readonly programKind: "identity-fusion";
      readonly primitive: {
        readonly kind: "fission-fusion";
        readonly plan: KpFissionFusionPlan & {
          readonly mode: "fusion";
        };
      };
    });

/**
 * Promotion and catalog code may ask which existing primitive a program can
 * execute without constructing renderer inputs. The sealed route is minted by
 * the same exhaustive boundary used by real dispatch, so a matching label or
 * copied object cannot stand in for executable support.
 */
export function resolveKpExecutableSuccessorMotifProgramRoute(
  program: KpVerifiedExecutableSuccessorMotifProgram
): KpExecutableSuccessorMotifProgramRoute {
  if (!isKpVerifiedExecutableSuccessorMotifProgram(program)) {
    throw new Error(
      "Executable successor motif route requires minted program authority."
    );
  }
  const existing = programRoutes.get(program);
  if (existing !== undefined) return existing;

  const primitiveRoute = primitiveRouteForProgram(program);
  const route = Object.freeze({
    kind: "executable-successor-motif-program-route" as const,
    programId: program.id,
    programVersion: program.programVersion,
    programKind: program.kind,
    primitiveRoute,
    [kpExecutableSuccessorMotifProgramRouteAuthority]: true as const
  });
  verifiedProgramRoutes.add(route);
  programRoutes.set(program, route);
  return route;
}

export function isKpExecutableSuccessorMotifProgramRoute(
  value: unknown
): value is KpExecutableSuccessorMotifProgramRoute {
  return (
    typeof value === "object" &&
    value !== null &&
    verifiedProgramRoutes.has(value)
  );
}

/**
 * This is the sole program-to-primitive dispatch. It selects among existing
 * compositor primitives and exposes program-owned phase order; it does not
 * create a renderer, lifecycle, clock, DOM node, path, or timing surface.
 */
export function compileKpExecutableSuccessorMotifProgramAdapter(
  input: KpExecutableSuccessorMotifProgramAdapterInput
): KpExecutableSuccessorMotifProgramAdapterDispatch {
  if (
    !isKpVerifiedExecutableSuccessorMotifProgram(input.program) ||
    input.program.kind !== input.kind
  ) {
    throw new Error(
      "Executable successor motif adapter requires matching minted authority."
    );
  }

  switch (input.kind) {
    case "operation-evaluation":
      if (
        input.primitive.kind !== "native-katex-successor-synthesis" ||
        input.primitive.intents.length === 0
      ) {
        throw new Error(
          "Operation evaluation requires existing successor-synthesis intents."
        );
      }
      return dispatch(input, {
        kind: "native-katex-successor-synthesis",
        intents: Object.freeze([...input.primitive.intents]) as
          readonly [
            KpNativeKatexSuccessorSynthesisIntent,
            ...KpNativeKatexSuccessorSynthesisIntent[]
          ]
      });
    case "identity-fission":
      if (
        input.primitive.kind !== "fission-fusion" ||
        input.primitive.plan.mode !== "fission"
      ) {
        throw new Error(
          "Identity fission requires the existing fission primitive."
        );
      }
      return dispatch(input, Object.freeze({
        kind: "fission-fusion",
        plan: input.primitive.plan
      }));
    case "identity-fusion":
      if (
        input.primitive.kind !== "fission-fusion" ||
        input.primitive.plan.mode !== "fusion"
      ) {
        throw new Error(
          "Identity fusion requires the existing fusion primitive."
        );
      }
      return dispatch(input, Object.freeze({
        kind: "fission-fusion",
        plan: input.primitive.plan
      }));
    default:
      return unreachableProgram(input);
  }
}

function dispatch(
  input: KpExecutableSuccessorMotifProgramAdapterInput,
  primitive: KpExecutableSuccessorMotifProgramAdapterDispatch["primitive"]
): KpExecutableSuccessorMotifProgramAdapterDispatch {
  const phaseOrder = input.direction === "forward"
    ? [...input.program.phases]
    : [...input.program.phases].reverse();
  const base = {
    kind: "executable-successor-motif-program-adapter-dispatch" as const,
    route: resolveKpExecutableSuccessorMotifProgramRoute(input.program),
    programId: input.program.id,
    programVersion: input.program.programVersion,
    programKind: input.program.kind,
    direction: input.direction,
    phaseOrder: Object.freeze(phaseOrder.map(({ id }) => id)),
    samplePhaseTelemetry: (progress: number) =>
      samplePhaseTelemetry({
        program: input.program,
        direction: input.direction,
        orderedPhases: phaseOrder,
        progress
      })
  };
  return Object.freeze({ ...base, primitive }) as
    KpExecutableSuccessorMotifProgramAdapterDispatch;
}

function primitiveRouteForProgram(
  program: KpVerifiedExecutableSuccessorMotifProgram
): KpExecutableSuccessorMotifPrimitiveRoute {
  switch (program.kind) {
    case "operation-evaluation":
      return "native-katex-successor-synthesis";
    case "identity-fission":
      return "fission-fusion:fission";
    case "identity-fusion":
      return "fission-fusion:fusion";
    default:
      return unreachableProgram(program);
  }
}

function samplePhaseTelemetry(input: {
  readonly program: KpVerifiedExecutableSuccessorMotifProgram;
  readonly direction: "forward" | "rewind";
  readonly orderedPhases: readonly KpExecutableSuccessorMotifPhase<
    string,
    KpExecutableSuccessorMotifPhaseEffect,
    KpExecutableSuccessorMotifSemanticRole
  >[];
  readonly progress: number;
}): KpExecutableSuccessorMotifPhaseTelemetry {
  const progress = clamp01(input.progress);
  const count = input.orderedPhases.length;
  const activeIndex = progress >= 1
    ? count - 1
    : Math.min(count - 1, Math.floor(progress * count));
  const localProgress = progress >= 1
    ? 1
    : progress * count - activeIndex;
  const phases = input.orderedPhases.map((phase, index) => Object.freeze({
    id: phase.id,
    effect: phase.effect,
    requiredRoles: Object.freeze([...phase.requiredRoles]),
    executionOrdinal: index,
    state: (
      index < activeIndex
        ? "complete"
        : index === activeIndex
          ? progress >= 1 ? "complete" : "active"
          : "pending"
    ) as "pending" | "active" | "complete",
    progress: index < activeIndex || progress >= 1
      ? 1
      : index === activeIndex ? round(localProgress) : 0
  }));
  return Object.freeze({
    kind: "executable-successor-motif-phase-telemetry",
    programId: input.program.id,
    programVersion: input.program.programVersion,
    programKind: input.program.kind,
    direction: input.direction,
    progress,
    activePhaseId: input.orderedPhases[activeIndex]!.id,
    phases: Object.freeze(phases)
  });
}

function unreachableProgram(value: never): never {
  throw new Error(
    `Unsupported executable successor motif program ${String(value)}.`
  );
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function round(value: number): number {
  const rounded = Math.round(value * 1_000_000) / 1_000_000;
  return Object.is(rounded, -0) ? 0 : rounded;
}
