/** Editorial landmarks on the existing extraction, not a second motion score.
 * Boundary syntax enters in the latter part of extraction; the final thought
 * remains valid while the second move renames the helper's local variables. */
export const centroidMotionReading = [
  { id: "calculation", position: .1, action: "Move the calculation", title: "This calculation moves together.",
    focusText: "Follow the sum, loop and division as one procedure.",
    text: "Follow the sum, loop and division into the helper. Their work stays connected as their location changes." },
  { id: "boundary", position: .3, action: "Inspect the boundary", title: "Moving it creates a boundary.",
    focusText: "The array goes in; the average comes out.",
    text: "The function takes the array as its input. The sum and loop stay inside; `return` makes the division’s result available outside." },
  { id: "answer", position: .5, action: "Keep the answer", title: "The caller keeps the answer.",
    focusText: "`mean(xs)` still supplies `cx` as the helper’s local names change.",
    text: "`mean(xs)` takes the calculation’s place beside `cx`. Continue dragging to rename the helper’s locals: the caller still supplies `xs` and receives the average." }
] as const;

export function centroidMotionThought(progress: number) {
  return centroidMotionReading[progress < .2 ? 0 : progress < .4 ? 1 : 2];
}
