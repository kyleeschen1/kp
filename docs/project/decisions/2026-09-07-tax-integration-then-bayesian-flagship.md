# Tax integration, then a Bayesian flagship

Date: 2026-09-07
Status: accepted direction and pedagogical reference; implementation remains USER_PAUSED

## Accepted choice

The user accepted the recommendation to use the existing tax explanation to
finish proving the authoring workflow, then choose Bayesian updating as the
first new flagship explanation. This is a selection within the authoring-first
direction, not a replacement architecture or approval of a new execution loop.

The user named Scott McKeon's probability diagrams from Stanford Econ 102A and
102B as an especially effective personal learning experience. In a follow-up,
the user confirmed that these were branching probability trees which McKeon
would collapse and flip to answer conditional-probability questions. That
confirmation refers to the pedagogical reference, not the unresolved code-card
report or G3 approval.

The user's recollection of their popularity is valuable first-person product
evidence, not a measured claim of universal preference or learning efficacy.

## Public research findings

McKeon's Stanford-hosted Winter 2016–17
[102A syllabus](https://syllabus.stanford.edu/syllabus/downloadSyllabus?courseId=W17-ECON-102A-01),
PDF page 7, assigns early lectures to building, collapsing and flipping
probability trees, then connects Bayes' rule with flipping and introduces
three-stage trees. Pages 2–3 locate the lecture handouts on Canvas and restrict
their redistribution. This identifies the method, but does not expose the
actual Week 1–2 diagram conventions for visual inspection.

The matching Stanford-hosted
[102B syllabus](https://syllabus.stanford.edu/syllabus/downloadSyllabus?courseId=W17-ECON-102B-01),
PDF page 2, assumes prior knowledge of probability trees. It is evidence of
continuity across the courses, not a separate public diagram collection.

A related public Stanford resource is Samuel S. Chiu's
[probabilistic-analysis introduction, section 1.1.3](https://web.stanford.edu/~samchiu/chapter1.htm).
It advocates building and flipping trees to structure and use conditional
information. No direct historical or instructional connection to McKeon's
materials has been established. Do not attribute Chiu's text or diagrams to
McKeon, or claim that McKeon invented probability trees or tree flipping.

Public first-person accounts also praise McKeon's teaching and notes:
[Clara Meister's Stanford advising account](https://advising.stanford.edu/current-students/my-stanford-story/cmeister-course)
and [a 2014 Stanford Daily student tribute](https://stanforddaily.com/2014/03/10/a-tribute-to-scott-mckeon/).
Neither establishes diagram-specific effectiveness for every learner.

## Implication for the proposed flagship

Study the problem-structuring method, not just a style of drawing. A useful
candidate explanation would help the reader build a probability model, ask a
question of it, and reorganize the representation to expose the answer.
Bayes' rule can then be connected to that reorganization rather than presented
only as a formula to memorize. This is a design inference and future proposal,
not evidence of an implemented KP capability.

Preserve a crucial distinction for later design: refactoring a joint
distribution into a different tree order is not changing the underlying joint
probabilities, and reversing conditional order is not reversing causation.
Conditioning on observed evidence is another explicit operation. Zero-mass
conditioning and undeclared independence require honest handling rather than
fabricated branch values. The exact representation and animation remain
unselected until a bounded exemplar is designed and reviewed.

The semantic source should not be identified with one particular rendered
tree. This is an architectural constraint to investigate within the existing
domain-owned framework, not authorization for a universal graph or a new
global runtime store.

## What remains unchanged

- Resume the current tax/code-card work from
  [the preserved checkpoint](../threads/2026-09-07-canonical-tax-resume-point.md)
  only when the user resumes implementation. G3 remains unaccepted.
- The [composable-explanation review](../reviews/2026-09-07-composable-explanation-medium-next-step-review.md)
  supplies proposed rationale and work packets. This decision accepts the
  tax-then-Bayes selection, not every proposed packet, type, UI or milestone.
- No new probability frontend, animation motif, public API, browser write
  surface, deployment or Theseus run is authorized by this research turn.
- Do not copy restricted course handouts into public KP content. For an exact
  McKeon visual reference, obtain an openly published or permission-cleared
  example, or ask the user to describe/sketch the remembered convention.
- Preserve the existing code and structural-equation pressure requirements;
  choosing the new flagship does not displace domain-boundary verification.

## Next planning question

Establish the exact tree conventions and the smallest representative problem
that demonstrates construction, marginalization, conditioning and reordering
without conflating them. Then identify existing capabilities and typed gaps
before proposing a bounded implementation contract. This decision does not
itself start that implementation.
