# Code-renderer HTML output context audit

The four rendering modules that import `src/editor/html-output-encoding.ts` use
the same two parser contexts as the existing editor consumer:

- HTML text nodes for source lexemes, native code, narration, and accessible
  descriptions;
- double-quoted HTML attributes for semantic IDs, selectors, projection IDs,
  transition IDs, and accessible labels.

None of the shared encoder calls enter a URL, JavaScript, CSS, comment, raw
script, raw style, or single-quoted attribute context. The renderers do contain
other raw interpolations, but those are closed enum values, booleans, or
normalized numbers rather than values delegated to the shared encoder.

The current algorithms are therefore equivalent for this cohort:

- text escapes `&`, `<`, and `>` in that order;
- double-quoted attributes apply text escaping and then escape `"`;
- quotes remain unchanged in text nodes and apostrophes remain unchanged in
  both contexts.

Safe migration boundary: introduce a renderer-neutral utility with those exact
two named contexts, retain the editor path temporarily as an identity facade,
then migrate all four renderers directly. Preserve byte-for-byte output and add
adversarial text/attribute fixtures before retiring the dependency exceptions.
