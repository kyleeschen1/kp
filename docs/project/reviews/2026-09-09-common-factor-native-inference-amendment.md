# M1a s12: complete native-host inference coverage

Approved under the standing policy automatically approving measured TypeScript
cost repairs. This is a structural inference-budget amendment, not a performance,
bundle, test, safety or visual waiver.

The s11 complete consumer fixture measured 144,618 types / 241,021 instantiations.
s12 adds actual calls to `mountCommonFactorNativeSurface` and
`renderCommonFactorCard`, plus a negative native-candidate fixture. This exposes
the existing canonical compositor, native measurement and reader runtime closure
that was not part of the earlier authoring-data consumer measurement.

Executed attribution: `npm run profile:authoring-entrypoint-inference` (before
amendment correctly exited 1 at the complete gate). Independent counterfactuals:

| Checked entries | Types | Instantiations | Local files |
| --- | ---: | ---: | ---: |
| Core fixture set | 112,541 | 192,604 | 393 |
| Core plus factoring session | 126,005 | 212,023 | 456 |
| Core plus factoring page | 126,450 | 212,606 | 459 |
| Core plus actual native host | 153,347 | 255,068 | 640 |
| Complete consumer configuration | 169,350 | 281,200 | 742 |

These closures overlap and must not be added together. They are TypeScript
checked-source costs, not browser bytes, frame times or user latency. The native
adapter imports its real direct owners. Replacing that consumer with a signature
facade, dropping a negative fixture, or bypassing the canonical compositor would
hide the cost rather than repair the measurement. Broad reader/runtime import
migration is outside this bounded host slice; no such migration was performed.

Retain all 48 core fixtures, the complete frontend fixture, full checking and
the original core ceilings (115,000 / 198,900). Update only the combined measured
baseline to 169,350 / 281,200 and its established rounded 2% / 3% headroom to
172,800 / 289,700 (previously 145,200 / 246,500). Membership and exact arithmetic
guards remain executable in `tests/typescript-inference-budget.test.ts`.

The active Theseus s12 receipt owns subsequent passing verification and commit
status. This amendment does not assert human visual approval or release readiness.
