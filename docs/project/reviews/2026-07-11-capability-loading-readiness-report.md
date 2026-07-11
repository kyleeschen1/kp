# Report Card: Capability Loading Readiness

Date: 2026-07-11
Status: active
Grade: B+
Scope: registry-backed SemanticObject capability packages for tutorial cards,
export artifacts, dashboards, and future generated tutorials.

This is not a Theseus-generated report card. It is an engineering assessment
based on local source, tests, docs, and the current capability-loading commits.

## Summary

- KP now has a real capability package catalog instead of only
  sample-specific capability advertisements.
- SemanticObject definitions can name package ids, and tutorial dependency
  planning can resolve packages from capability keys.
- Iframe, static-step, and frame-sequence export artifacts now carry package
  closure data that dependency checks can validate.
- The dashboard can search and preview capability package facets, including
  target, load phase, object type, protocol, and source refs.
- The remaining gap is runtime loading: packages are deterministic metadata
  contracts today, not separately shipped modules.

## Evidence

| Area | Evidence |
| --- | --- |
| Manifest catalog | `src/semantic/capability-package-manifest.ts`, `tests/semantic-capability-package-manifest.test.ts` |
| Registry mapping | `src/semantic/object-registry.ts`, `tests/semantic-object-registry.test.ts` |
| Tutorial planning | `src/tutorial/dependency-planner.ts`, `tests/tutorial-card-dependency-planner.test.ts` |
| Export closure | `src/tutorial/capability-package-closure.ts`, `src/tutorial/export-dependency-closure.ts`, `tests/tutorial-card-export-dependency-closure.test.ts` |
| Dashboard surface | `src/project-dashboard/capability-package-facets.ts`, `tests/project-dashboard.test.ts`, `tests/project-dashboard-theseus-adapter.test.ts` |
| Provenance | `docs/theseus/nodes/run-contracts/run-contract.kp.semantic-capability-loading-v0.json` |

## Assessment

| Category | Grade | Confidence | Main Risk | Next Action |
| --- | --- | --- | --- | --- |
| Package manifest shape | A- | High | Catalog is hand-authored and small. | Keep source refs mandatory for new packages. |
| SemanticObject integration | B+ | High | Package coverage is strongest for current core objects. | Extend coverage through generated tutorial families. |
| Export dependency closure | A- | High | Closure validates metadata, not external loading. | Preserve closure checks when loader work starts. |
| Dashboard authoring surface | B+ | High | Search/preview is useful but still source-edited. | Keep package facets searchable from project dashboard rows. |
| Runtime loading | C | Medium | Dynamic loading is intentionally deferred. | Define loader boundary only after metadata contracts stabilize. |

## Recommendation

Treat capability packages as the next stable dependency layer, not as a dynamic
loader yet. The metadata contract is useful now because generated tutorials,
export artifacts, and dashboard rows can all talk about the same packages. The
loader should wait until this package catalog survives the roadmap/thread
refresh and at least one generated tutorial family.

Recommended next actions:

1. Refresh `docs/project/roadmap.md` and
   `docs/project/threads/semantic-runtime.md` around capability packages.
2. Keep adding package manifests when SemanticObjects gain new render,
   transform, execute, select, or export capabilities.
3. Make source refs and verification evidence required for new package rows.
4. Defer dynamic package loading until the package metadata model is stable
   across math, graph, programming, and export examples.
