import type {
  KpQuadraticKatexState,
  KpQuadraticKatexTransition
} from "./quadratic-completing-square-katex.ts";

export interface KpQuadraticFormulaKatexProjection {
  readonly schemaVersion: "kp.quadratic-katex-projection.v1";
  readonly id: "projection.quadratic.formula.katex";
  readonly methodId: "method.quadratic.formula";
  readonly states: readonly KpQuadraticKatexState[];
  readonly transitions: readonly KpQuadraticKatexTransition[];
  readonly radicalBoundary: {
    readonly rendering: "native-katex";
    readonly existingWebglPathReuse: "forbidden";
  };
}

type KpQuadraticFormulaPresentationRole = NonNullable<
  KpQuadraticKatexTransition["correspondence"][number]["presentationRole"]
>;

export function createKpQuadraticFormulaKatexProjection():
  KpQuadraticFormulaKatexProjection {
  const states = Object.freeze([
    state("general", "\\displaystyle x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}", "x equals negative b plus or minus the square root of b squared minus four a c, over two a", ["variable", "base", "plus-minus", "discriminant-b", "discriminant-a", "discriminant-c", "denominator-two", "denominator-a"]),
    state("substituted", "\\displaystyle x = \\frac{5 \\pm \\sqrt{(-5)^2-4(1)(6)}}{2(1)}", "x equals five plus or minus the square root of negative five squared minus four times one times six, over two", ["variable", "base", "plus-minus", "discriminant-b", "discriminant-a", "discriminant-c", "denominator-two", "denominator-a"]),
    state("discriminant", "\\displaystyle x = \\frac{5 \\pm \\sqrt{1}}{2}", "x equals five plus or minus the square root of one, over two", ["variable", "base", "plus-minus", "radical", "denominator"]),
    state("simplified", "\\displaystyle x = \\frac{5 \\pm 1}{2}", "x equals five plus or minus one, over two", ["variable", "base", "plus-minus", "offset", "denominator"]),
    state("roots", "\\displaystyle x \\in \\{2,3\\}", "x is in the set containing two and three", ["variable", "root-two", "root-three"])
  ]);
  const transitions = Object.freeze([
    transition("substitute", "operation.quadratic-formula.substitute-coefficients", states[0]!, states[1]!, [
      sameRole("variable"),
      roleBinding("negated-b", "base", "base", "focal-operand"),
      sameRole("plus-minus"),
      roleBinding("signed-b", "discriminant-b", "discriminant-b", "focal-operand"),
      roleBinding("coefficient-a", "discriminant-a", "discriminant-a", "focal-operand"),
      roleBinding("coefficient-c", "discriminant-c", "discriminant-c", "focal-operand"),
      sameRole("denominator-two"),
      roleBinding("denominator-a", "denominator-a", "denominator-a", "focal-operand")
    ]),
    transition("evaluate-discriminant", "operation.quadratic-formula.evaluate-discriminant", states[1]!, states[2]!, [
      sameRole("variable"),
      sameRole("base"),
      sameRole("plus-minus"),
      roleBinding("discriminant", "discriminant-b", "radical", "focal-operand"),
      roleBinding("denominator", "denominator-two", "denominator", "continuant")
    ]),
    transition("simplify-radical", "operation.quadratic-formula.simplify-exact-radical", states[2]!, states[3]!, [
      sameRole("variable"),
      sameRole("base"),
      sameRole("plus-minus"),
      roleBinding("exact-radical", "radical", "offset", "focal-operand"),
      sameRole("denominator")
    ]),
    transition("verify-roots", "operation.quadratic-formula.verify-results", states[3]!, states[4]!, [
      sameRole("variable")
    ])
  ]);
  return Object.freeze({
    schemaVersion: "kp.quadratic-katex-projection.v1" as const,
    id: "projection.quadratic.formula.katex" as const,
    methodId: "method.quadratic.formula" as const,
    states,
    transitions,
    radicalBoundary: Object.freeze({
      rendering: "native-katex" as const,
      existingWebglPathReuse: "forbidden" as const
    })
  });
}

export function validateKpQuadraticFormulaKatexProjection(
  projection: KpQuadraticFormulaKatexProjection
): readonly string[] {
  const issues: string[] = [];
  const stateIds = new Set(projection.states.map(({ id }) => id));
  const selectors = projection.states.flatMap(({ selectors }) => selectors);
  const selectorIds = selectors.map(({ id }) => id);
  if (new Set(selectorIds).size !== selectorIds.length) {
    issues.push("Formula selector identities must be globally unique.");
  }
  projection.transitions.forEach((candidate) => {
    if (!stateIds.has(candidate.sourceStateId) || !stateIds.has(candidate.targetStateId)) {
      issues.push(`Formula transition ${candidate.id} references a missing state.`);
    }
    candidate.correspondence.forEach((binding) => {
      if (!selectorIds.includes(binding.sourceSelectorId) || !selectorIds.includes(binding.targetSelectorId)) {
        issues.push(`Formula transition ${candidate.id} references a missing selector.`);
      }
    });
  });
  if (
    projection.radicalBoundary.rendering !== "native-katex" ||
    projection.radicalBoundary.existingWebglPathReuse !== "forbidden"
  ) {
    issues.push("Formula radical must remain native KaTeX and isolated from the radical workaround.");
  }
  return Object.freeze(issues);
}

function state(
  suffix: string,
  latex: string,
  spoken: string,
  roles: readonly string[]
): KpQuadraticKatexState {
  const id = `katex.quadratic.formula.${suffix}`;
  return Object.freeze({
    id,
    semanticStateId: `state.quadratic.formula.${suffix}`,
    latex,
    spoken,
    selectors: Object.freeze(roles.map((role) =>
      Object.freeze({ id: `${id}.${role}`, role })
    )),
    ownership: "native-katex" as const
  });
}

function transition(
  suffix: string,
  operationRef: string,
  source: KpQuadraticKatexState,
  target: KpQuadraticKatexState,
  bindings: readonly {
    readonly role: string;
    readonly sourceRole: string;
    readonly targetRole: string;
    readonly presentationRole: KpQuadraticFormulaPresentationRole;
  }[]
): KpQuadraticKatexTransition {
  return Object.freeze({
    id: `transition.quadratic.formula.${suffix}`,
    presentation: Object.freeze({
      operationRef,
      phaseOrder: Object.freeze(["reflow", "act"] as const),
      reflowEnd: 0.36 as const,
      actStart: 0.3 as const
    }),
    sourceStateId: source.id,
    targetStateId: target.id,
    correspondence: Object.freeze(bindings.map((binding) =>
      Object.freeze({
        role: binding.role,
        presentationRole: binding.presentationRole,
        sourceSelectorId: source.selectors.find(
          (selector) => selector.role === binding.sourceRole
        )!.id,
        targetSelectorId: target.selectors.find(
          (selector) => selector.role === binding.targetRole
        )!.id
      })
    )),
    layout: Object.freeze({
      measurement: "native-dom-rect" as const,
      collisionPolicy: "role-lanes" as const,
      endpointOwnership: "native-source-and-target" as const
    })
  });
}

function sameRole(role: string): {
  readonly role: string;
  readonly sourceRole: string;
  readonly targetRole: string;
  readonly presentationRole: KpQuadraticFormulaPresentationRole;
} {
  return roleBinding(role, role, role, "continuant");
}

function roleBinding(
  role: string,
  sourceRole: string,
  targetRole: string,
  presentationRole: KpQuadraticFormulaPresentationRole
): {
  readonly role: string;
  readonly sourceRole: string;
  readonly targetRole: string;
  readonly presentationRole: KpQuadraticFormulaPresentationRole;
} {
  return Object.freeze({ role, sourceRole, targetRole, presentationRole });
}
