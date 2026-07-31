import "katex/dist/katex.min.css";
import "../../src/styles.css";

// Browser evidence needs a stable surface without the application shell or
// Review widget mutating the containing grid after compositor measurement.
document.documentElement.dataset["kpPlaceValueBrowserHostReady"] = "true";
