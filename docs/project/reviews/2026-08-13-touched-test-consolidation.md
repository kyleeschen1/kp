# Touched-area test consolidation

Status: complete

The pre-expansion health pass removed only evidence that another test or a
deleted compatibility path made provably redundant:

- The 200-line legacy equation presentation decoder suite was deleted with its
  unreachable 466-line production decoder. Keeping tests for deleted behavior
  would have preserved a false extension path.
- The promoted-profile fixture no longer separately asserts the absence of one
  legacy metadata key. The catalogue-wide authoring ratchet checks all nine
  retired keys on all 25 concrete equation assets, while the fixture keeps its
  distinct exact-profile and lineage assertions.

The pass deliberately retained separate semantic-profile, architecture,
catalogue preparation, browser geometry, responsive, accessibility, and bundle
checks. Similar nouns do not make those observations interchangeable: they
fail at different boundaries and protect different regressions.
