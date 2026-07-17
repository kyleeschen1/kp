# Codex Collaboration Protocol

Date: 2026-07-17  
Status: accepted  
Scope: subjective visual, motion, interaction, and LLM-generated-output work

## Purpose

Make effective collaboration behavior a project responsibility instead of a
set of prompting techniques the user must remember. The protocol is triggered
when quality depends on aesthetic or explanatory judgment. Routine maintenance
and exact bug fixes with deterministic acceptance tests do not require its
review ceremony.

## Mode Boundary

Diagnosis, planning, comparison, and implementation are distinct modes. A
request to diagnose or plan does not authorize a write. Before implementation,
Codex should state which mode it is operating in when the boundary could be
ambiguous.

## Required Boundaries

Before a broad visual implementation, identify:

1. **Canonical reference** — the existing example or behavior that defines the
   desired quality.
2. **Acceptance criteria** — observable properties such as font stability,
   continuous token motion, clipping limits, phase order, or native settlement.
3. **Preservation boundary** — semantics, contracts, APIs, or validated behavior
   that must remain intact.
4. **Rollback unit** — the smallest recipe, policy, adapter, file set, or commit
   that can be reversed independently.

These boundaries should be visible in a plan or run contract rather than left
implicit in conversation.

## Exemplar-first Sequence

1. Compare current behavior with the canonical reference.
2. Describe the difference phase by phase.
3. Record the required boundaries and acceptance criteria.
4. Implement one representative exemplar.
5. Stop for visual review unless the checkpoint was explicitly waived or the
   generalization was approved in advance.
6. Generalize only after the exemplar is accepted.
7. Run cross-family promotion and regression checks after generalization.

An accepted principle is not automatically a universal renderer policy. First
formalize the principle, then separately decide whether evidence supports global
enforcement.

## Regression Handling

Prefer a presentation-only rollback when semantic annotations, authoring
contracts, and operation models remain sound. Restore the successful exemplar,
retain useful semantics, and refine the generalized motif in an isolated
fixture. Broaden the rollback only when evidence shows the architecture itself
caused the regression.

## Grill-me Cadence

Recommended defaults may be accepted in batches. Codex should pause only for
choices with material architectural, product, or aesthetic consequences. This
keeps stress-testing rigorous without turning low-impact choices into dozens of
approval turns.

## Visual Run-contract Requirements

A visual long-loop contract must name:

- the canonical exemplar or exemplar cohort;
- the slice at which visual review occurs;
- the acceptance and promotion criteria;
- the preservation boundary;
- the independently reversible rollback unit;
- which later slices generalize the accepted exemplar;
- which checks validate the exemplar and which validate promotion.

If these fields are missing, the loop may investigate and prepare an exemplar,
but it should not silently apply an unreviewed visual policy across families.

