export type KpLearnerExperienceKind = "scroll-lesson" | "concept-room";

export interface KpLearnerExperienceDescriptor {
  readonly id: string;
  readonly kind: KpLearnerExperienceKind;
  readonly title: string;
  readonly summary: string;
  readonly href: string;
  readonly actionLabel: string;
  readonly status: "exemplar" | "prototype";
  readonly animationIds: readonly string[];
}

const learnerExperiences = [
  {
    id: "distribution-area-scroll-lesson",
    kind: "scroll-lesson",
    title: "See distribution become area",
    summary:
      "Watch 3(x+2) become 3x+6 while the same rectangle partitions in lockstep.",
    href: "/reader/distribution-area/",
    actionLabel: "Review algebra and area",
    status: "prototype",
    animationIds: ["exemplar.distribution-area.3-times-x-plus-2"]
  },
  {
    id: "divide-both-sides-scroll-lesson",
    kind: "scroll-lesson",
    title: "Divide both sides",
    summary:
      "Watch 3x = 12 become two matched fractions, cancel, and resolve to x = 4.",
    href: "/reader/divide-both-sides/",
    actionLabel: "Review division animation",
    status: "exemplar",
    animationIds: ["animation.divide-both-sides.solve-3x-equals-12"]
  },
  {
    id: "numerator-split-merge-scroll-lesson",
    kind: "scroll-lesson",
    title: "Split and merge a fraction",
    summary:
      "Watch one denominator branch across a numerator sum, then run the exact structure backward.",
    href: "/reader/split-merge-fractions/",
    actionLabel: "Review split and merge",
    status: "exemplar",
    animationIds: ["animation.numerator-split-merge.round-trip"]
  },
  {
    id: "fractional-transfer-comparison-scroll-lesson",
    kind: "scroll-lesson",
    title: "Compare equation views",
    summary:
      "Switch between the complete balanced proof and a certified fluent transfer for x/2 = 4.",
    href: "/reader/fractional-transfer/",
    actionLabel: "Compare proof and shortcut",
    status: "exemplar",
    animationIds: [
      "animation.fractional-linear.x-over-2.balanced-proof",
      "animation.fractional-linear.x-over-2.fluent-projection"
    ]
  },
  {
    id: "solve-fractional-linear-scroll-lesson",
    kind: "scroll-lesson",
    title: "Solve a fractional equation",
    summary:
      "Watch subtraction, cancellation, and multiplication carry x through a fraction to its solution.",
    href: "/reader/solve-fractional-linear/",
    actionLabel: "Review fraction animation",
    status: "prototype",
    animationIds: ["animation.fractional-linear.solve-x-over-2"]
  },
  {
    id: "solve-x-scroll-lesson",
    kind: "scroll-lesson",
    title: "Solve for x",
    summary:
      "Scroll through a short explanation and watch each symbol find its next place.",
    href: "/reader/solve-x/",
    actionLabel: "Open scroll lesson",
    status: "exemplar",
    animationIds: ["animation.linear-solve.solve-x"]
  },
  {
    id: "solve-with-balance-concept-room",
    kind: "concept-room",
    title: "Solve with balance",
    summary:
      "Move between an equation and the balance model that makes it true.",
    href: "/concepts/mathematics/linear-equations/solve-with-balance",
    actionLabel: "Open concept room",
    status: "prototype",
    animationIds: []
  }
] as const satisfies readonly KpLearnerExperienceDescriptor[];

export function createKpLearnerExperienceLibrary():
  readonly KpLearnerExperienceDescriptor[] {
  return learnerExperiences;
}
