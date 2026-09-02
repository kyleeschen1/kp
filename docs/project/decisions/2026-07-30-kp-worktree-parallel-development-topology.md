# Decision 2026-07-30: Worktree-Based Parallel Development Topology

Date: 2026-07-30  
Status: accepted deferred implementation guidance

## Decision

KP will use Git worktrees as its preferred local topology for concurrent
animation, publication-boundary, and SvelteKit site development. Worktrees
isolate branches and development processes; they do not replace the
framework-neutral contracts that reconnect those branches.

The intended combination is:

```text
one Git repository
+ npm workspace boundaries
+ one worktree per active development lane
+ immutable publication bundles between animation producers and site consumers
+ one integration worktree that promotes accepted changes
```

Implementation is deferred until the active animation loop reaches a clean
checkpoint. This decision does not authorize a repository move, package split,
server rewrite, or interruption of the current Theseus contract.

## Reason

KP needs to develop two fast-moving products at once:

- the semantic animation system, including semantic models, runtime,
  renderers, exemplars, and visual review;
- the public SvelteKit product, including routes, prose, navigation, SSR,
  search, progressive activation, and site-level presentation.

Running both streams in one checkout would require frequent stashing, make
concurrent Codex sessions unsafe, mix build and review artifacts, and encourage
the site to import unstable animation internals. Separate repositories would
create premature release and synchronization overhead while the public
boundaries are still being discovered.

Git worktrees provide separate files, indexes, branches, dependencies, build
outputs, and servers while sharing one repository history and object database.
They are therefore a good development topology for the existing preliminary
publication architecture.

## Intended Worktree Layout

The initial topology should remain small:

```text
Code/
|- kp/                          # main integration and accepted-state worktree
`- .worktrees/
   |- kp-animation/             # semantic/runtime/renderer/exemplar lane
   |- kp-site/                  # SvelteKit host and content lane
   `- kp-publication/           # temporary contracts/bundle/embed lane
```

Each active Codex session receives its own worktree. Two sessions must not edit
the same checkout concurrently.

The publication worktree is intentionally temporary. Once the bundle,
custom-element, and package entrypoints stabilize, changes to that boundary
should become small short-lived branches rather than a permanently separate
lane.

Do not create a worktree per package. Worktrees represent independently moving
development streams, while npm workspaces represent code and release
boundaries.

## Ownership Model

| Worktree | Primary ownership | Must avoid |
| --- | --- | --- |
| Integration | accepted contracts, merges, release gates, promoted asset locks | exploratory feature work |
| Animation | semantic objects, runtime, renderers, animation exemplars, visual evidence | SvelteKit application concerns |
| Site | SvelteKit routes, prose, SSR, search, navigation, activation policy | private animation and editor imports |
| Publication | public contracts, bundle envelope, custom elements, package conformance | broad animation or site implementation |

Root dependency and lockfile changes need one temporary owner during the first
workspace extraction. Active Theseus run contracts likewise have one owner;
parallel lanes must not create competing execution state for the same run.

## Animation-To-Site Integration Modes

The site should support three explicitly different modes.

### Pinned mode

Normal site development and all production builds consume exact immutable
bundle revisions through a committed asset lock:

```text
algebra.solve-x / sha256-abc123
```

The site remains buildable when the animation worktree is absent, broken, or
mid-experiment. It never resolves a production figure through `latest`.

### Candidate mode

At a reconciliation checkpoint, the animation lane emits a content-addressed
candidate bundle. The site pins that fingerprint and runs the plain-HTML,
SvelteKit, accessibility, URL-state, dependency, and performance conformance
checks. Promotion advances the asset lock only after those checks pass.

### Live mode

For collaborative experimentation, the animation lane may run a local asset or
preview server. SvelteKit proxies a same-origin development route to it:

```text
/kp-dev-assets/* -> local animation asset server
```

Live mode is convenience, not an artifact contract. It must be visibly marked
as development state and must expose the branch, commit, dirty state, and
bundle fingerprint being viewed.

The site must not import source files from a sibling worktree, use hard-coded
absolute sibling paths, symlink sibling source trees, or broaden Vite filesystem
access to make private cross-worktree imports convenient.

## Shared Servers And State

Servers are shareable only when they expose a stable protocol rather than a
particular checkout's implementation state.

| Resource | Default | Reason |
| --- | --- | --- |
| Immutable asset server | shared | natural content-addressed integration boundary |
| Stable provider/API server | shared when protocol-compatible | prevents duplicate infrastructure |
| Vite or SvelteKit HMR server | isolated | watches one worktree and branch |
| Browser-test preview | isolated or ephemeral | prevents cross-run contamination |
| Review inbox | isolated unless deliberately namespaced | preserves branch/build provenance |
| Database | shared only with branch/session namespaces | avoids incompatible state collisions |
| `node_modules` and build cache | isolated | avoids watcher, resolver, and native-dependency corruption |
| npm download cache | shared | safe reusable package cache |

The initial local port convention is:

```text
animation:    8000 web, 8001 API
site:         8100 SvelteKit
publication:  8200 fixture or asset server
integration:  8300 combined preview
```

If more than one worktree needs the same server family, KP should parameterize
its development launcher with an explicit lane or port block. Port selection
must not rely on silently choosing the next available port because visual
tests and review links need deterministic identities.

## Reconciliation Cadence

Reconciliation has four separate meanings and cadences:

| Boundary | Cadence |
| --- | --- |
| Git history from `main` | start or end of a working day and before shared changes |
| Public contracts and package entrypoints | within hours; avoid divergence beyond one day |
| Candidate animation bundles | at independently reviewable exemplar checkpoints |
| Production asset lock | intentionally, after conformance and promotion |

Each lane should make small, green, reversible commits. The safe order for a
cross-lane contract change is:

1. merge an additive contract or public entrypoint;
2. update the producer while preserving the old form;
3. update all consumers;
4. run the combined integration gates;
5. remove the compatibility form only after every consumer has moved.

Short private branches may rebase. Long-running Codex or shared branches should
normally merge accepted `main` rather than rewrite history underneath another
session. A shared foundational change should be merged once and consumed from
that history rather than copied into multiple branches with duplicate
cherry-picks.

Daily integration is sufficient when lanes touch different joints. If two
lanes need to change the same contract or lockfile, they should reconcile
immediately or assign one owner rather than develop competing versions.

## Promotion And Verification

The worktree topology is successful only if the integration boundaries remain
testable:

- the SvelteKit site builds from a clean checkout without an animation dev
  server;
- a plain-HTML host and SvelteKit consume the same immutable bundle;
- the site imports only declared public contracts and element entrypoints;
- a candidate bundle reports its source revision, compiler/runtime
  compatibility, dependency closure, and integrity;
- no-JavaScript, print, search, reduced-motion, and accessibility projections
  remain useful;
- heavy renderers load only for figures that require them;
- cross-worktree previews display branch and bundle identity;
- generated artifacts contain no absolute worktree paths;
- the combined integration worktree runs the relevant package, browser, and
  production gates before promotion.

## Consequences

### Benefits

- animation experiments cannot silently destabilize site development;
- concurrent Codex sessions have unambiguous branch and filesystem ownership;
- developers can change domains without stashing;
- build output, scratch work, visual captures, and ignored state remain local
  to a lane;
- the site can advance against frozen fixtures before the animation library or
  package extraction is complete;
- cross-lane failures reveal real contract problems rather than encouraging
  private imports;
- abandoning an experiment removes one worktree and branch without disturbing
  accepted state;
- Git commits remain storage-efficient because object history is shared.

### Costs And Risks

- each worktree requires its own dependencies and build cache;
- root lockfile and workspace-topology changes can conflict;
- ports and shared services require explicit allocation;
- worktrees do not prevent merge conflicts when lanes edit the same source;
- long-lived branches can drift despite filesystem isolation;
- generated files can leak absolute checkout paths;
- shared review logs, databases, or provider processes can mix incompatible
  branch state;
- project-memory and Theseus records can diverge if ownership is not explicit;
- stale worktrees and branches require periodic audit and pruning.

## Alternatives Considered

### One checkout with multiple sessions

Rejected for concurrent development. It provides no filesystem, index,
scratch-output, or server ownership boundary and makes partial edits from
different sessions indistinguishable.

### Separate animation and site repositories

Deferred. Separate repositories may become appropriate after contracts have
stable independent releases and external consumers. Adopting them now would
add versioning, publishing, and coordination overhead before those boundaries
are proven.

### One long-lived branch per package

Rejected. Package boundaries and workstream boundaries are different. This
would multiply integration branches and encourage delayed reconciliation.

### Direct sibling-worktree source imports

Rejected. They make the site dependent on local directory topology, bypass
package exports and immutable artifacts, complicate Vite serving, and cannot
represent production deployment.

### One shared mutable draft directory

Rejected as the default contract. It is acceptable as an explicitly labeled
live-preview cache, but pinned and candidate integration must use immutable,
identified bundles.

## Follow-Ups

After the active animation loop closes:

1. audit and prune stale worktree registrations;
2. reserve the integration checkout and create the site and animation
   worktrees;
3. add deterministic lane-aware development ports;
4. establish the SvelteKit workspace without moving the current animation app;
5. freeze one immutable `x + 3 = 7` publication-bundle fixture;
6. prove plain-HTML and SvelteKit consumption from clean checkouts;
7. add candidate and production asset locks;
8. add a live asset-server proxy only after pinned integration works;
9. enforce import-direction and absolute-path checks;
10. remove the temporary publication worktree after its contracts have at
    least two independent consumers.

The corresponding publication architecture remains
`docs/project/decisions/2026-07-24-kp-portable-artifact-and-host-joints.md`.
This record refines its local development and integration topology without
changing its artifact model or the active animation-promotion order.
