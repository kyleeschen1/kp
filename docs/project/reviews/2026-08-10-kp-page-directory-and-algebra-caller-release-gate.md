# KP Page Directory And Algebra Caller Release Gate

Date: 2026-08-10
Status: passed with attributed activation debt
Source proposal:
`2026-08-09-kp-page-directory-and-algebra-caller-long-loop-proposal.md`

## Outcome

The universal development page directory and the fraction-composition algebra
article pass the production release gate without leaking development authoring
code or exceeding an established reader ceiling. The new algebra route starts
with 36,219 gzip bytes of JavaScript and CSS plus 4,434 gzip bytes of static
HTML. Its article remains complete, searchable, and navigable before that
runtime activates.

The ten-route common equation-reader closure is 125,174 gzip bytes. This is 396
bytes above the recorded pre-caller comparison baseline of 124,778 bytes and
19,826 bytes below the established 145,000-byte ceiling.

## Common Reader Attribution

The 396-byte increase is bundler partitioning, not a new reader dependency.
The algebra entry gives Rollup another caller of the existing semantic-focus
module, so Rollup extracts that module into a 795-byte shared chunk. Four
existing reader chunks become 399 bytes smaller in aggregate. The reader still
loads the same capability graph, and the production scan finds no CodeMirror,
Vim, source-save endpoint, or article-source marker.

## Algebra Closure

Measured production closure for the algebra article:

- static HTML: 4,434 gzip bytes;
- initial JavaScript and CSS: 36,219 gzip bytes;
- lazy stage activation increment: 274,397 gzip bytes;
- active JavaScript and CSS total: 310,616 gzip bytes;
- production authoring leakage: none.

The activation increment is intentionally reported as debt rather than hidden
inside the smaller startup number. The existing equation-surface adapter is a
broad certified adapter: activation includes runtime KaTeX (76,151 bytes), the
adapter itself (44,515 bytes), shared equation styles (14,818 bytes), solid-mask
morph support (14,653 bytes), visual motifs (12,458 bytes), and radical
choreography (12,304 bytes), among other equation capabilities.

This loop does not create a fraction-only renderer or parallel runtime to make
that number look smaller. Such a fork would violate the preservation boundary.
The follow-up performance seam is to split the existing certified adapter by
declared capabilities while retaining one renderer authority and one clock.
Because the closure is lazy and cached, additional stages using the same
adapter on one page do not pay the full transfer cost again.

The measured algebra values are now guarded by a five-percent growth allowance,
alongside the established common-reader ceiling and the production authoring
leakage scan.

## Verification

- `npm run build`
- `npm run check:algebra-fraction-composition-budgets`
- `npm run check:reader-production`
- `npm run check:reader-budgets`
- `npm run check:dev-review-production`
- `npm run test:kp-article-v1`
- `npm run test:browser:algebra-article`
- `npm run test:browser:reader-conformance`
- `npm test`

## Release Boundary

This gate establishes objective production safety. Teaching clarity, attention
choreography, and visual quality remain subject to the final human checkpoint;
the measured broad activation closure is a named future optimization, not an
authorization to change the article grammar or duplicate renderer ownership.
