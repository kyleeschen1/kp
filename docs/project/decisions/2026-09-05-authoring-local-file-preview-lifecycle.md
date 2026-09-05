# Decision: local-file authoring preview lifecycle

Date: 2026-09-05
Status: accepted by explicit user approval

## Decision and reason

Resume s21 of `run-contract.kp.authoring-integration-market-preview-v1` using
trusted local-file typed authoring through existing development build tooling.
The existing Article stores own other Markdown lessons, not this model/template.

## Consequences

Keep author files authoritative. Build a revision-tagged preview, retain edited
source and last valid preview on failure, and reject stale asynchronous results.
Test actual rebuilds, not only mocks. No arbitrary browser evaluation, HTTP write
endpoint, generic file writer, or replacement Article editor is authorized.

## Alternatives and follow-up

Saving generated Article creates competing authority; reusing another lesson's
endpoint writes the wrong source. In-app typed-source saving remains deferred.
Resume unchanged s22–s28 afterward and retain the final human checkpoint.

The sole plan is
`../reviews/2026-09-05-authoring-integration-market-preview-long-loop-proposal.md`.
Accepted boundaries and historical evidence are in
`../reviews/2026-09-05-authoring-integration-save-boundary-stop.md`.
