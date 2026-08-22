import type {
  KpEditorAnimationSurfaceAdapterRegistry
} from "./animation-surface-adapter-registry.ts";
import {
  kpEditorGraphSvgAnimationIds,
  kpEditorSelectedSurfaceCapabilityValues,
  type KpEditorSelectedSurfaceCapability
} from "./selected-surface-capability.ts";

export type KpEditorSelectedSurfaceCapabilityDomain =
  | "equation"
  | "graph"
  | "programming";

export type KpEditorCapabilityRegistrationOwner =
  | "provided-registry"
  | "capability-module-global-registry";

export interface KpEditorSelectedSurfaceCapabilityDeclaration {
  readonly schemaVersion:
    "kp.editor-selected-surface-capability-declaration.v1";
  readonly capabilityId: KpEditorSelectedSurfaceCapability;
  readonly domain: KpEditorSelectedSurfaceCapabilityDomain;
  readonly adapterIds: readonly string[];
  readonly registrationGuardAdapterId: string;
  readonly registrationOwner: KpEditorCapabilityRegistrationOwner;
  loadAndRegister(
    registry: KpEditorAnimationSurfaceAdapterRegistry
  ): Promise<void>;
}

export interface KpEditorSelectedSurfaceCapabilityDeclarationSet {
  readonly schemaVersion:
    "kp.editor-selected-surface-capability-declaration-set.v1";
  readonly entries:
    readonly KpEditorSelectedSurfaceCapabilityDeclaration[];
  find(
    capabilityId: KpEditorSelectedSurfaceCapability
  ): KpEditorSelectedSurfaceCapabilityDeclaration;
}

export type KpEditorSelectedSurfaceCapabilityDeclarationDiagnosticCode =
  | "duplicate-capability"
  | "missing-capability"
  | "unexpected-capability"
  | "missing-adapter"
  | "invalid-registration-guard";

export class KpEditorSelectedSurfaceCapabilityDeclarationError extends Error {
  override readonly name =
    "KpEditorSelectedSurfaceCapabilityDeclarationError";
  readonly diagnostics: readonly {
    readonly code:
      KpEditorSelectedSurfaceCapabilityDeclarationDiagnosticCode;
    readonly capabilityId: string;
    readonly message: string;
  }[];

  constructor(diagnostics: KpEditorSelectedSurfaceCapabilityDeclarationError["diagnostics"]) {
    super(diagnostics.map(({ message }) => message).join("\n"));
    this.diagnostics = diagnostics;
  }
}

// Literal imports live in the immutable declarations so the protocol can be
// extended without converting chunk ownership into a computed module lookup.
export const kpEditorSelectedSurfaceCapabilityDeclarations = Object.freeze([
  declaration({
    capabilityId: "carrier-preserving-simplification",
    domain: "equation",
    adapterIds: [
      "editor-animation-surface.operation-evaluation.carrier-preserving-simplification"
    ],
    registrationOwner: "provided-registry",
    async loadAndRegister(registry, registrationGuardAdapterId) {
      const [client] = await Promise.all([
        import("./carrier-preserving-simplification-surface-capability.ts"),
        ...(typeof document === "undefined" ? [] : [
          import("katex/dist/katex.min.css"),
          import("./carrier-preserving-simplification-surface.css")
        ])
      ]);
      await registerOnce(registry, registrationGuardAdapterId,
        () => client
          .registerKpEditorCarrierPreservingSimplificationSurfaceCapability(
            registry
          ));
    }
  }),
  declaration({
    capabilityId: "equation-katex",
    domain: "equation",
    adapterIds: ["editor-animation-surface.equation.katex"],
    registrationOwner: "capability-module-global-registry",
    async loadAndRegister(registry, registrationGuardAdapterId) {
      const client = await import("./equation-surface-capability.ts");
      await registerOnce(registry, registrationGuardAdapterId,
        client.registerKpEditorEquationSurfaceCapability);
    }
  }),
  declaration({
    capabilityId: "fraction-equivalence",
    domain: "equation",
    adapterIds: [
      "editor-animation-surface.fraction-equivalence.canonical-native-katex",
      "editor-animation-surface.fraction-equivalence.common-denominator-pressure"
    ],
    registrationOwner: "provided-registry",
    async loadAndRegister(registry, registrationGuardAdapterId) {
      const client = await import(
        "./fraction-equivalence-surface-capability.ts"
      );
      await registerOnce(registry, registrationGuardAdapterId,
        () => client.registerKpEditorFractionEquivalenceSurfaceCapability(
          registry
        ));
    }
  }),
  declaration({
    capabilityId: "finite-binder-expansion",
    domain: "equation",
    adapterIds: [
      "editor-animation-surface.finite-sum-expansion.canonical-native-katex"
    ],
    registrationOwner: "provided-registry",
    async loadAndRegister(registry, registrationGuardAdapterId) {
      const client = await import("./finite-sum-surface-capability.ts");
      await registerOnce(registry, registrationGuardAdapterId,
        () => client.registerKpEditorFiniteSumSurfaceCapability(registry));
    }
  }),
  declaration({
    capabilityId: "log-exponent",
    domain: "equation",
    adapterIds: [
      "editor-animation-surface.log-exponent.canonical-native-katex"
    ],
    registrationOwner: "provided-registry",
    async loadAndRegister(registry, registrationGuardAdapterId) {
      const client = await import("./log-exponent-surface-capability.ts");
      await registerOnce(registry, registrationGuardAdapterId,
        () => client.registerKpEditorLogExponentSurfaceCapability(registry));
    }
  }),
  declaration({
    capabilityId: "logarithm-change-of-base",
    domain: "equation",
    adapterIds: [
      "editor-animation-surface.logarithm-change-of-base.canonical-native-katex"
    ],
    registrationOwner: "provided-registry",
    async loadAndRegister(registry, registrationGuardAdapterId) {
      const client = await import(
        "./logarithm-change-of-base-surface-capability.ts"
      );
      await registerOnce(registry, registrationGuardAdapterId,
        () => client.registerKpEditorLogarithmChangeOfBaseSurfaceCapability(
          registry
        ));
    }
  }),
  declaration({
    capabilityId: "log-quotient",
    domain: "equation",
    adapterIds: [
      "editor-animation-surface.log-quotient.canonical-native-katex"
    ],
    registrationOwner: "provided-registry",
    async loadAndRegister(registry, registrationGuardAdapterId) {
      const client = await import("./log-quotient-surface-capability.ts");
      await registerOnce(registry, registrationGuardAdapterId,
        () => client.registerKpEditorLogQuotientSurfaceCapability(registry));
    }
  }),
  declaration({
    capabilityId: "log-product",
    domain: "equation",
    adapterIds: [
      "editor-animation-surface.log-product.canonical-native-katex",
      "editor-animation-surface.log-product.equivalence-frame.native-katex"
    ],
    registrationOwner: "provided-registry",
    async loadAndRegister(registry, registrationGuardAdapterId) {
      const client = await import("./log-product-surface-capability.ts");
      await registerOnce(registry, registrationGuardAdapterId,
        () => client.registerKpEditorLogProductSurfaceCapability(registry));
    }
  }),
  declaration({
    capabilityId: "exponential-homomorphism",
    domain: "equation",
    adapterIds: [
      "editor-animation-surface.exponential-homomorphism.canonical-native-katex"
    ],
    registrationOwner: "provided-registry",
    async loadAndRegister(registry, registrationGuardAdapterId) {
      const client = await import(
        "./exponential-homomorphism-surface-capability.ts"
      );
      await registerOnce(registry, registrationGuardAdapterId,
        () => client.registerKpEditorExponentialHomomorphismSurfaceCapability(
          registry
        ));
    }
  }),
  declaration({
    capabilityId: "even-root",
    domain: "equation",
    adapterIds: [
      "editor-animation-surface.even-root.canonical-native-katex",
      "editor-animation-surface.root.compound-carrier.canonical-native-katex"
    ],
    registrationOwner: "provided-registry",
    async loadAndRegister(registry, registrationGuardAdapterId) {
      const client = await import("./even-root-surface-capability.ts");
      await registerOnce(registry, registrationGuardAdapterId,
        () => client.registerKpEditorEvenRootSurfaceCapability(registry));
    }
  }),
  declaration({
    capabilityId: "exact-fraction-quantity",
    domain: "equation",
    adapterIds: [
      "editor-animation-surface.exact-fraction-quantity.synchronized"
    ],
    registrationOwner: "provided-registry",
    async loadAndRegister(registry, registrationGuardAdapterId) {
      const client = await import(
        "./exact-fraction-quantity-surface-capability.ts"
      );
      await registerOnce(registry, registrationGuardAdapterId,
        () => client.registerKpEditorExactFractionQuantitySurfaceCapability(
          registry
        ));
    }
  }),
  declaration({
    capabilityId: "operation-evaluation",
    domain: "equation",
    adapterIds: [
      "editor-animation-surface.operation-evaluation.canonical-native-katex"
    ],
    registrationOwner: "provided-registry",
    async loadAndRegister(registry, registrationGuardAdapterId) {
      const client = await import(
        "./operation-evaluation-surface-capability.ts"
      );
      await registerOnce(registry, registrationGuardAdapterId,
        () => client.registerKpEditorOperationEvaluationSurfaceCapability(
          registry
        ));
    }
  }),
  declaration({
    capabilityId: "place-value-addition",
    domain: "equation",
    adapterIds: [
      "editor-animation-surface.place-value-addition.synchronized"
    ],
    registrationOwner: "provided-registry",
    async loadAndRegister(registry, registrationGuardAdapterId) {
      const client = await import(
        "./place-value-addition-surface-adapter.ts"
      );
      await registerOnce(registry, registrationGuardAdapterId,
        () => registry.register(
          client.kpEditorPlaceValueAdditionSurfaceAdapter
        ));
    }
  }),
  declaration({
    capabilityId: "graph-svg-economics",
    domain: "graph",
    adapterIds: ["editor-animation-surface.graph.svg.economics"],
    registrationOwner: "provided-registry",
    async loadAndRegister(registry, registrationGuardAdapterId) {
      const client = await import(
        "./economics-graph-svg-surface-capability.ts"
      );
      await registerOnce(registry, registrationGuardAdapterId,
        async () => registry.register(
          await client.createKpEconomicsGraphSvgSurfaceCapability()
        ));
    }
  }),
  declaration({
    capabilityId: "graph-svg-katex-labels",
    domain: "graph",
    adapterIds: ["editor-animation-surface.graph.svg"],
    registrationOwner: "capability-module-global-registry",
    async loadAndRegister(registry, registrationGuardAdapterId) {
      const client = await import("./graph-svg-surface-capability.ts");
      await registerOnce(registry, registrationGuardAdapterId,
        () => client.registerKpEditorGraphSvgSurfaceCapability(
          kpEditorGraphSvgAnimationIds
        ));
    }
  }),
  declaration({
    capabilityId: "graph-webgl-3d",
    domain: "graph",
    adapterIds: ["editor-animation-surface.graph.webgl-3d"],
    registrationOwner: "capability-module-global-registry",
    async loadAndRegister(registry, registrationGuardAdapterId) {
      const client = await import("./graph-3d-surface-capability.ts");
      await registerOnce(registry, registrationGuardAdapterId,
        client.registerKpEditorGraph3DSurfaceCapability);
    }
  }),
  declaration({
    capabilityId: "programming-trace",
    domain: "programming",
    adapterIds: ["editor-animation-surface.programming.trace"],
    registrationOwner: "capability-module-global-registry",
    async loadAndRegister(registry, registrationGuardAdapterId) {
      const client = await import("./programming-surface-capability.ts");
      await registerOnce(registry, registrationGuardAdapterId,
        client.registerKpEditorProgrammingSurfaceCapability);
    }
  })
]);

export function compileKpEditorSelectedSurfaceCapabilityDeclarationSet(input: {
  readonly declarations:
    readonly KpEditorSelectedSurfaceCapabilityDeclaration[];
  readonly expectedCapabilityIds?:
    readonly KpEditorSelectedSurfaceCapability[] | undefined;
}): KpEditorSelectedSurfaceCapabilityDeclarationSet {
  const expected = input.expectedCapabilityIds ??
    kpEditorSelectedSurfaceCapabilityValues;
  const diagnostics:
    KpEditorSelectedSurfaceCapabilityDeclarationError["diagnostics"][number][] = [];
  const seen = new Set<string>();
  const expectedSet = new Set<string>(expected);
  for (const declaration of input.declarations) {
    if (seen.has(declaration.capabilityId)) {
      diagnostics.push(diagnostic("duplicate-capability", declaration.capabilityId,
        `Duplicate capability declaration ${declaration.capabilityId}.`));
    }
    seen.add(declaration.capabilityId);
    if (!expectedSet.has(declaration.capabilityId)) {
      diagnostics.push(diagnostic("unexpected-capability", declaration.capabilityId,
        `Unexpected capability declaration ${declaration.capabilityId}.`));
    }
    if (declaration.adapterIds.length === 0) {
      diagnostics.push(diagnostic("missing-adapter", declaration.capabilityId,
        `Capability ${declaration.capabilityId} declares no adapter.`));
    }
    if (!declaration.adapterIds.includes(
      declaration.registrationGuardAdapterId
    )) {
      diagnostics.push(diagnostic("invalid-registration-guard",
        declaration.capabilityId,
        `Capability ${declaration.capabilityId} guards an undeclared adapter ${declaration.registrationGuardAdapterId}.`));
    }
  }
  for (const capabilityId of expected) {
    if (!seen.has(capabilityId)) {
      diagnostics.push(diagnostic("missing-capability", capabilityId,
        `Missing capability declaration ${capabilityId}.`));
    }
  }
  if (diagnostics.length > 0) {
    throw new KpEditorSelectedSurfaceCapabilityDeclarationError(
      Object.freeze(diagnostics)
    );
  }
  const entries = Object.freeze([...input.declarations]);
  return Object.freeze({
    schemaVersion:
      "kp.editor-selected-surface-capability-declaration-set.v1" as const,
    entries,
    find(capabilityId: KpEditorSelectedSurfaceCapability) {
      const result = entries.find((entry) =>
        entry.capabilityId === capabilityId
      );
      if (result === undefined) {
        throw new KpEditorSelectedSurfaceCapabilityDeclarationError([
          diagnostic("missing-capability", capabilityId,
            `Missing capability declaration ${capabilityId}.`)
        ]);
      }
      return result;
    }
  });
}

export const kpEditorSelectedSurfaceCapabilityDeclarationSet =
  compileKpEditorSelectedSurfaceCapabilityDeclarationSet({
    declarations: kpEditorSelectedSurfaceCapabilityDeclarations
  });

function declaration(input: Omit<
  KpEditorSelectedSurfaceCapabilityDeclaration,
  "schemaVersion" | "registrationGuardAdapterId" | "loadAndRegister"
> & {
  readonly registrationGuardAdapterId?: string | undefined;
  readonly loadAndRegister: (
    registry: KpEditorAnimationSurfaceAdapterRegistry,
    registrationGuardAdapterId: string
  ) => Promise<void>;
}):
KpEditorSelectedSurfaceCapabilityDeclaration {
  const adapterIds = Object.freeze([...input.adapterIds]);
  const registrationGuardAdapterId =
    input.registrationGuardAdapterId ?? adapterIds[0] ?? "";
  return Object.freeze({
    schemaVersion:
      "kp.editor-selected-surface-capability-declaration.v1" as const,
    ...input,
    adapterIds,
    registrationGuardAdapterId,
    loadAndRegister(registry: KpEditorAnimationSurfaceAdapterRegistry) {
      return input.loadAndRegister(registry, registrationGuardAdapterId);
    }
  });
}

async function registerOnce(
  registry: KpEditorAnimationSurfaceAdapterRegistry,
  adapterId: string,
  register: () => void | (() => void) | Promise<void | (() => void)>
): Promise<void> {
  if (!registry.list().some(({ id }) => id === adapterId)) await register();
}

function diagnostic(
  code: KpEditorSelectedSurfaceCapabilityDeclarationDiagnosticCode,
  capabilityId: string,
  message: string
) {
  return Object.freeze({ code, capabilityId, message });
}
