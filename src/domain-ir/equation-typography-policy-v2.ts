import {
  isKpCompiledEquationGrammarV2,
  type KpCompiledEquationGrammarV2
} from "./equation-grammar-v2.ts";

export const kpEquationTypographyPolicyRegistryV2SchemaVersion =
  "kp.equation-typography-policy-registry.v2" as const;

export type KpEquationTypographyFlowV2 =
  | "inline-with-prose"
  | "standalone-stage"
  | "structured-display";

export type KpTexMathStyleV2 =
  | "text"
  | "display"
  | "script"
  | "scriptscript";

export interface KpEquationTypographyPolicyV2 {
  readonly id: `typography.equation.${string}`;
  readonly flow: {
    readonly kind: KpEquationTypographyFlowV2;
  };
  readonly mathStyle: {
    readonly kind: KpTexMathStyleV2;
  };
  readonly scale: {
    readonly profile: "prose" | "equation" | "demonstration";
    readonly relativeEm: number;
  };
  readonly largeOperators: {
    readonly support: "none" | "semantic" | "required";
    readonly limitPlacements: readonly ("bounds" | "side")[];
  };
}

export interface KpEquationTypographyPolicyRegistryV2 {
  readonly schemaVersion:
    typeof kpEquationTypographyPolicyRegistryV2SchemaVersion;
  readonly kind: "equation-typography-policy-registry-v2";
  readonly policies: readonly KpEquationTypographyPolicyV2[];
}

export const kpEquationTypographyPolicyRegistryV2 =
  createKpEquationTypographyPolicyRegistryV2({
    policies: [
      {
        id: "typography.equation.inline.v2",
        flow: { kind: "inline-with-prose" },
        mathStyle: { kind: "text" },
        scale: { profile: "prose", relativeEm: 1 },
        largeOperators: { support: "none", limitPlacements: [] }
      },
      {
        id: "typography.equation.stage.v2",
        flow: { kind: "standalone-stage" },
        mathStyle: { kind: "display" },
        scale: { profile: "equation", relativeEm: 1 },
        largeOperators: {
          support: "semantic",
          limitPlacements: ["bounds", "side"]
        }
      },
      {
        id: "typography.equation.large-operator.v2",
        flow: { kind: "structured-display" },
        mathStyle: { kind: "display" },
        scale: { profile: "demonstration", relativeEm: 1 },
        largeOperators: {
          support: "required",
          limitPlacements: ["bounds", "side"]
        }
      }
    ]
  });

export function createKpEquationTypographyPolicyRegistryV2(input: {
  readonly policies: readonly KpEquationTypographyPolicyV2[];
}): KpEquationTypographyPolicyRegistryV2 {
  const ids = new Set<string>();
  input.policies.forEach((policy) => {
    if (ids.has(policy.id)) {
      throw new Error(`Duplicate equation typography policy ${policy.id}.`);
    }
    ids.add(policy.id);
    if (!Number.isFinite(policy.scale.relativeEm) ||
        policy.scale.relativeEm <= 0) {
      throw new Error(`Typography policy ${policy.id} requires positive scale.`);
    }
    if (policy.largeOperators.support !== "none" &&
        policy.largeOperators.limitPlacements.length === 0) {
      throw new Error(
        `Typography policy ${policy.id} must support a limit placement.`
      );
    }
    if (policy.largeOperators.support === "none" &&
        policy.largeOperators.limitPlacements.length > 0) {
      throw new Error(
        `Typography policy ${policy.id} cannot place unsupported operators.`
      );
    }
  });
  return Object.freeze({
    schemaVersion: kpEquationTypographyPolicyRegistryV2SchemaVersion,
    kind: "equation-typography-policy-registry-v2" as const,
    policies: Object.freeze(input.policies.map((policy) => Object.freeze({
      ...policy,
      flow: Object.freeze({ ...policy.flow }),
      mathStyle: Object.freeze({ ...policy.mathStyle }),
      scale: Object.freeze({ ...policy.scale }),
      largeOperators: Object.freeze({
        ...policy.largeOperators,
        limitPlacements: Object.freeze([
          ...policy.largeOperators.limitPlacements
        ])
      })
    })))
  });
}

export interface KpResolvedEquationTypographyV2 {
  readonly transitionId: string;
  readonly policy: KpEquationTypographyPolicyV2;
  readonly semanticLargeOperators: KpCompiledEquationGrammarV2["transitions"][number]["typographyRequirements"]["largeOperators"];
  readonly resolutionSource: "equation-typography-policy-registry";
}

export interface KpEquationTypographyDiagnosticV2 {
  readonly code:
    | "typography.uncompiled-grammar"
    | "typography.unknown-policy"
    | "typography.unsupported-large-operator"
    | "typography.large-operator-required"
    | "typography.unsupported-limit-placement";
  readonly transitionId?: string | undefined;
  readonly policyId?: string | undefined;
  readonly message: string;
}

export type KpEquationTypographyResolutionV2 =
  | {
      readonly status: "resolved";
      readonly typography: readonly KpResolvedEquationTypographyV2[];
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "repair-required";
      readonly diagnostics: readonly KpEquationTypographyDiagnosticV2[];
    };

export function resolveKpEquationTypographyV2(input: {
  readonly grammar: KpCompiledEquationGrammarV2;
  readonly registry?: KpEquationTypographyPolicyRegistryV2 | undefined;
}): KpEquationTypographyResolutionV2 {
  if (!isKpCompiledEquationGrammarV2(input.grammar)) {
    return repair([{
      code: "typography.uncompiled-grammar",
      message: "Typography requires compiler-minted equation grammar v2."
    }]);
  }
  const registry = input.registry ?? kpEquationTypographyPolicyRegistryV2;
  const diagnostics: KpEquationTypographyDiagnosticV2[] = [];
  const typography: KpResolvedEquationTypographyV2[] = [];
  input.grammar.transitions.forEach((transition) => {
    const policy = registry.policies.find(
      ({ id }) => id === transition.typographyPolicyId
    );
    if (policy === undefined) {
      diagnostics.push({
        code: "typography.unknown-policy",
        transitionId: transition.id,
        policyId: transition.typographyPolicyId,
        message: `Unknown equation typography policy ${transition.typographyPolicyId}.`
      });
      return;
    }
    const operators = transition.typographyRequirements.largeOperators;
    if (operators.length > 0 && policy.largeOperators.support === "none") {
      diagnostics.push({
        code: "typography.unsupported-large-operator",
        transitionId: transition.id,
        policyId: policy.id,
        message: `Typography policy ${policy.id} does not support large operators.`
      });
      return;
    }
    if (operators.length === 0 &&
        policy.largeOperators.support === "required") {
      diagnostics.push({
        code: "typography.large-operator-required",
        transitionId: transition.id,
        policyId: policy.id,
        message: `Typography policy ${policy.id} requires semantic operator data.`
      });
      return;
    }
    const unsupportedPlacement = operators.find((operator) =>
      !policy.largeOperators.limitPlacements.includes(operator.limitPlacement)
    );
    if (unsupportedPlacement !== undefined) {
      diagnostics.push({
        code: "typography.unsupported-limit-placement",
        transitionId: transition.id,
        policyId: policy.id,
        message:
          `Typography policy ${policy.id} cannot place ` +
          `${unsupportedPlacement.kind} limits as ${unsupportedPlacement.limitPlacement}.`
      });
      return;
    }
    typography.push(Object.freeze({
      transitionId: transition.id,
      policy,
      semanticLargeOperators: operators,
      resolutionSource: "equation-typography-policy-registry" as const
    }));
  });
  if (diagnostics.length > 0) return repair(diagnostics);
  return Object.freeze({
    status: "resolved" as const,
    typography: Object.freeze(typography),
    diagnostics: Object.freeze([]) as readonly []
  });
}

function repair(
  diagnostics: readonly KpEquationTypographyDiagnosticV2[]
): KpEquationTypographyResolutionV2 {
  return Object.freeze({
    status: "repair-required" as const,
    diagnostics: Object.freeze([...diagnostics])
  });
}
