# System application typography

Date: 2026-08-20
Status: accepted

## Decision

Use the native proportional system sans stack for Internal Studio, Animation
Catalogue, and default application chrome:

```css
ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Do not hardcode Gill Sans or another platform-resolved face. Remove the custom
New Computer Modern Mono `@font-face` declarations and catalogue font-readiness
wait so application chrome has no downloadable-font transfer or settlement
dependency.

## Boundary

This decision does not replace KaTeX fonts, the economics lesson's approved
Source Serif prose, or system-monospace code typography. It changes application
chrome only and does not authorize layout, color, weight, or animation changes.

The retained font files are unreferenced rollback material and therefore do
not enter Vite's production closure. Their eventual deletion is a separate
reachability-based cleanup decision.
