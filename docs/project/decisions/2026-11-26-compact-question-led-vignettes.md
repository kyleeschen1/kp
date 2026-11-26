# Composable mathematical references with replayable derivations

Date: 2026-11-26
Status: accepted product, visual and editorial direction; implementation remains unselected

## Clarification: gestalt, composition and repeated return

The user corrects the initial emphasis on question-led miniature lessons:
"my main thought actually was gestalt and composability." They want organized
reference pages of trigonometric identities, calculus rules and practical
mathematics, where clicking a rule opens an animation of its derivation. The
animations should be easy to revisit repeatedly.

The reference page is the organizing whole. Its arrangement should expose
families, correspondences and useful contrasts before any animation plays.
Rules and their conditions remain readable at rest; animation supplies a
focused explanation on demand. Compact figures and thin lines serve that
reference experience rather than prescribing a linear lesson or required quiz.

Recommended consequences, still design rather than implemented capability:

- A rule has stable identity, a readable statement, its conditions and links to
  derivations, related rules and examples. Keep a derivation distinct from an
  application of the rule. Domain owners retain mathematical validity.
- A derivation is a reusable asset or named sequence. Reference pages, articles,
  flashcards and other derivations can point to it without copying its source.
  Composing sequences must preserve parameter bindings, prerequisites and the
  state needed to enter directly; visual similarity alone does not justify reuse.
- Opening, replaying, scrubbing and closing a derivation should preserve the
  reader's place in the reference. Avoid mandatory introductions on repeat visits.
- Related rules remain discoverable around a local explanation. A deeper linked
  derivation should have a precise return to the step that invoked it.
- Many entries can remain static while the shared player prepares the selected
  sequence. A reference page does not require a live iframe or loop per rule.

This clarification supersedes the assistant's framing of the page primarily as
a sequence of small teaching questions. It retains the user's compact styling
and focused attention preferences below. It selects no implementation scope,
renderer migration or new execution contract.

## Initial visual direction and provenance

The user asks for very simple styles, "thin, 1px lines," and graphs "smaller
than expected - just enough to get the gist." A topic should have many little
vignettes: dozens about trigonometric geometry, close readings of difficult
syntax, and a one-page walkthrough of Halmos's *Naive Set Theory* that helps
people learn its notation. The organizing aim is "making that one thing that
matters stand out."

This refines the existing [authoring and attention direction](2026-11-08-authoring-expert-attention.md).
It does not replace mathematical correctness, complete arguments or native
representations with decorative simplification.

## Visual and editorial defaults

- Prefer compact figures with only the geometry, marks and labels necessary to
  recognize the intended relationship. Larger or more elaborate displays should
  earn their space by clarifying that relationship.
- Use thin 1px graph lines as the requested starting treatment. Interpret this
  as one CSS pixel in screen space, not a world-space width that changes with
  camera zoom. Final appearance across density, themes and accessibility settings
  still needs an exemplar; this record does not migrate existing renderers.
- Keep notation and explanatory labels readable at their native reading size.
  Reduce diagram extent or recompose labels before shrinking their typography.
- Give each opened derivation or vignette a clear explanatory purpose.
  The focus can be a relationship between several objects. Quiet context should
  still explain where the focal relationship belongs.
- Prefer deliberate local changes, stable object identity and selective color
  to continuously moving or uniformly emphasized scenes. Required information
  must remain legible; exact color and motion treatments are still provisional.
- Organize related rules and views into a recognizable reference, with links
  between entries and their explanations.
  Quantity is a library ambition, not a quota for beats or simultaneous playback.

The [reading principles](../principles/document-theater-reading.md),
[typography owner](../principles/focus-card-typography.md) and existing semantic
salience boundaries remain authoritative for implementation.

## Candidate teaching material

For trigonometry, separate vignettes could connect a circle point to its
coordinates, reflect an angle to inspect sign changes, or approach a vertical
radius to examine the tangent ratio. Reusing a circle does not require repeating
the same teaching question. These are suggestions, not authored assets.

For Halmos, interpret "one page" as a navigable reference companion focused on
reading notation. Candidate entries include membership versus inclusion,
set-builder conditions, quantifier scope and the roles of functions and
relations. These examples are not claims about the book's exact notation or
ordering. Consult the relevant passages before authoring; the
[publisher's contents](https://link.springer.com/book/10.1007/978-1-4757-1645-0)
only confirms the broad subject coverage. Preserve the distinction between
learning to parse a statement and understanding its proof.

## Architectural implications and scope

Many authored vignettes should not imply many permanently active iframes,
graphics contexts or animation loops. A page can retain meaningful resting
views and activate the needed material. The proposed reusable player, shared
context and bounded preparation should serve this presentation; the presentation
should not be forced into an oversized stage to suit the player.

Record the reference experience and style preference now; select and review one
reference-to-derivation interaction before promoting a shared treatment.
No current example, CSS, renderer contract,
book content, iframe lifecycle or publication is changed by this decision. The
graph-section commitment, proposed reusable-stage successor and parked work
retain their existing scope and status. No earlier plan is retired here.

## Recording checks

The initial direction record passed all 75 `npm run test:project-vision` checks.
The clarified reference emphasis also passes all 75 checks. Startup documents
retain their existing word budgets. No rendering or lesson behavior is changed
by either record.
