# Choosing a move that preserves the solutions

Status: implemented local teaching candidate, 2026-11-09; editorial review pending,
not evidence of learner transfer. Follows the explanation-first worksheet and the approved
authoring-to-practice programme. What counts remains the technical reference.

## Learner question and finite outcome

“How do I know what to do next in an equation, and why is that move allowed?”
Assume the learner can evaluate a simple fraction and understands that an equals
sign says the two expressions have the same value. Do not assume that “move it
across and change its sign” explains solving. Afterward, they should choose and
justify a reversible move on both sides, distinguish a legal move from a useful
one, and check the answer in the original equation. This is one linear equation,
not arbitrary symbolic solving or a lesson on all equivalence-preserving rules.

## Explanation draft before choreography

We want a number whose half, plus three, is seven. Rather than guess the number,
work backward from what happened to it: first it was halved, then three was added.
Removing that last addition leaves its half on its own.

Why subtract three from both sides? Imagine any number that makes the original
equation true. The two sides then have equal values. Subtracting three from each
leaves equal values again. We can also reverse this move by adding three to both
sides, so the new equation has exactly the same solutions. We have changed how
the condition is written, without changing which number satisfies it.

On the left, adding three and then subtracting three leaves just half the unknown.
On the right, seven minus three is four. So half the unknown is four. Doubling
both sides tells us the whole unknown is eight. Doubling is reversible here too:
we could divide both sides by two. Substituting eight into the original equation
checks our result: half of eight is four, and four plus three is seven.

Subtracting first is a convenient choice, not the only legal one. We could
double both sides at the start, but then we must double the entire left side,
including the added three. That would give the unknown plus six equal to fourteen.
Subtracting six would still give eight. The first route exposes the half more
directly; both routes preserve the solutions.

The tempting wrong move is to double just the fraction while doubling the right
side, leaving the three untouched. That gives the unknown plus three equal to
fourteen, whose solution eleven fails the original condition: half of eleven
plus three is eight and a half. “Do the same to both sides” means act on each
whole side, not whichever term currently attracts attention.

Try a changed case: a number is divided by three, then two is added, giving six.
What would you undo first, and why must the other side change too? Subtracting
two from both sides leaves a third of the number equal to four; multiplying both
sides by three gives twelve. A correct answer should explain preserved solutions,
not merely recite the number. Doubling-first comparison above is a static
reasoning check, not a new animated operation request.

## Visual job and preservation boundary

Canonical working manuscript: `content/authoring/algebra/fractional-linear-reasoning.article.md`.
Host: `/reader/solve-fractional-linear/?reading=reasoning` on product server 8011.
The reading registry selects an immutable snapshot. The unqualified route and
version 1 retain `content/lessons/solve-fractional-linear.md` exactly.
Asset: `animation.fractional-linear.solve-x-over-2`, version 1. The existing
fractional-linear lesson model/compiler owns its checked equation and operations;
the shared document theater and native KaTeX compositor own presentation.

Use the existing seven read/operation beats and semantic focus references, with
two stationary annotation beats at checked states. Entry should orient
the learner to the unknown being halved and then increased by three. Subtraction
should make both changes inspectable, then show why the opposites disappear.
Multiplication should connect the two sides before the denominator cancellation.
The perceptual purpose is tracking the same unknown while whole-side operations
change its surrounding expression. Static prose owns the legal-versus-useful
comparison, the wrong move, and the transfer question. Existing text-linked
focus lets a learner return to a precise referent; no new control is required
merely to make this draft more elaborate.

This remains a candidate advantage over a short static worked solution. Seeing
the quantities move does not establish that a learner understands the invariant.
Review the explanation and a changed-case response separately from visual polish.

## Supported local revision

The two translation gaps are resolved: a separate pinned reading registry
preserves version 1, and a shared annotation mount follows both native-paint host
paths. Note wording and targets come from the Article, not a second commentary
copy. A state-named beat becomes a stationary note only at that state's checked
progress, with selectors owned by that state. Use plain-language note text;
notation stays in native KaTeX. Unsupported states, targets, progress or inline
notation return a repair gap. No new mathematical operations are inferred.

Edit the working manuscript, then run:

```sh
npm run author:fractional-reading -- --reading reasoning --source content/authoring/algebra/fractional-linear-reasoning.article.md
```

The check returns a basis and proposed version URL. Repeat with `--apply --expect
<basis>` to select it, then open the returned path on port 8011. Only apply makes
the new URL available. Stale or invalid edits leave the selected reading intact;
each previous version retains its own exact source, wording and coordinates.
Do not edit archived snapshots or add arbitrary registry entries to revise prose.
This is local development authoring, not production publication or an integrated
workbench conversation. [Evidence and timings](../reviews/2026-11-09-fractional-reading.md)
separate the initial engineering from a subsequent source-only revision.

The rollback unit is a new pinned explanation and its bounded reader binding,
not a replacement math model or compositor. The finish line is one reviewed,
useful passage with a clear opening and retained argument; it is not a new editor,
a problem library, or proof of ChatGPT-level response time.
