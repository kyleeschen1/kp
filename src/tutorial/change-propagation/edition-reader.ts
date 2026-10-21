import { compileChangeSource } from "./model.ts";
import { mountChange, required } from "./surface.ts";

// Editions bind their embedded source. They share playback with the editor but
// have no draft controls, authoring renderer or source-application capability.
const encoded: unknown = JSON.parse(required("#change-source-bytes").textContent ?? "null");
if (typeof encoded !== "string") throw new Error("Missing edition source.");
const checked = compileChangeSource(encoded);
if (checked.status !== "checked") throw new Error(`${checked.path}: ${checked.message}`);
const surface = mountChange(required(".change-card"), checked.model, { restore: true, mode: "edition" });
window.addEventListener("pagehide", event => { if (!event.persisted) surface.dispose(); });
if (import.meta.hot) import.meta.hot.dispose(() => surface.dispose());
