# Bounded systems explorer: measured cost amendment

Standing engineering-budget repair authority applies. The new exact generator,
elimination trace, rational/zero-row presentation and inspection UI add real code.
This is a feature-cost amendment, not an optimization claim.

The previous sequence baseline was 136340 JS / 17431 CSS gzip bytes for the
complete rectangular-product union; original composition was 121566 JS.
The initial explorer implementation measured 141606 union, 126839 generator,
123069 original composition and 113606 polynomial collection. The latter was
paying for the checker through a shared exact-value reader.

Extracting that reader into `src/math/row-exact-value.ts` preserves its public
re-export while removing checker activation from pure typography consumers.
Polynomial collection fell to 112102; union rose to 141888 from chunk overhead.
After adding parameter/rank controls, extracting generator controls into a lazy
route module avoids carrying their form and handlers in the shared player.

Final `npm run build:matrix-interpretations` and `npm run measure:semantic-cost`:

| Complete consumer | JS gzip bytes | Ceiling |
| --- | ---: | ---: |
| Rectangular union | 143096 | 145000 (was 138000) |
| Generated systems | 128315 | 130000 (new consumer) |
| Original composition | 122799 | 123000 (unchanged) |
| Variation / sequence | 123641 / 123670 | 124000 each (unchanged) |
| Polynomial collection | 111585 | 112000 (unchanged) |
| System / reordered collection | 112423 / 112215 | 113000 each (was 112000) |
| Guided / workbench | 116758 / 108468 | unchanged |

Generator CSS is 16527 bytes; union CSS remains 17431. All CSS ceilings and
unaffected consumer, forbidden-module, runtime and menu limits stay unchanged.
The measurement explicitly activates both generator model and controls, plus
the existing composition player/view and complete dependency closure.

Rejected alternatives: hiding the new consumer, counting only cold HTML, or
duplicating fraction rendering to avoid its owner. Further bundle surgery is
not justified by these bounded deltas. These are compression estimates, not
network transfer or browser mount benchmarks. Generated traces premeasure one
surface per step (at most sixteen); this does not establish cheap mounting of
many simultaneous solvers. Runtime virtualization remains a separate measured
question before extending size or embedding many instances.
