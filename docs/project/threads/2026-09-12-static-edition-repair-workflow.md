# Repair shared static styling without changing published history

All three supported builders (Bayes, common factor, composed algebra) declare
only their authored-card and family entry styles. `collectFocusCardEditionStyles`
in `scripts/local-stylesheet-closure.ts` owns the shared package alias and follows
local imports and URL assets. The existing immutable writer owns edition bytes;
domain compilers still own mathematical and editorial content.

After editing a shared source style, run the appropriate existing command with
the original authored source:

```sh
npm run author:bayesian-publication -- --source path/to/bayes.json
npm run author:common-factor-publication -- --source path/to/factor.json
npm run author:composed-algebra-publication -- --source path/to/composed.json
```

The selected builder creates a new content-addressed edition if delivered bytes
changed. Unchanged semantics may keep their semantic revision while the edition
address changes. Existing editions are never overwritten. Update a mutable
publication pointer explicitly if appropriate; do not pretend an old immutable
URL now contains repaired CSS. There is no automatic remote republishing here.

Supported dependency syntax: local CSS imports (quoted or url form, with retained
conditions) and local declaration url assets; explicit KaTeX package alias;
inline data/fragment references need no file. Remote/root-absolute/escaped paths,
missing resources, import cycles, symlinks and output collisions fail. This is a
bounded packaging contract, not a general CSS bundler or arbitrary asset compiler.
New resource-bearing syntax requires an explicit supported parser path and test.

Verification: `npm run visual:edition-closure` builds unique temporary fixtures,
serves only edition bytes through browser interception, opens disclosure content,
and checks native math, fonts and typography at narrow/wide widths. No extra
server is needed. Its generated fixtures are deleted afterward. Unit coverage
in `tests/local-stylesheet-closure.test.ts` includes transitive style regeneration
under the same semantic revision and the missing dependency/cycle/path failures.
The three existing publication suites preserve source reproducibility and reject
altered immutable editions.

The acceptance scope does not claim every CSS grammar form, offline service-worker
behavior, or global static publication migration. These three independent copy
lists are retired; other publication families remain outside this repair.
