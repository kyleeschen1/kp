# R1 reproducible author-task baseline

Date: 2026-09-07
Baseline parent: `453485680`
Evidence: `tests/authoring-round-trip-baseline.test.ts`

Run `node --disable-warning=ExperimentalWarning --test tests/authoring-round-trip-baseline.test.ts`.
Three tests passed. These are in-memory author/source-boundary tasks, not a
browser editing session, live-model run, or end-to-end publication certification.
The harness does not alter user files or leave a changed exemplar behind.

| Task | Reproducible edit/repair transcript | Existing result | Remaining integration cost |
| --- | --- | --- | --- |
| Wording | Build reference -> change heading -> prepare edited Article | New wording retained; same model revision and revenue 12 | One author file; authored source file has 52 nonempty lines. No generic source navigator or new publication selection proved |
| Parameter | Build reference -> select variation -> prepare -> try old Article with new model | Revenue 10; new model revision; mixed revision rejected | One model file, 23 nonempty lines; bound prose derives through companion. Canonical build remains reference-only |
| Equation step | Supply verified change-of-base source and request -> compile -> reverse numerator/denominator -> repair original target | Typed semantic-source failure; old active candidate retained; repaired compilation matches original | Two LaTeX endpoints, three source/state/adjacency pin groups plus operation, semantic bindings, assumptions and correspondence. Omitting the verified source fails |

Observed single-run durations were 234ms, 101ms and 11ms respectively; whole
test process 1.63s. These are local machine smoke measurements, not browser
latency targets or user-effort estimates. Repeated timings and real author/model
interventions belong to later workflow checks; human minutes are not measured.

The test fixture is 70 nonempty lines, including three tests/imports/assertions;
do not call that the minimum author syntax. Author source sizes are inventory,
not all orchestration. Existing helpers still perform the substantial semantic
and Article work; none is hidden by a new facade in this baseline.

The CLI currently invokes the equation compiler without a verified-source
selection input. The tested governed change-of-base path therefore uses the
TypeScript compiler entry with explicit trusted source, not a claim that bare
JSON/LaTeX can author it through the CLI. R1 must route this honestly and cannot
invent operation authority to make an author task succeed.
