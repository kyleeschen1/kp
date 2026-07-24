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
    readonly presentationRole?:
      | "focal-operand"
      | "continuant"
      | "introduced"
      | "eliminated"
      | "copied"
      | "merged"
      | "structural";
    readonly sourceSelectorId: string;
    readonly targetSelectorId: string;
  }[];
  readonly presentation?: {
    readonly operationRef: string;
    readonly phaseOrder: readonly ["reflow", "act"];
    readonly reflowEnd: 0.36;
    readonly actStart: 0.3;
  };
  readonly layout: {
    readonly measurement: "native-dom-rect";
    readonly collisionPolicy: "role-lanes";
    readonly endpointOwnership: "native-source-and-target";
  };
}

type KpQuadraticKatexPresentationRole = NonNullable<
  KpQuadraticKatexTransition["correspondence"][number]["presentationRole"]
>;

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
      "added-both-sides",
      "presentation.quadratic.completing-square.added-both-sides",
      "x^2 - 5x + \\frac{25}{4} = -6 + \\frac{25}{4}",
      "x squared minus five x plus twenty-five fourths equals negative six plus twenty-five fourths",
      [
        "quadratic",
        "linear",
        "completion",
        "equals",
        "right-base",
        "right-addend"
      ]
    ),
    state(
      "common-denominator",
      "presentation.quadratic.completing-square.common-denominator",
      "x^2 - 5x + \\frac{25}{4} = -\\frac{24}{4} + \\frac{25}{4}",
      "x squared minus five x plus twenty-five fourths equals negative twenty-four fourths plus twenty-five fourths",
      [
        "quadratic",
        "linear",
        "completion",
        "equals",
        "right-base",
        "right-addend"
      ]
    ),
    state(
      "completed",
      "state.quadratic.completing-square.completed",
      "x^2 - 5x + \\frac{25}{4} = \\frac{1}{4}",
      "x squared minus five x plus twenty-five fourths equals one fourth",
      ["quadratic", "linear", "completion", "equals", "right"]
    ),
    state(
      "factor-pattern",
      "presentation.quadratic.completing-square.factor-pattern",
      "x^2 - 2(x)\\left(\\frac{5}{2}\\right) + \\left(\\frac{5}{2}\\right)^2 = \\frac{1}{4}",
      "x squared minus two times x times five halves plus five halves squared equals one fourth",
      ["quadratic", "product", "square", "equals", "right"]
    ),
    state(
      "perfect",
      "state.quadratic.completing-square.perfect",
      "\\left(x - \\frac{5}{2}\\right)^2 = \\frac{1}{4}",
      "the quantity x minus five halves squared equals one fourth",
      ["binomial-x", "binomial-offset", "exponent", "equals", "right"]
    ),
    state(
      "square-root-applied",
      "presentation.quadratic.completing-square.square-root-applied",
      "x - \\frac{5}{2} = \\pm\\sqrt{\\frac{1}{4}}",
      "x minus five halves equals plus or minus the square root of one fourth",
      ["left-x", "left-offset", "equals", "plus-minus", "radical"]
    ),
    state(
      "square-root-evaluated",
      "presentation.quadratic.completing-square.square-root-evaluated",
      "x - \\frac{5}{2} = \\pm\\frac{1}{2}",
      "x minus five halves equals plus or minus one half",
      ["left-x", "left-offset", "equals", "plus-minus", "right"]
    ),
    state(
      "isolated",
      "presentation.quadratic.completing-square.isolated",
      "x = \\frac{5}{2} \\pm \\frac{1}{2}",
      "x equals five halves plus or minus one half",
      ["variable", "equals", "center", "plus-minus", "offset"]
    ),
    state(
      "candidates",
      "presentation.quadratic.completing-square.candidates",
      "x = \\frac{5 \\pm 1}{2}",
      "x equals the quantity five plus or minus one over two",
      ["variable", "equals", "center", "plus-minus", "offset", "denominator"]
    )
  ]);
  const transitions = Object.freeze([
    transition(
      "balance",
      "rewrite.quadratic.completing-square.balance-constant",
      states[0]!,
      states[1]!,
      [
      sameRole("quadratic"),
      sameRole("linear"),
      sameRole("equals"),
      roleBinding(
        "relocated-constant",
        "constant",
        "right",
        "focal-operand"
      )
    ]),
    transition(
      "add-both-sides",
      "rewrite.quadratic.completing-square.add-square-term",
      states[1]!,
      states[2]!,
      [
        sameRole("quadratic"),
        sameRole("linear"),
        sameRole("equals"),
        roleBinding("right-base", "right", "right-base", "continuant")
      ]
    ),
    transition(
      "common-denominator",
      "operation.arithmetic.integer-to-equivalent-fraction",
      states[2]!,
      states[3]!,
      [
        sameRole("quadratic"),
        sameRole("linear"),
        sameRole("completion"),
        sameRole("equals"),
        roleBinding(
          "right-base",
          "right-base",
          "right-base",
          "focal-operand"
        ),
        sameRole("right-addend")
      ]
    ),
    transition(
      "evaluate-right",
      "operation.arithmetic.add-like-denominator-fractions",
      states[3]!,
      states[4]!,
      [
        sameRole("quadratic"),
        sameRole("linear"),
        sameRole("completion"),
        sameRole("equals"),
        roleBinding(
          "merge-right-base",
          "right-base",
          "right",
          "merged"
        ),
        roleBinding(
          "merge-right-addend",
          "right-addend",
          "right",
          "merged"
        )
      ]
    ),
    transition(
      "expose-factor-pattern",
      "operation.algebra.expose-perfect-square-pattern",
      states[4]!,
      states[5]!,
      [
        sameRole("quadratic"),
        roleBinding("linear-as-product", "linear", "product", "focal-operand"),
        roleBinding(
          "completion-as-square",
          "completion",
          "square",
          "focal-operand"
        ),
        sameRole("equals"),
        sameRole("right")
      ]
    ),
    transition(
      "factor-perfect-square",
      "rewrite.quadratic.completing-square.recognize-perfect-square",
      states[5]!,
      states[6]!,
      [
        roleBinding(
          "quadratic-to-binomial-x",
          "quadratic",
          "binomial-x",
          "merged"
        ),
        roleBinding(
          "product-to-binomial-offset",
          "product",
          "binomial-offset",
          "merged"
        ),
        roleBinding(
          "square-to-exponent",
          "square",
          "exponent",
          "merged"
        ),
        sameRole("equals"),
        sameRole("right")
      ]
    ),
    transition(
      "take-square-roots",
      "operation.quadratic.take-square-roots-and-branch-sign",
      states[6]!,
      states[7]!,
      [
        roleBinding("binomial-x-to-left-x", "binomial-x", "left-x", "continuant"),
        roleBinding(
          "binomial-offset-to-left-offset",
          "binomial-offset",
          "left-offset",
          "continuant"
        ),
        sameRole("equals"),
        roleBinding("right-into-radical", "right", "radical", "focal-operand")
      ]
    ),
    transition(
      "evaluate-square-root",
      "operation.quadratic.evaluate-principal-square-root",
      states[7]!,
      states[8]!,
      [
        sameRole("left-x"),
        sameRole("left-offset"),
        sameRole("equals"),
        sameRole("plus-minus"),
        roleBinding("radical-to-right", "radical", "right", "focal-operand")
      ]
    ),
    transition(
      "isolate-signed-candidates",
      "operation.quadratic.isolate-signed-candidates",
      states[8]!,
      states[9]!,
      [
        roleBinding("left-x-to-variable", "left-x", "variable", "continuant"),
        sameRole("equals"),
        roleBinding("relocate-offset", "left-offset", "center", "focal-operand"),
        sameRole("plus-minus"),
        roleBinding("right-to-offset", "right", "offset", "continuant")
      ]
    ),
    transition(
      "normalize-signed-candidates",
      "operation.quadratic.normalize-signed-candidates",
      states[9]!,
      states[10]!,
      [
        sameRole("variable"),
        sameRole("equals"),
        sameRole("center"),
        sameRole("plus-minus"),
        sameRole("offset")
      ]
    )
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
  operationRef: string,
  source: KpQuadraticKatexState,
  target: KpQuadraticKatexState,
  bindings: readonly {
    readonly role: string;
    readonly sourceRole: string;
    readonly targetRole: string;
    readonly presentationRole: KpQuadraticKatexPresentationRole;
  }[]
): KpQuadraticKatexTransition {
  return Object.freeze({
    id: `transition.quadratic.completing-square.${suffix}`,
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
  readonly presentationRole: KpQuadraticKatexPresentationRole;
} {
  return roleBinding(role, role, role, "continuant");
}

function roleBinding(
  role: string,
  sourceRole: string,
  targetRole: string,
  presentationRole: KpQuadraticKatexPresentationRole
): {
  readonly role: string;
  readonly sourceRole: string;
  readonly targetRole: string;
  readonly presentationRole: KpQuadraticKatexPresentationRole;
} {
  return Object.freeze({
    role,
    sourceRole,
    targetRole,
    presentationRole
  });
}
