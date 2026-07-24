export interface KpPresentationContinuityVisualCase {
  readonly id: string;
  readonly family: "distribution" | "radical";
  readonly animationId: string;
  readonly query: string;
  readonly progress: number;
  readonly surface: "workbench-card" | "lesson";
  readonly viewport: { readonly width: number; readonly height: number };
}

export function createKpPresentationContinuityVisualPlan():
  readonly KpPresentationContinuityVisualCase[] {
  const frames = [
    {
      id: "distribution-lock",
      family: "distribution",
      animationId: "animation.generated.distribution.expand-a-sum",
      query: "distribution",
      progress: 0.72
    },
    {
      id: "distribution-operator-transit",
      family: "distribution",
      animationId: "animation.generated.distribution.expand-a-sum",
      query: "distribution",
      progress: 0.83
    },
    {
      id: "distribution-pre-handoff",
      family: "distribution",
      animationId: "animation.generated.distribution.expand-a-sum",
      query: "distribution",
      progress: 0.94
    },
    {
      id: "distribution-native",
      family: "distribution",
      animationId: "animation.generated.distribution.expand-a-sum",
      query: "distribution",
      progress: 1
    },
    {
      id: "radical-source-handoff",
      family: "radical",
      animationId: "animation.generated.radical.square-root-as-power",
      query: "radical",
      progress: 0.04
    }
  ] as const;
  return [
    ...frames.map((frame) => ({
      ...frame,
      surface: "workbench-card" as const,
      id: `${frame.id}-wide`,
      viewport: { width: 1280, height: 900 }
    })),
    ...frames
      .filter((frame) => frame.family === "distribution")
      .map((frame) => ({
        ...frame,
        surface: "workbench-card" as const,
        id: `${frame.id}-narrow`,
        viewport: { width: 390, height: 844 }
      })),
    ...frames
      .filter((frame) => frame.family === "distribution")
      .flatMap((frame) => [
        {
          ...frame,
          surface: "lesson" as const,
          id: `${frame.id}-lesson-wide`,
          viewport: { width: 1280, height: 900 }
        },
        {
          ...frame,
          surface: "lesson" as const,
          id: `${frame.id}-lesson-narrow`,
          viewport: { width: 390, height: 844 }
        }
      ])
  ];
}
