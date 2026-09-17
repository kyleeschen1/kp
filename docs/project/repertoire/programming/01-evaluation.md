# Programming

## Expressions, bindings and execution

### Semantic moves

- [ ] `code.evaluate` Distinguish source syntax from an evaluated value.
  Example: 2+3 is an expression; 5 is its value under integer arithmetic
  Audit: unaudited
- [ ] `code.precedence` Respect grouping and evaluation order.
  Example: f()+g() may have observable order-dependent effects
  Audit: unaudited
- [ ] `code.binding` Resolve a name to its lexical binding.
  Example: Two occurrences of x can refer to different scopes
  Audit: unaudited
- [ ] `code.scope` Distinguish local shadowing from changing an outer binding.
  Example: A function parameter named x need not overwrite an outer x
  Audit: unaudited
- [ ] `code.short-circuit` Explain which operand is skipped by a short-circuit operator.
  Example: false && expensive() need not call expensive
  Audit: unaudited
- [ ] `code.branch` Evaluate a condition and select only its applicable branch.
  Example: if x>0 chooses one successor state
  Audit: unaudited
- [x] `code.call-bind` Bind an argument to a fresh call-local parameter — factorial caller. [Evidence](../../repertoire-notes/programming-audit.md)
  Example: (factorial 3) binds n=3 for that activation
  Audit: implemented
- [x] `code.return` Return a computed value to its waiting continuation — factorial caller. [Evidence](../../repertoire-notes/programming-audit.md)
  Example: A recursive result fills the suspended multiplication operand
  Audit: implemented
- [x] `code.recursion` Trace recursive descent and unwinding — factorial-three caller. [Evidence](../../repertoire-notes/programming-audit.md)
  Example: factorial(3) → 3·factorial(2) → … → 6
  Audit: implemented
- [x] `code.base-case` Show why a recursive base case terminates descent — factorial caller. [Evidence](../../repertoire-notes/programming-audit.md)
  Example: factorial(0)=1 provides the return value
  Audit: implemented
- [ ] `code.recursion-general` Author arbitrary recursive source with semantic motion. [Evidence](../../repertoire-notes/programming-audit.md)
  Example: A tree recursion requires independently justified branch/call identities
  Audit: gap — factorial is a bounded source/trace; arbitrary recursive-source generation is outside its authority
- [ ] `code.exceptions` Distinguish ordinary return from exceptional unwinding.
  Example: A thrown exception can skip normal continuation steps
  Audit: unaudited

### Visual motifs

- [x] `motif.code.call` Retain pending context while a recursive call is evaluated — Scheme caller. [Evidence](../../repertoire-notes/programming-audit.md)
  Example: Suspended multiplication waits for the returning value
  Audit: implemented
- [x] `motif.code.binding` Separate source occurrences, bindings and value identity — Scheme caller. [Evidence](../../repertoire-notes/programming-audit.md)
  Example: Repeated n glyphs do not imply one runtime slot
  Audit: implemented
- [ ] `motif.code.branch` Withdraw the unchosen execution branch while retaining readable source.
  Example: Not executed differs from false or nonexistent
  Audit: unaudited
