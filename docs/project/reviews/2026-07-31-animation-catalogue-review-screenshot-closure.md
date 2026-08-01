# Animation Catalogue Review Screenshot Closure

Date: 2026-07-31
Status: verified evidence boundary for catalogue simplification slice s29

## Outcome

The lower-left catalogue review composer now attaches one bounded JPEG of the
selected stage to the same immutable review capture that records the artifact,
playhead, parameter and tuning values, viewport, render ownership, build, and
motion preferences. The screenshot does not create a second note, history, or
index entry.

Default review queries remain compact. A bitmap is included only when the full
capture is explicitly requested, and the development review routes continue to
be erased from production builds.

## Capture Boundary

The browser first freezes the typed semantic capture. A development-only
loopback service then replays that exact artifact and state in Playwright and
captures only the persistent centre-stage region. This server replay is
deliberate: serializing the arbitrary live DOM through SVG `foreignObject`
taints the page canvas, so an in-page raster cannot be read reliably.

The service enforces these bounds before persisting evidence:

- only `http` routes on `localhost`, `127.0.0.1`, or `::1` may be loaded;
- the replay viewport is at most 1600 by 1200 CSS pixels;
- the attachment is JPEG data, at most 75,000 data-URL characters;
- the selected asset, playhead, and captured tuning must match after replay;
- the response records both output pixel dimensions and the source-stage box;
- screenshot requests cannot contain a prior screenshot.

The loopback restriction is a safety boundary, not an incidental validation:
review evidence contains a user-controlled route and must not turn the local
development server into a general URL fetcher.

## Persistence and Presentation

The attachment lives under `capture.screenshot` in the existing review note.
Append-only projection tests prove one `note-created` event per visible note,
including notes with screenshots. The composer reports `Screenshot attached`
after capture, but keeps the bitmap and capture machinery out of the default
catalogue controls.

## Verification

- `npm run typecheck`
- focused dev-review protocol, schema, client, HTTP, inbox, and screenshot
  boundary tests
- `npm run visual:animation-catalogue`, including a live screenshot response,
  payload bounds, selected-stage scope, and composer lock state
- `npm run check:dev-review-production`

The verification boundary proves evidence integrity and host preservation. It
does not visually approve any animation or change a human disposition from
`Unreviewed`.
