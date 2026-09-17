# KP moves and motifs

Predicted needs by discipline, with checks for implemented examples.

Open the [dashboard](http://localhost:8000/experiments/repertoire/) with the
development server running. Choose a discipline and optionally one topic, then read
separate lists for semantic moves and visual motifs.

Link a particular move with `/experiments/repertoire/#alg.log.quotient-combine`
(substitute its stable ID). The page restores the containing discipline/topic.
Topic selection also survives reload and browser history. Without JavaScript all
lists remain readable; the page does not need a database or runtime content fetch.

- [Shared reading](shared.md)
- [Algebra](algebra/01-arithmetic.md) (topic files in `algebra/`)
- [Calculus and multivariable calculus](calculus/01-limits.md)
- [Linear algebra](linear-algebra/01-matrices.md)
- [Probability and statistics](probability-statistics/01-conditioning.md)
- [Differential equations](differential-equations-optimisation/01-odes.md)
- [Optimization](optimisation/01-objectives.md)
- [Numerical methods](numerical-methods/01-error-solving.md)
- [Classical mechanics](mechanics/01-kinematics.md)
- [Programming](programming/01-evaluation.md)
- [Economics](economics/01-choice-markets.md)

**✓** Implemented at the scope stated on that row; follow the evidence link.
**☐** Predicted need, not yet confirmed implemented at that scope. Some may
already have partial machinery; this is a starter list, not an exhaustive audit.

The curriculum expansion follows [scope and sources](../repertoire-notes/scope-and-sources.md).
Granular rows distinguish `unaudited`, `partial` and an evidenced `gap` in a short
audit note. These notes explain the checkbox; they are not additional UI columns.

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
- [x] `discipline.topic.move` A bounded implemented reasoning operation. [Evidence](../relative/path.md)
  Example: Before → after, with necessary assumptions
  Audit: implemented

### Visual motifs
- [ ] `motif.discipline.treatment` A predicted visual treatment.
  Example: The relationship a reader should be able to follow
  Audit: unaudited
```

Evidence paths are relative to the containing file. Both lists are required per
topic; checked items require an existing evidence file. `npm run test:repertoire`
validates the content and evidence links. Add a discipline by adding a small
Markdown file here and linking it in this index; the selector discovers it.
For a larger discipline, use a folder named for its selector ID and small topic
files with the same discipline heading. The compiler groups them automatically.
Keep topic titles unique within a discipline and item IDs unique across the
inventory. Optional `Uses: id.one, id.two` lines reference existing rows and are
validated. Examples illustrate scope; they are not automatically certified tests.

Edit only the relevant discipline file. Keep each item one line: checkbox,
plain-language name, brief scope if needed, and an evidence link when checked.
Use the three-line format above for new rows; `partial` and `gap` also require
evidence, while `unaudited` makes no implementation claim. The validator checks
IDs, references, audit/checkbox agreement and files; a human/source audit still
owns the truth of the claim. It cannot certify an implementation from a link.
Narrow or split an overly broad item instead of adding status columns. Add likely
needs as unchecked items; check only after inspecting implementation evidence.
Shared treatments belong in shared.md; link them instead of duplicating status.
Keep lists curated and short. No scores, percentages, generated reports, or
full-repository scan is needed for an ordinary update. Existing technical
registries own technical support claims; this dashboard owns planning visibility.
