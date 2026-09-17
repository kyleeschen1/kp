# Programming

## Loops, invariants and algorithmic reasoning

### Semantic moves

- [ ] `code.loop-state` Trace one iteration with explicit before and after state.
  Example: i increases and sum changes under the loop body
  Audit: unaudited
- [ ] `code.loop-invariant` State and preserve a loop invariant.
  Example: Before iteration i, sum equals the total of processed elements
  Audit: unaudited
- [ ] `code.loop-termination` Use a decreasing measure to justify termination.
  Example: A nonnegative integer remaining count decreases each iteration
  Audit: unaudited
- [ ] `code.loop-boundary` Check empty, singleton and final-iteration cases.
  Example: An average needs a rule for an empty collection
  Audit: unaudited
- [ ] `code.accumulator` Distinguish several independent accumulators.
  Example: sumX and sumY represent different coordinate totals
  Audit: unaudited
- [ ] `code.search-linear` Relate a search's explored prefix to remaining candidates.
  Example: If no match in the prefix, the answer may still be in the suffix
  Audit: unaudited
- [ ] `code.search-binary` Maintain a search interval under an ordering assumption.
  Example: Each comparison removes a half known not to contain the target
  Audit: unaudited
- [ ] `code.sort` Track permutation preservation separately from ordering progress.
  Example: Sorting must retain every input occurrence
  Audit: unaudited
- [ ] `code.partition` Partition around a predicate without asserting full sorting.
  Example: Values satisfying the predicate move to one side
  Audit: unaudited
- [ ] `code.graph-traversal` Distinguish discovered, queued and fully processed graph nodes.
  Example: BFS explores increasing unweighted distance layers
  Audit: unaudited
- [ ] `code.shortest-path` Relate relaxation to a distance estimate and algorithm assumptions.
  Example: Dijkstra's settled distances require nonnegative edge weights
  Audit: unaudited
- [ ] `code.divide-conquer` Separate subproblems and justify recombination.
  Example: Merge sort combines two sorted halves
  Audit: unaudited
- [ ] `code.dynamic-programming` Reuse overlapping subproblem results under a dependency order.
  Example: A table entry is computed after its dependencies
  Audit: unaudited
- [ ] `code.greedy` Explain the exchange or dominance argument behind a greedy choice.
  Example: A locally best-looking step alone does not prove global correctness
  Audit: unaudited
- [ ] `code.complexity` Count operations as input size changes.
  Example: Binary search takes logarithmically many comparisons
  Audit: unaudited
- [ ] `code.amortized` Separate worst-case cost of one operation from sequence-average cost.
  Example: Occasional dynamic-array growth can coexist with amortized constant append
  Audit: unaudited

### Visual motifs

- [ ] `motif.code.invariant` Keep the invariant beside the changing state it constrains.
  Example: Processed and unprocessed regions preserve their logical meanings
  Audit: unaudited
- [ ] `motif.code.frontier` Distinguish active work from discovered and completed work.
  Example: Queue position and graph position are different relationships
  Audit: unaudited
- [ ] `motif.code.subproblem` Link repeated uses to one computed subproblem result.
  Example: Reuse is not re-execution
  Audit: unaudited
