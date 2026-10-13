# Author a complete equation-rail passage

Status: bounded selected-source candidate; human authoring review pending.
Start with `llm-generation-entrypoint.md`. The existing rail treatment is reused;
this does not authorize arbitrary mathematics or a new presentation family.

## Write, check, select, read

Start from `examples/physics/energy-as-a-function.article.md`. It contains an
ordinary Article, prose, pinned momentum concepts, and two derivation includes.
Keep a new explanation in its own versioned file and give it its own Article id.

```sh
npm run author:rail -- --example
npm run author:rail -- --source examples/physics/energy-as-a-function.article.md
npm run author:rail -- --source examples/physics/energy-as-a-function.article.md --apply
```

Checking alone does not select a source. `--apply` stores the exact checked source
bytes in ignored `.kp/authoring/rail-selection.json`; reload
<http://localhost:8000/experiments/authored-rails/> to read them. Subsequent file
edits are drafts until explicitly applied. A failed check exits 2 and leaves the
last valid selection unchanged. The report names the source revision and rails;
the page's final disclosure reports that same source revision. No HTTP writing,
arbitrary source execution, or external publication is involved.

The initial page is a complete reading without JavaScript. JavaScript enhances
the same native equations with the canonical drag rail, reverse travel, keyboard
navigation and smaller-step inspection. The new host uses the existing mechanics
runtime, shared typography and checked plans without a new clock or renderer.

## Source-owned choices

Authors can change the Article id, title, introductory/concluding prose, headings,
ordinary passages and links. They can include one or both supported derivations
and place prose before and after each. This is structural/editorial authorship,
not arbitrary proof order or formula generation. Changing prose does not change
mathematical assumptions, notation, per-step reasons or motion.

Inside a `#energy-from-momentum` passage, put this on its own line:

```text
{{kp-derivation:physics.energy-from-momentum@1}}
```

Inside a `#force-to-energy` passage, use:

```text
{{kp-derivation:physics.force-to-energy@1}}
```

These are build-time references to existing checked derivations, not mathematical
macros inferred from prose. The compiler obtains equations from the domain plans
and passes the expanded Article through the existing publication check. Do not
copy equation chains into these passages, use a reference twice, or put one in a
code fence or another passage. Unknown/version-mismatched references return a
located repair; there is no generic fade or unchecked equation fallback.

Retain the `#momentum-definition` passage with the three pinned definition,
velocity and division concept includes from the example. That supplies the
existing rail's recall destination. It is a current domain-bound limitation,
not a requirement for every future KP explanation. The physics assumptions are
fixed positive mass, Newtonian mechanics and Euclidean vectors. Free prose is
editorial, not a checked proof; misleading prose is still possible and needs review.

## Preview and build boundaries

Dev preview uses the selected bytes, or the checked-in example when no selection
exists. Invalid or tampered stored selections produce an explicit error rather
than silently showing a different explanation. Build output always uses the
versioned example so local selection cannot alter an unrelated production build.
Selected-source immutable export and an in-browser editor are not implemented.
No new mathematical operation, changed constants, alternate variable names, or
arbitrary rail composition is supported by this first boundary.

## Verification

`npm run test:rail-authoring` covers source binding, inclusion/omission, repairs,
selection isolation and the original mechanics invariants. `npm run
visual:rail-authoring` exercises selected revisions, invalid-draft preservation,
drag/reverse, exact refinement return, static reading, shared typography and a
phone smoke. These checks do not establish pedagogical effectiveness or certify
all devices. The bounded trial is an authoring precursor to the top-text card and
connected publication packages, not the project's next mathematical frontier.
