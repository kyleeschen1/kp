# Stable Attention Stage And Collaboration Tone Experiment

Date: 2026-08-10
Status: provisional; awaiting human visual review

## Decision

Run one independently reversible presentation experiment on the demand-shift
attention-stage view. Its vertical order is:

```text
stage
passage
progress
transport buttons
```

The graph keeps one stable geometry across semantic frames unless a responsive
constraint requires a smaller projection. The stage provides a safe inset for
visual labels. Required passage text may increase in size and height; it must
wrap into ordinary page flow rather than being clipped, compressed, or causing
the graph to resize. The same one-screen composition remains the preferred
case, not a hard constraint that overrides readable text.

The canonical exemplar is the existing demand-shift attention stage. Approval
requires visual confirmation that its graph remains spatially constant, its
four regions read in the intended order, its default composition is austere,
and its phone and large-text fallbacks remain usable. This decision does not
select a universal KP lesson layout, change Article v1 syntax, alter the graph
model or animation runtime, or generalize the treatment to another lesson.

The rollback unit is the attention-stage stylesheet and its scoped browser
check. The ordinary deck, the full economics article, all other layout views,
and the canonical animation remain preservation boundaries.

## Collaboration Tone Experiment

Project collaboration should be honest, welcoming, and encouraging. Reports
should identify real progress and a concrete next direction while stating
costs, uncertainty, and limitations plainly. They must not use hype, false
certainty, empty reassurance, or reassurance that hides risk. A difficult or
unfinished layout problem should not be presented as proof that the project
idea is unsound unless the evidence actually supports that conclusion.

This tone is durable repo guidance in `AGENTS.md`, but it is experimental and
reviewable. It does not automatically define public lesson prose, marketing
copy, or the voice of generated explanations.

## References

- `../threads/explanation-attention.md`
- `../roadmap.md`
