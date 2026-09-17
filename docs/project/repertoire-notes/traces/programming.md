# Programming trace pressure

## Extract and rename the centroid calculation

Use the accepted centroid exemplar's ordinary-array assumptions and supported
before/after sources; do not substitute a generic arbitrary statement block.

| Step | Reason | Inventory rows |
| --- | --- | --- |
| Identify the original averaging calculation and its inputs | Preserve the source-backed operation boundary | `code.extract-centroid` |
| Move that calculation into a helper and return its result to the caller | Preserve the checked source/target correspondence | `code.extract-centroid`, `motif.code.extract` |
| Rename helper parameters and locals | Keep binding identity while changing spelling | `code.rename-centroid`, `motif.code.rename` |
| Retain the second coordinate's independent runtime storage | Sharing a procedure does not share accumulators | `code.accumulator` |

Finding: the local refactor inspection is implemented; it is not a runtime trace
of both calls. Long explanatory prose remains `motif.code.text`, an unaudited
coordination need. An empty collection also needs a defined behavioral contract
(`code.loop-boundary`) rather than a silently invented average.

## Evaluate the existing Scheme factorial source

| Step | Reason | Inventory rows |
| --- | --- | --- |
| Bind n=3 in the first call | The activation owns a fresh local parameter binding | `code.call-bind` |
| Suspend 3 times the recursive result and descend | A pending multiplication retains its operand role | `code.recursion`, `motif.code.call` |
| Continue through n=2,1 to n=0 | Each call has its own parameter binding | `code.binding`, `code.recursion` |
| Return 1 at the base case | The recursion stops under the checked source | `code.base-case` |
| Unwind to 1,2,6 | Each result fills the waiting continuation exactly once | `code.return` |

Finding: the source, evaluator and presentation path are established for this
bounded caller; see [audit](../programming-audit.md). The general lexical-binding
curriculum row remains unaudited despite this specialized use. A branching tree
recursion is not covered by `code.recursion-general`.

## Deliberate rejected variant

The Python free-shipping extractor accepts its checked helper/call shape
(`code.extract-python`). Changing it to a keyword-only helper with a keyword
argument call reaches `code.extract-keyword`, which the current legality checker
explicitly rejects. The inventory must preserve that gap even though ordinary
Python can express the refactor. Implementation of the repair is outside this run.
