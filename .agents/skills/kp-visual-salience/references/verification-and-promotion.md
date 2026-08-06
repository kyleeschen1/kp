# Verification and promotion

Use a hybrid cadence: prove semantic and lifecycle truth early, but do not build an expensive visual certification matrix before a human selects the exemplar's visual language.

## Before implementation

Record:

- **Canonical exemplar:** the one page, lesson, or vignette under review.
- **Acceptance criteria:** observable semantic and visual outcomes.
- **Preservation boundary:** models, APIs, renderers, or lessons that must not change.
- **Rollback unit:** the smallest commit or independently removable adapter/treatment.
- **Promotion criterion:** what human approval and second-caller evidence would justify sharing.

## Discovery checks

Run the smallest checks that protect durable truth:

1. Every authored target resolves to a known semantic entity.
2. Projection is pure for a fixed playhead and configuration.
3. Direct seek reaches the same endpoint as playback.
4. Reverse and interruption do not leave stale classes, attributes, materials, or hidden content.
5. Initial static output is legible without enhancement.
6. Reduced-motion, high-contrast, and no-depth paths preserve meaning.
7. Paint-only salience does not alter layout geometry.
8. Previously observed regressions for the exemplar remain fixed.

Do not interpret passing automated checks as visual approval.

## Human exemplar checkpoint

Stop for review of:

- what wins attention at each beat;
- whether context remains readable without competing;
- handoff timing between prose and visual objects;
- color, contrast, apparent stroke weight, type, and ghost treatment;
- forward, reverse, direct-jump, and theme behavior;
- phone and narrow-layout legibility when the treatment depends on spatial coordination.

Keep tuners available internally when they help review, but do not expose them as lesson UI or global tokens by default.

## After approval

1. Encode motif-specific semantic and rendering regressions.
2. Exercise a second, structurally different caller—for example, prose-to-SVG followed by KaTeX-to-WebGL, or an economics graph followed by a Lisp expression.
3. Compare the two callers and extract only the boundary both actually share.
4. Run responsive, light/dark, reduced-motion, high-contrast, direct-link, and supported-browser checks.
5. Measure scripting, style recalculation, layout, paint, and GPU work on a representative page with multiple blocks.
6. Propose catalogue-wide adoption as a separate, reviewable change.

## Promotion failures

Do not promote when:

- the second caller requires exceptions that leak domain concepts into the shared layer;
- visual dominance depends on DOM order or renderer internals;
- a direct URL jump must replay animation to become correct;
- hidden content disappears from the accessibility tree;
- each object requires its own listener, observer, animation clock, or material clone;
- exact aesthetic values are still being tuned;
- the shared abstraction would replace a working semantic contract only for naming consistency.

## Performance pressure test

For pages with many animation blocks, verify that inactive blocks have no active sampling loop, observers are shared or bounded, theme endpoints are cached, and direct seek performs one projection plus one paint. Profile representative counts rather than reasoning from CSS file length: unused CSS transfer, selector matching, per-frame work, and GPU overdraw are separate costs.
