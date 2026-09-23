# Common-factor authoring

Use task `equation.common-factor` from the supported authoring entrypoint.
This is one ordered two-product factoring step, not general polynomial factoring.

Begin with its generated `--example`, including namespaced state IDs such as
`state.common-factor.expanded` and `state.common-factor.factored`. Plain IDs like
`expanded` fail at `$.states[0].id` before algebra or presentation is checked.
Preserve the reported `code`, `path` and `expected`; repair the source format and
recheck before interpreting a rejection as a missing mathematical motif. Both
algebra inputs in the frozen repeatability trial made this authoring error;
their original failures remain recorded and provide no new factoring coverage.

## Start from a source

The accepted primary is `src/authoring/examples/common-factor-primary.json`:
`ab+ac` to `a(b+c)`. The numeric reuse source is
`src/authoring/examples/common-factor-numeric.json`: `2x+2y` to `2(x+y)`.
Both use the same proof, presentation binding, native mount and revision owners.

```sh
npm run author:check -- --task equation.common-factor --example
npm run author:check -- --task equation.common-factor --request src/authoring/examples/common-factor-numeric.json
```

Open `http://localhost:8000/experiments/reusable-reasoning/?example=common-factor`,
expand **Edit source JSON**, paste the selected source and choose **Apply source**.
The URL initially loads the primary; it does not automatically select the numeric
file. Two stops represent one complete transformation. Buttons and arrows play
the step; the scrubber and horizontal gestures provide continuous control.
An invalid edit preserves the last successfully prepared revision.

## Supported boundary

Declare single Latin letters as real scalars, with at most twelve declarations.
The common factor may be a declared letter or a single digit from 0 through 9;
the two addends are declared letters. Repeated occurrences remain distinct.
Use juxtaposition, explicit multiplication, addition and parentheses. Preserve
product and addend order; this task does not infer commutativity or cancellation.
The distributive-law owner checks the exact rewrite, including a zero factor.

The source requires exactly two distinctly identified states. Each LaTeX field
is limited to 512 characters; the complete domain source to 20,000 characters.
Editorial prose is literal, reviewable content, not mathematical proof.
Never author proof flags, correspondence maps, geometry, timing or a renderer.
Only the resolver can issue the complete canonical presentation binding.

## Repair examples

- `2x+2y` to `3(x+y)`: `invalid-factorization`; restore the matching factor.
- `2x+2y` to `2(y+x)`: reordered addends are outside the ordered rewrite.
- `12x+12y` to `12(x+y)`: mathematically valid, but `unsupported-presentation`;
  the current native fusion owner requires single-glyph contributors.
- Powers, functions, fractions, negative coefficients and undeclared letters:
  located syntax, shape or declaration repairs, not a generic animation fallback.

Keep each diagnostic code, path and expected contract intact. A successful
checker response is report-only; it is not a prepared runtime object.
The real native path is exercised for the primary and numeric source. This
does not certify every glyph, arbitrary factoring, or other mathematical families.

## Reuse and publication

Full/compact readings and prediction/reconstruction self-checks derive from the
displayed revision. Practice return restores its exact fractional position.
**Download displayed source** exports that revision, not unapplied text.

```sh
npm run author:common-factor-publication -- --source src/authoring/examples/common-factor-numeric.json
```

Use the emitted directory for the static reading and self-check edition. Add
`--check` to verify its existing bytes. Editions are immutable and content-addressed;
new shared-template builds do not silently rewrite earlier editions. Static
publication does not yet contain the live animation, and nothing is deployed.

`npm run check:common-factor-workflow` replays both retained sources through
checking, one scripted invalid edit and repair, revision replacement, export and
publication verification. It reports actual source bytes and scripted repair
turns; it is not a live-LLM benchmark. Use the separate
`npm run visual:common-factor-authoring` for actual browser behavior.
