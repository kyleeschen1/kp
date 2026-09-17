# Programming

## Types, asynchronous work and concurrency

### Semantic moves

- [ ] `code.types` Use types to rule out invalid operations or states.
  Example: A discriminated union separates success data from error data
  Audit: unaudited
- [ ] `code.narrowing` Refine available facts after a checked condition.
  Example: After kind='success', a result value is available
  Audit: unaudited
- [ ] `code.generics` Separate a reusable shape from a concrete type instantiation.
  Example: A list operation preserves its element type
  Audit: unaudited
- [ ] `code.validation` Validate external data before granting internal guarantees.
  Example: Parsed JSON is not automatically a valid domain object
  Audit: unaudited
- [ ] `code.async` Distinguish scheduling a task from completing it.
  Example: An async call can return a promise before its work finishes
  Audit: unaudited
- [ ] `code.await` Retain a suspended continuation while awaiting a result.
  Example: Code after await depends on fulfillment or rejection
  Audit: unaudited
- [ ] `code.race` Show how an interleaving violates a shared-state invariant.
  Example: Two read-modify-write increments can lose an update
  Audit: unaudited
- [ ] `code.atomic` Relate a synchronization boundary to an invariant.
  Example: A lock must cover the whole read-modify-write operation
  Audit: unaudited
- [ ] `code.deadlock` Expose a wait cycle and the resource ownership causing it.
  Example: A holds X waiting for Y while B holds Y waiting for X
  Audit: unaudited
- [ ] `code.cancel` Distinguish cancellation request from confirmed cleanup.
  Example: A canceled request may still produce a late response
  Audit: unaudited
- [ ] `code.stale` Reject stale asynchronous results using explicit authority.
  Example: An older response must not overwrite a newer selected state
  Audit: unaudited
- [ ] `code.dispose` Make resource disposal prevent later callbacks from acting.
  Example: A disposed view cannot own a later paint update
  Audit: unaudited
- [ ] `code.backpressure` Relate producer rate, queue growth and consumer capacity.
  Example: An unbounded queue hides an unsustainable rate mismatch
  Audit: unaudited

### Visual motifs

- [ ] `motif.code.concurrency` Compare causal order with one possible execution interleaving.
  Example: Side-by-side timelines do not imply simultaneous atomic actions
  Audit: unaudited
- [ ] `motif.code.authority` Retain which request or owner is allowed to update current state.
  Example: A late result can exist without authority to become visible
  Audit: unaudited
- [ ] `motif.code.types` Expose alternatives and the evidence that selects one valid state.
  Example: A checked condition narrows possibilities rather than changing past data
  Audit: unaudited
