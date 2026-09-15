# Kinetic Press: permanent reasoning record and local inspection

Status: discussion handoff; experiments recorded, not authorized for execution.
Current implementation reference: `6f5bd8add`.
Canonical host: <http://localhost:8000/experiments/mechanics-relations/#energy-from-momentum>.
The localhost URL requires the local KP server; an external chat cannot access it.

## Product context

Kinetic Press is developing a medium for learning to read and reason with the
formal representations of technical subjects. Prose supplies motivation,
definitions and justification; animation should make a transformation or
correspondence easier to follow than a static presentation. The ambition is
queryable, reusable micro-intuitions that can compose into longer explanations,
not compulsory video lessons or isolated interactive widgets.

The current experiment is a readable argument whose transitions can be inspected
without losing its permanent record. The reader controls the explanation's
motion instead of racing timed text.

## Current layout, precisely

The exemplar derives kinetic energy in terms of momentum, for positive scalar
mass and Euclidean vectors:

1. K = (1/2) m ||v||^2.
2. K = (1/2) m ||p/m||^2.
3. K = (1/2) m ||p||^2 / m^2.
4. K = ||p||^2 / (2m).

It appears within an ordinary scrolling article. Four native KaTeX equation rows
form a vertical record. Between each adjacent pair is a permanent explanation:
a short operation heading, a sentence or paragraph, and an expandable
"Why is this allowed?" justification. These are not floating tooltips and do not
switch out when the active transition changes.

The interleaved region has a reserved equation-transit lane on its left and a
readable prose lane on its right. The explanation is vertically between its
equations but horizontally clear of the moving math. We deliberately do not
superimpose translucent prose and notation. On phones this remains the same
composition, with more text wrapping and greater document height.

At the far left, a thin vertical rail has a tick aligned with each equation.
A visible, graspable up/down handle and short horizontal connector identify the
current inspection position. Dragging it vertically moves one inspection
expression between the fixed equation rows while the algebraic rewrite unfolds.
The expression carries and rewrites together, rather than finishing its travel
and then starting a separate animation.

Downward dragging advances; upward dragging samples the same transformation in
reverse. Releasing between rows holds that intermediate position. Small resting
zones around complete equations make them easier to land on. There is no
separate horizontal slider or Play toolbar. Small Previous/Next buttons and
keyboard navigation provide explicit animated movement; reduced-motion
navigation goes directly to endpoints. Ordinary scrolling does not scrub math.

Text and expanded justifications determine the spacing between rows. The host
measures each interval separately: unequal spacing does not change semantic
endpoints or button-playback duration. Expanding a justification pauses motion
and updates geometry without resetting the mathematical position. Expansion
intentionally reflows the document; positions remain fixed during inspection
while the layout itself is unchanged.

## Permanent record versus moving inspection

All four written equations remain visible. The moving expression is an
explanatory inspection copy, not a replacement for the record and not an extra
mathematical term. At an exact dock, only the stationary equation is visible;
the inspection copy is transparent, avoiding coincident double ink.

The first substitution tests a distance-based, reversible emphasis envelope:
the inspection copy gains emphasis as it separates and yields back near a dock.
The stationary record changes emphasis but never disappears. The other two
moves retain full inspection emphasis between exact docks; promotion of the
first departure/arrival treatment remains pending human review.

The principle is: inspection may change emphasis, but must not erase the
argument being inspected. The complete equations and reasons remain available
without JavaScript and in print. The redundant moving stage is hidden from
assistive technology; the static record supplies the accessible mathematics.

## Architecture and limits

The Article, checked physics model, semantic operations and native KaTeX
compositor remain the authorities. The reader projects their state; it does not
infer substitutions from matching text or create a second mathematical engine.

This is a bounded equation exemplar, not a universal authoring system or a
proven cross-domain layout. Existing graph/code capabilities do not mean they
already use this reading/inspection composition. Nested granular derivations,
symbol-click inspection, nonlocal recall with exact return, and long-document
drag/autoscroll behavior are not implemented by this experiment. Expanding a
text justification is implemented; expanding one move into new semantic
substeps is a future capability.

Long prose is structurally accommodated, but arbitrarily long gestures and
very narrow text columns remain usability questions, not solved guarantees.
Evidence includes sixteen focused tests, ten Chromium checks and a full build;
that does not establish learning efficacy or Safari/device certification.

## Recorded experiments, in recommended order

1. **Nonlocal substitution in the current equation example.** Recall an earlier
   expression locally with an explicit provenance reference, show any necessary
   rearrangement, and substitute an inspection copy into the current expression.
   Keep the original record intact. Offer navigation to the original reasoning
   and exact return to the inspection position. Preserve assumptions and scope;
   matching notation alone does not license reuse. Prefer local recall over a
   multi-screen flying expression. Test whether the learner understands both
   where the expression came from and why it is valid here.
2. **A tiny graph with one consequential change per beat.** Test permanent
   figures/reasons with local inspection of a meaningful change, such as rotating
   a vector while its length stays constant. The coordinate frame can remain
   stationary; the whole graph need not travel downward. Small figures must
   remain legible and narrowly focused, not shrink a complex chart's labels.
   Test static-versus-motion benefit and whether context remains recoverable.
3. **A small code example or multiline system.** Choose the caller that best
   tests scope and granularity. For code, distinguish program rewriting from
   execution-state changes; avoid repeating whole files. For equations, choose
   whether a row, subexpression or system is the meaningful transformation unit.
   Explore a coarse transition that can open into finer verified substeps while
   preserving its outer endpoints. Do not build two divergent authored proofs.

These are research candidates, not a new run contract or permission to execute.
The relational-reader lane remains active; the prior mechanics loop remains
parked. Select bounded scope after discussion and the relevant visual checkpoint.

## Questions for external design discussion

- Does the rail communicate local inspection without looking like a scrollbar
  or reorder control?
- What is the best way to enter a local transition in a long document without
  dragging through screens of prose?
- How should a reader distinguish a permanent record from an inspection copy
  during separation and reconciliation?
- When should explanations stay alongside transit, and when should they have
  full-width reading space? How do we avoid narrow phone columns?
- How can expanded substeps preserve both the surrounding argument and exact
  return to the reader's previous level of detail?
- What reading/interaction contracts should be shared across media, while
  mathematical semantics, graph geometry and code execution remain domain-owned?
- How should a recalled expression expose provenance, assumptions and scope
  without adding excessive visual machinery?

Please critique the interaction and pedagogical model before proposing a new
universal architecture. Separate existing behavior, desired behavior and testable
hypotheses. Preserve a static, readable argument as the baseline comparator.
