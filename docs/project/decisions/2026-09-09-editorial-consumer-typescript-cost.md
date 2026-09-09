# R4B editorial consumer cost

The standing automatic TypeScript-cost repair approval applies. This is a
measured scope correction, not an optimization claim or an automatic budget refresh.

The original combined R4A measurement was 139337 types / 235826 instantiations
with ceilings 142200 / 243000. R4B now includes the real card, readings, prompts,
extraction, Apply and editorial-binding consumers, alongside all six domain
entrypoints and every existing negative test. The immutable edition compiler
remains covered by its actual Node tests and full Node/test typechecks.

First corrected an accidental dependency: ordinary probability context must not
depend on editorial syntax. Its trace-data owner now stays independent, reducing
the core measurement from 112589 / 192667 to 112299 / 192186. The original core
ceilings 112500 / 195800 remain unchanged.

Complete combined measurement after the correction is 142266 / 239250. Set fixed
ceilings to 145200 / 246500 using the existing rounded 2% type / 3% instantiation
policy. No fixture omission, unchecked cast, skipLibCheck or semantic/visual
change is used to recover cost. Commands: `npm run check:inference`,
`node --test tests/typescript-inference-budget.test.ts`, `npm run typecheck`.

## Versioned compiler integration

Once the actual draft compiler accepts the versioned source, the existing core
Bayesian consumers necessarily exercise the editorial parser and binder too.
Core measured 112727 types / 193102 instantiations, versus its prior 112500 /
195800 ceiling. Unlike the earlier accidental import, this is the required
consumer closure. Under the same standing approval set a fixed measured baseline
of 112727 / 193102 and rounded ceilings 115000 / 198900. Correct the historical
fixture-count metadata from 45 to the already enforced 48; membership itself is
unchanged. Combined retains its separate measured ceiling. No negative case or
real consumer is removed, and no runtime or type-safety guarantee is relaxed.
