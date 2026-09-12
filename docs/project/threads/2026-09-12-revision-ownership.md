# Preview, explanation and immutable edition ownership

The existing compilers and edition writer remain authoritative. This change
does not introduce a universal revision system, migrate historical links, or
change existing manifest bytes, directory hashes, mathematical claims or clocks.

| Identity / state | Owner | Meaning |
| --- | --- | --- |
| Editable preview text | Existing authoring host | Untrusted draft; invalid Apply preserves the last checked lesson |
| Source-byte hash | Publication artifact source.sha256 / builder sourceRevision | Exact selected input bytes, including formatting |
| Explanation revision | Domain checked draft/lesson | Domain-defined checked content and explanation; not a CSS or browser bundle hash |
| Mathematical proof/evidence revision | Existing domain authority | The checked domain facts/proof, not an endorsement of all editorial prose |
| Byte-edition ID | Immutable local edition writer | Hash of the canonical manifest containing explanation revision and every packaged file hash |

The three affected builders now return directory, explanationRevisionId and a
branded byteEditionId from one shared writer receipt. Existing revisionId remains
the explanation-revision compatibility alias; sourceRevision still means exact
input bytes. The old path-returning writer delegates to the same implementation.
Bayes also stops duplicating the SHA-256 byte-digest implementation.

The byte identity's private TypeScript brand prevents an ordinary source hash
from being passed as an issued byte identity in typed code. Runtime issuance
still computes it from the real bounded file manifest; a brand is not a proof
of domain truth, and JSON does not retain compile-time brands.

## Change matrix and evidence

- Source formatting only: the common-factor test proves the explanation revision
  stays equal, while source bytes and byte edition differ.
- Editorial change: existing Bayes and common-factor tests prove explanation and
  edition change; Bayes probability evidence remains equal.
- Mathematical source change: existing gradient source-only variant and Apply
  tests produce the checked new lesson. Old source-pinned returns are rejected.
- Shared style change: the transitive closure test proves explanation stays
  equal, a new byte edition is issued, and old CSS bytes remain untouched.
- Altered published file: existing edition checks reject stale/altered files;
  they never overwrite them to make verification pass.
- Detached reading return: existing gradient interval/revision checks reject
  stale, forged and nonfinite returns rather than reinterpret a bookmark.

The checked gradient revision currently hashes normalized source, beat
descriptions and readings. It is not a snapshot of the native renderer, camera
implementation, fonts or compiled JavaScript. Its exact return means the same
checked semantic interval and fractional position, not identical historical
pixels after a renderer repair. A publication that promises historical pixels
must retain its byte edition. No new runtime-version fingerprint is invented here.

## Retroactive repairs

Live supported cards consume their shared form immediately. Newly built static
editions consume the same shared dependency closure automatically. Already
distributed immutable editions keep their bytes; repairing them means rebuilding
from their selected source and explicitly publishing/linking the new edition.
See 2026-09-12-static-edition-repair-workflow.md. No automatic mass rewrite or
redirect of existing reader links is authorized.

Verification: 25 publication/closure/gradient authoring-and-return unit checks;
six packaged static browser cases; built gradient Apply/WebGL/exact-return
check; full TypeScript including the negative byte-identity fixture.
