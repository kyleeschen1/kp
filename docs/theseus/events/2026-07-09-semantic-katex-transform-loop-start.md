# Semantic KaTeX Transform Loop Start

Date: 2026-07-09
Project: kp
Status: run-start
Run contract: `run.semantic-katex-transform-v1`

## Summary

The user approved the Semantic KaTeX transform long-loop proposal. The run
starts from the verified baseline commit:

```text
4b18660 chore: checkpoint semantic animation baseline
```

## Theseus CLI Status

The standard run-contract command was attempted:

```sh
npm run theseus -- add-run-contract run.semantic-katex-transform-v1
```

It failed because this repository currently has no `theseus` script in
`package.json`. The run therefore continues with manual Theseus event records
under `docs/theseus/events`, matching prior project practice.

## Approved Loop

Source proposal:
`docs/theseus/events/2026-07-09-semantic-katex-transform-long-loop-proposal.md`

Approved target sequence:

1. `frontier.catalog.semantic-transform-groups-v1`
2. `frontier.docs.katex-transform-taxonomy-v1`
3. `frontier.semantic.correspondence-relation-v1`
4. `frontier.semantic.correspondence-map-record-v1`
5. `frontier.semantic.visual-lifecycle-separation-v1`
6. `frontier.expression.selector-paths-linear-equation-v1`
7. `frontier.transform.subtract-both-sides-general-v1`
8. `frontier.transform.cancel-additive-inverse-general-v1`
9. `frontier.transform.evaluate-constant-expression-v1`
10. `frontier.semantic.notation-transform-v1`
11. `frontier.katex.fraction-transform-fixtures-v1`
12. `frontier.katex.script-transform-fixtures-v1`
13. `frontier.katex.radical-transform-fixtures-v1`
14. `frontier.katex.wrapper-transform-fixtures-v1`
15. `frontier.katex.large-operator-fixtures-v1`
16. `frontier.katex.matrix-transform-fixtures-v1`
17. `frontier.render.visual-artifact-lifecycle-v1`
18. `frontier.render.katex-correspondence-overrides-v1`
19. `frontier.motion.role-aware-primitives-v1`
20. `frontier.motion.semantic-beat-compiler-v1`
21. `frontier.dashboard.katex-transform-gallery-v1`
22. `frontier.authoring.transform-fixture-contract-v1`
23. `frontier.theseus.semantic-animation-report-card-v1`
24. `frontier.loop.semantic-katex-transform-closeout-v1`

## Run Rules

- Work only on approved loop slices.
- Commit after each verified slice.
- Record evidence manually while the Theseus CLI is unavailable.
- Stop if a slice requires broader product or architecture judgment.
- Stop if verification fails for a non-local reason.

## Next Slice

Begin slice 1:
`frontier.catalog.semantic-transform-groups-v1`
