# Animation Intent Skeleton

Recorded: 2026-07-07

Added a typed semantic `animation-intent` object for saddle denominator morphs.
It records target surface, property, from/to denominator, duration, and easing
without yet implementing playback.

The validator now checks that the target exists, that saddle-denominator intents
point at a parameterized saddle surface, and that numeric animation fields are
positive.

Verification:
- Red test first: missing `src/semantic/animation.ts`.
- `node --disable-warning=ExperimentalWarning --test tests/semantic.test.ts`
- `npm run typecheck`
- `git diff --check`
