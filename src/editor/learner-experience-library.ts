export type KpLearnerExperienceKind = "scroll-lesson" | "concept-room";

export interface KpLearnerExperienceDescriptor {
  readonly id: string;
  readonly kind: KpLearnerExperienceKind;
  readonly title: string;
  readonly summary: string;
  readonly href: string;
  readonly actionLabel: string;
  readonly status: "exemplar" | "prototype";
}

const learnerExperiences = [
  {
    id: "divide-both-sides-scroll-lesson",
    kind: "scroll-lesson",
    title: "Divide both sides",
    summary:
      "Watch 3x = 12 become two matched fractions, cancel, and resolve to x = 4.",
    href: "/reader/divide-both-sides/",
    actionLabel: "Review division animation",
    status: "exemplar"
  },
  {
    id: "numerator-split-merge-scroll-lesson",
    kind: "scroll-lesson",
    title: "Split and merge a fraction",
    summary:
      "Watch one denominator branch across a numerator sum, then run the exact structure backward.",
    href: "/reader/split-merge-fractions/",
    actionLabel: "Review split and merge",
    status: "exemplar"
  },
  {
    id: "solve-fractional-linear-scroll-lesson",
    kind: "scroll-lesson",
    title: "Solve a fractional equation",
    summary:
      "Watch subtraction, cancellation, and multiplication carry x through a fraction to its solution.",
    href: "/reader/solve-fractional-linear/",
    actionLabel: "Review fraction animation",
    status: "prototype"
  },
  {
    id: "solve-x-scroll-lesson",
    kind: "scroll-lesson",
    title: "Solve for x",
    summary:
      "Scroll through a short explanation and watch each symbol find its next place.",
    href: "/reader/solve-x/",
    actionLabel: "Open scroll lesson",
    status: "exemplar"
  },
  {
    id: "solve-with-balance-concept-room",
    kind: "concept-room",
    title: "Solve with balance",
    summary:
      "Move between an equation and the balance model that makes it true.",
    href: "/concepts/mathematics/linear-equations/solve-with-balance",
    actionLabel: "Open concept room",
    status: "prototype"
  }
] as const satisfies readonly KpLearnerExperienceDescriptor[];

export function createKpLearnerExperienceLibrary():
  readonly KpLearnerExperienceDescriptor[] {
  return learnerExperiences;
}
