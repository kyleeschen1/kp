# Programming

## Refactoring and equivalent programs

### Semantic moves

- [x] `code.extract-ts` Extract a shared predicate — bounded TypeScript helper frontend. [Evidence](../../repertoire-notes/programming-audit.md)
  Example: Repeated free-shipping checks become calls to one checked helper
  Audit: implemented
- [x] `code.extract-python` Extract a shared predicate — bounded Python helper frontend. [Evidence](../../repertoire-notes/programming-audit.md)
  Example: Repeated total-threshold checks become calls preserving the total binding
  Audit: implemented
- [x] `code.extract-centroid` Extract an averaging calculation — centroid passage. [Evidence](../../repertoire-notes/programming-audit.md)
  Example: The same arithmetic moves into a helper with explicit inputs
  Audit: implemented
- [x] `code.rename-centroid` Rename parameters/locals without merging runtime storage — centroid passage. [Evidence](../../repertoire-notes/programming-audit.md)
  Example: Corresponding names change while sumX and sumY remain distinct
  Audit: implemented
- [ ] `code.extract-keyword` Extract a Python helper with keyword-only or variadic calling shape. [Evidence](../../repertoire-notes/programming-audit.md)
  Example: qualifies(*, total) with qualifies(total=total)
  Audit: gap — current legality frontend explicitly rejects this source shape
- [ ] `code.extract-capture` Preserve captured bindings when extracting a helper. [Evidence](../../repertoire-notes/programming-audit.md)
  Example: Passing other instead of total changes meaning
  Audit: partial — bounded legality checks reject lost bindings; general capture-safe extraction is not established
- [ ] `code.inline` Inline a helper while preserving evaluation order and side effects.
  Example: Replacing f(g()) must not evaluate g() twice
  Audit: unaudited
- [ ] `code.rename-general` Rename a binding without capturing another name.
  Example: Renaming x to y must avoid shadowing a free y
  Audit: unaudited
- [ ] `code.loop-to-map` Replace an explicit traversal with map where effects and order permit.
  Example: A pure elementwise transformation can preserve outputs
  Audit: unaudited
- [ ] `code.loop-fusion` Fuse traversals only when dependencies and effects allow it.
  Example: Combining two loops can change when side effects occur
  Audit: unaudited
- [ ] `code.equivalence` Compare programs under an explicit observable-behavior contract.
  Example: Same return value alone may not preserve exceptions or mutations
  Audit: unaudited
- [ ] `code.tests-proof` Distinguish examples that pass from a general equivalence argument.
  Example: Three passing inputs do not prove equivalence for every input
  Audit: unaudited

### Visual motifs

- [x] `motif.code.extract` Carry checked source tokens into a helper and corresponding calls. [Evidence](../../repertoire-notes/programming-audit.md)
  Example: Centroid extraction preserves source/target correspondence
  Audit: implemented
- [x] `motif.code.rename` Coordinate a binding's renamed occurrences — centroid passage. [Evidence](../../repertoire-notes/programming-audit.md)
  Example: Rename only occurrences belonging to that binding
  Audit: implemented
- [ ] `motif.code.text` Keep explanations attached to code referents through inspection.
  Example: Long prose must not force the reader to relocate the relevant statement
  Audit: unaudited
- [ ] `motif.code.compare` Align implementations by semantic role rather than line number.
  Example: One source statement may correspond to several target statements
  Audit: unaudited
