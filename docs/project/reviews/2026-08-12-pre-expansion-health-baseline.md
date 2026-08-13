# Pre-Expansion Health Baseline

Date: 2026-08-12  
Revision: `f7de634d`  
Run: `run-contract.kp.pre-expansion-consistency-and-health-baseline-v2`

## Purpose

This is the immutable before-state for the consistency and health tranche. It
measures effective decision surface rather than treating file deletion as a
goal. Later slices may improve these values, but must not rewrite this record.

## Repository Shape

| Measure | Baseline |
| --- | ---: |
| Files under `src/` | 1,392 |
| Test files under `tests/` | 1,227 |
| TypeScript, Svelte, CSS, and JavaScript lines under `src/` | 318,521 |
| Named `public-api.ts` modules | 13 |
| Architecture-gated semantic-animation files | 468 |
| Classified compatibility paths | 15 |
| Built files | 374 |
| Built bytes | 7,797,606 |
| Built directory disk use | 8.8 MiB |

The largest source files at this revision are the symbolic-manipulation family
registry (5,236 lines), global stylesheet (4,928), equation surface adapter
(4,143), economics tutorial component (2,758), native KaTeX compositor (2,689),
and equation motion controller (2,684). Size alone is not retirement evidence;
these files are pressure indicators for later ownership and seam audits.

The named public modules are the two animation facades, app adapters,
authoring, domain IR, integrations, kernel, projections, and the five reader
facades. A raw deep-import count is deliberately omitted here: slice `s05`
must distinguish intentional same-owner imports from cross-boundary bypasses
before establishing a ratchet.

## Compatibility And Authority Baseline

The semantic-animation ledger contains 12 `compatibility-only` entries, two
retained fixtures, and one canonical cross-surface projection entry. The
architecture gate reports all 15 as classified and has zero frozen
semantic-animation exceptions. It does not yet prove that every entry has
complete caller, replacement, and retirement evidence; that is the purpose of
slice `s07`.

The architecture checks pass at baseline:

- concept-room: 102 files and seven frozen legacy exceptions;
- semantic-reader: 156 files;
- semantic-animation: 468 files, zero frozen exceptions, 15 classified
  compatibility paths; and
- operation-evaluation presentation: three motif consumers with source-derived
  caller minting.

## Catalogue Settlement Baseline

`npm run test:browser:animation-equation-capability` passes three of five
checks. Accessible loading, selected capability loading, and application-level
lazy closure pass. The two reservation checks fail without threshold changes:

| Exemplar | Viewport | Measured CLS | Required |
| --- | --- | ---: | ---: |
| solve-x equation | 1280 × 900 | 0.0056180857 | `< 0.001` |
| dot-projection graph | 390 × 844 | 0.0024071143 | `< 0.001` |

The reservation element's `x`, `y`, `width`, and `height` remain within 0.5 px
before and after capability settlement. Chromium nevertheless reports a
`ResizeObserver loop completed with undelivered notifications` error during
the failing cases. This localizes the initial investigation to descendant
settlement and observer/measurement churn rather than route replacement,
capability over-fetch, or a wholesale reservation-box resize.

## Bundle Baseline

The five largest built JavaScript chunks are the semantic animation Workbench
(676,954 bytes), Three/WebGL graph capability (528,812), server-side KaTeX
render helper (284,834), KaTeX runtime (257,502), and equation surface adapter
(193,723). The main global stylesheet is 84,149 bytes. These are generated
uncompressed sizes and are attribution evidence, not new budgets. Existing
route-specific gates remain authoritative.

## Worktree Preservation

The following user-owned files were already modified and are outside this run:

- `content/lessons/economics-demand-shift.kp.md`
  (`sha256:d705168845f89062c55f2165d43e715c9d1c84c1adfbbfd7753b138cb0ef3547`);
- `src/tutorial/economics-demand-shift/economics-demand-shift-publication.generated.json`
  (`sha256:75452929d6e21d0524d3629e474a53b201dd6baac3c1ba78c5233a18974df3ce`).

Unrelated untracked project decisions, reviews, threads, and specifications
visible in the starting worktree are likewise preserved and excluded from all
staging pathspecs.

## Baseline Commands

- `npm run check:architecture` — passed;
- `theseus workspace validate` — passed with 937 nodes and 19,834 events before
  this run's subsequent evidence;
- `npm run test:browser:animation-equation-capability` — expected baseline
  failure described above; and
- `npm run --silent loop:status` — slice 1 of 26.

