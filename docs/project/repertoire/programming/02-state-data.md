# Programming

## State, data structures and references

### Semantic moves

- [ ] `code.assignment` Distinguish rebinding a name from mutating an object.
  Example: x=y can share an object; changing x's binding need not change y
  Audit: unaudited
- [ ] `code.alias` Track multiple references to the same mutable object.
  Example: Mutating a list through one alias is visible through another
  Audit: unaudited
- [ ] `code.copy` Distinguish shallow copy from deep copy.
  Example: A copied outer list can still share nested lists
  Audit: unaudited
- [ ] `code.value-semantics` State the language's value/reference behavior before tracing a call.
  Example: Passing an object reference differs from copying the whole object
  Audit: unaudited
- [ ] `code.array-index` Relate an index to the selected element and its bounds.
  Example: An array of length n admits indices 0 through n-1
  Audit: unaudited
- [ ] `code.list-link` Follow a linked structure without implying contiguous storage.
  Example: A next pointer connects nodes regardless of drawing distance
  Audit: unaudited
- [ ] `code.stack-queue` Distinguish last-in-first-out from first-in-first-out access.
  Example: push/pop and enqueue/dequeue preserve different orderings
  Audit: unaudited
- [ ] `code.hash` Explain hashing, collisions and key equality separately.
  Example: Equal hashes do not imply equal keys
  Audit: unaudited
- [ ] `code.tree` Distinguish a tree's structural parent from a runtime call's caller.
  Example: A data edge and a call edge have different meanings
  Audit: unaudited
- [ ] `code.immutable` Explain persistent updates through shared unchanged structure.
  Example: An updated immutable tree can reuse untouched branches
  Audit: unaudited
- [ ] `code.lifetime` Track ownership and lifetime of a resource.
  Example: A reference must not outlive the resource it requires
  Audit: unaudited
- [ ] `code.serialization` Distinguish serialized data from executable/runtime authority.
  Example: A decoded object may still need validation before use
  Audit: unaudited

### Visual motifs

- [ ] `motif.code.alias` Preserve one object identity across several references.
  Example: Mutation changes the object once, not separate apparent copies
  Audit: unaudited
- [ ] `motif.code.structure` Retain stable node identities during structural edits.
  Example: Moving a node in a diagram does not allocate a new object
  Audit: unaudited
- [ ] `motif.code.lifecycle` Expose creation, transfer and disposal as distinct events.
  Example: A visually hidden resource can still be alive
  Audit: unaudited
