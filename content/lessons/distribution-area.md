# See distribution become area

The same multiplication can be read as symbols or as the dimensions of one rectangle.

Follow the shared [three](kp:focus/factor.3 "The factor 3 is also the rectangle's height") as it reaches both terms. Hover the linked quantities to find them in the equation and the diagram.

```kp-animation-story
{
  "id": "story.distribution-area",
  "asset": { "id": "exemplar.distribution-area.3-times-x-plus-2", "version": "1" },
  "presentation": "scroll-scrub",
  "beats": [
    {
      "id": "beat.factored",
      "title": "Read one rectangle",
      "content": "A height of three multiplies the whole width x plus two.",
      "progressPermille": 0,
      "checkpointId": "factored",
      "focusRefs": ["factor.3", "term.x", "term.2"]
    },
    {
      "id": "beat.distribute",
      "title": "Let three reach both terms",
      "content": "The shared three fans out as the rectangle divides into widths x and two.",
      "progressPermille": 720,
      "checkpointId": "distributed",
      "focusRefs": ["factor.3", "term.x", "term.2", "product.3x"]
    },
    {
      "id": "beat.expanded",
      "title": "Read the two areas",
      "content": "The regions have areas three x and six, so the same rectangle is three x plus six.",
      "progressPermille": 1000,
      "checkpointId": "expanded",
      "focusRefs": ["product.3x", "product.6"]
    }
  ]
}
```

The transcript remains ordinary searchable text. Move forward to distribute, or reverse the same motion to factor.
