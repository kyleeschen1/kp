# Typed Semantic State Facade Baseline

Date: 2026-09-03
Run: `run-contract.kp.typed-semantic-state-facade-derived-graph-v2`
Slice: s01
Status: baseline frozen

## Purpose

Freeze the authoring and compiler baseline before adding a convenience facade.
This packet measures the existing foundation honestly: it is precise and
executable, but it is not the intended author interface.

The executable raw-market fixture is
`tests/fixtures/semantic-state-authoring/raw-market.ts`. It declares two
required concrete curve slots, one required derived equilibrium slot, one
absent optional government-revenue slot, and one seller-tax supply update.

## Raw Authoring Burden

The frozen fixture contains:

| Measure | Baseline |
| --- | ---: |
| Manual identity-factory calls | 10 |
| Low-level state construction calls | 7 |
| Manual operation metadata fields | 7 |
| Persistent-value runtime narrowings | 1 |
| Nonblank authored setup lines | 69 |

The facade checkpoint in s12 should drive ordinary low-level identity calls,
construction calls, operation metadata, and persistent-value narrowing to zero
for the equivalent packet. Line count is contextual rather than a standalone
pass condition; exact domain types and local diagnostics take priority over the
smallest spelling.

## Compiler And Repository Baseline

The incoming completed foundation reported 102,058 types and 170,776
instantiations against the current repository inference ratchets. Its broad
checkpoint passed 6,175 tests, typecheck, architecture with zero dependency
exceptions, and the production bundle. Slice s01 reruns those gates after
adding only this characterization fixture and records the resulting exact
counts in Theseus evidence rather than treating this document as a live
counter.

## Representative Scale Contract

The s25 scale probe will build a deterministic, non-domain-specific state with:

- 128 concrete leaves arranged under nested groups;
- 64 derived leaves arranged as eight independent chains of eight;
- 16 sequential transformations that each revise one declared concrete leaf;
- one requested terminal read per changed chain plus one untouched-chain read;
- exact compute-call, cache-hit, cache-miss, and shared-node counts; and
- advisory elapsed-time and memory observations that do not create a
  machine-dependent pass threshold.

The executable acceptance is semantic: only the requested affected dependency
closure recomputes, untouched chains do not, unchanged entity/version objects
remain shared, recovery remains direct, and current compiler ratchets remain
green. If this probe reveals unacceptable linear container pressure, the loop
stops for a storage-design review instead of importing or implementing a
persistent collection inside s25.

## Preservation Boundary

This baseline changes no state semantics, production export, economics model,
renderer, runtime, Article, or animation. It adds characterization evidence
only. The fixture is durable test evidence, not a second market source of
truth.
