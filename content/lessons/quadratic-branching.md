# Two paths, the same two roots

Solve the exact equation x² − 5x + 6 = 0. Completing the square and the quadratic formula take different routes, but both must arrive at the complete solution set x ∈ {2, 3}.

```kp-animation-story
{
  "id": "story.quadratic-branching",
  "asset": { "id": "animation.algebra.quadratic.solution-branching", "version": "1" },
  "presentation": "scroll-scrub",
  "beats": [
    {
      "id": "beat.read-equation",
      "title": "Read the equation",
      "content": "The same quadratic equation is the source for both methods.",
      "progressPermille": 0,
      "checkpointId": "source",
      "focusRefs": ["equation.source"]
    },
    {
      "id": "beat.choose-method",
      "title": "Choose a method",
      "content": "Complete the square to expose a perfect square, or substitute the coefficients into the quadratic formula.",
      "progressPermille": 100,
      "checkpointId": "method",
      "focusRefs": ["method.active"]
    },
    {
      "id": "beat.split-branches",
      "title": "Follow plus and minus",
      "content": "The plus-minus operation creates two exact branches: the minus branch gives x equals two, and the plus branch gives x equals three.",
      "progressPermille": 680,
      "checkpointId": "branches",
      "focusRefs": ["branch.minus", "branch.plus"]
    },
    {
      "id": "beat.reunite-roots",
      "title": "Reunite the roots",
      "content": "Both branches are required. Together they settle into the complete solution set x is in the set containing two and three.",
      "progressPermille": 880,
      "checkpointId": "solution-set",
      "focusRefs": ["solution.root-two", "solution.root-three"]
    },
    {
      "id": "beat.connect-graph",
      "title": "Locate the roots",
      "content": "The two exact solutions will meet the graph at its two x-axis intersections.",
      "progressPermille": 1000,
      "checkpointId": "graph",
      "focusRefs": ["graph.root-two", "graph.root-three"]
    }
  ]
}
```

The searchable transcript is complete without motion: completing the square rewrites the equation as (x − 5/2)² = 1/4, while the quadratic formula simplifies to x = (5 ± 1)/2. In either method the minus branch gives x = 2, the plus branch gives x = 3, and the complete solution set is x ∈ {2, 3}.
