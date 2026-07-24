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

export function createKpQuadraticFormulaKatexProjection():
  KpQuadraticFormulaKatexProjection {
  const states = Object.freeze([
    state("general", "\\displaystyle x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}", "x equals negative b plus or minus the square root of b squared minus four a c, over two a", ["variable", "base", "plus-minus", "radical", "denominator"]),
    state("substituted", "\\displaystyle x = \\frac{5 \\pm \\sqrt{(-5)^2-4(1)(6)}}{2(1)}", "x equals five plus or minus the square root of negative five squared minus four times one times six, over two", ["variable", "base", "plus-minus", "radical", "denominator"]),
    state("discriminant", "\\displaystyle x = \\frac{5 \\pm \\sqrt{1}}{2}", "x equals five plus or minus the square root of one, over two", ["variable", "base", "plus-minus", "radical", "denominator"]),
    state("simplified", "\\displaystyle x = \\frac{5 \\pm 1}{2}", "x equals five plus or minus one, over two", ["variable", "base", "plus-minus", "offset", "denominator"]),
    state("roots", "\\displaystyle x \\in \\{2,3\\}", "x is in the set containing two and three", ["variable", "root-two", "root-three"])
  ]);
  const transitions = Object.freeze([
    transition("substitute", states[0]!, states[1]!, ["variable", "plus-minus"]),
    transition("evaluate-discriminant", states[1]!, states[2]!, ["variable", "base", "plus-minus", "denominator"]),
    transition("simplify-radical", states[2]!, states[3]!, ["variable", "base", "plus-minus", "denominator"]),
    transition("verify-roots", states[3]!, states[4]!, ["variable"])
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
  source: KpQuadraticKatexState,
  target: KpQuadraticKatexState,
  persistentRoles: readonly string[]
): KpQuadraticKatexTransition {
  return Object.freeze({
    id: `transition.quadratic.formula.${suffix}`,
    sourceStateId: source.id,
    targetStateId: target.id,
    correspondence: Object.freeze(persistentRoles.map((role) =>
      Object.freeze({
        role,
        sourceSelectorId: source.selectors.find((selector) => selector.role === role)!.id,
        targetSelectorId: target.selectors.find((selector) => selector.role === role)!.id
      })
    )),
    layout: Object.freeze({
      measurement: "native-dom-rect" as const,
      collisionPolicy: "role-lanes" as const,
      endpointOwnership: "native-source-and-target" as const
    })
  });
}
