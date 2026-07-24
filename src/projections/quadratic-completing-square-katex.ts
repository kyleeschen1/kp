export interface KpQuadraticKatexState {
  readonly id: string;
  readonly semanticStateId: string;
  readonly latex: string;
  readonly spoken: string;
  readonly selectors: readonly {
    readonly id: string;
    readonly role: string;
  }[];
  readonly ownership: "native-katex";
}

export interface KpQuadraticKatexTransition {
  readonly id: string;
  readonly sourceStateId: string;
  readonly targetStateId: string;
  readonly correspondence: readonly {
    readonly role: string;
    readonly sourceSelectorId: string;
    readonly targetSelectorId: string;
  }[];
  readonly layout: {
    readonly measurement: "native-dom-rect";
    readonly collisionPolicy: "role-lanes";
    readonly endpointOwnership: "native-source-and-target";
  };
}

export interface KpCompletingSquareKatexProjection {
  readonly schemaVersion: "kp.quadratic-katex-projection.v1";
  readonly id: "projection.quadratic.completing-square.katex";
  readonly methodId: "method.quadratic.completing-square";
  readonly states: readonly KpQuadraticKatexState[];
  readonly transitions: readonly KpQuadraticKatexTransition[];
}

export function createKpCompletingSquareKatexProjection():
  KpCompletingSquareKatexProjection {
  const states = Object.freeze([
    state(
      "standard",
      "state.quadratic.completing-square.standard",
      "x^2 - 5x + 6 = 0",
      "x squared minus five x plus six equals zero",
      ["quadratic", "linear", "constant", "equals", "right"]
    ),
    state(
      "balanced",
      "state.quadratic.completing-square.balanced",
      "x^2 - 5x = -6",
      "x squared minus five x equals negative six",
      ["quadratic", "linear", "equals", "right"]
    ),
    state(
      "completed",
      "state.quadratic.completing-square.completed",
      "x^2 - 5x + \\frac{25}{4} = \\frac{1}{4}",
      "x squared minus five x plus twenty-five fourths equals one fourth",
      ["quadratic", "linear", "completion", "equals", "right"]
    ),
    state(
      "perfect",
      "state.quadratic.completing-square.perfect",
      "\\left(x - \\frac{5}{2}\\right)^2 = \\frac{1}{4}",
      "the quantity x minus five halves squared equals one fourth",
      ["binomial", "exponent", "equals", "right"]
    )
  ]);
  const transitions = Object.freeze([
    transition("balance", states[0]!, states[1]!, [
      sameRole("quadratic"),
      sameRole("linear"),
      sameRole("equals"),
      roleBinding("relocated-constant", "constant", "right")
    ]),
    transition("complete", states[1]!, states[2]!, [
      sameRole("quadratic"),
      sameRole("linear"),
      sameRole("equals"),
      sameRole("right")
    ]),
    transition("recognize", states[2]!, states[3]!, [
      sameRole("equals"),
      sameRole("right")
    ])
  ]);
  return Object.freeze({
    schemaVersion: "kp.quadratic-katex-projection.v1" as const,
    id: "projection.quadratic.completing-square.katex" as const,
    methodId: "method.quadratic.completing-square" as const,
    states,
    transitions
  });
}

export function validateKpCompletingSquareKatexProjection(
  projection: KpCompletingSquareKatexProjection
): readonly string[] {
  const issues: string[] = [];
  const stateIds = new Set(projection.states.map(({ id }) => id));
  const selectorIds = projection.states.flatMap(({ selectors }) =>
    selectors.map(({ id }) => id)
  );
  if (new Set(selectorIds).size !== selectorIds.length) {
    issues.push("KaTeX selector identities must be globally unique.");
  }
  projection.transitions.forEach((candidate) => {
    if (!stateIds.has(candidate.sourceStateId) || !stateIds.has(candidate.targetStateId)) {
      issues.push(`Transition ${candidate.id} references a missing state.`);
    }
    candidate.correspondence.forEach((binding) => {
      if (
        !selectorIds.includes(binding.sourceSelectorId) ||
        !selectorIds.includes(binding.targetSelectorId)
      ) {
        issues.push(`Transition ${candidate.id} references a missing selector.`);
      }
    });
    if (
      candidate.layout.measurement !== "native-dom-rect" ||
      candidate.layout.endpointOwnership !== "native-source-and-target"
    ) {
      issues.push(`Transition ${candidate.id} must measure and settle to native KaTeX.`);
    }
  });
  return Object.freeze(issues);
}

function state(
  suffix: string,
  semanticStateId: string,
  latex: string,
  spoken: string,
  roles: readonly string[]
): KpQuadraticKatexState {
  const id = `katex.quadratic.completing-square.${suffix}`;
  return Object.freeze({
    id,
    semanticStateId,
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
  bindings: readonly {
    readonly role: string;
    readonly sourceRole: string;
    readonly targetRole: string;
  }[]
): KpQuadraticKatexTransition {
  return Object.freeze({
    id: `transition.quadratic.completing-square.${suffix}`,
    sourceStateId: source.id,
    targetStateId: target.id,
    correspondence: Object.freeze(bindings.map((binding) =>
      Object.freeze({
        role: binding.role,
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
} {
  return roleBinding(role, role, role);
}

function roleBinding(
  role: string,
  sourceRole: string,
  targetRole: string
): {
  readonly role: string;
  readonly sourceRole: string;
  readonly targetRole: string;
} {
  return Object.freeze({ role, sourceRole, targetRole });
}
