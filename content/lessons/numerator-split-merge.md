# Split and merge a fraction

One denominator can govern every term in a numerator. Motion makes that shared structure visible.

Track the [plus](kp:focus/equation.numerator-split-merge.combined.fraction.numerator.plus "The plus moves from inside the numerator to between the two fractions") as its role changes without changing its meaning.

```kp-animation-story
{
  "id": "story.numerator-split-merge",
  "asset": { "id": "animation.numerator-split-merge.round-trip", "version": "1" },
  "presentation": "scroll-scrub",
  "beats": [
    {
      "id": "beat.combined",
      "title": "Read one shared fraction",
      "content": "The denominator two divides the entire numerator sum, two x plus six.",
      "progressPermille": 0,
      "focusRefs": ["equation.numerator-split-merge.combined"]
    },
    {
      "id": "beat.split",
      "title": "Give each term the denominator",
      "content": "The fraction bar and denominator branch. The plus descends between two fractions while every numerator term keeps its identity.",
      "progressPermille": 500,
      "focusRefs": ["equation.numerator-split-merge.split"]
    },
    {
      "id": "beat.merge",
      "title": "Run the structure backward",
      "content": "Compatible denominators converge, the fraction bars reunite, and the plus rises back into one numerator.",
      "progressPermille": 1000,
      "focusRefs": ["equation.numerator-split-merge.combined"]
    }
  ]
}
```
