# Solve for x

An equation is a promise that both sides have the same value. To keep that promise, make the same move on both sides.

Watch [the unknown](kp:focus/equation.linear-solve.initial.lhs.x "x stays the same object as the equation changes") as the other terms move around it.

```kp-animation-story
{
  "id": "story.solve-x",
  "asset": {
    "id": "animation.linear-solve.solve-x",
    "version": "1"
  },
  "presentation": "scroll-scrub",
  "attention": {
    "kind": "phased-attention-v1",
    "phases": [
      {
        "id": "attention.read.orient",
        "kind": "orient",
        "beatId": "beat.read",
        "checkpointId": "checkpoint.beat.read",
        "startProgressPermille": 0,
        "endProgressPermille": 55,
        "cue": "Find x, plus three, and seven before anything moves.",
        "focusRefs": ["equation.linear-solve.initial"]
      },
      {
        "id": "attention.subtract.act",
        "kind": "act",
        "beatId": "beat.subtract",
        "checkpointId": "checkpoint.beat.subtract",
        "startProgressPermille": 55,
        "endProgressPermille": 250,
        "cue": "Watch minus three enter on both sides.",
        "focusRefs": ["equation.linear-solve.after-subtract.lhs.minus3", "equation.linear-solve.after-subtract.rhs.3"]
      },
      {
        "id": "attention.subtract.settle",
        "kind": "settle",
        "beatId": "beat.subtract",
        "checkpointId": "checkpoint.beat.subtract",
        "startProgressPermille": 250,
        "endProgressPermille": 300,
        "cue": "Both sides changed together, so equality still holds.",
        "focusRefs": ["equation.linear-solve.after-subtract"]
      },
      {
        "id": "attention.subtract.inspect",
        "kind": "inspect",
        "beatId": "beat.subtract",
        "checkpointId": "checkpoint.beat.subtract",
        "startProgressPermille": 300,
        "endProgressPermille": 333,
        "cue": "Trace x across the unchanged equality.",
        "focusRefs": ["equation.linear-solve.after-subtract.lhs.x"]
      },
      {
        "id": "attention.cancel.orient",
        "kind": "orient",
        "beatId": "beat.cancel",
        "checkpointId": "checkpoint.beat.cancel",
        "startProgressPermille": 333,
        "endProgressPermille": 390,
        "cue": "Find plus three and minus three on the left.",
        "focusRefs": ["equation.linear-solve.after-subtract.lhs.plus3", "equation.linear-solve.after-subtract.lhs.minus3"]
      },
      {
        "id": "attention.cancel.act",
        "kind": "act",
        "beatId": "beat.cancel",
        "checkpointId": "checkpoint.beat.cancel",
        "startProgressPermille": 390,
        "endProgressPermille": 575,
        "cue": "Watch the opposites meet and cancel.",
        "focusRefs": ["equation.linear-solve.after-subtract.lhs.plus3", "equation.linear-solve.after-subtract.lhs.minus3"]
      },
      {
        "id": "attention.cancel.settle",
        "kind": "settle",
        "beatId": "beat.cancel",
        "checkpointId": "checkpoint.beat.cancel",
        "startProgressPermille": 575,
        "endProgressPermille": 625,
        "cue": "Only x remains on the left.",
        "focusRefs": ["equation.linear-solve.left-simplified.lhs.x"]
      },
      {
        "id": "attention.cancel.inspect",
        "kind": "inspect",
        "beatId": "beat.cancel",
        "checkpointId": "checkpoint.beat.cancel",
        "startProgressPermille": 625,
        "endProgressPermille": 667,
        "cue": "Compare the simplified left side with the line before it.",
        "focusRefs": ["equation.linear-solve.left-simplified"]
      },
      {
        "id": "attention.solve.orient",
        "kind": "orient",
        "beatId": "beat.solve",
        "checkpointId": "checkpoint.beat.solve",
        "startProgressPermille": 667,
        "endProgressPermille": 725,
        "cue": "Read seven minus three on the right.",
        "focusRefs": ["equation.linear-solve.left-simplified.rhs.7", "equation.linear-solve.left-simplified.rhs.3"]
      },
      {
        "id": "attention.solve.act",
        "kind": "act",
        "beatId": "beat.solve",
        "checkpointId": "checkpoint.beat.solve",
        "startProgressPermille": 725,
        "endProgressPermille": 900,
        "cue": "Watch the two constants become four.",
        "focusRefs": ["equation.linear-solve.left-simplified.rhs.7", "equation.linear-solve.left-simplified.rhs.3", "equation.linear-solve.solved.rhs.4"]
      },
      {
        "id": "attention.solve.settle",
        "kind": "settle",
        "beatId": "beat.solve",
        "checkpointId": "checkpoint.beat.solve",
        "startProgressPermille": 900,
        "endProgressPermille": 960,
        "cue": "The right side has settled at four.",
        "focusRefs": ["equation.linear-solve.solved.rhs.4"]
      },
      {
        "id": "attention.solve.inspect",
        "kind": "inspect",
        "beatId": "beat.solve",
        "checkpointId": "checkpoint.beat.solve",
        "startProgressPermille": 960,
        "endProgressPermille": 1000,
        "cue": "Check the final statement: x equals four.",
        "focusRefs": ["equation.linear-solve.solved"]
      }
    ]
  },
  "beats": [
    {
      "id": "beat.read",
      "title": "Read the equality",
      "content": "Start with the whole equation: x plus three equals seven.",
      "progressPermille": 0,
      "focusRefs": ["equation.linear-solve.initial"]
    },
    {
      "id": "beat.subtract",
      "title": "Make the same move twice",
      "content": "Subtract three from both sides. Equality survives because the two moves match.",
      "progressPermille": 333,
      "focusRefs": ["equation.linear-solve.after-subtract.lhs.minus3", "equation.linear-solve.after-subtract.rhs.3"]
    },
    {
      "id": "beat.cancel",
      "title": "Let opposites cancel",
      "content": "On the left, plus three and minus three cancel. The unknown remains.",
      "progressPermille": 667,
      "focusRefs": ["equation.linear-solve.left-simplified.lhs.x"]
    },
    {
      "id": "beat.solve",
      "title": "Read the solution",
      "content": "Seven minus three is four, so x equals four.",
      "progressPermille": 1000,
      "focusRefs": ["equation.linear-solve.solved"]
    }
  ]
}
```
