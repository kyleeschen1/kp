# Inference-cost policy amendment during code promotion

Standing engineering-budget repair authority applies. This is a bounded policy
amendment, not an optimization. Full inference checking first failed at 303,017
instantiations against 301,600. All types checked successfully; core remained
116,346 types / 198,777 instantiations within its unchanged ceilings.

The complete 51-fixture combined cohort measures 179,268 types / 303,017
instantiations. `scripts/measure-inference-history.ts --baseline f51f55000`
performs read-only compiler-host comparisons, preserving current fixtures and
compiler options. Replacing the changed historical source closure reproduces
the old recorded baseline exactly: 178,493 / 300,444, with no errors. Replacing
only changed rendering files yields 179,218 / 302,960. The optional
`--mode historical-reader-dispatch` yields 178,849 / 300,762, also without errors.

Thus 2,255 of the 2,573 added instantiations enter through the accepted native
fraction-factor split dispatch in `equation-scene-compositor-adapter.ts`. That
dispatch adds `native-fraction-factor-split.ts`, which uses the existing lineage,
fission/fusion and fraction choreography owners. It repaired a real missing
motif; removing it would regress accepted motion. Attribution samples overlap
and must not be added together. A separate metadata-only counterfactual removed
just 16 instantiations; discovery strings are not the primary problem.

Alternatives considered: removing the dispatch, excluding real renderer
consumers, or weakening inference would hide valid coverage; none is acceptable.
A renderer or choreography rewrite is unjustified for this measured increase.
No hot inference algorithm or redundant checked consumer was established here.

Exact amendment: update the combined measured baseline to 179,268 / 303,017;
raise only its instantiation ceiling from 301,600 to 309,100 (2% rounded up to
the next hundred). Keep the passing 182,100 type cap, both cohorts, all 49 core
and two frontend fixtures, negative type tests and compiler options unchanged.
Before and after policy amendment compiler counts are unchanged; headroom is
6,083 instantiations. The existing membership/headroom tests remain executable.
