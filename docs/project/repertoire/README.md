# KP moves and motifs

Predicted needs by discipline, with checks for implemented examples.

Open the [dashboard](http://localhost:8000/experiments/repertoire/) with the
development server running. Choose a discipline, then read its topics with
separate lists for semantic moves and visual motifs.

- [Shared reading](shared.md)
- [Algebra](algebra.md)
- [Calculus and multivariable calculus](calculus.md)
- [Linear algebra](linear-algebra.md)
- [Probability and statistics](probability-statistics.md)
- [Differential equations and optimisation](differential-equations-optimisation.md)
- [Classical mechanics](mechanics.md)
- [Programming](programming.md)
- [Economics](economics.md)

**✓** Implemented at the scope stated on that row; follow the evidence link.
**☐** Predicted need, not yet confirmed implemented at that scope. Some may
already have partial machinery; this is a starter list, not an exhaustive audit.

A **semantic move** is the reasoning operation. A **motif** is its visual
treatment. One move can use several motifs; a motif can serve several moves.
Checks do not claim universal authorability, visual promotion or certification.

## Updating this dashboard

The web page renders these Markdown files directly during development and
packages them during the normal build. There is no second inventory to update.
Use this format in each discipline file:

```markdown
# Discipline name

## Topic name

### Semantic moves
- [x] A bounded implemented reasoning operation. [Evidence](../relative/path.md)
- [ ] A predicted reasoning operation.

### Visual motifs
- [ ] A predicted visual treatment.
```

Evidence paths are relative to the discipline file. Both lists are required per
topic; checked items require an existing evidence file. `npm run test:repertoire`
validates the content and evidence links. Add a discipline by adding a small
Markdown file here and linking it in this index; the selector discovers it.

Edit only the relevant discipline file. Keep each item one line: checkbox,
plain-language name, brief scope if needed, and an evidence link when checked.
Narrow or split an overly broad item instead of adding status columns. Add likely
needs as unchecked items; check only after inspecting implementation evidence.
Shared treatments belong in shared.md; link them instead of duplicating status.
Keep lists curated and short. No scores, percentages, generated reports, or
full-repository scan is needed for an ordinary update. Existing technical
registries own technical support claims; this dashboard owns planning visibility.
