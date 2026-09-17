# Programming

## Abstraction, functional patterns and data processing

### Semantic moves

- [ ] `code.higher-order` Pass behavior as a value without confusing it with a call result.
  Example: map(f, xs) receives f; map(f(), xs) receives the result of calling f
  Audit: unaudited
- [ ] `code.closure` Retain lexical bindings after the defining function returns.
  Example: A returned counter function can retain its enclosing state
  Audit: unaudited
- [ ] `code.map-filter-reduce` Distinguish element transformation, selection and aggregation.
  Example: map changes values, filter chooses entries, reduce combines them
  Audit: unaudited
- [ ] `code.lazy` Distinguish defining a lazy sequence from consuming it.
  Example: A generator body can run only as values are requested
  Audit: unaudited
- [ ] `code.iterator` Track iterator state and exhaustion separately from the collection.
  Example: Two iterators over one list can have different positions
  Audit: unaudited
- [ ] `code.tail-call` Distinguish tail position from recursive syntax alone.
  Example: Returning f(x) is tail-position; returning 1+f(x) retains pending addition
  Audit: unaudited
- [ ] `code.adt` Hide representation behind a data abstraction contract.
  Example: Clients use stack operations without depending on its array representation
  Audit: unaudited
- [ ] `code.object-method` Resolve method behavior through receiver and dispatch rules.
  Example: A method call can choose behavior based on the receiver's class
  Audit: unaudited
- [ ] `code.composition` Compare composition with inheritance as sources of behavior.
  Example: A wrapper delegates to a contained object rather than becoming its subtype
  Audit: unaudited
- [ ] `code.pattern-match` Match an alternative and bind its contents without losing exhaustiveness.
  Example: Some(value) and None require different branches
  Audit: unaudited
- [ ] `code.query-filter` Filter records by a predicate while retaining row provenance.
  Example: Rows satisfying price>10 remain traceable to their source
  Audit: unaudited
- [ ] `code.query-join` Distinguish matching keys from matching row positions.
  Example: Joining orders to customers uses customer ID, not displayed order
  Audit: unaudited
- [ ] `code.query-group` Group records and aggregate within each group.
  Example: Total spending per customer differs from a grand total
  Audit: unaudited
- [ ] `code.query-null` Account for missing values under the query language's semantics.
  Example: SQL NULL comparisons do not behave like ordinary Boolean equality
  Audit: unaudited

### Visual motifs

- [ ] `motif.code.closure` Separate lexical environment from the currently active call.
  Example: An inactive call can leave bindings reachable through a closure
  Audit: unaudited
- [ ] `motif.code.pipeline` Track an element through selection, transformation and aggregation.
  Example: A filtered-out item does not contribute to a later sum
  Audit: unaudited
- [ ] `motif.code.join` Preserve provenance when one row matches multiple rows.
  Example: A one-to-many join duplicates result participation, not source identity
  Audit: unaudited
