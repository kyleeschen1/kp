# Graph Morph And XY View Verification

Date: 2026-07-08

## Browser Check

- URL: `http://127.0.0.1:3005/`
- Browser: Playwright cached ARM64 Chrome-for-Testing via CDP on `127.0.0.1:9225`
- Viewport: `1280x900`
- Screenshots: cropped to the WebGL graph canvas and written under `/private/tmp`

## Results

| State | Surface | View | Transition | Screenshot | Non-background pixels |
| --- | --- | --- | --- | --- | --- |
| default | `mesh` | `3d` | `static` | `/private/tmp/kp-morph-default.png` | `74893` |
| donut mid-morph | `donut` | `3d` | `running` | `/private/tmp/kp-morph-donut-mid.png` | `23042` |
| donut endpoint | `donut` | `3d` | `complete` | `/private/tmp/kp-morph-donut-end.png` | `27593` |
| XY endpoint | `donut` | `xy` | `complete` | `/private/tmp/kp-morph-xy-end.png` | `35888` |

The mid-morph screenshot shows an intermediate surface between the saddle mesh and donut. The XY endpoint hides the z-axis and flattens/rotates the graph to a front-facing 2D view.
