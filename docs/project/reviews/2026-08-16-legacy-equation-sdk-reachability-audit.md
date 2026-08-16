# Legacy equation SDK reachability audit

Status: retirement authorized in core-ownership-convergence slice 21.

The two legacy files are `src/public/equation-animation-manifest.ts` and
`src/public/kp-animation-sdk.ts`. They are not package exports: the repository
package is private and declares no `exports` map. No production module imports
the SDK facade, and the manifest's only production importer is that facade.
There are no script importers.

The only executable consumers are the two dedicated compatibility tests. The
remaining references are historical documentation, dashboard metadata, and
architecture inventories that describe this compatibility surface. Those
references do not execute it and should be corrected after retirement.

The current neutral replacements are the animation kernel, lazy catalogue
loader, and the narrow authoring APIs. The six-entry manifest is a parallel
legacy identity set rather than the current semantic animation catalogue, so
retaining it would preserve a second source of animation membership without a
supported consumer.

Retirement is therefore safe inside the supported repository boundary. If an
unknown consumer imports a raw source path from this private package, that use
was never a published contract and is outside the supported surface.
