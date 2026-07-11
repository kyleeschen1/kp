# KP Asset Authoring Guide

Date: 2026-07-11
Audience: Codex sessions, LLM authors, human authors, generated-problem ports

## Goal

This guide explains how to author KP assets so they are composable,
inspectable, seekable, reusable in flashcards, and portable across renderers.

The short version:

```text
semantic intent -> objects -> transformations -> diagram -> behavior ->
interpreter/export/flashcard
```

Start with the semantic operation. Add visual motion only after the object and
transformation identities are clear.

## Required Reading

- `docs/project/principles/kp-asset-calculus.md`
- `docs/project/principles/kp-composition-laws.md`
- `docs/project/decisions/2026-07-11-kp-asset-calculus-priority.md`
- `docs/project/threads/semantic-runtime.md`

## Authoring Checklist

Before adding a new asset or animation, answer these questions:

1. What semantic object or objects exist before the step?
2. What semantic object or objects exist after the step?
3. What transformation maps source to target?
4. Which selectors persist, appear, disappear, or change role?
5. What law or assumption justifies the transformation?
6. How does this compose with surrounding steps?
7. What behavior samples it over time?
8. What renderer or interpreter consumes the sampled frame?
9. What diagnostics should appear if a port or interpreter cannot preserve
   identity?
10. What flashcard question can be asked over the same asset?

If a step cannot answer these questions, keep it out of the core semantic
runtime until the gap is explicit.

## Naming

Use names that describe semantic meaning, not visual effect.

Prefer:

- `subtractBothSides`;
- `cancelAdditiveInverses`;
- `simplifyConstantDifference`;
- `differentiateExpression`;
- `applyLinearMap`;
- `advanceExecutionTrace`;
- `reinterpretExpressionAsGraph`.

Avoid making visual motifs the primary operation:

- `fadeOutPlusThree`;
- `moveTokenLeft`;
- `spinMatrix`;
- `particleExplosion`.

Visual motif names are valid only below the semantic layer, for example
`vanish`, `morph`, `focus`, `settle`, `crossfade`, or `fold`.

## Step Recipe

### 1. Define Objects

Create immutable object records for the relevant states.

For equation motion:

```text
eq0: x + 3 = 7
eq1: x + 3 - 3 = 7 - 3
eq2: x = 4
```

The object ids should remain stable within the asset bundle. Do not reuse
`eq0` for `eq1` just because the same DOM panel will show both.

### 2. Define Selectors

Selectors identify semantic parts:

```text
eq0.lhs.x
eq0.lhs.plus3
eq0.equals
eq0.rhs.7
eq1.lhs.x
eq1.lhs.plus3
eq1.lhs.minus3
eq1.equals
eq1.rhs.7
eq1.rhs.minus3
eq2.lhs.x
eq2.equals
eq2.rhs.4
```

Do not use DOM class names, KaTeX span order, or WebGL object indices as the
canonical selector. Renderers can register those as derived render nodes.

### 3. Define Transformations

Each structural step gets a transformation:

```text
t0: subtractBothSides(eq0 -> eq1)
t1: cancelAdditiveInverses(eq1 -> eq2a)
t2: simplifyConstantDifference(eq2a -> eq2)
```

For each transformation, record:

- source object ids;
- target object ids;
- rule or operation;
- assumptions;
- selector correspondence;
- provenance output;
- whether the mapping is strict, sampled, lax, or qualitative.

### 4. Define Diagram

Compose transformations into a diagram:

```text
linearSolve = sequence(t0, t1, t2)
```

Use standard composition forms:

- `identity`;
- `sequence`;
- `parallel`;
- `tree`;
- `focus`;
- `reinterpret`;
- `portImport`.

Only add a new form if the standard forms cannot express the asset without
lying about identity, ordering, or provenance.

### 5. Define Behavior

Map the diagram to a deterministic behavior:

```text
sample(linearSolveBehavior, time) -> frame
```

The behavior frame should include enough information for renderers:

- active transformation;
- active phase or beat;
- object and selector refs;
- poses or layout refs;
- visibility/focus state;
- annotations;
- export markers;
- diagnostics.

The behavior frame should not contain live DOM nodes, WebGL handles, random
values, or wall-clock reads.

### 6. Choose Interpreters

Pick one or more interpreters:

- KaTeX/DOM for equation panels;
- WebGL for graph/simulation panels;
- source-code panel for programming assets;
- static-step export for checkpoint sequences;
- frame-sequence export for media encoding;
- flashcard interpreter for study prompts;
- dashboard interpreter for searchable previews.

If an interpreter cannot preserve a law, record the diagnostic in the asset or
interpreter result.

### 7. Add Flashcards

Write flashcards as references over the asset:

```text
cloze(selector: eq1.lhs.minus3)
predictNext(transform: t1)
explain(transform: cancelAdditiveInverses)
focus(selector: eq2.rhs.4)
```

Do not create a separate copy of the equation just for a card. Refer to the
asset bundle and selectors.

## External Port Recipe

When mapping external deterministic data into KP:

1. Preserve external source ids and version.
2. Convert external values to KP semantic objects.
3. Convert external steps to KP semantic transformations.
4. Emit selector correspondence where possible.
5. Mark missing assumptions, opaque steps, lossy mappings, and unsupported
   operations as diagnostics.
6. Build a diagram that mirrors the external composition.
7. Add law tests against deterministic fixtures.

Acceptable first ports are fixtures, not live services. A fixture is easier to
law-test and prevents external integration details from defining KP semantics.

## Decomposition Recipe

When a student pauses and asks about a confusing transformation, the system
should be able to decompose the active transformation:

```text
inspectAt(asset, t) -> active transformation
active transformation -> optional drill-down asset
```

The drill-down asset can be authored, generated, or ported. It should still use
the same object, transformation, diagram, behavior, interpreter, and flashcard
rules.

Example:

```text
cancelAdditiveInverses
  -> show additive inverse definition
  -> show a + (-a) = 0
  -> map +3 - 3 onto that identity
  -> return to the original solve
```

## Review Checklist

A new asset is not ready until it can pass these checks:

- TypeScript shape is valid.
- Runtime validator resolves all object ids and selectors.
- Source/target boundaries compose.
- Correspondence identifies persistent selectors.
- Behavior sampling is deterministic at canonical times.
- Rewind samples the same behavior in reverse.
- Interpreters report strict/lax/lossy preservation.
- Flashcards resolve references.
- Dashboard rows expose the asset and examples.
- Human review confirms the explanation is pedagogically clear.

## Anti-Patterns

Avoid:

- using renderer state as semantic state;
- treating a visual fade as a semantic transformation;
- copying equations into flashcards instead of referencing selectors;
- making one-off animation code that cannot be sampled at arbitrary time;
- accepting a port without diagnostics;
- making every property a new runtime type;
- rewriting existing renderers before the asset contract requires it;
- hiding a law failure as a visual flourish.

## Minimal First Example

For the linear solve asset, an LLM author should produce:

- three immutable equation objects;
- transformations for subtracting both sides, cancellation, and simplification;
- selector correspondence for persistent `x`, equality, and constants;
- one sequence diagram;
- one behavior wrapper over the existing equation sampler;
- cloze, predict-next, and explain cards;
- one deterministic algebra-trace fixture that imports to the same bundle.

That vertical path is the template for future algebra, calculus, linear
algebra, graph, and programming examples.
