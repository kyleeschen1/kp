export interface GeneratedLinearSolveTutorialFixtureSpec {
  readonly id: string;
  readonly title: string;
  readonly variable: string;
  readonly addend: number;
  readonly solution: number;
}

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
    }
  ];

export function listGeneratedLinearSolveTutorialFixtureSpecs():
  readonly GeneratedLinearSolveTutorialFixtureSpec[] {
  return generatedLinearSolveTutorialFixtureSpecs;
}

export function getGeneratedLinearSolveTutorialFixtureSpec(
  id: string
): GeneratedLinearSolveTutorialFixtureSpec | undefined {
  return generatedLinearSolveTutorialFixtureSpecs.find((spec) => spec.id === id);
}
