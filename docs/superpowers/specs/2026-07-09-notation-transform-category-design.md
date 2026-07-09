# Notation Transform Category Design

Date: 2026-07-09
Theseus run: `run.semantic-katex-transform-v1`
Target: `frontier.semantic.notation-transform-v1`
Status: proposal

## Purpose

`NotationTransform` names semantic-preserving representation changes. It sits
beside `SemanticTransformation`, not inside it.

The distinction:

- `SemanticTransformation` creates a new semantic object or derivation step and
  records provenance between source and target selectors.
- `NotationTransform` keeps the same semantic object identity and changes the
  notation/view used to render it.

This keeps visual notation choices from masquerading as algebraic facts while
still making them addressable, composable, and animatable.

## V1 Contract

Each notation transform definition records:

- stable id;
- title;
- status;
- geometry family;
- identity policy, currently `preserve-semantic-object`;
- source notation;
- target notation;
- render artifact roles that may appear or disappear;
- tags for search and dashboard filtering.

The first registry lives in `src/semantic/notation-transform.ts`.

## Seed Transforms

- `inlineFractionToStackedFraction`
  - Source notation: `inline-slash`.
  - Target notation: `stacked-fraction`.
  - Artifact roles: `fraction-bar`.
- `radicalToExponent`
  - Source notation: `radical`.
  - Target notation: `power-one-half`.
  - Artifact roles: `radical`, `radical-line`.
- `implicitToExplicitMultiplication`
  - Source notation: `implicit-product`.
  - Target notation: `explicit-operator`.
  - Artifact roles: `explicit-operator`.

## Renderer Implications

Notation transforms still need measured render nodes because KaTeX geometry
changes substantially:

- stacked fractions introduce bars and baseline-separated numerator/denominator
  rows;
- radicals introduce composite glyphs and overbar-like rule nodes;
- explicit multiplication introduces an operator token where implicit notation
  had only spacing.

These artifact nodes are visual and do not have independent semantic identity.
They are linked to the semantic selector or notation transform view that
requires them.

## Non-Goals

- This is not a CAS equivalence engine.
- This does not prove that two expressions are mathematically equal.
- This does not replace `SemanticTransformation` for operations such as
  evaluating, canceling, distributing, differentiating, or row reducing.

## Dashboard Surface

The dashboard now has a `notation-transform` gallery kind so these records can
be searched independently from semantic transformations. The editor API outline
has a matching `Notation Transformations` group.
