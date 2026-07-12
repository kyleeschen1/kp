export type GeneratedAlgebraFixtureFamilyId =
  | "generated.linear-solve"
  | "generated.fraction-expression"
  | "generated.exponent"
  | "generated.radical";

export interface GeneratedLinearSolveTutorialFixtureSpec {
  readonly id: string;
  readonly title: string;
  readonly variable: string;
  readonly addend?: number | undefined;
  readonly coefficient?: number | undefined;
  readonly solution: number;
}

export interface GeneratedAlgebraLinearSolveTutorialFixtureSpec
  extends GeneratedLinearSolveTutorialFixtureSpec {
  readonly familyId: "generated.linear-solve";
}

export interface GeneratedFractionExpressionTutorialFixtureSpec {
  readonly familyId: "generated.fraction-expression";
  readonly id: string;
  readonly title: string;
  readonly numerator: number;
  readonly denominator: number;
  readonly simplifiedNumerator: number;
  readonly simplifiedDenominator: number;
}

export interface GeneratedExponentTutorialFixtureSpec {
  readonly familyId: "generated.exponent";
  readonly id: string;
  readonly title: string;
  readonly base: string;
  readonly exponent: number;
}

export interface GeneratedRadicalTutorialFixtureSpec {
  readonly familyId: "generated.radical";
  readonly id: string;
  readonly title: string;
  readonly base: string;
  readonly index: number;
  readonly exponentNumerator: number;
}

export type GeneratedAlgebraTutorialFixtureSpec =
  | GeneratedAlgebraLinearSolveTutorialFixtureSpec
  | GeneratedFractionExpressionTutorialFixtureSpec
  | GeneratedExponentTutorialFixtureSpec
  | GeneratedRadicalTutorialFixtureSpec;

export const generatedLinearSolveTutorialFixtureSpecs:
  readonly GeneratedLinearSolveTutorialFixtureSpec[] = [
    {
      id: "generated.linear-solve.x-plus-3",
      title: "Generated solve x plus 3",
      variable: "x",
      addend: 3,
      solution: 4
    },
    {
      id: "generated.linear-solve.y-plus-5",
      title: "Generated solve y plus 5",
      variable: "y",
      addend: 5,
      solution: 7
    },
    {
      id: "generated.linear-solve.z-minus-4",
      title: "Generated solve z minus 4",
      variable: "z",
      addend: -4,
      solution: 10
    },
    {
      id: "generated.linear-solve.three-x",
      title: "Generated solve 3x equals 12",
      variable: "x",
      coefficient: 3,
      solution: 4
    },
    {
      id: "generated.linear-solve.two-x-plus-3",
      title: "Generated solve 2x plus 3",
      variable: "x",
      coefficient: 2,
      addend: 3,
      solution: 4
    },
    {
      id: "generated.linear-solve.x-plus-one-half",
      title: "Generated solve x plus one half",
      variable: "x",
      addend: 1 / 2,
      solution: 2
    }
  ];

export const generatedFractionExpressionTutorialFixtureSpecs:
  readonly GeneratedFractionExpressionTutorialFixtureSpec[] = [
    {
      familyId: "generated.fraction-expression",
      id: "generated.fraction-expression.two-fourths",
      title: "Generated simplify two fourths",
      numerator: 2,
      denominator: 4,
      simplifiedNumerator: 1,
      simplifiedDenominator: 2
    }
  ];

export const generatedExponentTutorialFixtureSpecs:
  readonly GeneratedExponentTutorialFixtureSpec[] = [
    {
      familyId: "generated.exponent",
      id: "generated.exponent.square-as-product",
      title: "Generated expand square as product",
      base: "x",
      exponent: 2
    }
  ];

export const generatedRadicalTutorialFixtureSpecs:
  readonly GeneratedRadicalTutorialFixtureSpec[] = [
    {
      familyId: "generated.radical",
      id: "generated.radical.square-root-as-power",
      title: "Generated rewrite square root as power",
      base: "x",
      index: 2,
      exponentNumerator: 1
    }
  ];

export function listGeneratedLinearSolveTutorialFixtureSpecs():
  readonly GeneratedLinearSolveTutorialFixtureSpec[] {
  return generatedLinearSolveTutorialFixtureSpecs;
}

export function listGeneratedFractionExpressionTutorialFixtureSpecs():
  readonly GeneratedFractionExpressionTutorialFixtureSpec[] {
  return generatedFractionExpressionTutorialFixtureSpecs;
}

export function listGeneratedExponentTutorialFixtureSpecs():
  readonly GeneratedExponentTutorialFixtureSpec[] {
  return generatedExponentTutorialFixtureSpecs;
}

export function listGeneratedRadicalTutorialFixtureSpecs():
  readonly GeneratedRadicalTutorialFixtureSpec[] {
  return generatedRadicalTutorialFixtureSpecs;
}

export function listGeneratedAlgebraTutorialFixtureSpecs():
  readonly GeneratedAlgebraTutorialFixtureSpec[] {
  return [
    ...generatedLinearSolveTutorialFixtureSpecs.map(
      generatedLinearSolveSpecAsAlgebraSpec
    ),
    ...generatedFractionExpressionTutorialFixtureSpecs,
    ...generatedExponentTutorialFixtureSpecs,
    ...generatedRadicalTutorialFixtureSpecs
  ];
}

export function getGeneratedLinearSolveTutorialFixtureSpec(
  id: string
): GeneratedLinearSolveTutorialFixtureSpec | undefined {
  return generatedLinearSolveTutorialFixtureSpecs.find((spec) => spec.id === id);
}

export function getGeneratedFractionExpressionTutorialFixtureSpec(
  id: string
): GeneratedFractionExpressionTutorialFixtureSpec | undefined {
  return generatedFractionExpressionTutorialFixtureSpecs.find(
    (spec) => spec.id === id
  );
}

export function getGeneratedExponentTutorialFixtureSpec(
  id: string
): GeneratedExponentTutorialFixtureSpec | undefined {
  return generatedExponentTutorialFixtureSpecs.find((spec) => spec.id === id);
}

export function getGeneratedRadicalTutorialFixtureSpec(
  id: string
): GeneratedRadicalTutorialFixtureSpec | undefined {
  return generatedRadicalTutorialFixtureSpecs.find((spec) => spec.id === id);
}

export function getGeneratedAlgebraTutorialFixtureSpec(
  id: string
): GeneratedAlgebraTutorialFixtureSpec | undefined {
  return listGeneratedAlgebraTutorialFixtureSpecs().find(
    (spec) => spec.id === id
  );
}

function generatedLinearSolveSpecAsAlgebraSpec(
  spec: GeneratedLinearSolveTutorialFixtureSpec
): GeneratedAlgebraLinearSolveTutorialFixtureSpec {
  return {
    familyId: "generated.linear-solve",
    ...spec
  };
}
